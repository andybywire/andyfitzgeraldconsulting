/**
 * The real annotation: one blind run that tags arm C's checkout, whose tags arm B then shares.
 *
 *   node docs/project-graph/harness/annotate.mjs
 *
 * protocol.md → "The three arms" is the specification: one annotation run makes both arms'
 * annotations (Andy, 2026-10-19), on Opus 5.5 at high effort, under the $25 annotation cap. This is
 * trial-rerun.mjs pointed at pg-arm-c instead of pg-guide-trial, and it reuses that file's
 * collection and usage counting rather than restating them. What differs:
 *
 *   - THE PROMPT IS READ FROM protocol.md, the blockquote after "The annotation's whole prompt:",
 *     so it is recorded before it runs and can't drift from the record. With no such blockquote
 *     this refuses to launch, exit 2.
 *   - THE BRANCH IS CHECKED FIRST. pg-arm-c must differ from 086dd0f only under project-graph/.
 *     Anything else would reach the annotator and then both arms, and the check is free next to a
 *     launch. A failure exits 2 before anything is spent.
 *   - 60 MINUTES, not 30. The trial annotated six files in 9.6; this covers every file the extractor
 *     reads, so the trial's time is no guide to a ceiling. The $25 cap is what bounds it.
 *
 * ── THE OUTPUT IS A RECORD, NOT YET AN ARM ──────────────────────────────────
 *
 * Collected into runs/annotation-<stamp>/ as the trial's rerun was: the tag diff, what changed in
 * project-graph/, every untracked file, claims.ttl, the check's output, the final message and the
 * usage. Then the worktree is removed. Nothing here moves pg-arm-c: the result is read first, and
 * applied to pg-arm-c, and from there to pg-arm-b, as a separate step.
 *
 * ── PROVEN WITHOUT A LAUNCH, 2026-10-19 ──────────────────────────────────────
 *
 * Before protocol.md recorded a prompt, a launch refused with exit 2. The parser read a planted
 * blockquote back as one line, and returned nothing from a record without the marker. The branch
 * guard passed pg-arm-c and flagged pg-guide-trial, whose setup changed package.json, so it can
 * fail. `harness.mjs dry-run pg-arm-c` made and removed a worktree at pg-arm-c's tip. The launch
 * itself is proven only by the run.
 *
 * Exit 0 when the run is valid and everything was collected, 1 when it is not valid (its output is
 * still collected, for the diagnosis), and 2 when it can't start.
 */
import {spawnSync} from 'node:child_process'
import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {REPO, runOne} from './harness.mjs'
import {collectAnnotation} from './trial-rerun.mjs'

const BRANCH = 'pg-arm-c'
const BASE = '086dd0f'
const MARKER = "The annotation's whole prompt:\n\n"

/** The prompt, exactly as protocol.md records it: the blockquote after MARKER. */
export function promptFromProtocol(
  text = readFileSync(join(REPO, 'docs', 'project-graph', 'protocol.md'), 'utf8'),
) {
  const block = text.split(MARKER)[1]?.split('\n\n')[0]
  const prompt = block
    ?.split('\n')
    .map((line) => line.replace(/^\s*> ?/, ''))
    .join(' ')
    .trim()
  return prompt?.startsWith('Annotate') ? prompt : undefined
}

/** Paths pg-arm-c changes outside project-graph/, which must be none. */
export function changesOutsideTooling(branch = BRANCH) {
  const out = spawnSync('git', ['-C', REPO, 'diff', '--name-only', BASE, branch], {
    encoding: 'utf8',
  })
  if (out.status !== 0) return [`git diff failed: ${out.stderr.trim()}`]
  return out.stdout.split('\n').filter((path) => path && !path.startsWith('project-graph/'))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const prompt = promptFromProtocol()
  if (!prompt) {
    console.error(`No prompt recorded in protocol.md after "${MARKER.trim()}". Nothing launched.`)
    process.exit(2)
  }
  const outside = changesOutsideTooling()
  if (outside.length) {
    console.error(
      `${BRANCH} differs from ${BASE} outside project-graph/:\n  ${outside.join('\n  ')}`,
    )
    process.exit(2)
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const id = `annotation-${stamp}`
  const outDir = join(REPO, 'docs', 'project-graph', 'runs', id)
  console.log(`The annotation, from ${BRANCH}, into ${outDir}\n\n> ${prompt}\n`)

  const run = runOne({
    id,
    branch: BRANCH,
    outDir,
    prompt,
    model: 'claude-opus-5-5',
    effort: 'high',
    budgetUsd: 25,
    allowedTools: ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Bash(node project-graph/graph.mjs *)'],
    timeoutMinutes: 60,
    keepWorktree: true,
  })

  const wt = run.worktree
  collectAnnotation(run, outDir)

  console.log(
    `${run.cli.version}, ${run.completed ? 'completed' : `DID NOT COMPLETE: ${run.completionProblems.join('; ')}`}, ` +
      `${run.isolated ? 'isolated' : `NOT isolated: ${run.isolationProblems.join('; ')}`}, ` +
      `$${run.result?.total_cost_usd ?? '?'}, ${Math.round(run.wallMs / 1000)} s`,
  )
  console.log(`worktree removed: ${existsSync(wt) ? 'NO, still there' : 'yes'}`)
  process.exit(run.valid ? 0 : 1)
}
