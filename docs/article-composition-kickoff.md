# Phase 4, continued — article page composition

Paste this into a new session. CLAUDE.md and DESIGN.md load automatically; this covers what they
don't, plus what the serializer work settled that isn't obvious from reading the code cold.

---

CLAUDE.md is loaded. **Read DESIGN.md** — particularly Layout & Spacing → *The page stack is a flex
column*, and Components → *The page header*, *The rail*, *Figures* and *Code*, all of which were
written or corrected during the serializer work and directly govern this task. Then skim
`docs/open-questions.md`. This prompt covers the rest.

**Stay on `page-types`.** It is branched from `next` at `3b7186a` and is **9 commits ahead,
unpushed**. Build, `astro check`, `studio-next` `tsc` and Prettier are all green; 43 pages build with
no warnings.

## The state you are inheriting

Portable Text renders completely. Every block type in the content has a serializer.

| Path | What |
|---|---|
| `src/components/prose/Prose.astro` | The serializer map. **Transparent — emits a flat block sequence and no container.** |
| `src/components/prose/Figure.astro` | `figure`, with the `thumbnail` float and the `outline` border |
| `src/components/prose/Code.astro` | `code` blocks, via Shiki |
| `src/components/prose/Strike.astro` | `strike-through` as `<s>`, not `<del>` |
| `src/components/prose/highlighter.ts` | Shiki singleton, seven grammars, GitHub `-default` themes |
| `src/pages/insights/[slug].astro` | **A STUB. Prose column only — this is the file to replace.** |
| `src/pages/index.astro` | The throwaway specimen, now also carrying a throwaway review index |

Schema-side: `portableText.ts` holds the shared `BODY_STYLES` / `PLAIN_STYLES` / `MARKS`; `image` is
gone (folded into `figure`); `pre` was renamed to `code`, data and all; `h1` and `underline` are out
of the body.

## The work

**Compose the real article page**, replacing the stub. The Figma board is `253:1425` in
`pPZPGT6EpSaLkoUDK8HMMp` — read it with `get_metadata` and `get_screenshot`, never
`get_design_context`.

The page stack, top to bottom, with what already exists:

1. **Masthead** — done, phase 3
2. **Hero** — `<SanityHero>` exists. Full bleed, so it belongs in the page stack, never inside `<Grid>`
3. **Title band** — eyebrow + `h1`, at `--col-main`
4. **Article band** — `<Grid>` holding the prose at `--col-main` and the rail at `--col-rail`
5. **RSS CTA** — an accent band; a component instance on the board
6. **Related Insights** — three article cards. **Cards are index-page work**; stubbing or deferring
   this is fine and probably right
7. **Footer** — done, phase 3

**What DESIGN.md already settles, so don't re-derive it:**

- **The stack is a flex column**, one axis. At `lg` the hero takes `order` and swaps with the title
  band. **Author the DOM narrow-first** — title, then hero — the same rule the footer follows.
  `order` is safe here only because the hero is non-interactive.
- **The title band's padding is 64 above / 16 below**, deliberately asymmetric: the title binds to the
  prose the way a heading binds to its paragraph. This also settles what follows an `h1`, which the
  rhythm ramp never covered.
- **The eyebrow is the `label` role** — Lato **700**, 16px, +2% tracking, `text-muted`.
- **The rail is a `<nav>`** with two groups, opting out of the wipe-in underline
  (`::after { content: none }`) and taking a plain underline on hover instead.

## The rail's sticky behavior — the one thing with a trap in it

Deferred but specified. At desktop the rail's navigation stays pinned while a long article scrolls;
an image above it scrolls away; a Note's source card pins nothing.

**Stickiness is a property of a child of the rail, never of the rail itself.** That is what makes all
three cases fall out of one mechanism instead of three.

> **The rail must remain a stretched grid item. `align-self: start` silently breaks it.**

Measured against a 3000px prose column: stretched, the rail box is 3000px and the sticky child pins at
`top: 0`; with `align-self: start` the box collapses to its own content and the child scrolls away
like anything else. No `overflow` other than `visible` may appear on any ancestor — `<Band>` and
`<Grid>` set none, deliberately.

## What this page exists to settle

**48rem carries two unrelated decisions** — the masthead nav going to one row, and the content grid
opening its 8+3 split. Only the nav is comfortable there: the split takes prose from 66 characters at
767 to **49 at 768**, recovering around 1028, with the rail at 166px. DESIGN.md accepts this on the
grounds that a short measure is the cheaper failure. **A real article page is the thing that was
supposed to settle it — judge it as soon as one is on screen.**

**Check whether the rhythm exclusion is now vestigial.** `base.css` excludes `.sidebar` and `.banner`
from taking a flow margin, and open-questions.md logs that the exclusion is one-directional. But both
classes date from the 11ty structure, where `<article class="detail grid">` *was* the grid and
contained them. If the hero is a band in the page stack and the rail is a grid **sibling** of
`article.detail`, neither ever appears in the `article.detail > *` sequence and the question resolves
by construction. Confirm rather than assume — and if it does resolve, say so in open-questions.md.

## What the serializer work learned that will bite again

- **Prettier reformats the template on every `pnpm format`, and `<!-- prettier-ignore -->` does not
  apply to `{…}` expression blocks.** It collapses the comment onto the line and reformats anyway.
  Where formatting is load-bearing, fix it **structurally** — a self-closing element has no children
  to break. Verified in `dist/`, twice, after two failed attempts.
- **Astro's whitespace trimming inverts inside `<pre>`.** The phase 3 rule is that Astro trims
  whitespace before an element on a new line; inside `<pre>` it correctly preserves it, so the same
  mechanism produces a blank first line instead of a lost space.
- **`count(*[].field[filter])` in GROQ counts DOCUMENTS, not matched items.** This produced three
  wrong numbers in one session, one of which nearly got reported as a finding. Use per-document
  projections, or `math::sum(field[...]{"l": length(x)}.l)`.
- **Contrast must be measured against the ground the thing actually sits on.** `accent` on
  `surface-muted` in dark is **4.19** and fails AA, where the same color on the page ground is 6.17.
  This is DESIGN.md's "don't carry a light rule of thumb into dark" biting on a new component.
- **TypeGen describes the schema, not the data — but check which one is wrong.** A reported "TypeGen
  fault" turned out to be the schema contradicting itself (`{name: 'pre', type: 'code'}`).
- **The browser harness fails in specific ways.** Screenshots of scrolled content come back blank;
  `requestAnimationFrame` does not fire in a hidden pane, so use synchronous layout reads. **Always
  include a control whose answer you already know** — a `<p>` beside a float has its *box* at the
  container edge and only its *line boxes* shortened, which invalidated one measurement before the
  control caught it.

## Still open, carried forward

- **Rail headings have no role** — "On This Page", "Topics" are headings *and* apparatus. Currently
  `text-heading`. This page puts them on screen for the first time.
- **`table` has no serializer**, deliberately: no document uses one, and a serializer written against
  no content is a guess. It warns at build time if one appears.
- **The `serializer-specimen` article is published on `production-26`** and must be deleted or
  excluded from the index, sitemap and feed before launch. It is on the phase 7 list in CLAUDE.md.
- **`singleton.bodyText` still allows a bare inline `image` and has no `figure`.** Zero documents use
  it; swapping it is free whenever singletons get designed.
- The focus ring at `radius-1`, and `sizes="auto"` accepted on spec rather than measured.

## How to work

CLAUDE.md's table governs, and this task is squarely in **Andy's column** — layout mechanics, the
cascade, component boundaries.

> **Draft the basic shape, then stop.** Andy reviews, guides and refines, and hands the refinements
> back for critique. Do not build the whole page and present it finished.

Say what you are about to write before writing it. Explain the platform behavior, not just the
choice. And when a comment and the code disagree, the comment is a bug — this session repaired six of
them, every one describing a mechanism that had been replaced.
