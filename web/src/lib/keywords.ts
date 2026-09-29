/**
 * Build-time keyword extraction: a document's body compressed to the terms that
 * distinguish it from every other document.
 *
 * ── WHY THIS EXISTS WHEN THE SEARCH ENGINE ALREADY SCORES WITH TF-IDF ───────
 *
 * MiniSearch ranks with BM25, which is TF-IDF's descendant — so if the bodies were IN
 * the index, this module would be redundant. They are not, and that was measured rather
 * than assumed: shipping every body takes `/search.json` from 36 KB / 10 KB gzipped to
 * 389 / 134, on a file fetched the first time a visitor searches.
 *
 * So the body never reaches the browser, and this is what stands in for it: lossy
 * compression down to ~25 terms per document. The engine still does the ranking; this
 * only decides what it is allowed to rank on. The corpus-wide half of TF-IDF has to
 * happen here because IDF is a property of the whole corpus, and the browser never sees
 * the corpus — only its output.
 *
 * ── WHAT IT CANNOT DO, SO NOBODY EXPECTS IT TO ──────────────────────────────
 *
 * No snippets, because there is no prose left to snip. And a term the author used exactly
 * once in a long document may not survive the cut, which is the honest cost of the 8×
 * saving.
 *
 * It also cannot find MULTIWORD terms, and that is not a gap to be fixed here — it was
 * measured and found unfixable at this altitude. `tree testing` occurs 6 times across 5
 * documents; scored as a unit against this corpus it earns `(1 + ln 1) × ln(52/5) = 2.34`,
 * which lands below rank 264 in a document that discusses it. Giving bigrams their own
 * pool inverts rather than fixes it: a phrase used in ONE document scores ln(52/1) = 3.95
 * and wins, so the tail fills with one-off phrasings. The property that makes something a
 * term of art — shared vocabulary, hence high `df` — is exactly what IDF penalises.
 *
 * So multiword terms are handled by `findTerms` below, against the controlled vocabulary,
 * where a human has already decided what counts as a term. See `docs/search-ranking.md`.
 *
 * Measured on the built index at 25 terms per document: a 13.1 KB payload across the 51
 * documents that have prose, 1,089 distinct terms. The curve either side — 7.7 KB at 15
 * and 19.3 KB at 40 — is flat enough that the choice is about precision, not bytes.
 */

/**
 * Two-character tokens that are vocabulary rather than noise.
 *
 * ── AN ALLOWLIST, NOT A LOWER FLOOR, AND THE DIFFERENCE IS THE POINT ────────
 *
 * The length floor exists because two characters is where tokenising noise lives, and
 * the corpus bears that out: the most frequent two-character tokens are "of", "in", "to",
 * "it", "on", "as" — already stopwords — followed by "re", "ve" and "ll", which are
 * contraction tails from the apostrophe split. Lowering the floor would admit all of
 * that. Naming four terms admits exactly four.
 *
 * These are the field's vocabulary, so the floor was costing real terms — the note on
 * STOP below has always said as much about "ia". It also gates the concept scheme:
 * `normalizeLabel` rejects any label a token is dropped from, so without this a "UX
 * Research" concept could not be represented at all.
 *
 * Measured across the 52 documents with prose: 5 change, "ai" earning a slot in 3 and
 * "ia" in 2, displacing "speakers", "love", "development" and "approaches" once each.
 * "ux" and "ui" earn no slot today and are here for the labels rather than the bodies.
 */
const ALLOW = new Set(['ai', 'ia', 'ui', 'ux'])

/* A bare number is never a useful search term here. Years were the visible case —
   2009, 2012, 2018 and five more all earned a slot — and the year of anything on this
   site is already in its title, its `date` and its `dateLabel`. */
const keep = (term: string): boolean =>
  (term.length > 2 || ALLOW.has(term)) && !/^\d+$/.test(term) && !STOP.has(term)

/**
 * The text as runs of CONSECUTIVE content tokens.
 *
 * ── NO DIACRITIC FOLDING HERE, DELIBERATELY ─────────────────────────────────
 *
 * The obvious move is to normalise "café" to "cafe". It would be wrong: these terms are
 * indexed by MiniSearch alongside `title`, `topics` and `description`, and MiniSearch's
 * default `processTerm` only lowercases. Folding here and nowhere else would make the
 * keywords the one field in the index tokenised by different rules than the query is —
 * so "café" would find a title and silently miss its own body terms.
 *
 * Fold everywhere or fold nowhere. Nowhere is the cheaper half of that choice today, and
 * the day it changes it changes in the engine config, for every field at once.
 *
 * ── THE BOUNDARIES ARE THE WHOLE POINT, AND THERE ARE TWO ───────────────────
 *
 * `findTerms` matches multiword terms by adjacency, so anything that erases a boundary
 * invents a term that was never written. Both levels below were added because the naive
 * version produced exactly such a phantom:
 *
 *   chunk break — on anything that is not a letter, digit, space or hyphen. That is every
 *   period, comma, colon, paren, quote, and the newlines `pt::text()` leaves between
 *   blocks. Without it, "improve findability. Testing showed…" yields "findability
 *   testing" — two real words, adjacent in the token stream, never adjacent on the page.
 *
 *   segment break — on any DROPPED token, so a stopword is a wall too. Without it, "the
 *   design of systems" yields "design systems".
 *
 * Hyphens split WITHIN a chunk rather than breaking it, so "user-centered design" stays
 * one segment. That is deliberate: a hyphen joins where a comma separates.
 *
 * The cost is terms that legitimately contain a stopword — "point of view", "bag of
 * words" — which cannot be represented at all. Accepted: admitting them means letting
 * stopwords into the middle of n-grams, and the phantom above is the thing that produces.
 */
export const segments = (text: string): string[][] => {
  const out: string[][] = []
  for (const chunk of text.toLowerCase().split(/[^\p{L}\p{N} -]+/u)) {
    let current: string[] = []
    for (const raw of chunk.split(/[ -]+/)) {
      if (keep(raw)) current.push(raw)
      else if (current.length) {
        out.push(current)
        current = []
      }
    }
    if (current.length) out.push(current)
  }
  return out
}

/**
 * Derived from `segments` rather than written separately, so unigrams and multiword terms
 * can never be tokenised by different rules — the same argument the diacritic note above
 * makes about the engine. Two tokenisers would drift, and the drift would be silent.
 *
 * The REFACTOR was verified byte-identical to the flat tokeniser it replaced — all 52
 * documents with prose, 40,892 tokens, zero mismatches — so nothing here moved `keywords`.
 * The awkward cases all survive because both halves of a broken token fail `keep` the same
 * way: "aren't" → "aren" + "t", "co-design" → "co" dropped and "design" kept, "e.g." →
 * both dropped.
 *
 * `ALLOW` then moved it deliberately, in 5 documents, and that is the measurement to redo
 * if this output ever needs checking again. Refactor and behaviour change were kept apart
 * on purpose so each could be proved on its own.
 */
const tokenize = (text: string): string[] => segments(text).flat()

/**
 * Closed-class English plus the URL debris that prose picks up.
 *
 * The second group is not decoration: an early run of this over the real bodies put
 * "com" and "gov" in the top 25, because a bare domain in a citation is rare across the
 * corpus and therefore scores as highly distinctive. TF-IDF cannot tell a rare word from
 * a rare fragment, so the fragments are named here instead.
 *
 * Terms of three characters or fewer are NOT filtered wholesale — "ia", "ux" and "seo"
 * are the vocabulary of this site, and "ia" is below the length floor only because two
 * characters is where tokenising noise lives.
 */
const STOP = new Set(
  (
    'a an and are as at be been being but by can could did do does for from had has have ' +
    'he her here his how i if in into is it its may might more most no not of on once ' +
    'only or other our out over own same she should so some such than that the their ' +
    'them then there these they this those to up us was we were what when where which ' +
    'who whom whose why will with would you your ' +
    /*
     * Contraction TAILS, which are tokeniser artifacts rather than words. The split is on
     * punctuation, so "aren't" becomes "aren" + "t" and the two-character half falls below
     * the length floor while "aren" survives and scores as rare. Measured: "aren", "isn"
     * and "don" all reached the top 25 of some document.
     *
     * Not fixed by keeping the apostrophe, deliberately: MiniSearch's own tokeniser splits
     * on it too, so a query for "aren't" arrives as the same two pieces. Matching how the
     * engine tokenises beats being cleverer than it.
     */
    'aren arent cant couldn couldnt didn didnt doesn doesnt don dont hadn hasn havent ' +
    'isn isnt shouldn shouldnt wasn wasnt weren werent won wont wouldn wouldnt ' +
    /*
     * URL debris. TF-IDF cannot tell a rare word from a rare fragment, so a bare domain in
     * a citation scores as highly distinctive: "com" and "gov" both reached a top 25, and
     * "int" did too — it is the TLD of who.int, which the WHO case studies cite throughout.
     */
    'com edu gov http https int net org www html www2'
  ).split(' '),
)

/** One document's text, with whatever id the caller wants its keywords back under. */
export interface KeywordDoc {
  id: string
  text: string
}

/**
 * Top `perDoc` terms for each document, by TF-IDF against the other documents given.
 *
 * ── THE CORPUS IS THE ARGUMENT, AND THAT IS THE POINT ───────────────────────
 *
 * Pass every document that has body text in ONE call. Called per document it would
 * compute IDF over a corpus of one, where `log(N / df)` is `log(1)` — zero for every
 * term — and return nothing. That failure is silent and total, which is why the corpus
 * is a parameter rather than something assembled inside.
 *
 * `(1 + log(tf)) * log(N / df)` — sublinear term frequency, so a word used thirty times
 * does not outweigh thirty distinct ideas, times inverse document frequency, so a word
 * every document uses ("content", here) scores exactly zero and drops out on its own.
 * No stop list could have known "content" was noise on THIS corpus; the maths does.
 */
export function extractKeywords(docs: KeywordDoc[], perDoc: number): Map<string, string[]> {
  const tokens = docs.map((doc) => tokenize(doc.text))

  /* Document frequency: how many documents a term appears in AT ALL, hence the Set —
     counting occurrences here instead would make DF a second TF and cancel the ratio. */
  const df = new Map<string, number>()
  for (const terms of tokens) {
    for (const term of new Set(terms)) df.set(term, (df.get(term) ?? 0) + 1)
  }

  const total = docs.length
  const keywords = new Map<string, string[]>()

  docs.forEach((doc, i) => {
    const tf = new Map<string, number>()
    for (const term of tokens[i]) tf.set(term, (tf.get(term) ?? 0) + 1)

    const ranked = [...tf]
      .map(([term, count]): [string, number] => [
        term,
        (1 + Math.log(count)) * Math.log(total / (df.get(term) ?? 1)),
      ])
      /* Score ties are common in a corpus this small — two terms used once each in the
         same document score identically — so the alphabetical tiebreak is what keeps
         `/search.json` byte-stable between builds. Same reasoning as the sort in
         `search-index.ts`: an unstable file busts caches and makes build diffs unreadable
         for no content change. */
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      /* A zero score means the term is in every document, so it separates nothing.
         Dropping it here rather than letting it fill a slot. */
      .filter(([, score]) => score > 0)
      .slice(0, perDoc)
      .map(([term]) => term)

    keywords.set(doc.id, ranked)
  })

  return keywords
}

/**
 * A concept label, normalised by exactly the rules a body is.
 *
 * Returns null when the label cannot survive that normalisation INTACT — a whole label or
 * nothing, never the surviving fragment. A label is rejected when a stopword or
 * punctuation splits it ("Point of View") or when a token is dropped ("3D Modeling" loses
 * "3d" to the length floor). Degrading instead of rejecting is the trap: the fragment is
 * a real word, so "3D Modeling" would seed the bare unigram "modeling" and match every
 * passing use of it. Wrong matches are worse than missing ones, because nothing about
 * them looks broken.
 *
 * ALL of which is why `ALLOW` exists. "AI Integration" was this function's only rejection
 * against `production-26`, and the fix was to stop the floor eating "ai" rather than to
 * work around the damage downstream.
 *
 * Measured 2026-09-14: 88 labels in, 88 normalise, 53 of them multiword, none rejected.
 * A rejection is not a failure — `TermVocabulary.rejected` carries it out to be reported,
 * and the remedy is usually a `hiddenLabel` spelling the term without the awkward token.
 */
export const normalizeLabel = (label: string): string | null => {
  const words = label
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  const segs = segments(label)
  /* More than one segment means a stopword or punctuation split the label; a shorter
     single segment means a token was dropped. Either way the label is not intact. */
  if (segs.length !== 1 || segs[0].length !== words.length) return null
  return segs[0].join(' ')
}

/** The controlled vocabulary, prepared once for repeated lookup. */
export interface TermVocabulary {
  terms: Set<string>
  /** Longest label in tokens, so `findTerms` knows how far to look ahead. */
  maxLength: number
  /**
   * Labels `normalizeLabel` could not represent, for the caller to report.
   *
   * RETURNED RATHER THAN LOGGED so this module stays pure — the reporting belongs at the
   * assembly point, not in a lookup table. It is returned AT ALL because the alternative
   * is the failure this codebase keeps getting bitten by: a curated label that simply is
   * not there, with nothing anywhere saying so. An editor adds a concept, tags nothing
   * differently, and never learns the term is unsearchable.
   */
  rejected: string[]
}

/**
 * ── THE VOCABULARY IS THE SELECTOR, AND THAT WAS MEASURED, NOT ASSUMED ──────
 *
 * The obvious alternative is to DISCOVER multiword terms statistically — score adjacent
 * pairs by collocation strength and keep the strong ones. It was built and measured
 * against this corpus with Dunning log-likelihood, and it does not survive contact:
 * G² finds collocations, and ordinary English collocations are strong ones.
 * "relationships between" (197), "across contexts" (180), "make sure" (150) and "think
 * about" (149) all score at or above "card sorting" (183), so no threshold separates them.
 *
 * Nor does corpus statistics rescue it. Requiring a member to be non-ubiquitous — the
 * move that makes "content" drop out of `extractKeywords` on its own — fails outright:
 * "little bit" has a minimum member `df` of 7, identical to "mental models", and "first
 * pass" at 5 sits BELOW "card sorting" at 4. The distributions overlap completely.
 *
 * So termhood is an editorial judgement here, not an inference. Every term in this
 * vocabulary is one somebody put in a concept scheme. Discovery still runs — as a
 * hand-run script that proposes candidates into `docs/phrase-candidates.md` — but it
 * proposes to a person and never to the index.
 */
export function buildTermVocabulary(labels: Array<string | null>): TermVocabulary {
  const terms = new Set<string>()
  const rejected: string[] = []
  for (const label of labels) {
    if (!label) continue
    const normalized = normalizeLabel(label)
    if (normalized) terms.add(normalized)
    else rejected.push(label)
  }
  let maxLength = 1
  for (const term of terms) maxLength = Math.max(maxLength, term.split(' ').length)
  return {terms, maxLength, rejected: rejected.sort((a, b) => a.localeCompare(b))}
}

/**
 * The vocabulary terms this text contains, deduplicated and sorted.
 *
 * Longest match wins and matches do not overlap, so "user experience design" is found as
 * itself rather than as "experience design" — the vocabulary holds both shapes and the
 * more specific one is the one a reader meant.
 *
 * ── PRESENCE, NOT FREQUENCY, AND THERE IS NO BUDGET ─────────────────────────
 *
 * Each term appears ONCE however often the body says it. The field answers "is this
 * discussed here?", and `topics` — at more than double the boost — already answers "is
 * this what it is about?". Emitting a term per occurrence would make this a second, worse
 * copy of that signal and inflate the payload for it.
 *
 * No `slice` either, deliberately. `extractKeywords` needs a budget because the thing it
 * draws from is unbounded; this draws from the concept scheme and cannot explode.
 * Measured 2026-09-14 across the 52 documents with prose, against 88 labels: median 7
 * terms, mean 8.4, maximum 32, 3 documents matching nothing, and 6.2 KB raw for the whole
 * corpus. A cut would be an arbitrary dial over a bounded set.
 *
 * Sorted alphabetically for the same reason every other list in this build is: an
 * unstable `/search.json` busts caches and makes a build diff unreadable for no content
 * change. Sorting by score is not an option here because there are no scores.
 */
export function findTerms(text: string, vocabulary: TermVocabulary): string[] {
  const found = new Set<string>()
  for (const segment of segments(text)) {
    for (let i = 0; i < segment.length;) {
      let matched = 0
      for (let n = Math.min(vocabulary.maxLength, segment.length - i); n >= 1; n--) {
        if (vocabulary.terms.has(segment.slice(i, i + n).join(' '))) {
          found.add(segment.slice(i, i + n).join(' '))
          matched = n
          break
        }
      }
      i += matched || 1
    }
  }
  return [...found].sort((a, b) => a.localeCompare(b))
}
