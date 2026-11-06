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
// A later round re-runs score-spike.mjs against the revised scheme, so its matrix is a spike file
// too: v1's is spike-recommendations-lab-20261103T011931Z.json, every concept re-scored, since
// revision 1 rewrote nearly every definition.
//
// Revision 2 runs three candidates from the same scores (Andy, 2026-11-05), all with round 0's
// bands, and only one goes into M3.2:
//
//   node docs/recommendations-research/tagset.mjs v2-combined   # one query: definition + example
//   node docs/recommendations-research/tagset.mjs v2-mean       # two queries, mean of anchored
//   node docs/recommendations-research/tagset.mjs v2-max        # two queries, max of anchored
//
// The two-query versions read a `definition` matrix and an `example` matrix and give each concept
// both (tagger.mjs → tagCorpus, `queries`). Matrices named on the command line are taken in the
// version's recipe order; otherwise the newest matrix of each recipe is read.
import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {TAXONOMY_CROSS_RELAXED} from './baseline-columns.mjs'
import {ROUND_0, tagCorpus} from './tagger.mjs'

/* One configuration per version, with the query recipe(s) its matrix comes from. Later rounds add
   theirs here as they are decided. v1 holds round 0's configuration on purpose, so a change
   between v0 and v1 comes from the vocabulary, not from the tagger. The floor still fits: v1's
   lowest raw score is 4.99 against v0's 4.98. The v2 candidates keep the bands too, so they
   differ from each other only in how the example enters the score.

   v2 is v2-combined (Andy, 2026-11-05): one query per concept with the example inside it. It
   kept v1's tag volume and hand-tag share while fixing Sanity's over-application. v2-mean came
   closer to Andy's M3.1 picks, but added 17% more tags, partly because example queries score on
   a looser scale (plan.md → Phase 3). The candidates stay here as the record of the choice.

   v3 is v2's tags under a relaxed crossing rule (Andy, 2026-11-05). Its tags must be v2's, so it
   pins v2's matrix rather than reading the newest one, and it records `crossRule`, which
   m3-report.mjs ranks its column under (baseline-columns.mjs → TAXONOMY_CROSS_RELAXED). A
   version without one is ranked under TAXONOMY_CROSS. */
const VERSIONS = {
  v0: {config: ROUND_0, recipes: ['definition']},
  v1: {config: ROUND_0, recipes: ['definition']},
  v2: {config: ROUND_0, recipes: ['combined']},
  v3: {
    config: ROUND_0,
    recipes: ['combined'],
    matrices: ['spike-recommendations-lab-combined-20261105T191152Z.json'],
    crossRule: TAXONOMY_CROSS_RELAXED,
  },
  'v2-combined': {config: ROUND_0, recipes: ['combined']},
  'v2-mean': {config: {...ROUND_0, combine: 'mean'}, recipes: ['definition', 'example']},
  'v2-max': {config: {...ROUND_0, combine: 'max'}, recipes: ['definition', 'example']},
}

const version = process.argv[2]
const {config, recipes, matrices: pinned, crossRule} = VERSIONS[version] ?? {}
if (!config) {
  console.error(`Usage: tagset.mjs <version> [matrix …]. Known versions: ${Object.keys(VERSIONS)}`)
  process.exit(1)
}

/* A matrix's recipe is in the file; rounds 0 and 1 predate the field and are `definition`. */
const dir = new URL('./scores/', import.meta.url)
const named = process.argv.slice(3)
const files = named.length
  ? named.map((n) => new URL(n, `file://${process.cwd()}/`))
  : pinned
    ? pinned.map((n) => new URL(n, dir))
    : recipes.map((recipe) => {
        const newest = readdirSync(dir)
          .filter((n) => n.startsWith('spike-'))
          .sort()
          .reverse()
          .find(
            (n) => (JSON.parse(readFileSync(new URL(n, dir))).recipe ?? 'definition') === recipe,
          )
        if (!newest) throw new Error(`No ${recipe} matrix in scores/`)
        return new URL(newest, dir)
      })
if (files.length !== recipes.length) {
  throw new Error(`${version} reads ${recipes.length} matrices (${recipes}); given ${files.length}`)
}
const matrices = files.map((f) => JSON.parse(readFileSync(f)))
matrices.forEach((m, i) => {
  if ((m.recipe ?? 'definition') !== recipes[i]) {
    throw new Error(
      `${files[i].pathname} is a ${m.recipe ?? 'definition'} matrix, not ${recipes[i]}`,
    )
  }
})

/* One matrix as it is, or several merged: every concept carries one {self, scores} per query.
   They must score the same documents and the same concepts, or the combination is meaningless. */
const key = (xs) =>
  xs
    .map((x) => x._id)
    .sort()
    .join()
for (const m of matrices.slice(1)) {
  if (key(m.docs) !== key(matrices[0].docs) || key(m.concepts) !== key(matrices[0].concepts)) {
    throw new Error('The matrices score different documents or concepts')
  }
}
const matrix =
  matrices.length === 1
    ? matrices[0]
    : {
        ...matrices[0],
        concepts: matrices[0].concepts.map((c) => ({
          _id: c._id,
          prefLabel: c.prefLabel,
          parent: c.parent,
          queries: matrices.map((m) => {
            const q = m.concepts.find((x) => x._id === c._id)
            return {recipe: m.recipe, self: q.self, scores: q.scores}
          }),
        })),
      }
const label = new Map(matrix.concepts.map((c) => [c._id, c.prefLabel]))
/* The raw score behind a tag, or one per query for a combined run. */
const raw = (doc, concept) => {
  const c = matrix.concepts.find((x) => x._id === concept)
  return c.queries ? c.queries.map((q) => q.scores[doc]) : c.scores[doc]
}

const tagged = tagCorpus(matrix, config)

const out = {
  version,
  createdAt: new Date().toISOString(),
  dataset: matrix.dataset,
  matrix: files.map((f) => f.pathname.split('/').slice(-2).join('/')).join(' + '),
  config,
  ...(crossRule && {crossRule}),
  authorTags: 'none: every round retags from scratch (plan.md → Open questions)',
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
console.log(`\nMost-used concepts (${version} / by hand):`)
for (const [c, n] of [...auto].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${String(n).padStart(3)} / ${String(hand.get(c) ?? 0).padEnd(3)} ${label.get(c)}`)
}
console.log(`Concepts used at all: ${auto.size} of ${matrix.concepts.length}`)

const handTags = matrix.docs.flatMap((d) => d.tags.map((c) => `${d._id}|${c}`))
const v0Pairs = new Set(docs.flatMap((d) => d.tags.map((t) => `${d._id}|${t.concept}`)))
const kept = handTags.filter((p) => v0Pairs.has(p)).length
console.log(
  `\nHand tags reproduced: ${kept} of ${handTags.length}. ${version} tags that are hand tags: ${kept} of ${tags.length}.`,
)
