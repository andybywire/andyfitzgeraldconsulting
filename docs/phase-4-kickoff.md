# Phase 4 — page types

Paste this into a new session. CLAUDE.md and DESIGN.md load automatically; this covers what
they don't, plus what phase 3 settled that isn't obvious from reading the code cold.

---

CLAUDE.md is loaded. **Read `## Current direction` and the phase 4 entry, then DESIGN.md**, then
`docs/open-questions.md` and `docs/urls-and-filtering.md`. This prompt covers what those don't.

Branch from `next` — phase 3 merged at `8cc13c7` and `next` is **unpushed**, 33 commits ahead of
origin. Build, `astro check` and Prettier are green.

## Read these before writing anything

Phase 3 built the chrome and the mechanisms every page type now sits on. Reading them in this
order is the fastest way in — each is heavily commented, and the comments carry the reasoning
rather than restating the code.

| File | What it establishes |
|---|---|
| `web-next/src/styles/tokens.css` | Every value, and **both breakpoints**. Custom-property declarations only. |
| `web-next/src/styles/base.css` | Element-level roles: `h1`–`h4`, prose, links, `nav`, blockquote, figure, icons, focus, rhythm, measure. |
| `web-next/src/components/Band.astro` | Full-bleed stripe. Re-points role tokens on `tone="accent"`. |
| `web-next/src/components/Grid.astro` | The 12-column grid. Placement comes from tokens. |
| `web-next/src/components/Masthead.astro` | The three-state pattern, and the style-container-query mechanism. |
| `web-next/src/sanity/image.ts` | srcset arithmetic, crop/hotspot maths, the no-upscale cap. |

`src/pages/index.astro` is a **throwaway specimen**. It is not a page type and should be deleted or
replaced once real pages exist — but read it first: it is the only worked example of placing things
on the grid, and it currently demonstrates both image components.

## The responsive model — the thing most likely to be broken by accident

**Two major breakpoints, `md` at 48rem and `lg` at 64rem, declared once in `tokens.css`. No
breakpoint value exists anywhere else in the codebase, and that is load-bearing.**

Three mechanisms, in order of preference:

1. **Flip a token.** A custom property holds any token sequence, so `1 / span 8`, `column`, `grid`
   and `"a" "b"` all work — placement, `flex-direction`, `display` and `grid-template-areas` are
   all reachable this way.
2. **Read a flag** when a rule must genuinely *exist or not exist* at a width, which a token cannot
   express: `@container style(--breakpoint-lg: true) { … }`. **Always the `: true` form** — the
   bare `style(--breakpoint-lg)` tests whether the property is *declared*, so `false` and `0` both
   match it.
3. **A minor breakpoint** — one component adapting to the space *it* has — belongs in that
   component, as a real **size container query**. There are none yet.

Adding a third major breakpoint is one more block in `tokens.css`, wider last. Do not add one to a
component.

## What phase 3 learned that will bite again

Each of these cost real time. They are recorded in the code, but knowing to look is the point.

- **`sizes` and `<source media>` cannot read custom properties.** Both are HTML attributes resolved
  outside the cascade. This is why images use `sizes="auto"` — see `SanityImage.astro`.
- **`vector-effect` is not inherited.** Set on an `<svg>` it silently computes to `none` on the
  path, and `stroke-width` gets scaled by the viewBox instead.
- **`visibility: hidden` removes an element from the accessibility tree**, exactly like
  `display: none`. Use the clip technique when text must stay an accessible name.
- **Astro trims whitespace before an element on a new line**, so `and\n<a>` renders as `and<a>`.
  Use `{' '}`. **This will recur constantly in Portable Text serializers.**
- **`/* */` is not valid in an Astro element's attribute list** — it parses as an attribute.
- **Custom property substitution is not sequential.** `--a: var(--b)` in a block that also declares
  `--b` resolves against that block's own value.
- **A `<button>` sizes to fit-content whatever its `display` is**, so going block-level loses it
  the cell's `text-align`.
- **`:is()` takes the specificity of its most specific argument.**

## Verification, and one honest warning about it

Phase 3 measured everything in a real browser rather than trusting arithmetic, and that caught
several bugs that looked fine — a nav label turning exactly the color of the band behind it, a
stroke rendering six times thinner than its neighbours, a header 40px too tall.

**But the browser harness is unreliable in specific ways, and I wasted many turns learning them:**

- The preview pane is often collapsed, so `innerWidth` is 0 and every `vw` resolves against zero.
  **Measure inside a sized iframe**, not the main document.
- Transitions do not advance in a hidden pane. Reading a computed style right after a state change
  returns the *start* value. Kill the transition before measuring.
- Lazy images never load, because nothing intersects. `sizes="auto"` is therefore untestable there.
- `srcset` is comma-delimited and a base64 data URI contains a comma, so data URIs cannot be used
  as srcset candidates.
- Screenshots of scrolled content frequently come back blank.

**Always include a control whose answer you already know.** Every bad result in phase 3 announced
itself as an inverted or impossible control, and every one I nearly reported as a finding was
caught that way.

## The work, in DESIGN.md's order of structural leverage

1. **Article / insight detail** — prose, measure, rhythm, blockquote, figure, rail. Where DESIGN.md
   is most specific and where the type system either works or does not.
2. **Index pages** — cards, chips, pagination.
3. **Home** — mostly composition of bands that already exist.
4. **The rest** — services, projects, case study, reviews, presentations, search.

### Starting with the article detail means starting with Portable Text

Nothing in phase 3 touched it, and it is the largest unbuilt piece.

- **Portable Text emits a flat sequence with no section wrappers.** This is why vertical rhythm is
  sibling margins rather than `gap`, and it is a constraint on the markup, not a preference.
- **The serializer needs an image block**, wrapping `<SanityImage>` in `<figure>` with a
  `<figcaption>`. `SanityImage` was built to be called this way — plain props, no page assumptions.
  base.css already styles `figure`/`figcaption` and the measure cap already includes `figure`.
- `web/utils/serializers.js` is the 11ty equivalent. **Read it for what the content model contains,
  not for how to structure the new one.**

### The projection trap, which is silent

Queries must project the image **object**, not `asset->url`. Projecting a URL returns a working
image, renders correctly, and **discards crop and hotspot with no error** — every framing decision
an editor made, gone, page looking fine.

Add an `IMAGE` fragment alongside `IDENTITY` / `DATES` / `TAXONOMY` in `src/sanity/fragments.ts`.
Keep fragments `const` and literal: TypeGen resolves them across module boundaries only because
they are literal types, and a fragment built at runtime breaks the chain silently, leaving types
`any` while still looking correct.

### The content model moves alongside

Per CLAUDE.md: the `note` type and the two SKOS vocabularies land in this phase — a hierarchical
topic vocabulary and a **semantic type** vocabulary distinguishing kinds that share one structural
Sanity type. `sanity-plugin-taxonomy-manager` is installed. **Taxonomy design may deserve its own
branch.**

### Search is specified, not designed

DESIGN.md → Components → Search. Phase 3 shipped the masthead icon **inert**, and left the seam it
needs: `.slot` in `Masthead.astro` holds the nav now and is meant to hold either. The search button
is a `<button>` rather than a link precisely because search does not navigate.

## Carried into phase 4 unresolved

- **48rem carries two unrelated decisions** — the masthead nav going to one row, and the content
  grid opening its 8+3 split. Only the nav is comfortable there: the split takes prose from 66
  characters at 767 to **49 at 768**, recovering around 1028, with the rail at 166px. Accepted for
  now on the grounds that a short measure is the cheaper failure. **This is the decision real
  content pages exist to settle** — judge it as soon as one is on screen.
- **`.sidebar + p` still takes `rhythm-paragraph`.** The rhythm exclusion is one-directional: it
  stops a margin landing *on* a grid-placed element but not on its successor, so an
  `h2 → .sidebar → p` sequence loses the paragraph's bond to the heading. Logged in
  open-questions.md against this phase.
- **The focus ring at `radius-1`** is now on screen in the mode selector, which is the check
  DESIGN.md asked for. Unresolved by eye.
- **`sizes="auto"` was accepted on spec, not measurement** — see the harness warning above.
- **Rail headings have no role**, and rail width at md is 166px, which is where `body-compact`
  ("a column too narrow for `body`") most likely earns its keep.
- **Any block published as `h5`** still carries that style though the schema dropped it. Unverified;
  flagged for the phase 5 parity check.

## How to work

CLAUDE.md's table governs. **Andy plays an active role in layout mechanics, the cascade and component boundaries** —
explain the reasoning and the platform behavior. He may want to write it; give space for him to offer before
assuming he wants to delegate. In practice phase 3 settled into: draft the basic shape, stop, he
reviews and refines, then hands the refinements back for critique.

**Reviewable pieces at a reviewable cadence. Never pages of code at once. Commit only when asked — but suggest committing when natural chunks of work are completed.**

Two habits worth carrying over: say what you are about to write before writing it, and when a
comment and the code disagree, the comment is a bug. Phase 3 repaired stale comments three times;
each time they described a mechanism that had been replaced.
