// The Topic scheme as it stands in the lab, with how much of it is in use, as a CSV for sorting in
// Miro: an input to taxonomy revision 1.
//
//   node docs/recommendations-research/topic-taxonomy.mjs
//
// Writes topic-taxonomy.csv beside itself, one row per concept in tree order: each top concept,
// then its narrower concepts alphabetically, depth first. Reads the lab over the public API with
// no token (plan.md → Ground rules) and spends no quota.
//
// The columns:
//   level            1 for a top concept, 2 for one directly beneath it, and so on
//   top concept      the top concept it sits under
//   broader          its broader concept
//   concept          its prefLabel
//   tagged           resources tagged with it DIRECTLY, in the lab's `topic` fields: the hand
//                    tags. The pool is the ranker's: the four tagged types, published, with a
//                    slug and a pubDate.
//   tagged incl. narrower   resources tagged with it OR anything beneath it. The site's facets
//                    count direct tags only (docs/urls-and-filtering.md), which is why a
//                    mid-level concept can read 0 here and 26 there.
//   v0               resources tag set v0 gave it, for comparison with the hand tags
//   definition, scope note   as written in the scheme
import {readFileSync, writeFileSync} from 'node:fs'
import {API_VERSION, LAB, PROJECT, TAGGED_TYPES} from './lab-api.mjs'

const groq = async (query, params = {}) => {
  const url = `https://${PROJECT}.api.sanity.io/v${API_VERSION}/data/query/${LAB}?perspective=published`
  const res = await fetch(url, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({query, params}),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return (await res.json()).result
}

const {scheme, pool} = await groq(
  `{
    "scheme": *[_type == "skosConceptScheme" && title == "Topic"][0] {
      "tops": topConcepts[]->{_id, prefLabel, definition, scopeNote},
      "concepts": concepts[]->{_id, prefLabel, definition, scopeNote, "parents": broader[]._ref}
    },
    "pool": *[_type in $types && defined(slug.current) && defined(pubDate)] {
      _id, "topics": topic[]._ref
    }
  }`,
  {types: TAGGED_TYPES},
)

const v0 = JSON.parse(readFileSync(new URL('./tagsets/v0.json', import.meta.url)))

const tops = scheme.tops.filter(Boolean)
const all = [...tops, ...scheme.concepts.filter(Boolean)]
const byId = new Map(all.map((c) => [c._id, c]))
const children = new Map()
for (const c of scheme.concepts.filter(Boolean)) {
  for (const parent of c.parents ?? []) {
    children.set(parent, [...(children.get(parent) ?? []), c])
  }
}

/* Direct counts, from the lab's tags and from v0. */
const count = (rows) => {
  const n = new Map()
  for (const ids of rows) for (const id of new Set(ids)) n.set(id, (n.get(id) ?? 0) + 1)
  return n
}
const tagged = count(pool.map((d) => (d.topics ?? []).filter(Boolean)))
const inV0 = count(v0.documents.map((d) => d.tags.map((t) => t.concept)))

/** A concept and everything beneath it. */
const subtree = (id) => [id, ...(children.get(id) ?? []).flatMap((c) => subtree(c._id))]
const rollUp = (id) => {
  const ids = new Set(subtree(id))
  return pool.filter((d) => (d.topics ?? []).some((t) => ids.has(t))).length
}

const rows = []
const byLabel = (a, b) => a.prefLabel.localeCompare(b.prefLabel)
const walk = (concept, level, top, broader) => {
  rows.push({concept, level, top, broader})
  for (const child of [...(children.get(concept._id) ?? [])].sort(byLabel)) {
    walk(child, level + 1, top, concept)
  }
}
for (const top of tops) walk(top, 1, top, null)

/* Every concept in the scheme should be reachable from a top concept. Say so if one is not,
   rather than leave it out of the sort. */
const placed = new Set(rows.map((r) => r.concept._id))
for (const c of all.filter((c) => !placed.has(c._id))) {
  rows.push({concept: c, level: '?', top: null, broader: byId.get(c.parents?.[0]) ?? null})
}

const csv = (value) => {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}
const header = [
  'level',
  'top concept',
  'broader',
  'concept',
  'tagged',
  'tagged incl. narrower',
  'v0',
  'definition',
  'scope note',
]
const lines = rows.map(({concept, level, top, broader}) =>
  [
    level,
    top?.prefLabel,
    broader?.prefLabel,
    concept.prefLabel,
    tagged.get(concept._id) ?? 0,
    rollUp(concept._id),
    inV0.get(concept._id) ?? 0,
    concept.definition,
    concept.scopeNote,
  ]
    .map(csv)
    .join(','),
)
writeFileSync(
  new URL('./topic-taxonomy.csv', import.meta.url),
  [header.join(','), ...lines].join('\n') + '\n',
)

const levels = Object.entries(Object.groupBy(rows, (r) => r.level))
  .map(([l, rs]) => `level ${l}: ${rs.length}`)
  .join(', ')
const unused = rows.filter((r) => !(tagged.get(r.concept._id) ?? 0) && r.level !== 1)
console.log(
  `${rows.length} concepts (${levels}) over ${pool.length} resources in ${LAB} → topic-taxonomy.csv`,
)
console.log(`Below the top level, ${unused.length} have no direct hand tag.`)
