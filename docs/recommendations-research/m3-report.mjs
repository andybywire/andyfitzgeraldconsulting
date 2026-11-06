// M3.n: every page's related list under each method, side by side, for Andy to judge.
//
//   node docs/recommendations-research/m3-report.mjs 0
//   node docs/recommendations-research/m3-report.mjs 1      # carries m3.0.md forward
//
// Writes m3.<n>.md beside this file, with the columns `Embeddings | Embeddings, same rules | Hand
// tags | Taxonomy v0 | v1 | …` up to vn (plan.md → M3.n evaluation reports). Spends no quota and
// queries no dataset: the corpus, the embeddings baseline, the tag sets and the previous report
// are all files, and all of them must come from the lab (plan.md → Ground rules).
//
// ── IT NEVER OVERWRITES A REPORT ─────────────────────────────────────────────────────────────
//
// Andy marks the best column and writes notes in the report itself, so an existing m3.<n>.md is
// his work. --overwrite is only for regenerating one he has not touched yet.
//
// ── FROM M3.1 ON, EVERY COLUMN BUT THE NEWEST IS CARRIED FORWARD ──────────────────────────────
//
// m3.<n-1>.md is read back with m3-parse.mjs, and its columns, Best marks, notes and tag lines are
// copied as they are. Only the vn column is computed. Recomputing the others would rewrite what
// Andy judged: revision 1 changed the lab's Topic scheme, so the Hand tags and v0 columns would no
// longer come out as they did. Cards are matched back to pages by title, which is unique across
// the corpus; the generator checks that before it starts.
//
// A page is flagged NEW, in its heading, when the vn cards, in any order, match none of the lists
// already shown for it (Andy, 2026-10-29). Only those need judging, against the latest pick. When
// vn repeats an earlier list, its header names the column or columns it repeats.
//
// ── ONE BEST ROW PER ROUND ───────────────────────────────────────────────────────────────────
//
// Each round keeps its own Best row, so the report records how every earlier round was judged
// (Andy, 2026-11-03). M3.n has rows `v0 Best` to `vn Best`. The carried rows show their picks
// grayed, as ☑️, and the `vn Best` row is left empty for Andy's ✅. M3.0's single "Best" row is
// read as `v0 Best`. "The latest pick" is the newest carried row with a mark: a page Andy left
// unmarked in a round falls back to the round before.
//
// ── WHAT THE REPORT SAYS ─────────────────────────────────────────────────────────────────────
//
// A cell is a card's title, and ⇄ marks a card from the other category. A header's (agree n/3)
// counts the cards it shares with the column to its left, in any order. A taxonomy version
// identical to the one before it reads "no change"; the embeddings columns always list their
// cards. "recent" in a header means the ranker found nothing related and fell back to the newest
// documents. Each page's id sits in an HTML comment under its heading, which Obsidian does not
// show, so the parser can find a page whatever its title.
//
// Prose is written one line per paragraph, not wrapped, since the report is read in Obsidian.
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {categoryForType, genresByCategory} from '../../web/src/lib/related.ts'
import {CROSS, TAXONOMY_CROSS, loadBaseline, sameRules, unrestricted} from './baseline-columns.mjs'
import {parseReport} from './m3-parse.mjs'
import {
  checkShape,
  loadTagSet,
  taxonomyColumn,
  topicShaper,
  withTagSet,
} from './taxonomy-columns.mjs'

const n = Number(process.argv[2])
if (!Number.isInteger(n) || n < 0) {
  console.error('Usage: m3-report.mjs <n> [--overwrite] [--out <file>]')
  process.exit(1)
}
/* --out writes elsewhere, for checking that a code change reproduces an existing report. Such a
   check must never regenerate the report in place: once marked, it would lose Andy's marks, and
   on 2026-11-05 a check that did exactly that had to be restored from git. */
const outAt = process.argv.indexOf('--out')
const target =
  outAt === -1
    ? new URL(`./m3.${n}.md`, import.meta.url)
    : new URL(process.argv[outAt + 1], `file://${process.cwd()}/`)
if (existsSync(target) && !process.argv.includes('--overwrite')) {
  console.error(`${target.pathname} exists and may hold Andy's marks. --overwrite replaces it.`)
  process.exit(1)
}

const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url)))
const base = loadBaseline()
/* M3.0 computes the Hand tags and v0 columns; from M3.1 on only the newest tag set is read. */
const tagSets = n === 0 ? [loadTagSet('v0')] : [loadTagSet(`v${n}`)]
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
const skipped = checkShape(corpus.pool, shape)
const categories = genresByCategory(corpus.genres.tops, corpus.genres.concepts)
const pools =
  n === 0
    ? [corpus.pool, withTagSet(corpus.pool, tagSets[0], shape)]
    : [withTagSet(corpus.pool, tagSets[0], shape)]
const byId = new Map(corpus.pool.map((d) => [d._id, d]))
const typeOf = (id) => byId.get(id)._type

/* Some titles carry stray spaces in the data (" Improv Consulting…"), which would sort first and pad
   cells, so the report trims every title it shows. Trimmed titles are also how a carried-forward
   card finds its page again, so they must be unique. */
const titleOf = (d) => d.title.trim()
const idOfTitle = new Map(corpus.pool.map((d) => [titleOf(d), d._id]))
if (idOfTitle.size !== corpus.pool.length) throw new Error('two pages share a title')

/* Each version's crossing rule, as its tag set records it; one with none uses TAXONOMY_CROSS.
   From v3 the taxonomy columns cross under TAXONOMY_CROSS_RELAXED (baseline-columns.mjs), so a
   column is ranked, and described, under its own version's rule. The hand tags keep the original. */
const ruleOf = (v) => loadTagSet(`v${v}`).crossRule ?? TAXONOMY_CROSS
const rules = Array.from({length: n + 1}, (_, v) => ruleOf(v))
const ruleText = (r) =>
  `at least ${r.crossMinCount} shared tags, a shared ratio of at least ${r.crossMinShared}, at most ${r.crossMax} cross card`
const versionColumn = (v) => ({
  name: v === 0 ? 'Taxonomy v0' : `v${v}`,
  what:
    `The ranker on tag set v${v}` +
    (rules[v] === TAXONOMY_CROSS || JSON.stringify(rules[v]) === JSON.stringify(TAXONOMY_CROSS)
      ? ''
      : `, under the relaxed crossing rule`),
  taxonomy: true,
  version: true,
})
const COLUMNS = [
  {name: 'Embeddings', what: 'The top 3 by semantic score, in either category'},
  {
    name: 'Embeddings, same rules',
    what: `The category rule on semantic scores: a cross card must score ${CROSS.crossMin} anchored and beat the weakest home card`,
  },
  {name: 'Hand tags', what: 'The ranker on the hand tags in the lab', taxonomy: true},
  ...Array.from({length: n + 1}, (_, v) => versionColumn(v)),
]

/* The previous report, read back and checked against this run before anything is copied. */
let previous = null
const previousName = `m3.${n - 1}.md`
if (n > 0) {
  const file = new URL(`./${previousName}`, import.meta.url)
  if (!existsSync(file)) throw new Error(`${previousName} is missing; it is carried forward`)
  const parsed = parseReport(readFileSync(file, 'utf8'))
  const expected = COLUMNS.slice(0, -1)
    .map((c) => c.name)
    .join(' / ')
  for (const p of parsed.pages) {
    const found = p.columns.map((c) => c.name).join(' / ')
    if (found !== expected) throw new Error(`${p.heading}: columns ${found}, expected ${expected}`)
  }
  if (idList(parsed.pages.map((p) => ({_id: p.id}))) !== idList(corpus.pool)) {
    throw new Error(`${previousName} and corpus.json hold different documents`)
  }
  previous = {...parsed, byId: new Map(parsed.pages.map((p) => [p.id, p]))}
}

/** Each column's list for one page: ids, whether it was the "Recent" fallback, and its note. */
function columnsFor(page) {
  /* M3.0 computes Hand tags and v0, both under TAXONOMY_CROSS; later reports compute only vn. */
  const computedRules = n === 0 ? [TAXONOMY_CROSS, rules[0]] : [rules[n]]
  const computed = pools.map((pool, i) => {
    const r = taxonomyColumn(page, pool, categories, computedRules[i])
    return {ids: r.items.map((i) => i._id), recent: r.isFallback, note: ''}
  })
  if (previous) {
    const carried = previous.byId.get(page._id).columns.map((c) => ({
      ids: c.cards.filter(Boolean).map((title) => {
        const id = idOfTitle.get(title)
        if (!id) throw new Error(`"${title}", on ${titleOf(page)}, is no page's title`)
        return id
      }),
      recent: c.recent,
      note: c.note,
    }))
    return [...carried, ...computed]
  }
  const basePage = base.pages.find((p) => p._id === page._id)
  return [
    {ids: unrestricted(basePage, typeOf).map((r) => r.id), recent: false, note: ''},
    {ids: sameRules(basePage, typeOf, CROSS).map((r) => r.id), recent: false, note: ''},
    ...computed,
  ]
}

/**
 * One page's Best rows: every row carried from the previous report, widened by an unmarked cell
 * for the new column, then an empty row for this round.
 */
function bestsFor(page) {
  const carried = previous
    ? previous.byId.get(page._id).bests.map((b) => ({
        version: b.version ?? 0,
        marked: [...b.marked, false],
      }))
    : []
  return [...carried, {version: n, marked: COLUMNS.map(() => false)}]
}

/** The newest carried Best row with a mark, as the round and the column it picked; or null. */
function latestPick(bests) {
  const row = bests.slice(0, -1).findLast((b) => b.marked.some(Boolean))
  return row ? {version: row.version, at: row.marked.indexOf(true)} : null
}

const agree = (a, b) => a.filter((id) => b.includes(id)).length
const crosses = (page, ids) =>
  ids.some((id) => categoryForType(typeOf(id)) !== categoryForType(page._type))
const cell = (text) => text.replaceAll('|', '\\|')

/** The earlier columns whose cards, in any order, are the newest column's. Empty means NEW. */
const setKey = (ids) => [...ids].sort().join()
const repeats = (cols) =>
  COLUMNS.slice(0, -1)
    .filter((_, i) => setKey(cols[i].ids) === setKey(cols.at(-1).ids))
    .map((c) => c.name)

/**
 * On a NEW page, the newest list set against the latest pick: the cards it adds, drops and keeps,
 * so a page can be judged on the swap rather than read whole (Andy, 2026-11-03).
 *
 * It is a quote, not a bullet, so m3-parse.mjs never takes it for a tag line: the next report
 * computes its own against whatever the latest pick is then. Titles are in italics because many
 * hold commas and colons, and a title's own asterisk ("Sanity Everything*[NYC]") is escaped so it
 * can't end the italics early.
 */
function againstBest(page, cols, bests) {
  const pick = latestPick(bests)
  if (!pick) return null
  const at = pick.at
  const [best, newest] = [cols[at].ids, cols.at(-1).ids]
  const name = (id) => {
    const other = categoryForType(typeOf(id)) !== categoryForType(page._type)
    return `*${other ? '⇄ ' : ''}${titleOf(byId.get(id)).replaceAll('*', '\\*')}*`
  }
  const part = (verb, ids) => (ids.length ? `${verb} ${ids.map(name).join(', ')}` : null)
  const parts = [
    part(
      'adds',
      newest.filter((id) => !best.includes(id)),
    ),
    part(
      'drops',
      best.filter((id) => !newest.includes(id)),
    ),
    part(
      'keeps',
      newest.filter((id) => best.includes(id)),
    ),
  ].filter(Boolean)
  return `> **${COLUMNS.at(-1).name} against v${pick.version} Best** (${COLUMNS[at].name}): ${parts.join('; ')}.`
}

const GROUPS = [
  ['article', 'Articles', 'Article'],
  ['caseStudy', 'Case Studies', 'Case Study'],
  ['note', 'Notes', 'Note'],
  ['presentation', 'Presentations', 'Presentation'],
]
const byTitle = (a, b) => titleOf(a).localeCompare(titleOf(b), 'en', {sensitivity: 'base'})
const pages = GROUPS.flatMap(([type]) => corpus.pool.filter((d) => d._type === type).sort(byTitle))
const results = new Map(pages.map((p) => [p._id, columnsFor(p)]))
const bestRows = new Map(pages.map((p) => [p._id, bestsFor(p)]))
const flagged = n > 0 ? pages.filter((p) => repeats(results.get(p._id)).length === 0) : []
const isNew = new Set(flagged.map((p) => p._id))

/* ── The summary ─────────────────────────────────────────────────────────────── */

const out = []
const today = new Date().toISOString().slice(0, 10)
out.push(`# M3.${n}: related content, embeddings and taxonomy side by side`, '')
out.push(
  n === 0
    ? `Generated ${today} from \`recommendations-lab\`: corpus fetched ${corpus.fetchedAt.slice(0, 10)}, embeddings baseline \`scores/${baseName}\`, ${tagSets.map((t) => `tag set \`tagsets/${t.version}.json\``).join(', ')}. ${pages.length} pages.`
    : `Generated ${today} from \`recommendations-lab\`. Every column up to ${COLUMNS.at(-2).name} is carried forward from \`${previousName}\` as marked; only the ${COLUMNS.at(-1).name} column is new, from tag set \`tagsets/${tagSets[0].version}.json\` and the corpus fetched ${corpus.fetchedAt.slice(0, 10)}. ${pages.length} pages.`,
  '',
)
out.push(
  `**How to judge.** Each page has one Best row per round. In its **v${n} Best** row, paste ✅ under the column whose list you think is best now, and add anything worth keeping in **Notes**.${n > 0 ? " The rows above it keep the earlier rounds' picks, grayed to ☑️." : ''} ⇄ marks a card from the other category. "(agree n/3)" counts the cards a column shares with the one to its left. "recent" means the ranker found nothing related and showed the newest documents instead.`,
  '',
)
const isOriginal = (r) => JSON.stringify(r) === JSON.stringify(TAXONOMY_CROSS)
const underOriginal = rules.flatMap((r, v) => (isOriginal(r) ? [COLUMNS[3 + v].name] : []))
const underRelaxed = rules.flatMap((r, v) => (isOriginal(r) ? [] : [COLUMNS[3 + v].name]))
const verb = (names) => (names.length === 1 ? 'crosses' : 'cross')
out.push(
  underRelaxed.length === 0
    ? `**The taxonomy columns** all run the site's ranker under one fixed crossing rule: ${ruleText(TAXONOMY_CROSS)}. They differ only in their tags.`
    : `**The taxonomy columns** all run the site's ranker. Hand tags and ${underOriginal.join(', ')} cross under the original rule: ${ruleText(TAXONOMY_CROSS)}. ${underRelaxed.join(', ')} ${verb(underRelaxed)} under the relaxed rule: ${ruleText(rules.find((r) => !isOriginal(r)))}. A version that changes the rule keeps the tags of the one before it, so each column still changes one thing.`,
  '',
)
if (n === 0) {
  out.push('M3.0 is the first run, so no page is flagged **NEW**.', '')
} else {
  const newest = COLUMNS.at(-1).name
  const onBest = pages.filter((p) => {
    const cols = results.get(p._id)
    const pick = latestPick(bestRows.get(p._id))
    return pick && setKey(cols[pick.at].ids) === setKey(cols.at(-1).ids)
  }).length
  out.push(
    `**NEW** in a page's heading means its ${newest} list, in any order, matches none of the lists already shown for it. That is **${flagged.length} of ${pages.length} pages**, and only they need judging, against your latest pick. On the other ${pages.length - flagged.length}, ${newest} repeats a list you have judged, and its header names which: on ${onBest} of them, the one you last picked.`,
    '',
    `**Best was the best of the lists shown, not of every possible list,** so a NEW page asks whether ${newest}'s list beats it. Each one has a line above its table setting ${newest} against your latest pick: the cards it adds, drops and keeps.`,
    '',
  )
  for (const [type, heading] of GROUPS) {
    const titles = flagged.filter((p) => p._type === type).map(titleOf)
    if (titles.length) out.push(`- **${heading} (${titles.length}):** ${titles.join(' · ')}`)
  }
  out.push('')
}

/* One count column per earlier round's Best row: how many pages that round picked each column. */
const rounds = Array.from({length: n}, (_, v) => v)
out.push(
  `| Column | What it is | Pages with a cross card | "Recent" fallbacks | Mean agreement with the column to its left |${rounds.map((v) => ` v${v} Best |`).join('')}`,
)
out.push(`|---|---|---|---|---|${rounds.map(() => '---|').join('')}`)
COLUMNS.forEach((col, i) => {
  const lists = pages.map((p) => results.get(p._id)[i])
  const crossing = pages.filter((p, k) => crosses(p, lists[k].ids)).length
  const recent = lists.filter((l) => l.recent).length
  const picked = rounds.map(
    (v) => pages.filter((p) => bestRows.get(p._id).find((b) => b.version === v)?.marked[i]).length,
  )
  const mean =
    i === 0
      ? '—'
      : `${(pages.reduce((s, p) => s + agree(results.get(p._id)[i].ids, results.get(p._id)[i - 1].ids), 0) / pages.length).toFixed(2)} of 3`
  out.push(
    `| ${col.name} | ${col.what} | ${crossing} of ${pages.length} | ${recent} | ${mean} |${picked.map((k) => ` ${k} |`).join('')}`,
  )
})
out.push('')

/* ── One section per page ────────────────────────────────────────────────────── */

const handLabels = (page) =>
  (page.topics ?? [])
    .filter(Boolean)
    .map((t) => t.prefLabel)
    .join(', ') || 'none'
const tagLine = (t, page) =>
  `- **${t.version}:** ${t.documents
    .find((d) => d._id === page._id)
    .tags.map((tag) => tag.prefLabel)
    .join(', ')}`

for (const [type, heading, singular] of GROUPS) {
  const group = pages.filter((p) => p._type === type)
  out.push(`## ${heading} (${group.length})`, '')
  for (const page of group) {
    const cols = results.get(page._id)
    const bests = bestRows.get(page._id)
    const flag = isNew.has(page._id) ? ' — NEW' : ''
    out.push(`### ${titleOf(page)}${flag}`, `<!-- id: ${page._id} -->`, '')
    out.push(`*${singular}${page.genre ? ` · ${page.genre}` : ''}*`, '')
    if (previous) {
      out.push(...previous.byId.get(page._id).tagLines, tagLine(tagSets[0], page))
    } else {
      out.push(`- **Hand tags:** ${handLabels(page)}`)
      tagSets.forEach((t) => out.push(tagLine(t, page)))
    }
    out.push('')
    const swap = flag ? againstBest(page, cols, bests) : null
    if (swap) out.push(swap, '')

    const unchanged = cols.map(
      (c, i) => i > 0 && COLUMNS[i].version && c.ids.join() === cols[i - 1].ids.join(),
    )
    const same = n > 0 && !flag ? ` · same as ${repeats(cols).join(', ')}` : ''
    const header = COLUMNS.map((col, i) => {
      const agreement = i === 0 ? '' : ` (agree ${agree(cols[i].ids, cols[i - 1].ids)}/3)`
      const repeat = n > 0 && i === COLUMNS.length - 1 ? same : ''
      return `${col.name}${agreement}${cols[i].recent ? ' · recent' : ''}${repeat}`
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
    for (const b of bests) {
      const mark = b.version < n ? '☑️' : '✅'
      out.push(`| **v${b.version} Best** | ${b.marked.map((m) => (m ? mark : '')).join(' | ')} |`)
    }
    out.push(`| **Notes** | ${cols.map((c) => cell(c.note)).join(' | ')} |`)
    out.push('')
  }
}

writeFileSync(target, out.join('\n'))
console.log(`Wrote ${target.pathname}: ${pages.length} pages, ${COLUMNS.length} columns.`)
if (skipped) console.log(`Shape check skipped ${skipped} hand tags on concepts outside the scheme.`)
if (n > 0) {
  console.log(
    `Carried ${previous.marks} Best marks forward from ${previousName}; ${flagged.length} pages flagged NEW.`,
  )
}
