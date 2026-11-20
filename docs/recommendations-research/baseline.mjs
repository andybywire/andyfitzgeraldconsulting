// The embeddings-only baseline: what Sanity's semantic search alone would recommend, no taxonomy.
//
//   node docs/recommendations-research/baseline.mjs     # the lab; DATASET=production-26 for live
//
// One query per page (73 today, so about 73 semantic-search queries against the quota). Each query
// scores every publishable document. The raw rankings are saved to
// scores/baseline-<dataset>-<UTC stamp>.json, and baseline-columns.mjs derives the M3 columns from
// that file without spending anything. Computed once and reused: the experiment changes tags and
// concepts, never the text these queries read. Reads only, from a public dataset, so no token.
//
// ── THE QUERY IS A DOCUMENT'S OPENING, CAPPED AT 2,500 CHARACTERS ────────────────────────────
//
// GROQ cannot compare two documents directly. `text::semanticSimilarity()` scores a query STRING
// against stored embeddings, so "documents like this one" has to be a search with this one's
// text. A fair baseline gives that search the best text reasonably available: title, summary and
// the opening of the body (Andy, 2026-10-26). A title alone would make it a strawman.
//
// The cap is MEASURED, not chosen (2026-10-26, on the 30,944-character self-hosting-sanity-studio):
// a query's score against its own source rose up to about 2,000 characters and then went flat,
// and everything from 2,500 to 31,000 characters landed within the run-to-run noise. Identical
// queries differ by up to 0.003. Sanity raised no error at any length; the extra text is simply
// not read. So 2,500 is "everything the query can see", and sending more would only hide that.
//
// The body is `bodyText` for articles, notes and presentations. Case studies have none, so their
// sections stand in, in page order. `pt::text()` reads the words and skips figures, which suits a
// query better than alt text would.
//
// ── THE PAGE'S OWN DOCUMENT IS SCORED TOO ────────────────────────────────────────────────────
//
// It is the best match its own text can have, so it is the yardstick that anchors the other
// scores, as the concept's own document did in the score spike. "Same rules" needs it to decide
// when a match from the other category is strong enough to cross.
import {mkdirSync, writeFileSync} from 'node:fs'

const DATASET = process.env.DATASET ?? 'recommendations-lab'
const TYPES = ['article', 'caseStudy', 'note', 'presentation']
const MAX_QUERY_CHARS = 2500
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

const POOL = `_type in $types && defined(slug.current) && defined(pubDate)`

const docs = await groq(
  `*[${POOL}] | order(_type asc, slug.current asc) {
    _id, _type, "slug": slug.current, title, "genre": genre->prefLabel,
    "summary": select(_type == "presentation" => description, shortDescription),
    "body": select(
      _type == "caseStudy" => array::join(array::compact([
        pt::text(atGlance), pt::text(whatDid), pt::text(projectGoal),
        pt::text(projectApproach), pt::text(projectOutcome)
      ]), "\\n\\n"),
      pt::text(bodyText)
    )
  }`,
  {types: TYPES},
)

const SCORE = `*[${POOL}] | score(text::semanticSimilarity($q)) {_id, _score}`

const pages = []
for (const [i, d] of docs.entries()) {
  const query = [d.title, d.summary, d.body]
    .filter((s) => typeof s === 'string' && s.trim())
    .join('\n\n')
    .slice(0, MAX_QUERY_CHARS)
  const rows = await groq(SCORE, {types: TYPES, q: query})
  const scores = Object.fromEntries(rows.map((r) => [r._id, r._score]))
  pages.push({
    _id: d._id,
    _type: d._type,
    slug: d.slug,
    title: d.title,
    genre: d.genre ?? null,
    query,
    self: scores[d._id] ?? null,
    scores,
  })
  process.stdout.write(`\r  ${i + 1}/${docs.length} ${d.slug.slice(0, 50).padEnd(50)}`)
}

const takenAt = new Date().toISOString()
const stamp = takenAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
const file = new URL(`./scores/baseline-${DATASET}-${stamp}.json`, import.meta.url)
mkdirSync(new URL('./scores/', import.meta.url), {recursive: true})
writeFileSync(
  file,
  JSON.stringify(
    {
      dataset: DATASET,
      takenAt,
      queryRecipe: {fields: ['title', 'summary', 'body opening'], maxChars: MAX_QUERY_CHARS},
      pages,
    },
    null,
    2,
  ) + '\n',
)

const short = pages.filter((p) => p.query.length < 500)
console.log(`\nRanked ${pages.length} pages against ${docs.length} documents in ${DATASET}.`)
console.log(`  ${file.pathname}`)
console.log(`  Pages with no self score: ${pages.filter((p) => p.self == null).length}`)
console.log(
  `  Pages missing any score: ${pages.filter((p) => Object.keys(p.scores).length !== docs.length).length}`,
)
console.log(
  `  Queries under 500 characters: ${short.length}${short.length ? ' — ' + short.map((p) => `${p.slug} (${p.query.length})`).join(', ') : ''}`,
)
