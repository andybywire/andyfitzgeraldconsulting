# Phase 4 — finish Presentations: index, decks, players, related, JSON-LD

CLAUDE.md is loaded. **Re-read the schema, re-query the dataset, and re-walk the Figma
boards before trusting anything below.** Every fact here was verified on **2026-09-09**
and is a starting point, not a guarantee. Andy changes content and design between
sessions, and the most expensive lines in past kickoffs have been the ones quoting counts
that had moved.

## Start state

`next` is at `c79d705`, clean, pushed. Build green: **53 pages**, `astro check` 0 errors /
0 warnings, Prettier clean, with only the known `[SanityHero] no altText` warnings.

**Branch from `next` before writing code.** A merge leaves you on `next`; check the branch
when a task starts, not when the last one ended.

Corpus as of today — re-measure rather than trust:

| | |
|---|---|
| presentations | 4 (Interview, Talk ×2, Keynote) |
| events | 41, of which **35 are not linked** to any presentation |
| insights | 42 (30 articles, 5 notes, 7 case studies) |

The four presentations happen to cover every branch of the poster ladder, which makes them
a genuinely useful test set — see **Settled** below.

## What already exists

| | |
|---|---|
| `src/pages/presentations/[slug].astro` | the detail page — field-driven sections, transcript + TOC, resting-state media |
| `src/sanity/queries/presentations.ts` | six queries, each probed against a control |
| `src/lib/location.ts` | `formatLocation` — the venue string |
| `src/components/Rail.astro` | the rail shell: aside, sticky child, dispersal below md |
| `src/components/RailNav.astro` | "On This Page", shared by three pages |
| `studio-next/schemas/objects/recording.ts` | audio + video in one type; carries the poster-ladder rule and its GROQ trap |

`Rail` is used by the article and presentation pages. `reviews.astro` and `NoteEntry` still
write their own rail — deliberately, because each differs in a way that is not
configuration. Adopting them is optional and **reviews needs a measurement pass**, since
its stickiness mechanism would change.

## The job, in this order

### 1. The Presentations index — first, deliberately

It comes first because it gives a way to navigate between the sample presentations, and
because it lets the **Presentation cards** be built in context rather than in isolation.

Board `767:1897`. Page Header, a Topic filter (571) and Genre filter (316) sharing a row,
a three-column masonry of 316-wide cards, then the RSS CTA, then the Get in Touch band.

It reuses the Insights index's filtering mechanism — same Topic and Genre facets, same
behaviour. Read that page before designing anything here.

**Cards: the box is the signal.** A card with a poster is boxed (surface, hairline border,
radius); a card without one sits directly on the page ground with no boundary. Same
mechanism `NoteCard` already uses, and DESIGN.md's Elevation section states the principle.
Boxed cards read as richer and more worth clicking, which is the intent.

**Chips are derived, never authored** — `transcript`, `audio`, and so on are facts the
query already knows. They are informative only, not clickable. (Ignore the `(+1)` inline
text on the board: leftover sketching, superseded by chips.)

**The poster ladder is specified and its GROQ is verified** — see Settled.

> **The Get in Touch band on this page is the first consumer of `BAND_GET_IN_TOUCH`, which
> has never been exercised.** Hand-transcribed GROQ, no consumer, no query whose result
> type anyone has checked. **Probe it** with a bogus property access against a known-good
> control. A bad fragment leaves `astro check` green. See the box in `sanity/fragments.ts`
> and the note in CLAUDE.md → phase 4.

### 2. The deck — re-open the format question before building a viewer

**Do not start by building pdf.js.** Andy has wired up **Sanity Media Library**, which
makes batch PNG upload efficient, and wants to explore whether a PNG sequence is a better
source for on-page slide viewing than a large PDF.

Arguments already on the table, so the exploration starts from them rather than repeating
them:

- The current deck is **53.6 MB** after a "reduce file size" pass and a re-export. That is
  roughly ten times what a download link should hand a visitor, and the download link is
  unaffected by whatever the in-page viewer does.
- **The likely cause has not been diagnosed.** In a photo-heavy deck the dominant cost is
  usually pixel dimensions rather than compression — but 53.6 MB across ~40 slides is
  ~1.4 MB/slide, which is closer to full-page rasterization (a shadow, gradient or blend
  mode can force a whole slide to flatten to a bitmap). Two commands settle it:
  `pdfimages -list deck.pdf | head -40` and
  `qpdf --split-pages deck.pdf pg-%d.pdf && ls -lS pg-*.pdf | head`.
  **Run these before choosing a format** — if it is rasterization, the PDF is a bad source
  regardless of the viewer.
- pdf.js costs a few hundred KB and needs a worker file wired into Astro's asset pipeline.
  PNGs cost none of that, go through the existing `<SanityImage>` with real `srcset`, and
  degrade to a plain image list with no JS at all.
- What PNGs lose: text selection, a single-file download, and one artifact to keep in
  step. Slide *order* becomes data rather than intrinsic.
- **Unverified:** whether Sanity's CDN serves range requests, which decides whether
  linearizing a PDF would let a viewer render page one without fetching the whole file.
  One `curl -sI … | grep -i accept-ranges` answers it.

Whatever the source, the **resting state is already built and correct**: a poster, or a
framed panel where there is none, plus a download link. Any viewer layers onto that markup
without changing it, which is the point of having built it that way.

### 3. Recording players, Related Presentations, JSON-LD

**Players.** `beyond-the-page-with-structured-content` carries a real Buzzsprout
`mediaUrl`, so the native `<audio>` path has data to build against — no third-party script,
no tracking, fully styleable. Video takes a click-to-load facade from
`youtube-nocookie.com`, matching the deck's idiom so the page has one interaction pattern
for heavy third-party media. Do not derive a thumbnail from YouTube: it puts a request to
Google on the page before anyone asked for the video, which is most of what the facade
buys.

**Related Presentations.** Add `presentation` to `RELATED_POOL_QUERY` and a third branch to
`lib/related.ts`. `genresForBranch` already exists to keep the Document and Presentation
branches apart, so today's intent — presentations relate only to presentations — is the
default behaviour rather than a special case. Widening it later loosens a filter.

**JSON-LD.** `PodcastEpisode` or `VideoObject` selected by `recording.kind`, plus
`PostalAddress`. This is why `duration` is captured and why the country field is worth
constraining — `addressCountry` wants ISO 3166-1 alpha-2, and the values stored are display
strings (`USA`, `Canada`, `UK`, `Switzerland`, `Italy`), so a five-entry map is needed
somewhere.

### 4. Vet the model

Last, once the pages have exercised it. Look for fields that duplicate each other, fields
nothing renders, and gaps the templates had to work around. Two known threads:

- `event.title` and `event.type` are deprecated but still hold data on some events.
- `presentation.poster` now does triple duty — card image, deck face, player fallback.
  Whether that stays one field is worth a look once the index exists.

## Settled — do not re-derive or re-litigate

- **"Venue" / "Venues"**, pluralised by event count. It replaced "Delivery" (the board's
  label) and then "Location", and the reason is the online case: "Location: Online" reads
  as a missing value. Two of four presentations are online.
- **Prev/next spans all presentations**, not a genre. `<GenreNav>` needs no change; its
  `genre` prop is only the chip copy.
- **The transcript TOC is a plain `<ul>`, not a `<nav>`**, and its links must behave exactly
  like running-text links. It has an elevated panel: surface, hairline border, `radius-2`,
  16px padding.
- **No back-to-TOC chevrons** on transcript headings, and **no id prefix** on them. Both
  were specified and then dropped; the repetition was noise and the collision risk is
  editorially correctable.
- **The poster ladder:** `presentation.poster`, else the first recording with a poster,
  walking events then recordings in **stored order**. The arrays are user-sortable and that
  sort is an editorial judgment — **do not reorder by date.** The GROQ needs parentheses:
  `(eventDetail[]->eventRecordings[])[defined(poster)][0]`.
  All four outcomes occur in the current corpus: `language-arts` and `yes-and` hit rung 1,
  `taxonomy-management` hits rung 2, `beyond-the-page` has none and renders unboxed.
- **Recordings model audio and video as one type**, on `event` rather than `presentation`,
  because a recording is a property of a delivery.
- **Sections are field-driven and the rail is built from what rendered** — never from
  walking the body for h2s, because there are none.

## Gotchas that cost real time

These are all things that failed **silently** in this session or the last.

- **A `defineQuery` past a complexity ceiling yields `any`, not an error.** Three Portable
  Text arrays plus an image, a file and a nested traversal is far past it. **Probe with a
  deliberate bogus property access against a known-good control**; a green `astro check`
  proves nothing, because an `any` type-checks perfectly.
- **A GROQ fragment may be a `const`, never a function.** Interpolating a literal-typed
  const preserves the literal type; interpolating a *function call* widens it to `string`,
  the `ClientReturn` map lookup misses, and every query built from it is `any`. This shipped
  undetected for weeks in `LADDER` before being found by accident.
- **Astro scope reaches a component's ROOT, never its descendants** — and **slotted content
  carries the CALLER's scope, not the component's.** A rule like `nav + nav` written inside
  a component that slots those navs compiles, ships, and matches nothing. Use
  `:global()` scoped under an element the component *does* own.
- **`.detail > * + *` is a direct-child ramp.** Wrapping sections in `<section>` stops
  `* + h2` matching and silently turns 64 into 24. Use `<Fragment>`.
- **GROQ `a[]->b[]` flattens, but `[filter][0]` distributes per parent.** Parenthesise the
  traversal or you get one result per parent instead of the first overall — an array where
  a single value was expected, which reads downstream as "no value".
- **GROQ `count(a[]->b[])` counts nulls.** An event with no recordings still contributes a
  null to the flattened array, so a count can report three recordings where there are none.
  Filter on a defined field before counting.
- **Sanity's conditional `hidden` stops editing, not storage**, and `initialValue`
  populates fields where they are meaningless. `country` is set on the online events and
  unset on the in-person one. Read the discriminator field first, never infer from presence.
- **Figma frame names lie, and a structural walk omits fills.** "Card display controls" was
  the prev/next pair. The transcript TOC's panel read as a transparent indent because a
  frame reports geometry and not its surface — take a screenshot for anything visual.
- **`get_metadata` on the Desktop canvas (`0:1`) exceeds the token limit** and is written to
  a file as JSON-escaped XML. Extract the `text` fields with Python and search locally
  rather than re-fetching; every board's subtree is in there.
- **The browser pane opens with zero layout width.** Call `resize_window` explicitly before
  measuring anything, or every number is meaningless. It also runs with `document.hidden`,
  so transitions never advance.
- **base.css's `nav :is(a, button)` reset** strips the resting underline *and* adds the
  wipe-in `::after`. Never wrap prose links in a `<nav>` unless you intend to re-derive the
  prose treatment.
- **Measure, do not assert.** The venue formatter looked right and dropped "WA" on one of
  three events; a duplicate-id sweep found a real collision where the estimate was
  "vanishingly thin". Both were found by running something, not by reading.

## How to work together

**This has shifted, and the shift is the point.** CLAUDE.md's table still says layout
mechanics are Andy's to write. In practice he now prefers:

> **Draft the UI, then hand it over for feedback.** Build the component or the page, get it
> green and integration-verified, and let him respond to something real rather than to a
> description of it.

What has *not* changed:

- **He wants active input on the seams** — component boundaries, what gets promoted to
  shared and what stays local, the content model, URL and id design, semantics and
  accessibility. Surface those as decisions with a recommendation before building past
  them. The seams are the joints; the surfaces are yours to draft.
- **Content modelling in Sanity is his**, unless he asks. Propose shapes, point out
  overlaps and gaps, hand him a drop-in object if he asks for one — but do not edit the
  schema or the data on your own initiative.
- **Reviewable pieces at a reviewable cadence.** One coherent piece, then stop. Say what
  you are about to write before writing it, so a wrong direction costs a message rather
  than a file.
- **Andy does the visual verification.** Get changes green and measured, then hand him the
  specific eyeball steps rather than asking him to check what you could have measured.
- **He values pushback.** Offer new angles and challenge assumptions. If he reaffirms a
  decision after you have raised a concern, that is his call — proceed with the full
  request.

Commit only when asked; push only when asked. Report honestly — name wrong turns and roll
them back rather than papering over them. American spellings in prose, comments and commit
messages alike; never rewrite an identifier to match.
