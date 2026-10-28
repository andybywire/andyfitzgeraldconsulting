// Run the tagger over a cached score matrix and write one simulated tag set.
//
//   node docs/recommendations-research/tagset.mjs v0 [scores/spike-<…>.json]
//
// Writes tagsets/<version>.json and prints a summary. Spends no quota and writes to no dataset:
// the scores come from the matrix file, and a tag set is read by the ranker in memory (plan.md →
// Ground rules, and Phases: "Retag").
//
// Round 0's matrix is the score spike. It ran the round-0 query for every concept (prefLabel,
// definition and scopeNote) against every document, which is exactly what a round-0 retag
// would run, so it is reused rather than re-queried. The newest spike is read unless one is named.
import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {ROUND_0, tagCorpus} from './tagger.mjs'

/* One configuration per version. Later rounds add theirs here as they are decided. */
const CONFIGS = {v0: ROUND_0}

const version = process.argv[2]
const config = CONFIGS[version]
if (!config) {
  console.error(`Usage: tagset.mjs <version> [matrix]. Known versions: ${Object.keys(CONFIGS)}`)
  process.exit(1)
}

const dir = new URL('./scores/', import.meta.url)
const named = process.argv[3]
const file = named
  ? new URL(named, `file://${process.cwd()}/`)
  : new URL(
      readdirSync(dir)
        .filter((n) => n.startsWith('spike-'))
        .sort()
        .at(-1),
      dir,
    )
const matrix = JSON.parse(readFileSync(file))
const label = new Map(matrix.concepts.map((c) => [c._id, c.prefLabel]))
const raw = (doc, concept) => matrix.concepts.find((c) => c._id === concept).scores[doc]

const tagged = tagCorpus(matrix, config)

const out = {
  version,
  createdAt: new Date().toISOString(),
  dataset: matrix.dataset,
  matrix: file.pathname.split('/').slice(-2).join('/'),
  config,
  authorTags: 'none: round 0 retags from scratch',
  documents: matrix.docs.map((d) => ({
    _id: d._id,
    _type: d._type,
    slug: d.slug,
    title: d.title,
    tags: tagged.get(d._id).map((t) => ({
      concept: t.concept,
      prefLabel: label.get(t.concept),
      score: t.score === null ? null : Number(t.score.toFixed(4)),
      raw: raw(d._id, t.concept),
      slot: t.slot,
    })),
  })),
}

mkdirSync(new URL('./tagsets/', import.meta.url), {recursive: true})
const target = new URL(`./tagsets/${version}.json`, import.meta.url)
writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`)

/* ── Summary ─────────────────────────────────────────────────────────────── */

const docs = out.documents
const count = (xs) =>
  Object.entries(Object.groupBy(xs, (x) => x)).map(([k, v]) => `${k}: ${v.length}`)
const tags = docs.flatMap((d) => d.tags)

console.log(`Tag set ${version} from ${out.matrix} (${out.dataset}), ${docs.length} documents`)
console.log(`→ ${target.pathname}\n`)
console.log(`Tags per document   ${count(docs.map((d) => d.tags.length)).join(', ')}`)
console.log(`Slots filled        ${count(tags.map((t) => t.slot)).join(', ')}`)

const minimum = docs.filter((d) => d.tags.some((t) => t.slot === 'minimum'))
console.log(`\nOn the minimum (${minimum.length}): the document's best concept, below 0.45`)
for (const d of minimum) {
  const [t] = d.tags
  console.log(`  ${t.score.toFixed(3)}  ${t.prefLabel.padEnd(32)} ${d.title}`)
}

/* What specificity changed: the same run with the hierarchy taken away. */
const flat = tagCorpus(
  {...matrix, concepts: matrix.concepts.map((c) => ({...c, parent: null}))},
  config,
)
const ids = (ts) => ts.map((t) => t.concept).join()
const changed = docs.filter((d) => ids(d.tags) !== ids(flat.get(d._id)))
console.log(`\nDocuments the specificity rule changed: ${changed.length}`)

/* Each broader concept it dropped, beside the child that kept its place, widest gap first. A
   broader concept that outscored its child, or was the document's best match, is worth a look:
   in v0 that was how Navigation Design's definition showed it overlapping Information
   Architecture's (plan.md → Taxonomy revision 1). */
const parent = new Map(matrix.concepts.map((c) => [c._id, c.parent]))
const dropped = matrix.docs.flatMap((d) => {
  const kept = tagged.get(d._id)
  const before = flat.get(d._id)
  return before
    .filter((b) => !kept.some((t) => t.concept === b.concept))
    .flatMap((b) => {
      const [child] = kept
        .filter((t) => parent.get(t.concept) === b.concept)
        .sort((x, y) => y.score - x.score)
      if (!child) return []
      return [
        {d, b, child, best: before[0].concept === b.concept, hand: d.tags.includes(b.concept)},
      ]
    })
})
dropped.sort((x, y) => y.b.score - y.child.score - (x.b.score - x.child.score))
console.log('Broader concepts dropped (gap, broader → child kept):')
for (const {d, b, child, best, hand} of dropped) {
  const flags = `${best ? ' (#1)' : ''}${hand ? ' [hand tag]' : ''}`
  console.log(
    `  ${(b.score - child.score).toFixed(3).padStart(6)}  ${label.get(b.concept)} ${b.score.toFixed(3)}${flags}` +
      ` → ${label.get(child.concept)} ${child.score.toFixed(3)}   ${d.title}`,
  )
}
console.log(
  `  ${dropped.length} dropped; ${dropped.filter((x) => x.b.score > x.child.score).length} outscored ` +
    `their child; ${dropped.filter((x) => x.best).length} were the document's #1 concept`,
)

/* Hubs: how many documents each concept lands on, beside how many Andy tagged by hand. */
const hand = new Map()
for (const d of matrix.docs) for (const c of d.tags) hand.set(c, (hand.get(c) ?? 0) + 1)
const auto = new Map()
for (const t of tags) auto.set(t.concept, (auto.get(t.concept) ?? 0) + 1)
console.log('\nMost-used concepts (v0 / by hand):')
for (const [c, n] of [...auto].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${String(n).padStart(3)} / ${String(hand.get(c) ?? 0).padEnd(3)} ${label.get(c)}`)
}
console.log(`Concepts used at all: ${auto.size} of ${matrix.concepts.length}`)

const handTags = matrix.docs.flatMap((d) => d.tags.map((c) => `${d._id}|${c}`))
const v0Pairs = new Set(docs.flatMap((d) => d.tags.map((t) => `${d._id}|${t.concept}`)))
const kept = handTags.filter((p) => v0Pairs.has(p)).length
console.log(
  `\nHand tags reproduced: ${kept} of ${handTags.length}. v0 tags that are hand tags: ${kept} of ${tags.length}.`,
)
