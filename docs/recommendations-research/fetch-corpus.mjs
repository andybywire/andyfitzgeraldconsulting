// Fetch the related-content pool from production-26, published perspective, no token.
// Mirrors RELATED_POOL_QUERY's filter, order and topic projection (web/src/sanity/queries/related.ts),
// minus the card fields, plus labels for reporting and the Topic scheme for structure checks.
import {writeFileSync} from 'node:fs'

const query = `{
  "genres": *[_type == "skosConceptScheme" && title == "Genre"][0] {
    "tops": topConcepts[]->{_id, prefLabel},
    "concepts": concepts[]->{_id, prefLabel, "parent": broader[0]._ref}
  },
  "topicScheme": *[_type == "skosConceptScheme" && title == "Topic"][0] {
    title,
    "tops": topConcepts[]->{_id, prefLabel},
    "concepts": concepts[]->{_id, prefLabel, "parents": broader[]._ref}
  },
  "pool": *[
    _type in ["article", "caseStudy", "note", "presentation"]
    && defined(slug.current)
    && defined(pubDate)
  ] | order(pubDate desc) {
    _id, _type, "slug": slug.current, pubDate, title, shortDescription,
    "genreId": genre._ref,
    "genre": genre->prefLabel,
    "topics": topic[]->{
      _id,
      prefLabel,
      "parent": broader[0]._ref,
      "parentIsTop": !defined(broader[0]->broader[0]._ref)
    }
  }
}`

const url =
  'https://7v0qvet6.api.sanity.io/v2026-08-18/data/query/production-26?perspective=published'
const res = await fetch(url, {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({query}),
})
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
const {result} = await res.json()
result.fetchedAt = new Date().toISOString()
writeFileSync(new URL('./corpus.json', import.meta.url), JSON.stringify(result, null, 2))
console.log(
  {
    fetchedAt: result.fetchedAt,
    pool: result.pool.length,
    byType: Object.groupBy(result.pool, (d) => d._type),
    genreTops: result.genres?.tops?.map((t) => t.prefLabel),
    topicScheme: result.topicScheme?.title,
    topicConcepts: result.topicScheme?.concepts?.length,
    topicTops: result.topicScheme?.tops?.map((t) => t.prefLabel),
  },
  (k, v) =>
    k === 'byType' ? Object.fromEntries(Object.entries(v).map(([t, a]) => [t, a.length])) : v,
  2,
)
