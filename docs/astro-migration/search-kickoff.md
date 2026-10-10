# Phase 4 — search, and the last of the JSON-LD

CLAUDE.md and DESIGN.md are loaded. **Re-read the spec, re-query the dataset, and re-walk the
Figma boards before trusting anything below.** Every fact here was verified on **2026-09-12**
and is a starting point, not a guarantee. The most expensive lines in past kickoffs have been
the ones quoting counts that had moved.

## Start state

**`next` is at `37e8893`, pushed, and that is where you will be sitting.** A merge leaves you
on `next` — **branch before writing any code.** Check the branch when the task starts, not
when the last one ended.

Build green: **61 pages**, `astro check` 0 errors / 0 warnings, Prettier clean, with only the
known `[SanityHero] no altText` warnings.

Corpus as of today — re-measure rather than trust:

| | |
|---|---|
| insights | 42 — 30 `article`, 7 `caseStudy`, 5 `note` |
| presentations | 9 |
| `page` documents | 5 — About, Apologia, Consulting, Contact, Projects |
| singletons | 4 |
| topic concepts in use | 77, of which **13 carry an `altLabel`** |

Text available to index: **42 of 42** insights have `shortDescription`; **30** have `lede`
(articles only — `caseStudy` has no such field); **8 of 9** presentations have `description`
(`information-architecture-for-digital-content` is the gap).

## What just landed

**JSON-LD, all four pieces, merged as `37e8893`.** Site graph on every page, one `@graph` per
page with entities linked by `@id`, `<BaseLayout>` taking a page's nodes as a prop. 309
internal references resolve; validated by Andy in a structured-data validator.
`web-next/src/lib/linked-data.ts` holds it and records the reasoning.

## The Figma boards — READ THE ANNOTATIONS FIRST

Three screens, and **all three carry Dev Mode annotations that neither `get_metadata` nor a
screenshot exposes.** Andy authorized a narrow, read-only exception to the
`get_design_context` ban for exactly this: take the annotation text and **discard the
generated React/Tailwind**.

| Board | Node | |
|---|---|---|
| Search — results, desktop | **`1010:4670`** | filters annotation at `2763:4482` |
| Search — empty, desktop | **`1026:5197`** | Common Topics annotation at `1026:5247` |
| Search — results, mobile | **`1045:5326`** | "See all topics" annotation at `2763:4679` |

The annotations, read 2026-09-12 and quoted rather than paraphrased:

> **Filters** (`2763:4482`) — "Filters here work differently than on the Insights and
> Presentations index pages: only filter chips that are found on results returned by search
> are found. When a chip is clicked, any results that do not have that tag are removed from
> the list. The same applies if an additional chip is clicked (combining the two).
>
> This also applies for genres, and is a bit different than how genres operate in the index
> pages: there genres are an exclusive filter; here, if Interviews and Methods are both
> clicked, the results list will be filtered to show entries with those two genres (along with
> entries that match any Topic filters that have been set)
>
> Filters are sticky to the top of the viewport on Desktop"

> **Common Topics** (`1026:5247`) — "Topics fold below the 'no results' message on mobile.
> This list links to the 'Insights' index page with query parameters applied. We can use the
> same 'most common topics' list that is used on the home page's 'Selected Topics' list."

> **See all topics** (`2763:4679`) — "See all Topics only appears on Mobile (to save vertical
> space). As on other screens, it truncates to three lines for topics, and two lines for
> Genres. As in this example, if there aren't more than two lines for Genres, the button is
> not shown."

**The first annotation is the load-bearing one.** Search results carry facet filters, they are
built from the RESULT SET rather than the whole corpus, and **genre filtering is inclusive
here where the index pages make it exclusive.** `<FacetFilters>` and `scripts/card-index.ts`
exist and are shared by both indexes — but neither behavior matches, so how much is reusable
is a real question rather than a formality.

**A discrepancy to resolve, not to guess at:** the third annotation says "See all Topics only
appears on Mobile", yet the desktop board (`1010:4670`) draws both a "See all topics" and a
"See all genres" chip. Ask.

### What the boards show structurally

- **The search box is 500px on desktop, 343 on mobile** — hairline border, `space-1` padding,
  a search icon, the query text, and an `[Esc]` affordance at the right edge.
- **Desktop puts it in the Top Bar beside the masthead**, which is the expand-in-place state
  DESIGN.md describes. **Mobile puts it below the masthead block**, full width.
- **H1 is the result count**: "8 results for "user research"" / "No results for "rien"".
- **Results are a single-column list**, `rhythm-list` (32) apart — NOT the card masonry. On
  desktop the list is `flex-1` with a **316px filter rail** at `grid-skip-1` (109); on mobile
  the filters sit ABOVE the results.
- **Cards are unboxed on desktop and boxed on mobile** — which is exactly the rule
  `PresentationCard` just gained, so that treatment is already built.
- **The empty state** is a lead-style message plus the Common Topics list.

## The job

### 1. Settle these first — a DISCUSSION, not an implementation

**What is searchable is mostly answered by the boards, and the answer is surprising.** The
result cards include a Case Study, a Note, a Keynote, a **Review**, two **Pages** ("Projects",
"Services") and a **Project** ("Sanity Taxonomy Manager"). So search reaches well past the 42
insights the old build indexed. Two things fall out that need deciding rather than assuming:

- **There is no `project` type in the content model**, and `/projects/` is a `page`. The board
  shows "Sanity Taxonomy Manager — Project | Evergreen" as its own result. Either that is
  aspirational, or it implies a type that does not exist.
- **Undated content shows "Evergreen" where a date would go** — "Page | Evergreen", "Project
  | Evergreen". That is a new display rule, and `lib/date.ts` is where it would live.

Still genuinely open:

- **Where the index comes from.** The Insights and Presentations indexes filter by reading the
  **DOM** — `insights/index.astro` states there is no JSON facet index and does not need one,
  because every document renders. **Search cannot borrow that**: the masthead is on all 61
  pages and only two hold that DOM. So search wants a fetched JSON index, which is a second
  index with a different shape, and the relationship between the two is worth deciding rather
  than discovering.

  **Settle `altLabel` here, as part of the index shape.** 13 concepts carry one, nothing reads
  them, and `docs/urls-and-filtering.md` says search is why they exist: "altLabels stay in the
  vocabulary for eventual **search** support, which is the surface where a synonym earns its
  keep." Whether they ride in the index as extra searchable text, and whether they are weighted
  below prefLabels, is an indexing decision — not a later addition.

- **Whether a search changes the URL.** `docs/urls-and-filtering.md` explicitly defers this:
  "the URL question (does a search push history?) sits with the phase 4 filter work." The
  filter work landed and did **not** answer it. Results replace page content without
  navigating, so back-button behavior is a real decision — and the empty state's Common Topics
  list "links to the Insights index page with query parameters applied", which is a second,
  related URL surface.

  **If search does get a URL, the masthead has already warned you.**
  `Masthead.astro:86-93` explains that its active-section underline is a prefix test and names
  the exact hazard: "without the trailing slash, a future `/insight-search/` would light up
  Insights."

### 2. The index

Note what the old one got wrong: `tags` was a comma-joined string of prefLabels.
`docs/urls-and-filtering.md` says it "needs to become an array of slugs."

### 3. The masthead's expand-in-place state

`web-next/src/components/Masthead.astro` — `.slot` is the seam, and its header says so:
"Search expands IN PLACE, replacing the nav items, so the two occupy one slot and the slot has
to be able to hold either." The `<button class="search-toggle">` at ~L249 is the element that
gets behavior; it has no `data-` hook yet.

### 4. Results replacing the page content, and the empty state

Both boards above. The result list, the filter rail, the sticky behavior, the Common Topics
fallback.

### 5. `cmd + k`, and the mobile treatment

DESIGN.md: "`cmd + k` opens it, moving focus into the field, and the icon is independently
clickable and focusable. Two entry points to one state." The boards add `[Esc]` as the visible
close affordance. On mobile the icon becomes the word "search" — the masthead already renders
the label as real text at both widths and hides it visually in the inline state, so that markup
exists.

### 6. Then the last of the JSON-LD

`WebSite.potentialAction` / `SearchAction` — the sitelinks search box. It names the URL a site
search accepts a query at, so it could not be written until search had one. One node in
`siteGraph()` in `web-next/src/lib/linked-data.ts`; the comment marking its absence is there.

## Settled — do not re-derive

**The search toggle ships `hidden` at ALL sizes and is revealed by the script** (Andy,
2026-09-12). Same contract `<SlideDeck>` and `<FacetFilters>` state in their own headers: a
control that needs JavaScript ships hidden, because a control that does nothing is worse than
no control. **It currently ships VISIBLE and inert, so today a no-JS visitor sees a Search
button that never responds.** That is a live defect this work closes, not a style question.

**From DESIGN.md → Components → Search (specified 2026-08-21):**

- It expands in place, replacing the nav items. Not a separate page.
- Results replace the current page's content; the masthead stays put.
- **Fuse.js**, the same engine the previous version used.
- `cmd + k` opens it; the icon is independently clickable and focusable.
- On mobile the icon becomes the word "search".

**From the old implementation** — `web/_includes/partials/searchScript.js`, 88 lines, worth
reading as a starting point rather than a pattern. Its Fuse config:

```
keys: title 1.0, tags 0.9, description 0.8, lede 0.5
threshold: 0.3, ignoreLocation: true, minMatchCharLength: 3
```

**`/insight-search.json` is dead.** `urls-and-filtering.md` lists it as "superseded by the
facet index; nothing links to it." Do not resurrect the route; the shape is still informative.

**Search will not work in the preview environment, and that is accepted.** Preview encodes
stega metadata into content strings, so anything matching rendered text stops matching — in
preview only. `urls-and-filtering.md` records this for filtering and it applies identically
here. Match on clean data rather than rendered text, or run values through `stegaClean`.

## Gotchas that cost real time

**The browser pane runs with `document.hidden: true`:** `requestAnimationFrame` never fires,
**no scroll events fire at all**, and **lazy loading is suppressed entirely**. Each of these
looked like a bug in my code first. Sticky-filter behavior in particular cannot be verified
there — hand that check to Andy.

**A `defineQuery` past the complexity ceiling yields `any`, not an error.** Probe with a
deliberate bogus property access against a known-good control; a green `astro check` proves
nothing.

**Two components have unchecked props, and the cause is known.**
`@astrojs/compiler@2.13.1` emits `_props: Record<string, any>` when a `<` or `>` appears in
frontmatter comments before `interface Props` and an `as=` attribute appears later. Blast
radius is exactly `EntryHeader.astro` and `NoteEntry.astro` — measured. Keep angle brackets out
of frontmatter comments, use `const {…}: Props = Astro.props`, and probe:

```bash
node --input-type=module -e "
import {convertToTSX} from '@astrojs/compiler'
import fs from 'node:fs'
const r = await convertToTSX(fs.readFileSync(process.argv[1],'utf8'),{filename:'X.astro'})
console.log(r.code.includes('_props: Props') ? 'CHECKED' : 'UNCHECKED')
" web-next/src/components/YourComponent.astro
```

**Astro scope reaches a component's ROOT, never its descendants**, and slotted content carries
the CALLER's scope. A grouped selector split across two files stops matching silently — that
one cost a `border-radius` in the presentations work.

**`html.js` is set by a synchronous head script before first paint** (`BaseLayout.astro`), so
any rule keyed on it is true from that paint rather than applied as a correction. This is the
mechanism for revealing controls without a flash, and it is what the search toggle should use.

## Smaller things left open

- **`SearchAction`** — above; the only JSON-LD still missing.
- **`information-architecture-for-digital-content` has no `description`**, so it ships with no
  meta description and would index thinly.
- **A note's `description` field** — deferred twice, and Andy expects it to surface here:
  `note` has only `shortDescription`, and whether card copy and search-result copy should be
  separable is the same question deferred for `presentation`.
- **Search is the last item in phase 4.** Phase 5 is the content parity check, which has its
  own list in CLAUDE.md — 13 heroes with no `altText` being the enumerable part.

## How to work together

**Draft the UI, then hand it over.** Build it, get it green and integration-verified, and let
Andy respond to something real. For surfaces the invitation is standing.

- **He wants active input on the seams** — component boundaries, the content model, URL and id
  design, semantics and accessibility. Surface those as decisions with a recommendation before
  building past them.
- **Content modelling in Sanity is his.** Propose shapes, hand him a drop-in object if he asks
  — but do not edit the schema or the data.
- **Reviewable pieces at a reviewable cadence.** One coherent piece, then stop. Say what you
  are about to write before writing it.
- **Andy does the visual verification.** Get changes green and measured, then hand him the
  specific eyeball steps rather than asking him to check what you could have measured.
- **He values pushback.** Several plans in this build improved because a recommendation was
  argued against rather than implemented.

Commit only when asked; push only when asked. Report honestly — name wrong turns and roll them
back. American spellings in prose, comments and commit messages alike; never rewrite an
identifier to match.
