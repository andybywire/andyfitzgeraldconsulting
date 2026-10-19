/**
 * The headless harness: how every annotation, trial rerun and experiment run is launched.
 *
 *   node docs/project-graph/harness/harness.mjs dry-run <branch>    create and remove a worktree,
 *                                                                   print the exact launch, run nothing
 *
 * canary.mjs uses `runOne()` to prove the harness isolates a run; stage 5's schedule runner will
 * use it for the real runs. The design, and why, is docs/project-graph/protocol.md → "The headless
 * harness". This file lives in docs/project-graph/, never in project-graph/, because nothing in
 * this folder may reach an arm.
 *
 * ── WHAT ONE RUN IS ──────────────────────────────────────────────────────────
 *
 *   1. A fresh worktree of the branch, detached, under RUNS_ROOT, outside this checkout.
 *   2. Snapshots of this checkout's auto-memory folder and the desktop app's side-session notes
 *      folder, to compare afterward: a run that changes either is not isolated.
 *   3. The CLI at CLAUDE_BIN, `-p` in that worktree, with auto-memory and auto-update switched
 *      off, no MCP servers, and `dontAsk`, so any tool not listed is refused instead of prompted
 *      for. Its real path and `--version` go in the record first.
 *   4. The JSON result kept as it came, and the session's transcript found by its session id and
 *      copied beside it.
 *   5. Two checks. Did the run complete (`completionProblems`), and was it isolated
 *      (`isolationProblems`)? `record.valid` needs both. An invalid run means the caller must stop
 *      the schedule.
 *   6. The worktree removed, whatever happened.
 *
 * ── THE CLI, AND WHY BY PATH ─────────────────────────────────────────────────
 *
 * The desktop app runs its own copy of Claude Code, so a run uses the standalone CLI, which needs
 * its own login (`claude auth login`) and must be new enough for the model. The canary's first
 * two attempts failed on exactly those two things. Three choices follow from that:
 *
 *   - It is launched by absolute path, ~/.local/bin/claude, the native install that `claude update`
 *     maintains, or PROJECT_GRAPH_CLAUDE. By name, a login shell here found a leftover npm install
 *     first, version 2.1.63.
 *   - DISABLE_AUTOUPDATER=1, which the CLI reads, so a run never updates it. Andy's own use still
 *     can, which is why every record carries the version, for the schedule runner to compare.
 *   - A run that exits nonzero, returns no JSON, or returns `is_error` is not valid. Both failed
 *     attempts were marked isolated, because a session that never reaches the model has nothing in
 *     its transcript to leak. Isolation says nothing about whether a run happened.
 *
 * ── THE BLOCKED COMMANDS ─────────────────────────────────────────────────────
 *
 * An allowed list does not confine a run's shell. Claude Code lets a command it judges read-only
 * through without asking: the guide trial's rerun ran `cat`, `ls`, `wc`, `sed -n`, `git status` and
 * `pnpm exec prettier --check`, which installed node_modules, under a list naming none of them. A
 * deny rule is checked first, so BLOCKED_COMMANDS goes on every launch. Proven 2026-10-18 by a probe
 * run (runs/probe-2026-10-19T00-29-07-149Z/): all six attempts were refused, `git log`, `git status`,
 * `pnpm`, `npm`, `npx` and `ls && git status`, so a chain is refused if any part of it is.
 *
 * NOT CLOSED BY THIS: reading outside the worktree. The same probe read a file outside it with both
 * `cat` and the Read tool, and `cat .git` names the main checkout, where docs/project-graph/ sits.
 * protocol.md → "The canary's result" has what is proposed.
 *
 * Claude Code also keeps its own copy of each run's transcript, in a folder per run under
 * ~/.claude/projects/. They are left there, because removing them would be more machinery than
 * ~500 KB a run is worth. Each record names its copy in `sourceTranscript`.
 *
 * ── THE ENVIRONMENT, AND WHY IT IS SCRUBBED ──────────────────────────────────
 *
 * A run is often launched from inside another Claude Code session, and the desktop app sets about
 * thirty variables beginning CLAUDE: CLAUDECODE, the CLAUDE_CODE_* family, and others outside it,
 * such as CLAUDE_EFFORT, CLAUDE_PID and CLAUDE_AGENT_SDK_VERSION. Inherited, they could change how
 * the child behaves, so EVERY variable beginning CLAUDE is removed, and then
 * CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 is set: documented as "does not create or load auto memory
 * files". The canary's control launches without it, to prove the check sees the difference.
 *
 * The first scrub removed only CLAUDECODE and CLAUDE_CODE_*, and let CLAUDE_EFFORT through (found
 * 2026-10-18, before anything launched). That one matters. The launch passes --effort, and which
 * of the two wins was never tested, so a run started from inside the app might have taken the
 * app's effort rather than its own: a mismatch across arms that no result would show. Removing the
 * variable makes the question moot instead of answering it. The prefix is broad on purpose:
 *
 *   - a variable a later Claude Code adds is covered without anyone having to notice it;
 *   - CLAUDE_CONFIG_DIR goes too, which is right, because MEMORY_DIR assumes the default ~/.claude;
 *   - ANTHROPIC_* is left alone. It can carry the credentials and API host that a launch from a
 *     plain terminal relies on, and in the app it points at the real API.
 *
 * Proven by failing first: the test that plants CLAUDE_EFFORT failed against the old filter.
 *
 * Proven end to end by the canary on 2026-10-18, after being built and verified without
 * launching anything the same day (see harness.test.mjs). protocol.md → "The canary's result"
 * records the run, and four things it found for this file to fix before any real run.
 */
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import {homedir} from 'node:os'
import {join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

export const REPO = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
export const RUNS_ROOT =
  process.env.PROJECT_GRAPH_RUNS ??
  join(process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'project-graph', 'runs')
/** The CLI every run launches, by absolute path. See "THE CLI, AND WHY BY PATH" above. */
export const CLAUDE_BIN =
  process.env.PROJECT_GRAPH_CLAUDE ?? join(homedir(), '.local', 'bin', 'claude')
const PROJECTS = join(homedir(), '.claude', 'projects')
// Claude Code keys a project's folder by its path, with every non-alphanumeric character as "-".
export const MEMORY_DIR = join(PROJECTS, REPO.replace(/[^A-Za-z0-9]/g, '-'), 'memory')
export const NOTES_DIR = join(
  homedir(),
  'Library',
  'Application Support',
  'Claude',
  'side-session-notes',
)

/**
 * Text that must never appear in a run's transcript. Each is the fingerprint of one leak the
 * guide's trial found: auto-memory ("MEMORY.md", "persistent file-based memory", and this
 * experiment's own memory file), the side-session notes folder, and the app's prompt wrapper.
 * A false positive (a run that greps a file mentioning MEMORY.md) invalidates a run; that's the
 * safe direction.
 *
 * The last entry is this checkout's last two path segments ("Repos/af-consulting" here), taken
 * from REPO so a moved checkout keeps it right. A run can read outside its worktree, and `cat .git`
 * names this checkout, where the answer key in docs/project-graph/ sits. Any run that reaches it,
 * by an absolute, `~/` or relative path, carries those segments. It is detected, not prevented:
 * Bash can't be confined by path the way the Read tool can. Measured 2026-10-18: absent from all
 * five clean transcripts so far, both canaries' runs and controls and the trial's rerun, and present
 * four times in the probe's, which read `.git` on purpose.
 */
export const BANNED = [
  'MEMORY.md',
  'persistent file-based memory',
  'project-graph-experiment',
  'side-session-notes',
  'Shared notes folder',
  'Background (from the session that started this one)',
  REPO.split('/').slice(-2).join('/'),
]

/**
 * Commands no run may use, whatever else it is allowed. An allowed list does not stop them on its
 * own: Claude Code lets a command it judges read-only through without asking, and the guide trial's
 * rerun ran `cat`, `git status` and `pnpm exec prettier --check` under a list that named none of
 * them. A deny rule is what stops one (see "THE BLOCKED COMMANDS" in the header).
 *
 *   git          a worktree shares the repository's objects, so `git show <branch>:<path>` reaches
 *                every branch from inside any arm, the answer key in docs/project-graph/ included
 *   pnpm, npm,   an install lands in one run's time and context and not in another's, and
 *   npx          `pnpm exec` installed node_modules in the rerun (protocol precondition 6)
 */
export const BLOCKED_COMMANDS = ['Bash(git *)', 'Bash(pnpm *)', 'Bash(npm *)', 'Bash(npx *)']

/** The exact command, arguments and environment for one launch. Pure, so it can be tested. */
export function buildLaunch({
  prompt,
  model,
  effort,
  budgetUsd,
  allowedTools = [],
  disallowedTools = [],
  permissionMode = 'dontAsk',
  memoryOff = true,
}) {
  for (const [name, value] of Object.entries({prompt, model, effort, budgetUsd})) {
    if (value === undefined || value === '') throw new Error(`buildLaunch needs ${name}.`)
  }
  const args = [
    '-p',
    prompt,
    '--model',
    model,
    '--effort',
    effort,
    '--output-format',
    'json',
    '--max-budget-usd',
    String(budgetUsd),
    '--permission-mode',
    permissionMode,
    '--strict-mcp-config',
  ]
  if (allowedTools.length) args.push('--allowedTools', allowedTools.join(' '))
  args.push('--disallowedTools', [...BLOCKED_COMMANDS, ...disallowedTools].join(' '))

  // Every CLAUDE* variable, not only CLAUDE_CODE_*: see "THE ENVIRONMENT" above.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('CLAUDE')),
  )
  env.DISABLE_AUTOUPDATER = '1'
  if (memoryOff) env.CLAUDE_CODE_DISABLE_AUTO_MEMORY = '1'
  return {command: CLAUDE_BIN, args, env}
}

/** The CLI's version, such as "2.1.302 (Claude Code)". It starts no session, so it costs nothing. */
export function cliVersion(bin = CLAUDE_BIN) {
  const run = spawnSync(bin, ['--version'], {encoding: 'utf8', input: ''})
  if (run.status !== 0) {
    throw new Error(`${bin} --version failed: ${run.stderr || run.error?.message || run.status}`)
  }
  return run.stdout.trim()
}

/**
 * What makes a run incomplete: it didn't finish, exited nonzero, returned no JSON, or returned an
 * error as its result. Returns a list; empty means it completed.
 */
export function completionProblems({exit, error, result}) {
  const problems = []
  if (error) problems.push(`did not finish: ${error}`)
  if (exit !== 0) problems.push(`exited with ${exit}`)
  if (!result) problems.push('no JSON result')
  else if (result.is_error) problems.push(`the result is an error: ${result.result}`)
  return problems
}

/** Every user message's text in a transcript (JSONL), in order. */
export function userTexts(transcript) {
  const texts = []
  for (const line of transcript.split('\n')) {
    if (!line.trim()) continue
    let record
    try {
      record = JSON.parse(line)
    } catch {
      continue
    }
    if (record.type !== 'user') continue
    const content = record.message?.content
    if (typeof content === 'string') texts.push(content)
    else if (Array.isArray(content)) {
      for (const part of content) if (part?.type === 'text') texts.push(part.text)
    }
  }
  return texts
}

/**
 * What makes a transcript not isolated: any banned text anywhere in it, or the prompt not arriving
 * as a user message exactly as sent. Returns a list; empty means isolated.
 */
export function isolationProblems(transcript, prompt) {
  const problems = BANNED.filter((text) => transcript.includes(text)).map(
    (text) => `contains "${text}"`,
  )
  if (!userTexts(transcript).some((text) => text.trim() === prompt.trim())) {
    problems.push('no user message is the prompt exactly as sent')
  }
  return problems
}

/** Every file under `dir` with a hash of its contents, so two snapshots can be compared. */
export function snapshot(dir) {
  const files = {}
  const walk = (path) => {
    if (!existsSync(path)) return
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path)) walk(join(path, name))
    } else {
      files[relative(dir, path)] = createHash('sha256').update(readFileSync(path)).digest('hex')
    }
  }
  walk(dir)
  return files
}

/** What changed between two snapshots: added, removed or modified paths. */
export function changes(before, after) {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)])
  return [...paths].filter((path) => before[path] !== after[path]).sort()
}

const git = (...args) => {
  const run = spawnSync('git', ['-C', REPO, ...args], {encoding: 'utf8'})
  if (run.status !== 0) throw new Error(`git ${args.join(' ')} failed:\n${run.stderr}`)
  return run.stdout.trim()
}

/** The transcript Claude Code saved for `sessionId`, wherever its project folder is. */
export function findTranscript(sessionId) {
  if (!existsSync(PROJECTS)) return null
  for (const project of readdirSync(PROJECTS)) {
    const file = join(PROJECTS, project, `${sessionId}.jsonl`)
    if (existsSync(file)) return file
  }
  return null
}

/**
 * One run. `spec` is the launch (see buildLaunch) plus `id`, `branch` and `outDir`; `timeoutMinutes`
 * defaults to 30. Writes `<outDir>/<id>.json` and `<outDir>/<id>.transcript.jsonl`, and returns the
 * record. `record.valid` false means the run is invalid: it didn't complete, or wasn't isolated.
 *
 * `keepWorktree: true` leaves the worktree in place, named in `record.worktree`, for a caller whose
 * output IS the worktree: an annotation's tags and claims.ttl. That caller collects them and removes
 * it. The memory and notes snapshots are taken when the session ends either way.
 */
export function runOne(spec) {
  const {id, branch, outDir, timeoutMinutes = 30, keepWorktree = false} = spec
  if (!id || !branch || !outDir) throw new Error('runOne needs id, branch and outDir.')
  const worktree = join(RUNS_ROOT, id)
  if (existsSync(worktree)) throw new Error(`${worktree} already exists; ids must be unique.`)
  mkdirSync(RUNS_ROOT, {recursive: true})
  mkdirSync(outDir, {recursive: true})

  const launch = buildLaunch(spec)
  // Before the worktree exists, so a missing CLI fails with nothing to clean up.
  const cli = {path: realpathSync(launch.command), version: cliVersion(launch.command)}
  const memoryBefore = snapshot(MEMORY_DIR)
  const notesBefore = snapshot(NOTES_DIR)
  git('worktree', 'add', '--detach', worktree, branch)
  const commit = git('-C', worktree, 'rev-parse', '--short', 'HEAD')

  const record = {id, branch, commit, cli, memoryOff: spec.memoryOff !== false, args: launch.args}
  try {
    const started = Date.now()
    const run = spawnSync(launch.command, launch.args, {
      cwd: worktree,
      env: launch.env,
      encoding: 'utf8',
      input: '',
      maxBuffer: 64 * 1024 * 1024,
      timeout: timeoutMinutes * 60 * 1000,
    })
    record.wallMs = Date.now() - started
    record.exit = run.status
    if (run.error) record.error = run.error.message
    try {
      record.result = JSON.parse(run.stdout)
    } catch {
      record.result = null
      record.stdout = run.stdout.slice(0, 4000)
    }
    record.stderr = (run.stderr ?? '').slice(0, 4000)
    record.completionProblems = completionProblems(record)
    record.completed = record.completionProblems.length === 0

    const transcript = record.result?.session_id && findTranscript(record.result.session_id)
    record.transcript = transcript ? `${id}.transcript.jsonl` : null
    record.sourceTranscript = transcript || null
    if (transcript) cpSync(transcript, join(outDir, record.transcript))
    record.isolationProblems = transcript
      ? isolationProblems(readFileSync(transcript, 'utf8'), spec.prompt)
      : ['no transcript found for the session']
  } finally {
    record.memoryChanged = changes(memoryBefore, snapshot(MEMORY_DIR))
    record.notesChanged = changes(notesBefore, snapshot(NOTES_DIR))
    if (keepWorktree) record.worktree = worktree
    else spawnSync('git', ['-C', REPO, 'worktree', 'remove', '--force', worktree])
  }
  if (record.memoryChanged.length) record.isolationProblems.push('the memory folder changed')
  if (record.notesChanged.length)
    record.isolationProblems.push('the side-session notes folder changed')
  record.isolated = record.isolationProblems.length === 0
  record.valid = record.completed === true && record.isolated
  writeFileSync(join(outDir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`)
  return record
}

/* ── dry-run: everything but the launch ───────────────────────────────────── */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, branch] = process.argv.slice(2)
  if (command !== 'dry-run' || !branch) {
    console.error('Usage: node docs/project-graph/harness/harness.mjs dry-run <branch>')
    process.exit(2)
  }
  const worktree = join(RUNS_ROOT, `dry-run-${process.pid}`)
  const launch = buildLaunch({prompt: '<prompt>', model: '<model>', effort: 'high', budgetUsd: 1})
  mkdirSync(RUNS_ROOT, {recursive: true})
  git('worktree', 'add', '--detach', worktree, branch)
  console.log(`worktree  ${worktree} at ${git('-C', worktree, 'rev-parse', '--short', 'HEAD')}`)
  console.log(`memory    ${MEMORY_DIR} (${Object.keys(snapshot(MEMORY_DIR)).length} files)`)
  console.log(`notes     ${NOTES_DIR} (${Object.keys(snapshot(NOTES_DIR)).length} files)`)
  console.log(`cli       ${realpathSync(launch.command)}, ${cliVersion(launch.command)}`)
  console.log(
    `launch    DISABLE_AUTOUPDATER=${launch.env.DISABLE_AUTOUPDATER} CLAUDE_CODE_DISABLE_AUTO_MEMORY=${launch.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY} ${launch.command} ${launch.args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}`,
  )
  git('worktree', 'remove', '--force', worktree)
  console.log(`removed   ${existsSync(worktree) ? 'NO, still there' : 'yes'}`)
}
