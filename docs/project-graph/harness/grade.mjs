/**
 * The blind grader: one headless run that scores the 15 answers against the rubrics.
 *
 *   node docs/project-graph/harness/grade.mjs --dry-run   write the prompt for review, launch nothing
 *   node docs/project-graph/harness/grade.mjs             grade, and check what comes back
 *
 * protocol.md → "How the runs are done" → "Grading" records why (Andy, 2026-10-20): the rubrics are
 * mostly mechanical, and the session that ran the experiment isn't blind. This is that grader.
 *
 * ── WHAT IT SEES, AND WHAT IT DOESN'T ────────────────────────────────────────
 *
 * The prompt holds the instructions, the rubrics and the 15 answers, read from grading/packet.md,
 * where they are already shuffled and unlabeled. It runs in a worktree of pg-arm-a, which is
 * 086dd0f itself: the commit every arm started from, with no tags, no glossary and no graph, so it
 * can check a claimed disagreement against the code without meeting anything an arm added. It
 * never sees key.json, protocol.md or the inventory. The rubric text is written out here rather
 * than copied, because the protocol's own wording names the arms and what each was expected to do.
 * The grader needs the criteria, not the hypothesis.
 *
 * ── WHAT IT RETURNS ──────────────────────────────────────────────────────────
 *
 * JSON, in its final message: for every answer, a score for every item, each above 0 backed by a
 * quote from the answer, plus the extra locations or claims T2 and T3 ask about. It reports FACTS,
 * not totals. T2's rows with two parts are scored per part, so how a row with one part found counts
 * is settled outside the grader and can't be shaded by it. checkGrades() refuses a reply with a
 * missing answer, a missing or unknown item, a score outside its range, or a score with no quote.
 *
 * ── PROVEN WITHOUT A LAUNCH, 2026-10-20 ──────────────────────────────────────
 *
 * The prompt carried all 15 answers, each identical to its run's record, and outside the answers
 * none of the words that would name the arms or the hypothesis: arm, graph, annotation,
 * experiment, placebo, glossary, the tags, the key, the protocol, the inventory or a run id.
 * checkGrades() passed a clean planted reply and caught each planted fault: an answer missing, a
 * score of 2, a half point where only T1's item 5 allows one, a score with a blank quote, an item
 * missing, an unknown item, and a reply with no JSON. `harness.mjs dry-run pg-arm-a` made and
 * removed a worktree at 086dd0f under the neutral root.
 *
 * Exit 0 when the grades are complete and written to grading/grades.json, 1 when the run or its
 * grades are not usable (the run's record is kept for the diagnosis), 2 when it can't start.
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const GRADING = resolve(HERE, '..', 'grading')
const BRANCH = 'pg-arm-a'

export const SETTINGS = {
  model: 'claude-opus-5-5',
  effort: 'high',
  budgetUsd: 15,
  allowedTools: ['Read', 'Glob', 'Grep'],
  disallowedTools: ['Edit', 'Write', 'NotebookEdit'],
  timeoutMinutes: 60,
}

/** Every item each task scores, with the scores it allows. */
export const ITEMS = {
  T1: {1: [0, 1], 2: [0, 1], 3: [0, 1], 4: [0, 1], 5: [0, 0.5, 1]},
  T2: Object.fromEntries(
    ['1', '2', '3a', '3b', '4a', '4b', '5a', '5b', '6', '7', 's1', 's2', 's3'].map((id) => [
      id,
      [0, 1],
    ]),
  ),
  T3: Object.fromEntries(Array.from({length: 15}, (_, i) => [String(i + 1), [0, 1]])),
  T4: {1: [0, 1], 2: [0, 1], 3: [0, 1], 4: [0, 1], 5: [0, 1]},
  T5: {1: [0, 1], 2: [0, 1], 3: [0, 1]},
}

export const INSTRUCTIONS = `You are grading answers to five questions about the code and docs in this repository. Each
question was put to three separate sessions working in a checkout of this same commit, and each
answer below is one session's reply, exactly as it came back. The answers within a question are
in a random order and carry no names.

Score every answer against its question's rubric. Judge from the answer's own text. Use this
checkout's files only where a rubric tells you to check something against the code, and don't
edit any files. Line numbers in an answer may not match this checkout exactly: identify a place by
what the answer describes, not by its line numbers alone.

For each answer, score every item its rubric lists, using only the scores the rubric allows. Give
each item a score, a quote and a note:
- a score above 0 needs a short quote from the answer that earns it, copied exactly;
- a score of 0 has an empty quote, and the note may say what came close;
- the note is one short line, or empty.

Also report "stoppedShort": true when the answer stops partway to ask whether to continue, rather
than finishing, and false otherwise.

Reply with JSON only, in one \`\`\`json block, as an array with one object per answer, in the
order the answers appear:

[
  {
    "label": "T1 · answer 1",
    "items": {"1": {"score": 1, "quote": "…", "note": ""}, "2": {"score": 0, "quote": "", "note": "…"}},
    "extra": [],
    "stoppedShort": false
  }
]

"extra" is used only where a rubric says so, and is otherwise an empty array.`

export const RUBRICS = {
  T1: `Five items, each 0 or 1, except item 5:
1. Names base.css's global \`:focus-visible\` \`box-shadow\` as the source of the ring.
2. Names the script's \`.focus()\` on the success block, or \`:target\` focus, as what puts focus
   there, and keeps that focus move rather than removing it.
3. Finds the existing ring suppression in \`web/src/components/cards/CardMasonry.astro\` as the
   precedent.
4. Flags ContactForm's own comment, which says no ring would appear, as wrong.
5. Proposes clearing both \`outline\` and \`box-shadow\` on \`:focus\`: 1. On \`:focus-visible\`
   instead, or clearing one property only: 0.5. Neither: 0.`,

  T2: `Each item below is a place in the repository, scored 1 when the answer lists it and 0 when it
doesn't. The answer lists a place when it names the file and the rule, element or comment the
item describes, by line numbers or by describing it unambiguously. Paths are under \`web/src/\`
unless they start at the repository root.

- 1: \`styles/base.css\` around lines 690-709: the global focus ring.
- 2: \`components/cards/CardMasonry.astro\` around lines 185-209: the one existing ring
  suppression, and its reasoning.
- 3a: \`components/ContactForm.astro\` around lines 143-147: the success and failure state blocks,
  focused by script.
- 3b: \`components/ContactForm.astro\` around lines 529-533: the comment saying no ring appears.
- 4a: \`layouts/BaseLayout.astro\` around lines 720-731: the skip link's target, \`<main>\` with
  \`tabindex="-1"\`.
- 4b: the nine \`<main id="main" tabindex="-1">\` elements in \`pages/\`. Naming them as a group
  counts.
- 5a: \`components/ResultsFooter.astro\` around lines 78-93: \`#result-count\`, focusable by script.
- 5b: \`scripts/card-index.ts\` around line 650: where \`#result-count\` is focused as a fallback.
- 6: \`scripts/card-index.ts\` around lines 706-725: where the card grid gets \`tabIndex = -1\`, and
  why.
- 7: \`DESIGN.md\` around lines 1120-1123: the design rule naming the grid a landing point whose
  ring is suppressed.
- s1: \`docs/urls-and-filtering.md\` around lines 390-395: the deferred option of focusing a
  heading with \`tabindex="-1"\`.
- s2: \`scripts/search.ts\` around lines 923-928: the same deferred option, as search records it.
- s3: \`CLAUDE.md\` around line 585: the skip link, and \`tabindex="-1"\` on the \`<main>\` elements.

"extra": every place the answer lists that has nothing to do with the rule in the question: it
would not need to change, and it says nothing about how elements focused only by script look or
behave when focused. For each, {"location": "…", "why": "…"}. Don't list related places just
because they aren't items above.`,

  T3: `Fifteen known disagreements, each scored 1 when the answer identifies it and 0 when it doesn't.
The answer identifies one when it points to at least one of the places listed and says what is
wrong there in a way that matches the item.

${'{{CONTRADICTIONS}}'}

"extra": every disagreement the answer claims that is not one of the fifteen. Check each against
the code and docs in this checkout, and judge it real or not real. For each, {"claim": "…",
"verdict": "real" or "not real", "why": "…"}, where "why" names what you read.`,

  T4: `Five items, each 0 or 1:
1. Recommends keeping the \`!important\`: the decision is not reopened.
2. Gives the reason: an author \`display\` rule silently beats the browser's own \`[hidden]\`
   (\`web/src/styles/base.css\` around lines 77-99).
3. Cites the incident that caused it: the Insights filter chips, 2026-08-31.
4. Names the established alternative: a class for "styled away", as ContactForm's \`.is-shown\`
   does.
5. Notes what would break: the controls that ship \`hidden\` and rely on it staying hidden.`,

  T5: `Three items, each 0 or 1:
1. Recommends against switching.
2. Gives the reason: Fuse matches substrings, and multi-word queries returned nothing.
3. Finds the record of that decision, in \`CLAUDE.md\` or \`docs/search-ranking.md\`, and treats the
   \`DESIGN.md\` line as out of date.`,
}

/** The answers in the packet: each label, its task and its text, unquoted, in packet order. */
export function answersFromPacket(text) {
  const answers = []
  for (const m of text.matchAll(/^## (T[1-5]) · answer (\d)\n\n([\s\S]*?)\n\n### Score:/gm)) {
    const answer = m[3]
      .split('\n')
      .map((line) => line.replace(/^> ?/, ''))
      .join('\n')
    answers.push({label: `${m[1]} · answer ${m[2]}`, task: m[1], answer})
  }
  return answers
}

/** The task prompts, from the packet, which shows each exactly as the runs received it. */
export function promptsFromPacket(text) {
  const prompts = {}
  for (const m of text.matchAll(
    /^# (T[1-5]):.*\n\n\*\*The prompt, as every run received it:\*\*\n\n((?:> .*\n?)+)/gm,
  )) {
    prompts[m[1]] = m[2]
      .trim()
      .split('\n')
      .map((line) => line.replace(/^> ?/, ''))
      .join(' ')
  }
  return prompts
}

/** The numbered list for T3, from the packet's copy of the inventory's table. */
export function contradictionsFromPacket(text) {
  const table = text.split('### The numbered list, from inventory.md\n\n')[1]?.split('\n\n')[0]
  if (!table) return undefined
  return table
    .split('\n')
    .slice(2)
    .map((row) => row.split('|').map((cell) => cell.trim()))
    .map(([, n, what, where]) => `${n}. ${what}\n    At: ${where}`)
    .join('\n')
}

/** The whole prompt the grader receives. */
export function buildPrompt(packet) {
  const answers = answersFromPacket(packet)
  const prompts = promptsFromPacket(packet)
  const list = contradictionsFromPacket(packet)
  const parts = [INSTRUCTIONS]
  for (const task of ['T1', 'T2', 'T3', 'T4', 'T5']) {
    parts.push(
      `\n\n========== ${task} ==========\n\nThe question, as each session received it:\n\n${prompts[task]}`,
    )
    parts.push(
      `\n\nThe rubric for ${task}:\n\n${RUBRICS[task].replace('{{CONTRADICTIONS}}', list)}`,
    )
    for (const a of answers.filter((x) => x.task === task)) {
      parts.push(`\n\n---------- ${a.label} ----------\n\n${a.answer}`)
    }
  }
  return parts.join('')
}

/** The JSON array in the grader's reply, or undefined. */
export function parseGrades(reply) {
  const fenced = reply.match(/```json\s*\n([\s\S]*?)\n```/)
  try {
    const value = JSON.parse(
      fenced ? fenced[1] : reply.slice(reply.indexOf('['), reply.lastIndexOf(']') + 1),
    )
    return Array.isArray(value) ? value : undefined
  } catch {
    return undefined
  }
}

/** Everything wrong with a set of grades, judged against the answers they grade. */
export function checkGrades(grades, answers) {
  if (!Array.isArray(grades)) return ['the reply holds no JSON array']
  const problems = []
  const byLabel = new Map(grades.map((g) => [g?.label, g]))
  if (byLabel.size !== grades.length) problems.push('an answer is graded twice')
  for (const {label, task} of answers) {
    const g = byLabel.get(label)
    if (!g) {
      problems.push(`${label}: not graded`)
      continue
    }
    const items = g.items ?? {}
    for (const id of Object.keys(items)) {
      if (!(id in ITEMS[task])) problems.push(`${label}: unknown item ${id}`)
    }
    for (const [id, allowed] of Object.entries(ITEMS[task])) {
      const item = items[id]
      if (!item) problems.push(`${label}: item ${id} not scored`)
      else if (!allowed.includes(item.score))
        problems.push(`${label}: item ${id} scored ${item.score}`)
      else if (item.score > 0 && !item.quote?.trim())
        problems.push(`${label}: item ${id} has no quote`)
    }
    if (!Array.isArray(g.extra)) problems.push(`${label}: "extra" is not an array`)
    if (typeof g.stoppedShort !== 'boolean') problems.push(`${label}: "stoppedShort" is missing`)
  }
  for (const label of byLabel.keys()) {
    if (!answers.some((a) => a.label === label)) problems.push(`${label}: no such answer`)
  }
  return problems
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const packet = readFileSync(join(GRADING, 'packet.md'), 'utf8')
  const answers = answersFromPacket(packet)
  const prompt = buildPrompt(packet)
  if (answers.length !== 15 || !contradictionsFromPacket(packet) || /undefined/.test(prompt)) {
    console.error(`The packet didn't read: ${answers.length} answers. Nothing launched.`)
    process.exit(2)
  }
  if (process.argv[2] === '--dry-run') {
    writeFileSync(join(GRADING, 'grader-prompt.md'), `${prompt}\n`)
    console.log(
      `${answers.length} answers; prompt ${prompt.length} characters, in grading/grader-prompt.md`,
    )
    process.exit(0)
  }

  process.env.PROJECT_GRAPH_RUNS ??= join(homedir(), '.cache', 'af-runs')
  const harness = await import('./harness.mjs')
  if (/project-graph/.test(harness.RUNS_ROOT)) {
    console.error(`The runs root ${harness.RUNS_ROOT} names the project. Nothing launched.`)
    process.exit(2)
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = join(GRADING, `run-${stamp}`)
  const run = harness.runOne({...SETTINGS, id: 'g01', branch: BRANCH, outDir, prompt})
  const grades = parseGrades(run.result?.result ?? '')
  const problems = run.valid ? checkGrades(grades, answers) : ['the run is not valid']
  console.log(
    `${run.valid ? 'valid' : 'NOT VALID'}, $${run.result?.total_cost_usd ?? '?'}, ` +
      `${Math.round((run.wallMs ?? 0) / 1000)} s, ${problems.length} problem(s) with the grades`,
  )
  for (const p of problems) console.log(`  ${p}`)
  if (problems.length) process.exit(1)
  writeFileSync(join(GRADING, 'grades.json'), `${JSON.stringify(grades, null, 2)}\n`)
  console.log('Written to grading/grades.json.')
}
