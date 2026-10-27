// The score spike: how Sanity's semantic scores behave, before any tagging threshold is set.
//
//   node docs/recommendations-research/score-spike.mjs            # the lab
//   DATASET=production-26 node docs/recommendations-research/score-spike.mjs
//
// One query per Topic concept (55 today, so about 55 semantic-search queries against the quota).
// Each query scores every publishable document AND the concept's own skosConcept document.
// Writes the raw matrix to scores/spike-<dataset>-<UTC stamp>.json and nothing else.
// spike-report.mjs does the analysis from that file, so the analysis can be rerun for free.
// Reads only, from a public dataset, so no token is needed.
//
// ── WHY THE CONCEPT'S OWN DOCUMENT IS IN EVERY QUERY ─────────────────────────────────────────
//
// Sanity's `_score` is "opaque, unitless … not comparable across different queries" (its docs).
// A tagger has to compare across queries: one document's score under concept A against its
// score under concept B. Something in each query has to act as a yardstick. The concept's own
// document is the natural one. It is embedded from the concept's label, definition, scope note
// and example (the projection in how.md), so it is the closest thing to a perfect match the
// query can have. Scores are comparable WITHIN a query, so its score can divide the others.
// Whether that works better than normalizing against the corpus is what the spike measures.
//
// ── THE QUERY TEXT ───────────────────────────────────────────────────────────────────────────
//
// prefLabel, definition and scopeNote, joined by blank lines. That is plan.md's spec for round 0.
// Examples are left out until revision 2, and so are altLabels, whose role in the query is a
// separate question. The text sent for each concept is saved in the matrix, so a later run with
// a different recipe can be compared against exactly this one.
import {mkdirSync, writeFileSync} from 'node:fs'

const DATASET = process.env.DATASET ?? 'recommendations-lab'
const TYPES = ['article', 'caseStudy', 'note', 'presentation']
const API = `https://7v0qvet6.api.sanity.io/v2026-08-18/data/query/${DATASET}?perspective=published`

const groq = async (query, params = {}) => {
  const res = await fetch(API, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({query, params}),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return (await res.json()).result
}

const scheme = await groq(`*[_type == "skosConceptScheme" && title == "Topic"][0]{
  "concepts": concepts[]->{_id, prefLabel, definition, scopeNote, "parent": broader[0]._ref}
}`)
const docs = await groq(
  `*[_type in $types && defined(slug.current) && defined(pubDate)] | order(_type asc, slug.current asc) {
    _id, _type, "slug": slug.current, title, "genre": genre->prefLabel, "tags": coalesce(topic[]._ref, [])
  }`,
  {types: TYPES},
)

const text = (c) =>
  [c.prefLabel, c.definition, c.scopeNote]
    .filter((s) => typeof s === 'string' && s.trim())
    .join('\n\n')

const SCORE = `*[(_type in $types && defined(slug.current) && defined(pubDate)) || _id == $self]
  | score(text::semanticSimilarity($q)) {_id, _score}`

const concepts = []
for (const [i, c] of scheme.concepts.entries()) {
  const q = text(c)
  const rows = await groq(SCORE, {types: TYPES, self: c._id, q})
  const scores = Object.fromEntries(
    rows.filter((r) => r._id !== c._id).map((r) => [r._id, r._score]),
  )
  concepts.push({
    _id: c._id,
    prefLabel: c.prefLabel,
    parent: c.parent ?? null,
    query: q,
    self: rows.find((r) => r._id === c._id)?._score ?? null,
    scores,
  })
  process.stdout.write(`\r  ${i + 1}/${scheme.concepts.length} ${c.prefLabel.padEnd(40)}`)
}

const takenAt = new Date().toISOString()
const stamp = takenAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
const file = new URL(`./scores/spike-${DATASET}-${stamp}.json`, import.meta.url)
mkdirSync(new URL('./scores/', import.meta.url), {recursive: true})
writeFileSync(
  file,
  JSON.stringify(
    {
      dataset: DATASET,
      takenAt,
      queryFields: ['prefLabel', 'definition', 'scopeNote'],
      docs,
      concepts,
    },
    null,
    2,
  ) + '\n',
)

const missing = concepts.reduce((n, c) => n + docs.filter((d) => !(d._id in c.scores)).length, 0)
console.log(`\nScored ${docs.length} documents against ${concepts.length} concepts in ${DATASET}.`)
console.log(`  ${file.pathname}`)
console.log(`  Concepts with no self score: ${concepts.filter((c) => c.self == null).length}`)
console.log(`  Document-concept pairs with no score: ${missing}`)
