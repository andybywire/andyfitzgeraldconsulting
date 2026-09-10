# Phase 4 — recording players, Related Presentations, JSON-LD

CLAUDE.md is loaded. **Re-read the schema, re-query the dataset, and re-walk the Figma
boards before trusting anything below.** Every fact here was verified on **2026-09-10** and
is a starting point, not a guarantee. Andy changes content and design between sessions, and
the most expensive lines in past kickoffs have been the ones quoting counts that had moved.

## Start state

Branch `presentations-index`, at `5b7a35a`, **pushed**. Build green: **56 pages**,
`astro check` 0 errors / 0 warnings, Prettier clean, with only the known
`[SanityHero] no altText` warnings.

**Branch from `next` before writing code** — or continue on `presentations-index` if it has
not been merged yet. A merge leaves you on `next`; check the branch when a task starts, not
when the last one ended.

Corpus as of today — re-measure rather than trust:

| | |
|---|---|
| presentations | 4 (Interview, Talk ×2, Keynote) |
| events | 41, of which **35 are not linked** to any presentation |
| recordings | **2 in total** — one audio, one video |
| insights | 42 (30 articles, 5 notes, 7 case studies) |

## What is done

The first two items of the original presentations kickoff are complete and merged into this
branch.

**The Presentations index** — cards with a poster ladder, Topic and Genre facets, the
bottom bar. Building it forced the index apparatus out of `insights/index.astro`, which went
from 1,702 lines to 304: `<CardMasonry>`, `<FacetFilters>`, `<ResultsFooter>`,
`lib/facets.ts` and `scripts/card-index.ts` are now shared by both indexes.

**The deck** — diagnosed, then replaced with a slide viewer. `<SlideDeck>` renders a
row-major grid with no JavaScript and a horizontal scroll-snap track with it, plus a
`<dialog>` full-screen view. `sanity/file.ts` is the file-asset URL choke point.

## The job, in this order

### 1. The audio player — first, because the data exists and is verified

**There is exactly one audio recording**, on `beyond-the-page-with-structured-content`, from
the event "The Informed Life":

| | |
|---|---|
| `mediaUrl` | `https://audio.buzzsprout.com/hju1qrvzgzbp8wa6go45dpf09rtj` |
| `url` | Apple Podcasts episode page |
| `sourceName` | The Informed Life |
| `duration` | `41:55` (a display string) |
| poster | **none** — so this exercises the framed-placeholder path |

**The enclosure is verified working**, which is the fact the whole native-player plan rests
on: `200`, `content-type: audio/mpeg`, **30,224,178 bytes (28.8 MB)**, `accept-ranges:
bytes`, and a range request returns `206`. So seeking works. A site `Referer` is accepted,
so there is no hotlink block.

> **A plain `curl` returns 403. It is a user-agent filter, not a broken URL.** Retry with a
> browser UA and it is a clean 200. This will otherwise cost you twenty minutes and might
> talk you out of a plan that is fine.

The resting state is already built and correct — `[slug].astro` renders a poster or a framed
panel, plus a "Listen on …" link and the duration. **The player layers onto that markup
without changing it**, which is the point of having built it that way round.

Two things to decide rather than assume:

- **`preload="none"`.** Nothing should be fetched until someone presses play; 28.8 MB is a
  large thing to spend on a visitor who scrolled past. This also makes the courtesy point
  below mostly moot.
- **It is someone else's bandwidth.** `recording.ts` already says so: "serving their file
  from this page spends their bandwidth. Worth a word to the host rather than a silent
  decision." That is Andy's call to make, not a technical one.

`duration` is a display string. It stays that way for the page; JSON-LD needs ISO 8601
(`PT41M55S`), which is a conversion, not a schema change.

### 2. The video facade

One video recording, on `taxonomy-management-and-use-in-sanity-studio` — YouTube,
`sourceName` "The Sanity Showcase Meetup", `duration` 24:21, **and it has a poster**, so the
placeholder path is not exercised here.

Click-to-load from `youtube-nocookie.com`, matching the deck's idiom so the page has one
interaction pattern for heavy third-party media. **Do not derive a thumbnail from YouTube** —
it puts a request to Google on the page before anyone asked for the video, which is most of
what the facade buys. The recording's own poster is what it uses.

### 3. Related Presentations — half of it already exists

`lib/related.ts` **already has a `presentation` branch**, and `genresForBranch` already
keeps the Document and Presentation branches apart. What is missing is smaller than the
original kickoff suggested:

- `RELATED_POOL_QUERY` filters `_type in ["article", "caseStudy", "note"]` — add
  `presentation`.
- The presentation detail page does not render `<RelatedBand>` at all yet.

Presentations relating only to presentations is the default behaviour of the existing
branch logic, not a special case. Widening it later loosens a filter.

### 4. JSON-LD — bigger than it looks

**There is no JSON-LD anywhere in `web-next`.** Not a line. The original kickoff described
this as adding `PodcastEpisode` or `VideoObject`, which reads like extending something; it
is starting from zero on this build.

`web/_includes/linked-data/` is the reference — CLAUDE.md says JSON-LD carries over from
there, joined by microformats2. Treat "add a type for recordings" as the last step of that
work rather than the first.

`PostalAddress` needs `addressCountry` as ISO 3166-1 alpha-2, and the stored values are
display strings (`USA`, `Canada`, `UK`, `Switzerland`, `Italy`), so a five-entry map is
needed somewhere. `lib/location.ts` already owns the display rule and is the obvious home.

### 5. Vet the model

Last, once the pages have exercised it. Look for fields that duplicate each other, fields
nothing renders, and gaps the templates had to work around. Two known threads:

- `event.title` and `event.type` are deprecated but still hold data on some events.
- `presentation.poster` does triple duty — card image, deck face, player fallback.

## Settled — do not re-derive or re-litigate

**From the deck work:**

- **The 53.6 MB deck was caused by LOSSLESS ENCODING**, not pixel dimensions and not
  full-slide rasterization. 99% of the file was image data; 69 of 71 unique image objects
  were Flate; one 3396×2547 photo was 27.3 MB on its own. Andy re-exported at **7.9 MB**.
- **Sanity's CDN returns WebP, not AVIF**, even when AVIF is offered in `Accept`. Measured.
  ~24 KB per slide at `w=1280` against 567 KB untransformed.
- **Slide order derives from the filename**, sorted with `localeCompare(…, {numeric: true})`
  in the page, not `| order()` in GROQ — GROQ's string ordering is lexicographic with no
  natural-number mode. The schema sets `sortable: false` to match.
- **Upload-completion order is what scrambles slides**, not alphabetical sorting. Keynote
  zero-pads to three digits and those sort correctly; the `_createdAt` stamps proved it
  (`.004` completed before `.003`).
- **Batch upload into an array drops files silently** — 8 of 40 on one attempt, clean on a
  retry. The build warns on gaps in the run. **That warning has never fired against a real
  gap**; it is worth one deliberate incomplete upload to confirm the wording and the numbers.
- **Alt text has two independent layers.** `figure.altText` and `heroImage.altText` are
  stored on the OBJECT; `sanity.imageAsset.altText` is stored on the ASSET and follows the
  image everywhere. Custom `fields:` on an image type write to the array item, never to the
  asset. Asset-level alt is set through Media Library today but READ with plain GROQ, so it
  survives losing Media Library.
- **The Media Library folder route is rejected.** It needs a second client
  (`resource: {type: 'media-library'}`) plus a build-time token — outside `loadQuery`,
  outside TypeGen — and the site would never rebuild when slides change, because moving an
  asset into a folder mutates no document and fires no webhook.

**Constraints that shape everything:**

- **The Sanity project is on the FREE plan.** Bandwidth is hard-capped at 100 GB/month and
  exhaustion **blocks all API/CDN requests** — images stop loading sitewide until the month
  resets. An availability risk, not a billing one.
- **Media Library access is grandfathered and could be withdrawn.** Nothing durable may
  depend on it.
- **Decks move to the droplet in phase 6** (approved): the build fetches each PDF once and
  ships it in the deploy tar, nginx serves it with a referer-based hotlink rule. Droplet
  transfer is 500 GiB–4 TB against Sanity's capped 100 GB. `sanity/file.ts` is the one place
  that changes. Cloudflare-in-front and Sanity signed URLs were both considered and rejected
  — see the plan file for why.

**On Figma:**

- `get_design_context` remains banned for generating code. Andy authorised a **narrow,
  read-only exception for Dev Mode ANNOTATIONS**, which are the one thing neither
  `get_metadata` nor a screenshot exposes. Take the annotation text, quote it back, and
  discard the generated React/Tailwind.
- Known board ids: **767:1897** Presentations index, **843:3838** Talk detail (carries the
  viewer control row at **2708:4342**), **2405:11933** Talk Short Format. **The board for the
  recording players has not been located** — find it before designing the audio player.

## Gotchas that cost real time

All of these failed **silently** in this session or the last.

**The browser pane runs with `document.hidden: true`, and it suppresses more than you
expect.** Each of these looked like a bug in my code first:

- `requestAnimationFrame` never fires, so smooth `scrollTo` is a no-op and any
  rAF-deferred work never runs.
- **No scroll events fire at all** — not `scroll`, not `scrollend` — even for an instant
  programmatic scroll.
- **Lazy loading is suppressed entirely.** Advancing a carousel loads nothing, so you cannot
  measure lazy behaviour from the pane at all. Hand that check to Andy.
- **`dialog.close()` set `open` to false and fired ZERO `close` events**, with a listener
  added in the same call counting none. Never established whether that is real platform
  behaviour or the pane; the code no longer depends on the answer.

**Layout:**

- **Percentage heights do not resolve through a chain of percentage-sized ancestors.**
  `grid-auto-rows: 100%` → `block-size: 100%` → `1fr` is indefinite for a descendant even
  though its used value plainly is not. `max-block-size: 100%`, `block-size: 100%` and
  `align-self: stretch` were all ignored; only an absolute length worked.
- **`align-self: stretch` does not apply to an image with an intrinsic aspect ratio** and a
  definite inline size — its block size is derived, not `auto`.
- **For an absolutely positioned REPLACED element, `inline-size: auto` uses the intrinsic
  width**, not the inset-derived width. Insets alone will not size an `<img>`; state 100%.
- **Astro scope reaches a component's ROOT, never its descendants**, and slotted content
  carries the CALLER's scope. Every child selector in `<CardMasonry>` needs `:global()`.
- **`.detail > * + h2` is a direct-child ramp** at 64. A `<section>` wrapper silently
  collapses it to 24. Measure that gap on any new section.
- **`.detail :where(p, ul, ol, blockquote, figure)` caps at 66ch and is a DESCENDANT
  selector**, so it catches a list at any depth.

**Types and data:**

- **A `defineQuery` past a complexity ceiling yields `any`, not an error.** Probe with a
  deliberate bogus property access against a known-good control; a green `astro check`
  proves nothing.
- **`EntryHeader`'s props are not checked at its call sites at all** — omitting a required
  prop, passing a wrong type, and inventing a prop all pass `astro check`. It is NOT the
  destructuring style; `Astro.props` is typed `Record<string, any>` there and `Props` in
  `TopicList`. **Cause unknown.** Three siblings share the pattern: `CaseStudyEntry`,
  `NoteEntry`, `GenreNav`.
- **Sanity dedupes byte-identical uploads**, keeping the first filename, because the asset
  `_id` is a content hash.
- **A plain `curl` to the Buzzsprout enclosure returns 403** — user-agent filter.

## Smaller things left open

- The slide-gap build warning has never fired against a real gap.
- **32 orphaned slide assets** remain in `production-26` from an earlier cleared field —
  phase 7 cleanup.
- **`assetAlt` in the shared `IMAGE` fragment**, so alt text follows the asset for every
  image and figure site-wide. Andy wants this; it is out of scope because it adds a join per
  image and touches a fragment every page depends on.
- **"Click to see larger" on figures**, generalising the deck's full-screen view. Out of
  scope; the component boundary was drawn so a second consumer needs no rewrite.
- Deck weight displays as decimal MB ("8.3 MB"), not binary ("7.9 MB"). Andy's call, settled.

## How to work together

**Draft the UI, then hand it over for feedback.** Build the component or the page, get it
green and integration-verified, and let Andy respond to something real rather than to a
description of it. For surfaces the invitation is standing.

What has not changed:

- **He wants active input on the seams** — component boundaries, what gets promoted to
  shared and what stays local, the content model, URL and id design, semantics and
  accessibility. Surface those as decisions with a recommendation before building past them.
- **Content modelling in Sanity is his**, unless he asks. Propose shapes, point out overlaps
  and gaps, hand him a drop-in object if he asks — but do not edit the schema or the data.
- **Reviewable pieces at a reviewable cadence.** One coherent piece, then stop. Say what you
  are about to write before writing it.
- **Andy does the visual verification.** Get changes green and measured, then hand him the
  specific eyeball steps rather than asking him to check what you could have measured.
- **He values pushback.** He has twice improved a plan by arguing against it — the GROQ sort
  and the inline schema shape were both his calls, and both were right.

Commit only when asked; push only when asked. Report honestly — name wrong turns and roll
them back. American spellings in prose, comments and commit messages alike; never rewrite an
identifier to match.
