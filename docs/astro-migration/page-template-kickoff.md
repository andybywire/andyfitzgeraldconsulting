# Phase 4 — finish the `page` template against the Consulting boards

CLAUDE.md is loaded. **Re-read the schema, re-query the dataset, and re-walk the Figma
boards before trusting anything below.** Every fact here was verified on **2026-09-06**
and is a starting point, not a guarantee. Andy changes content and design between
sessions, and the most expensive lines in past kickoffs were the ones quoting counts that
had moved.

## Start state

`next` is at `bae4510` ("Merge contact-page: the Contact page, its form, and the mail
endpoint"), tree clean. Build green: **47 pages**, `astro check` 0 errors / 0 warnings,
Prettier clean, with only the known `[SanityHero] no altText` warnings on some articles.

**Branch from `next` before writing code. Use `page-template`** — note `page-types`
already exists, is stale (`b48dad1`), and is not the branch for this.

## What already exists

The Contact page shipped the `page` template's first pass:

| | |
|---|---|
| `src/pages/[slug].astro` | the `page` template — title, lede, one band |
| `src/components/ContactForm.astro` | five fields, honeypot, success and error states |
| `src/components/bands/GetInTouchBand.astro` | optional h2 + message above the form |
| `src/sanity/queries/pages.ts` | `PAGE_SLUGS_QUERY`, `PAGE_QUERY`, `PAGE_GET_IN_TOUCH_BAND_QUERY` |
| `src/lib/social.ts` | profile URLs, extracted on their second consumer |
| `server/contact.php` + the dev stub in `astro.config.mjs` | the mail endpoint |

**`contact.php` has never executed.** There is no PHP behind nginx locally, so it is
linted and its open-redirect guard is tested against nine vectors, but the Gmail send,
the OAuth refresh and the real 303 all need a staging deploy. nginx routing, the rate
limit and the `.env` at `640` outside the web root are phase 6. Do not describe the
contact form as working end to end.

## The job

Contact exercised almost none of the `page` type: no `heroImg`, no `bodyText`, and
`bandCopy: false`. **Consulting exercises all three**, so the template needs finishing.

### The data — verified 2026-09-06, published perspective

Two `page` documents:

| slug | body blocks | hero | `pageBands` | `bandCopy` |
| --- | --- | --- | --- | --- |
| `consulting` | 19 | yes | `["bandGetInTouch"]` | **true** |
| `contact` | — | no | `["bandGetInTouch"]` | false |

Consulting carries `lede` (1 block), `bodyText` (19 blocks, styles `normal` / `h2` / `h3`,
no marks), and `heroImg` — a **1262x938 landscape** source **with both crop and hotspot**,
altText present.

Its outline: h2 **"How I Work"**, h2 **"How I Can Help"**, h3 "Information Architecture",
h3 "Strategic Advising".

**The Services → Consulting rename is published.** It was draft-only for part of the
previous session; that is resolved, the published document is `Consulting` / `consulting`,
and no draft remains. The `services` singleton is gone — converted to this `page` — so
there is no slug collision. `/consulting/` is one of the few URLs that will need a 301
from `/services/` at phase 6.

**Ignore the 4 orphan `service` documents.** They are housekeeping on Andy's end, are not
content for this project, and he will clean them up himself. They are not Consulting's
content and not this phase's problem.

### The boards

- **Desktop** — `318:4175`, 1440x3205
- **Mobile** — `757:1525` "Consulting — Mobile", 375x5280

**Desktop:**

    Article Band  y=144 h=2637
      Frame  x=222 y=64  996x2477
        Page Header  656x48                  the h1 only
        Frame  y=64 (gap 16)  996x2413
          Prose 656
            Body Group  656x260              lede 108 + [24] + first para 128
            Section How I Work     y=324     h2 35 + [16] + body
            Section How I Can Help y=759     h2 + intro, then h3 subsection at +259
            Contact instance       y=1767  656x646     the band, WITH copy
          rail  x=765  231x496
            image  231x290                   THE HERO
            [48]
            On This Page  231x158            h3 + 3 links

**Mobile** — structurally different, and this is the part to read carefully:

    Header Band  y=409  h=319       Page Header 328x255 = h1 + LEDE
    Hero         y=728  375x440     FULL BLEED, its own band
    Article Band y=1168             body starts at the FIRST PARAGRAPH (no lede)
      Contact instance  343x876     the band, mobile variant
    (no rail at all)

So the hero is **relocated, not hidden**: the rail at md, a full-bleed band below it. DOM
order is header → hero → body → band, with the grid moving the hero into the rail. The
lede travels with the header in both cases; only the body starts lower on mobile.

### What must change

1. **`bodyText` must render as `.detail` prose in the main column**, not through
   `<PageHeader body>`. That slot is documented as "a short paragraph of intro copy";
   19 blocks with h2s would put headings inside `<header>` with no rhythm ramp.
   **Verified: every gap the desktop board draws is already `.detail`'s ramp** — 64 before
   an h2, 48 before an h3, 16 after a heading, 24 between paragraphs. Nothing new is
   needed for the body rhythm.
2. **The rail becomes real** — the hero image, then "On This Page". `headingId` /
   `headingText` in `components/prose/` already exist for the nav and the article page
   uses them; `reviews.astro` already has the nav markup and the sticky treatment.
3. **The grid needs `reviews.astro`'s treatment** — `display: contents` on the header,
   `row-gap: 0`, per-row margins — so the rail aligns to the **lede** rather than the h1,
   which is what both boards draw. Note the row count differs between the two pages
   (Contact 3, Consulting 4), which makes the rail's `grid-row: 2 / -1` non-obvious;
   `reviews.astro`'s own comment explains why `-1` needs explicit rows to mean anything.
4. **The hero must not stick.** "On This Page" is sticky; the hero scrolls away with the
   content (Andy, 2026-09-06).

### Settled — do not re-derive or re-litigate

- **The hero is 4:5 at both breakpoints** (Andy, 2026-09-06). The boards draw 231x290 and
  375x440, neither of which is exactly 4:5 (288.75 and 468.75) — **those are loose
  drawings and 4:5 is the spec.** On mobile it is **full bleed with no corner radius**.
  Use crop and hotspot: the source is landscape and both breakpoints are portrait, so the
  reframe is doing real work rather than decorating.
- **The band sits in the prose column, in flow, at `--col-main`** — not as an appended
  full-bleed band. `[slug].astro` currently carries a comment speculating that `bandCopy`
  might discriminate between in-flow and appended placement. **It does not.** Placement is
  identical either way and `bandCopy` only controls whether the band carries its own copy.
  Delete that speculation rather than leaving it to mislead.
- **"On This Page" lists h2s only, plus Get in Touch.** The h3s are omitted — the board
  lists three entries and "Information architecture" is not among them.
- **Work With Me must NOT appear in that list** (Andy, 2026-09-06). In light mode it uses
  a different background and reads as a separate part of the page, whereas Get in Touch
  shares the page ground and is the page's natural call to action — so it belongs in the
  outline with the other headings. This is a rule about the two bands, not about the
  current page.
- **Nav labels come through from Sanity verbatim.** They match the body copy exactly, and
  **nothing rewrites casing.** Title case is an editorial rule Andy enforces in the
  Studio; if a heading arrives in the wrong case, the rail should show it in the wrong
  case, because that is the signal that the content needs fixing.

  Expect the rendered rail to differ from the board here: Sanity holds **"How I Work"**
  and **"How I Can Help"** (title case), while the board draws them sentence case. The
  data wins. Likewise the band entry will read **"Get In Touch"**, matching the band's
  own hardcoded heading, where the board draws "Get in touch".
- **`page.lede` is deliberately named differently from `singleton.heroCopy`** — same
  content, same purpose. Andy considers `lede` the more accurate label and intends to
  propagate it to `settings` eventually. **Do not "fix" either type to match the other**,
  and do not do that propagation as part of this phase.

## Open questions

None blocking. The four that were open at the end of the previous session — the mobile
hero aspect, the branch name, the orphan `service` documents and the nav label casing —
are all answered above.

## Gotchas that cost real time

- **`[hidden]` is `display: none !important`** in `base.css:97`, deliberately, and its own
  comment says "use `[hidden]` for 'not applicable' and a class for 'styled away'." CSS
  cannot reveal an element carrying it. This produced a silently empty region in the
  contact form — the form hid correctly and the confirmation stayed hidden too — and was
  caught only by reading computed `display` rather than trusting that author styles beat
  the UA sheet.
- **A `defineQuery` past a complexity ceiling yields `any`, not an error.** Two Portable
  Text arrays plus a band fragment is the documented tipping shape, which is exactly what
  a `page` query is — hence the split in `pages.ts`. **Probe with a deliberate bogus
  property access, using a known-good query as a control.** A green `astro check` proves
  nothing here, because a page with no callbacks over the result type-checks perfectly
  while wholly untyped.
- **Astro scoped styles reach a component's root, never its descendants**, and only if the
  component spreads `{...rest}`. Custom properties cross that boundary where selectors
  cannot — `<PageHeader>`'s `--page-header-span` is the worked example.
- **Frame names lie.** The contact form's success heading is on a layer named "H2" and
  measures 29, which is h3. Read properties and measure; never trust a name. A structural
  walk also omits `fills`, `textAlignHorizontal` and `componentPropertyDefinitions` — ask
  for the properties you are about to implement.
- **The browser pane** runs with `document.hidden`, so transitions never advance and
  `requestAnimationFrame` never fires. Inject `* { transition: none !important }` before
  measuring anything that transitions, force reflow with `void el.offsetWidth`, use
  `{behavior: 'instant'}` for scrolling, and prefer `getBoundingClientRect` and
  `getComputedStyle` over screenshots.
- **Astro does not route pages whose filename starts with `_`** — a throwaway test page
  named `__tmp.astro` will 404 and look like a broken route.
- **Sanity MCP patches write to drafts; the static build reads published.** Patching
  without publishing changes nothing the build sees.
- **`get_metadata` on the Desktop canvas (`0:1`) exceeds the token limit** and is written
  to a file instead. Search that file rather than reading it — and search on the board's
  real name. Searching for "service" missed "Consulting — Mobile" entirely and produced a
  confident, wrong claim that no mobile board existed.

## How to work

CLAUDE.md's table governs. **Layout mechanics, the cascade, component boundaries, content
model and URL design are Andy's** — explain the platform behavior and the reasoning, then
let him write it. He may delegate one of those once he has the concept, but **let him
offer.** Query modules, transcription from the boards and repetitive sweeps are yours.

> **Reviewable pieces at a reviewable cadence.** One coherent piece, then stop and let him
> look. **Say what you are about to write before writing it**, so a wrong direction costs
> a message rather than a file.

Andy does the visual verification himself: get changes green and integration-verified,
then hand him the specific eyeball steps rather than asking him to check what you could
have measured.

Commit only when asked; push only when asked. Report honestly — name wrong turns and roll
them back rather than papering over them. American spellings in prose, comments and commit
messages alike; never rewrite an identifier to match.
