// M1 (tier contribution vs flat shared tags) and M2 (Dice vs Jaccard ordering) over corpus.json.
// The intended set comes from the site's own ranker; `compare` below is a copy of the private
// function in web/src/lib/related.ts, checked against rankRelated before anything is reported.
import {readFileSync, writeFileSync} from 'node:fs'
import {branchForType, genresForBranch, rankRelated} from '../../web/src/lib/related.ts'

const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url)))
const {pool, genres, topicScheme} = corpus
const byId = new Map(pool.map((d) => [d._id, d]))
const topicsOf = (d) => (d.topics ?? []).filter((t) => t && t._id)
const ids = (d) => new Set(topicsOf(d).map((t) => t._id))

/* Pair counts per tier, exactly as lib/related.ts counts them (before normalizing). */
function counts(mine, theirs) {
  let shared = 0,
    nearer = 0,
    sibling = 0
  for (const a of mine)
    for (const b of theirs) {
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
  return {shared, nearer, sibling}
}

/* The three-tier ranker with a choice of denominator. 'jaccard' is the site's; 'dice' divides by
   |A| + |B| and doubles the shared tier, as the 2025 GROQ `relatedness` did. */
function rankTiers(self, candidates, norm) {
  const A = ids(self)
  const scored = []
  for (const c of candidates) {
    const B = ids(c)
    if (!A.size || !B.size) continue
    const k = counts(topicsOf(self), topicsOf(c))
    if (!(k.shared || k.nearer || k.sibling)) continue
    const union = new Set([...A, ...B]).size || 1
    const d = norm === 'dice' ? A.size + B.size : union
    const s = norm === 'dice' ? (2 * k.shared) / d : k.shared / d
    scored.push({c, k, shared: s, nearer: k.nearer / d, sibling: k.sibling / d})
  }
  scored.sort((a, b) => b.shared - a.shared || b.nearer - a.nearer || b.sibling - a.sibling)
  return scored
}

/* Flat shared-tag overlap: the common approach (array::intersects + a count), ordered by count
   then date. Same eligibility as the site, so only the hierarchy differs. */
function rankFlat(self, candidates) {
  const A = ids(self)
  return candidates
    .map((c) => ({c, n: [...ids(c)].filter((x) => A.has(x)).length}))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
}

function rankFlatRatio(self, candidates) {
  const A = ids(self)
  return candidates
    .map((c) => {
      const B = ids(c)
      const n = [...B].filter((x) => A.has(x)).length
      return {c, n, r: n / (new Set([...A, ...B]).size || 1)}
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.r - a.r)
}

const tierOf = (k) => (k.shared ? 'shared' : k.nearer ? 'nearer' : 'sibling')
const label = (d) => `${d.title} (${d.genre ?? 'no genre'})`

const rows = []
let copyMismatch = 0
const m2 = {fullSame: 0, fullDiff: [], top3Same: 0}

for (const self of pool) {
  const branch = branchForType(self._type)
  const eligible = genresForBranch(branch, genres.tops, genres.concepts)
  const candidates = pool.filter((c) => c._id !== self._id && c.genreId && eligible.has(c.genreId))

  const intended = rankRelated({_id: self._id, topics: self.topics}, pool, eligible)
  const tiers = rankTiers(self, candidates, 'jaccard')
  const dice = rankTiers(self, candidates, 'dice')
  const flat = rankFlat(self, candidates)
  const flatRatio = rankFlatRatio(self, candidates)

  /* Guard: the copied compare must reproduce the real ranker, or nothing below means anything. */
  const intendedIds = intended.items.map((d) => d._id)
  const copyIds = intended.isFallback
    ? candidates.slice(0, 3).map((d) => d._id)
    : tiers.slice(0, 3).map((s) => s.c._id)
  if (intendedIds.join() !== copyIds.join()) copyMismatch++

  const jOrder = tiers.map((s) => s.c._id).join()
  const dOrder = dice.map((s) => s.c._id).join()
  if (jOrder === dOrder) m2.fullSame++
  else m2.fullDiff.push(self.slug)
  if (
    tiers
      .slice(0, 3)
      .map((s) => s.c._id)
      .join() ===
    dice
      .slice(0, 3)
      .map((s) => s.c._id)
      .join()
  )
    m2.top3Same++

  const A = ids(self)
  const cards = intended.isFallback
    ? []
    : tiers.slice(0, 3).map((s) => ({
        id: s.c._id,
        tier: tierOf(s.k),
        k: s.k,
        sharesATag: [...ids(s.c)].some((x) => A.has(x)),
      }))
  const flatTop = flat.slice(0, 3).map((x) => x.c._id)
  const ratioTop = flatRatio.slice(0, 3).map((x) => x.c._id)
  const tierTop = intended.isFallback ? [] : cards.map((c) => c.id)
  const diff = (a, b) => a.filter((x) => !b.includes(x)).length

  rows.push({
    self,
    branch,
    eligibleCount: candidates.length,
    topicCount: A.size,
    fallback: intended.isFallback,
    cards,
    scoredCount: tiers.length,
    flatCount: flat.length,
    flatTop,
    intendedNotInFlat: cards.filter((c) => !flatTop.includes(c.id)).length,
    unreachableByFlat: cards.filter((c) => !c.sharesATag).length,
    normalizationChanges: diff(ratioTop, flatTop),
    hierarchyChanges: diff(tierTop, ratioTop),
    hierarchyFills: cards.filter((c) => !c.sharesATag).length,
    hierarchyReorders: diff(tierTop, ratioTop) - cards.filter((c) => !c.sharesATag).length,
    orderChanged: tierTop.join() !== ratioTop.join(),
  })
}

/* ── Summaries ─────────────────────────────────────────────────────────────── */
const pages = rows.length
const sum = (f) => rows.reduce((n, r) => n + f(r), 0)
const groups = {
  insights: rows.filter((r) => r.branch !== 'presentation'),
  presentations: rows.filter((r) => r.branch === 'presentation'),
}
const cardsIn = (rs) => rs.flatMap((r) => r.cards)
const tierCounts = (rs) => {
  const c = {shared: 0, nearer: 0, sibling: 0}
  for (const x of cardsIn(rs)) c[x.tier]++
  return c
}
const dist = (rs, f) => {
  const d = {3: 0, 2: 0, 1: 0, 0: 0}
  for (const r of rs) d[Math.min(3, f(r))]++
  return d
}

/* Precondition context: untagged documents, top-concept tags, polyhierarchy. */
const topIds = new Set((topicScheme.tops ?? []).map((t) => t._id))
const untagged = pool.filter((d) => !ids(d).size)
const taggedAtTop = pool.filter((d) => [...ids(d)].some((x) => topIds.has(x)))
const multiParent = (topicScheme.concepts ?? []).filter((c) => (c.parents ?? []).length > 1)
const dupTopics = pool.filter((d) => topicsOf(d).length !== ids(d).size)

const out = []
const p = (s = '') => out.push(s)
p(`# Related content: M1 and M2`)
p()
p(
  `Corpus fetched ${corpus.fetchedAt} from \`production-26\`, published perspective. ${pages} documents render a Related band.`,
)
p()
p(
  `Guard: the copied tier logic reproduced \`rankRelated\` on ${pages - copyMismatch} of ${pages} pages.`,
)
p()
for (const [name, rs] of Object.entries(groups)) {
  const t = tierCounts(rs)
  const total = t.shared + t.nearer + t.sibling
  p(`## ${name} (${rs.length} pages)`)
  p()
  p(
    `- Related (not fallback): ${rs.filter((r) => !r.fallback).length}; "Recent" fallback: ${rs.filter((r) => r.fallback).length}`,
  )
  p(
    `- Cards shown under "Related": ${total} — shared ${t.shared}, nearer ${t.nearer}, sibling ${t.sibling}`,
  )
  p(
    `- Cards reached ONLY through the hierarchy (no tag in common with the page): ${rs.reduce((n, r) => n + r.unreachableByFlat, 0)}`,
  )
  p(
    `- Pages by card count, hierarchy ranker: ${JSON.stringify(dist(rs, (r) => (r.fallback ? 0 : r.cards.length)))}`,
  )
  p(`- Pages by card count, flat shared tags: ${JSON.stringify(dist(rs, (r) => r.flatCount))}`)
  p(
    `- Pages where flat tags would show "Recent" (no shared tag with anything eligible): ${rs.filter((r) => r.flatCount === 0).length}`,
  )
  p(
    `- Intended cards that flat tags' top 3 (raw count) would drop: ${rs.reduce((n, r) => n + r.intendedNotInFlat, 0)}, which is two effects:`,
  )
  p(
    `  - normalization (raw count -> shared/union ratio) changes ${rs.reduce((n, r) => n + r.normalizationChanges, 0)} cards on ${rs.filter((r) => r.normalizationChanges).length} pages`,
  )
  p(
    `  - hierarchy (ratio -> three tiers) changes ${rs.reduce((n, r) => n + r.hierarchyChanges, 0)} cards on ${rs.filter((r) => r.hierarchyChanges).length} pages: ${rs.reduce((n, r) => n + r.hierarchyFills, 0)} filling a slot flat tags left empty, ${rs.reduce((n, r) => n + r.hierarchyReorders, 0)} breaking a tie between equal shared ratios`,
  )
  p(
    `  - pages whose top-3 ORDER the hierarchy changes (same cards or not): ${rs.filter((r) => r.orderChanged && !r.fallback).length}`,
  )
  p()
}
p(`## M2: Dice vs Jaccard`)
p()
p(
  `- Full scored ordering identical on ${m2.fullSame} of ${pages} pages; top 3 identical on ${m2.top3Same} of ${pages}.`,
)
if (m2.fullDiff.length) p(`- Differ: ${m2.fullDiff.join(', ')}`)
p()
p(`## Precondition context`)
p()
p(
  `- Untagged documents: ${untagged.length} — ${untagged.map((d) => `${d._type}:${d.slug}`).join(', ') || 'none'}`,
)
p(`- Documents tagged at a top concept: ${taggedAtTop.length}`)
p(
  `- Topic concepts with more than one parent: ${multiParent.length}${multiParent.length ? ' — ' + multiParent.map((c) => c.prefLabel).join(', ') : ''}`,
)
p(`- Documents with a duplicated topic reference: ${dupTopics.length}`)
p()
p(`## Per page`)
p()
p(`| page | type | topics | eligible | result | cards (tier) | vs raw count | vs ratio |`)
p(`|---|---|---|---|---|---|---|---|`)
for (const r of rows) {
  const cards = r.fallback
    ? '—'
    : r.cards
        .map((c) => `${byId.get(c.id).slug} (${c.tier}${c.sharesATag ? '' : ', hierarchy only'})`)
        .join('<br>')
  p(
    `| ${r.self.slug} | ${r.self._type} | ${r.topicCount} | ${r.eligibleCount} | ${r.fallback ? 'Recent' : `Related ${r.cards.length}`} | ${cards} | ${r.fallback ? '—' : r.intendedNotInFlat} | ${r.fallback ? '—' : r.hierarchyChanges} |`,
  )
}
writeFileSync(new URL('./report-m1-m2.md', import.meta.url), out.join('\n') + '\n')
console.log(out.slice(0, out.indexOf('## Per page')).join('\n'))
