/**
 * The results: the blind grades, the key applied, and protocol.md's reading rules.
 *
 *   node docs/project-graph/harness/results.mjs > docs/project-graph/grading/results.md
 *
 * Reads grading/grades.json (grade.mjs's blind scores, by answer label), grading/key.json (which
 * run each label is) and each run's meta.json (its task, arm and cost), and writes Markdown:
 *
 *   - THE SCORES, by task and arm. A T2 row with two parts counts when either part is found (Andy,
 *     2026-10-20, decided before any score existed); the strict count is shown beside it.
 *   - THE READING RULES, as protocol.md → "How the results are read" states them for one run per
 *     cell: a trust win needs two more T2 rows or two more of T3's 11 hard contradictions, cost
 *     counts at 2× or more over T1 to T4, and T5 separates arms at two points or 2× the cost.
 *   - THE TICKS TO CHECK: every single score that could change a verdict on its own. In a pair
 *     whose gap is 2, one wrong credit to the leader or one wrong miss for the trailer undoes the
 *     win; in a pair whose gap is 1, one wrong miss for the leader or one wrong credit to the
 *     trailer makes one. The first version listed only the items the two arms were scored
 *     differently on. That misses that each arm's answer is graded on its own, so any one of the
 *     leader's credits can be wrong by itself: with B exactly at the margin, any of its eight
 *     could flip the verdict. Fixed before the results were reported, 2026-10-20.
 */
import {readFileSync} from 'node:fs'
import {join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const RECORD = resolve(fileURLToPath(new URL('..', import.meta.url)))
const RUNS = join(RECORD, 'runs', 'schedule')
const grades = JSON.parse(readFileSync(join(RECORD, 'grading', 'grades.json'), 'utf8'))
const key = JSON.parse(readFileSync(join(RECORD, 'grading', 'key.json'), 'utf8'))
const rows = {
  1: ['1'],
  2: ['2'],
  3: ['3a', '3b'],
  4: ['4a', '4b'],
  5: ['5a', '5b'],
  6: ['6'],
  7: ['7'],
}
const score = (g, id) => g.items[id]?.score ?? 0
const sum = (g, ids) => ids.reduce((t, id) => t + score(g, id), 0)

// One cell per task and arm.
const cell = {}
for (const g of grades) {
  const id = key[g.label]
  const meta = JSON.parse(readFileSync(`${RUNS}/${id}/meta.json`, 'utf8'))
  const c = {label: g.label, id, task: meta.task, arm: meta.arm, cost: meta.costForAnalysis, g}
  if (c.task === 'T1') c.points = sum(g, ['1', '2', '3', '4', '5'])
  if (c.task === 'T2') {
    c.rows = Object.values(rows).filter((parts) => parts.some((p) => score(g, p) === 1)).length
    c.strict = Object.values(rows).filter((parts) => parts.every((p) => score(g, p) === 1)).length
    c.should = sum(g, ['s1', 's2', 's3'])
    c.unrelated = g.extra.length
  }
  if (c.task === 'T3') {
    c.hard = sum(
      g,
      Array.from({length: 11}, (_, i) => String(i + 1)),
    )
    c.soft = sum(g, ['12', '13', '14', '15'])
    c.notReal = g.extra.filter((e) => e.verdict === 'not real').length
    c.realExtra = g.extra.filter((e) => e.verdict === 'real').length
  }
  if (c.task === 'T4') c.points = sum(g, ['1', '2', '3', '4', '5'])
  if (c.task === 'T5') c.points = sum(g, ['1', '2', '3'])
  cell[`${c.task}${c.arm}`] = c
}
const at = (task, arm) => cell[`${task}${arm}`]
const ARMS = ['A', 'B', 'C']
const money = (n) => `$${n.toFixed(2)}`
const out = []

out.push('## Scores by task and arm\n')
out.push('| | A | B | C |\n| --- | --- | --- | --- |')
out.push(`| T1 points (of 5) | ${ARMS.map((a) => at('T1', a).points).join(' | ')} |`)
out.push(
  `| T1 point 4, the wrong comment flagged | ${ARMS.map((a) => (score(at('T1', a).g, '4') ? 'yes' : 'no')).join(' | ')} |`,
)
out.push(`| **T2 rows found (of 7)** | ${ARMS.map((a) => `**${at('T2', a).rows}**`).join(' | ')} |`)
out.push(`| T2 rows, every part found | ${ARMS.map((a) => at('T2', a).strict).join(' | ')} |`)
out.push(`| T2 should-find (of 3) | ${ARMS.map((a) => at('T2', a).should).join(' | ')} |`)
out.push(`| T2 unrelated places listed | ${ARMS.map((a) => at('T2', a).unrelated).join(' | ')} |`)
out.push(
  `| **T3 hard contradictions (of 11)** | ${ARMS.map((a) => `**${at('T3', a).hard}**`).join(' | ')} |`,
)
out.push(`| T3 soft items (of 4) | ${ARMS.map((a) => at('T3', a).soft).join(' | ')} |`)
out.push(
  `| T3 other claims judged not real | ${ARMS.map((a) => at('T3', a).notReal).join(' | ')} |`,
)
out.push(`| T3 other claims judged real | ${ARMS.map((a) => at('T3', a).realExtra).join(' | ')} |`)
out.push(`| T4 points (of 5) | ${ARMS.map((a) => at('T4', a).points).join(' | ')} |`)
out.push(`| T5 points (of 3) | ${ARMS.map((a) => at('T5', a).points).join(' | ')} |`)
const costT1toT4 = Object.fromEntries(
  ARMS.map((a) => [a, ['T1', 'T2', 'T3', 'T4'].reduce((t, k) => t + at(k, a).cost, 0)]),
)
out.push(`| Cost, T1 to T4 | ${ARMS.map((a) => money(costT1toT4[a])).join(' | ')} |`)
out.push(`| Cost, T5 | ${ARMS.map((a) => money(at('T5', a).cost)).join(' | ')} |`)
const stopped = Object.values(cell)
  .filter((c) => c.g.stoppedShort)
  .map((c) => `${c.task} on ${c.arm}`)
out.push(
  `\nStopped short to ask whether to continue: ${stopped.length ? stopped.join(', ') : 'none'}.\n`,
)

// The reading rules.
const beatsOnTrust = (x, y) => {
  const on = []
  if (at('T2', x).rows - at('T2', y).rows >= 2) on.push('T2')
  if (at('T3', x).hard - at('T3', y).hard >= 2) on.push('T3')
  return on
}
const losesOnCost = (x, y) => costT1toT4[x] >= 2 * costT1toT4[y]
out.push('## The reading rules\n')
for (const [x, y] of [
  ['B', 'A'],
  ['C', 'A'],
  ['C', 'B'],
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'C'],
]) {
  const on = beatsOnTrust(x, y)
  if (on.length) out.push(`- ${x} beats ${y} on trust, on ${on.join(' and ')}.`)
}
for (const [x, y] of [
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'A'],
  ['B', 'C'],
  ['C', 'A'],
  ['C', 'B'],
]) {
  if (losesOnCost(x, y))
    out.push(
      `- ${x} loses to ${y} on cost: ${money(costT1toT4[x])} against ${money(costT1toT4[y])}.`,
    )
}
const bEarns = beatsOnTrust('B', 'A').length > 0 && !losesOnCost('B', 'A')
const cEarns =
  (beatsOnTrust('C', 'B').length > 0 && !losesOnCost('C', 'B')) ||
  (losesOnCost('B', 'C') && beatsOnTrust('B', 'C').length === 0)
out.push(
  `- **The annotation discipline (B over A) ${bEarns ? 'earns its place' : 'does not earn its place'}.**`,
)
out.push(
  `- **The semantic layer (C over B) ${cEarns ? 'earns its place' : 'does not earn its place'}.**`,
)
const t5 = []
for (const [x, y] of [
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'C'],
]) {
  const dp = Math.abs(at('T5', x).points - at('T5', y).points)
  const r =
    Math.max(at('T5', x).cost, at('T5', y).cost) / Math.min(at('T5', x).cost, at('T5', y).cost)
  if (dp >= 2 || r >= 2) t5.push(`${x} and ${y}`)
}
out.push(
  `- T5: ${t5.length ? `**arms separate (${t5.join(', ')}), so the other results are suspect**` : 'no arms separate'}.\n`,
)

// The ticks that could change a verdict on their own. In a pair whose gap is 2, one wrong credit
// to the leader, or one wrong miss for the trailer, undoes the win. In a pair whose gap is 1, one
// wrong miss for the leader, or one wrong credit to the trailer, makes one. A gap of 0 or of 3 or
// more needs two errors, and nothing is listed for it.
out.push('## The ticks to check\n')
const T3_ITEMS = Array.from({length: 11}, (_, i) => String(i + 1))
const T2_ROWS = Object.keys(rows)
const credited = (task, arm, id) =>
  task === 'T2'
    ? rows[id].some((p) => score(at(task, arm).g, p) === 1)
    : score(at(task, arm).g, id) === 1
const show = (task, arm, id) => {
  const parts = task === 'T2' ? rows[id] : [id]
  return parts
    .map((p) => at(task, arm).g.items[p])
    .map((i) => (i.score ? `quote: "${i.quote}"` : i.note ? `note: ${i.note}` : 'no note'))
    .join(' / ')
}
const checks = new Map()
const want = (task, arm, id, why) => {
  const k = `${task}|${arm}|${id}`
  if (!checks.has(k)) checks.set(k, {task, arm, id, why: []})
  checks.get(k).why.push(why)
}
for (const [task, measure, items] of [
  ['T2', 'rows', T2_ROWS],
  ['T3', 'hard', T3_ITEMS],
]) {
  for (const [x, y] of [
    ['A', 'B'],
    ['B', 'C'],
    ['A', 'C'],
  ]) {
    const d = at(task, x)[measure] - at(task, y)[measure]
    if (![1, 2, -1, -2].includes(d)) continue
    const [lead, trail] = d > 0 ? [x, y] : [y, x]
    const gap = Math.abs(d)
    for (const id of items) {
      if (gap === 2 && credited(task, lead, id))
        want(task, lead, id, `${lead}'s credit holds ${lead} over ${trail}`)
      if (gap === 2 && !credited(task, trail, id))
        want(task, trail, id, `${trail}'s miss holds ${lead} over ${trail}`)
      if (gap === 1 && !credited(task, lead, id))
        want(task, lead, id, `${lead}'s miss keeps ${lead} from beating ${trail}`)
      if (gap === 1 && credited(task, trail, id))
        want(task, trail, id, `${trail}'s credit keeps ${lead} from beating ${trail}`)
    }
  }
}
if (!checks.size) out.push('None: no pair on T2 or T3 is within one tick of the margin.\n')
for (const c of [...checks.values()].sort((a, b) =>
  (a.task + a.arm + a.id.padStart(2, '0')).localeCompare(b.task + b.arm + b.id.padStart(2, '0')),
)) {
  out.push(
    `- **${c.task} item ${c.id}, ${c.arm}: ${credited(c.task, c.arm, c.id) ? 'credited' : 'missed'}.** ${c.why.join('; ')}. ${show(c.task, c.arm, c.id)}`,
  )
}
out.push('')

process.stdout.write(out.join('\n'))
