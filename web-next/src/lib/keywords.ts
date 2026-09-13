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
 * No phrases: "tree testing" is stored as two independent terms, so a document is found
 * by either and ranked by both, but the adjacency is gone. No snippets, because there is
 * no prose left to snip. And a term the author used exactly once in a long document may
 * not survive the cut, which is the honest cost of the 8× saving.
 *
 * Measured on the built index at 25 terms per document: a 13.1 KB payload across the 51
 * documents that have prose, 1,089 distinct terms. The curve either side — 7.7 KB at 15
 * and 19.3 KB at 40 — is flat enough that the choice is about precision, not bytes.
 */

/**
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
 */
const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    /* A bare number is never a useful search term here. Years were the visible case —
       2009, 2012, 2018 and five more all earned a slot — and the year of anything on
       this site is already in its title, its `date` and its `dateLabel`. */
    .filter((term) => term.length > 2 && !/^\d+$/.test(term) && !STOP.has(term))

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
