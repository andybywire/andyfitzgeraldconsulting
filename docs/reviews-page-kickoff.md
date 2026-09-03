# Phase 4 — the Reviews page

CLAUDE.md is loaded. **Andy has updated the content model, the content, AND the Figma
file since this was written — re-read the schema, re-query the dataset, and re-read the
boards. Do not trust any counts or field coverage quoted below.** He will give specific
design direction on layout, links and behavior in this session; gather facts and surface
decisions first rather than building from the board alone.

**Stay on `page-types`.** Branched from `next`, 50 commits ahead, unpushed, tree clean.
Build, `astro check` and Prettier are all green: 47 pages, 0 errors, with the known
`[SanityHero] no altText` warnings on some articles and nothing else.

## The work

**Build the Reviews page.** It is a **singleton** (`slug: "reviews"` exists), and it is
the one remaining top-level page whose type and data were both already in place.

Building it also closes a live loose end: the case study testimonial band links its
attribution to **`/reviews/#{review-slug}`**, which 404s on five case studies today. That
URL shape was an inference from Reviews being a singleton — one page holding every review,
so a fragment addresses one of them. **Confirm it before relying on it**;
[docs/urls-and-filtering.md](urls-and-filtering.md) says nothing about `/reviews/`.

As of the last session there were 22 `review` documents carrying `author`, `title` (the
person's job title), `employer` (a reference to `client`), `slug`, `body`, and uneven
coverage of `excerpt` and `condensedBody`. **Re-query — this is exactly what Andy
changed.**

## What is already built — don't rebuild it

| | |
| --- | --- |
| Article / insight detail | `pages/insights/[slug].astro` |
| Note detail, three variants | `components/NoteEntry.astro` + `SourceCard.astro` |
| Case study detail, complete | `components/CaseStudyEntry.astro` |
| Insights index, complete | `pages/insights/index.astro` — facets, masonry, filtering |
| Genre prev/next nav | `components/GenreNav.astro` + `sanity/queries/genre-nav.ts` |

Shared components you will probably want: `Band`, `Grid`, `Prose`, `Eyebrow`, `Chip`,
`SanityImage`, `Button`, `WorkWithMeBand`, `RelatedBand`. `EntryHeader` and `GenreNav`
are for Genre-labeled *detail* pages — a singleton gets neither.

**Still unbuilt, and both blocked on schema work that is Andy's:** Presentations needs a
`presentation` type (38 `event` documents to invert into a smaller set of presentations);
Projects needs a `page` type, which does not exist in `studio-next/schemas/documents/`
at all.

## Figma — read this before opening it

**The file has FIVE pages and `get_metadata` with no `nodeId` reports TWO.** There is no
hint of truncation. [docs/figma-notes.md](figma-notes.md) leads with this. The ids:

| page | id |
| --- | --- |
| Desktop | `0:1` |
| Mobile | `949:4649` |
| Components | `949:4650` |
| Assets | `1472:8168` |
| Notes | `164:1268` |

**Boards are nested inside section frames, so iterating `page.children` misses them.**
Use a read-only `use_figma` script with `findAll` or a nested walk — it is also far
cheaper than `get_metadata` on `0:1`, which exceeds the token cap:

    const out = []
    for (const p of figma.root.children) {
      await p.loadAsync()
      out.push(`PAGE ${p.id} ${p.name}`)
      for (const sec of p.children) {
        out.push(` ${sec.id} ${sec.type} "${sec.name}"`)
        if ('children' in sec) for (const b of sec.children)
          out.push(`   ${b.id} "${b.name}" ${Math.round(b.width)}x${Math.round(b.height)}`)
      }
    }
    return out.join('\n')

Last known: **Reviews desktop is `831:3559`**, 1440x5760, one child frame named "Article
Band", in Desktop → "Top Level Pages". **Andy has since added detail and a mobile view,
so re-enumerate rather than trusting that.**

For a board's internals, a `use_figma` walk that prints auto-layout props and positions
relative to the board is the most useful single call — gap, padding, `layoutWrap` and
`primaryAxisAlignItems` are what actually encode the responsive behavior.

**FRAME NAMES LIE.** The genre prev/next chips live in a frame called *"Card display
controls"*. A name search for "prev"/"next" found nothing; position and contents found
it. Never conclude a design is absent because a name search came up empty.

**A board measurement is not automatically a spec.** Two lessons, in opposite directions,
each learned the hard way:

- A list column drawn as a single Figma **text node** has a height that is a consequence
  of leading, so it says nothing about item margins — except the arithmetic *did* mean
  something here (160px / 5 items = 32 = one body line box, so no margin). The wrong
  call was made in both directions once each.
- A **fixed image height** in a board is usually incidental to whichever asset was pasted
  in. Check the real asset aspect ratios before imposing a crop, and **never `cover` a
  logo or a screenshot** — client tiles measured 1.50 to 2.22, before-images 1.128 to
  1.767.

**Never use Figma's design-to-code tooling** (`get_design_context` and friends) —
CLAUDE.md forbids it, and `get_metadata` will nag you to call it. Read metadata and
screenshots; write the code yourself.

## What this repo has taught us — the expensive lessons

**Measure in the browser, and measure from the CONTENT edge.** A `padding-block`
shorthand bug measured **48 box-to-box and 112 from the content edge**; the box-to-box
reading "confirmed" the wrong thing.

**The dev server can lie.** After a long HMR session a selected chip's colour matched
neither the cascade nor the built CSS. When something looks impossible, check `dist/`.

**`dist/` goes stale.** The dev server was once diffed against a stale comparison build
and a phantom was chased for several calls. Rebuild before comparing.

**Verify a refactor by enumerating every distinct changed token** across the built pages
rather than reading a diff. That is how the `EntryHeader` extraction was shown to change
exactly three things — and how it surfaced that moving an import silently **reordered the
emitted CSS** (same 24 rules, different sequence; benign there, not benign in general,
since sequence decides ties).

### Astro specifics, each of which has cost real time

- **`:global()` nested inside `:has()` is emitted verbatim** and the browser discards the
  whole rule, silently. Wrap the *entire* selector instead.
- **A parent's scope attribute is passed to a child component's root element**, so a page
  can style a component's root (`.source-card`, `.chip`) but cannot reach its descendants
  without `:global()`.
- **`ClientReturn<Q>` has a complexity ceiling.** Past it the type resolves to `any`
  rather than failing, surfacing as implicit-anys on unrelated callbacks in the *page*.
  Probe deliberately with a throwaway module instead of waiting to be surprised. One
  Portable Text array plus a band fragment tripped it; five arrays plus a review body did
  not. Keep band queries separate from detail queries.
- **Prettier reflows JSX** when nesting changes. Read those diffs with `git diff -w` and
  verify the built HTML — Astro drops whitespace between adjacent expressions once a
  formatter splits them across lines, which once shipped `45insights` into the output.
- **`margin-inline: auto` stops a grid item stretching**, so an `aspect-ratio` box sizes
  from its own content and can overflow its track. `max-inline-size: min(Npx, 100%)`.

### base.css changed this session

Three rules were **removed** as unspecified inferences — DESIGN.md named the tokens but
never said these elements consumed them:

- the global `li + li` margin
- the `--rhythm-block` pair that gave `ul, ol, blockquote, figure, pre` 48 above and below
  inside `.detail`
- `text-wrap: balance` on headings

Lists are now separated by their leading alone; block transitions take
`--rhythm-paragraph` (24). **A list that wants item spacing asks for it locally** —
`TopicList`'s stacked rail form and the home page's review list are the two that do.
Eight cancellation rules were deleted along with the global one.

**When a comment and the code disagree, the comment is a bug.** Several file headers went
stale mid-session and had to be rewritten.

## How to work

CLAUDE.md's table governs. **Layout mechanics, the cascade, component boundaries, content
model, URL design and semantics are Andy's** — explain the platform behaviour and let him
steer. Query modules, transcription from the boards and repetitive sweeps are yours.

> **Reviewable pieces at a reviewable cadence.** One coherent piece, then stop and let him
> look. **Say what you are about to write before writing it**, so a wrong direction costs
> a message rather than a file.

Commit only when asked. Report honestly — name wrong turns and roll them back rather than
papering over them.

## Open items carried in — none blocking

- **`e-content` is on nothing on the case study**, deliberately. Recorded as a decision in
  `CaseStudyEntry.astro`, with the granary finding (consumers read `content[0]`, so
  multiple `e-content` elements parse fine and silently drop all but the first) and the
  fact that search engines do not read mf2 at all.
- **A lone "Next" chip sits at the right edge** in `GenreNav` — an inference, not the
  board's, affecting 10 of 41 navs. Andy may want it at the left.
- **`grid-auto-flow: dense` on the Insights masonry stands** (Andy likes it); its measured
  figures predate the ladder change. See [docs/open-questions.md](open-questions.md).
- **The serializer specimen is still published and on the Insights index.** Phase 7's
  "delete or exclude" call, deliberately deferred — and increasingly looking unnecessary.
- **`adjBright`** is a live `heroImage` field with no renderer anywhere in the build.
  Legacy, being deprecated, projected nowhere.
