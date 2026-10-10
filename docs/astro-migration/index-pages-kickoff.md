# Phase 4, item 2 — index pages

CLAUDE.md is loaded. **Read DESIGN.md** — particularly Components → *Cards*, *Card grids* and
*Transitions*, plus Layout & Spacing → *The skip family* and *Two breakpoints*. Then skim
`docs/urls-and-filtering.md`, which has real open questions this work runs into, and
`docs/open-questions.md`. This prompt covers the rest.

**Stay on `page-types`.** It is branched from `next` and is well ahead, unpushed. Build, `astro check`,
`studio-next` `tsc` and Prettier are all green; 43 pages build with no warnings.

## The state you are inheriting

The article detail page is done and committed. **The cards are built and reviewed.**

| Path | What |
|---|---|
| `src/components/cards/ArticleCard.astro` | horizontal + vertical, inferred from its own width |
| `src/components/cards/NoteCard.astro` | Note / Book Note / Clipping |
| `src/components/Eyebrow.astro` | the `Genre \| Date` label line, shared with the article page |
| `src/lib/date.ts` | the UTC-pinned formatter |
| `src/lib/slug.ts` | `slugify` — apostrophes deleted, not hyphenated |
| `src/pages/index.astro` | **the throwaway specimen**, now also carrying the card matrix |
| `src/pages/insights/[slug].astro` | the real article page — read it for the band/grid idiom |

Schema-side: `note` exists with `clipRef` and `bookRef`, three sample documents (one per variant), and
`shortDescription`. `defineType`/`defineField` are applied across every schema file, and the slug field
is one shared `slugField(source)` helper.

## The work

**Build the Insights index**, and only that. Presentations index and Home are later items even though
they share the cards.

Route `/insights/`. There is no page there yet — the masthead and footer already link to it.

### What the index collects, and one wrinkle

`article` + `caseStudy` + `note`. The existing `INSIGHTS_INDEX_QUERY` covers the first two; `note` has
to be added, along with `shortDescription`, `genre`, `topic`, and — for a Clipping — `clipRef.publisher`
so the card can show the domain.

> **The index currently over-collects by four.** `earley-ia-knowledge-graphs-and-ia`,
> `the-informed-life-structured-content` and `content-strategy-insights-data-stories-meaning` carry
> genre *Interview*, and `cs-meetup` carries *Talk* — all four are Presentation-branch genres stored as
> `article`. They move when the `presentation` type exists. Don't filter them out in the query as a
> workaround; it would hide the thing that needs migrating.

### The masonry, which is the actual work

Cards are mixed-height and the boards lay them out in a masonry, **not** a row grid. It is on the
Insights and Presentations indexes only — **Home does not use it.**

Read the desktop Insights board and `Insights — Mobile` (`739:1219`) before choosing a mechanism. The
mobile board draws three `Masonry` sub-frames, which suggests column-major distribution rather than
`grid-auto-flow: dense`.

Worth knowing before you reach for CSS columns or a JS library: **native CSS masonry
(`grid-template-rows: masonry`) is not shipping anywhere** as of this writing, and `columns` reorders
content down-then-across, which breaks reading order for a date-sorted list. That tension — visual
balance versus source order — is the decision to make consciously rather than discover.

### The breakpoint ladder

DESIGN.md → Components → *Card grids* has the table. For this page: **3 columns → 2 → 1**, cards
stretching between breakpoints rather than sitting at fixed widths. A card at `span-3` on desktop spans
all 12 on a phone. Whether that wants a `max-width` is open and wants judging against real content.

**The article card needs no help with this** — it infers horizontal vs vertical from its own measured
width at a 32rem threshold. Hand it a column and it does the right thing.

### The outdent, which differs per index

Both cases are already DESIGN.md's rule, and the card deliberately does not decide it:

- **On this index:** note cards are **not** outdented. Their text aligns with the article cards' *text*,
  and on hover their box lands on the same vertical line as the article cards' borders.
- **On Home:** note cards **are** outdented by `card-pad`, so their text sits flush with the column edge
  and the hover box bleeds past it.

`margin-inline: calc(var(--card-pad) * -1)`, applied by the page, never by the card.

### Filters — read this before starting them

Chips for Topic and Genre, AND across everything, live counts. **Do not start here**; get the cards on
the page first. Both vocabularies are built and content is cleanly re-tagged (verified: all 31 topic
labels in use come from the live Topic scheme, zero references to the six deprecated concepts, and
nothing is tagged at a top concept). What is *not* settled is in `docs/urls-and-filtering.md`: parameter
syntax, history behaviour, and the empty/unknown states. Those are Andy's calls.

The Genre scheme is a two-level hierarchy under **Document** and **Presentation** — see CLAUDE.md →
phase 4 → *The five content types* for the tree. Filtering is **direct tags only**, no ancestor roll-up.

## What the card work learned that will bite again

- **A container query evaluates on the nearest ANCESTOR, never the element itself.** With
  `container-type` and the grid on one element, descendant rules fire and the container's own rules
  silently do not. It renders — just wrong. That is why `ArticleCard` has a `.card-inner`.
- **A grid container's `align-content` defaults to `stretch`.** In any equal-height row, auto rows grow
  and swallow the slack as gaps. Both cards set `align-content: start`. Expect this again in the masonry.
- **`text-decoration-line` cannot be transitioned** — animate `text-decoration-color` from
  `transparent` instead.
- **`sizes="auto"` interacts with container-query layout switches.** The browser measures the box to pick
  a candidate; if a query later changes the box, the already-chosen candidate can be too small. Seen on
  resize, not on load — but worth remembering when the masonry changes column counts.
- **Measure, don't eyeball.** Reading the hover highlight off a screenshot got the edges backwards
  (it is right-and-bottom, not left). Decoding the PNG settled it: 1px `border` all round plus 2px
  `accent` outboard right and bottom. There is a working pure-Python PNG decoder pattern in the session
  history if pixel truth is needed again — no PIL on this machine.
- **`read_page` is not an accessibility tree.** It lists `display: none` subtrees and maps roles by tag
  name, ignoring sectioning scope. It reported `banner` for a `<header>` inside `<article>` and
  `complementary` for a nested unnamed `<aside>`; Chrome's own pane says `sectionheader` and `generic`.
  Use controls with known answers, or ask Andy to check DevTools.
- **Prettier reformats the template on every `pnpm format`**, and `<!-- prettier-ignore -->` does not
  apply to `{…}` expression blocks. Where formatting is load-bearing, fix it structurally — the
  `Genre | Date` separator is drawn in CSS for exactly this reason.
- **`pnpm format` no longer touches `.github/`** — Andy added it to `.prettierignore`.

## Still open, carried forward

- **The 32rem card threshold is untested in the middle.** Nothing sits between 316 and 571 today.
- **`--card-media-block`** was added for the vertical card's media-to-text gap (16, where
  `--card-media` is the 24 beside it). Both off the board.
- **The card hover transition duration is the convention's 0.15s, not Figma's number.** Andy said the
  prototype specifies one; it was not read. Worth confirming against the file.
- **The note card's Clipping meta line** reads `Note | …` on the component but should show the real
  genre — Andy confirmed the component's meta line does not present all cases, and the desktop Home
  board (`1:63`) shows all three.
- **Card images are not aimed by the hotspot.** One image is fetched at 16/9 and `object-fit: cover`
  absorbs the horizontal card's 9/8 box. `SanityHero` passes `object-position` from the hotspot for the
  same double crop; copy it if a card crop ever cuts a subject badly.
- **16 of 42 heroes have no `altText`** — enumerated in CLAUDE.md → phase 5. It now costs twice, since
  php-mf2 carries `u-photo`'s alt into syndicated copies.
- **One note slug carries an apostrophe** — `gall's-law-when-complexity-comes-cheap`. The slugify is
  fixed but stored slugs are never recomputed, so it needs re-slugging by hand.
- **mf2 remainder** is tracked in CLAUDE.md → phase 8. Relevant here: **`h-feed`** wraps the entries on
  index pages, and `Eyebrow` takes a `microformats` prop that emits `dt-published` — currently passed
  only by the article page, and wanted by the cards once this page is an `h-feed`.

## How to work

CLAUDE.md's table governs. Masonry, the breakpoint ladder and the outdent are **layout mechanics —
Andy's column**: explain the reasoning and the platform behaviour, then let him steer. Query modules and
the repetitive sweeps are yours.

> **Draft the basic shape, then stop.** Andy reviews, guides and refines, and hands the refinements back
> for critique. Do not build the whole page and present it finished.

Say what you are about to write before writing it. Verify by measuring rather than by looking — the
specimen page at `/` has the card matrix on it, and every card bug this session was found by
`getBoundingClientRect`, not by a screenshot. And when a comment and the code disagree, the comment is
a bug.
