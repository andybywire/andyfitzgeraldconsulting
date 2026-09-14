/**
 * Proposes multiword terms for the Topic scheme, from the prose that is already published.
 *
 * ── RUN BY HAND. IT IS NOT PART OF THE BUILD, AND THAT IS THE DESIGN ────────
 *
 *   node scripts/phrase-candidates.mjs
 *
 * The same arrangement as `subset-fonts.sh`: a generator whose output a person reads,
 * never something the site depends on at build time. `bodyTerms` is built from the
 * controlled vocabulary alone, so nothing this prints can reach `/search.json` until
 * somebody puts it in a concept scheme. That is the entire point — see the header of
 * `buildTermVocabulary` for the measurements that decided it, in short:
 *
 *   G² finds COLLOCATIONS, and ordinary English collocations are strong ones.
 *   "relationships between" (197), "across contexts" (180), "make sure" (150) and
 *   "think about" (149) all score at or above "card sorting" (183). No threshold
 *   separates them, and corpus statistics do not either — "little bit" has a minimum
 *   member `df` of 7, identical to "mental models".
 *
 * So EXPECT ROUGHLY HALF THIS LIST TO BE NOISE. It is a reading list, not a result. The
 * job it does is the one a person cannot: surfacing the term of art used in nine
 * documents that nobody has thought to add to the vocabulary yet.
 */
import {createClient} from '@sanity/client'
import {writeFileSync} from 'node:fs'
import {createServer} from 'vite'

/* Minimums, tuned against `production-26` on 2026-09-14. The frequency floor does most of
   the work: 84% of the 11,409 distinct pairs occur exactly once, and requiring three
   occurrences across two documents cuts the field to 549 before G² is consulted at all. */
const MIN_OCCURRENCES = 3
const MIN_DOCUMENTS = 2
const MIN_G2 = 10.83 /* p < 0.001 at 1 degree of freedom. */
const SHOW = 80

/**
 * The real query module, loaded through Vite rather than copied or parsed.
 *
 * ── WHY NOT JUST WRITE THE QUERY HERE ───────────────────────────────────────
 *
 * `keywordSource` is what the index actually reads, and a candidate list computed over
 * different prose than the index sees would propose terms that then fail to appear. That
 * projection has already grown once — `caseStudy` keeps its prose in five fields
 * `article` does not have, and missing them hid 31,547 characters with a green build — so
 * a second copy here is a copy that will eventually be wrong.
 *
 * ── AND WHY VITE, WHICH LOOKS LIKE OVERKILL ─────────────────────────────────
 *
 * Two cheaper things were tried and neither works. Bare `node` strips TypeScript now, but
 * `queries/search.ts` imports `../fragments` with no file extension, which Vite resolves
 * and Node does not. Reading the source text and slicing out the query fails differently
 * and worse: the file holds `${IDENTITY}` and `${INSIGHT_BLOCKS}` as literal template
 * interpolations, so what comes off disk is not valid GROQ and Sanity rejects it with
 * "param $ referenced, but not provided".
 *
 * `vite` is already a devDependency, and `ssrLoadModule` gives the composed queries
 * exactly as the build sees them. `tsx` would also work and is deliberately not used: it
 * is present only transitively, so depending on it here would be depending on something
 * nothing declares.
 */
const loadModules = async () => {
  const vite = await createServer({
    configFile: false,
    appType: 'custom',
    logLevel: 'error',
    server: {middlewareMode: true},
  })
  try {
    return {
      queries: await vite.ssrLoadModule('/src/sanity/queries/search.ts'),
      keywords: await vite.ssrLoadModule('/src/lib/keywords.ts'),
    }
  } finally {
    await vite.close()
  }
}

/**
 * Dunning log-likelihood on the 2x2 table for one adjacent pair.
 *
 * Not PMI: PMI rewards hapax pairs enormously — two rare words meeting once outscore a
 * term of art used forty times — which is the failure this is trying to avoid rather than
 * commit. G² is the corpus-linguistics standard at low counts.
 */
const gSquared = (a, firstTotal, secondTotal, n) => {
  const b = firstTotal - a
  const c = secondTotal - a
  const d = n - a - b - c
  const cell = (o, e) => (o > 0 && e > 0 ? o * Math.log(o / e) : 0)
  const r1 = a + b
  const r2 = c + d
  const c1 = a + c
  const c2 = b + d
  return (
    2 *
    (cell(a, (r1 * c1) / n) +
      cell(b, (r1 * c2) / n) +
      cell(c, (r2 * c1) / n) +
      cell(d, (r2 * c2) / n))
  )
}

process.loadEnvFile(new URL('../.env', import.meta.url).pathname)

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.PUBLIC_SANITY_DATASET,
  apiVersion: '2026-08-18',
  useCdn: false,
  perspective: 'published',
})

const {queries, keywords} = await loadModules()
const {segments, normalizeLabel} = keywords

const [insights, presentations, conceptRows] = await Promise.all([
  client.fetch(queries.SEARCH_INSIGHTS_QUERY),
  client.fetch(queries.SEARCH_PRESENTATIONS_QUERY),
  client.fetch(queries.SEARCH_CONCEPTS_QUERY),
])

const docs = [...insights, ...presentations].filter((row) => row.keywordSource)
const vocabulary = new Set(
  conceptRows
    .flatMap((scheme) => scheme.labels)
    .map(normalizeLabel)
    .filter(Boolean),
)

/* Corpus-wide counts in one pass. `first` and `second` are the marginals the contingency
   table needs: how often each word opens a pair and how often it closes one. */
const pair = new Map()
const pairDocs = new Map()
const first = new Map()
const second = new Map()
let slots = 0

for (const doc of docs) {
  const seen = new Set()
  for (const segment of segments(doc.keywordSource)) {
    for (let i = 0; i + 1 < segment.length; i++) {
      const key = `${segment[i]} ${segment[i + 1]}`
      pair.set(key, (pair.get(key) ?? 0) + 1)
      first.set(segment[i], (first.get(segment[i]) ?? 0) + 1)
      second.set(segment[i + 1], (second.get(segment[i + 1]) ?? 0) + 1)
      seen.add(key)
      slots++
    }
  }
  for (const key of seen) pairDocs.set(key, (pairDocs.get(key) ?? 0) + 1)
}

const candidates = [...pair]
  .filter(([key, count]) => count >= MIN_OCCURRENCES && (pairDocs.get(key) ?? 0) >= MIN_DOCUMENTS)
  .filter(([key]) => !vocabulary.has(key))
  .map(([key, count]) => {
    const [w1, w2] = key.split(' ')
    return {
      term: key,
      count,
      docs: pairDocs.get(key),
      g2: gSquared(count, first.get(w1) ?? 0, second.get(w2) ?? 0, slots),
    }
  })
  .filter((row) => row.g2 >= MIN_G2)
  /* Alphabetical tiebreak, so re-running on unchanged content produces an unchanged file
     and a real diff means real new writing. Same reasoning as everywhere else here. */
  .sort((a, b) => b.g2 - a.g2 || a.term.localeCompare(b.term))

const today = new Date().toISOString().slice(0, 10)
const rows = candidates
  .slice(0, SHOW)
  .map((r) => `| ${r.term} | ${r.count} | ${r.docs} | ${r.g2.toFixed(0)} |`)
  .join('\n')

const doc = `# Phrase candidates for the Topic scheme

<!-- GENERATED by web-next/scripts/phrase-candidates.mjs. Do not edit by hand: re-run it.
     Nothing here affects the build. See that script's header for why. -->

Multiword terms the published prose supports, which are **not yet in a concept scheme**.

Generated ${today}, from ${docs.length} documents with prose against ${vocabulary.size} vocabulary labels.

## How to read this

\`bodyTerms\` in the search index is built from the controlled vocabulary **only**. So a
term below is invisible to search until somebody adds it as a concept — that is the whole
loop this file exists to serve, and it is why nothing here can ship by accident.

**Expect roughly half of this to be noise.** The score is Dunning log-likelihood, which
measures whether two words co-occur more than chance — and ordinary English collocations
do. "make sure" and "think about" score as strongly as real terminology, and no threshold
or corpus statistic separates them; that was measured rather than assumed. Skim for what
you recognise as vocabulary and ignore the rest.

Adding one is worth it when the term is **shared** — used across several documents. A
phrase used once is already reachable through \`keywords\`, which is what TF-IDF is good at.
The \`docs\` column is therefore the one to scan, not \`G²\`.

| term | uses | docs | G² |
|---|---|---|---|
${rows}

${candidates.length > SHOW ? `_${candidates.length - SHOW} further candidates met the floor and are not shown. Raise \`SHOW\` in the script to see them._\n` : ''}
## Thresholds

A pair must occur at least ${MIN_OCCURRENCES} times, across at least ${MIN_DOCUMENTS} documents, and score G² ≥ ${MIN_G2} (p < 0.001).

Counted ${pair.size.toLocaleString()} distinct pairs across ${slots.toLocaleString()} adjacent-word slots; ${candidates.length} survived. Most of that cut is the frequency floor rather than the score: 84% of pairs occur exactly once.
`

const out = new URL('../../docs/phrase-candidates.md', import.meta.url)
writeFileSync(out, doc)
console.log(
  `${candidates.length} candidates from ${docs.length} documents → docs/phrase-candidates.md`,
)
