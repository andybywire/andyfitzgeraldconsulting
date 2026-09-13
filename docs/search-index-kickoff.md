# Search — the index, and `SearchAction`

Companion to [search-kickoff.md](search-kickoff.md), which started the build. That one is the
record of what phase 4's search work began from; this one picks up what is left.

**Re-measure rather than trust.** Every number here was taken on **2026-09-13** against
`production-26` and the built output. The most expensive lines in past kickoffs have been the ones
quoting counts that had moved.

## Start state

**Branch `site-search`, and the work on it is NOT COMMITTED.** Nothing has been committed or pushed
— Andy commits when he asks, not before. `git status` at handoff:

```
 M docs/open-questions.md            M web-next/src/components/Masthead.astro
 M pnpm-lock.yaml                    M web-next/src/layouts/BaseLayout.astro
 M web-next/package.json             M web-next/src/lib/date.ts
 M web-next/sanity.types.ts
?? web-next/src/components/SearchResults.astro   ?? web-next/src/pages/search.astro
?? web-next/src/lib/search-index.ts              ?? web-next/src/pages/search.json.ts
?? web-next/src/sanity/queries/search.ts         ?? web-next/src/scripts/search.ts
```

> **The branch is `site-search`, not `search`.** `search` already exists as an abandoned local
> branch (`35e4d3e "Tidy css"`) predating `web-next` entirely — its diff against `next` deletes the
> whole Astro build and restores `package-lock.json`. Do not build on it, and do not delete it
> without asking.

Build green: **62 pages plus `/search.json`**, `astro check` 0 errors / 0 warnings, Prettier clean,
with only the known `[SanityHero] no altText` warnings. `fuse.js@7.5.0` was added to `web-next`.

## What landed

Search works end to end. Five of the seven planned steps, plus one dropped.

| | |
|---|---|
| `sanity/queries/search.ts` | four probed queries — insights, presentations, pages, reviews |
| `lib/search-index.ts` | `SearchEntry`, assembly, the topic tally |
| `pages/search.json.ts` | prerendered endpoint, **78 entries / 35 KB** |
| `pages/search.astro` | the `/search/` route and its no-JS resting state |
| `components/SearchResults.astro` | inert `<template>`s for the results view + one result row + one chip |
| `scripts/search.ts` | the whole controller — open/close, ⌘K, Fuse, rendering, facets |
| `components/Masthead.astro` | the field, the esc cap, the toggle's ships-hidden fix |

**Recents were dropped** (Andy, 2026-09-12) and the board is marked DEFERRED. See
[open-questions.md](open-questions.md) → *Search — deferred to a second pass*.

## The job

### 1. `SearchAction` — small, and the only JSON-LD phase 4 never wrote

`web-next/src/lib/linked-data.ts:207` carries the comment marking its absence, inside the `WebSite`
node in `siteGraph()`:

> `NO potentialAction/SearchAction yet. It names the URL a site search accepts a query at, and
> search is not built (the masthead toggle is still inert from phase 3). Purely additive when it
> lands; the old build has none either.`

Search now has a URL, so it can land. The shape is `potentialAction` → `SearchAction` with an
`EntryPoint` target whose `urlTemplate` is `…/search/?q={search_term_string}`, plus
`"query-input": "required name=search_term_string"`.

Three things worth knowing before writing it:

- **`/search/` is `noindex`, and that is fine.** The sitelinks searchbox names a URL that accepts a
  query; it says nothing about indexing it. Do not remove the `noindex` to "fix" this.
- **`nodeId(site, …)` builds host-scoped `@id`s**, so the preview deploy identifies preview
  entities. The target URL should come from `Astro.site` the same way, not be hardcoded.
- **Andy validates JSON-LD in a structured-data validator**, which is how the last four pieces were
  checked. Hand him that step rather than asserting it passes.

### 2. The index — what Andy wants to iterate on

This is the bigger half and the reason for a fresh session. The index as it stands:

```ts
interface SearchEntry {
  url, title, kind, date, dateLabel, description, sourceDomain, genre, topics[], synonyms[]
}
```

**78 entries: 42 insights, 9 presentations, 5 pages, 22 reviews.** 14 distinct `kind` values, because
`kind` is the genre prefLabel — `Web Clipping`, `Conference Themes`, `Panel`, `Book Note` and so on,
not the five the boards draw. 13 concepts contribute `synonyms` (their altLabels). 2 entries carry a
`sourceDomain`.

Known weaknesses, none of them settled:

- **Fuse matches SUBSTRINGS, not words, and no threshold fixes it.** "rien" returns 7 results at
  threshold 0.2 and still 7 at **0.0**, because it is literally inside "expe*rien*ce" in several
  review excerpts. The board used "rien" as its no-results example and it cannot be one. Only
  word-boundary tokenisation would separate those, which Fuse does not do — so this is a question
  about the ENGINE or about pre-processing the index, not about tuning.
- **4 entries have no `description`** and index on title and topics alone:
  `information-architecture-for-digital-content` (no `description` on the document), and three
  reviews with no `excerpt` — Phil Coady, Callie Davis, Cindy Lincks. `reviews.ts` records `excerpt`
  as 19 of 22. A fallback to `pt::text(body)` is the obvious fix and was not taken, because "which
  field feeds search copy" is the same content-model question deferred for `note` and `presentation`.
- **`kind` is not searchable.** Typing "case study" finds nothing. Plausible to add and deliberately
  not: "note" would then match every Note, which is worse than the gap.
- **The weights are the old build's, minus two corrections.** `title 1.0, topics 0.9,
  description 0.8, synonyms 0.5`. `synonyms` is new and sits below everything on purpose — an
  altLabel should find a document, not outrank a title match.

## Settled — do not re-derive

**The URL model, which is the thing most likely to be "improved" back into a bug.** Typing previews
in place and the URL does not move; **Return submits the form**, which is a real GET to
`/search/?q=…`, and that is the only thing that writes a URL (Andy, 2026-09-12). There is therefore
**no History API in this feature at all** — no pushState, no popstate — and the plan's original
"push once, then replace" contract does not apply. The submit is deliberately not intercepted.

**Facet semantics**, from annotation 2763:4482: **topics AND · genres OR · the two groups AND.**

**Chip availability mirrors the combination rule, and it is asymmetric.** An AND chip is tested as
*the selection plus this chip*; an OR chip is tested as *this chip alone against the other groups*.
Testing an OR chip by adding it to the existing set makes every genre look available the moment one
is picked, because the first genre's rows keep matching — that shipped as a bug on 2026-09-12 and
the note in `search.ts` records it.

- Chips come from the query's RESULT SET, are fixed for that query, and carry **no counts** — the
  board draws none. Disabled chips are the only thing saying what else the set holds.
- **Truncation is below `md` only** — 3 rows topics, 2 rows genres, with See all ↔ See fewer. The
  `md`-to-`lg` band is unbudgeted and that is **accepted**, not open; see open-questions.md.
- **The rail is not sticky.** This overrules annotation 2763:4482, which was drawn against a
  ten-chip mock. The annotation still says otherwise — do not "fix" it back.
- **Group gap is `--rhythm-heading-major` (64), not the board's 109.** 109 is `grid-skip-1`, a Figma
  variable tokens.css deliberately deleted.
- **The h1 always opens with "Search"** — `Search results for “q”` with results, bare `Search`
  without, and the count moved to a line below at `font-size-2`/1.8/`text-lead`.
- `/search/` is `noindex`; `BaseLayout` gained the prop. Common Topics shows **12**.

## Gotchas that cost real time

**Astro's scope attribute is why `SearchResults.astro` exists.** Scoped CSS compiles to
`.thing[data-astro-cid-…]`, and a node built with `createElement` has no such attribute — so
JS-assembled markup ships with its stylesheet matching nothing, silently. Everything rendered by the
controller is cloned from a server-rendered `<template>`. `<Eyebrow>` and `<Chip>` are rendered into
those templates with placeholder values so their OWN scoped CSS comes along.

**Astro inlines small stylesheets into the HTML.** Grepping only `dist/_astro/*.css` for a rule and
finding nothing proves nothing — check the inline `<style>` blocks in the page. This produced a
wrong "Astro dropped my rule" conclusion once.

**The dev server serves stale component CSS.** It lagged edits by roughly one change for the whole
session and a restart was never possible mid-flight. The workaround that worked: extract the
component's rules from the BUILT css, inject them with a `<style>` tag, and measure. Everything
reported as verified was measured against the CSS that actually ships.

**Two measuring traps, both of which produced confident wrong numbers:**

- **A `hidden` control measures 0 wide.** Reveal the "see all" chip BEFORE reading widths or the
  packing is off by one row — the tail costs nothing, one extra chip fits, and then showing the real
  control pushes a new row.
- **`nav.getBoundingClientRect().height` on a grid item is its ROW, not its content.** It read
  8031px and looked like a rail driving the page; 8031 was the results column the nav stretched to
  match. Measure the last visible child's bottom against the parent's top.

**GROQ: a filter after a `[]` flatten is silently ignored.** `topic[]->altLabel[][@ != null]` does
nothing; `(A + B)[@ != null]` works. Same parenthesisation class as the poster-ladder trap in
`presentations.ts:16`. Without it, 38 entries carried a `null` in `synonyms`.

**Class names collide across controllers.** `card-index.ts` selects `.facet-group`, `.facet-chips`,
`.facet-reset` and — dangerously — does a one-shot `.chip[aria-disabled]` enable. The search facets
were renamed to `search-facet*` / `search-chips` to stay clear of it.

**The browser pane, again:** no scroll events, no `requestAnimationFrame`, lazy loading suppressed,
and **a synthetic Return does not submit a form** — `requestSubmit()` and a real submit-button click
both do. Anything scroll- or keyboard-dependent is Andy's to eyeball.

**`defineQuery` past the complexity ceiling yields `any`, not an error.** All four search queries
were probed with a bogus property access against a known-good control. Re-probe before adding a
field.

## Smaller things left open

- **The no-results h1 collapses to bare `Search`** while the results h1 carries the query — boards
  1026:5211 and 1015:5035 disagree, and only Andy can settle it. Flagged in `search.ts`.
- **`.topic-grid` and its 26rem threshold now live in THREE files** — `index.astro`, `search.astro`
  and `SearchResults.astro`. Andy chose duplication over extraction (2026-09-12) so the shipped Home
  page stayed untouched. The threshold is measured from label widths, so all three move together and
  nothing enforces it.
- **DESIGN.md's `lead` role has a second consumer outside `<PageHeader>`** — `search.astro`'s
  invitation — which is this project's stated trigger for promotion. Left local, flagged.
- **A custom `⌘ K` tooltip** and **recent searches** are both recorded in
  [open-questions.md](open-questions.md) → *Search — deferred to a second pass*.
- **Phase 5 is next after this**, and its list is in CLAUDE.md — 13 heroes with no `altText` being
  the enumerable part.

## How to work together

Unchanged from the rest of this build, and it worked well:

- **Draft the UI, then hand it over.** For surfaces the invitation is standing; say the shape in a
  sentence, then build it in the same turn.
- **Seams stop the draft.** Component boundaries, the content model, URL and id design, semantics
  and accessibility — surface those as a decision with a recommendation and let Andy answer. Several
  things improved this session because a recommendation was argued against rather than implemented.
- **Andy does the visual verification.** Get it green and MEASURED, then hand him specific eyeball
  steps rather than asking him to check what could have been measured.
- **Report honestly.** Two wrong numbers were published this session and corrected in place; that is
  the expected behaviour, not an exception.
- Commit and push only when asked. American spellings in prose, comments and commit messages alike;
  never rewrite an identifier to match.
