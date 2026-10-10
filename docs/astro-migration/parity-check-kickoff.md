# Content parity — a repeatable check, not a one-off sweep

Phase 5. Companion to [feeds-kickoff.md](feeds-kickoff.md). **Superseded 2026-09-15:** this was
written as a kickoff and is now the record of what was built. The four decisions it opened are
settled, the checks exist, and its own corpus table and reference-field list were wrong — both
corrected below rather than left to be rediscovered.

**Re-measure rather than trust.** Every number here was taken on **2026-09-15** against
`production-26`. The corpus moved twice during the feeds build (9 presentations to 10, 41 events
to 47) and twice more during this one (10 presentations to **14**, 5 pages to **6**, unattached
events 35 to **29**) — Andy was editing the Studio while the script ran. **Re-run the counts
before quoting any of them.**

## What exists

`web-next/scripts/parity.mjs`, run by hand against a fresh build:

```bash
pnpm --filter web-next build && pnpm parity
```

Root `pnpm parity` delegates to `web-next`, mirroring how root `typegen` delegates to
`studio-next`. Nothing in the build depends on it.

## Why this phase exists at all

Worth restating, because the reason is easy to lose and it decides what the check should be.

The original migration plan held design constant so the port could be **diffed against live
production**. That plan is gone: the design system is complete, it includes elements the 11ty
front end never had, and the content model changed. There is no longer an automated way to prove
the port is faithful, **because it is not meant to be.**

**Content parity is the instrument that replaces it.** Not "does it look the same" but "does
every document still render, with everything it carries." A changed model quietly breaking a
published document is the failure mode that actually bites, and this build has produced that
exact failure twice — see Gotchas.

## The four decisions, as settled

- **It reads `dist/`.** A checker that only ran GROQ is structurally blind to the class of bug
  this hunts: when `bodyText` was projected across the insight union, seven case studies came
  back as valid results and the build stayed green. The query *succeeded*. Only the built output
  knows what rendered.
- **It lives in `web-next/scripts/`**, which follows from reading `dist/`.
- **Three levels, not two.** FAIL exits 1; WARN and INFO exit 0. Unclassified fields **warn**
  (Andy, 2026-09-15) and should be promoted to FAIL at cutover, once the model stops moving. A
  check that fires routinely mid-migration gets ignored, and takes the FAIL set with it.
- **Not in CI yet** — phase 8 owns quality gates. And when it joins them, **not as a deploy
  gate**: production rebuilds fire on Sanity webhooks, so unpublishing a concept would dangle a
  reference and block a deploy on a purely editorial action.

## The six checks, as built

1. **Every document that should have a URL has one.** Diffs `dist/` against the dataset in both
   directions — a document with no page fails, a built page nothing explains warns. A **stale
   `dist/` refuses to run**, scoped to types that own a URL; see Gotchas.
2. **No dangling references.** Walks raw document JSON for any `_ref` rather than holding a field
   list, so it reaches references nested in band objects and Portable Text and cannot drift.
3. **No populated field goes unrendered.** Derived from the query source, not an allowlist — see
   the deviation below.
4. **The Genre invariant holds.** Climbs `broader` to the Genre scheme's top concepts, so an
   `article` cannot carry a Presentation-branch genre. Resolved by label, not by pinned id.
5. **No two documents collide in a URL space.** `article`, `caseStudy` and `note` share
   `/insights/{slug}/` and slug uniqueness is per type.
6. **Report-only signals.** Orphan events, missing required fields, missing `altText` on heroes
   and body figures, `insightType` residue, the orphan types.

### Check 3 does NOT use the allowlist this document originally proposed

The kickoff proposed an explicit allowlist of "rendered" and "deliberately ignored", failing on
anything unclassified. **That shape was rejected, and this document is the evidence why:** its own
list of reference fields named six where the schema declares eighteen. A hand-maintained inventory
of the content model drifts silently and then asserts something false with total confidence.

So "rendered" is read off the queries themselves. No GROQ projection here uses a spread — the only
`...` in `src/sanity/queries/` are `[0...n]` range slices — so every projected field is named
literally, and a name appearing nowhere in the query text cannot be reaching any page.

It **under-reports deliberately**: matching is by name across all query source at once, so a
`title` projected for one type looks covered for all. Scoping per type needs the queries parsed
rather than searched, and a false accusation is what gets a checker switched off. Comments are
stripped before matching, or the check is nearly inert — the prose in these files names most of
the model.

## The baseline, which is the most useful thing in this file

**`0 fail, 7 warn, 5 info` on 2026-09-15.** 245 documents, 68 built pages.

| check | result |
|---|---|
| documents with no page | 0 |
| dangling references | 0 |
| slug collisions in `/insights/` | 0 |
| Genre invariant violations | 0 |
| missing `title` / `pubDate` / `genre` | 0 |
| hero and body-figure `altText` | 0 missing outside the orphan `service` docs |
| populated fields reaching no query | **7** — see below |
| events with no presentation | **29 of 47** — expected, report-only |
| documents carrying deprecated `insightType` | 37 |
| orphan types | 4 `service`, 2 `collection` |

Corpus: **42 insights** (30 `article`, 7 `caseStudy`, 5 `note`), **14 presentations**, **47
events**, **6 pages**, 4 singletons, 22 reviews, 81 concepts in 4 schemes, 17 clients.

**So a clean run finds seven warnings and five informational lines. If it finds more, suspect the
script before suspecting the content** — a parity checker with a false positive is worse than
none, because it trains you to ignore it.

## What check 3 found on its first run

**`article.canonical` holds data that reaches nothing.** Two of thirty articles carry it, both
cross-posts: `structured-content-headless-cms` → LinkedIn Pulse, `conversations-with-robots` →
A List Apart. The site computes its own canonical URL, so those two pages currently claim to be
the original. **Andy's call, 2026-09-15: the field is a real canonical URL and must be
communicated in site metadata and JSON-LD.** Wiring it up is live work, not a phase 7 cleanup.

**Six `settings` fields reach nothing:** `siteTitle`, `siteSubtitle`, `insightsBanner`,
`clientWorkBanner`, `homeLogos`, `featuredClients`. **Andy's call, 2026-09-15:** most will be
deleted, but `siteTitle` becomes the masthead wordmark name, feeds page metadata, and the second
half of every page title as `{pageTitle} | {siteTitle}`; `siteSubtitle` becomes the wordmark role.
The banners and the two client arrays stay on the deletion list.

## Corrections to the original kickoff

- **Its reference-field list named six fields; the schema declares eighteen.** Missing were
  `insightType` (still live on 37 documents), `settings.homeLogos[]`, `settings.reviews[]`,
  `settings.featuredClients[]`, and `bandWorkWithMe.clientLogos[]` nested inside band objects.
  This is the single reason check 2 walks raw JSON.
- **`/feeds/` is settled and this document's note on it was stale.** `Footer.astro` links
  `/rss-feeds/` and the page builds. Only "Andy writes the page" remains open.
- **Hero `altText` remains complete** across a corpus that has grown since, and now also covers
  presentations. The four missing are on `service` documents, which render nothing.

## Known gaps, stated rather than buried

- **Media Library references are unverified — 77 when this was written, 647 on 2026-09-17** as the
  presentation work landed. `media-library:<library>:<asset>` addresses a store shared across
  projects, not a row in `production-26`, so a dataset-id check cannot speak to them. **A deleted
  library asset would break an image and go unreported.**

  **And GROQ cannot reach them at all, which is the hard part** (measured 2026-09-17, while
  investigating alt text). An ML-backed image carries BOTH a normal `asset` reference and a weak
  `media` global reference: `asset->originalFilename` resolves, **`media->` resolves to `null`**.
  So nothing stored on a Media Library asset — alt text, title, description — is readable from a
  dataset query, and closing this gap means the Media Library API rather than a cleverer
  projection. Worth knowing before anyone plans work that depends on ML metadata.
- A field can be projected and then never used by the template that receives it. Invisible here.
- `false` counts as unpopulated, since a boolean at its default cannot be told from one never set.
- The staleness guard compares a local filesystem clock against Sanity's, so a build racing an
  edit by a second or two reads as stale. That direction is the safe one.

## Gotchas, most of which have already cost time here

**GROQ returns null for a field a type lacks, rather than complaining.** The single most
expensive trap in this build. `caseStudy` has no `bodyText` — its prose is in `atGlance`,
`whatDid`, `projectGoal`, `projectApproach`, `projectOutcome` — and projecting `bodyText` across
the insight union silently indexed seven documents on card copy alone, with a green build. **A
projection over a union is only as complete as its least-similar member.** This is why the parity
script fetches whole documents and projects nothing.

**`defineQuery` past the complexity ceiling yields `any`, not an error.** Probe every new query
with a deliberate bogus property access against a known-good control, per the box in
`web-next/src/sanity/fragments.ts`. `astro check` stays green over a wholly untyped result; that
is how the `LADDER` defect survived weeks.

**TypeGen types `slug` as `string | null` despite `defined(slug.current)`** — it cannot read a
filter. Unguarded, that produces `/insights/null/`. `sitemap.xml.ts`, `search-index.ts` and
`lib/feed-entries.ts` all carry the guard, and the feeds version is generic
(`<T extends Base>`) because a non-generic type predicate does not narrow through
`Array.filter` — it silently returns the array unnarrowed.

**A Map keyed by URL hides exactly the collision check 5 looks for.** The first draft of check 1
stored one document per URL, so two documents sharing a slug would have left one unexamined and
the run would have reported clean. It holds an array now. A checker whose own data structure
discards the fault it hunts is the worst kind of false negative.

**A staleness guard scoped too widely gets switched off.** The first version compared `dist/`
against the newest edit to *any* document and refused to run, because an `event` had been edited
six seconds after the build. Events render no page and cannot move a URL. It now scopes to types
that own a URL — the same map check 1 already verifies in both directions.

**Nested array traversal needs parentheses, and lies quietly without them.**
`eventDetail[]->eventRecordings[][0]` distributes the index across EACH event and returns one
result per event; the parenthesised `(eventDetail[]->eventRecordings[])[0]` flattens first.
Re-verified 2026-09-13: the unparenthesised form returned `[null, null, null]` for the
three-event talk. `studio-next/schemas/objects/recording.ts` documents this at length.

**A projection over a flattened traversal can come back null.** Observed 2026-09-13 and **not
fully characterised**. `count(eventDetail[]->eventRecordings[])` returned correct counts while
`(eventDetail[]->eventRecordings[]){kind, url}` returned null for every document. Indexing first
(`(…)[0]{…}`) worked, and so did dereferencing per event and projecting inside
(`eventDetail[]->{eventRecordings[]{…}}`). Do not assume a projection works because a `count()`
over the same path did.

**`pt::text(a) + " " + pt::text(b)` is null if either side is**, and a filter written after a
`[]` flatten is silently ignored. Concatenate block ARRAYS and flatten once. See the header of
`web-next/src/sanity/queries/search.ts`.

**The corpus moves under you.** Not a caveat, a working condition — see the top of this file.

## Smaller things left open

- **Heroes are not in the Atom feeds.** Never surfaced as a decision when the feeds were built;
  entries carry `lede` + `bodyText` and `heroImage` is not projected. See feeds-kickoff.md.
- **The RSS Feeds page is Andy's to write.** `/rss-feeds/` exists and is linked; it is the only
  place the three genre-subset feeds become findable.
- **nginx must serve the feeds as `application/atom+xml`** — a prerendered endpoint's response
  headers are build-time fiction. Phase 6, recorded in feeds-kickoff.md.
- **The SSR preview environment has never been built or deployed.** There is no
  `SANITY_API_READ_TOKEN` in `web-next/.env`, so the draft perspective and the stega-stripping
  path in the feeds are verified as functions and unverified as a deploy. It is the part of
  phase 6 with the most unknowns and a good candidate to start early.
- **No web manifest in `web-next`.** The live site serves `/manifest.json` and references maskable
  icons. That belongs with phase 8's deferred service-worker decision, not with the favicon.
- **Phase 7 items the parity check surfaces every run**: 37 documents carrying `insightType`;
  `service` (4) and `collection` (2) with live documents and no schema file. Both expected, both
  report-only.

## How to work together

Unchanged, and it worked well:

- **Draft the UI, then hand it over.** For surfaces the invitation is standing; say the shape in
  a sentence, then build it in the same turn.
- **Seams stop the draft.** Component boundaries, the content model, URL and id design,
  semantics — surface those with a recommendation and let Andy answer.
- **Andy does the visual verification.** Get it green and MEASURED, then hand him specific steps.
- **Verify by induced fault.** Every FAIL branch in the parity script was confirmed by breaking
  something on purpose and watching it fire — a checker that has only ever reported clean is not
  a verified checker.
- **Report honestly.** Several numbers were published wrong and corrected in place across these
  sessions, including two defects in the parity script found by running it.
- Commit and push only when asked. American spellings in prose, comments and commit messages
  alike; never rewrite an identifier to match.
