// Proposes terms for the Topic scheme from the lab's prose, one word and two words long, as
// inputs to taxonomy revision 1.
//
//   node docs/recommendations-research/term-candidates.mjs
//
// Writes, beside itself, a Markdown list of the top candidates and a CSV of all of them for each:
// bigram-candidates.md / .csv and word-candidates.md / .csv. Spends no quota.
//
// ── ONE FETCH, SO BOTH LISTS COME FROM THE SAME DOCUMENTS ─────────────────────────────────────
//
// The bigram list in docs/phrase-candidates.md came from web/scripts/phrase-candidates.mjs on
// 2026-09-14, over 53 documents in production-26, before many presentations had any text. This
// reads the lab's 73, the set the research tags, and counts words and pairs in the same pass.
//
// It reads the lab over the public API with no token, as fetch-corpus.mjs does (plan.md → Ground
// rules). phrase-candidates.mjs reads the dataset in web/.env, which is production-26, and writes
// docs/phrase-candidates.md, which serves the site's search vocabulary, so it is left alone.
//
// ── THE BIGRAM LIST IS phrase-candidates.mjs's PROCESS, UNCHANGED ─────────────────────────────
//
//   - The same prose: the search index's `keywordSource` for insights and presentations, from
//     web/src/sanity/queries/search.ts, loaded through Vite as phrase-candidates.mjs loads it.
//     Its header says why a copy of that projection would drift.
//   - The same tokenizer: lib/keywords.ts → `segments`, with its stopwords, its two-character
//     floor and the ALLOW list that keeps "ai", "ia", "ui" and "ux". A pair never spans a
//     segment break, so a stopword or punctuation between two words keeps them apart.
//   - The same floors: at least 3 uses across at least 2 documents, and G² ≥ 10.83 (p < 0.001).
//   - The same exclusion: a pair that already is a vocabulary label (normalizeLabel) is left out.
//
// `gSquared` is COPIED from phrase-candidates.mjs rather than imported, because that script runs
// its whole fetch on import. It is a fixed formula, so the copy has nothing to drift with; its
// reasoning (why G² rather than PMI) stays in the original.
//
// ── THE WORD LIST, AND WHY ITS SCORE DIFFERS ─────────────────────────────────────────────────
//
// The same prose, tokenizer, floors and exclusion. But G² asks whether two words co-occur more
// than chance, and a single word has no partner. The single-word measure this site already
// relies on is the search index's TF-IDF keyword pass (lib/keywords.ts → extractKeywords, 25
// terms per document, as search-index.ts calls it). So a word scores by how many documents it is
// a top keyword IN. A word every document uses has no IDF and never makes a list; a word one
// document leans on makes one; a term several documents lean on makes several, and that is what
// a concept needs. A candidate must make at least 2, the counterpart of the 2-document floor.
//
// "In labels" names the existing labels a word already appears inside, such as "testing" in
// Tree Testing. Such a word may still be a candidate for a broader concept.
//
// Expect noise in both. They are reading lists for sorting, not results.
import {writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {extractKeywords, normalizeLabel, segments} from '../../web/src/lib/keywords.ts'
import {API_VERSION, LAB, PROJECT} from './lab-api.mjs'

const MIN_OCCURRENCES = 3
const MIN_DOCUMENTS = 2
const MIN_G2 = 10.83 /* p < 0.001 at 1 degree of freedom, as phrase-candidates.mjs */
const KEYWORDS_PER_DOC = 25 /* search-index.ts's own value */
const MIN_KEYWORD_DOCS = 2
const SHOW_BIGRAMS = 80 /* as phrase-candidates.mjs */
const SHOW_WORDS = 120

/* Vite resolves search.ts's extensionless imports, which plain Node does not. It is web/'s
   dependency, so it is resolved from there. */
const webRoot = new URL('../../web/', import.meta.url)
const vitePath = createRequire(new URL('package.json', webRoot)).resolve('vite')
const {createServer} = await import(pathToFileURL(vitePath).href)
const vite = await createServer({
  root: webRoot.pathname,
  configFile: false,
  appType: 'custom',
  logLevel: 'error',
  server: {middlewareMode: true},
})
let queries
try {
  queries = await vite.ssrLoadModule('/src/sanity/queries/search.ts')
} finally {
  await vite.close()
}

const groq = async (query) => {
  const url = `https://${PROJECT}.api.sanity.io/v${API_VERSION}/data/query/${LAB}?perspective=published`
  const res = await fetch(url, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({query}),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return (await res.json()).result
}

const [insights, presentations, conceptRows] = await Promise.all([
  groq(queries.SEARCH_INSIGHTS_QUERY),
  groq(queries.SEARCH_PRESENTATIONS_QUERY),
  groq(queries.SEARCH_CONCEPTS_QUERY),
])

const docs = [...insights, ...presentations].filter((row) => row.keywordSource)
const labels = conceptRows.flatMap((scheme) => scheme.labels).filter(Boolean)
const vocabulary = new Set(labels.map(normalizeLabel).filter(Boolean))
const today = new Date().toISOString().slice(0, 10)

const csv = (value) => {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}
const writeCsv = (name, header, rows) =>
  writeFileSync(
    new URL(`./${name}`, import.meta.url),
    [header.join(','), ...rows.map((row) => row.map(csv).join(','))].join('\n') + '\n',
  )

/* ── One pass: words, and pairs within a segment ───────────────────────────── */

const uses = new Map()
const inDocs = new Map()
/* `first` and `second` are the marginals G²'s table needs: how often each word opens a pair and
   how often it closes one. */
const pair = new Map()
const pairDocs = new Map()
const first = new Map()
const second = new Map()
let slots = 0

for (const doc of docs) {
  const seenWords = new Set()
  const seenPairs = new Set()
  for (const segment of segments(doc.keywordSource)) {
    for (const word of segment) {
      uses.set(word, (uses.get(word) ?? 0) + 1)
      seenWords.add(word)
    }
    for (let i = 0; i + 1 < segment.length; i++) {
      const key = `${segment[i]} ${segment[i + 1]}`
      pair.set(key, (pair.get(key) ?? 0) + 1)
      first.set(segment[i], (first.get(segment[i]) ?? 0) + 1)
      second.set(segment[i + 1], (second.get(segment[i + 1]) ?? 0) + 1)
      seenPairs.add(key)
      slots++
    }
  }
  for (const word of seenWords) inDocs.set(word, (inDocs.get(word) ?? 0) + 1)
  for (const key of seenPairs) pairDocs.set(key, (pairDocs.get(key) ?? 0) + 1)
}

/* ── Bigrams ─────────────────────────────────────────────────────────────── */

/** Dunning log-likelihood on the 2x2 table for one adjacent pair. Copied from
    phrase-candidates.mjs; see the header above. */
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

const bigrams = [...pair]
  .filter(([key, count]) => count >= MIN_OCCURRENCES && (pairDocs.get(key) ?? 0) >= MIN_DOCUMENTS)
  .filter(([key]) => !vocabulary.has(key))
  .map(([key, count]) => {
    const [w1, w2] = key.split(' ')
    return {
      term: key,
      uses: count,
      docs: pairDocs.get(key),
      g2: gSquared(count, first.get(w1) ?? 0, second.get(w2) ?? 0, slots),
    }
  })
  .filter((row) => row.g2 >= MIN_G2)
  /* Alphabetical last, so an unchanged corpus writes an unchanged file. */
  .sort((a, b) => b.g2 - a.g2 || a.term.localeCompare(b.term))

writeFileSync(
  new URL('./bigram-candidates.md', import.meta.url),
  `# Bigram candidates for the Topic scheme

<!-- GENERATED by docs/recommendations-research/term-candidates.mjs. Do not edit by hand: re-run it. -->

Two-word terms the published prose supports, which are **not yet a vocabulary label**, as an input to taxonomy revision 1. The same process as \`docs/phrase-candidates.md\`, run over the lab's documents rather than \`production-26\`'s.

Generated ${today} from \`${LAB}\`, from ${docs.length} documents with prose against ${vocabulary.size} vocabulary labels. ${bigrams.length} candidates; the top ${Math.min(SHOW_BIGRAMS, bigrams.length)} are below, and \`bigram-candidates.csv\` has them all.

## How to read this

**G²** is Dunning log-likelihood: whether the two words occur together more than chance. Ordinary English collocations score as strongly as real terminology ("make sure", "think about"), and no threshold separates them, so expect roughly half of this to be noise. **docs** is the column to scan: a term worth a concept is shared across several documents.

| term | uses | docs | G² |
|---|---|---|---|
${bigrams
  .slice(0, SHOW_BIGRAMS)
  .map((r) => `| ${r.term} | ${r.uses} | ${r.docs} | ${r.g2.toFixed(0)} |`)
  .join('\n')}

## Thresholds

A pair must occur at least ${MIN_OCCURRENCES} times, across at least ${MIN_DOCUMENTS} documents, and score G² ≥ ${MIN_G2} (p < 0.001). Counted ${pair.size.toLocaleString()} distinct pairs across ${slots.toLocaleString()} adjacent-word slots.
`,
)
writeCsv(
  'bigram-candidates.csv',
  ['term', 'uses', 'docs', 'G2'],
  bigrams.map((r) => [r.term, r.uses, r.docs, r.g2.toFixed(1)]),
)

/* ── Single words ────────────────────────────────────────────────────────── */

/* How many documents each word is a top keyword of: the score. */
const keywords = extractKeywords(
  docs.map((doc, i) => ({id: String(i), text: doc.keywordSource})),
  KEYWORDS_PER_DOC,
)
const keywordDocs = new Map()
for (const terms of keywords.values()) {
  for (const word of terms) keywordDocs.set(word, (keywordDocs.get(word) ?? 0) + 1)
}

const inLabels = (word) =>
  labels.filter((label) => (normalizeLabel(label) ?? '').split(' ').includes(word))

const words = [...uses]
  .filter(([word, n]) => n >= MIN_OCCURRENCES && (inDocs.get(word) ?? 0) >= MIN_DOCUMENTS)
  .filter(([word]) => !vocabulary.has(word))
  .map(([word, n]) => ({
    term: word,
    keywordDocs: keywordDocs.get(word) ?? 0,
    docs: inDocs.get(word),
    uses: n,
    inLabels: inLabels(word),
  }))
  .filter((row) => row.keywordDocs >= MIN_KEYWORD_DOCS)
  .sort(
    (a, b) =>
      b.keywordDocs - a.keywordDocs ||
      b.docs - a.docs ||
      b.uses - a.uses ||
      a.term.localeCompare(b.term),
  )

writeFileSync(
  new URL('./word-candidates.md', import.meta.url),
  `# Word candidates for the Topic scheme

<!-- GENERATED by docs/recommendations-research/term-candidates.mjs. Do not edit by hand: re-run it. -->

Single words the published prose supports, which are **not yet a vocabulary label**: the one-word counterpart of \`bigram-candidates.md\`, from the same documents, as an input to taxonomy revision 1.

Generated ${today} from \`${LAB}\`, from ${docs.length} documents with prose against ${vocabulary.size} vocabulary labels. ${words.length} candidates; the top ${Math.min(SHOW_WORDS, words.length)} are below, and \`word-candidates.csv\` has them all.

## How to read this

**keyword docs** is the score: how many documents the word is one of the ${KEYWORDS_PER_DOC} most distinctive words of, by the TF-IDF the search index uses. A word every document uses scores nothing; a word several documents lean on scores high. **docs** and **uses** count every appearance. **in labels** names existing labels the word already sits inside, which can make it a candidate for a broader concept rather than a new one.

Expect noise. The tokenizer, floors and exclusions are the bigram list's own; only the score differs, because G² needs two words.

| term | keyword docs | docs | uses | in labels |
|---|---|---|---|---|
${words
  .slice(0, SHOW_WORDS)
  .map((r) => `| ${r.term} | ${r.keywordDocs} | ${r.docs} | ${r.uses} | ${r.inLabels.join(', ')} |`)
  .join('\n')}

## Thresholds

A word must occur at least ${MIN_OCCURRENCES} times, across at least ${MIN_DOCUMENTS} documents, and be one of the top ${KEYWORDS_PER_DOC} keywords of at least ${MIN_KEYWORD_DOCS} documents. Counted ${uses.size.toLocaleString()} distinct words.
`,
)
writeCsv(
  'word-candidates.csv',
  ['term', 'keyword docs', 'docs', 'uses', 'in labels'],
  words.map((r) => [r.term, r.keywordDocs, r.docs, r.uses, r.inLabels.join('; ')]),
)

console.log(
  `${docs.length} documents in ${LAB}: ${bigrams.length} bigram and ${words.length} word candidates`,
)
