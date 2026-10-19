/**
 * The annotation guide's trial, run again through the harness.
 *
 *   node docs/project-graph/harness/trial-rerun.mjs
 *
 * guide-trial.md is the specification and holds the criteria the result is read against. The first
 * trial ran from the desktop app, and every failure traced to the app: auto-memory, the shared
 * notes folder and a wrapped prompt. This runs the same annotation with those three removed, so a
 * failure now is the guide's, or the model's. Criterion D, whether memory reached it, is now the
 * harness's isolation check.
 *
 * ── WHAT IS THE SAME AS THE FIRST TRIAL, AND WHAT ISN'T ──────────────────────
 *
 * The same: the branch (pg-guide-trial, now with the guide's later changes), the six files, Opus 5.5
 * at high effort, and the prompt, read from guide-trial.md's setup so it can't drift from it. Andy's
 * user-level ~/.claude/CLAUDE.md is still loaded, as it was in the app, so it adds no difference.
 *
 * Not the same:
 *
 *   - The one sentence the app required alongside the prompt is gone. A headless launch has no
 *     second field.
 *   - Tools are listed, and `dontAsk` refuses anything else: reading, searching, editing, writing,
 *     and `node project-graph/graph.mjs`. The protocol said `acceptEdits`, which leaves every other
 *     tool on the ask path. A headless run can't ask, so what happens there is less predictable
 *     than a refusal. This also means no git, no scratch scripts and no other shell commands.
 *   - The cap is $25, the annotation cap. The first trial cost $3.46 at list price.
 *
 * ── THE OUTPUT IS THE WORKTREE ──────────────────────────────────────────────
 *
 * runOne() keeps the worktree, and this collects what the first trial's record holds into the
 * run's folder, then removes it: the tag diff outside project-graph/ (A1), what changed inside it
 * and every untracked file (A2), claims.ttl, the check's output (A3), the final message (B7) and the
 * usage (C). The B criteria are judged by reading those, as before.
 *
 * Exit 0 when the run is valid and everything was collected, 1 when it is not valid (its output is
 * still collected, for the diagnosis), and 2 when it can't start.
 */
import {spawnSync} from 'node:child_process'
import {cpSync, existsSync, readFileSync, writeFileSync} from 'node:fs'
import {join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import {REPO, runOne} from './harness.mjs'

const BRANCH = 'pg-guide-trial'

/** The prompt, exactly as guide-trial.md's setup gives it: the blockquote after "Its whole prompt:". */
export function promptFromGuideTrial() {
  const text = readFileSync(join(REPO, 'docs', 'project-graph', 'guide-trial.md'), 'utf8')
  const block = text.split('Its whole\n  prompt:\n\n')[1]?.split('\n\n')[0]
  const prompt = block
    ?.split('\n')
    .map((line) => line.replace(/^\s*> ?/, ''))
    .join(' ')
  if (
    !prompt?.startsWith('Annotate the comments') ||
    !prompt.endsWith('`project-graph/concepts.ttl`.')
  ) {
    console.error('Could not read the prompt from guide-trial.md. Has its setup section moved?')
    process.exit(2)
  }
  return prompt
}

const git = (cwd, ...args) => spawnSync('git', ['-C', cwd, ...args], {encoding: 'utf8'}).stdout

/** Tool calls by name, files read, and whether the graph's commands ran, from the transcript. */
export function usageFrom(transcriptPath, worktree, result) {
  const calls = {}
  const filesRead = {}
  const commands = []
  for (const line of readFileSync(transcriptPath, 'utf8').split('\n')) {
    let record
    try {
      record = JSON.parse(line)
    } catch {
      continue
    }
    if (record.type !== 'assistant' || !Array.isArray(record.message?.content)) continue
    for (const part of record.message.content) {
      if (part.type !== 'tool_use') continue
      calls[part.name] = (calls[part.name] ?? 0) + 1
      if (part.name === 'Read' && part.input?.file_path) {
        const file = relative(worktree, part.input.file_path)
        filesRead[file] = (filesRead[file] ?? 0) + 1
      }
      if (part.name === 'Bash' && part.input?.command) commands.push(part.input.command)
    }
  }
  return {
    model: Object.keys(result?.modelUsage ?? {}),
    usage: result?.usage,
    num_turns: result?.num_turns,
    duration_ms: result?.duration_ms,
    total_cost_usd: result?.total_cost_usd,
    tool_calls: calls,
    tool_calls_total: Object.values(calls).reduce((a, b) => a + b, 0),
    files_read: filesRead,
    ran_graph_check: commands.some((c) => c.includes('graph.mjs check')),
    ran_graph_query: commands.some((c) => c.includes('graph.mjs query')),
    permission_denials: result?.permission_denials ?? [],
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const prompt = promptFromGuideTrial()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const id = `trial-rerun-${stamp}`
  const outDir = join(REPO, 'docs', 'project-graph', 'runs', id)
  console.log(`The guide trial, rerun from ${BRANCH}, into ${outDir}\n\n> ${prompt}\n`)

  const run = runOne({
    id,
    branch: BRANCH,
    outDir,
    prompt,
    model: 'claude-opus-5-5',
    effort: 'high',
    budgetUsd: 25,
    allowedTools: ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Bash(node project-graph/graph.mjs *)'],
    timeoutMinutes: 30,
    keepWorktree: true,
  })

  const wt = run.worktree
  try {
    writeFileSync(join(outDir, 'tags.diff'), git(wt, 'diff', 'HEAD', '--', '.', ':!project-graph'))
    writeFileSync(
      join(outDir, 'project-graph.diff'),
      git(wt, 'diff', 'HEAD', '--', 'project-graph'),
    )
    writeFileSync(
      join(outDir, 'status.txt'),
      git(wt, 'status', '--porcelain', '--untracked-files=all'),
    )
    const claims = join(wt, 'project-graph', 'claims.ttl')
    if (existsSync(claims)) cpSync(claims, join(outDir, 'claims.ttl'))
    const check = spawnSync('node', ['project-graph/graph.mjs', 'check'], {
      cwd: wt,
      encoding: 'utf8',
    })
    writeFileSync(join(outDir, 'check.txt'), `exit ${check.status}\n${check.stdout}${check.stderr}`)
    writeFileSync(join(outDir, 'final-message.md'), `${run.result?.result ?? '(no result)'}\n`)
    if (run.sourceTranscript) {
      const usage = usageFrom(run.sourceTranscript, wt, run.result)
      writeFileSync(join(outDir, 'usage.json'), `${JSON.stringify(usage, null, 2)}\n`)
    }
  } finally {
    spawnSync('git', ['-C', REPO, 'worktree', 'remove', '--force', wt])
  }

  console.log(
    `${run.cli.version}, ${run.completed ? 'completed' : `DID NOT COMPLETE: ${run.completionProblems.join('; ')}`}, ` +
      `${run.isolated ? 'isolated' : `NOT isolated: ${run.isolationProblems.join('; ')}`}, ` +
      `$${run.result?.total_cost_usd ?? '?'}, ${Math.round(run.wallMs / 1000)} s`,
  )
  console.log(`worktree removed: ${existsSync(wt) ? 'NO, still there' : 'yes'}`)
  process.exit(run.valid ? 0 : 1)
}
