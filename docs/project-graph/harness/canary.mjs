/**
 * The canary: prove the harness isolates a run before anything real goes through it.
 *
 *   node docs/project-graph/harness/canary.mjs
 *
 * protocol.md → "The canary" is the specification. Two cheap runs from `pg-guide-trial`, the same
 * neutral prompt, the harness's launch exactly:
 *
 *   canary    memory switched off. Must be isolated: no banned text, memory and notes folders
 *             unchanged, the prompt arriving verbatim, and JSON carrying the figures runs need.
 *   control   memory left on. Must FAIL the isolation check with memory text in its transcript.
 *             That proves the check can see a leak; a check is not known to work until it fails.
 *
 * Exit 0 only when both behave so. Exit 1 when the canary leaks. Exit 3, "inconclusive", when
 * the control does NOT leak: then nothing is proven, because a session launched from inside
 * another Claude Code session may have memory off whatever the harness does. Run it again from a
 * plain terminal outside any Claude session.
 *
 * Each run is capped at $1. Output goes to docs/project-graph/runs/canary-<timestamp>/.
 *
 * A NOTE ON THE CONTROL: with memory on, a session may also WRITE to this checkout's memory. The
 * neutral prompt makes that unlikely, and the record lists any change. If one appears, it is the
 * control doing what the harness exists to prevent, and should be reverted by hand.
 */
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {REPO, runOne} from './harness.mjs'

const PROMPT =
  "List the files in project-graph/ and say in one sentence what concepts.ttl holds. Don't change anything."
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = join(REPO, 'docs', 'project-graph', 'runs', `canary-${stamp}`)
const common = {
  branch: 'pg-guide-trial',
  outDir,
  prompt: PROMPT,
  model: 'claude-opus-5-5',
  effort: 'low',
  budgetUsd: 1,
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash(ls *)'],
  disallowedTools: ['Edit', 'Write', 'NotebookEdit'],
  timeoutMinutes: 10,
}

/** What a run's JSON must carry for the protocol's measurements. */
const MEASURES = ['session_id', 'usage', 'num_turns', 'duration_ms', 'total_cost_usd']

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`Canary and control, from pg-guide-trial, into ${outDir}\n`)
  const canary = runOne({...common, id: `canary-${stamp}`, memoryOff: true})
  const control = runOne({...common, id: `control-${stamp}`, memoryOff: false})

  const missing = MEASURES.filter((key) => canary.result?.[key] === undefined)
  const overBudget = (canary.result?.total_cost_usd ?? Infinity) > common.budgetUsd
  const canaryOk = canary.valid && missing.length === 0 && !overBudget
  const controlLeaked = control.isolationProblems.some((p) =>
    /MEMORY\.md|persistent file-based memory/.test(p),
  )

  const show = (name, run) =>
    console.log(
      `${name}: ${run.cli.version}, ` +
        `${run.completed ? 'completed' : `DID NOT COMPLETE: ${run.completionProblems.join('; ')}`}, ` +
        `${run.isolated ? 'isolated' : `NOT isolated: ${run.isolationProblems.join('; ')}`}` +
        `, $${run.result?.total_cost_usd ?? '?'}, ${run.wallMs} ms`,
    )
  show('canary ', canary)
  show('control', control)
  if (missing.length) console.log(`canary JSON lacks: ${missing.join(', ')}`)
  if (overBudget) console.log('canary cost more than its cap, or reported no cost')

  if (!canaryOk) {
    console.log(
      '\nFAIL: the canary did not complete, is not isolated, or its JSON is incomplete. Nothing may run.',
    )
    process.exit(1)
  }
  // A control that never reached the model can't leak, so its silence would prove nothing.
  if (!control.completed) {
    console.log('\nINCONCLUSIVE: the control did not complete, so the check is unproven.')
    process.exit(3)
  }
  if (!controlLeaked) {
    console.log(
      '\nINCONCLUSIVE: the control did not load memory either, so the check is unproven. Run this' +
        ' again from a plain terminal, outside any Claude session.',
    )
    process.exit(3)
  }
  console.log('\nPASS: the canary is isolated, and the control shows the check can see a leak.')
}
