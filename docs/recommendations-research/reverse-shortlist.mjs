// The reverse direction (2026-11-14 to 11-17): each document's text as the query, scoring the
// Topic concepts, instead of each concept's text scoring the documents.
//
//   node docs/recommendations-research/reverse-shortlist.mjs        # spends one search per chunk
//   node docs/recommendations-research/reverse-report.mjs <file>    # the analysis, spends none
//
// ── WHY IT WAS TRIED ─────────────────────────────────────────────────────────────────────────
//
// Tagging one document the forward way costs one semantic search per concept, 68 today, and the
// organization's quota is 1,000 a month. A document is usually short, so querying FROM it could
// be far cheaper. But a query is read only to about 2,500 characters, and 71% of the corpus text
// sits past that point in its document, so a long piece can't be one query.
//
// ── HOW A DOCUMENT IS CHUNKED (Andy's design) ────────────────────────────────────────────────
//
// At each heading, with the heading inside its section; a section too long for one query splits
// at paragraph breaks, the boundaries of individual thoughts; a paragraph too long, by
// characters. Adjacent short sections are then PACKED together up to the limit, because a
// section of a sentence or two makes a weak query. The text before the first heading opens with
// the title and descriptions. Limit: 2,000 characters, under the measured read limit.
//
// Each chunk is one query scoring all 68 concepts AND the document itself. Writes raw `_score`s,
// per chunk, to scores/reverse-<dataset>-<stamp>.json, after every document, so a run cut short
// (by the quota, say) keeps what it got and resumes with --resume <file>. The documents' text is
// fetched into reverse-blocks.json, which is gitignored like corpus.json.
import fs from 'node:fs'

const DATASET = process.env.DATASET ?? 'recommendations-lab'
if (DATASET === 'production-26') throw new Error('The lab only: see plan.md → Ground rules.')
const API = `https://7v0qvet6.api.sanity.io/v2026-08-18/data/query/${DATASET}?perspective=published`
const here = (p) => new URL(p, import.meta.url)
const LIMIT = 2000

const groq = async (query, params = {}) => {
  const res = await fetch(API, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({query, params}),
  })
  return res
}

/* The concepts are v5's, so the results can be set against v5's matrix. */
const matrix = JSON.parse(
  fs.readFileSync(here('./scores/spike-recommendations-lab-combined-20261106T192359Z.json')),
)
const concepts = matrix.concepts.map((c) => c._id)

const BLOCKS = `*[_type in ["article","caseStudy","note","presentation"] && defined(slug.current) && defined(pubDate)]{
  _id, _type, title, subtitle, shortDescription, description,
  "blocks": [...coalesce(body, []), ...coalesce(bodyText, []), ...coalesce(highlights, [])][_type == "block"]{style, "text": pt::text(@)}
}`
const blocksFile = here('./reverse-blocks.json')
if (!fs.existsSync(blocksFile)) {
  const res = await groq(BLOCKS)
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  fs.writeFileSync(blocksFile, JSON.stringify((await res.json()).result))
}
const docs = JSON.parse(fs.readFileSync(blocksFile))

const isHeading = (s) => /^h[1-6]$/.test(s ?? '')
const lead = (d) =>
  [d.title, d.subtitle, d.shortDescription, d.description].filter((s) => s?.trim()).join('\n\n')

/** Paragraphs into chunks of at most LIMIT characters, splitting only at paragraph breaks. */
function pack(paras) {
  const out = []
  let cur = ''
  for (const p of paras.flatMap((p) =>
    p.length > LIMIT ? p.match(new RegExp(`[\\s\\S]{1,${LIMIT}}`, 'g')) : [p],
  )) {
    if (cur && cur.length + 2 + p.length > LIMIT) {
      out.push(cur)
      cur = p
    } else cur = cur ? `${cur}\n\n${p}` : p
  }
  if (cur) out.push(cur)
  return out
}

/** Sections at headings, split at paragraphs, then packed. */
function chunks(d) {
  const sections = [[lead(d)].filter(Boolean)]
  for (const b of d.blocks ?? []) {
    if (!b.text?.trim()) continue
    if (isHeading(b.style)) sections.push([b.text])
    else sections.at(-1).push(b.text)
  }
  return pack(sections.filter((s) => s.length).flatMap(pack))
}

const SCORE = `*[_id in $concepts || _id == $doc] | score(text::semanticSimilarity($q)) {_id, _score}`
const at = process.argv.indexOf('--resume')
const out =
  at === -1
    ? here(
        `./scores/reverse-${DATASET}-${new Date()
          .toISOString()
          .replace(/[-:]/g, '')
          .replace(/\.\d+Z$/, 'Z')}.json`,
      )
    : new URL(process.argv[at + 1], `file://${process.cwd()}/`)
const state = fs.existsSync(out)
  ? JSON.parse(fs.readFileSync(out))
  : {
      dataset: DATASET,
      limit: LIMIT,
      takenAt: new Date().toISOString(),
      spent: 0,
      stopped: null,
      results: {},
    }

const todo = docs.filter((d) => !state.results[d._id])
console.log(`${todo.length} documents, ${todo.reduce((n, d) => n + chunks(d).length, 0)} searches`)
outer: for (const d of todo.sort((a, b) => a._id.localeCompare(b._id))) {
  const runs = []
  for (const q of chunks(d)) {
    const res = await groq(SCORE, {concepts, doc: d._id, q})
    if (!res.ok) {
      state.stopped = {
        document: d.title.trim(),
        status: res.status,
        body: (await res.text()).slice(0, 500),
      }
      break outer
    }
    state.spent++
    runs.push({
      chars: q.length,
      scores: Object.fromEntries((await res.json()).result.map((r) => [r._id, r._score])),
    })
  }
  state.results[d._id] = {title: d.title.trim(), runs}
  fs.writeFileSync(out, JSON.stringify(state))
}
fs.writeFileSync(out, JSON.stringify(state))
console.log(
  `${Object.keys(state.results).length} of ${docs.length} documents; ${state.spent} searches → ${out.pathname}`,
)
if (state.stopped) console.log('STOPPED:', JSON.stringify(state.stopped))
