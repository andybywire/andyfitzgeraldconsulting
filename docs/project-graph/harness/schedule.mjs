/**
 * The 15 runs: one per task per arm, in the order protocol.md fixes, through runOne().
 *
 *   node docs/project-graph/harness/schedule.mjs --dry-run    the plan and every check, no launch
 *   node docs/project-graph/harness/schedule.mjs              run whatever is left, in order
 *
 * protocol.md is the specification, and this reads it rather than restating it: the order and the
 * run ids from the table under "How the runs are done", and each task's prompt from its blockquote
 * under "The tasks". A protocol this can't read fully stops it before anything launches (exit 2).
 * Every run is Opus 5.5 at high effort under the $10 cap, with the same tools in every arm.
 *
 * ── WHAT STOPS THE SCHEDULE ──────────────────────────────────────────────────
 *
 *   - AN INVALID RUN: not isolated, or not completed for any reason but the cap. The protocol: "A
 *     run that fails is invalid, and the schedule stops."
 *   - A CHANGED CLI: its version is read before every launch and compared with the first. Runs
 *     already done stay; a version change is something to decide about, not to run through.
 *   - THE BUDGET: before every launch, what stage 5 has spent so far, read from every record under
 *     runs/, plus this run's cap, must stay within $200.
 *   - A SECOND CAPPED RUN. The first is kept and scored as it stands, with its cost counted as the
 *     cap; the second stops the schedule so the cap can be revisited.
 *
 * WHAT A CAPPED RUN LOOKS LIKE IS NOT KNOWN, because no run has hit a cap. It is taken to be a run
 * that returned JSON whose subtype names the budget, or whose cost reached the cap, and that was
 * isolated; runOne() may well call it incomplete, since the CLI reports the cap as an error. If
 * the CLI reports it some other way, it reads as invalid and the schedule stops, which is the safe
 * direction.
 *
 * ── NEUTRAL PATHS ────────────────────────────────────────────────────────────
 *
 * A run sees the path of the worktree it works in, so ids are r01 to r15 and the worktrees go
 * under ~/.cache/af-runs/, set through PROJECT_GRAPH_RUNS before the harness is loaded. A root
 * that still names the project stops it (exit 2).
 *
 * ── RESUMING ─────────────────────────────────────────────────────────────────
 *
 * Records go to runs/schedule/<id>/: runOne's JSON and transcript, the run's usage, and meta.json
 * with its task, arm, model, effort and verdict. A run whose record is valid or capped is skipped,
 * so after a stop the schedule picks up where it left off. A record that is neither stops it
 * before anything launches, because what to do about a bad run is Andy's call, not this file's.
 *
 * ── PROVEN WITHOUT A LAUNCH, 2026-10-19 ──────────────────────────────────────
 *
 * schedule.test.mjs, with stand-ins for runOne() and the CLI:
 *   - the real protocol read as 15 runs in order, with T1's prompt verbatim;
 *   - a protocol with a wrong id and a missing prompt was refused on both counts;
 *   - every stop rule fired where it should: a run not isolated, an incomplete run, a second
 *     capped run (by cost alone, too), a CLI change, the budget, and, when resuming, an invalid
 *     record on disk and a CLI unlike the earlier runs';
 *   - one capped run was kept, and a resume counted an earlier one.
 * A copy with the cap rule loosened to three and the CLI check removed failed exactly the tests
 * for those rules. The real --dry-run printed the plan against the arms' commits under ~/.cache/af-runs, with $16.78 spent;
 * `harness.mjs dry-run pg-arm-a` made and removed a worktree there; a root that names the
 * project was refused. Untested until the first real run: the launch itself, and what a capped
 * run's JSON really looks like.
 *
 * Exit 0 when all 15 are done, 1 when the schedule stopped, 2 when it couldn't start.
 */
import {spawnSync} from 'node:child_process'
import {existsSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const REPO = resolve(HERE, '..', '..', '..')
const RECORD = join(REPO, 'docs', 'project-graph')
const OUT = join(RECORD, 'runs', 'schedule')

export const SETTINGS = {
  model: 'claude-opus-5-5',
  effort: 'high',
  budgetUsd: 10,
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash(node project-graph/graph.mjs *)'],
  disallowedTools: ['Edit', 'Write', 'NotebookEdit'],
  timeoutMinutes: 45,
}
export const STAGE_BUDGET_USD = 200
const BRANCHES = {A: 'pg-arm-a', B: 'pg-arm-b', C: 'pg-arm-c'}

/** The 15 runs, in id order, with each task's prompt, as protocol.md records them. */
export function planFromProtocol(text) {
  const problems = []
  const prompts = {}
  for (let n = 1; n <= 5; n++) {
    const block = text.split(new RegExp(`^### T${n}:.*\\n\\n`, 'm'))[1]?.split('\n\n')[0]
    const prompt = block?.startsWith('>')
      ? block
          .split('\n')
          .map((line) => line.replace(/^\s*> ?/, ''))
          .join(' ')
          .trim()
      : undefined
    if (prompt) prompts[`T${n}`] = prompt
    else problems.push(`no prompt under "### T${n}:"`)
  }
  const plan = []
  const row = /^\s*\|\s*(T[1-5])\s*\|((?:\s*[ABC] \(`r\d\d`\)\s*\|){3})/gm
  for (const [, task, cells] of text.matchAll(row)) {
    for (const [, arm, id] of cells.matchAll(/([ABC]) \(`(r\d\d)`\)/g)) {
      plan.push({id, task, arm, branch: BRANCHES[arm], prompt: prompts[task]})
    }
  }
  plan.sort((a, b) => a.id.localeCompare(b.id))
  const ids = plan.map((p) => p.id).join(' ')
  const expected = Array.from({length: 15}, (_, i) => `r${String(i + 1).padStart(2, '0')}`).join(
    ' ',
  )
  if (ids !== expected) problems.push(`the order table's ids are "${ids}", not r01 to r15`)
  const cells = new Set(plan.map((p) => `${p.task}${p.arm}`))
  if (cells.size !== 15) problems.push('the order table does not hold each task and arm once')
  return {plan, problems}
}

/** A run that hit the cap, as far as can be told without having seen one. See the header. */
export function hitCap(record, capUsd = SETTINGS.budgetUsd) {
  const r = record?.result
  return Boolean(r) && (/budget/i.test(r.subtype ?? '') || (r.total_cost_usd ?? 0) >= capUsd)
}

/** 'valid', 'capped' or 'invalid'. Capped needs isolation as much as valid does. */
export function verdict(record, capUsd = SETTINGS.budgetUsd) {
  if (!record?.isolated) return 'invalid'
  if (hitCap(record, capUsd)) return 'capped'
  return record.completed ? 'valid' : 'invalid'
}

/** What stage 5 has spent, from every run record under `dir`: the cost each one reports. */
export function spentUnder(dir) {
  let total = 0
  const walk = (path) => {
    if (!existsSync(path)) return
    if (statSync(path).isDirectory()) for (const name of readdirSync(path)) walk(join(path, name))
    else if (path.endsWith('.json') && !/(usage|meta)\.json$/.test(path)) {
      try {
        total += JSON.parse(readFileSync(path, 'utf8')).result?.total_cost_usd ?? 0
      } catch {
        // Not a run record.
      }
    }
  }
  walk(dir)
  return total
}

/**
 * Runs what is left of `plan`, in order, and stops on the rules above. Everything it touches is
 * passed in, so the stop rules can be proven with stand-ins: `runOne(spec)` and `cliVersion()` as
 * the harness has them, `existing(id)` for a record already on disk, `onRun(entry, record, verdict)`
 * to keep one, and `spent` for what was spent before this call. Returns what ran and why it stopped.
 */
export function runSchedule({plan, runOne, cliVersion, existing, onRun = () => {}, spent = 0}) {
  const ran = []
  let capped = 0
  let firstCli
  for (const entry of plan) {
    const before = existing(entry.id)
    if (before) {
      const v = verdict(before)
      if (v === 'invalid') return {ran, stopped: `${entry.id} has a record that is not valid`}
      if (v === 'capped') capped++
      firstCli ??= before.cli?.version
      continue
    }
    const cli = cliVersion()
    firstCli ??= cli
    if (cli !== firstCli) return {ran, stopped: `the CLI changed from ${firstCli} to ${cli}`}
    if (spent + SETTINGS.budgetUsd > STAGE_BUDGET_USD) {
      return {ran, stopped: `$${spent.toFixed(2)} spent, and one more run could pass $200`}
    }
    const record = runOne({...SETTINGS, id: entry.id, branch: entry.branch, prompt: entry.prompt})
    const v = verdict(record)
    spent += v === 'capped' ? SETTINGS.budgetUsd : (record.result?.total_cost_usd ?? 0)
    ran.push(entry.id)
    onRun(entry, record, v)
    if (v === 'invalid') return {ran, stopped: `${entry.id} is invalid`}
    if (v === 'capped' && ++capped === 2)
      return {ran, stopped: `${entry.id} is the second run to hit the cap`}
  }
  return {ran, stopped: null}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dry = process.argv[2] === '--dry-run'
  process.env.PROJECT_GRAPH_RUNS ??= join(homedir(), '.cache', 'af-runs')
  // Loaded only now, so the harness reads the neutral root above.
  const harness = await import('./harness.mjs')
  const {usageFrom} = await import('./trial-rerun.mjs')
  if (/project-graph/.test(harness.RUNS_ROOT)) {
    console.error(`The runs root ${harness.RUNS_ROOT} names the project. Nothing launched.`)
    process.exit(2)
  }

  const {plan, problems} = planFromProtocol(readFileSync(join(RECORD, 'protocol.md'), 'utf8'))
  const commits = {}
  for (const branch of Object.values(BRANCHES)) {
    const head = spawnSync('git', ['-C', REPO, 'rev-parse', '--short', branch], {encoding: 'utf8'})
    if (head.status !== 0) problems.push(`no branch ${branch}`)
    else commits[branch] = head.stdout.trim()
  }
  if (problems.length) {
    console.error(`Can't start:\n  ${problems.join('\n  ')}`)
    process.exit(2)
  }

  const recordOf = (id) => {
    const file = join(OUT, id, `${id}.json`)
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
  }
  const spent = spentUnder(join(RECORD, 'runs'))
  const left = plan.filter((p) => !recordOf(p.id))
  console.log(`runs root  ${harness.RUNS_ROOT}`)
  console.log(`cli        ${harness.cliVersion()}`)
  console.log(
    `spent      $${spent.toFixed(2)} so far in stage 5; at most $${(spent + left.length * SETTINGS.budgetUsd).toFixed(2)} after ${left.length} more`,
  )
  for (const p of plan) {
    const done = recordOf(p.id)
    console.log(
      `${p.id}  ${p.task}  ${p.arm}  ${p.branch}@${commits[p.branch]}  ${done ? verdict(done) : 'to run'}  ${p.prompt.slice(0, 48)}…`,
    )
  }
  if (dry) process.exit(0)

  const {stopped} = runSchedule({
    plan,
    runOne: (spec) => harness.runOne({...spec, outDir: join(OUT, spec.id)}),
    cliVersion: () => harness.cliVersion(),
    existing: recordOf,
    spent,
    onRun: ({prompt, ...entry}, record, v) => {
      const dir = join(OUT, entry.id)
      const meta = {
        ...entry,
        commit: record.commit,
        model: SETTINGS.model,
        effort: SETTINGS.effort,
        capUsd: SETTINGS.budgetUsd,
        verdict: v,
        costForAnalysis: v === 'capped' ? SETTINGS.budgetUsd : record.result?.total_cost_usd,
      }
      writeFileSync(join(dir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
      if (record.sourceTranscript) {
        const usage = usageFrom(
          record.sourceTranscript,
          join(harness.RUNS_ROOT, entry.id),
          record.result,
        )
        writeFileSync(join(dir, 'usage.json'), `${JSON.stringify(usage, null, 2)}\n`)
      }
      console.log(
        `${entry.id}  ${v}  $${record.result?.total_cost_usd ?? '?'}  ${Math.round((record.wallMs ?? 0) / 1000)} s`,
      )
    },
  })
  console.log(stopped ? `STOPPED: ${stopped}` : 'All 15 done.')
  process.exit(stopped ? 1 : 0)
}
