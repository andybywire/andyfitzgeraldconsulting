# Eleventy and Astro, compared

How the 11ty site retired at the 2026-09-28 cutover compares with the Astro site that replaced it:
how much code each takes, what each sends to a reader, what each costs the droplet, and how
accessible each is. Measured 2026-10-06.

**What was compared.** The old site is a fresh build of commit `06cd8e5` against the `production`
dataset it served until the cutover. Its release was already gone from `/var/www/afc` on the
droplet, so a rebuild is the only way back to it. The new site is release `20261005212057`, copied
from the droplet. The two read different datasets, so pages are matched by **role**, not by
identical content. How to repeat any of this is at the end.

This is a record, not a task list. The loose ends it turned up are listed near the end.

---

## The short answers

| Question | Answer | Headline numbers |
|---|---|---|
| Which has more code? | **Astro, about 3×** | 3,613 → 10,706 lines of code in `web/`; comments 405 → 18,945 |
| Which sends heavier pages? | **Eleventy, about 8×** | median first load on a phone 1,817 → 222 KB; LCP 9.2–12.5 → 1.8–2.4 s |
| Which uses the droplet better? | **Astro, with one new cost and one new problem** | disk ~630 → 94 MB; a new Node process; origin requests ~12k → up to 430k a day |
| Which is more accessible? | **Astro, clearly** | Lighthouse 84–96 → 100; contrast failures on 9 of 9 pages → 0 of 10 |

---

## Page weight

Lighthouse 12.8.2, mobile preset (a mid-range phone on throttled 4G), median of three runs. Weight
is bytes transferred on arrival, before any scrolling.

| Page | Weight (KB) | Requests | LCP (s) | Performance |
|---|---|---|---|---|
| Home | 1,841 → 206 | 36 → 14 | 10.8 → 1.8 | 63 → 100 |
| Insights index | 1,595 → 222 | 36 → 16 | 9.2 → 2.0 | 69 → 99 |
| Article: `content-modeling-in-the-age-of-flying-cars` | 1,826 → 201 | 33 → 14 | 10.8 → 2.4 | 63 → 97 |
| Case study: `seattle-childrens` | 2,128 → 247 | 36 → 16 | 12.5 → 2.4 | 63 → 98 |
| About | 1,570 → 235 | 31 → 14 | 9.2 → 2.3 | 69 → 98 |
| Contact | 1,898 → 136 | 37 → 10 | 9.2 → 1.8 | 69 → 100 |
| `/talks/` → `/presentations/` | 1,499 → 230 | 32 → 17 | 9.2 → 2.0 | 69 → 99 |
| `/services/` → `/consulting/` | 1,617 → 223 | 31 → 12 | 9.2 → 2.4 | 69 → 98 |
| Reviews | 1,817 → 205 | 34 → 13 | 10.8 → 2.1 | 63 → 99 |
| Presentation (new only): `prototyping-information-architecture` | – → 339 | 19 | 2.1 | 99 |

On the desktop preset the old pages scored 90–94 and every new page 100.

**Where the bytes go**, for the article above:

| Resource | Eleventy | Astro |
|---|---|---|
| Fonts | 1,761 KB (6 files) | 155 KB (4 files) |
| Images | 40 KB | 5 KB |
| CSS | 15 KB (21 requests) | 7 KB (3 requests) |
| JavaScript | 0 KB | 12 KB, including 3 KB of Plausible |
| HTML | 10 KB | 15 KB |
| **Total** | **1,826 KB** | **201 KB** |

**Fonts are nearly the whole gap.** The old site preloaded full, unsubsetted variable fonts:
Noto Serif at 925 KB transferred, Lato Medium at 203 KB, and both Open Sans files (578 KB), which
were its `--body` face in `style/utilities/variables.css`. The Astro site serves four Latin subsets
totaling 154 KB through the Fonts API, and a page loads only the three or four it uses.

**The old CSS was a render-blocking chain.** `style.css` pulled in 21 more files by `@import`, and
Lighthouse counted all 21 as render-blocking. The new pages load one to three stylesheets and inline
the rest.

**The old service worker added another 1.0–1.3 MB on a first visit.** It precached 30 files
(2.8 MB) in the background. Subtracting what each page had already fetched, it still downloaded
1,024 KB (Noto Serif Italic, 1 MB on its own) or 1,329 KB (plus Open Sans Italic) that none of the
nine tested pages used. Lighthouse does not see a service worker's requests; this was read back from
CacheStorage in headless Chrome.

**Third parties.** The old contact page loaded 348 KB of reCAPTCHA, and the insights index pulled
Fuse.js from jsDelivr. The new site's only third party is Plausible's 3 KB script, on every page.

**What grew.**

- **HTML roughly doubled:** 5.9 KB → 12.4 KB per page, brotli-compressed (24.8 → 73.4 KB raw). It
  now carries inlined component CSS, inline SVG icons, a fuller JSON-LD graph and microformats.
- **Pages also grow after arrival.** More images sit below the fold and load lazily as a reader
  scrolls: the insights index reaches 768 KB at the bottom, a slide-deck presentation 917 KB, the
  presentations index 576 KB and the case study 522 KB. Every other page grows by less than 50 KB.
  The old pages loaded all their images on arrival, so scrolling added nothing to them. Even the
  917 KB page is lighter than any old page on arrival.
- **The insights index is not like for like.** The old one paginated at 10 items; the new one lists
  everything and filters in place.

---

## Code

Committed files only: `web/` and `studio/` at `06cd8e5` and at `main`. Excluded: lockfiles, the
generated `sanity.types.ts` (2,994 lines), fonts, images, and the old tree's
`__design-specimens/`. Blank lines are not counted.

| | Files | Code | Comment | Comment per code line |
|---|---|---|---|---|
| `web/`, Eleventy | 85 | 3,613 | 405 | 0.11 |
| `web/`, Astro | 121 | 10,706 | 18,945 | 1.77 |
| `studio/` at `06cd8e5` | 17 | 1,309 | 26 | 0.02 |
| `studio/` at `main` | 26 | 2,060 | 668 | 0.32 |

The `web/` rows come from a classifier that splits each `.astro` file into frontmatter, `<style>`,
`<script>` and markup, so the concerns below can be compared. cloc 2.06 counts the same trees as
3,618 / 400 and 11,077 / 18,691, within 0.1% and 3%. The `studio/` rows are cloc's.

**Lines of code by concern, `web/`:**

| Concern | Eleventy | Astro |
|---|---|---|
| Styles | 1,688 | 2,834 (402 global, 2,432 in components) |
| Markup and templates | 864 | 1,703 |
| Component logic: Astro frontmatter and helpers | – | 1,508 |
| Build helpers and endpoints: feeds, search index, linked-data builders | 246 | 1,227 |
| Client-side JavaScript: search, theme, facets, slide deck | 97 | 990 |
| Data layer: GROQ queries | 282 | 812 |
| Hand-run tooling: parity, phrase candidates, font subsetting | – | 616 |
| Config | 119 | 463 |
| Linked data | 129 | 355 |
| Mail endpoint (PHP) | 169 | 180 |
| Icons | 19 | 18 |

**The largest growth is in behavior, not presentation.** Client JavaScript grew tenfold and build
helpers fivefold. That is search, the facet filters, the theme toggle, five feeds and the JSON-LD
graph, none of which the old site had in this form.

**The CSS grew less than the site did, and ships smaller.** 1,688 → 2,834 lines, all scoped to the
component that owns it, and about 7 KB per page on the wire against 15 KB.

**None of the 18,945 comment lines ship.** The built HTML contains no comments at all: frontmatter
is server code, template comments are dropped by the compiler, and Vite minifies the CSS and JS.

**Dependencies:**

| | Eleventy | Astro |
|---|---|---|
| Direct npm dependencies, `web/` | 8 | 25 |
| Installed npm packages, `web/`, excluding per-platform binaries | 167 | ~1,174 |
| …reachable through `@sanity/astro` (visual editing) | – | 1,077 |
| …reachable through `astro` itself | – | 208 |
| PHP dependencies per release | 190 MB, 32,225 files | 5.5 MB, 633 files |

Nearly the whole npm increase is visual editing, and none of it reaches a production reader:
`BaseLayout` gates the import so the production bundle drops it. The PHP figure goes the other way.
The old `composer.json` installed every Google API client (`google/apiclient-services`, 173 MB) for
a form that calls only Gmail. The new one prunes to Gmail with `Google\Task\Composer::cleanup`.

---

## The droplet

| | Eleventy | Astro |
|---|---|---|
| Disk, three releases kept | ~630 MB | 94 MB (production 42 + preview 52) |
| Files, three releases | ~97,000 | 3,650 |
| One release | ~205 MB: 15 MB site, 190 MB PHP | 14 MB production, 18 MB preview |
| Droplet-side deploy step | 5–76 s, unpacking ~32k files | 2 s, a symlink swap |
| Processes | nginx, PHP-FPM | the same, plus the preview's Node unit |

The ~630 MB is the figure recorded in `nginx/afc-production.conf` before the release was deleted.
Three rebuilt releases come to ~615 MB, which agrees.

**Memory is the one place the new site costs more.** The preview's Node process (`afc-preview`)
used 28 MiB when measured and peaked at 112 MiB since its 2026-10-05 08:45 UTC restart, against
`MemoryHigh=200M` and `MemoryMax=256M` on a 458 MiB droplet. PHP-FPM (32 MB) and nginx (20 MB) are
shared by both generations.

### Origin traffic across the cutover

From `/var/log/nginx/access.log*`, aggregated on the droplet. "Facet" means `/insights/` or
`/presentations/` with `?topic=` or `?genre=`. The log has no host field, so `preview.` is included,
and these are requests that reached the origin behind Cloudflare, not visitors.

| Day | Requests | Facet | MB sent |
|---|---|---|---|
| 22 Sep | 9,781 | 1 | 91 |
| 23 Sep | 10,108 | 1 | 69 |
| 24 Sep | 10,912 | 1 | 106 |
| 25 Sep | 14,324 | 0 | 100 |
| 26 Sep | 9,467 | 1 | 75 |
| 27 Sep | 13,759 | 0 | 71 |
| 28 Sep (cutover) | 14,830 | 0 | 102 |
| 29 Sep | 51,158 | 36,764 | 944 |
| 30 Sep | 139,760 | 122,955 | 2,957 |
| 1 Oct | 243,731 | 234,689 | 5,609 |
| 2 Oct | 429,929 | 414,748 | 10,000 |
| 3 Oct | 39,435 | 31,063 | 773 |
| 4 Oct | 55,302 | 41,430 | 1,047 |
| 5 Oct | 81,130 | 66,962 | 1,635 |
| 6 Oct (to 20:07 UTC) | 75,725 | 64,398 | 1,574 |

**Without the facet URLs, traffic is flat:** about 11,400 requests a day in the week before the
cutover and 13,100 in the week after.

**The facets created an unbounded URL space, and a crawler found it.** The old site published 70
tag pages, a finite set. The new indexes accept any combination of topics and genres, every
combination is a distinct URL, and Cloudflare caches none of them because HTML is `no-cache`. The
robots.txt rule in `c84b3b3` went live at 23:18 UTC on 2 October, and requests fell to 39k the next
day before climbing back. On 6 October, 48,327 facet requests came from `meta-externalagent` on
Meta's own network (2a03:2880::/32), every one to a URL the rule disallows. Meta is not honoring it.
nginx serves these from disk without strain, so the cost is bandwidth and log volume: the access
log went from about 2 MB a day to 28 MB.

### Build and deploy

GitHub Actions, from the run history of `build-prod.yml` and `deploy-astro.yml`.

| | Eleventy | Astro |
|---|---|---|
| Site build step | 4 s or less | 32–49 s |
| Type-check step | – | 8–11 s |
| Build job | 30–44 s | 79–99 s |
| Deploy job | 19–97 s | 11–19 s |
| Median successful run, end to end | 70 s (75 runs) | 115 s (29 runs) |
| Concurrency control | none | cancels superseded builds (18 of 48 runs), deploys one at a time |

**The build is about ten times slower, and the droplet's share of a deploy shrank.** Most of the
build time is GROQ, code highlighting, search-term extraction and five feeds.

**Concurrency control matters more than the timings suggest.** At 00:16–00:19 UTC on 14 August, a
burst of 248 `article` webhooks started 248 parallel runs of the old workflow, and all 248 failed.
In a sample of eight, each built fine and then failed copying its tarball to the droplet (six) or
unpacking it there (two).

---

## Accessibility

Lighthouse on mobile, and axe-core 4.14 in headless Chrome with every rule enabled: WCAG 2.0, 2.1
and 2.2 at A and AA, plus best practice. The new site was run in both color schemes, with identical
results. Automated checks find a minority of real accessibility problems, so these results set a
floor and do not certify either site.

| Page | Lighthouse | axe, Eleventy | axe, Astro |
|---|---|---|---|
| Home | 93 → 100 | color-contrast ×24, page-has-heading-one | none |
| Insights index | 84 → 100 | color-contrast ×26, label, label-title-only, aria-allowed-attr, landmark-unique | label-content-name-mismatch ×12 |
| Article | 93 → 100 | color-contrast ×21, landmark-unique | none |
| Case study | 93 → 100 | color-contrast ×25 | none |
| About | 95 → 100 | color-contrast ×16 | none |
| Contact | 96 → 100 | color-contrast ×20 | none |
| Talks → Presentations | 95 → 100 | color-contrast ×16 | label-content-name-mismatch ×11 |
| Services → Consulting | 95 → 100 | color-contrast ×16 | none |
| Reviews | 95 → 100 | color-contrast ×16 | none |
| Presentation (new only) | 100 | – | none |

**What changed:**

- **Contrast.** The old muted text and link colors failed AA on every page. The new palette was
  built against live contrast checks, and the dark theme holds to the same standard.
- **Structure.** Every new page has the skip link, one `main` and one `h1`. The old home page had no
  `h1`, and the old insights search field was labeled only by a `title` attribute.
- **No CAPTCHA.** reCAPTCHA was replaced by a honeypot and nginx rate limiting.
- **Unchanged:** both set `lang`, and both give every `img` an `alt`, descriptive or empty.

**What is left on the new site:**

- **Facet chips: borderline.** axe flags them as `label-content-name-mismatch` (WCAG 2.5.3, Label in
  Name). The visible text is a label and a count ("Structured Content", "11"); the accessible name
  is "Structured Content, 11 results", plus ", add filter" once the script runs. The name begins
  with the visible label, so speaking the label still works, but the comma breaks axe's contiguous
  match. Lighthouse weights this audit at zero.

  **Corrected 2026-10-08: the comma was not the cause, and this is fixed.** Five variants tested
  against axe showed it sets punctuation aside. The real cause was the two spans rendering with no
  space between them, so the visible text was "Structured Content11". One `{' '}` in
  `FacetFilters.astro` fixed it, with the name unchanged. The phase 8 accessibility gate found it.
- **The rail's "Contents" heading** is an `h3` that skips a level on About and Consulting. The rail
  shows only at desktop widths, which is why those pages score 99 on desktop and 100 on mobile.
  **Fixed 2026-10-08:** the rail headings are h2 now, after the phase 8 HTML validator reported the
  skip as an error. See `RailNav.astro`.

---

## Everything else that changed

| | Eleventy | Astro |
|---|---|---|
| HTML pages built | 126: 70 tag pages, 4 pagination | 84: 40 presentations |
| Sitemap URLs | 122 | 82 |
| Filtering | one static page per tag | facets in the query string, any combination |
| Search | Fuse.js from jsDelivr, 42 documents, substring match | MiniSearch bundled, 100 documents, word match plus vocabulary terms |
| Feeds | 1, 35 entries | 5 Atom feeds: site, insights, articles, notes, presentations |
| JSON-LD | every page: Organization, Person, WebSite, Article | every page; adds BreadcrumbList, page types, CreativeWork, Event, VideoObject, SearchAction |
| Microformats | none | `h-entry` on 71 pages, `h-card` on home |
| Color schemes | light only | light and dark, system default, with a toggle |
| Service worker | precached 2.8 MB, including a 1 MB italic no tested page used | none registered (phase 8); `/serviceworker.js` is a kill switch that unregisters the old one |
| robots.txt | never served: its passthrough line in `.eleventy.js` was commented out | served, with facet combinations disallowed |
| Analytics | none | Plausible, 3 KB |
| Preview | none | SSR with visual editing at `preview.` |

---

## Loose ends, as of 2026-10-06

1. **Meta's crawler ignores the facet rule in robots.txt.** See the droplet section. A fix is being
   proposed in a separate session, and the decision is Andy's.
2. **A 191 KB React chunk ships to production, and no page references it.**
   `_astro/client.*.js` is the React client renderer that `@astrojs/react` registers. Readers never
   download it, so the cost is disk and deploy weight only. Not verified: it may be the
   unidentified ~60 KB the gated-import comment in `BaseLayout.astro` mentions, now grown.
   Registering the integration only in preview mode would likely drop it.
3. **"Learn more" is the only failing Lighthouse SEO audit**, capping six page types at 92. It is
   the Work With Me band's link to `/consulting/` in `WorkWithMeBand.astro`. WCAG accepts it in
   context, but search engines read the link text alone. Wording is a semantics call.
4. **The two accessibility details above:** the facet chip names and the rail heading level.

---

## How to re-measure

**The old site** has to be rebuilt. Its dependencies install from its own lockfile, and it reads
`production` without a token; the archived `.env` at
`~/Archives/afc/repo-local-2026-09-28/web/.env` supplies `ELEVENTY_ENVIRONMENT`.

```bash
git worktree add --detach ../afc-11ty 06cd8e5
cd ../afc-11ty/web && npm ci --legacy-peer-deps
NODE_ENV=production ELEVENTY_ENVIRONMENT=production npx @11ty/eleventy
```

The output lands in `_site/`. Note that `mailhandler.php` and the Composer `vendor/` were added by
CI, not by the build. Run `composer install --no-dev` against the old `composer.json` to measure
those. Remove the worktree with `git worktree remove --force ../afc-11ty`.

**The new site** is whatever release `/var/www/afc-production/html` points at:

```bash
rsync -a do:/var/www/afc-production/html/public/ ./afc-astro/
```

**Serving.** Serve both from the same static server with the same compression (brotli level 5 was
used here) and no caching, so the difference is the builds. In production Cloudflare compressed
both. Images come live from `cdn.sanity.io` either way.

**Lighthouse.** Three mobile runs and one desktop run per page. Block Plausible's event endpoint so
test loads are not counted:

```bash
npx lighthouse@12 <url> --only-categories=performance,accessibility,best-practices,seo \
  --blocked-url-patterns='*plausible.io/api/*' --output=json --output-path=<file>
```

**axe, the service worker, and scroll growth** came from headless system Chrome driven over CDP
with Node's built-in `WebSocket`, no puppeteer. Each page loaded in a fresh browser context,
scrolled to the bottom in viewport steps, then CacheStorage was read back and `axe.min.js` injected.
`Emulation.setEmulatedMedia` provided the dark pass.

**Code.** cloc reproduces the totals, and understands `.astro` and `.njk` natively:

```bash
npx cloc --not-match-f='(package-lock\.json|pnpm-lock\.yaml|composer\.lock|sanity\.types\.ts)$' \
  --exclude-dir=__design-specimens <tree>
```

The by-concern split came from a throwaway script, not kept. Its one trap: Prettier breaks a long
JSX comment in Astro markup into `{`, `/* … */` and `}` on separate lines, so a matcher looking for
`{/*` miscounts those comments as code. That alone was about 1,600 lines.

**Traffic.** Aggregate on the droplet, so visitor addresses never leave it. Fields split on `"`: the
request is field 2, status and bytes are field 3, and the user agent is field 6. A `nice -n 19` awk
over `zcat access.log.*.gz` and the two plain logs takes seconds.
