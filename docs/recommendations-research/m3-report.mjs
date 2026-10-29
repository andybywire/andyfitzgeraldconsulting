// M3.n: every page's related list under each method, side by side, for Andy to judge.
//
//   node docs/recommendations-research/m3-report.mjs 0
//
// Writes m3.<n>.md beside this file, with the columns `Embeddings | Embeddings, same rules | Hand
// tags | Taxonomy v0 | v1 | …` up to vn (plan.md → M3.n evaluation reports). Spends no quota and
// queries no dataset: the corpus, the embeddings baseline and the tag sets are all files, and all
// of them must come from the lab (plan.md → Ground rules).
//
// ── IT NEVER OVERWRITES A REPORT ─────────────────────────────────────────────────────────────
//
// Andy marks the best column and writes notes in the report itself, so an existing m3.<n>.md is
// his work. --overwrite is only for regenerating one he has not touched yet.
//
// ── NOT BUILT YET: CARRY-FORWARD ─────────────────────────────────────────────────────────────
//
// From M3.1 on, a report carries the earlier columns' Best marks and notes forward. That needs a
// parser for the report before it, which the extract script needs too, so the two are built
// together, with M3.1. Until then this refuses any n above 0 rather than drop the marks.
//
// ── WHAT THE REPORT SAYS ─────────────────────────────────────────────────────────────────────
//
// A cell is a card's title, and ⇄ marks a card from the other category. A header's (agree n/3)
// counts the cards it shares with the column to its left, in any order. A taxonomy version
// identical to the one before it reads "no change"; the embeddings columns always list their
// cards. "recent" in a header means the ranker found nothing related and fell back to the newest
// documents. Each page's id sits in an HTML comment under its heading, which Obsidian does not
// show, so the extract script can find a page whatever its title.
//
// Prose is written one line per paragraph, not wrapped, since the report is read in Obsidian.
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {categoryForType, genresByCategory} from '../../web/src/lib/related.ts'
import {CROSS, TAXONOMY_CROSS, loadBaseline, sameRules, unrestricted} from './baseline-columns.mjs'
import {
  checkShape,
  loadTagSet,
  taxonomyColumn,
  topicShaper,
  withTagSet,
} from './taxonomy-columns.mjs'

const n = Number(process.argv[2])
if (!Number.isInteger(n) || n < 0) {
  console.error('Usage: m3-report.mjs <n> [--overwrite]')
  process.exit(1)
}
if (n > 0) {
  console.error('M3.1 onward carries Best marks and notes forward, which is not built yet.')
  process.exit(1)
}
const target = new URL(`./m3.${n}.md`, import.meta.url)
if (existsSync(target) && !process.argv.includes('--overwrite')) {
  console.error(`${target.pathname} exists and may hold Andy's marks. --overwrite replaces it.`)
  process.exit(1)
}

const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url)))
const base = loadBaseline()
const tagSets = Array.from({length: n + 1}, (_, v) => loadTagSet(`v${v}`))
const baseName = base.file.pathname.split('/').at(-1)

/* Every source from the lab, and every source about the same documents. */
const sources = [
  ['corpus.json', corpus.dataset],
  [baseName, base.dataset],
  ...tagSets.map((t) => [`tagsets/${t.version}.json`, t.dataset]),
]
for (const [name, dataset] of sources) {
  if (dataset !== 'recommendations-lab') throw new Error(`${name} is from ${dataset}, not the lab`)
}
const idList = (xs) =>
  xs
    .map((x) => x._id)
    .sort()
    .join()
for (const [name, xs] of [
  [baseName, base.pages],
  ...tagSets.map((t) => [t.version, t.documents]),
]) {
  if (idList(xs) !== idList(corpus.pool))
    throw new Error(`${name} and corpus.json hold different documents`)
}

const shape = topicShaper(corpus.topicScheme)
checkShape(corpus.pool, shape)
const categories = genresByCategory(corpus.genres.tops, corpus.genres.concepts)
const pools = [corpus.pool, ...tagSets.map((t) => withTagSet(corpus.pool, t, shape))]
const byId = new Map(corpus.pool.map((d) => [d._id, d]))
const typeOf = (id) => byId.get(id)._type

const COLUMNS = [
  {name: 'Embeddings', what: 'The top 3 by semantic score, in either category'},
  {
    name: 'Embeddings, same rules',
    what: `The category rule on semantic scores: a cross card must score ${CROSS.crossMin} anchored and beat the weakest home card`,
  },
  {name: 'Hand tags', what: 'The ranker on the hand tags in the lab', taxonomy: true},
  ...tagSets.map((t, v) => ({
    name: v === 0 ? 'Taxonomy v0' : `v${v}`,
    what: `The ranker on tag set ${t.version}`,
    taxonomy: true,
    version: true,
  })),
]

/** Each column's list for one page: ids, and whether it was the "Recent" fallback. */
function columnsFor(page) {
  const basePage = base.pages.find((p) => p._id === page._id)
  return [
    {ids: unrestricted(basePage, typeOf).map((r) => r.id), recent: false},
    {ids: sameRules(basePage, typeOf, CROSS).map((r) => r.id), recent: false},
    ...pools.map((pool) => {
      const r = taxonomyColumn(page, pool, categories)
      return {ids: r.items.map((i) => i._id), recent: r.isFallback}
    }),
  ]
}

const agree = (a, b) => a.filter((id) => b.includes(id)).length
const crosses = (page, ids) =>
  ids.some((id) => categoryForType(typeOf(id)) !== categoryForType(page._type))
const cell = (text) => text.replaceAll('|', '\\|')

const GROUPS = [
  ['article', 'Articles', 'Article'],
  ['caseStudy', 'Case Studies', 'Case Study'],
  ['note', 'Notes', 'Note'],
  ['presentation', 'Presentations', 'Presentation'],
]
/* Some titles carry stray spaces in the data (" Improv Consulting…"), which would sort first and pad
   cells, so the report trims every title it shows. */
const titleOf = (d) => d.title.trim()
const byTitle = (a, b) => titleOf(a).localeCompare(titleOf(b), 'en', {sensitivity: 'base'})
const pages = GROUPS.flatMap(([type]) => corpus.pool.filter((d) => d._type === type).sort(byTitle))
const results = new Map(pages.map((p) => [p._id, columnsFor(p)]))

/* ── The summary ─────────────────────────────────────────────────────────────── */

const out = []
const today = new Date().toISOString().slice(0, 10)
out.push(`# M3.${n}: related content, embeddings and taxonomy side by side`, '')
out.push(
  `Generated ${today} from \`recommendations-lab\`: corpus fetched ${corpus.fetchedAt.slice(0, 10)}, embeddings baseline \`scores/${baseName}\`, ${tagSets.map((t) => `tag set \`tagsets/${t.version}.json\``).join(', ')}. ${pages.length} pages.`,
  '',
)
out.push(
  `**How to judge.** In each page's **Best** row, paste ✅ under the column whose list you think is best, and add anything worth keeping in **Notes**. ⇄ marks a card from the other category. "(agree n/3)" counts the cards a column shares with the one to its left. "recent" means the ranker found nothing related and showed the newest documents instead.`,
  '',
)
out.push(
  `**The taxonomy columns** all run the site's ranker under one fixed crossing rule: at least ${TAXONOMY_CROSS.crossMinCount} shared tags, a shared ratio of at least ${TAXONOMY_CROSS.crossMinShared}, at most ${TAXONOMY_CROSS.crossMax} cross card. They differ only in their tags.`,
  '',
)
if (n === 0) out.push('M3.0 is the first run, so no page is flagged **NEW**.', '')

out.push(
  '| Column | What it is | Pages with a cross card | "Recent" fallbacks | Mean agreement with the column to its left |',
)
out.push('|---|---|---|---|---|')
COLUMNS.forEach((col, i) => {
  const lists = pages.map((p) => results.get(p._id)[i])
  const crossing = pages.filter((p, k) => crosses(p, lists[k].ids)).length
  const recent = lists.filter((l) => l.recent).length
  const mean =
    i === 0
      ? '—'
      : `${(pages.reduce((s, p) => s + agree(results.get(p._id)[i].ids, results.get(p._id)[i - 1].ids), 0) / pages.length).toFixed(2)} of 3`
  out.push(`| ${col.name} | ${col.what} | ${crossing} of ${pages.length} | ${recent} | ${mean} |`)
})
out.push('')

/* ── One section per page ────────────────────────────────────────────────────── */

const handLabels = (page) =>
  (page.topics ?? [])
    .filter(Boolean)
    .map((t) => t.prefLabel)
    .join(', ') || 'none'

for (const [type, heading, singular] of GROUPS) {
  const group = pages.filter((p) => p._type === type)
  out.push(`## ${heading} (${group.length})`, '')
  for (const page of group) {
    const cols = results.get(page._id)
    out.push(`### ${titleOf(page)}`, `<!-- id: ${page._id} -->`, '')
    out.push(`*${singular}${page.genre ? ` · ${page.genre}` : ''}*`, '')
    out.push(`- **Hand tags:** ${handLabels(page)}`)
    tagSets.forEach((t) => {
      const doc = t.documents.find((d) => d._id === page._id)
      out.push(`- **${t.version}:** ${doc.tags.map((tag) => tag.prefLabel).join(', ')}`)
    })
    out.push('')

    const unchanged = cols.map(
      (c, i) => i > 0 && COLUMNS[i].version && c.ids.join() === cols[i - 1].ids.join(),
    )
    const header = COLUMNS.map((col, i) => {
      const agreement = i === 0 ? '' : ` (agree ${agree(cols[i].ids, cols[i - 1].ids)}/3)`
      return `${col.name}${agreement}${cols[i].recent ? ' · recent' : ''}`
    })
    out.push(`| | ${header.join(' | ')} |`)
    out.push(`|---|${COLUMNS.map(() => '---').join('|')}|`)
    for (let row = 0; row < 3; row++) {
      const cells = cols.map((c, i) => {
        if (unchanged[i]) return row === 0 ? 'no change' : ''
        const id = c.ids[row]
        if (!id) return '—'
        const other = categoryForType(typeOf(id)) !== categoryForType(page._type)
        return cell(`${other ? '⇄ ' : ''}${titleOf(byId.get(id))}`)
      })
      out.push(`| ${row + 1} | ${cells.join(' | ')} |`)
    }
    out.push(`| **Best** | ${COLUMNS.map(() => '').join(' | ')} |`)
    out.push(`| **Notes** | ${COLUMNS.map(() => '').join(' | ')} |`)
    out.push('')
  }
}

writeFileSync(target, out.join('\n'))
console.log(`Wrote ${target.pathname}: ${pages.length} pages, ${COLUMNS.length} columns.`)
