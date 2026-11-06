// The score spike: how Sanity's semantic scores behave, before any tagging threshold is set.
//
//   node docs/recommendations-research/score-spike.mjs                    # the lab
//   node docs/recommendations-research/score-spike.mjs --recipe example   # see THE QUERY TEXT
//   DATASET=production-26 node docs/recommendations-research/score-spike.mjs
//   node docs/recommendations-research/score-spike.mjs --recipe combined --base <matrix>   # see INCREMENTAL
//
// One query per Topic concept (68 today, so 68 semantic-search queries against the quota), or,
// with --base, one per new or changed concept plus a control.
// Each query scores every publishable document AND the concept's own skosConcept document.
// Writes the raw matrix to scores/spike-<dataset>-<UTC stamp>.json, or
// scores/spike-<dataset>-<recipe>-<UTC stamp>.json for a recipe other than `definition`, and
// nothing else.
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
// A recipe names the fields joined, by blank lines, into each concept's query:
//
//   definition   prefLabel, definition, scopeNote: rounds 0 and 1, and the default
//   example      prefLabel, example
//   combined     prefLabel, definition, scopeNote, example
//
// Revision 2 added an archetypal `example` to every concept (Andy, 2026-11-05), and asked whether
// it should lead the query, join it, or run as a second query beside the definition, combined by
// mean or max (tagger.mjs → combine). Each recipe runs on its own and writes its own matrix, so
// those can be built and compared from the same files. altLabels stay out of every recipe: their
// role in the query is a separate question. The text sent for each concept is saved in the
// matrix, so a later run can be compared against exactly this one.
//
// ── INCREMENTAL: --base <matrix> ────────────────────────────────────────────────────────────
//
// A later round changes a few concepts, not all of them (plan.md → Phases: "Retag"). With
// --base, a concept whose query text is exactly what the base matrix scored keeps the base's
// scores, and only new or changed concepts are queried: v5 queried 3 of 68. Parents always come
// from the live scheme, because a hierarchy edit changes no query text. It refuses unless the
// base has the same recipe, dataset and documents, since a new document would need every
// concept's score. A bare file name is looked for in scores/.
//
// Reusing scores is also what keeps run-to-run noise out of a round. A full re-run moves every
// score a little (a median of 0.004 raw, measured 2026-11-04), which can flip a tag at a band's
// edge on a concept nobody touched, and the round would then measure the noise along with the
// edit. So one reused concept is queried again as a CONTROL, and its gap from the base is
// recorded. A gap well above that noise means the embeddings moved under the base (Sanity
// re-embedded, or changed its model), and the base should not be reused: run without --base.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'

const RECIPES = {
  definition: ['prefLabel', 'definition', 'scopeNote'],
  example: ['prefLabel', 'example'],
  combined: ['prefLabel', 'definition', 'scopeNote', 'example'],
}
const at = process.argv.indexOf('--recipe')
const RECIPE = at === -1 ? 'definition' : process.argv[at + 1]
const FIELDS = RECIPES[RECIPE]
if (!FIELDS) throw new Error(`Unknown recipe "${RECIPE}". Known: ${Object.keys(RECIPES)}`)
const baseAt = process.argv.indexOf('--base')
const BASE = baseAt === -1 ? null : process.argv[baseAt + 1]
/* Run-to-run noise, and the control gap past which the base is not trusted: five times it. */
const NOISE = 0.004
const DRIFT = 5 * NOISE

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
  "concepts": concepts[]->{_id, prefLabel, definition, scopeNote, example, "parent": broader[0]._ref}
}`)
/* A recipe that reads a field every concept doesn't fill would score some concepts on less text
   than others, so it refuses. */
const unfilled = scheme.concepts.filter((c) =>
  FIELDS.some((f) => f !== 'scopeNote' && !c[f]?.trim()),
)
if (unfilled.length) {
  throw new Error(
    `Recipe "${RECIPE}" needs ${FIELDS}; missing on ${unfilled.map((c) => c.prefLabel)}`,
  )
}
const docs = await groq(
  `*[_type in $types && defined(slug.current) && defined(pubDate)] | order(_type asc, slug.current asc) {
    _id, _type, "slug": slug.current, title, "genre": genre->prefLabel, "tags": coalesce(topic[]._ref, [])
  }`,
  {types: TYPES},
)

const text = (c) =>
  FIELDS.map((f) => c[f])
    .filter((s) => typeof s === 'string' && s.trim())
    .join('\n\n')

const SCORE = `*[(_type in $types && defined(slug.current) && defined(pubDate)) || _id == $self]
  | score(text::semanticSimilarity($q)) {_id, _score}`

/* ── Incremental: the base matrix, checked before any query is spent ── */
const baseFile = BASE
  ? BASE.includes('/')
    ? new URL(BASE, `file://${process.cwd()}/`)
    : new URL(`./scores/${BASE}`, import.meta.url)
  : null
const base = baseFile ? JSON.parse(readFileSync(baseFile)) : null
if (base) {
  const ids = (xs) =>
    xs
      .map((x) => x._id)
      .sort()
      .join()
  if ((base.recipe ?? 'definition') !== RECIPE) {
    throw new Error(`--base is a ${base.recipe ?? 'definition'} matrix; this run is ${RECIPE}`)
  }
  if (base.dataset !== DATASET) throw new Error(`--base scored ${base.dataset}, not ${DATASET}`)
  if (ids(base.docs) !== ids(docs)) {
    throw new Error(
      'The documents differ from --base, so every concept must be scored: drop --base',
    )
  }
}
const reusable = new Map((base?.concepts ?? []).map((c) => [c._id, c]))
const reuse = (c) => (reusable.get(c._id)?.query === text(c) ? reusable.get(c._id) : null)

const concepts = []
const rescored = []
for (const [i, c] of scheme.concepts.entries()) {
  const q = text(c)
  const old = reuse(c)
  if (old) {
    concepts.push({
      _id: c._id,
      prefLabel: c.prefLabel,
      parent: c.parent ?? null,
      query: q,
      self: old.self,
      scores: old.scores,
    })
    continue
  }
  rescored.push(c.prefLabel)
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

/* The control: the first reused concept, queried again and set against the base (see
   INCREMENTAL). Its new scores are not used; only the gap is recorded. */
let control = null
const controlConcept = base && scheme.concepts.find((c) => reuse(c))
if (controlConcept) {
  const old = reuse(controlConcept)
  const rows = await groq(SCORE, {types: TYPES, self: controlConcept._id, q: text(controlConcept)})
  const gaps = rows
    .filter((r) => r._id !== controlConcept._id)
    .map((r) => Math.abs(r._score - old.scores[r._id]))
    .sort((a, b) => a - b)
  const round = (x) => Number(x.toFixed(4))
  control = {
    prefLabel: controlConcept.prefLabel,
    medianGap: round(gaps[gaps.length >> 1]),
    maxGap: round(gaps.at(-1)),
    selfGap: round(Math.abs(rows.find((r) => r._id === controlConcept._id)._score - old.self)),
  }
}

const takenAt = new Date().toISOString()
const stamp = takenAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
/* The default recipe keeps the old name, so tagset.mjs's "newest spike" still finds rounds 0–1. */
const name = RECIPE === 'definition' ? DATASET : `${DATASET}-${RECIPE}`
const file = new URL(`./scores/spike-${name}-${stamp}.json`, import.meta.url)
mkdirSync(new URL('./scores/', import.meta.url), {recursive: true})
writeFileSync(
  file,
  JSON.stringify(
    {
      dataset: DATASET,
      takenAt,
      recipe: RECIPE,
      queryFields: FIELDS,
      ...(base && {base: baseFile.pathname.split('/').pop(), rescored, control}),
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
if (base) {
  console.log(
    `  Re-scored ${rescored.length} of ${concepts.length}: ${rescored.join(', ') || 'none'}`,
  )
  console.log(`  The rest reused from ${baseFile.pathname.split('/').pop()}`)
  if (control) {
    const drifted = control.medianGap > DRIFT
    console.log(
      `  Control, ${control.prefLabel}: median gap ${control.medianGap}, max ${control.maxGap}, ` +
        `self ${control.selfGap} (noise ≈ ${NOISE})` +
        (drifted ? `\n  DRIFT: above ${DRIFT}. Don't reuse this base; run without --base.` : ''),
    )
  }
}
