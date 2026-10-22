// M3: where Sanity dataset embeddings diverge from the intended set (the site's own ranker).
// Run fetch-corpus.mjs first, so both sides read the same corpus.
//
// text::semanticSimilarity() compares a query STRING to document embeddings; GROQ has no
// document-to-document similarity. So "related to X" here is what a reader would build:
// X's title and summary as the query, every other publishable document scored against it.
// One request per page scores the whole pool, and both comparisons derive from it.
import {readFileSync, writeFileSync} from 'node:fs'
import {branchForType, genresForBranch, rankRelated} from '../../web/src/lib/related.ts'

/* The dataset comes from corpus.json, never from the environment — see fetch-corpus.mjs. A corpus
   written before the field existed came from production-26. */
const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url)))
const DATASET = corpus.dataset ?? 'production-26'
/* production-26 keeps the committed report's name; any other dataset writes beside it. */
const reportFile = `./report-m3${DATASET === 'production-26' ? '' : `.${DATASET}`}.md`

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

const {pool, genres} = corpus
const byId = new Map(pool.map((d) => [d._id, d]))

/* Presentations carry no shortDescription; their summary is the meta `description`. */
const summaries = new Map(
  (
    await groq(
      `*[_id in $ids]{_id, "s": select(_type == "presentation" => description, shortDescription)}`,
      {
        ids: pool.map((d) => d._id),
      },
    )
  ).map((r) => [r._id, r.s]),
)

const SCORE = `*[
  _type in ["article", "caseStudy", "note", "presentation"]
  && defined(slug.current) && defined(pubDate) && _id != $self
] | score(text::semanticSimilarity($q)) | order(_score desc) {_id, _score}`

const topicsOf = (d) => (d.topics ?? []).filter((t) => t && t._id)
function tier(self, c) {
  let shared = 0,
    nearer = 0,
    sibling = 0
  for (const a of topicsOf(self))
    for (const b of topicsOf(c)) {
      if (a._id === b._id) {
        shared++
        continue
      }
      if (a.parent === b._id || b.parent === a._id) {
        nearer++
        continue
      }
      if (a.parent && a.parent === b.parent && !a.parentIsTop && !b.parentIsTop) sibling++
    }
  return shared ? 'shared' : nearer ? 'nearer' : sibling ? 'sibling' : null
}

const rows = []
for (const self of pool) {
  const branch = branchForType(self._type)
  const eligible = genresForBranch(branch, genres.tops, genres.concepts)
  const isEligible = (d) => d.genreId && eligible.has(d.genreId)
  const intended = rankRelated({_id: self._id, topics: self.topics}, pool, eligible)

  const q = [self.title, summaries.get(self._id)].filter(Boolean).join('. ')
  const ranked = (await groq(SCORE, {self: self._id, q}))
    .map((r) => byId.get(r._id))
    .filter(Boolean)
  const embEligible = ranked.filter(isEligible)
  const embElig3 = embEligible.slice(0, 3)
  const embAll3 = ranked.slice(0, 3)

  const intendedIds = intended.items.map((d) => d._id)
  rows.push({
    self,
    q,
    fallback: intended.isFallback,
    intended: intended.items,
    embElig3,
    embAll3,
    overlap: embElig3.filter((d) => intendedIds.includes(d._id)).length,
    embRank: (id) => embEligible.findIndex((d) => d._id === id) + 1,
    tierOf: (d) => tier(self, d),
    crossBranch: embAll3.filter((d) => !isEligible(d)),
  })
}

/* ── Report ─────────────────────────────────────────────────────────────────── */
const out = []
const p = (s = '') => out.push(s)
const name = (d) => `${d.title} *(${d.genre ?? d._type})*`
const groups = {
  Insights: rows.filter((r) => r.self._type !== 'presentation'),
  Presentations: rows.filter((r) => r.self._type === 'presentation'),
}

p(`# Related content: M3, embeddings vs the intended set`)
p()
p(
  `Dataset \`${DATASET}\`. Corpus fetched ${corpus.fetchedAt}; embeddings queried ${new Date().toISOString()}. Intended set = the site's ranker. Embeddings = \`text::semanticSimilarity()\` with each page's title + summary as the query.`,
)
p()
for (const [g, rs] of Object.entries(groups)) {
  const related = rs.filter((r) => !r.fallback)
  const dist = [3, 2, 1, 0]
    .map((n) => `${n}/3: ${related.filter((r) => r.overlap === n).length}`)
    .join(', ')
  p(`## ${g} (${rs.length} pages)`)
  p()
  p(
    `- Agreement on "Related" pages (same branch, how many of the taxonomy's cards embeddings also pick): ${dist}`,
  )
  p(
    `- Embedding picks with NO taxonomy relation at all (inside the eligible branch): ${related.reduce((n, r) => n + r.embElig3.filter((d) => !r.tierOf(d)).length, 0)} of ${related.reduce((n, r) => n + r.embElig3.length, 0)}`,
  )
  p(
    `- Without genre partitioning, embeddings' top 3 cross the branch on ${rs.filter((r) => r.crossBranch.length).length} pages (${rs.reduce((n, r) => n + r.crossBranch.length, 0)} cards)`,
  )
  const sameGenre = (r, list) => list.filter((d) => d.genreId === r.self.genreId).length
  const tCards = related.reduce((n, r) => n + r.intended.length, 0)
  const eCards = related.reduce((n, r) => n + r.embElig3.length, 0)
  p(
    `- Cards sharing the page's own genre: taxonomy ${related.reduce((n, r) => n + sameGenre(r, r.intended), 0)} of ${tCards}, embeddings ${related.reduce((n, r) => n + sameGenre(r, r.embElig3), 0)} of ${eCards}`,
  )
  const tiers = {shared: 0, nearer: 0, sibling: 0, none: 0}
  for (const r of related) for (const d of r.embElig3) tiers[r.tierOf(d) ?? 'none']++
  p(`- Embedding picks by taxonomy tier: ${JSON.stringify(tiers)}`)
  const ranks = related
    .flatMap((r) => r.intended.map((d) => r.embRank(d._id)))
    .filter(Boolean)
    .sort((a, b) => a - b)
  p(
    `- Where embeddings rank the taxonomy's cards (same branch): median ${ranks[Math.floor(ranks.length / 2)]}, range ${ranks[0]}–${ranks.at(-1)}`,
  )
  p(
    `- "Recent" fallback pages, where embeddings offer something the taxonomy can't: ${
      rs
        .filter((r) => r.fallback)
        .map((r) => r.self.slug)
        .join(', ') || 'none'
    }`,
  )
  p()
}
p(`## For review, least agreement first`)
p()
p(
  `Each block: the taxonomy's cards (with tier) beside the embeddings' top 3 in the same branch (with the taxonomy's view of each). "Unrestricted" lists embeddings' picks outside the branch. Your call goes on the last line.`,
)
p()
const order = [...rows].sort(
  (a, b) => (a.fallback ? -1 : a.overlap) - (b.fallback ? -1 : b.overlap),
)
for (const r of order) {
  if (!r.fallback && r.overlap === 3) continue
  p(`### ${name(r.self)} — ${r.fallback ? 'taxonomy shows "Recent"' : `agree ${r.overlap}/3`}`)
  p()
  p(`Query: "${r.q.replace(/\s+/g, ' ').slice(0, 220)}${r.q.length > 220 ? '…' : ''}"`)
  p()
  p(`| | Taxonomy | Embeddings, same branch |`)
  p(`|---|---|---|`)
  for (let i = 0; i < 3; i++) {
    const t = r.fallback ? null : r.intended[i]
    const e = r.embElig3[i]
    const tCell = t
      ? `${name(t)} — ${r.tierOf(t)}; embeddings rank ${r.embRank(t._id) || '—'}`
      : r.fallback && r.intended[i]
        ? `*(Recent)* ${name(r.intended[i])}`
        : '—'
    const eCell = e ? `${name(e)} — taxonomy: ${r.tierOf(e) ?? 'no relation'}` : '—'
    p(`| ${i + 1} | ${tCell} | ${eCell} |`)
  }
  p()
  if (r.crossBranch.length)
    p(`Unrestricted, outside the branch: ${r.crossBranch.map(name).join('; ')}`)
  p()
  p(`**Your call:** `)
  p()
}
const agreeAll = rows.filter((r) => !r.fallback && r.overlap === 3).map((r) => r.self.slug)
p(`## Full agreement (${agreeAll.length} pages, not listed above)`)
p()
p(agreeAll.join(', '))
writeFileSync(new URL(reportFile, import.meta.url), out.join('\n') + '\n')
console.log(out.slice(0, out.indexOf('## For review, least agreement first')).join('\n'))
