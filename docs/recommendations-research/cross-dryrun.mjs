// Dry run of the cross-category ranker (web/src/lib/related.ts → rankAcross) over corpus.json.
//
//   node docs/recommendations-research/fetch-corpus.mjs && node docs/recommendations-research/cross-dryrun.mjs
//   node docs/recommendations-research/cross-dryrun.mjs tagsets/v0.json [--rule 0.4,2,1]
//
// Reads the site's real ranker and spends no quota. With no tag set it ranks on the hand tags in
// corpus.json; with one, every document's tags are replaced by that set's. `--rule` takes
// crossMinShared, crossMinCount and crossMax and prints the cross cards that rule produces, in
// place of the research's own rule, TAXONOMY_CROSS in baseline-columns.mjs. CROSS_RULE in
// related.ts is not read here: it keeps provisional values until promotion. It answers three
// questions:
//
//   1. Do the categories come out right? Insights should be the whole Document subtree, notes
//      included, and Presentations the whole Presentation subtree.
//   2. What does the category change alone do? With crossing turned off (crossMax 0), any
//      difference from the old branch rule comes from notes and articles now sharing a category.
//   3. How readily does the taxonomy cross at each `crossMinShared`? Compared with the 19 of 73
//      pages that "Embeddings, same rules" crosses on at crossMin 0.70. plan.md's default is to
//      match that count, so the comparison measures the vocabulary, not which bar is looser.
//
// The hand tags could not settle crossMinShared: with 2–4 tags a document the ratio takes few
// values. A tag set, with up to six, is what calibrates it.
import {readFileSync} from 'node:fs'
import {TAXONOMY_CROSS} from './baseline-columns.mjs'
import {
  branchForType,
  categoryForType,
  genresByCategory,
  genresForBranch,
  rankAcross,
  rankRelated,
} from '../../web/src/lib/related.ts'

const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url)))
const {genres} = corpus
const label = new Map((genres.concepts ?? []).filter(Boolean).map((c) => [c._id, c.prefLabel]))

const args = process.argv.slice(2)
const ruleAt = args.indexOf('--rule')
const exampleRule =
  ruleAt === -1
    ? TAXONOMY_CROSS
    : (([crossMinShared, crossMinCount, crossMax]) => ({crossMinShared, crossMinCount, crossMax}))(
        args[ruleAt + 1].split(',').map(Number),
      )
const tagSetPath = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--rule')

/* A topic in the shape RELATED_POOL_QUERY projects, rebuilt from the Topic scheme: its first
   parent, and whether that parent is a top concept, which is true when the parent has no parent
   of its own. That is the query's `!defined(broader[0]->broader[0]._ref)`. */
const parentOf = new Map(corpus.topicScheme.concepts.map((c) => [c._id, c.parents?.[0] ?? null]))
const topicShape = (id) => {
  const parent = parentOf.get(id) ?? null
  return {_id: id, parent, parentIsTop: !parentOf.get(parent)}
}

/* Rebuilding the hand tags must give back exactly what the query projected, or a tag set would be
   ranked on a different shape than the site's. Only the three fields the ranker reads are
   compared: fetch-corpus.mjs adds a `prefLabel` for its reports. */
const key = (ts) =>
  JSON.stringify(
    (ts ?? [])
      .filter(Boolean)
      .map(({_id, parent, parentIsTop}) => [_id, parent, parentIsTop])
      .sort(),
  )
const misshapen = corpus.pool.filter(
  (d) => key(d.topics) !== key((d.topics ?? []).filter(Boolean).map((t) => topicShape(t._id))),
)
if (misshapen.length) {
  throw new Error(`rebuilt topics differ from the query's on ${misshapen.map((d) => d.slug)}`)
}

let pool = corpus.pool
let source = 'the hand tags'
if (tagSetPath) {
  const tagSet = JSON.parse(readFileSync(new URL(tagSetPath, `file://${process.cwd()}/`)))
  const tagsFor = new Map(tagSet.documents.map((d) => [d._id, d.tags.map((t) => t.concept)]))
  const missing = pool.filter((d) => !tagsFor.has(d._id))
  if (missing.length) throw new Error(`the tag set has no entry for ${missing.map((d) => d.slug)}`)
  pool = pool.map((d) => ({...d, topics: tagsFor.get(d._id).map(topicShape)}))
  source = `tag set ${tagSet.version} (${tagSet.dataset})`
}

const byId = new Map(pool.map((d) => [d._id, d]))
const current = (d) => ({_id: d._id, type: d._type, topics: d.topics})

console.log(
  `Corpus ${corpus.dataset}, fetched ${corpus.fetchedAt}: ${pool.length} pages, ranked on ${source}.\n`,
)

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

/* 3 ─ crossing, by crossMinShared, at one, two and three shared tags minimum */
console.log('\nPages that show a cross card, crossMax 1 (embeddings, same rules: 9 + 10 = 19):')
const grid = [0.01, 0.2, 0.25, 0.3, 0.33, 0.4, 0.43, 0.5, 0.6, 0.67, 0.75, 1]
console.log(`  ${'crossMinShared'.padEnd(22)}${grid.map((g) => g.toFixed(2).padStart(6)).join('')}`)
for (const crossMinCount of [1, 2, 3]) {
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

/* The examples use the research's rule, TAXONOMY_CROSS, unless --rule names another. */
console.log(
  `\nCross cards under ${ruleAt === -1 ? 'TAXONOMY_CROSS' : '--rule'} (crossMinShared ` +
    `${exampleRule.crossMinShared}, crossMinCount ${exampleRule.crossMinCount}, ` +
    `crossMax ${exampleRule.crossMax}):`,
)
for (const d of pool) {
  const r = rankAcross(current(d), pool, categories, exampleRule)
  for (const item of r.items.filter((x) => categoryForType(x._type) !== categoryForType(d._type))) {
    console.log(`  ${d.title}  →  ${byId.get(item._id).title}`)
  }
}
