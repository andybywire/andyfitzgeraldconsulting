# Phase 4, item 2 — Insights filtering

CLAUDE.md is loaded. **Read [docs/urls-and-filtering.md](urls-and-filtering.md) in full** — it is the
spec for this work, and four of its open questions were answered on 2026-08-31 (recorded below rather
than in the doc, so fold them in as you go). Then read DESIGN.md → Components → *Filter chips* and
*Card grids*, and skim [docs/open-questions.md](open-questions.md).

**Stay on `page-types`.** Branched from `next`, well ahead, unpushed. Build, `astro check`,
`studio-next` `tsc` and Prettier are green; 44 pages build with the known `[SanityHero] no altText`
warnings and nothing else.

## The state you are inheriting

The Insights index is built. Header, masonry, cards and chips all render and are committed.

| Path | What |
|---|---|
| `src/pages/insights/index.astro` | the whole page — query wiring, facet tally, masonry CSS, two enhancement scripts |
| `src/sanity/queries/insights.ts` | `INSIGHTS_INDEX_QUERY` — article + caseStudy + note |
| `src/sanity/queries/singletons.ts` | `SINGLETON_HEADER_QUERY` — title + heroCopy + flattened lede |
| `src/components/cards/*.astro` | both cards; they spread `...rest`, so a page can pass data attributes and style them |
| `src/styles/base.css` | gained `[hidden] { display: none !important }` — see the traps below |

**`src/lib/masonry.ts` is deleted.** The build-time partition and its height estimator are gone; do not
resurrect either. The masonry is now source-ordered DOM + `nth-child` columns + a measured
`grid-row: span`, and DESIGN.md → Card grids → *How the masonry is built* states the three rules that
govern it. The first is a prohibition: **the DOM stays in date order, don't reintroduce column
wrappers.**

## The work

**Build the filtering.** The chips exist, are enabled by script, and have correct hrefs. Nothing
filters yet.

### What is already there to build on

- **Every card carries `data-genre` and `data-topics`**, space-separated clean slugs. `~=` matches one
  word natively, so `[data-topics~="knowledge-graphs"][data-genre="method"]` is the whole AND
  intersection *as a single selector* — verified, 3 matches. The script never needs to split a string,
  and this sidesteps the stega problem urls-and-filtering.md flags, since these are attributes rather
  than rendered text.
- **Every chip carries `data-facet` (`topic` / `genre`) and `data-slug`.**
- **`fitAllFacets()` takes no arguments and re-fits both groups.** It is deliberately separate from the
  wiring so it can be called after counts change — which is exactly the "keep the most relevant
  options visible" behaviour Andy asked for.
- **All 45 documents render**, so the DOM is the complete set and **there is no JSON facet index**. Do
  not build one. The doc calls for it on the grounds that co-occurrence needs every resource's topic
  set, which is true and satisfied by rendering all of them. It comes back only when show-more stops
  rendering everything, around 150 items.

### Decisions taken on 2026-08-31 — fold these into urls-and-filtering.md

| Question | Answer |
|---|---|
| Parameter syntax | **Comma-joined** — `?topic=a,b&genre=method` |
| History | **Push once, then replace** — the first filter pushes, refinements replace, so one Back returns to the unfiltered index and a second leaves the page |
| Unknown `?topic=` values | **Drop silently**, and `replaceState` the cleaned URL so a stale shared link heals itself |
| altLabel resolution | **Not now, and probably not ever for chips.** Only prefLabel. Rendering an altLabel as its own chip would put two identical controls side by side; altLabels are for eventual search support |

**One consequence of the altLabel call to park, not solve:** phase 6's nginx rule
`/insights/tag/{slug}/ → ?topic={slug}` was designed assuming altLabel matching would catch concepts
renamed since those URLs were minted. Without it, a renamed concept's old tag URL lands on a dead param
and — per "drop silently" — shows the unfiltered index. Graceful, and now a known consequence rather
than a phase 6 surprise.

### Still to decide, and they are Andy's

- **Where the reset control goes at narrow widths.** It is rendered (`hidden`, on the heading row,
  right-aligned via `space-between`) and wraps beneath the heading when the column is tight. "reset
  genres" is the longer label in the narrower column. Judge it on screen.
- **Which focus target on reset.** "First facet" is the plan; the group heading with `tabindex="-1"`
  is the alternative, and announces "Topics" rather than a contextless chip name. Pairs with the next one.
- **The `aria-live` wording.** "12 of 42 shown" is the doc's minimum. Note the count is now 45, not 42.

### What the spec already settles — don't redesign these

- **AND across everything**, and **live counts are not separable from it.** With intersections
  frequently 0–2, AND alone would strand people in empty results; it is safe *only* because unavailable
  options are unreachable.
- **Zero-hit facets need no hide/disable decision.** Count-descending sort sinks them below the
  truncation point on their own. `filter-chip-disabled` is specified and styled (`aria-disabled`, not
  `disabled`, which anchors lack) for whatever "See all" reveals.
- **Selected is `aria-current="true"`**, never `aria-pressed`, which is button-only. The rule and the
  style already exist; the script only sets state.
- **The accessible name changes by state** — `, add filter` against `, selected, remove filter` — because
  the same control means opposite things and only the fill says so visually. The script already appends
  the first half.
- **"Insights" cannot be a genre inside Insights.** The board's `Insights 6` chip is a phantom; the real
  genres are the nine in the data.

### The one piece of machinery this needs

**Re-partition the masonry on every filter change.** Measured: keeping the build-time column assignment
through a filter leaves columns 800–1300px ragged at the median and up to 3,500 in the tail. The
`nth-child` assignment has the same problem — a filtered subset can leave every survivor in one column.
So the filter must reassign columns from measured heights, which is the greedy shortest-column-first
walk over the *visible* set, in date order. Andy has approved this; it is why the client re-partition
exists at all.

## Traps this session paid for

- **`hidden` loses to any author `display` rule.** It is `[hidden] { display: none }` at (0,1,0), so
  `.chip { display: inline-flex }` beat it and a `hidden` button rendered while `el.hidden` said true.
  base.css now has the `!important` guard. Use `[hidden]` for "not applicable" and a class for "styled
  away".
- **`ResizeObserver` watches both axes**, so anything that changes an element's height inside its own
  observer callback feeds itself. Both observers here are width-guarded. Copy that.
- **`ResizeObserver` never fires on `display: contents`** — no box. Observe a child with a box.
- **`offsetHeight` rounds to nearest, so it rounds down.** For grid row spans that means a card
  overflowing its neighbour. Use `Math.ceil(getBoundingClientRect().height)`.
- **`getBoundingClientRect()` is post-transform.** Inside a `transform: scale()` every measurement is
  scaled; `offset*` is not. This produced a whole page of wrong numbers before it was caught.
- **`requestAnimationFrame` does not fire in a hidden tab**, which is correct behaviour and a real
  obstacle to verifying in the Browser pane. Twice this session, stale-looking layout turned out to be
  a deferred rAF rather than a bug. Validate the logic by calling it directly before concluding
  anything.
- **TypeScript will not narrow a captured binding into a hoisted `function`.** Pass the non-null
  element as a parameter.
- **Measure, don't reason.** Every wrong number this session came from computing on the wrong input:
  synthetic heights instead of real ones, a partition-ordered array labelled as date-ordered, a metric
  checking within-column order when cross-column order was the question. Two committed figures had to
  be corrected. Prefer one browser measurement to three paragraphs of inference.

## Still open, carried forward

- **Show more** is next after filtering: **21 initially, +21 per press**, two buttons — "show more" and
  "show all" — side by side, stacked on mobile, both present only while items remain. Needs the
  `html.js` class added to BaseLayout's synchronous head script (Andy approved; not yet written), so the
  no-JS page keeps all 45 visible.
- **`grid-auto-flow: dense` is decided but flagged.** 21 of 45 positions differ from tab order, none by
  more than two slots, DOM order untouched. Reversible in one word. See open-questions.md.
- **Three note cards link to 404s** until `[slug].astro` widens to include `note`. It is one route that
  broadens — `getStaticPaths` collects all three types and the template branches on `_type` — not a
  second file.
- **The serializer specimen is on the index**, third card in column two. Phase 7 says do not leave that
  choice to launch day; it is now visible, indexable and in the feed.
- **`Presentations` will be the second consumer of the page header**, which is still inline rather than a
  `<PageHeader>` component. That is the promotion trigger.
- **`heroCopy` is one paragraph by intent** and the front end no longer spaces a second. Services and
  Talks currently hold multi-paragraph `heroCopy` and want their tails moved into `bodyText`; the real
  fix is `validation: Rule.max(1)` in the Studio.

## How to work

CLAUDE.md's table governs. **The cascade, component boundaries, URL design and semantics are Andy's** —
explain the platform behaviour and let him steer. Query modules, the tally, and the repetitive sweeps
are yours.

> **Draft the basic shape, then stop.** Andy reviews, guides and refines, and hands the refinements back
> for critique. Do not build the whole feature and present it finished.

Say what you are about to write before writing it. Verify by measuring in the browser rather than by
looking, and when a comment and the code disagree, the comment is a bug.
