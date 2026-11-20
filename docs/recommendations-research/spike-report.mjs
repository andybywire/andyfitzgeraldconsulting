// Analyze a score-spike matrix: which normalization lets one threshold serve every concept.
//
//   node docs/recommendations-research/spike-report.mjs [scores/spike-<…>.json]
//
// Reads the newest spike matrix unless one is named, writes report-spike.md, and spends no
// quota: all the querying happened in score-spike.mjs.
//
// ── WHAT A NORMALIZATION HAS TO DO HERE ──────────────────────────────────────────────────────
//
// The tagger compares one document's scores ACROSS concepts: should concept B's tag replace
// concept A's? Each score came from a different query, and Sanity says scores from different
// queries are not comparable. A normalization is good when it makes them comparable. That is
// judged three ways:
//
//   1. GLOBAL AUC. Over every document-concept pair: the chance that a pair Andy tagged by hand
//      outscores one he did not. One threshold for every concept is only meaningful if this is
//      high. 0.5 is chance.
//   2. RECALL@k. For each document, how many of its hand tags land in its top k concepts. That
//      is how slots get filled.
//   3. CORPUS INDEPENDENCE. Whether a pair's normalized score depends on OTHER documents. The
//      tagger is incremental (plan.md), so stored scores must not drift every time something is
//      published. Min-max, z-scores and percentiles all move when the corpus does. A raw score
//      and a ratio to the concept's self-match do not.
//
// ── THE HAND TAGS ARE A WEAK BENCHMARK, AND THAT CUTS ONE WAY ────────────────────────────────
//
// They are what exists, and Andy's M3 review says they are incomplete: older content is
// under-tagged. So a high-scoring pair that is NOT hand-tagged may be a tag that's missing
// rather than a wrong match. That makes every precision-like number here a floor, and the
// comparison BETWEEN normalizations is what to trust, not any absolute value.
import {readFileSync, readdirSync, writeFileSync} from 'node:fs'

const dir = new URL('./scores/', import.meta.url)
const named = process.argv[2]
const file = named
  ? new URL(named, `file://${process.cwd()}/`)
  : new URL(
      readdirSync(dir)
        .filter((n) => n.startsWith('spike-'))
        .sort()
        .at(-1),
      dir,
    )
const spike = JSON.parse(readFileSync(file))
const {docs, concepts} = spike
const label = new Map(concepts.map((c) => [c._id, c.prefLabel]))

/* ── Per-concept statistics over documents ─────────────────────────────────── */
const stats = new Map(
  concepts.map((c) => {
    const v = docs.map((d) => c.scores[d._id]).sort((a, b) => a - b)
    const mean = v.reduce((s, x) => s + x, 0) / v.length
    const sd = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length)
    return [c._id, {min: v[0], max: v.at(-1), median: v[v.length >> 1], mean, sd, sorted: v}]
  }),
)

/* ── The candidates ────────────────────────────────────────────────────────── */

/* The fixed floor for "anchored". It sits just under the lowest score any document got for any
   concept in the first spike (4.98, 2026-10-26), and is then FROZEN, so the scale no longer
   depends on the corpus. 0 means "as unrelated as anything here", 1 means "the concept's own
   words". Floors from 4.5 to 5.5 were tried and all gave AUC 0.765–0.766, so the value moves the
   scale, not the accuracy. If a model update moves the raw scores, re-derive it. */
const FLOOR = 4.9

const NORMS = {
  raw: {independent: true, f: (s) => s},
  'self ratio': {independent: true, f: (s, c) => s / c.self},
  anchored: {independent: true, f: (s, c) => (s - FLOOR) / (c.self - FLOOR)},
  'self-anchored': {independent: false, f: (s, c, st) => (s - st.min) / (c.self - st.min)},
  'min-max': {independent: false, f: (s, c, st) => (s - st.min) / (st.max - st.min)},
  'z-score': {independent: false, f: (s, c, st) => (s - st.mean) / st.sd},
  percentile: {
    independent: false,
    f: (s, c, st) => st.sorted.filter((x) => x <= s).length / st.sorted.length,
  },
}

const pairsFor = (norm) =>
  docs.flatMap((d) =>
    concepts.map((c) => ({
      doc: d,
      concept: c,
      tagged: d.tags.includes(c._id),
      score: norm.f(c.scores[d._id], c, stats.get(c._id)),
    })),
  )

/* Mann-Whitney AUC with average ranks for ties. */
function auc(pairs) {
  const sorted = [...pairs].sort((a, b) => a.score - b.score)
  let rankSumPos = 0
  for (let i = 0; i < sorted.length;) {
    let j = i
    while (j < sorted.length && sorted[j].score === sorted[i].score) j++
    const avg = (i + 1 + j) / 2
    for (let k = i; k < j; k++) if (sorted[k].tagged) rankSumPos += avg
    i = j
  }
  const pos = pairs.filter((p) => p.tagged).length
  const neg = pairs.length - pos
  return (rankSumPos - (pos * (pos + 1)) / 2) / (pos * neg)
}

function recallAt(pairs, k) {
  let hit = 0
  let total = 0
  for (const d of docs.filter((d) => d.tags.length)) {
    const top = pairs
      .filter((p) => p.doc === d)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
    hit += top.filter((p) => p.tagged).length
    total += d.tags.length
  }
  return hit / total
}

/* Within one concept every candidate is a monotone transform of the raw score, so this number
   is the same for all of them: it is the quality of the semantic signal itself, the ceiling a
   normalization works toward when it tries to make the concepts agree with each other. */
const perConceptAuc = (() => {
  const vals = concepts
    .map((c) => pairsFor(NORMS.raw).filter((p) => p.concept === c))
    .filter((ps) => ps.some((p) => p.tagged) && ps.some((p) => !p.tagged))
    .map(auc)
  return {mean: vals.reduce((s, x) => s + x, 0) / vals.length, n: vals.length}
})()

const results = Object.entries(NORMS).map(([name, norm]) => {
  const pairs = pairsFor(norm)
  return {
    name,
    independent: norm.independent,
    auc: auc(pairs),
    r3: recallAt(pairs, 3),
    r4: recallAt(pairs, 4),
    r6: recallAt(pairs, 6),
    pairs,
  }
})

/* ── Report ────────────────────────────────────────────────────────────────── */
const out = []
const p = (s = '') => out.push(s)
const f2 = (x) => x.toFixed(2)
const f3 = (x) => x.toFixed(3)
const hand = docs.reduce((n, d) => n + d.tags.length, 0)

p('# Score spike: how Sanity semantic scores behave across concepts')
p()
p(
  `Matrix \`${file.pathname.split('/').slice(-2).join('/')}\`: ${docs.length} documents × ${concepts.length} Topic concepts from \`${spike.dataset}\`, taken ${spike.takenAt}. Query text per concept: ${spike.queryFields.join(', ')}. ${hand} hand tags on ${docs.filter((d) => d.tags.length).length} documents serve as the benchmark, which is incomplete; see the header of \`spike-report.mjs\`.`,
)
p()
p('## Raw scores are not on one scale')
p()
const medians = concepts.map((c) => stats.get(c._id).median).sort((a, b) => a - b)
const selfs = concepts.map((c) => c.self).sort((a, b) => a - b)
const maxes = concepts.map((c) => stats.get(c._id).max).sort((a, b) => a - b)
const floors = concepts.map((c) => stats.get(c._id).min).sort((a, b) => a - b)
p('| across the 55 concepts | lowest | median | highest |')
p('|---|---|---|---|')
p(`| self-match | ${f2(selfs[0])} | ${f2(selfs[selfs.length >> 1])} | ${f2(selfs.at(-1))} |`)
p(`| best document | ${f2(maxes[0])} | ${f2(maxes[maxes.length >> 1])} | ${f2(maxes.at(-1))} |`)
p(
  `| median document | ${f2(medians[0])} | ${f2(medians[medians.length >> 1])} | ${f2(medians.at(-1))} |`,
)
p(
  `| worst document | ${f2(floors[0])} | ${f2(floors[floors.length >> 1])} | ${f2(floors.at(-1))} |`,
)
p()
p(
  'Every concept has a floor well above zero, and the floor moves from concept to concept. A raw cutoff that suits one concept is below the worst document for another.',
)
p()
p('## Which normalization lets one threshold serve every concept')
p()
p(
  `Within any one concept, every candidate ranks documents identically, so the semantic signal itself is the same for all of them: mean per-concept AUC **${f3(perConceptAuc.mean)}** over the ${perConceptAuc.n} concepts that have hand tags. The candidates differ only in how well they line the concepts up against each other.`,
)
p()
p('| normalization | global AUC | recall@3 | recall@4 | recall@6 | corpus-independent |')
p('|---|---|---|---|---|---|')
for (const r of [...results].sort((a, b) => b.auc - a.auc)) {
  p(
    `| ${r.name} | ${f3(r.auc)} | ${f2(r.r3)} | ${f2(r.r4)} | ${f2(r.r6)} | ${r.independent ? 'yes' : 'no'} |`,
  )
}
p()

/* Threshold tables for the two best corpus-independent candidates and the best overall. */
const best = [...results].sort((a, b) => b.auc - a.auc)
/* Raw and anchored always, because they are the two real choices: raw is what Sanity returns,
   and anchored reads on a 0–1 scale. */
const shown = [...new Set(['raw', 'anchored', best[0].name])]
for (const name of shown) {
  const r = results.find((x) => x.name === name)
  const vals = r.pairs.map((x) => x.score).sort((a, b) => a - b)
  const q = (f) => vals[Math.floor(f * (vals.length - 1))]
  const grid = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95].map(q)
  p(`### Thresholds under "${name}"`)
  p()
  p(
    'Each row is a cutoff, chosen at a percentile of all pairs so the rows are comparable across normalizations. "Tags per document" is how many concepts would clear it, before any `target` cap.',
  )
  p()
  p(
    '| cutoff | pairs above | tags per document (median / 10th–90th) | documents with none | hand tags kept |',
  )
  p('|---|---|---|---|---|')
  let noneAtTenPercent = []
  for (const t of grid) {
    const perDoc = docs.map((d) => [d, r.pairs.filter((x) => x.doc === d && x.score >= t).length])
    if (t === grid[6]) noneAtTenPercent = perDoc.filter(([, n]) => !n).map(([d]) => d)
    const counts = perDoc.map(([, n]) => n).sort((a, b) => a - b)
    const kept = r.pairs.filter((x) => x.tagged && x.score >= t).length
    p(
      `| ${f3(t)} | ${((100 * r.pairs.filter((x) => x.score >= t).length) / r.pairs.length).toFixed(0)}% | ${counts[counts.length >> 1]} (${counts[Math.floor(counts.length * 0.1)]}–${counts[Math.floor(counts.length * 0.9)]}) | ${counts.filter((c) => !c).length} | ${kept}/${hand} |`,
    )
  }
  p()
  p(
    `At the 10% cutoff, these clear nothing: ${noneAtTenPercent.map((d) => `${d.slug} (${d.genre ?? d._type})`).join(', ') || 'none'}.`,
  )
  p()
}

/* Hubs: concepts whose broad wording scores high against everything, crowding top lists. */
const rawPairs = results.find((r) => r.name === 'raw').pairs
const inTop4 = new Map(concepts.map((c) => [c._id, 0]))
for (const d of docs) {
  rawPairs
    .filter((x) => x.doc === d)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .forEach((x) => inTop4.set(x.concept._id, inTop4.get(x.concept._id) + 1))
}
p('## Hubs')
p()
p(
  "A hub is a concept whose wording scores high against most documents, so it shows up in many documents' top 4 whether or not they are about it. Normalizing within each concept (z-score, percentile) is the textbook cure, and it scored worse on recall@k here.",
)
p()
p('| concept | in top 4 of | hand-tagged on | broader concept? |')
p('|---|---|---|---|')
for (const c of [...concepts].sort((a, b) => inTop4.get(b._id) - inTop4.get(a._id)).slice(0, 8)) {
  const isParent = concepts.some((x) => x.parent === c._id)
  p(
    `| ${c.prefLabel} | ${inTop4.get(c._id)} | ${docs.filter((d) => d.tags.includes(c._id)).length} | ${isParent ? 'yes' : ''} |`,
  )
}
p()
p(
  `${[...inTop4.values()].filter((n) => !n).length} of ${concepts.length} concepts are in no document's top 4.`,
)
p()

/* Parent and child together in a top 4: how often the specificity rule would bite. */
const rec = best.find((r) => r.independent)
const parentOf = new Map(concepts.map((c) => [c._id, c.parent]))
const crowded = docs.filter((d) => {
  const top = rec.pairs
    .filter((x) => x.doc === d)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.concept._id)
  return top.some((id) => top.includes(parentOf.get(id)))
}).length
p('## The specificity rule')
p()
p(
  `Under "${rec.name}", **${crowded} of ${docs.length}** documents have a concept and its own broader concept together in their top 4. Each of those is a slot the rule frees.`,
)
p()

p(`## Examples under "${rec.name}"`)
p()
p(
  'Top six concepts per document. ✓ marks a hand tag; hand tags outside the top six are listed after.',
)
p()
for (const slug of [
  'purpose-driven-taxonomy-design',
  'who-kap',
  'proust-and-the-squid',
  'ia-the-current-and-the-future',
  'knowledge-graphs-and-ia',
]) {
  const d = docs.find((x) => x.slug === slug)
  if (!d) continue
  const ranked = rec.pairs.filter((x) => x.doc === d).sort((a, b) => b.score - a.score)
  const top = ranked.slice(0, 6)
  const missed = ranked.map((x, i) => ({...x, rank: i + 1})).filter((x) => x.tagged && x.rank > 6)
  p(`**${d.title}** (${d.genre ?? d._type}), ${d.tags.length} hand tag(s)`)
  p()
  p(top.map((x) => `${x.tagged ? '✓ ' : ''}${x.concept.prefLabel} ${f3(x.score)}`).join(' · '))
  if (missed.length) {
    p()
    p(
      `Hand tags further down: ${missed.map((x) => `${x.concept.prefLabel} (#${x.rank})`).join(', ')}`,
    )
  }
  p()
}

writeFileSync(new URL('./report-spike.md', import.meta.url), out.join('\n') + '\n')
console.log(
  out
    .slice(
      0,
      out.findIndex((l) => l.startsWith('### Thresholds')),
    )
    .join('\n'),
)
