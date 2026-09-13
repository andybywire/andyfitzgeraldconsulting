# Feeds — five Atom feeds, full content

The last item in the site-furniture batch. Companion to
[search-index-kickoff.md](search-index-kickoff.md), which this session followed; the 404,
sitemap, robots and analytics pieces are done and committed.

**Re-measure rather than trust, and here that is not boilerplate.** Every number below was
taken on **2026-09-13** against `production-26`. The corpus moved FOUR times during the
previous session — 42 → 44 → 43 → 42 insights — because Andy is mid-migration and was
unpublishing artifacts as they surfaced. **Re-run the counts before quoting any of them**,
and expect the same while the migration continues.

## Start state

**Branch `site-furniture`, branched from `site-search`, working tree clean.** Neither branch
is merged to `next` yet, and `site-search` carries the search build this all sits on.

```
9c17540 feat: add Plausible analytics, production builds only
194c04b feat: add a hand-authored sitemap.xml and robots.txt
29b97e7 docs: record promoting `lead` as a later to-do
b84b89a feat: add the 404 page, and take the wipe off in-page link lists
7699419 refactor: promote the topic grid to <ConceptList>   ← on site-search
```

Build green: `/sitemap.xml`, `/robots.txt`, `/search.json`. `astro check` 0/0, Prettier
clean. Page and URL counts move with the corpus, so rebuild rather than trusting a number
here.

Corpus at handoff: **42 insights** (30 `article`, 7 `caseStudy`, 5 `note`), **9
presentations**, 5 pages, 22 reviews — 78 search-index entries. Both content invariants are
clean: no `article` carries a Presentation-branch genre, and nothing is missing a genre.

## Settled — do not re-derive

Confirmed by Andy 2026-09-13.

**The URL scheme is section-nested with a `feed-` prefix for genre subsets:**

| feed | URL | contents | items today |
|---|---|---|---|
| All content | `/feed.xml` | `article` + `note` + `presentation` | 44 |
| All insights | `/insights/feed.xml` | `article` + `note` | 35 |
| Articles | `/insights/feed-articles.xml` | `article` | 30 |
| Notes | `/insights/feed-notes.xml` | `note` | 5 |
| Presentations | `/presentations/feed.xml` | `presentation` | 9 |

**Revised 2026-09-13 — `caseStudy` is excluded from every feed.** The table above
originally carried case studies in three of the five. Andy, after reading a built
`/insights/feed.xml` in a reader: they did not come through well, and he had been on the
fence about including them at all.

The reason is structural, which is why the answer was removal rather than repair. A case
study is not prose with a beginning — it is five fields arranged by a template, and two
of its headings exist only in that template (`CaseStudyEntry.astro` supplies "Work I Did"
and the `Project Goal` / `Approach` / `Outcome` labels; the three project fields carry
their own titles, the labels sit above them). Syndicating one means rebuilding the
scaffolding in whatever lifts the fields out. That was built, it worked, and it still
read as a flattened form rather than as something written.

**The machinery is deleted, not disabled** — `FEED_CASE_STUDIES_QUERY` and the
`labelled()` helper that synthesized those headings. Bringing case studies back is a
design question about what a syndicated case study IS, not a serialization one.

Two consequences worth noting rather than deciding now:

- **`/insights/feed.xml` is now exactly `feed-articles.xml` + `feed-notes.xml`.** A feed
  and its two halves — a cleaner story than the overlapping original, but it does make
  the Articles feed thinner: it is the full insights feed minus five notes. Whether all
  three still earn their place is worth a look when the remaining four are built.
- **The `/insights/` path now over-promises slightly.** The feed sits at the section's
  URL but no longer carries everything in that section. The URL must not churn, and the
  fix if one is wanted is wording on the RSS Feeds page and in the feed's own `<title>`
  rather than a new address.

`/insights/articles/feed.xml` was rejected: it asserts a path that is not a page, and
`urls-and-filtering.md` settled that genre subsets are **query params, not paths**.
A subdomain was rejected too — new DNS, a cert, an nginx server block, and it says
"different site" when these are different views of one site.

**Atom, not RSS 2.0.** `/feed.xml` is Atom today and `urls-and-filtering.md` records that it
**must not move** — "feed readers are the least forgiving consumers of a moved URL". Atom's
`<id>` and `<updated>` are required and well-defined where RSS 2.0's `<guid isPermaLink>` is
mushy, and switching format under existing subscribers buys nothing. The page can still be
called "RSS Feeds"; that is the vernacular.

**Full content, not summaries.** Andy: "a subscriber should be able to read the full article
comfortably in their RSS reader." Standard HTML tags, **no site styling imposed**.

**`/feed.xml` widens and the GUIDs get fixed.** It becomes `article` + `note` +
`presentation`.

> **Correction, 2026-09-13.** This line previously said the live feed "currently carries
> articles + notes and EXCLUDES case studies". The notes half was wrong, and verified so:
> `web/_data/articles.js:24` fetches only `article` and `caseStudy`, and `web/_src/feed.njk:28`
> filters case studies back out. **The live feed is `article` only, 34 entries** — no note
> has ever appeared in it. The case-study exclusion was correctly described. The existing `<id>` values are
`https://…/{slug}/index.html` — missing the `/insights/` segment, so `<id>` and `<link>`
disagree. Fixing that makes every existing item appear as new once, and Andy accepted that:
a feed with wrong GUIDs keeps causing dedup problems and would undermine Bridgy backfeed in
phase 8.

## What is already de-risked

**Full-content serialization has a working answer.** `@portabletext/to-html@5.0.3` is already
in the tree (transitively, via `astro-portabletext`) and renders Portable Text to an HTML
string in plain JS — **no Astro render context needed**, which is the thing that made this
look hard. The site's own serializers are Astro components (`components/prose/*.astro`) and
cannot be reused here. Make it a **direct** dependency of `web-next` before relying on it.

**`web/utils/serializers.js` is a worked example** of the same component API on this exact
content model, including `urlFor` for images. It is the old 11ty build, so it is reference
rather than a pattern to copy — but it shows which custom block types exist.

**The Articles/Notes split is `_type`, not genre traversal.** Verified: all 5 `note`
documents carry Note-branch genres (Note ×2, Web Clipping ×2, Book Note ×1), and **zero**
`article` or `caseStudy` documents carry one. So `_type == "note"` ⟺ the Note branch, and
the feeds need no `broader` walk.

## The job

Build the feeds one at a time, not five at once — they share a serializer and an entry
shape, and getting those right on one feed makes the other four mechanical.

1. **A feed-flavored Portable Text → HTML serializer.** Deliberately NOT the site's: no
   class attributes, no scoped styles, semantic tags only. Block types to cover, from
   `components/prose/`: headings, `code`/`pre`, `figure`, `image`, plus marks and lists.
2. **The entry shape and one feed** (`/insights/feed.xml` is the best first target — it has
   every block type in range and no union across branches).
3. **The remaining four**, which are the same query with a different filter.
4. **`<link rel="alternate">` discovery** in `BaseLayout` — see below.
5. **The RSS Feeds page is ANDY'S**, hand-authored, not a template. Do not build it.

## Traps, most of which have bitten this build already

**ABSOLUTE URLs EVERYWHERE.** This is the one that makes a full-content feed look broken.
Relative `href` and `src` resolve against the *reader's* origin, not the site's, so every
internal link and every image must be absolutised against `Astro.site`. Sanity image URLs
are already absolute; body links and footnote anchors are not.

**Feed size is unbudgeted and nobody has measured it.** Insight bodies total ~390 KB of
plain text; as HTML, an uncapped full-content feed would be well over 500 KB, polled
repeatedly by every subscriber. Convention is to cap at the 20 most recent. **Decide the cap
before building**, and measure the emitted file the way `/search.json` was measured.

**`defineQuery` past the complexity ceiling yields `any`, not an error.** Probe every new
query with a bogus property access against a known-good control, per the box in
`sanity/fragments.ts`. Both search and sitemap queries were caught this way.

**TypeGen types `slug` as `string | null` despite `defined(slug.current)`** — it cannot read
a filter. Unguarded, that emits `/insights/null/`. `sitemap.xml.ts` and `search-index.ts`
both carry the guard.

**`pt::text(a) + " " + pt::text(b)` is null if either side is**, and a filter written after a
`[]` flatten is silently ignored. Concatenate block ARRAYS and flatten once. See the header
of `sanity/queries/search.ts`.

**`caseStudy` has no `bodyText`** — its prose lives in five fields (`atGlance`, `whatDid`,
`projectGoal`, `projectApproach`, `projectOutcome`), and GROQ returns null for a field a type
lacks rather than complaining. That silently emptied seven documents once already. A
projection over a union is only as complete as its least-similar member.

*Retired for the feeds specifically on 2026-09-13, when case studies were excluded — no feed
query projects those five fields any more. The trap is alive everywhere else; `search.ts`
still has to concatenate them.*

## `<link rel="alternate">`

Feed auto-discovery, and distinct from the RSS Feeds page. A reader given the SITE url
fetches the HTML and looks for `<link rel="alternate" type="application/atom+xml" …>`;
without it, a person must already know the exact feed URL. Multiple are valid, each with a
`title`, and readers present a picker.

Andy's instinct, to confirm: the site-wide feed on every page, plus the section feed on
`/insights/` and `/presentations/`. That is a small `BaseLayout` prop.

## The migration is live, and it will move under you

Two artifacts surfaced during the previous session and Andy unpublished both the same day:
`boutique-knowledge-graph-ux-methods` (an `article` with no `genre`, which made
`search-index.ts`'s `TYPE_LABEL` fallback fire for the first time) and `cs-meetup` (an
`article` carrying the Presentation-branch genre **Talk** — a document CLAUDE.md names by
slug as having left the article corpus on 2026-09-09).

Both invariants are clean again as of this writing. **The lesson is not those two documents,
it is that the corpus is being repaired while the build runs against it.** Counts in source
comments carry dates for exactly this reason; re-measure before trusting one, and expect a
feed's item count to disagree with this file.

**13 of 37 heroes still have no `altText`** — the enumerable half of phase 5, unchanged.

## Carry into phase 6 — serve the feeds as `application/atom+xml`

**Found 2026-09-13, while checking a built feed over a local static server.**

`/insights/feed.xml` is a prerendered route, so the `content-type` its handler sets —
`application/atom+xml; charset=utf-8` — **never reaches a visitor in production.**
`prerender = true` writes the response body to `dist/insights/feed.xml` and discards the
headers; whatever serves that file then decides the type from its own extension map, where
`.xml` means `application/xml`. The header only takes effect in the SSR preview environment,
where the handler actually runs per request.

So the fix belongs with the nginx config, alongside the 301 map:

```nginx
types { application/atom+xml xml; }
```

which is too broad as written — it would retype `/sitemap.xml` too, and a sitemap is
`application/xml`. Prefer a location block keyed to the feed filenames, or a `map` on the
request path. **Decide that when the nginx config is authored, with all five feed URLs known.**

**Not urgent, and not a correctness bug.** RFC 4287 specifies `application/atom+xml`, but feed
readers overwhelmingly sniff the body, and a great many Atom feeds serve `application/xml` in
practice. It is recorded here because it is invisible until someone's reader is fussy, and
because it generalizes: **a prerendered endpoint's response headers are build-time fiction.**
`/search.json` has the same property — it happens to be fine, since `.json` already maps to
`application/json`.

## How to work together

Unchanged, and it worked well:

- **Draft the UI, then hand it over.** For surfaces the invitation is standing; say the
  shape in a sentence, then build it in the same turn.
- **Seams stop the draft.** Component boundaries, the content model, URL and id design,
  semantics — surface those with a recommendation and let Andy answer.
- **Andy does the visual verification.** Get it green and MEASURED, then hand him specific
  steps. A feed's real test is subscribing to it in a reader, which only he can do.
- **Report honestly.** Several numbers were published wrong and corrected in place last
  session; that is expected behavior, not an exception.
- Commit and push only when asked. American spellings in prose, comments and commit messages
  alike; never rewrite an identifier to match.
