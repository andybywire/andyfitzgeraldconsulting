# Content parity — a repeatable check, not a one-off sweep

Phase 5. Companion to [feeds-kickoff.md](feeds-kickoff.md), which this session followed; the
five Atom feeds are built and merged.

**Re-measure rather than trust.** Every number below was taken on **2026-09-14** against
`production-26`. The corpus moved twice during the feeds build alone — 9 presentations to 10,
41 events to 47 — because Andy is mid-migration. **Re-run the counts before quoting any of
them**, and expect the same while the migration continues.

## Start state

**Branch `next`, working tree clean.** `site-feeds` is merged and still exists locally.

```
44adda5 chore: nav order and link updates.
5d1086a Merge site-feeds: five Atom feeds with full content
9c7faf5 fix: remove duplicate period.
5fd3fc8 style: wrap two long lines in the feeds table
6ad8c9c feat: name the highlights heading after the genre
b5c1074 feat: advertise the feeds with <link rel="alternate">
23537da feat: add five Atom feeds carrying full content
```

Build green: 64 pages, five feeds, `/search.json`, `/sitemap.xml`, `/robots.txt`. `astro check`
0/0, Prettier clean, zero `[feed-html]` warnings.

Corpus: **42 insights** (30 `article`, 7 `caseStudy`, 5 `note`), **10 presentations**,
**47 events**, 5 pages, 4 singletons, 22 reviews, plus the orphan types (4 `service`,
2 `collection`).

## Why this phase exists at all

Worth restating, because the reason is easy to lose and it changes what the check should be.

The original migration plan held design constant so the port could be **diffed against live
production**. That plan is gone: the design system is complete, it includes elements the 11ty
front end never had, and the content model changed. There is no longer an automated way to prove
the port is faithful, **because it is not meant to be.**

**Content parity is the instrument that replaces it.** Not "does it look the same" but "does
every document still render, with everything it carries." A changed model quietly breaking a
published document is the failure mode that actually bites, and this build has produced that
exact failure twice already — see Gotchas.

## The job

A script, run by hand like `pnpm typegen`, that answers six questions. Build it incrementally;
each check is independently useful and the first two are most of the value.

1. **Does every document that should have a URL have one?** Read the built `dist/` and the
   dataset, and diff. Types that own a URL: `article`/`caseStudy`/`note` at `/insights/{slug}/`,
   `presentation` at `/presentations/{slug}/`, `page` at `/{slug}/`, `singleton` at its bespoke
   route. `review` is an anchor on `/reviews/`, not a page. `event` renders nothing by design,
   and neither do `service` or `collection`.

2. **Are there dangling references?** A `->` that resolves to null while the reference itself is
   defined. Known reference fields: `genre`, `topic[]`, `caseStudy.client`, `caseStudy.review`,
   `presentation.eventDetail[]`, `review.employer`, plus the SKOS `broader`/`related` links
   inside the vocabularies.

3. **Is any populated field going unrendered?** The hardest of the six and the one phase 5 was
   written for. A field carrying data that no query projects renders as nothing, and nothing
   about that is an error anywhere. Suggested shape: enumerate populated fields per type from the
   data, hold an explicit allowlist of "rendered" and "deliberately ignored", and fail on
   anything unclassified — so a NEW field added in the Studio has to be triaged rather than
   silently dropped.

4. **Does the Genre invariant hold?** A document's genre should sit under the top concept
   matching its structural family: an `article` must not carry a Presentation-branch genre.
   CLAUDE.md has called this "worth a build-time check" since phase 4 and nothing enforces it.
   It had four violations once — three Interviews and a Talk stored as `article` — which made the
   Insights index over-collect by exactly that many.

5. **Do any two documents collide in a URL space?** `article`, `caseStudy` and `note` all live at
   `/insights/{slug}/`, so a slug shared between an article and a note is a real collision that
   the Studio will not prevent. Nothing checks this today.

6. **Report-only signals**, which must NOT fail the run:
   - **Events not referenced by any presentation** — 35 of 47 today. Expected mid-migration.
   - Documents missing `genre`, `pubDate` or `title`.
   - Heroes or body figures missing `altText`.

## The baseline, which is the most useful thing in this file

**Everything is clean as of 2026-09-14.** Measured, not assumed:

| check | result |
|---|---|
| dangling `genre` | 0 |
| dangling `topic[]` | 0 |
| dangling `client` / `review` / `employer` / `eventDetail[]` | 0 each |
| slug collisions in `/insights/` | 0 (42 slugs, 42 distinct) |
| Genre invariant violations | 0 |
| documents missing `genre` | 0 |
| hero `altText` | 37 of 37 present, 0 empty-string |
| body figures missing `altText` | 0 |
| events with no presentation | **35 of 47** — expected, report-only |

**So the first run should find nothing except the 35 orphan events. If it finds more, suspect
the script before suspecting the content.** That is the whole reason this table is here: a parity
checker with a false positive is worse than none, because it trains you to ignore it.

## Decisions for Andy — surface these before building past them

- **Where it lives and how it is invoked.** `web-next/scripts/` holds `subset-fonts.sh` today and
  is run by hand. A `pnpm parity` at the root is the obvious shape, but whether this is a
  `web-next` script or a repo-level one depends on whether it reads `dist/`.
- **Does it read `dist/`, or only Sanity plus the query modules?** Reading `dist/` makes check 1
  possible and makes the script depend on a fresh build. Not reading it keeps the script fast and
  standalone but reduces it to a content audit. These are different tools; pick one deliberately.
- **What fails versus what warns.** Exit codes decide whether this can ever gate CI.
- **Does it run in CI?** Phase 8 owns automated quality gates, and a TypeGen drift check is
  already slated to live there. This may want to join it rather than stay manual.

## Gotchas, most of which have already cost time here

**GROQ returns null for a field a type lacks, rather than complaining.** The single most
expensive trap in this build. `caseStudy` has no `bodyText` — its prose is in `atGlance`,
`whatDid`, `projectGoal`, `projectApproach`, `projectOutcome` — and projecting `bodyText` across
the insight union silently indexed seven documents on card copy alone, with a green build. **A
projection over a union is only as complete as its least-similar member**, and a parity script is
exactly the place that bites hardest.

**`defineQuery` past the complexity ceiling yields `any`, not an error.** Probe every new query
with a deliberate bogus property access against a known-good control, per the box in
`web-next/src/sanity/fragments.ts`. `astro check` stays green over a wholly untyped result; that
is how the `LADDER` defect survived weeks.

**TypeGen types `slug` as `string | null` despite `defined(slug.current)`** — it cannot read a
filter. Unguarded, that produces `/insights/null/`. `sitemap.xml.ts`, `search-index.ts` and
`lib/feed-entries.ts` all carry the guard, and the feeds version is generic
(`<T extends Base>`) because a non-generic type predicate does not narrow through
`Array.filter` — it silently returns the array unnarrowed.

**Nested array traversal needs parentheses, and lies quietly without them.**
`eventDetail[]->eventRecordings[][0]` distributes the index across EACH event and returns one
result per event; the parenthesised `(eventDetail[]->eventRecordings[])[0]` flattens first.
Re-verified 2026-09-13: the unparenthesised form returned `[null, null, null]` for the
three-event talk. `studio-next/schemas/objects/recording.ts` documents this at length.

**A projection over a flattened traversal can come back null.** Observed 2026-09-13 and **not
fully characterised** — worth pinning down, since a parity script will traverse a lot.
`count(eventDetail[]->eventRecordings[])` returned correct counts while
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
- **`/feeds/` is an unsettled path.** `web-next/src/components/Footer.astro:75` links it and its
  own comment flags it as a guess not recorded in
  [urls-and-filtering.md](urls-and-filtering.md). The RSS Feeds page is Andy's to write and is
  the only place the three genre-subset feeds become findable.
- **nginx must serve the feeds as `application/atom+xml`** — a prerendered endpoint's response
  headers are build-time fiction. Phase 6, recorded in feeds-kickoff.md.
- **The SSR preview environment has never been built or deployed.** There is no
  `SANITY_API_READ_TOKEN` in `web-next/.env`, so the draft perspective and the stega-stripping
  path in the feeds are verified as functions and unverified as a deploy. It is the part of
  phase 6 with the most unknowns and a good candidate to start early.
- **Phase 7 items that the parity check will surface**: 37 documents still carry the deprecated
  `insightType`; `service` (4) and `collection` (2) have live documents and no schema file.
  Both are expected and should be report-only here, not failures.

## How to work together

Unchanged, and it worked well:

- **Draft the UI, then hand it over.** For surfaces the invitation is standing; say the shape in
  a sentence, then build it in the same turn.
- **Seams stop the draft.** Component boundaries, the content model, URL and id design,
  semantics — surface those with a recommendation and let Andy answer. The four Decisions above
  are seams; do not settle them while typing.
- **Andy does the visual verification.** Get it green and MEASURED, then hand him specific steps.
- **Report honestly.** Several numbers were published wrong and corrected in place across the
  last two sessions, including a confident claim about feed readers that Andy disproved with a
  counter-example. That is expected behavior, not an exception.
- Commit and push only when asked. American spellings in prose, comments and commit messages
  alike; never rewrite an identifier to match.
