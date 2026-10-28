// Dry run of the cross-category ranker (web/src/lib/related.ts → rankAcross) over corpus.json.
//
//   node docs/recommendations-research/fetch-corpus.mjs && node docs/recommendations-research/cross-dryrun.mjs
//
// Reads the site's real ranker and today's tags (the hand tags, until a tag set replaces them)
// and spends no quota. It answers three questions before the pages move to the new ranker:
//
//   1. Do the categories come out right? Insights should be the whole Document subtree, notes
//      included, and Presentations the whole Presentation subtree.
//   2. What does the category change alone do? With crossing turned off (crossMax 0), any
//      difference from the old branch rule comes from notes and articles now sharing a category.
//   3. How readily does the taxonomy cross at each `crossMinShared`? Compared with the 19 of 73
//      pages that "Embeddings, same rules" crosses on at crossMin 0.70. plan.md's default is to
//      match that count, so the comparison measures the vocabulary, not which bar is looser.
//
// Today's tags are the hand tags. The numbers that settle crossMinShared come from re-running
// this against tag set v0, once the tagger exists.
import {readFileSync} from 'node:fs'
import {
  CROSS_RULE,
  branchForType,
  categoryForType,
  genresByCategory,
  genresForBranch,
  rankAcross,
  rankRelated,
} from '../../web/src/lib/related.ts'

const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url)))
const {pool, genres} = corpus
const label = new Map((genres.concepts ?? []).filter(Boolean).map((c) => [c._id, c.prefLabel]))
const byId = new Map(pool.map((d) => [d._id, d]))
const current = (d) => ({_id: d._id, type: d._type, topics: d.topics})

console.log(`Corpus ${corpus.dataset}, fetched ${corpus.fetchedAt}: ${pool.length} pages.\n`)

/* 1 ─ categories */
const categories = genresByCategory(genres.tops, genres.concepts)
for (const [cat, ids] of Object.entries(categories)) {
  console.log(`${cat.padEnd(14)} ${[...ids].map((id) => label.get(id) ?? id).join(', ')}`)
}
const uncategorized = pool.filter(
  (d) => !d.genreId || !Object.values(categories).some((s) => s.has(d.genreId)),
)
const misfiled = pool.filter(
  (d) => d.genreId && !categories[categoryForType(d._type)].has(d.genreId),
)
console.log(`pages in no category: ${uncategorized.map((d) => d.slug).join(', ') || 'none'}`)
console.log(
  `pages whose genre disagrees with their type: ${misfiled.map((d) => d.slug).join(', ') || 'none'}`,
)

/* 2 ─ the category change alone */
const ids = (r) => r.items.map((x) => x._id).join()
const changed = pool.filter((d) => {
  const old = rankRelated(
    {_id: d._id, topics: d.topics},
    pool,
    genresForBranch(branchForType(d._type), genres.tops, genres.concepts),
  )
  const now = rankAcross(current(d), pool, categories, {
    crossMinShared: Infinity,
    crossMinCount: Infinity,
    crossMax: 0,
  })
  return ids(old) !== ids(now)
})
const byType = (rows) =>
  Object.entries(Object.groupBy(rows, (d) => d._type))
    .map(([t, a]) => `${t} ${a.length}`)
    .join(', ')
console.log(
  `\nWith crossing off, lists that differ from the old branch rule: ${changed.length} of ${pool.length} (${byType(changed) || 'none'})`,
)

/* 3 ─ crossing, by crossMinShared, at one and two shared tags minimum */
console.log('\nPages that show a cross card, crossMax 1 (embeddings, same rules: 9 + 10 = 19):')
const grid = [0.01, 0.2, 0.25, 0.33, 0.4, 0.5, 0.67, 1]
console.log(`  ${'crossMinShared'.padEnd(22)}${grid.map((g) => g.toFixed(2).padStart(6)).join('')}`)
for (const crossMinCount of [1, 2]) {
  for (const cat of ['insights', 'presentations']) {
    const pages = pool.filter((d) => categoryForType(d._type) === cat)
    const counts = grid.map(
      (crossMinShared) =>
        pages.filter(
          (d) =>
            rankAcross(current(d), pool, categories, {crossMinShared, crossMinCount, crossMax: 1})
              .crossed,
        ).length,
    )
    console.log(
      `  ${`${cat}, ${crossMinCount}+ tag${crossMinCount > 1 ? 's' : ''}`.padEnd(22)}${counts.map((c) => String(c).padStart(6)).join('')}   of ${pages.length}`,
    )
  }
}

/* The examples use the rule the site uses, so this is what a reader of the pages would see. */
console.log(
  `\nCross cards under CROSS_RULE (crossMinShared ${CROSS_RULE.crossMinShared}, ` +
    `crossMinCount ${CROSS_RULE.crossMinCount}, crossMax ${CROSS_RULE.crossMax}):`,
)
for (const d of pool) {
  const r = rankAcross(current(d), pool, categories, CROSS_RULE)
  for (const item of r.items.filter((x) => categoryForType(x._type) !== categoryForType(d._type))) {
    console.log(`  ${d.title}  →  ${byId.get(item._id).title}`)
  }
}
