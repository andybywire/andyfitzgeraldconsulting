// The reverse direction against v5, from a reverse-shortlist.mjs result file. Spends no searches.
//
//   node docs/recommendations-research/reverse-report.mjs scores/reverse-<dataset>-<stamp>.json
//
// Three questions, each answered against v5's forward matrix and tag set:
//
//   1. SYMMETRY. On a document whose whole text is one chunk, both directions compare the same
//      text, so a section scoring a concept should roughly equal the concept scoring the
//      section. How close, across every such document, and how big is the offset between them?
//   2. RECALL. Where do v5's tags rank in each document's reverse list, under four ways of
//      combining its chunks into one score per concept?
//   3. THE HYBRID. Shortlist the top K concepts by reverse score, score only those forward (a
//      narrowed forward query gives the same scores as the full one, so v5's matrix stands in),
//      and run the real tagger. On how many documents is the result exactly v5's tags and slots?
import fs from 'node:fs'
import {ROUND_0, anchored, tagDocument} from './tagger.mjs'

const here = (p) => new URL(p, import.meta.url)
const file = process.argv[2]
if (!file) throw new Error('Usage: reverse-report.mjs <scores/reverse-….json>')
const {results} = JSON.parse(fs.readFileSync(new URL(file, `file://${process.cwd()}/`)))
const m = JSON.parse(
  fs.readFileSync(here('./scores/spike-recommendations-lab-combined-20261106T192359Z.json')),
)
const v5 = JSON.parse(fs.readFileSync(here('./tagsets/v5.json')))
const C = m.concepts
const label = new Map(C.map((c) => [c._id, c.prefLabel]))
const broaderOf = new Map(C.map((c) => [c._id, c.parent]))
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1]
const pct = (xs, p) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * p)]
const pearson = (a, b) => {
  const ua = mean(a),
    ub = mean(b)
  let n = 0,
    da = 0,
    db = 0
  a.forEach((x, i) => {
    n += (x - ua) * (b[i] - ub)
    da += (x - ua) ** 2
    db += (b[i] - ub) ** 2
  })
  return n / Math.sqrt(da * db)
}
const docs = v5.documents
  .filter((d) => results[d._id])
  .map((d) => ({...d, runs: results[d._id].runs}))
const forward = (d) => Object.fromEntries(C.map((c) => [c._id, c.scores[d._id]]))
const same = (a, b) =>
  JSON.stringify(a.map((t) => [t.concept, t.slot])) ===
  JSON.stringify(b.map((t) => [t.concept, t.slot]))
const tagsOf = (raw, ids = C.map((c) => c._id), shift = 0) => {
  const keep = new Set(ids)
  return tagDocument(
    C.filter((c) => keep.has(c._id)).map((c) => ({
      concept: c._id,
      score: anchored(raw[c._id] - shift, c.self, ROUND_0.floor),
    })),
    [],
    broaderOf,
    ROUND_0,
  )
}

const counts = docs.map((d) => d.runs.length)
console.log(
  `${docs.length} documents, ${counts.reduce((a, b) => a + b, 0)} chunks: median ${median(counts)}, max ${Math.max(...counts)}\n`,
)

/* 1. Symmetry, on single-chunk documents. */
const single = docs.filter((d) => d.runs.length === 1)
const rows = single.map((d) => {
  const f = forward(d),
    r = d.runs[0].scores
  const fv = C.map((c) => f[c._id]),
    rv = C.map((c) => r[c._id])
  const offset = mean(rv.map((x, i) => x - fv[i]))
  return {
    d,
    r: pearson(fv, rv),
    offset,
    self: r[d._id],
    asIs: same(tagsOf(r), d.tags),
    shifted: same(tagsOf(r, undefined, offset), d.tags),
  }
})
console.log(`1. SYMMETRY, ${single.length} single-chunk documents`)
console.log(
  `   correlation, forward vs reverse: median ${median(rows.map((x) => x.r)).toFixed(3)}, lowest ${Math.min(...rows.map((x) => x.r)).toFixed(3)}`,
)
console.log(
  `   offset (reverse − forward, raw): median ${median(rows.map((x) => x.offset)).toFixed(3)}, from ${Math.min(...rows.map((x) => x.offset)).toFixed(3)} to ${Math.max(...rows.map((x) => x.offset)).toFixed(3)}`,
)
console.log(
  `   offset against the document's own self-match: correlation ${pearson(
    rows.map((x) => x.offset),
    rows.map((x) => x.self),
  ).toFixed(3)}`,
)
console.log(
  `   v5's tags exactly: as is ${rows.filter((x) => x.asIs).length}, with each document's own offset removed ${rows.filter((x) => x.shifted).length}\n`,
)

/* 2 and 3. Recall, and the hybrid, under four ways of combining chunks. */
const AGG = {
  'best chunk': (xs) => Math.max(...xs),
  'mean of best two': (xs) => mean([...xs].sort((a, b) => b - a).slice(0, 2)),
  'mean of all chunks': (xs) => mean(xs),
  'first chunk only': (xs) => xs[0],
}
const Ks = [5, 8, 10, 12, 15, 20]
console.log('2–3. RECALL AND THE HYBRID: deepest rank of a v5 tag; v5 exactly, shortlisting K')
for (const [name, agg] of Object.entries(AGG)) {
  const deepest = [],
    exact = Ks.map(() => 0)
  for (const d of docs) {
    const rev = Object.fromEntries(C.map((c) => [c._id, agg(d.runs.map((r) => r.scores[c._id]))]))
    const order = Object.entries(rev)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
    deepest.push(Math.max(...d.tags.map((t) => order.indexOf(t.concept) + 1)))
    Ks.forEach((K, i) => {
      if (same(tagsOf(forward(d), order.slice(0, K)), d.tags)) exact[i]++
    })
  }
  console.log(
    `   ${name.padEnd(20)} median ${median(deepest)}, 90th pct ${pct(deepest, 0.9)}, worst ${Math.max(...deepest)} | ${Ks.map((K, i) => `K=${K}: ${exact[i]}`).join(', ')} of ${docs.length}`,
  )
}

const best = AGG['mean of best two']
console.log('\n   v5 tags ranked below 10 (mean of best two):')
for (const d of docs) {
  const rev = Object.fromEntries(C.map((c) => [c._id, best(d.runs.map((r) => r.scores[c._id]))]))
  const order = Object.entries(rev)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
  const ranks = d.tags.map((t) => [label.get(t.concept), order.indexOf(t.concept) + 1])
  if (Math.max(...ranks.map((x) => x[1])) > 10)
    console.log(
      `     ${d.title.trim().slice(0, 44).padEnd(44)} ${d.runs.length} chunks · ${ranks.map(([l, k]) => `${l} #${k}`).join(', ')}`,
    )
}
