# How search finds things

What is in the search index, how it gets there, and how a query is scored against it.
Written 2026-09-13, when the engine changed and the index learned to reach into document
bodies. Companion to [urls-and-filtering.md](urls-and-filtering.md), which covers the
*other* index — the one the Insights and Presentations pages filter with.

Every number here was measured against `production-26` and the built output on that date.

---

## There are two TF-IDFs, at two different times

This is the thing to hold onto, because everything else follows from it.

| | when | what it does | where |
|---|---|---|---|
| **Extraction** | build | *chooses* ~25 terms per document | `web-next/src/lib/keywords.ts` |
| **Ranking** | query | *scores* whatever it finds | MiniSearch, via BM25 |

They are separate machines that happen to share an ancestor. BM25 — what MiniSearch ranks
with — is TF-IDF's descendant, so if the document bodies were in the index, `keywords.ts`
would be redundant: BM25 would do the whole job at query time.

**The bodies are not in the index, and that is the decision the rest of this rests on.**
Shipping them takes `/search.json` from 36 KB to 389 KB, and 10 KB to 134 KB gzipped, for
a file fetched the first time a visitor searches. So the build compresses each document
down to the terms that distinguish it, and the browser ranks against that instead.

---

## The pipeline

```
4 GROQ queries ──► buildSearchIndex() ──► /search.json ──► fetch on first query ──► MiniSearch
   insights          + extractKeywords      78 entries      (once, lazily)            BM25 + facets
   presentations                            59 KB / 18.5 KB gz
   pages
   reviews
```

Each entry carries `url, title, kind, date, dateLabel, description, sourceDomain, genre,
topics[], synonyms[], headings, keywords[]`. Seven of those are searchable; the rest are
for display or filtering.

The index is fetched **lazily and exactly once** — on the first query that passes two
characters, never on page load. Nothing else about search costs a visitor anything until
they use it.

---

## What reaches into the body, and what it costs

Two fields, neither of which is prose you could read back.

**`headings`** is the document's own h2/h3/h4 text, run together. It is the
highest-signal writing on the page, because a heading is authored to be scanned. The
entire corpus's outline — every heading of everything published here — is **242 blocks and
about 6 KB.**

**`keywords`** is ~25 terms per document, chosen by TF-IDF. **13.1 KB across the 51
documents that have prose**, 1,089 distinct terms. The curve either side is flat — 7.7 KB
at 15 terms, 19.3 KB at 40 — so the count is a precision choice rather than a budget one.

Together they cost about **8.5 KB gzipped** and recover most of what full text would find.

---

## The formula, on a real document

```
score(term, doc) = (1 + ln(tf)) × ln(N / df)
                    ────┬─────    ────┬────
            how much THIS document   how many documents
            uses the term            use it at all
```

`tf` is occurrences in this document. `df` is how many documents contain the term **at
all** — counted over a `Set`, because counting occurrences there would make it a second
`tf` and the ratio would cancel out. `N` is the corpus: 51 documents.

Worked on `boutique-knowledge-graphs`, 1,394 tokens after filtering:

| term | tf | df | 1+ln(tf) | ln(N/df) | score | rank |
|---|---|---|---|---|---|---|
| `boutique` | 7 | 2 | 2.95 | 3.24 | **9.54** | 1 |
| `identifiers` | 5 | 2 | 2.61 | 3.24 | **8.45** | 2 |
| `external` | 3 | 1 | 2.10 | 3.93 | **8.25** | 3 |
| `graphs` | 14 | 6 | 3.64 | 2.14 | **7.79** | 5 |
| `graph` | 33 | 11 | 4.50 | 1.53 | **6.90** | 6 |
| | | | | | | |
| `knowledge` | **41** | 28 | 4.71 | 0.60 | 2.83 | 264 — **cut** |
| `content` | 39 | 40 | 4.66 | 0.24 | 1.13 | 611 — cut |
| `information` | 8 | 35 | 3.08 | 0.38 | 1.16 | 593 — cut |
| `design` | 7 | 39 | 2.95 | 0.27 | 0.79 | 666 — cut |

**The whole idea is in the `knowledge` row.** It is the single most frequent word in the
document — 41 uses, more than any surviving term — and it is cut at rank 264, because 28
of 51 documents use it. `boutique` appears seven times and wins outright, because two
documents do. Raw frequency is nearly worthless here; *relative* frequency is the signal.

### Two details doing real work

**`1 + ln(tf)`, not `tf`.** Sublinear, so thirty-three uses of `graph` scores 4.50 where
two uses of `monolithic` scores 1.69 — 2.7× apart, not 16×. Without the log, one word
hammered repeatedly would crowd out a dozen distinct ideas.

**`ln(N/df)` hits exactly zero when `df = N`.** A term every document uses separates
nothing, so it removes itself. This is why there is no need to stop-list "content" on a
content-strategy site: no list anyone could write would have known that "content" was
noise *on this particular corpus*, and the arithmetic does not need to be told.

### The corpus is an argument, deliberately

`extractKeywords` takes the whole corpus in one call. Called per document it would compute
`ln(1/1)` — zero for every term — and return nothing at all, silently. IDF is a property
of the corpus, so the corpus is a parameter rather than something assembled inside.

One corpus spans insights **and** presentations rather than one each, so a word that is
ordinary across the site is discounted wherever it appears. Split in two, a word common in
articles would look distinctive inside the nine presentations purely because that corpus
is small.

---

## The SKOS parallel, and where it breaks

IDF is a specificity measure. A high-`df` term behaves like a top concept — broad, present
everywhere, useless for discrimination. A `df` of 1 or 2 behaves like a leaf.

The site's own rule that content is tagged at leaf and mid level and **never** at a top
concept is the same instinct applied by hand to a controlled vocabulary. IDF derives it
automatically over an uncontrolled one.

**Where it breaks: IDF has no notion of hierarchy, and no notion of relation.** `boutique`
and `monolithic` both score high in the document above, and nothing in the maths knows
they are antonyms on the same axis. There is no broader/narrower, no related, no scheme.
It is a flat bag of weighted strings — which is exactly why the vocabulary still does the
faceting and TF-IDF only does the reaching.

---

## What it cannot do

**No phrases.** `tree` and `testing` are stored as independent terms. A document is found
by either and ranked by both, but the adjacency is gone.

**No snippets**, because there is no prose left to snip. A result row shows its card copy,
which will not contain the matched term when the match came from the body.

**A term used once in a long document usually does not survive.** This is the honest cost,
and it has a live example: `tree testing` appears in **5 documents, once each**, is never a
heading, and so never clears any document's top 25. Searching for it returns nothing. Full
text would find it. That is the trade.

Measured against a twelve-query probe of things discussed only in bodies, the index went
from 2 hits to 10. `tree testing` is one of the two misses; the other, `webmention`,
appears in zero documents and is not a miss at all.

---

## Query-time configuration

In `web-next/src/scripts/search.ts`. Each option was measured, not defaulted.

```
combineWith: 'AND'
prefix: true
fuzzy: (term) => (term.length > 4 ? 0.2 : false)
boost: {title: 3, topics: 2, kind: 1.5, headings: 1.2, description: 1, keywords: 0.7, synonyms: 0.6}
```

**`AND` over the default `OR`.** On 78 entries, `OR` is not forgiving, it is
indiscriminate: `design system` returns 44 entries under `OR` and 10 under `AND`,
`user research` 21 against 2.

**`prefix: true`** is what makes results appear from the second keystroke rather than only
on a completed word — `tax` and `taxo` both return what `taxonomy` does.

**Fuzz gated on term length**, and this is the non-obvious one. A flat `0.2` allows one
edit on a four-character term, which is enough for `rien` to match *Rizen* and `tent` to
match a four-letter neighbour. At four characters, one edit is a quarter of the word and
stops discriminating. Gates at >4, >5 and >6 all fix it identically and all keep every typo
case working (`taxonmy` → 13, `knowlege graphs` → 5, `architecure` → 12), so **>4** wins by
being the most permissive.

**The boost order is a claim about evidence**, not a set of dials:

- `title` and `topics` — somebody named this, deliberately.
- `kind` — the genre prefLabel, so `case study` finds the seven case studies.
- `headings` **above** `description`, narrowly: a heading is written to be scanned where
  card copy is written to sell, so it is the better description of what a document covers.
- `keywords` near the bottom because they are **derived** — nobody chose them, TF-IDF did.
  A keyword hit is evidence the subject appears in the body, which is weaker than evidence
  somebody named it. It should pull a document into the results and rarely to the top.
- `synonyms` last, for the reason already on record: an altLabel should *find* a document,
  never outrank a title match. Verified — `a11y` returns the one entry tagged Accessibility,
  scoring 2.9 where a title match scores 20+.

---

## Two traps this has already fallen into

**`caseStudy` has no `bodyText`.** The first version of the projection read
`pt::text(bodyText)` across the `article | caseStudy | note` union. Case studies keep their
prose in five other fields, GROQ returns null for a field a type does not have rather than
complaining, and all seven indexed on card copy alone with a green build. That was 31,547
characters of prose and 1,262 of headings invisible. **A projection over a union is only as
complete as its least-similar member, and nothing type-checks that.**

**String concatenation propagates null.** `pt::text(a) + " " + pt::text(b)` is null when
either side is. Concatenating the block *arrays* first — `pt::text(A + B)` with
`coalesce(…, [])` per field — leaves no string in the expression for a null to poison. Same
family as the parenthesisation trap recorded on the `SYNONYMS` fragment.

---

## If full text ever comes back

Nothing here blocks it. The queries already fetch the bodies; `buildSearchIndex` discards
them. Reinstating it is a projection change plus snippet extraction, so a body match does
not read as a mis-hit.

What it would need first is a **content-hashed index filename**, so the file can take
`immutable` instead of revalidating. That was decided against for now and the reasoning is
in CLAUDE.md's phase 6, next to the fonts note.
