# Andy Fitzgerald Consulting — project context

## What this is

The codebase behind **andyfitzgeraldconsulting.com**, Andy's professional home for ~8 years.
A static site with Sanity as CMS, deployed to a DigitalOcean droplet behind nginx.

It is being **re-envisioned as a digital garden** — still publishing substantial articles and
still describing consulting services, but reframed from "consultancy website" toward "engaged
professional's digital home." The goal is to publish more often by supporting lighter-weight
notes and links with commentary, and to make different content types and topics clearly
distinguishable and discoverable. Register reference points: Jim Nielsen's brief notes more
than Maggie Appleton's full embrace of incompleteness — Andy expects to publish short and
evolving work, but not truly half-baked work.

Business logic behind it: most client work arrives through Andy's network, so drawing more
people into that network improves the odds of being connected to "Andy-shaped problems."

A secondary but explicit purpose: **building this site by hand keeps Andy close to the base
materials of the web** — HTML, CSS, JS, and Linked Data. That is a goal, not an accident.

## How to work with Andy on this repo

**Revised 2026-08-17 for the build phase.** The earlier rule — never write code into the repo,
suggest it in chat for Andy to retype — was right for the design work, which was learning-dense and
where he wanted a hand on every decision. Building from a finished spec is a different shape: much
of it is mechanical transcription, where chat round-trips add friction and no learning.

**Write code into the repo now — but in reviewable increments.** He is an information architect,
not a professional web developer, and hands-on work is still how he learns. What changed is *which*
work is worth his hands.

| | |
|---|---|
| **You write** | tokens transcribed from DESIGN.md, boilerplate, config, repetitive sweeps, query modules — anything mechanical |
| **Andy writes** | **layout mechanics, the cascade, component boundaries**, plus content model, URL design and semantics |

For the second row: explain the reasoning and the underlying platform behaviour, then let him write
it. He may delegate one of these once he has the concept, but **let him offer** — don't assume, and
don't do it for him.

### Cadence is the constraint, not volume

> **Reviewable pieces at a reviewable cadence. Never write pages of code at once and ask him to
> accept it.**

- One coherent piece, then **stop and let him look.** When in doubt, smaller.
- **Say what you're about to write before writing it**, so a wrong direction costs a message rather
  than a file.
- **If the pace is too slow he will say so.** Absent that, assume he wants to see the changes — err
  toward pausing, never toward batching.
- **Prototype in the scratchpad, not the repo**, when the point is to find out whether something
  works.

**Reviewing what Andy writes is high value** and always welcome. Offer it.

Teach the *why*. Assume strong fluency in IA, semantics, structured content, and taxonomy
(he works with SKOS professionally). Do not assume front-end idiom or performance intuition —
he has named performant, scalable CSS/HTML as not his strong suit and wants to get better at it.

**He values pushback explicitly.** Offer new angles and challenge assumptions. If he reaffirms
a decision after you've raised a concern, that's his call — proceed with the full request.

## Stack and layout

Workspace monorepo, `type: module` throughout. **Two generations coexist until the phase 6 cutover:**
`web-next/` and `studio-next/` are the build; `web/` and `studio/` are the live site and are not
modified. The root moves to **pnpm + Node 24** in phase 0; `main` stays on npm until cutover.

| Path | What |
|---|---|
| `web-next/` | **Astro site — the build.** Static in production, SSR for the preview environment |
| `studio-next/` | **Sanity Studio on the `production-26` dataset** — where the content model iterates |
| `web/` | Eleventy 3.x static site — **live production, frozen** |
| `web/_src/` | Page templates (Nunjucks) — Eleventy input dir |
| `web/_includes/` | Layouts and partials (`base.njk`, `partials/head.njk`, `linked-data/*.json`) |
| `web/_data/` | Build-time Sanity fetches (`articles.js`, `singletons.js`, …) |
| `web/style/` | The old hand-authored CSS — **reference only; not a pattern to follow** |
| `web/utils/` | `sanityClient.js`, `imageUrl.js`, `serializers.js` (Portable Text → HTML) |
| `web/_11ty/shortcodes/` | Image and hero shortcodes |
| `web/_site/` | Build output — gitignored, never edit |
| `web/mailhandler.php` | Contact form handler; PHP runs on the droplet alongside the static build |
| `studio/` | Sanity Studio (v6, React 19, TypeScript) — live, on the `production` dataset |
| `studio/schemas/` | Content model — `documents/`, `objects/` |
| `web/__web_2022/`, `web/__source_docs/` | Archived prior iterations — reference only, not live |

**`web/` is reference, not a source of patterns.** Read it to learn what the site *does* — the
content model it consumes, the JSON-LD it emits, the Sanity queries it runs. Do not carry its CSS,
its component boundaries or its template structure into `web-next/`; see Current direction.

The codebase has passed through Jekyll and a Sass build before landing on Eleventy, so anything in
`web/` may be older than it looks.

## Commands

**The build** (pnpm, from phase 0):

```bash
pnpm --filter web-next dev        # Astro dev server
pnpm --filter studio-next dev     # Sanity Studio on the production-26 dataset
```

**The live site** (npm, unchanged until cutover — don't run these to test new work):

```bash
npm run dev          # runs studio + web in parallel (root)
npm run dev:web      # Eleventy watch + serve
npm run dev:studio   # Sanity Studio on :3000
```

Deploy is `.github/workflows/build-prod.yml` — builds Eleventy, installs PHP deps via Composer,
tars the output, scps to the droplet, and swaps an atomic release symlink at `/var/www/afc/html`.
Triggered by pushes touching `web/**` and by Sanity `repository_dispatch` webhooks per document
type. **It stays as-is and keeps deploying the live site**; the replacement pair is described under
Current direction → Deploy shape, and is written in phase 6.

## Conventions and constraints

- **Hand-authored CSS and hand-authored UI components. No Tailwind, no shadcn, no component
  libraries.** This is deliberate — staying close to the core languages is a project goal.
  Don't propose these as shortcuts.
- Plain CSS with **native nesting** (`&`, nested `@media`) — no preprocessor.
- **Two tiers, and only two.** Global: primitive tokens, semantic role tokens, and the element-level
  role styles (`h1`–`h4`, body prose, the rhythm mechanism). Everything else is a
  **component-scoped style in the component that owns it.** There is no global `components/` layer,
  no page-level stylesheets, and no import chain — that structure belonged to the 11ty build and is
  deliberately not carried forward.
- All font sizing in `rem`, never `px`.
- Andy maintains a **parallel design system in Figma** (variables + text styles). CSS mirrors that
  two-layer idea: **primitive tokens** and **semantic role styles** that reference them.
- Linked Data matters here. Semantics and structured markup are first-class concerns, not
  nice-to-haves — JSON-LD carries over from `web/_includes/linked-data/`, joined by microformats2.
- **Two-space indentation everywhere, CSS included.** One Prettier style repo-wide — no semicolons,
  single quotes, 100 char width — configured at the root and mirrored in `web-next/` only to add the
  Astro plugin. The old rule here said tabs in CSS; that described `web/style/`, which is reference
  only. Don't reintroduce a per-language override.

## Design system

**[DESIGN.md](DESIGN.md) is the single source for design direction** — every token value plus the
rules that govern a build: the two-layer principle, the modular scale and its clamps, the leading
ramp, measure, the grid, vertical rhythm, colour roles, components, and the standing do's and don'ts.
**Read it before touching type, colour, spacing or layout, and do not restate its rules here** — a
second copy is just something to get wrong and to fall out of sync. If a design rule seems to be
missing, add it to DESIGN.md rather than to this file.

**[docs/decisions/](docs/decisions/) holds the reasoning behind settled design decisions**, split by
theme — colour, typography, layout, components. DESIGN.md links to them. **Read a record only when a
decision it covers is being questioned, excepted, or changed** — not as background for ordinary work.
If you find yourself re-deriving a value that has a record, read the record instead. **When a decision
changes, supersede the record rather than editing rationale back into DESIGN.md** — that growth is
what this split exists to prevent.

**[docs/open-questions.md](docs/open-questions.md)** tracks what is *not* settled. Consult it when
work approaches one of those areas; it is not general background either.

The authority chain is **Figma → DESIGN.md → CLAUDE.md**: the Figma library is the source of truth
for colour roles, DESIGN.md reflects it and is authoritative for everything else, and this file
defers to DESIGN.md. Figma mechanics and the constraints they impose on the system live in
[docs/figma-notes.md](docs/figma-notes.md).

What belongs here is only the working protocol — where the tools are and how to conduct the work:

- **Design specimens live in `web/__design-specimens/`** (the `__` prefix marks it reference-only,
  matching `__web_2022`). They **must be served over HTTP** — fonts will not load from `file://` in
  Chrome. Serve the `web/` directory and open `/__design-specimens/<file>`:

  ```bash
  cd web && python3 -m http.server 8124
  ```

  - `type-scale-specimen.html` — the full type system on real prose: base 20/18 toggle, fixed/fluid,
    heading-face toggle, h4 treatments, measure guides, the sidebar-vs-full-width layout comparison,
    and **the rejected `.prose` container prototype** with its wide/full tiers and `subgrid`
    full-bleed panel. Directly relevant to any grid or layout discussion.
  - `color-specimen.html` — the palette applied to real page elements with live contrast computation
    and pass/fail badges per pairing.

  They reference the real fonts at `../assets/fonts/`, so nothing is duplicated.

### Figma connection — what to use it for, and what not to

A Figma MCP connection is available and authenticated as Andy (Full seat, "Andy Fitzgerald
Consulting" team). Design file: `pPZPGT6EpSaLkoUDK8HMMp`.

Andy upgraded to a **Professional** seat on 2026-07-28, which lifted the Starter plan's cap of 6 MCP
calls per month and unlocked **variable modes** (up to 4 per collection). Calls are no longer scarce.

One habit from the scarce era is still worth keeping: **batch aggressively** — one `use_figma`
script can read and write in the same call, so prefer a single comprehensive script over several
probes.

On authority, see the chain under **Design system**: Figma is the source of truth for **colour
roles**, and DESIGN.md is authoritative for everything else. The MCP keeps the two in sync; it does
not replace the written spec, and reading Figma is how you check DESIGN.md rather than the reverse.

**Never use Figma's design-to-code tooling** — `get_design_context`, `add_code_connect_map`,
`get_code_connect_suggestions`, `send_code_connect_mappings`. Decided 2026-07-28. It is the Figma
MCP's headline feature and it works directly against the purpose of this project: generated markup
and CSS would bypass the hands-on work Andy is doing this for. Reading a node for reference and
discussing it is fine; generating code from it is not. Do not propose it as a shortcut.

**Do** use it for:
- `get_variable_defs` — read variables and diff them against DESIGN.md. Offer this after Andy has
  had a Figma session; it has already caught six divergences.
- `get_metadata` / `get_screenshot` — read structure and see the design to give grounded feedback.
- `download_assets` — pull SVGs and images out for use as real site assets.
- `use_figma` — write tokens and text styles back into Figma from DESIGN.md. Andy has approved
  writing to this file, including overwriting stale values in place.

## Current direction

**Rebuilding the site in Astro against the finished design** (revised 2026-08-17). This supersedes
the earlier "migrate the build tool, hold design constant" plan.

That plan existed so the port could be **diffed against live production** to prove it was faithful.
That is no longer the goal: the design system is complete, it includes elements the 11ty front end
never had, and the content model is changing. Holding design constant would mean building the old
site twice.

**Do not carry CSS or componentization decisions over from `web/`.** They reflect older habits and
are explicitly not the target. The clean slate is the point.

**What this costs, and what replaces it.** There is no longer an automated way to prove the port is
faithful, because it is not meant to be. Visual verification is against DESIGN.md and the Figma
boards, by eye. **Content parity becomes the verification instrument instead** — every document of
every type must render — because a changed model breaking a published document is the failure mode
that actually bites.

**Two datasets, deliberately not synchronised.** Model iteration happens on the duplicated
`production-26` dataset while `production` serves the live site. Migration scripts were considered
and **declined**: Andy is publishing little or nothing before cutover, and hand-migrating one or two
articles is cheaper than maintaining and debugging a migration suite. At cutover, `production-26`
becomes the live dataset.

### Phase sequence

Each phase is a branch off `next`, merged back once verified. Do not run them in parallel.

0. **Repo scaffolding.** `web-next/` (Astro) and `studio-next/` alongside the existing `web/` and
   `studio/`. pnpm workspace, one root lockfile, **Node 24 everywhere** — Node 20 is EOL as of April
   2026, so the current CI pin is on an unsupported runtime. Settle the two-workflow deploy shape
   below and the data-fetching shape below before writing pages.
   *This must not reach `main`: `main` still runs `npm ci` against `web/package-lock.json`.*
1. **Studio on `production-26`.** New studio, current schema as the starting point, TypeGen wired.
   **Permalink *design* lands here and is recorded in
   [docs/urls-and-filtering.md](docs/urls-and-filtering.md)** — the URL surface, the addressing
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

   The content model is iterated alongside, driven by what each page needs. **The `note` type and
   the two SKOS vocabularies** land here rather than up front — a hierarchical topic vocabulary for
   tag browsing and related content, and a **semantic type** vocabulary distinguishing kinds that
   share one structural Sanity type (method vs. perspective vs. conference note).
   `sanity-plugin-taxonomy-manager` is already installed. Taxonomy design may deserve its own branch.
5. **Content parity check.** Render every document of every type; catch dangling references and
   fields that silently stopped rendering.
6. **Cutover.** Rewrite CI for pnpm, Node 24 and the new build directory. **`mailhandler.php` must
   survive** — it stays PHP on the droplet, but becomes a backend endpoint called from JS rather
   than a form target with its own display pages, since mail forms now appear on several pages.
   Carry the Composer step into the new workflow. nginx, the 301 map, staging deploy. Then rename
   `web-next` → `web` and `studio-next` → `studio`, archiving the old alongside `__web_2022`.
7. **Cleanup.** Deliberately after the site is live, so none of it can destabilise a launch, and
   before phase 8, so per-taxonomy feeds are built against the final vocabulary rather than one
   still carrying deprecated schemes. Nothing here blocks earlier phases — verified, not assumed:
   - **Remove the deprecated `insightType` field** from `article` and `caseStudy`, and unset the
     data. `genre` replaced it in phase 1 and both fields reference the same concepts.
   - **Retire the two deprecated schemes** — `Insight Type [DEPRECATED]` and `Topic [DEPRECATED]` —
     and any concepts left unreferenced with them.
   - **Resolve the orphan types**, `service` (4 documents) and `collection` (2). They have live
     documents and no schema file, which is why `hiddenDocTypes` exists. **Nothing renders them:**
     `services.njk` iterates singletons, and no query fetches either type. So they are adopted into
     the schema or deleted — the choice is editorial, not structural.
   - **Shrink `hiddenDocTypes`** in `sanity.config.ts` to whatever survives the above.
8. **Quality gates + POSSE.** Performance budgets, accessibility checks, link checking, HTML
   validation; per-taxonomy RSS feeds; **POSSE** (https://indieweb.org/POSSE) syndication to
   LinkedIn, Bluesky, Mastodon. "Automated quality gates" is Andy's preferred framing over "TDD."
   Also the natural home for a **TypeGen drift check** — regenerate and fail on a diff — since
   watch-mode generation is off and `pnpm typegen` is run by hand.

### Deploy shape — static production, SSR preview, one droplet

**Ported from `andybywire/ux-methods`, where this is already working.** One codebase, two build
modes selected by environment:

| | `ASTRO_OUTPUT` | Served by | Visual editing | Indexed |
|---|---|---|---|---|
| production | `static` | nginx, static files | off | yes |
| preview | `server` | PM2 + Node on the same droplet | on | `noindex` |

This is what makes visual editing possible **without giving up a static production site.** The
official Astro visual-editing integration requires `output: "server"` because draft mode depends on
per-request cookie checking — running that in front of the public site would trade the tar → scp →
symlink deploy for a supervised Node process. Pointing Presentation at `preview.` instead keeps
production static and bulletproof.

Copy the workflow pair from `ux-methods` rather than reinventing it, but **fix three things**: both
workflows pin Node 22 and the preview deploy script does `nvm use 20` — use 24 throughout; both
trigger on identical paths so every push builds twice; and the droplet gains a dependency on Node,
pnpm and PM2 surviving reboots.

**Rejected: local-only preview.** Requiring `pnpm dev` to edit content works against the goal of
making publishing easier.

**The nginx config is authored in the repo and deployed, never edited on the server** (decided
2026-08-20). DigitalOcean's tutorials present it as server-side editing, which is why it has been done
that way until now; it costs version control, diffs, and the ability to use your own editor. Author it
alongside the 301 map, ship it the same way the site ships — scp, `nginx -t`, then reload — and roll
back with a revert plus a redeploy. The safety gate is real: `nginx -s reload` on a bad config fails
and leaves the running config in place, so testing first makes it hard to take the site down. Learn
enough `nano` for a 2am emergency, but keep it off the normal path.

**Rejected: Docker** (2026-08-20). Considered both as a local harness for verifying the nginx routing
table and as the production runtime. As a runtime it trades an atomic symlink swap for image builds, a
registry and container lifecycle, adds a daemon to a small droplet and one more thing to survive
reboots, and buys scaling and onboarding this project does not need. It also complicates TLS rather
than simplifying it: certbot must answer an HTTP-01 challenge on port 80 for the real hostname, so
containerising means either a sidecar sharing webroot and cert volumes or host certbot with mounts —
both more moving parts than host certbot. The local-harness case was the stronger one, since
`nginx -t` plus a curl sweep of the redirect list would close a real verification gap, but it needs
path and version parity with the droplet to mean anything, and false confidence is worse than no test.
**Debugging on the server is the accepted cost.**

### Data fetching — direct GROQ queries, not Astro Content Layer

**Decided phase 0.** Content Layer is the obvious-looking choice and the wrong one here, so the
reasoning is recorded rather than left to be rediscovered.

Content Layer runs a **loader** once at build start, writes everything into a store that persists
between builds, and pages read it with `getCollection()`. Four reasons against it:

- **It would create two data paths.** The store is a snapshot of *published* content; the preview
  environment needs *draft* content, live. That means `getCollection()` for static and `loadQuery()`
  for preview — the same content reached two ways, free to drift. Closing that means writing and
  maintaining a live loader too, since Sanity does not ship one.
- **Its main benefit evaporates in CI.** The persistent store is what makes Content Layer worth it,
  and GitHub Actions checks out fresh, so it is cold every run. Real win locally, near zero in
  production. Same shape as the Astro image-cache problem.
- **A Zod schema would duplicate TypeGen.** Content would be described twice — once in the Sanity
  schema, which is the source of truth, once in Zod. TypeGen already derives types from the actual
  GROQ projections, so the types match what was fetched rather than what was promised.
- **It fights GROQ, which is the reason to use Sanity.** Content Layer's model is "load a collection,
  filter in JS." This content is reference-heavy — clients, topics, taxonomy terms — and those joins
  belong in the query. Store already-projected shapes instead and a "collection" is just one query's
  result, at which point the abstraction buys nothing.

**Sanity's own Astro documentation never mentions Content Layer**; it recommends `loadQuery`
directly, with `export const prerender = false` on preview routes.

**The structure that matters.** The failure mode of direct calls is queries scattered inline across
forty page files — which is what people adopt Content Layer to escape. Prevent it structurally:

- **One `loadQuery()` wrapper** owning the perspective switch, `useCdn`, token and stega. No page
  constructs a client.
- **Queries in their own module**, named and exported, built with `defineQuery` from `groq` so
  TypeGen can see them. Shared **projection fragments** composed into queries, not repeated.
- **TypeGen runs against those query files**, so results are typed from the real projections.

**Reference: [`andybywire/ux-methods`](https://github.com/andybywire/ux-methods), `astro/src/sanity/`**
— `lib/load-query.ts` and `sanity.queries.ts` are this pattern already working, including the
projection-fragment composition. **Consult it for the data layer only; its `src/styles/` is the
page-level-stylesheet structure this build is deliberately not repeating.** Two things to improve on
rather than copy: split queries per document type or route instead of one file, since this site has
far more types; and prefer `astro:env` for typed environment variables over reading
`import.meta.env` and `process.env` by hand.

Borrowing runs both ways. **Improvements found here that apply back to `ux-methods` are recorded in
[docs/ux-methods-notes.md](docs/ux-methods-notes.md)** — add to it when one turns up, rather than
letting it live only in a commit message.

**One simplification already proven there:** perspective is a **build-mode flag**, not a per-request
cookie. The preview deploy builds with drafts on, production builds with them off. That sidesteps
cookie-based draft mode and the `/api/draft-mode/enable` routes in Sanity's guide entirely, and it
works precisely because the two builds are separate deploys.

### Images — Sanity URLs at runtime, not through the build

**Do not route Sanity images through Astro's asset pipeline.** Build-time optimization would
download and process every image on every CI run against a cold cache, and inflate the deploy tar.
Serving Sanity URLs at runtime means the build never fetches an image at all.

The cost is that Astro no longer generates `srcset` — so **`<SanityImage>` is a real component we
write**: takes an image ref, applies hotspot/crop via `@sanity/image-url`, emits `srcset`, `sizes`,
`width` and `height`. `web/_11ty/shortcodes/clientLogo.js` has most of the logic already. Sanity's
`auto=format` still negotiates AVIF/WebP.

**Astro's `<Image>` still applies to repo assets** — logo, OG images, anything checked in. Two
pipelines, each doing what it is good at.

**To verify in phase 3: serving Sanity images from a Cloudflare-CNAMEd subdomain.** The intent is
to let Cloudflare cache transforms and, more importantly, to put images on a domain where
Cloudflare's free **Hotlink Protection** applies. Two things must be confirmed before committing:

- **Host header** — a proxied CNAME sends `Host: images.andyfitzgeraldconsulting.com` to Sanity's
  CDN, which routes on Host. It needs rewriting to `cdn.sanity.io` via an Origin Rule or a Worker.
- **Origin SSL** — under Full (strict), Cloudflare validates the origin certificate against the
  hostname it connects to, so the Host override must carry SNI.

**This is an unsupported community workaround** — Sanity documents no custom-domain path, so it can
break without notice. **If verification fails, fall back to `cdn.sanity.io` directly.** That is a
one-line change in the URL-builder wrapper and nothing else in the build cares. Hotlinking has
happened once in eight years; carrying that risk is an accepted trade.

### Theme switching

**Ships with a toggle**, defaulting to system preference. Three CSS blocks, not one: `:root` for
light, `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, and
`:root[data-theme="dark"]`, so an explicit choice wins in both directions. A **synchronous inline
script in `<head>`** sets `data-theme` before first paint — anything deferred paints the wrong theme
first. Set `color-scheme: light dark` on `:root` so form controls follow.

The cost is not the ~60 lines of code; it is that every token now has three places it can be wrong,
and the test matrix doubles.

### Branching and verification

**`main` is the live production site and is frozen and terminal.** CI deploys on any push to `main`
touching `web/**`, so building in `web-next/` **cannot** trigger it — the deploy path stays inert
until the phase 6 rename deliberately activates it.

- **`main`** — current production. Hotfixes only.
- **`next`** — integration branch where the new site accumulates. Never auto-deploys.
- **Phase branches** — branch from `next`, merge back once verified. One per phase, each reviewable
  on its own.
- **One deliberate cutover merge** `next` → `main` at the end.

**Do not merge `main` → `next`.** The old rule existed so production hotfixes would propagate, but
the two branches now share no front-end files — a fix to 11ty `web/` has nothing to propagate into
Astro `web-next/`, and once `next` is on pnpm the merge only produces lockfile conflicts.

**Andy does the visual verification himself.** Get changes green and integration-verified, then hand
him the specific eyeball steps rather than asking him to check things you could have checked.

Nothing on `next` is ever deployed, so **nginx config, 301 redirects and CI build behaviour cannot
be verified locally.** The SSR preview environment closes part of this gap early; the rest needs a
staging deploy before cutover.

Branch names are plain kebab-case, no prefix (`type-foundations`, `add-php-mail-support`). Commit
subjects use conventional-commit prefixes (`feat:`, `chore:`). **Commit and push only when asked.**
`origin/dev` (Aug 2025) and `origin/staging` (Mar 2024) are abandoned — don't build on them.

**Sequencing constraint from POSSE:** syndicated copies link to canonical permalinks permanently, so
**URL design must land before notes go live** — which is why permalink design sits in phase 1 rather
than emerging page by page. Microformats2 (`h-entry`/`h-card`) sits alongside the existing JSON-LD
without conflict.

**Decided against:** the **domain change to andyfitzgerald.net is off** (2026-07-27). Also **against
a separate v3 repository** (2026-08-17) — same site, same domain, and a single history running
Jekyll → 11ty → Astro is the more useful record. Splitting it would also mean re-establishing deploy
keys, Actions secrets and Sanity webhooks at the worst possible moment.

## Look and feel

Andy's read is that the site is **already typography-driven and lightly styled** — closer to a
digital garden or blog than a corporate site. So the reframe is carried mostly by content and IA
plus tightening, not a visual overhaul. Don't propose a redesign.

**Colour, type, grid and rhythm live in [DESIGN.md](DESIGN.md)** — values, rules and rationale
alike. Don't restate them here.

**Layout and page-template changes get discussed against the whole page inventory** — index,
detail, singleton — not derived from one page type. That is a rule about how the conversation goes,
which is why it sits here; the layout constraints it protects are in DESIGN.md.

## Known debt

**Most of the old debt list has been deleted rather than carried forward.** It described
`web/style/` — the import chain, uncontrolled measure, ten hand-picked font sizes, Sass-era dead
comments, the ungoverned greys, the shipped contrast failures. None of it survives a build that
starts from DESIGN.md, and keeping it would only invite someone to "migrate" the thing we are
deliberately not migrating. **If you want to know how the old CSS worked, read the git history.**

What remains is infrastructure, content-model constraints, and one measured input.

**Carries into the new CI (phase 6):**

- **The deploy writes `.env` as `chmod 644`** — world-readable on the droplet, containing the Google
  OAuth client secret and refresh token. `640` owned by the web group is tighter. **This is a live
  security issue on the running site, not just a migration note**, and it should be fixed in the new
  workflow rather than reproduced.
- **The droplet keeps 3 releases, not 5.** Commit `5e9fac8` deliberately changed `tail -n +6` to
  `+4`; only the comment still says five. Preserve the retention behaviour in the new workflow and
  write the comment to match.
- **`mailhandler.php` needs the Composer step.** PHP deps are installed in CI and shipped with the
  tar. Easy to lose in a JavaScript migration — see phase 6.

**Content-model constraints the new front end inherits:**

- **`h5` is author-selectable in Sanity and does not exist in DESIGN.md.** The design system defines
  `h1`–`h4` and stops there deliberately — below h3 size is no longer a usable signal. So either the
  Portable Text schema drops `h5`, or the system needs a role for it. **`h4` already appears in
  published content**, so it must render correctly from day one. Decide in phase 1, with the schema.
- **Portable Text emits a flat sequence with no section wrappers**, which is why vertical rhythm is
  sibling margins rather than `gap`. This is a constraint on the markup, not a preference — see
  DESIGN.md and docs/decisions/layout.md.

**Measured input for phase 2 (fonts):**

- **2.7 MB of unsubset fonts, and the files carry over even though the CSS does not.** All four
  variable files declare `font-stretch: 100%`, so the `wdth` axis is paid for and unusable — subset
  it out. The body font was not preloaded at all, and `@font-face` used the obsolete
  `format('woff2 supports variations')` syntax.
- **~780 KB of that is pure deletion, no tooling needed.** Open Sans (two files, 591 KB) is dropped
  because DESIGN.md never mentions it. **`Lato-Medium.woff2` (208 KB) has no consumer at all** — not
  merely an over-preload, which is how this entry read until phase 2 measured it. DESIGN.md's only
  `fontWeight: 500` role is `display`, which is *Noto Serif* and covered by its variable axis; Lato
  Medium appears in no Figma text style either. DESIGN.md uses Lato at 400 and 700 only.
- **The actual subsetting job is the two Noto Serif files** — 1.99 MB of the 2.7 MB total, and where
  the whole win is. Both stay: the italic carries `<em>` in prose. The Lato pair is 28 KB each,
  already latin-subset from Google Fonts, and likely needs no work.
