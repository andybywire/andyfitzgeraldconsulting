# The phase sequence

*Moved verbatim from CLAUDE.md on 2026-11-24, once every phase was closed: phases 0 to 8 of the
Astro rebuild, as CLAUDE.md recorded them while the work ran. What still governs work is
summarized in CLAUDE.md → Where the rebuild left things, which points back here for the
reasoning. Only the relative links were changed, to resolve from this folder.*

**Read it as a record, not instructions.** It was written in the present tense of each phase,
so "next", "pending" and "do not" mean what they meant on the date beside them. What is current
is CLAUDE.md, DESIGN.md, and the code.


Each phase is a branch, merged back once verified — off `next` through the cutover, off `main` since
(see Branching and verification). Do not run them in parallel.

0. **Repo scaffolding.** `web-next/` (Astro) and `studio-next/` alongside the existing `web/` and
   `studio/`. pnpm workspace, one root lockfile, **Node 24 everywhere** — Node 20 is EOL as of April
   2026, so the current CI pin is on an unsupported runtime. Settle the two-workflow deploy shape
   below and the data-fetching shape below before writing pages.
   *This could not reach `main` before cutover, while `main` still ran `npm ci` against the 11ty
   `web/package-lock.json`.*
1. **Studio on `production-26`.** New studio, current schema as the starting point, TypeGen wired.
   **Permalink *design* lands here and is recorded in
   [docs/urls-and-filtering.md](../urls-and-filtering.md)** — the URL surface, the addressing
   scheme, and what redirects to what. Writing the redirects is **phase 6**, with the nginx config:
   they are inert until there is a server to serve them, and the whole set is one rewrite rule plus
   a singleton rename. Deferred deliberately, not overlooked.
2. **Design tokens.** `variables.css` from DESIGN.md's front matter and the dark-mode table; global
   semantic role styles as **rules, not variables**. Font subsetting, preload, drop Open Sans, fix
   the `@font-face` syntax. **Theme switching ships with a toggle**, defaulting to system — see
   Theme switching below.
3. **Core layout.** Base layout, the 12-column grid, masthead, footer, the band system, the
   sibling-margin rhythm mechanism. The `<SanityImage>` component lands here (see Images).
4. **Page types, in order of structural leverage** — not arbitrary order:
   1. **Article / insight detail** — prose, measure, rhythm, blockquote, figure, rail. Where
      DESIGN.md is most specific and where the type system either works or does not.
   2. **Index pages** — cards, chips, pagination.
   3. **Home** — mostly composition of bands that already exist by then.
   4. The rest — services, projects, case study, reviews, presentations, search.
   5. **JSON-LD, across every template at once** — deliberately last, so the entity model is
      settled in one pass rather than five. **Built 2026-09-12**, in four pieces: the site
      graph (Organization, Person, WebSite), the Document branch, the Presentation branch,
      then breadcrumbs and page-level types. `web/src/lib/linked-data.ts` holds it and
      records the reasoning; `<BaseLayout>` takes a page's nodes as a prop so every page
      emits ONE `@graph` whose cross-references resolve. Validated by Andy.

      Three decisions worth not re-deriving. Topics and genre ride as plain `keywords` and
      `genre` strings rather than `DefinedTerm` nodes, because concepts are not addressable
      — `docs/urls-and-filtering.md` rules out per-topic pages, so a `DefinedTerm` `@id`
      would identify something the site does not publish. No `Review` nodes, though five
      case studies carry testimonials: a review of your own Organization is self-serving
      markup that Google ignores and can penalize. And a page gets a page-level node only
      where its type says more than `WebPage` does, which is why `/apologia`, `/consulting`
      and `/projects` carry none.

      **`WebSite.potentialAction` / `SearchAction` is BUILT** (2026-09-13, with search).
      It waited on search rather than on the JSON-LD work — it names the URL a site search
      accepts a query at — and shipped alongside it; `lib/linked-data.ts` emits it and the
      home page carries it. *This entry read "the one piece still missing" until
      2026-09-14, which was true when written and stale for a day.*

   **Presentations composes `BAND_GET_IN_TOUCH`, and that fragment has never been exercised.**
   The Presentations *singleton* will carry the Get in Touch band (Andy, 2026-09-07), and it is
   the first document outside `page` to do so — `page` resolves through the separate
   `PAGE_BAND_GET_IN_TOUCH`, with a different gate. So `BAND_GET_IN_TOUCH`'s three-rung ladder is
   hand-transcribed GROQ with no consumer and no query whose result type anyone has checked.
   **Probe that query when it lands**, with a known-good control, per the box in
   `web/src/sanity/fragments.ts`: a fragment that untypes its query fails silently and
   `astro check` stays green. This is exactly how the `LADDER` defect survived for weeks.

   **Search behavior is already specified** — see DESIGN.md → Components → Search. Phase 3 ships the
   masthead icon inert; the spec covers expand-in-place replacing the nav, results replacing the page
   content, Fuse.js, `cmd + k`, and the mobile treatment. Don't redesign it from scratch here.

   **Built 2026-09-13, and the engine is NOT Fuse.js.** The spec named it, and it turned out to match
   substrings rather than words — which broke multi-word queries outright: `design system` returned
   **0** results because Fuse matches a query as one contiguous pattern per field. Replaced with
   **MiniSearch**, which tokenises. The index reaches document headings and TF-IDF-extracted keywords,
   deliberately not the bodies themselves. **[docs/search-ranking.md](../search-ranking.md) is the
   explainer** — what is indexed, how TF-IDF chooses it, the measured costs, and the two GROQ traps
   this fell into. Read it before changing what search matches on.

   **Multiword terms came from the VOCABULARY, not from statistics** (2026-09-14). TF-IDF cannot
   surface a term of art: `tree testing` occurs 6 times across 5 documents and scores *below rank
   264* in a document about it, because the shared usage that makes a phrase a term is exactly what
   IDF penalises. Collocation scoring was built and measured and does not fix it either — ordinary
   English collocations score as strongly as real terminology, and no threshold or corpus statistic
   separates `little bit` from `mental models`. So the `bodyTerms` field matches prose against the
   **Topic and Genre schemes**, which makes termhood an editorial judgement. `tree testing` went
   0 → 5 results, `card sorting` 1 → 3, `information architecture` 10 → 23.

   **The consequence for you: adding a concept is now a search change.** A multiword term is
   invisible to search until it exists in a scheme — nothing is inferred. `web/scripts/
   phrase-candidates.mjs` is the hand-run generator that proposes candidates from the corpus into
   `docs/phrase-candidates.md`; it never feeds the build. Its last batch was folded into the Topic
   scheme and the file removed (2026-11-24), so it reappears only when the script is run again. Note also that
   `keywords.ts` now carries an `ALLOW` list so `ai`, `ia`, `ui` and `ux` survive the two-character
   floor — without it a "UX Research" concept could not be represented at all.

   The content model is iterated alongside, driven by what each page needs.
   `sanity-plugin-taxonomy-manager` is already installed.

   **Both SKOS vocabularies are now built** (2026-08-26), and the Genre scheme turned out to carry
   more structure than "a semantic type vocabulary" suggested — it has **two top concepts**, and they
   are the content model's own top-level division:

   ```
   Document                      Presentation
     ├─ Perspective                ├─ Keynote
     ├─ Method                     ├─ Talk
     ├─ Case Study                 ├─ Workshop
     ├─ Conference Themes          ├─ Panel
     └─ Note                       └─ Interview
          ├─ Web Clipping
          ├─ Book Note
          └─ Project Note
   ```

   *Updated 2026-11-21, against the dataset.* The diagram showed "Clipping", which was already
   labeled Web Clipping when the lab was copied on 10-22. Project Note joined on 11-02.

   Topic is a separate scheme, **rebuilt in the recommendations research and live since stream 1**
   (2026-11-21). It has 75 concepts under **seven top concepts**, up to four levels deep:
   Engineering Practices, Design Practices, Design Approaches, Project Management, Engineering
   Tools, Outcomes and Human Factors. It replaced a 3-level scheme under Engineering / Design /
   Discovery / Strategy. `docs/urls-and-filtering.md` filters on **direct tags only** — no ancestor
   roll-up. Content is tagged at leaf and mid level and **never at a top concept**, verified, and
   verified again for stream 1's tags. That is what keeps that rule from producing a "Design" chip
   that competes with an "Information Architecture" one.

   **A consistency invariant falls out of the Genre hierarchy, and it is worth a build-time check:**
   a document's genre should sit under the top concept matching its structural family — a document
   stored as `article` should not carry a Presentation-branch genre.

   **RESOLVED (verified 2026-09-09).** Four documents violated this while `presentation` did not
   exist — three Interviews and one Talk, all stored as `article` — and the Insights index
   over-collected by that many. No article carries a Presentation-branch genre now: the only genres
   in use there are Perspective, Method and Conference Themes. The corpus stood at 42 insights
   (30 articles, 5 notes, 7 case studies), 4 presentations and 41 events.

   **Re-measured 2026-10-10: 42 insights, 29 presentations, 39 events — and only ONE event is
   unattached.** The modeling work this paragraph used to call outstanding is essentially done:
   on 2026-09-14 it read 10 presentations, 47 events, and 35 events referenced by no
   presentation. The one left is `03c2f5ff-19ce-4660-9761-ab618acff345`, "Structured Content",
   dated 2022-05-25. Events render no page of their own, so an unattached one is invisible rather
   than broken. Expect these numbers to move again; re-measure rather than quoting them.

   The invariant is checked, but not gated: `pnpm parity` tests it as its Check 4, walking
   `broader` rather than trusting hard-coded ids, and the Studio will still accept a Presentation
   genre on an `article`. Parity is run by hand, so a violation surfaces the next time someone
   runs it.

   ### The five content types, and what separates them

   | Type | What it is | Layout |
   |---|---|---|
   | `singleton` | CMS-governed content with a **unique** layout | bespoke per page |
   | `page` | website-**generic** scaffolding | one repeatable template |
   | `article` / `caseStudy` / `note` | the Document branch — what gets published | detail templates |
   | `presentation` | the Presentation branch — a delivered work | detail template |
   | `event` | one **delivery occasion** of a presentation | no page of its own |

   **Singletons:** Home, Insights, Reviews, Presentations (index).

   **Pages:** About, Apologia, Projects, Consulting, Contact.

   > **Corrected 2026-09-14, against the dataset.** This read "Singletons: … Contact" and
   > "Pages: About, **Colophon**, …". Neither matched: **Contact is a `page`**, not a
   > singleton, and **no colophon document exists**. Four singletons, five pages. Contact
   > moving to `page` is consistent with the disqualifier — it carries no Topic or Genre
   > and never appears in a listing — so the type is right and only this list was wrong.
   > A colophon would be a `page` when it is written. `page` is a repeatable main content
   field, a responsive right rail, and a few below-content bands (provisionally just "Get in Touch").

   > **`page` means generic to the medium "website", not generic in the Genre sense.** A contact page,
   > a colophon, an About page — the bureaucratic furniture a website is expected to have. The
   > **disqualifier is testable: a `page` carries no Topic or Genre concepts and never appears in
   > article listings.** Anything that wants either belongs in the Document branch instead.

   That is deliberately page-based thinking, and it is not in tension with the argument in *Content
   Modeling in the Age of Flying Cars* — it is the other half of it. Medium-*independent* content is
   modeled by Topic and Genre; medium-*dependent* scaffolding is what `page` is for. The risk is
   drift, not the type: `page` must not become where things land that should have been modeled.

   **Consulting is a `page` for now and will likely become a singleton** — an index drawing together
   positions, methods and case studies per service. `page` buys room to work out the positioning
   first. The 4 orphan `service` documents (Structured Content Design, Information Architecture,
   Content Strategy, Knowledge Graph Engineering) were the obvious content for that. **Phase 7
   deleted them from `production-26`, and all four survive in the export of the old `production`
   dataset** at `~/Archives/afc/2022-production-dataset-2026-10-22/production.tar.gz` (the dataset
   itself was deleted 2026-10-22). Read them there when Consulting's positioning is worked out:
   `data.ndjson` inside the tarball, `_type == "service"`.

   **`note` is ONE type, and the vocabulary decided that** — Note is a *branch* with Clipping and Book
   Note beneath it, so `genre` discriminates the three. Built 2026-08-26 with two optional objects
   rather than one polymorphic source: `clipRef` (url, publisher, title, image) and `bookRef` (url,
   title, author, image, publisher, pubDate). Validation to stop a Clipping carrying Book Note fields
   is deferred; **assume the types are consistent for now.** Three sample documents exist, one per
   variant, kept thin so the shape can still move.

   **`presentation` inverts `event`.** `event` records a date and location at which Andy spoke, with
   the talk title subordinate; `presentation` makes the delivered work the organizing principle — one
   presentation, many deliveries — and carries a description, takeaways, an optional deck link, and
   the events at which it was given. **This is why interviews are Presentations rather than
   Insights.** The 41 existing `event` documents are deliveries, so they group under a smaller set
   of presentations; none carries a `genre`, which is now deliberate — `event.type` was deprecated
   in favour of `presentation.genre` and the label a page shows comes from the work, not the
   occasion.

   **Recordings and transcripts are built** (2026-09-08), not a later iteration. `transcript` is
   Portable Text on `presentation`; recordings are a `recording[]` array on `event`, because a
   recording is a property of a DELIVERY — one talk given three times can have three. One object
   covers audio and video, with `kind` selecting the section heading, the player and the JSON-LD
   type; see `studio/schemas/objects/recording.ts`, which also records the poster ladder and
   the GROQ trap under it.
5. **Content parity check.** Render every document of every type; catch dangling references and
   fields that silently stopped rendering.

   **One content gap to fix here, enumerable rather than vague:**
   - **Hero `altText`: NONE MISSING. Question closed** (2026-09-14). This carried an
     enumerated list of 13 slugs, measured 2026-09-09, and before that "16 of 42" from
     2026-08-26. Re-measured against `production-26`: **37 of 37 heroes carry `altText`**,
     none empty-string, and **0 body figures** lack one. Andy wrote them.

     *Kept as a record because the reason it mattered is still live and is easy to forget:
     php-mf2 returns `u-photo` as `{value, alt}`, so hero alt text travels into every
     syndicated copy — verified against a real parse. It cost twice, not once. Note also
     that part of the earlier shrinkage was not alt-text work at all: three slugs left the
     list by leaving the article corpus, when the mis-typed presentations were re-typed.*

     *Heroes reached the Atom feeds on 2026-10-02 (Andy): an article entry opens with its
     hero and a presentation entry with its poster, both cropped to 16:9 by their
     hotspots. See docs/astro-migration/feeds-kickoff.md → Settled: heroes and posters lead
     the entry.*

   - **`h5` residue: NONE. Question closed** (2026-09-09). Phase 1 dropped the style from `article`,
     `caseStudy` and `singleton`, and dropping it from a schema does not remove it from published
     blocks — so this was carried as unverified. The query has now been run against `production-26`:
     zero documents of those three types carry an `h5` block. Nothing renders unstyled, and nothing
     needs doing at the parity check.

   - A couple to-dos that are emerging as I complete content work that we should take care of before cut-over:
    - ~~Add an a11y "skip" link for keyboard nav.~~ **DONE 2026-09-17.** In `<BaseLayout>` so no
      page can forget it, first in `<body>`, with `id="main"` + `tabindex="-1"` on all ten `<main>`
      elements — without the tabindex a fragment moves the scroll position but not keyboard focus,
      so the link looks like it works and puts you back in the nav. `specimen.astro` had no `main`
      landmark at all and gained one.
    - ~~Add a "copy to clipboard" icon to RSS feed links.~~ **DEFERRED 2026-09-17 to
      [issue #4](https://github.com/andybywire/andyfitzgeraldconsulting/issues/4)** — the repo's
      first, and the pattern for post-launch work that is specified but not launch critical.
      Andy's call, on the grounds that it has a single consumer and nothing is broken. The issue
      carries the whole spec: a `rssFeedLink` PTE block type on `page.bodyText`, why a block type
      beat a serializer rule on the existing `link` mark, and three things that would ship broken
      (absolutize from `Astro.site` not `location.origin`; `navigator.clipboard` is undefined on a
      plain-http LAN address; gate the control on `html.js`). **No query change is needed** —
      `queries/pages.ts` projects `bodyText` bare.
    - ~~Investigate wiring the altText authored (and used) in Studio to the asset alt text~~
      **INVESTIGATED AND CLOSED 2026-09-17 — no front-end change needed.** The
      `assetAlt ?? altText ?? ''` ladder already exists in `PRESENTATION_SLIDES_QUERY` and
      `SlideDeck.astro`, so asset-level alt is *already* preferred wherever it is set. Three
      findings worth not re-deriving:

      **The Media Library is not readable from the build.** An ML-backed image carries BOTH a
      normal `asset` reference and a weak `media` global reference. `asset->originalFilename`
      resolves; **`media->` resolves to `null`**. So alt text authored on a Media Library asset
      cannot be read by any dataset query — measured, not assumed. `sanity.imageAsset.altText`
      is the only asset-level field the build can see, and exactly 1 of 979 assets carries it,
      left behind by the old `sanity-plugin-media` rather than authored in this Studio.

      **Reuse is what would justify the move, and there is almost none.** 937 image-object
      usages across 885 distinct assets; 52 assets used twice; **only 4 across more than one
      document**. "Author once, applies everywhere" buys four documents today. 31 reused assets
      disagree between usages, and two of those are genuine rewordings — the orthodox argument
      for keeping alt contextual, in miniature.

      **Slides are the real case, and Andy's call (2026-09-17) is that they should carry alt
      eventually — as its own project.** The 647 usages with no object-level alt are exactly the
      slide count; `SlideDeck` renders them decorative. Per-usage authoring at that volume is
      impractical, which is the one place asset-level alt would earn its keep.

      *Two alarms raised during this investigation were measurement error, not defects: a
      dark-mode contrast "failure" that was an artifact of flipping `data-theme` in JS (it is
      6.17:1 loaded properly), and "883 images with no alt attribute" — Astro serializes
      `alt=""` as the bare `alt` attribute, which is valid HTML5 and identical semantically.
      Real counts: 883 correctly decorative, 298 descriptive, **0 genuinely missing**.*

6. **Cutover.** Rewrite CI for pnpm, Node 24 and the new build directory. **`mailhandler.php` must
   survive** — it stays PHP on the droplet, but becomes a backend endpoint called from JS rather
   than a form target with its own display pages, since mail forms now appear on several pages.
   Carry the Composer step into the new workflow. nginx, the 301 map, staging deploy. Then rename
   `web-next` → `web` and `studio-next` → `studio`, archiving the old alongside `__web_2022`.

   **THE CUTOVER IS DONE (2026-09-28).** The apex serves the Astro build from
   `/var/www/afc-production`, www 301s to it, and the 11ty site is retired — its release untouched
   at `/var/www/afc` as the rollback target, its nginx config unlinked but kept in
   `sites-available/`. Verified: all eight `deploy.sh` smoke checks; the 301 map 93/93 through
   Cloudflare and at the origin; real_ip logging visitors' own addresses; both certificates renewing
   by webroot; a real contact-form send; the Sanity webhook dispatching production builds for the
   first time since 2026-08-14. What each check was, and the rollback, live in `nginx/` beside the
   config they test.

   **How the two generations compare is
   [docs/astro-migration/eleventy-astro-comparison.md](eleventy-astro-comparison.md)**
   (measured 2026-10-06): code, page weight, droplet resources and accessibility, and how to rebuild
   the old site to measure it again. Start there before quoting any before-and-after figure. The
   11ty release no longer exists on the droplet, so its numbers can only come from a rebuild.

   **THE SSR PREVIEW IS DONE (2026-09-29), AND WITH IT PHASE 6.** `preview.` is Astro's SSR build
   behind an nginx proxy, and visual editing works end to end from the deployed Studio: overlays,
   click-through to the document, reload on edit, navigation sync. The plan and what was measured
   along the way are
   [docs/astro-migration/ssr-preview-kickoff.md](ssr-preview-kickoff.md);
   where it departed from ux-methods, and which departures apply back, is
   [docs/ux-methods-notes.md](../ux-methods-notes.md). Five departures from that plan, each decided
   with Andy and recorded beside the code it shaped:

   - **No `node_modules` on the droplet.** `pnpm deploy --prod` measured 590 MB a release; the server
     imports six packages, now bundled into `dist/server` (`bundleServerDependencies` in
     `astro.config.mjs`). The droplet needs Node and nothing else.
   - **A systemd user unit, not PM2** (`web/afc-preview.service`), after ux-methods' five weeks of
     silent 502s. Node is NodeSource's system package at `/usr/bin/node`, not nvm.
   - **Preview's contact form runs production's PHP** (`$afc_php` in `nginx/afc.conf`), so the preview
     release carries no PHP and no Gmail secrets.
   - **No basic auth.** Presentation's frame cannot authenticate against it — tested, not assumed.
     `noindex` is now carried twice (header and meta, both checked by `deploy.sh`), and a per-address
     render limit bounds what bots cost. **Drafts on preview are readable by anyone who finds the
     host**, by Andy's call.
   - **Memory limits from the droplet:** 148 MiB peak over every sitemap page, so `MemoryHigh=200M`
     and `MemoryMax=256M` — read back from the running unit after the deploy that installed them
     (`209715200` / `268435456`). Sized on Linux deliberately: macOS RSS for the same sweep read 180–370 MB
     across runs, and a claim made from one macOS pair — that `NODE_ENV=production` halved memory —
     had to be retracted the same day. See docs/ux-methods-notes.md.

   Found on the way and fixed in production too: `ls -t` pruning could delete the live release,
   because `tar` stamps a release with its artifact's build time. Now pruned by name.

   **A reboot was the one thing not exercised here**, and it was moved to phase 7 with the pending
   kernel and package upgrades that made it worth doing (Andy, 2026-09-29). **Exercised 2026-10-08
   and passed:** `afc-preview` came up on its own, 14 seconds after boot. See phase 7.

   Open follow-ups, none blocking: ~~delete `/var/www/afc` (~630 MB) once the rollback window
   closes~~ **DONE: already gone when checked on 2026-10-06**, so rolling back to 11ty now means
   rebuilding `06cd8e5`; ~~retitle or undeploy the old `af-consulting` Studio app~~ **DONE: the
   project's only Studio app is now `g1jo20nnopb0mtoyt45zqakx`**; ~~delete the `RECAPTCHA_SECRET`,
   `AFC_MAIL_USERNAME` and `AFC_MAIL_PASSWORD` GitHub secrets~~ **DONE: none of the three is listed,
   and every secret that remains is referenced by a workflow.** Both checked 2026-10-08, which
   leaves **nothing from phase 6 outstanding** — the reboot test, moved to phase 7, passed the
   same day.

   `cms.` was repointed at the new Studio on 2026-09-29 — for `/` only, and **left that way**
   (Andy): it is a convenience alias nobody links to, so deeper paths returning 522 is accepted
   rather than fixed. Its redirect is a 302, not a 301, so the next time the Studio moves, browsers
   follow at once instead of a cached answer.

   **The rename is DONE (2026-09-28), and the archiving changed on the way.** The old pair left the
   tree rather than moving within it (Andy's call: git history keeps them, last at `06cd8e5`), and
   `__web_2022` turned out never to have been tracked — see Stack and layout for where it, and the
   rest of the untracked material, went. The four upstream font files `subset-fonts.sh` reads were
   the one live dependency on the old tree; they moved to `web/scripts/font-sources/`, and the
   script was shown to regenerate the committed fonts byte-identical from there.

   **Fonts can take `immutable`.** An earlier note here warned they could not, because they shipped
   from `public/` at unhashed URLs. They now go through Astro's Fonts API from
   `web/src/assets/fonts/` and are emitted hashed into `_astro/fonts/`, so
   `max-age=31536000, immutable` is safe for that directory alongside the rest of `_astro/`.

   **`/search.json` CANNOT, and that is the other half of the same rule** (decided 2026-09-13). It
   is a route, not an asset, so Astro never hashes it and its filename is stable forever. Give it
   `ETag`/`Last-Modified` revalidation instead — one 304 per session, no re-download — and **not**
   a long `max-age`, which would strand a visitor on a stale index until it expired. At 18.5 KB
   gzipped that is entirely adequate.

   Andy chose the stable URL over a hashed one deliberately: it is guessable and inspectable, which
   is worth something on a site that publishes a colophon, and the hashed alternative would mean
   injecting the path at build time because `scripts/search.ts` cannot know a hash. **Revisit only
   if the index grows** — a content-hashed name is what would make a full-text index (134 KB
   gzipped, measured) affordable, and nothing else about that decision has changed.
7. **Cleanup.** Deliberately after the site is live, so none of it can destabilize a launch, and
   before phase 8, so per-taxonomy feeds are built against the final vocabulary rather than one
   still carrying deprecated schemes. Nothing here blocks earlier phases — verified, not assumed.

   **PHASE 7 IS DONE (2026-10-08)**: every item below is closed, and phase 8 is next.

   - ~~**Remove the deprecated `insightType` field** from `article` and `caseStudy`, and unset the
     data~~ **DONE** — the field in `854962c` and `5385867`, the data on 2026-10-08. `genre`
     replaced it in phase 1 and both fields referenced the same concepts.
   - ~~**Retire the two deprecated schemes**~~ **DONE.** Only Genre (12 concepts) and Topic (55)
     remain, and no concept sits outside a scheme (verified 2026-10-08).
   - ~~**Resolve the orphan types**, `service` (4 documents) and `collection` (2)~~ **DONE: deleted,
     not adopted** — though the export of the old `production` dataset still has both; see
     Consulting under phase 4. **A third orphan turned up while checking:** `media.tag`, one "banner" tag left by the
     old `sanity-plugin-media`, weakly referenced by 8 old 5088×800 banner assets that no document
     used. Tag and assets were deleted on 2026-10-08.
   - ~~**Shrink `hiddenDocTypes`**~~ **DONE** — down to `sanity.videoAsset`, a workaround for a
     Sanity bug, and the three types the structure places by hand. **The orphan entries had never
     done anything:** the structure tool lists only types the schema declares, so an orphan is
     invisible without the list rather than hidden by it. `sanity.config.ts` records the detail.

   **What these four taught: removing a field from the schema leaves its data in place** — the h5
   lesson under Known debt again, for fields rather than block styles. When the schema changes had
   shipped, `insightType` was still set on 10 documents and `heroImage.adjBright`, removed in the
   same pass, on 12; `sanity.types.ts` still declared all seven removed fields, because typegen
   had not been re-run. So **a field removal is three steps**: the schema, an `unset` on published
   documents AND drafts, and `pnpm typegen`. The pass's other removals — event `title` and `type`,
   `podcastId` — had no data to unset, which was checked rather than assumed.

   *How the unset ran, for next time:* the Sanity MCP patch tool writes drafts only, so on a
   published document it is patch then publish, and each publish fires the deploy webhook. 16
   publishes produced 15 superseded builds and one deploy — the concurrency brake in
   `deploy-astro.yml` doing its job.
   - ~~**Upgrade the droplet and reboot it, deliberately**~~ **DONE 2026-10-08, and everything came
     back at boot with nobody touching it.** It was waiting on pending kernel and package upgrades,
     and on the one part of the SSR preview never exercised: **coming back at boot unattended.** The
     unit was enabled and `afc` lingered, which should have been enough; ux-methods' five weeks of
     502s are why "should" was not accepted. What the window found, measured rather than expected:

     - **The droplet had been up 45 weeks**, so this was the first cold start since the cutover for
       everything on it, not only the preview.
     - **71 upgrades, and a newer kernel than recorded.** 6.8.0-146 had landed since 142 was noted,
       and 146 is what booted. `apt autoremove` then took 6.8.0-71 and kept 142 as the boot
       fallback. `open-iscsi` and `libopeniscsiusr` were deferred by Ubuntu's phased rollout and
       will arrive with a later upgrade. The only modified config file among the upgrades was
       `/etc/default/motd-news`.
     - **After the reboot,** nginx, php8.3-fpm, certbot.timer, do-agent and pm2-uxm were all
       `active`, with no failed units. `afc-preview` was active 14 seconds after boot, on
       `/usr/bin/node`. All four hosts returned 200 from outside the droplet —
       **`preview.uxmethods.org` included, passing its first real boot test** (its PM2 unit had
       only been proven with `pm2 kill`) — and `nginx/deploy.sh` passed 9/9.
     - **Disk went from 77% to 64% used** (2.1 → 3.2 GB free), from the swap shrink and the old
       kernel.

     **For the next reboot, check before touching anything**, since a deploy restarts the very
     things being tested. As root on the droplet:

     ```bash
     uname -r
     systemctl is-active nginx php8.3-fpm certbot.timer do-agent pm2-uxm
     systemctl --failed --no-legend
     sudo -iu afc XDG_RUNTIME_DIR=/run/user/1001 systemctl --user status afc-preview --no-pager | head -5
     readlink /proc/$(sudo -iu afc XDG_RUNTIME_DIR=/run/user/1001 systemctl --user show -p MainPID --value afc-preview)/exe
     swapon --show
     ```

     Expect `active` five times — `do-agent` is DigitalOcean's metrics agent, installed 2026-10-02
     because the disk and memory alerts need it, measured at 12.5 MB; no failed units; the unit
     active since boot; `/usr/bin/node`. Then **from the Mac**, since the script SSHes in itself,
     `AFC_SSH=do nginx/deploy.sh`; it reinstalls identical config, which is harmless. Curl the four
     hosts from the Mac too: from the droplet, a request to its own non-Cloudflare names never
     leaves the box, so it cannot show that anyone else can get in.

     ~~**Shrink swap from 2 GB to 1 GB in the same window**~~ **DONE, and the recorded recipe was
     wrong.** `/swapfile` was 2 GB with ~250 MB in use. **Not by `swapoff` first:** that pulls the
     swapped pages back into RAM, and with ~245 MB available on a 458 MB droplet it can wake the OOM
     killer — so the new swap comes up before the old goes down. The recipe recorded here ended
     `mv /swapfile.new /swapfile`, and **that fails with "Operation not permitted"**: the kernel
     refuses to rename or delete a file while it is active swap, the same protection that let
     `rm /swapfile` succeed only after its `swapoff`. Because the new file must end up with the old
     one's name, it goes through a temporary name and the swap-to-swap move happens twice:

     ```bash
     fallocate -l 1G /swapfile.new && chmod 600 /swapfile.new && mkswap /swapfile.new && swapon /swapfile.new
     swapoff /swapfile && rm /swapfile
     fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
     swapoff /swapfile.new && rm /swapfile.new
     ```

     Run `swapon --show` between lines, and `swapoff` a file only once the other is listed. **Do not
     reboot partway through:** between the second and third lines, `/etc/fstab` names a file that
     does not exist. And "pages move swap to swap" was only half true. `swapoff` reads pages back
     into RAM and some stayed there (148 MB in use fell to 79), which ~175 MB available absorbed
     easily.

     **The journal is capped at 100 MB, on the droplet rather than in the repo** (2026-10-02). It
     had reached 332 MB with the disk at 85%; `/etc/systemd/journald.conf.d/size.conf` sets
     `SystemMaxUse=100M`, and the file carries its own comment. Nothing to do in the window — this
     line is the record that it exists, the way the systemd unit's record is the unit file itself.
   - **The serializer specimen is GONE, and this item is closed** (verified 2026-09-14).
     `specimen-serializers` on `production-26`, at `/insights/serializer-specimen/`, was a
     phase 4 test fixture holding one instance of every block style, inline mark, list shape
     and custom block the serializers handle. It was **published** deliberately — the static
     build reads the `published` perspective, so a draft would not have rendered — which made
     it indexable and meant it would otherwise have gone live. No document matching it now
     exists, published or draft.

     *Kept as a record because the trade it named is still open: there is now no fixture where
     a serializer regression can be SEEN. If one is wanted again, the note said to make it
     something that is not content, or to exclude it from the index, the sitemap and the feed —
     and the feeds are a fourth place it would have leaked into.*

8. **Quality gates + POSSE.** Performance budgets, accessibility checks, link checking, HTML
   validation; per-taxonomy RSS feeds; **POSSE** (https://indieweb.org/POSSE) syndication to
   LinkedIn, Bluesky, Mastodon. "Automated quality gates" is Andy's preferred framing over "TDD."

   **PHASE 8 IS DONE (2026-10-10)**: the quality gates are built, the external link check last;
   per-concept feeds were evaluated and set aside; the service worker was declined; and POSSE
   is deferred to `docs/future-work/`. Each is recorded below.

   **"per-taxonomy RSS feeds" means feeds per CONCEPT — EVALUATED, NOT BUILT (Andy,
   2026-10-09).** There is no user warrant for them yet; build them if one emerges. The
   measurements and a ready recommendation are in docs/astro-migration/feeds-kickoff.md →
   *Per-concept feeds*, so a revisit starts there rather than from scratch. Five feeds shipped 2026-09-13 —
   `/feed.xml`, `/insights/feed.xml`, `/insights/feed-articles.xml`,
   `/insights/feed-notes.xml`, `/presentations/feed.xml` — and those are section and type
   feeds, not taxonomy ones. `RssBand`'s `buttonTarget` is content precisely so a page can
   point at a per-taxonomy feed without a code change if they arrive. See
   [docs/astro-migration/feeds-kickoff.md](feeds-kickoff.md), which also
   carries two live carry-forwards: nginx must serve the feeds as `application/atom+xml`, and the YouTube
   embed loads a player on view where the page uses click-to-load.

   **THE CODE GATES ARE BUILT (2026-10-08)**, and with them the **TypeGen drift check** this
   entry used to anticipate. `.github/workflows/checks.yml` runs four on a push to any branch:
   TypeGen drift, `astro check`, the Studio's `tsc` and Prettier. **Phase 8 splits the gates in
   two, and the split decides where each one runs** (Andy, 2026-10-08):

   - **Code gates test the repository**, so no content publish can change a result. They never
     run on `repository_dispatch`, and **neither deploy waits for them**: a failure marks the
     commit red, on the branch before a merge. `astro check` alone also blocks inside both
     deploys, as it did before this phase — it is the one that can catch a defect that ships.
   - **Site gates test the BUILT site** — links, HTML validation, accessibility, budgets — and
     content is exactly what breaks them: an author's dead link, a missing alt. They run in two
     places: `checks.yml` builds the site on a branch push, so a template regression is red
     before the merge, and `deploy-astro.yml` checks the release it ships. **There they run
     BESIDE the deploy and never hold it** (Andy, 2026-10-08): a failure turns the run red once
     the site is live. Production rebuilds on every Sanity publish, and the deciding case is an
     **unpublish** — a blocking check would keep a withdrawn article live until every link to it
     was fixed. Do not add a site gate to the deploy job's `needs:`.

   The workflow's header records the reasoning, the gap it accepts (a merge commit is a tree no
   branch run has seen), and how each gate was proven: a clean-tree run with zero TypeGen diff
   on the runner, then one deliberate violation per gate, all four red in a single run. **The
   drift check keys on `git diff --exit-code`, not on typegen**, whose exit status is 0 even when
   it reports errors. Prove any new gate the same way — it is not known to work until it fails.

   **THE LINK CHECK IS BUILT (2026-10-08)**, the first site gate: `web/scripts/check-links.mjs`,
   run with `pnpm links` after a build. It reads the built site with no network and no
   dependencies, and fails on four kinds of on-site link: **no page** at the path (old paths
   like `/writing/` included), **no trailing slash**, an **absolute href to the site's own
   domain** (apex, `www.` or `preview.`), and a **fragment with no matching `id`**. All four
   stood at zero across 84 pages and 2,849 links, so it started green. Its header records what
   it deliberately does not check, why it uses patterns rather than an HTML parser and what
   that misses, and how it was proven.

   This closes the **trailing-slash and own-domain items** deferred here on 2026-10-02 — Learn
   more's `/consulting` and the home hero's `/about` drifted, and Moz found 45 own-domain hrefs
   in article bodies, all fixed by hand with nothing to stop the next. **`trailingSlash:
   'always'` was passed over**: it catches template links only, only in the dev server, and only
   when someone follows one, where the link check also reads article bodies.

   **External links were split off into their own check**, because another site's outage is not
   a defect here, and checking them well needs retries, rate limits and a tool built for it.
   That check is built; see THE EXTERNAL LINK CHECK below.

   **HTML VALIDATION IS BUILT (2026-10-08)**, the second site gate:
   `web/scripts/validate-html.mjs`, run with `pnpm validate` after a build. It runs the **W3C Nu
   Html Checker** (`vnu-jar`, pinned exactly) and fails on any error, where it runs and on the
   same terms as the link check. Its header records the reasoning; four points are worth not
   re-deriving:

   - **The Nu checker over html-validate**, measured over the same 84 pages: the reference found
     all four real defects and html-validate two, under ~1,800 findings that were template
     skeletons, Shiki's inline styles and its own opinions. html-validate's real extras — a
     `<fieldset>` with no `<legend>`, unnamed `<nav>` landmarks — looked like accessibility
     findings and were left for that gate. **It found neither, because neither was real**: the
     theme toggle's fieldset is named by `aria-label`, and the `<nav>` was inside an inert
     `<template>`.
   - **It does not check CSS.** Every `CSS:` message is filtered: the Nu checker's CSS checker
     does not know `@container style()` or `container-type`, which were 543 of its 565 errors.
     Warnings are off too — almost all deliberate `role="list"` and `aria-disabled`.
   - **A skipped heading level fails** (Andy, 2026-10-08). That is what moved the rail headings
     — "On This Page", "Topics" — from h3 to h2; see `RailNav.astro`, which records why an
     `<aside>` never kept their level out of the page's structure. A **duplicate id** fails too,
     which is where `headingId.ts` said one would surface. Both can come from content.
   - **`vnu-jar`'s postinstall is not allowed** (`pnpm-workspace.yaml`): it would download a
     Java 17 runtime on a machine without Java. Java is supplied instead.

   It started RED, on content alone: two articles whose bodies open with an h3
   (`designing-with-code`, `language-meaning-user-experience-architecture`), and four
   "How Does it Scale?" h3s in `structured-content-design-22`. The code defects it found — `<p>`
   inside the home h1, unencoded spaces in the deck download URL, and the rail levels — were
   fixed alongside it.

   **ACCESSIBILITY IS BUILT (2026-10-08)**, the third site gate: `web/scripts/check-a11y.mjs`,
   run with `pnpm a11y` after a build. It loads every page in headless Chrome over the DevTools
   protocol and runs **axe-core** — pinned exactly, and the only new dependency: no Playwright,
   no downloaded browser — failing on any of axe's default rules, which are WCAG 2.0–2.2 at A and
   AA plus best practice. Its header records the reasoning; what is worth not re-deriving:

   - **Five configurations**: desktop in light, OS dark and toggle dark — the three CSS blocks a
     token can be wrong in — and phone in light and dark. Every page is checked to have reached
     the theme it claims, so a configuration cannot pass by scanning the wrong one.
   - **Reduced motion is on, and it waits for animations to finish.** Without that, 1 run in 10
     caught links partway through base.css's 0.15s color transition and reported a contrast
     failure in colors that were no token. A harness artifact: a real page load starts none.
   - **Test an accessibility fix inside the real page, not in a bare test file.** axe passed the
     close-search button's failing name in isolation and failed it in `/search/`, with the
     page's own CSS applied.
   - **A pass is a floor.** Automated checks find roughly a third of WCAG failures. Keyboard use,
     focus order, what a screen reader announces, whether alt text is any good, and interactive
     states — search open, the mobile menu expanded — are not tested at all.

   It found two real failures, both WCAG 2.5.3, Label in Name. The **facet chips** read
   "Structured Content11", because Astro's HTML compression dropped the whitespace between two
   spans — not the comma that `docs/astro-migration/eleventy-astro-comparison.md` had blamed.
   And the **close-search button**, whose visible text is "esc", is now named "Close search,
   esc", for voice-control users who say what they see. The check takes about 125s on the runner
   against 45s on a Mac, the slowest gate by far; beside the deploy, that delays only the report.

   **BYTE BUDGETS ARE BUILT (2026-10-09)**, the fourth site gate, and with them **the quality
   gates are complete**: `web/scripts/check-budgets.mjs`, run with `pnpm budgets` after a build.
   It weighs the build in brotli-compressed bytes against six budgets, and **the numbers live in
   the script** (Andy, 2026-10-09) — a value with one consumer is not a token, and the reason for
   each sits beside it. Its header records the reasoning; what is worth not re-deriving:

   - **Bytes, not timings or scores** (Andy, 2026-10-09). Bytes are deterministic — the runner and
     a Mac measured identically, to the tenth of a KB. LCP sat at 1.8–2.4s against Google's 2.5s
     line, so a timing gate would fail at random, and a Lighthouse score does not say what got
     worse. Timings are still measured by hand; docs/astro-migration/eleventy-astro-comparison.md
     says how.
   - **HTML has two budgets**, because its size follows what was written: the **median** page,
     which moves only when the template grows on every page, and a generous **ceiling** on the
     heaviest, for the pathological. One budget on the heaviest page would fail on long writing.
   - **The rest:** CSS and JavaScript on the heaviest page — scripts followed through their
     imports — fonts site-wide, and `/search.json`. The fonts budget is deliberately tight, since
     fonts were 96% of the old site's weight; the search index budget is the point at which the
     decision about its stable filename says to revisit.
   - **Not weighed: images** — served from Sanity's CDN at runtime, and what grows most as a page
     is scrolled — **nor Plausible, nor files no page loads**, like the 191 KB React chunk.
   - **Content can trip two of them**, the search index and the HTML ceiling, after a publish.
     Like every site gate, this never holds a deploy, so red there means "revisit". Set each
     budget at today's measurement plus headroom, lower it when the site gets lighter, and raise
     one only on purpose, in a commit that says why.

   **THE EXTERNAL LINK CHECK IS BUILT (2026-10-10)**, the last phase 8 item:
   `.github/workflows/external-links.yml`, or `pnpm external-links` after a build. **lychee
   collects and `web/scripts/check-external-links.mjs` judges**, configured by a commented
   `web/lychee.toml`. The three files' headers record the reasoning; what is worth not
   re-deriving:

   - **It is the one gate outside `checks.yml` and the deploy** (Andy, 2026-10-09): monthly, at
     15:00 UTC on the 1st, on demand, and on a push that changes the check — never on a deploy, a
     branch build or a publish. An external link breaks because something changed THERE, and
     repeating ~290 requests to other people's sites on every publish would learn nothing.
     **The repo is public, so GitHub disables the schedule after 60 days without a commit** —
     `gh workflow enable external-links.yml` turns it back on — **and a scheduled run's failure
     email goes to whoever last edited the cron line.**
   - **Only the clearly broken fail**: a 404, a 410, a host that does not resolve. Blocked, TLS,
     redirect and server failures are listed to check by hand. They do not repeat from run to
     run, so a gate on them would fail at random — and lychee's `accept` list could only make
     them red or invisible, which is why lychee does not judge.
   - **The report names the Sanity document that holds each URL, with a Studio link**, as well
     as the pages that show it (Andy, 2026-10-10). A Sanity scheduled Function was weighed as
     the place to run the check and declined: it would swap lychee for a hand-written checker,
     lose the failure email and miss links that live in code, to gain what the Studio links
     already give. Writing results into the dataset waits for a warrant, and would be a
     content-model decision. Search Console and Moz were ruled out first: neither reports
     outbound links.
   - **LinkedIn is excluded** (Andy, 2026-10-10): it answered every request 999 once it noticed
     us, which says nothing about a profile. It is listed as "not checked", as is every
     exclusion except this site's own and Sanity's CDN, so an exclusion never hides a link.
   - **Three lychee 0.24.2 traps the classifier handles**: a host that does not resolve reads
     exactly like a firewall refusal, so it does its own DNS lookup; a URL's repeats read
     "Error (cached)" and lose detail, so it judges per URL; and a run that checked nothing
     exits 0, so the classifier exits 2.

   It started RED on the runner, on 15 real broken links — 13 404s and two dead hosts — and went
   green on a re-run once Andy had fixed them in the Studio. A run requests **323 distinct URLs
   on 135 hosts**, not the ~800 the kickoff estimated: lychee requests each URL once, however
   many pages carry it. GitHub answers some requests 503 — its notebook pages most of all, with
   the workflow's token or without — so a broken GitHub link can sit under "other" for a run
   before it shows as broken.

   **POSSE IS DEFERRED (Andy, 2026-10-09)** — to after more writing on the new site. It was
   researched and planned, and nothing was built:
   **[docs/future-work/posse-and-syndication.md](../future-work/posse-and-syndication.md) is the
   pickup point**, with what is settled (manual full-article LinkedIn copies with a copy tool;
   webmentions received and held; Bluesky and Mastodon through Bridgy, chosen at publish time and
   posted by CI), the open questions, and the research behind them. Two findings worth knowing before then: **no API publishes a native
   LinkedIn Article, and Bridgy does not support LinkedIn at all.** The mf2 remainder and the
   Cloudflare warning below stay here as context for that work.

   **The microformats remainder lands here, and it is a short list because most of mf2 is already
   built.** The article page carries `h-entry` with `p-name`, `dt-published`, `e-content`,
   `u-url`/`u-uid`, `u-photo` and `p-category` (2026-08-26). What is left needs either a schema field
   or a live syndication target, which is why none of it could be done with the markup:

   - **`u-syndication`** — the property Bridgy's **backfeed** matches a social reply against, so
     without it replies never find their way home. Needs an array-of-URLs field on `article`/`note`
     **and** a way to populate it. Andy's inclination (2026-08-26) is a webhook writing back to
     Sanity, which triggers a rebuild through the existing webhook path. A weekly `schedule:` trigger
     was floated as an alternative or backstop — note that **GitHub disables scheduled workflows after
     60 days of repo inactivity**, so it wants a fallback if it is the only mechanism.
   - **`p-summary`, and a real question with it.** Bridgy uses it for the text on character-limited
     platforms — Bluesky is 300 — so without it a long `e-content` gets truncated by someone else's
     rule. `shortDescription` is the obvious source and is **card copy, which is not the same job**;
     syndication text may want its own field. Decide the field before writing the markup.
   - **`dt-updated`** from `_updatedAt`, which is already projected. Optional, and invisible markup,
     so it goes with the two above rather than on its own.
   - **`<link rel="webmention">`** advertising an endpoint — webmention.io is the usual answer — plus
     a **build-time fetch of that endpoint's API** to render received mentions. Receiving is inert
     without both.
   - **`h-feed`** wrapping the entries on index pages, so a reader can subscribe by mf2. Index-page
     work, but it belongs on this list.

   **CLOUDFLARE IS A LIVE RISK TO ALL OF THIS, AND IT FAILS SILENTLY** (noted 2026-09-21). The apex
   is proxied; `preview.` is not, so nothing before cutover exercises it. Everything on this list
   depends on **non-browser clients reaching the site**: Bridgy fetches pages to build syndicated
   copies and to match backfeed, webmention.io fetches them to parse mf2, and feed readers poll the
   Atom feeds. Cloudflare's bot protection has a long history of challenging exactly that class of
   client — and **a challenged fetch does not error, it just never arrives**, so POSSE would appear
   to be configured correctly and quietly do nothing.

   So when this phase lands, **verify those specific clients get through before debugging anything
   else.** Bridgy publishes its source IPs and user agent; webmention.io likewise. If something
   IndieWeb-shaped does not work, Cloudflare is the first place to look, not the last. Keeping the
   proxy thin is recorded as a cutover checklist in `nginx/afc-production.conf`.

   **One custom rule does challenge requests, and it is scoped so that it cannot be this failure**
   (2026-10-06). It is a Managed Challenge on filter combinations — `/insights/` and
   `/presentations/` with a comma or ampersand in the facet query — which robots.txt disallows and
   Meta's crawler fetched anyway, 46,685 times in one day. It matches URLs, not clients, and no
   IndieWeb client fetches those URLs, so it is a suspect only when the URL that fails is one of
   them. The rule and its reasoning are recorded beside the checklist in
   `nginx/afc-production.conf`.

   **Not phase 8: the author `h-card`.** It lands with the **home page** (phase 4 item 3) as the
   site's *representative* h-card, because that is where a `rel=author` lookup resolves. The detail
   pages already emit `<link rel="author" href="/">` and it is **inert until that card exists** — the
   design carries no byline, so an in-entry `p-author` would have to be invisible markup, and the
   authorship algorithm is the way around that. **`settings` now carries `authorName` and
   `authorImage`** (string; image with hotspot and `altText`, added 2026-08-26), so the data is
   waiting. Note the property collision that is not one: `u-photo` on an `h-entry` is an image *of the
   post* — the hero, already built — while `u-photo` on an `h-card` is the person's avatar.

   **THE SERVICE WORKER IS DECLINED (Andy, 2026-10-09)**, on the same warrant-first terms as
   per-concept feeds: revisit if offline reading becomes something someone wants. Measured against
   what exists, a worker would add little. The nginx config already makes hashed `_astro/` assets
   `immutable` for a year and revalidates HTML, the search index and the feeds, so repeat visits are
   covered. The site is installable without a worker (BaseLayout records why). What a worker would
   add is **offline reading** — and the risk this site has already paid for once: the 11ty worker
   downloaded an extra 1–1.3 MB on a first visit, served installed copies a stale home page, and
   needed a kill switch to remove.

   **`/serviceworker.js` stays, and it is not a worker of ours** — it is that kill switch, removing
   the 11ty worker from returning visitors. Keep it indefinitely, per its own header. ux-methods'
   worker was read for the decision; three things in it are not worth copying, recorded in
   docs/ux-methods-notes.md. **If a worker is ever wanted**, the lowest-risk shape considered was an
   *offline page only*: one cached page, the network for everything else, answering a navigation
   only when the network fails — so it can never serve stale content. It would take the kill
   switch's URL and its cache cleanup, with the kill switch kept as its documented off switch.

   The four constraints that shaped the decision, kept for a revisit:
   - **Astro hashes asset filenames at build**, so a hand-written worker with a hardcoded precache
     list goes stale every build. Either do runtime caching only — cache-first for fonts, network-
     first for HTML, no manifest — or use `@vite-pwa/astro`/Workbox to generate the manifest. This is
     the part that differs from Jekyll and 11ty, where the filenames were ours to control.
   - **Scope it to production only, deliberately.** A worker registered on `preview.` would cache
     draft content and fight visual editing, and because a worker persists client-side it can outlive
     the session that installed it. The two build modes make this a real hazard, not a hypothetical.
   - **The marginal benefit over correct `Cache-Control` is small.** This is a content site; headers
     already win most of the repeat-visit case. The worker's real value is an **offline fallback
     page** and navigation preload.
   - **A misconfigured worker is one of the few ways to semi-permanently break a static site**, since
     it can serve stale HTML indefinitely to anyone who already has it. Ship it with a documented
     unregister path.

   **Fallback metric-matching is already done** and is no longer a phase 8 item. It was listed here
   while the `@font-face` rules were hand-written; adopting Astro's Fonts API brought it for free, via
   `optimizedFallbacks`. `font-display: swap` still accepts FOUT by design and preload only narrows
   the window — but the reflow when the swap happens is now matched rather than raw.

