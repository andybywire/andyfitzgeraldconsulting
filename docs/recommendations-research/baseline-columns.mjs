// The two embeddings-only columns of M3.n, derived from a baseline cache. Pure: no queries.
//
//   node docs/recommendations-research/baseline-columns.mjs [scores/baseline-<…>.json]
//
// Imported by the M3.n generator. Run directly, it prints the crossing counts across a range of
// thresholds, for revisiting CROSS below.
//
// ── TWO COLUMNS, BECAUSE TWO THINGS ARE BEING MEASURED ───────────────────────────────────────
//
// "Embeddings" is the plain top 3 by semantic score: what Sanity alone would show, crossing
// between Insights and Presentations whenever the scores say so.
//
// "Embeddings, same rules" applies the taxonomy ranker's category policy to the same scores:
// home category first, and a document from the other category only when it is STRONG and beats
// the weakest home card it would displace (plan.md → Cross-category ranking). The taxonomy column
// plays by those rules, so this is the column it is fairly compared against. The gap between
// the two embeddings columns is what the policy does; the gap between this one and the taxonomy
// is what the vocabulary does.
//
// ── "STRONG" ON THE ANCHORED SCALE, AS IN THE SCORE SPIKE ────────────────────────────────────
//
// Scores within one page's query are comparable, so "beats the weakest home card" is a raw
// comparison. "Strong" needs an absolute bar, and raw scores carry none. So each score is
// anchored to the page's own document, which is the best match its text can have:
// (score − floor) / (self − floor). 0 is as unrelated as any pair here, 1 is the page itself.
// DOC_FLOOR is frozen just under the lowest document-to-document score in the first baseline
// (5.183, 2026-10-27), the way the spike froze 4.9 for concepts. The two floors differ because
// the queries differ: a document's opening against a concept's definition.
//
// ── THE CATEGORIES MUST MATCH THE RANKER'S ───────────────────────────────────────────────────
//
// Insights is article, caseStudy and note; Presentations is presentation (plan.md). `category`
// maps by _type for now. When the cross-category refactor lands in web/src/lib/related.ts, import
// its category function here instead, so the baseline and the ranker can't disagree.
import {readFileSync, readdirSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

export const DOC_FLOOR = 5.1

/**
 * The crossing rule for "Embeddings, same rules" (Andy, 2026-10-27).
 *
 * crossMin 0.70 crosses on 9 of 44 insight pages and 10 of 29 presentations. At 0.80 only the
 * exact same-work pairs crossed. The band down to 0.70 was still mostly topical (two Headless CMS
 * pieces; Content First Prototyping with Designing with Code), so it stays in. crossMax 1: at most
 * one card from the other category, which is the value the counts were measured at.
 */
export const CROSS = {crossMin: 0.7, crossMax: 1}

export const category = (type) => (type === 'presentation' ? 'presentations' : 'insights')

export function loadBaseline(path) {
  const dir = new URL('./scores/', import.meta.url)
  const file = path
    ? new URL(path, `file://${process.cwd()}/`)
    : new URL(
        readdirSync(dir)
          .filter((n) => n.startsWith('baseline-'))
          .sort()
          .at(-1),
        dir,
      )
  return {file, ...JSON.parse(readFileSync(file))}
}

/** Every other document, best first, with its raw and anchored score. */
function ranked(page, typeOf) {
  return Object.entries(page.scores)
    .filter(([id]) => id !== page._id)
    .map(([id, raw]) => ({id, raw, anchored: (raw - DOC_FLOOR) / (page.self - DOC_FLOOR)}))
    .map((r) => ({...r, cat: category(typeOf(r.id))}))
    .sort((a, b) => b.raw - a.raw)
}

/** "Embeddings": the top 3, whatever their category. */
export function unrestricted(page, typeOf, limit = 3) {
  return ranked(page, typeOf).slice(0, limit)
}

/**
 * "Embeddings, same rules": the top 3 from the home category, then up to `crossMax` documents
 * from the other category, each of which must clear `crossMin` on the anchored scale AND outscore
 * the weakest home card it replaces.
 */
export function sameRules(page, typeOf, {crossMin, crossMax = 1}, limit = 3) {
  const home = category(page._type)
  const all = ranked(page, typeOf)
  const list = all.filter((r) => r.cat === home).slice(0, limit)
  let crossed = 0
  for (const c of all.filter((r) => r.cat !== home)) {
    if (crossed >= crossMax || c.anchored < crossMin) break
    const weakest = list.at(-1)
    if (weakest && c.raw <= weakest.raw) break
    if (list.length >= limit) list.pop()
    list.push(c)
    list.sort((a, b) => b.raw - a.raw)
    crossed++
  }
  return list
}

/* ── Run directly: a summary for choosing crossMin ──────────────────────────── */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const base = loadBaseline(process.argv[2])
  const typeOf = (id) => base.pages.find((p) => p._id === id)?._type
  const title = (id) => base.pages.find((p) => p._id === id)?.title
  const byCat = (cat) => base.pages.filter((p) => category(p._type) === cat)

  console.log(`Baseline ${base.file.pathname.split('/').at(-1)} (${base.pages.length} pages)\n`)
  console.log('Unrestricted top 3 that cross categories:')
  for (const cat of ['insights', 'presentations']) {
    const ps = byCat(cat)
    const n = ps.filter((p) => unrestricted(p, typeOf).some((r) => r.cat !== cat)).length
    console.log(`  ${cat.padEnd(14)} ${n} of ${ps.length} pages`)
  }

  console.log('\nSame rules: pages that show a cross card, by crossMin (crossMax 1):')
  const grid = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7]
  console.log(`  ${'crossMin'.padEnd(14)} ${grid.map((g) => g.toFixed(2).padStart(5)).join(' ')}`)
  for (const cat of ['insights', 'presentations']) {
    const ps = byCat(cat)
    const counts = grid.map(
      (crossMin) =>
        ps.filter((p) => sameRules(p, typeOf, {crossMin}).some((r) => r.cat !== cat)).length,
    )
    console.log(
      `  ${cat.padEnd(14)} ${counts.map((c) => String(c).padStart(5)).join(' ')}   of ${ps.length}`,
    )
  }

  const homeThird = base.pages
    .map((p) => sameRules(p, typeOf, {crossMin: Infinity}).at(-1)?.anchored)
    .filter((x) => x != null)
    .sort((a, b) => a - b)
  console.log(
    `\nFor scale: the weakest home card scores ${homeThird[0].toFixed(2)}–${homeThird.at(-1).toFixed(2)} anchored (median ${homeThird[homeThird.length >> 1].toFixed(2)}).`,
  )

  console.log(`\nCross cards at the chosen crossMin ${CROSS.crossMin.toFixed(2)}, strongest first:`)
  const crossings = base.pages
    .flatMap((p) =>
      sameRules(p, typeOf, CROSS)
        .filter((r) => r.cat !== category(p._type))
        .map((r) => ({p, r})),
    )
    .sort((a, b) => b.r.anchored - a.r.anchored)
  for (const {p, r} of crossings.slice(0, 12)) {
    console.log(`  ${r.anchored.toFixed(2)}  ${p.title}  →  ${title(r.id)}`)
  }
  if (crossings.length > 12) console.log(`  … ${crossings.length - 12} more`)
}
