# Andy Fitzgerald Consulting — project context

## What this is

The codebase behind **andyfitzgeraldconsulting.com**, Andy's professional home for ~8 years.
An Eleventy static site with Sanity as CMS, deployed to a DigitalOcean droplet behind nginx.

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

**Do not write code into this repo unless asked.** Default to suggesting code in chat that
Andy copies or retypes himself. He is an information architect, not a professional web
developer, and hands-on work is how he learns.

The agreed protocol:

- **Learning-dense decisions** (type tokens and roles, measure, the cascade, content model,
  URL design, semantics) — explain the reasoning and the underlying platform behavior, then
  let Andy write it. He may delegate some of these once he has the concept, but **let him
  offer**; don't assume and don't do it for him.
- **Mechanical, low-learning work** (repetitive sweeps, boilerplate, stripping declarations
  across many files) — take more liberty here, but say what you're doing before you do it.
- **Reviewing what Andy writes is high value** and always welcome. Offer it.
- **Prototype in the scratchpad, not the repo**, so he can see something working before it
  lands in his codebase.

Teach the *why*. Assume strong fluency in IA, semantics, structured content, and taxonomy
(he works with SKOS professionally). Do not assume front-end idiom or performance intuition —
he has named performant, scalable CSS/HTML as not his strong suit and wants to get better at it.

**He values pushback explicitly.** Offer new angles and challenge assumptions. If he reaffirms
a decision after you've raised a concern, that's his call — proceed with the full request.

## Stack and layout

npm workspaces monorepo, `type: module` throughout.

| Path | What |
|---|---|
| `web/` | Eleventy 3.x static site |
| `web/_src/` | Page templates (Nunjucks) — Eleventy input dir |
| `web/_includes/` | Layouts and partials (`base.njk`, `partials/head.njk`, `linked-data/*.json`) |
| `web/_data/` | Build-time Sanity fetches (`articles.js`, `singletons.js`, …) |
| `web/style/` | Hand-authored CSS — see conventions below |
| `web/utils/` | `sanityClient.js`, `imageUrl.js`, `serializers.js` (Portable Text → HTML) |
| `web/_11ty/shortcodes/` | Image and hero shortcodes |
| `web/_site/` | Build output — gitignored, never edit |
| `web/mailhandler.php` | Contact form handler; PHP runs on the droplet alongside the static build |
| `studio/` | Sanity Studio (v6, React 19, TypeScript) |
| `studio/schemas/` | Content model — `documents/`, `objects/` |
| `web/__web_2022/`, `web/__source_docs/` | Archived prior iterations — reference only, not live |

The codebase has passed through Jekyll and a Sass build before landing on Eleventy. Debt from
those eras is still present (see Known debt).

## Commands

```bash
npm run dev          # runs studio + web in parallel (root)
npm run dev:web      # Eleventy watch + serve
npm run dev:studio   # Sanity Studio on :3000
```

Studio: `npm run build`, `npm run deploy`, `npm run lint`, `npm run typecheck` (from `studio/`).

Deploy is `.github/workflows/build-prod.yml` — builds Eleventy, installs PHP deps via Composer,
tars the output, scps to the droplet, and swaps an atomic release symlink at `/var/www/afc/html`.
Triggered by pushes touching `web/**` and by Sanity `repository_dispatch` webhooks per document type.

## Conventions and constraints

- **Hand-authored CSS and hand-authored UI components. No Tailwind, no shadcn, no component
  libraries.** This is deliberate — staying close to the core languages is a project goal.
  Don't propose these as shortcuts.
- Plain CSS with **native nesting** (`&`, nested `@media`) — no preprocessor, no build step.
- CSS is organized loosely ITCSS/SMACSS: `utilities/` → `base/` → `layout/` → `pages/` →
  `components/`, aggregated by `style/style.css`.
- All font sizing in `rem`, never `px`.
- Design tokens live as custom properties in `style/utilities/variables.css`.
- Andy maintains a **parallel design system in Figma** (variables + text styles). CSS structure
  should mirror that two-layer idea: **primitive tokens** and **semantic role styles** that
  reference them.
- Linked Data matters here. JSON-LD lives in `_includes/linked-data/`. Semantics and structured
  markup are first-class concerns, not nice-to-haves.
- Tabs for indentation in CSS; Prettier config in `studio/` uses no semicolons, single quotes,
  100 char width.

## Design system

**All token values live in [DESIGN.md](DESIGN.md)** — typefaces, the modular scale, fluid
`clamp()` declarations, leading ramps, measure, colour ramps, and semantic roles, each with its
rationale and measured contrast figures. Read it before touching type or colour, and keep it in
sync with Andy's Figma library; the two are meant to be diffable.

What belongs here is only the set of rules that change how you work, rather than what the values
are:

- **Two layers, mirroring Figma:** Figma *variables* → CSS custom properties (values only);
  Figma *text styles* → CSS rules (bundles of applied properties). Do **not** turn the semantic
  layer into custom properties where it should be rules. Semantic *colour* tokens are the
  exception — a colour style genuinely is one value.
- **Leading pairs with the size step, not the role.** Move a role to a different step and its
  correct leading moves with it. Never hard-code leading per role.
- **Measure is capped with `max-width` on the existing left-aligned grid items, never with a new
  container.** `max-width` on a left-aligned grid item moves only its *right* edge, so measure can
  be capped with no layout disruption and no template change.
- **A `.prose` grid container was prototyped and rejected** (2026-07-28). It worked — pixel-exact
  alignment, measure/wide/full tiers, `subgrid` full-bleed panels — but it re-centred the measure,
  which *moved the left edge of text between page types*. That is a whole-site layout decision, and
  it was being driven by one page's measure requirement. It also assumed case studies had no
  right-column content, which is false (`.before-image` at `col 9 / span 4`, `.client-tile` at
  `col 10 / span 3`). Do not revive it outside an explicit layout discussion.
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

Two habits from the scarce era are still worth keeping: **batch aggressively** — one `use_figma`
script can read and write in the same call, so prefer a single comprehensive script over several
probes — and remember that **DESIGN.md, not Figma, is the source of truth.** The MCP keeps the two
in sync; it does not replace the written spec.

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

**Astro migration is confirmed** (decided 2026-07-27) — for DX simplification and consolidation
with Andy's other Astro project. Real benefits: component-scoped styles (which structurally
prevent the CSS leakage this codebase suffers from), built-in image optimization, and typed
content via Content Layer + a Sanity loader.

It stages **mid-project, before the design phase** — not last. The governing principle is that
**a migration should change exactly one thing: the build tool.** Design held constant means the
output can be diffed against live production to prove the port is faithful. Anything built in
Nunjucks *before* the migration gets built twice.

### Phase sequence

Do not run these in parallel, except where noted.

1. **Type foundations + delivery fixes** *(current, on 11ty)* — tokens, modular scale, measure,
   reading experience; plus font subsetting and eliminating the `@import` chain. Portable: `:root`
   custom properties and global semantic role styles stay global under Astro. Body font becomes
   **Noto Serif** (`--font-body`), **Lato** becomes `--font-display`, Open Sans is dropped. Target
   body measure 60–75 characters, body leading ~1.55–1.6. Color primitives can be defined here too.
2. **Content model, taxonomies, URL design** *(parallel with 1 — Sanity-side, SSG-independent)* —
   the **`note` type** plus richer type differentiation; **two SKOS vocabularies** (a hierarchical
   topic vocabulary for tag browsing and related content, and a **semantic type** vocabulary
   distinguishing kinds that share one structural Sanity type — method vs. perspective vs.
   conference note; `sanity-plugin-taxonomy-manager` is already installed); permalink design and
   the 301 map. Design the model; don't build its front end yet.
3. **Visual regression baseline** — snapshot the current site. This is not a deferred nice-to-have;
   it is the instrument that makes the migration verifiable.
4. **Astro migration** — design held constant, diffed against the phase 3 baseline. Note that the
   *deploy* half of CI is unaffected: Astro still emits static HTML, so the tar → scp → atomic
   symlink flow and `mailhandler.php` work unchanged, and `@portabletext/to-html` still runs, so
   `utils/serializers.js` mostly ports. `style/components/*.css` is what dissolves into components.
5. **Design phase, on Astro** — making notes read as notes rather than thin articles, tightening
   the color palette, component-scoped styles, and the front end for the new content model.
6. **Remaining quality gates + POSSE** — performance budgets, accessibility checks, link checking,
   HTML validation; per-taxonomy RSS feeds; **POSSE** (https://indieweb.org/POSSE) syndication to
   LinkedIn, Bluesky, Mastodon. "Automated quality gates" is Andy's preferred framing over "TDD."

**Notes are deliberately deferred** (decided 2026-07-27). Andy is fine waiting months to publish
notes — the priority is getting the site right first. So do *not* ship a stopgap note type on
11ty; the note front end is built once, natively, in phase 5.

### Branching and verification

**`main` is the live production site and stays frozen** except for genuine hotfixes. Do **not**
merge phase work to `main` before the cutover. CI deploys on any push to `main` touching `web/**`,
and Andy does not want to be putting out fires on the old site while building the new one.

The structure:

- **`main`** — current production. Hotfixes only.
- **`next`** — integration branch where the new site accumulates. Never auto-deploys.
- **Phase branches** (`type-foundations`, …) — branch from `next`, merge back into `next` once
  verified. One branch per phase, so each is reviewable on its own.
- **One deliberate cutover merge** `next` → `main` at the end.

Periodically merge `main` → `next` so any production hotfixes propagate and the two don't drift.

**Andy does the visual verification himself** — he runs a branch locally and diffs it against the
live production site. Get changes green and integration-verified, then hand him the specific
eyeball steps rather than asking him to check things you could have checked.

Consequence worth planning for: nothing on `next` is ever deployed, so **nginx config, 301
redirects, and CI build behavior cannot be verified locally.** A staging deploy will be needed
before cutover, particularly for the Astro migration and the redirect map. Raise this in phase 3–4
rather than discovering it at cutover.

Branch names are plain kebab-case, no prefix (`type-foundations`, `add-php-mail-support`). Commit
subjects use conventional-commit prefixes (`feat:`, `chore:`). **Commit and push only when asked.**
`origin/dev` (Aug 2025) and `origin/staging` (Mar 2024) are abandoned — don't build on them.

**Sequencing constraint from POSSE:** syndicated copies link to canonical permalinks permanently,
so **URL design must land before notes go live** — which pulls the path-level 301 work earlier,
closer to the content model than to the end. Microformats2 (`h-entry`/`h-card`) sits alongside the
existing JSON-LD without conflict.

**Decided against:** the **domain change to andyfitzgerald.net is off** (2026-07-27). The IA changes
Andy wants don't justify the cost and risk of a hostname migration on top of everything else. Work
stays in **this** repo; no fork. Path-level 301s are still needed for IA-driven path changes, and
Andy wants nginx guidance on doing those cleanly and scalably.

## Look and feel

Andy's read is that the site is **already typography-driven and lightly styled** — closer to a
digital garden or blog than a corporate site. So the reframe is carried mostly by content and IA
plus tightening, not a visual overhaul. Don't propose a redesign.

Colour is settled and specified in [DESIGN.md](DESIGN.md). The brand blue `#4e9dbc` is **retained**
— Andy has tuned it over years, and changing it is explicitly a separate future project, not part of
this work. Two consequences to remember: `--blue-500` can never carry body-size text nor sit behind
white text (3.06 against a 4.5 requirement), and the footer and mobile nav currently violate that.
Alternatives for those two surfaces are Andy's to explore in Figma.

**The grid must stay simple and flexible** (stated 2026-07-28). Andy wants to keep iterating and
exploring layout ideas over time, so the grid should not become intricate or highly constrained.
This is a first-class requirement, not a preference. A corollary: **typography decisions must not
drive grid decisions.** Cap measure within the existing layout rather than restructuring layout to
serve measure. Layout and page-template changes get discussed against the whole page inventory —
index, detail, singleton — not derived from one page type.

## Known debt

Documented from a measured audit on 2026-07-27 (`web/style/`, verified in-browser):

- **CSS ships as 20 render-blocking `@import` requests.** Eleventy only passthrough-copies
  `style/`, so there is no bundling and no minification.
- **2.7 MB of unsubset fonts.** All four variable files declare `font-stretch: 100%`, so the
  `wdth` axis is paid for and unusable. `Lato-Medium.woff2` is 203 KB (7× Regular/Bold) and went
  unused on article pages while being preloaded on every one. The body font was not preloaded.
  `@font-face` uses the obsolete `format('woff2 supports variations')` syntax.
- **Measure is uncontrolled** — no `max-width` on prose anywhere; it's a side effect of grid
  column spans. ~73 characters at 1600px but **~96 at 959px**, where prose widens to 12 columns
  while line-height *tightens* from 1.75 to 1.5. The 60rem breakpoint works backwards.
- **`h4`/`h5` are author-selectable in Sanity but unstyled in CSS.** `h4` renders in the body font
  at body size; `h5` renders *smaller* than body text. `h4` already appears in published content.
- 10 hand-picked font sizes on no modular ratio; `h2` resolves to four different line-heights
  depending on context. No `letter-spacing` anywhere in the codebase.
- `grid-column` declared on the global `h2` in `base/typography.css` — layout concern in a base
  type file.
- Dead Sass-era commented blocks in `layout/wrap.css` and `base/typography.css`, referencing
  `$white` and `@include segment`. The `blockquote` block has improperly nested comments where an
  inner `*/` closes the outer comment early — currently inert, but fragile.
- Several size comments are numerically wrong (`2rem /* 28 px */`, `1.375rem /* 23 px */`) or use
  `pt` where the unit is `px`.
- **Colour contrast failures on the live site** (computed 2026-07-28, WCAG 2 AA). `--blue`
  (`#4e9dbc`) is the central problem — it reaches only **3.03:1** on white, so it fails the 4.5:1
  body-text threshold both as a foreground and as a background:
  - link colour and link hover (`--blue` on white) — 3.03, needs 4.5
  - mobile nav (white on `--blue`) — 3.03, needs 4.5
  - button hover (white on `--blue`) — 3.03, needs 4.5
  - `--alert-text` on `--alert-bg` — 3.70, needs 4.5
  - `--eyebrow-gray` on white — 4.49, needs 4.5 (borderline miss)
  It does pass 3:1 for large text, so it is usable for headings. Everything else passes:
  body text 18.70, `--dark-blue` 10.52, `--medium-gray` 5.87.
- Three greys (`#777676`, `#646464`, `#2b2b2b`) with no systematic relationship, and
  `--light-gray` is an `rgba()` of `43,40,40` — a value that matches none of the named greys.
- CI: the release-cleanup **comment** is stale — it says "keep 5 most recent" but commit `5e9fac8`
  deliberately changed `tail -n +6` to `+4` to keep 3. The code is intentional; fix the comment.
- CI: deploy writes `.env` containing the Google OAuth client secret and refresh token as
  `chmod 644` — world-readable on the droplet. `640` owned by the web group would be tighter.
- CI pins Node 20 while `studio/` declares `engines: node >= 22`, and `npm ci` runs against
  `web/package-lock.json` rather than the workspace root lock, so the two can drift.
