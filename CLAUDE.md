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

**Revised 2026-09-09. The split is now SEAMS and SURFACES, not who types what.**

Two earlier arrangements, kept because they explain the direction of travel. The original rule was
never to write code into the repo at all — suggest it in chat for Andy to retype — which suited the
design work, where every decision was learning-dense. **2026-08-17** replaced that with "write code,
but layout mechanics and the cascade are Andy's to type," on the grounds that hands-on work is how
he learns.

That second rule has now outlived its usefulness in one direction. **Reviewing a real, working
artifact turns out to teach more than typing one from a description does** — and it is far faster.
So the surfaces move, and what stays with Andy is the joints.

| | |
|---|---|
| **You draft** | **layout mechanics and the cascade**, components, markup, page templates — plus queries, tokens, config, boilerplate and repetitive sweeps |
| **Andy decides** | **the seams**: component boundaries, the content model, URL and id design, semantics and accessibility, and where a value lives |

**Draft the UI, then hand it over.** Build the thing, get it green and integration-verified, and let
him respond to something real. Do not wait to be invited — for surfaces, the invitation is standing.

**The invitation is NOT standing for seams.** Surface those as decisions with a recommendation
*before* building past them, and let him answer. A seam is anything where the question is "what is
this, and what does it belong to" rather than "how should this look or behave": whether a treatment
gets promoted to a shared component or stays local, what a field means, what a URL or a fragment id
addresses, which element carries meaning, whether a number is a token.

Two consequences worth stating, because they are easy to get backwards:

- **Content modelling in Sanity is his**, unless he asks. Propose shapes, name overlaps and gaps,
  hand him a drop-in object if he wants one — but do not edit the schema or the data on your own
  initiative.
- **A seam discovered mid-draft stops the draft.** If building a surface turns up a boundary
  question, say so and recommend; don't quietly decide it because you were already typing.

### Cadence is the constraint, not volume

> **Reviewable pieces at a reviewable cadence. Never write pages of code at once and ask him to
> accept it.**

- One coherent piece, then **stop and let him look.** When in doubt, smaller.
- **Say what you're about to write before writing it** — a sentence or two on the shape, so a wrong
  direction costs a message rather than a file. That is a HEADS-UP, not a request for permission:
  for surfaces, state the shape and build it in the same turn. For seams it is a real question, and
  the turn ends there.
- **If the pace is too slow he will say so.** Absent that, assume he wants to see the changes — err
  toward pausing, never toward batching.
- **Prototype in the scratchpad, not the repo**, when the point is to find out whether something
  works.

**Reviewing what Andy writes is high value** and always welcome. Offer it.

Teach the *why*. Assume strong fluency in IA, semantics, structured content, and taxonomy
(he works with SKOS professionally). Do not assume front-end idiom or performance intuition —
he has named performant, scalable CSS/HTML as not his strong suit and wants to get better at it.

**Now that he reviews rather than types, the *why* has to travel in the artifact.** It used to
arrive in chat, before he wrote the code. It now belongs in the comment beside the rule and in the
handoff message — which is why the comments in this build explain reasoning, name what was tried
and rejected, and record what a failure would look like. That density is deliberate and is the
learning channel; do not thin it out.

**He values pushback explicitly.** Offer new angles and challenge assumptions. If he reaffirms
a decision after you've raised a concern, that's his call — proceed with the full request.

## Stack and layout

Workspace monorepo, `type: module` throughout, **pnpm + Node 24**. One generation since the phase 6
cutover: the Astro site and the Studio that feeds it.

| Path | What |
|---|---|
| `web/` | **The Astro site.** Static in production, SSR for the preview environment |
| `web/src/` | Pages, layouts, components, `lib/`, `styles/`, and `sanity/` — the `loadQuery` wrapper, queries, fragments |
| `web/server/` | `contact.php` + `composer.json` — the mail endpoint, shipped beside the static build and never served |
| `web/scripts/` | Hand-run tools, never the build: `parity.mjs`, `phrase-candidates.mjs`, `subset-fonts.sh` and its `font-sources/` |
| `web/sanity.types.ts` | TypeGen output — written by `pnpm typegen`, committed, never edited |
| `web/afc-preview.service` | The systemd **user** unit that runs the SSR preview on the droplet — installed by `deploy-preview.yml` on every deploy |
| `studio/` | **Sanity Studio on the `production-26` dataset** — where the content model lives |
| `studio/schemas/` | Content model — `documents/`, `objects/` |
| `nginx/` | Server config, authored here and installed by `nginx/deploy.sh` — never edited on the droplet |

**The 11ty site and Studio v6 left the tree at the cutover rename** (2026-09-28, Andy's call: git
history keeps them). The last commit that has them is **`06cd8e5`** — the one before
`refactor: rename web-next to web and studio-next to studio`. Read it with
`git show 06cd8e5:web/<path>`, or check it out beside this one:

```bash
git worktree add ../afc-11ty 06cd8e5
```

It remains the best record of what the old site *did* — the JSON-LD it emitted, the Sanity queries it
ran — and it is still **not a source of patterns**: do not carry its CSS, its component boundaries or
its template structure forward; see Current direction. It had passed through Jekyll and a Sass build
before Eleventy, so anything in it may be older than it looks.

**Not everything came through git.** `__source_docs/` (450 MB) and `__web_2022/` were gitignored in
the old `web/`, and so were a January 2024 `production` dataset export and the old trees' local
`.env` files. All of it — untracked leftovers included — was moved intact to
`~/Archives/afc/repo-local-2026-09-28/` on Andy's machine, not deleted.

## Commands

```bash
pnpm --filter web dev        # Astro dev server
pnpm --filter studio dev     # Sanity Studio on the production-26 dataset, :3030
pnpm typegen                 # regenerate web/sanity.types.ts — after any schema or query change
pnpm parity                  # render-every-document check — after `pnpm --filter web build`
pnpm links                   # link check over the build — after `pnpm --filter web build`
pnpm validate                # HTML validation over the build — needs Java 11+ (Temurin 21 here)
pnpm a11y                    # accessibility (axe) over the build — needs Google Chrome
pnpm budgets                 # byte budgets over the build — the numbers live in the script
pnpm format                  # Prettier, repo-wide — fixes what the Prettier check reports
```

The code checks in `.github/workflows/checks.yml` run on every branch push, and each one runs
locally as it does in CI: `pnpm typegen` then `git diff --exit-code web/sanity.types.ts`,
`pnpm --filter web check`, `pnpm --filter studio typecheck`, `pnpm exec prettier --check .`.
On a branch it also builds the site and runs `pnpm links`, `pnpm validate`, `pnpm budgets` and
`pnpm a11y`.

**Java is a local dependency now**, for the HTML validator only: Temurin 21, installed with
`brew install --cask temurin@21` (2026-10-08). Not the plain `temurin` cask, which tracks the
newest release rather than a long-term-support one; CI pins 21 with `actions/setup-java`.

**So is Google Chrome**, for the accessibility check: the installed one, in `/Applications` or on
the PATH, with `CHROME_PATH` to override. Nothing is downloaded. CI uses the Chrome that GitHub's
runner image preinstalls.

Deploy is `.github/workflows/deploy-astro.yml` — builds the static site and the PHP dependencies,
tars a two-directory release (`public/` + `server/`), scps it to the droplet and swaps an atomic
symlink at `/var/www/afc-production/html`. Triggered by pushes to `main` touching `web/**` and by
Sanity `repository_dispatch` webhooks per document type. A `site` job runs the site gates against
the same release **beside** the deploy, so a failure turns the run red without holding the site —
see phase 8.
**nginx config is deployed separately and by hand**, with `nginx/deploy.sh` — its header says why
that is not in CI. `build-prod.yml`, which deployed the 11ty site from `/var/www/afc`, was retired
at the cutover.

The preview is `.github/workflows/deploy-preview.yml` — builds the SSR site with its server
dependencies bundled, runs the release from a directory with no `node_modules` against every sitemap
URL before shipping it, then activates it under the `afc-preview` user unit on `127.0.0.1:8081`,
health-checks it and rolls back if it is not serving. Triggered by pushes to `main` touching `web/**`
and by `workflow_dispatch` on any ref — **no** `repository_dispatch`, since SSR reads drafts per
request. A push to `main` touching `web/` therefore deploys BOTH hosts.

## Conventions and constraints

- **Hand-authored CSS and hand-authored UI components. No Tailwind, no shadcn, no component
  libraries.** This is deliberate — staying close to the core languages is a project goal.
  Don't propose these as shortcuts.
- Plain CSS with **native nesting** (`&`, nested `@media`) — no preprocessor.
- **Two tiers, and only two.** Global: primitive tokens, semantic role tokens, and the element-level
  role styles (`h1`–`h4`, body prose, `nav`, the rhythm mechanism). Everything else is a
  **component-scoped style in the component that owns it.** There is no global `components/` layer,
  no page-level stylesheets, and no import chain — that structure belonged to the 11ty build and is
  deliberately not carried forward.
  `nav` was promoted out of the component tier in phase 3, once the masthead and the footer had
  independently written the same rules. **A second consumer is the trigger for promotion**, and it
  runs the other way too: phase 3 moved `--logo-size`, `--nav-padding` and `--role-masthead-name`
  *out* of tokens.css, because a value with one consumer is not a token.
- All font sizing in `rem`, never `px`.
- **Never write a font family name in CSS. Use `var(--font-prose)` or `var(--font-heading)`.** Astro's
  Fonts API scopes the family it registers — the real name is `Lato-c04d3693128bd5b6`, not `Lato` — so
  `font-family: 'Lato'` matches nothing and **fails silently**, falling through to a system default
  that looks plausible. This already caught the specimen page's inline SVG. It applies to SVG
  presentation attributes too, where `font-family="…"` takes no `var()`; use `style="font-family: …"`.
- Andy maintains a **parallel design system in Figma** (variables + text styles). CSS mirrors that
  two-layer idea: **primitive tokens** and **semantic role styles** that reference them.
- Linked Data matters here. Semantics and structured markup are first-class concerns, not
  nice-to-haves — **JSON-LD carried over from the 11ty build's `linked-data/` partials, joined by
  microformats2**.
  **Both, and the reason is webmentions** (questioned and reaffirmed 2026-08-26): the two serve
  different audiences and neither substitutes for the other. JSON-LD is what search engines read; mf2
  is what the IndieWeb reads, and **Andy wants to support webmentions**, which makes mf2 load-bearing
  rather than decorative. mf2 was briefly cut from this file on the grounds that one vocabulary is one
  place to be wrong; that was wrong on the facts. See Branching → POSSE for what specifically depends
  on it, and note the structural constraint it puts on detail pages: **`h-entry` needs one element
  containing both the title and the body.**
- **Two-space indentation everywhere, CSS included.** One Prettier style repo-wide — no semicolons,
  single quotes, 100 char width — configured at the root and mirrored in `web/` only to add the
  Astro plugin. The old rule here said tabs in CSS; that described the 11ty build's `web/style/`,
  now in git history. Don't reintroduce a per-language override.

## Design system

**[DESIGN.md](DESIGN.md) is the single source for design direction** — every token value plus the
rules that govern a build: the two-layer principle, the modular scale and its clamps, the leading
ramp, measure, the grid, vertical rhythm, color roles, components, and the standing do's and don'ts.
**Read it before touching type, color, spacing or layout, and do not restate its rules here** — a
second copy is just something to get wrong and to fall out of sync. If a design rule seems to be
missing, add it to DESIGN.md rather than to this file.

**[docs/decisions/](docs/decisions/) holds the reasoning behind settled design decisions**, split by
theme — color, typography, layout, components. DESIGN.md links to them. **Read a record only when a
decision it covers is being questioned, excepted, or changed** — not as background for ordinary work.
If you find yourself re-deriving a value that has a record, read the record instead. **When a decision
changes, supersede the record rather than editing rationale back into DESIGN.md** — that growth is
what this split exists to prevent.

**[docs/open-questions.md](docs/open-questions.md)** tracks what is *not* settled. Consult it when
work approaches one of those areas; it is not general background either.

**The authority chain changed when the CSS landed in phase 2.** It splits by *kind of thing* rather
than by topic:

- **Code is truth for values.** `web/src/styles/tokens.css` is where color, spacing, radius, type
  sizes and grid actually live. **If it and DESIGN.md disagree — the front matter or the dark-mode
  table — the CSS is right.** This is why tokens.css carries the invariant that it contains nothing
  but custom-property declarations: it keeps the front matter useful as a *diffable record* instead of
  letting it become a second spec.
- **DESIGN.md is truth for rules.** The clamps, the leading ramp indexed by measure, measure itself,
  the rhythm mechanism, the two-layer principle, the component relationships, and the standing do's
  and don'ts. Neither Figma nor CSS records *why* or *when*, and this is what DESIGN.md is genuinely
  good at.
- **Figma is a reference, not an authority** — and those are different things. It cannot win an
  argument against code or DESIGN.md, and no *new* design work starts there; that happens in the
  browser against the built system. **But it remains the most detailed description of anything not yet
  built, and you should absolutely still open it.** For most phase 4 components the boards are the only
  place composition, states, adjacency and layout are drawn at all — nothing in code or DESIGN.md
  replaces that, and there is nothing for them to contradict until the component exists. Read them for
  *what a thing is made of*; where they disagree with DESIGN.md on a **value or a role**, DESIGN.md
  wins. The boards carry known mis-bindings — see [docs/figma-notes.md](docs/figma-notes.md), which
  catalogues them.

**The failure mode this replaces:** the old chain named Figma as the source of truth for color roles,
which invited someone to "fix" a working CSS value to match a dead Figma variable *on this file's
authority*. The one-time drift diff at the start of phase 2 found all 105 variables in agreement
across both themes, so nothing was lost by freezing Figma there.

Figma mechanics and the constraints they imposed live in [docs/figma-notes.md](docs/figma-notes.md) —
still the thing to read before touching that file, and now also the record of why parts of it look
odd.

What belongs here is only the working protocol — where the tools are and how to conduct the work:

- **Design specimens live in git history since the cutover**, at `web/__design-specimens/` in
  commit `06cd8e5` — they left the tree with the old `web/`, which also held the fonts they load.
  They **must be served over HTTP** — fonts will not load from `file://` in Chrome. Check the old
  tree out beside this one, serve its `web/` directory and open `/__design-specimens/<file>`
  (verified 2026-09-28: the specimen and its fonts both return 200):

  ```bash
  git worktree add ../afc-11ty 06cd8e5 && cd ../afc-11ty/web && python3 -m http.server 8124
  ```

  `git worktree remove ../afc-11ty` when done.

  - `type-scale-specimen.html` — the full type system on real prose: base 20/18 toggle, fixed/fluid,
    heading-face toggle, h4 treatments, measure guides, the sidebar-vs-full-width layout comparison,
    and **the rejected `.prose` container prototype** with its wide/full tiers and `subgrid`
    full-bleed panel. Directly relevant to any grid or layout discussion.
  - `color-specimen.html` — the palette applied to real page elements with live contrast computation
    and pass/fail badges per pairing.

  They reference the fonts at `../assets/fonts/` in that same old tree, so nothing is duplicated.

### Figma connection — what to use it for, and what not to

A Figma MCP connection is available and authenticated as Andy (Full seat, "Andy Fitzgerald
Consulting" team). Design file: `pPZPGT6EpSaLkoUDK8HMMp`.

Andy upgraded to a **Professional** seat on 2026-07-28, which lifted the Starter plan's cap of 6 MCP
calls per month and unlocked **variable modes** (up to 4 per collection). Calls are no longer scarce.

One habit from the scarce era is still worth keeping: **batch aggressively** — one `use_figma`
script can read and write in the same call, so prefer a single comprehensive script over several
probes.

On authority, see the chain under **Design system** — and note that this section was written while
Figma was still the source of truth. **Since phase 2 it is a reference rather than an authority**:
code is truth for values, DESIGN.md for rules. So the MCP no longer keeps anything in sync, reading
Figma is no longer how you check DESIGN.md, and writing tokens back into it is maintaining a
historical record — do that only when Andy asks.

**None of which makes it less worth reading.** `get_metadata` and `get_screenshot` over the component
boards are the primary way to find out what a phase 4 component is actually made of, and that stays
true for the whole build. Demoting Figma removed its vote, not its content.

**Use Figma's design-to-code tooling with restraint** — `get_design_context`, `add_code_connect_map`,
`get_code_connect_suggestions`, `send_code_connect_mappings`. It is the Figma
MCP's headline feature and it works at odds the purpose of this project: generated markup
and CSS would bypass the hands-on involvement Andy values. Reading a node for reference and
discussing it is fine; generating code from it is not. Do not propose direct code generation as a shortcut.

**Do** use it for:
- `get_variable_defs` — read variables and diff them against DESIGN.md. This caught six divergences
  while Figma was live, and the final full diff at the start of phase 2 found all 105 variables in
  agreement. **Now that Figma no longer holds authority over values there is nothing left to sync**, so
  reach for this only to answer a historical question — *what did this used to be?* — never as a
  routine check. This retires the variable diff specifically; it says nothing about reading the boards.
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

**Do not carry CSS or componentization decisions over from the 11ty build.** They reflect older
habits and are explicitly not the target. The clean slate is the point. (This line said "from
`web/`" until the cutover rename, when `web/` became the Astro site — the instruction is about the
old tree, now at `06cd8e5`, not the directory name.)

**What this costs, and what replaces it.** There is no longer an automated way to prove the port is
faithful, because it is not meant to be. Visual verification is against DESIGN.md and the Figma
boards, by eye. **Content parity becomes the verification instrument instead** — every document of
every type must render — because a changed model breaking a published document is the failure mode
that actually bites.

**Two datasets, deliberately not synchronized.** Model iteration happens on the duplicated
`production-26` dataset while `production` serves the live site. Migration scripts were considered
and **declined**: Andy is publishing little or nothing before cutover, and hand-migrating one or two
articles is cheaper than maintaining and debugging a migration suite. At cutover, `production-26`
becomes the live dataset.

### Phase sequence

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
   deliberately not the bodies themselves. **[docs/search-ranking.md](docs/search-ranking.md) is the
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
   [docs/phrase-candidates.md](docs/phrase-candidates.md); it never feeds the build. Note also that
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
          ├─ Clipping
          └─ Book Note
   ```

   Topic is a separate 3-level scheme under **Engineering / Design / Discovery / Strategy**, and
   `docs/urls-and-filtering.md` filters on **direct tags only** — no ancestor roll-up. Content is
   tagged at leaf and mid level and **never at a top concept**, verified, which is what keeps that
   rule from producing a "Design" chip that competes with an "Information Architecture" one.

   **A consistency invariant falls out of the Genre hierarchy, and it is worth a build-time check:**
   a document's genre should sit under the top concept matching its structural family — a document
   stored as `article` should not carry a Presentation-branch genre.

   **RESOLVED (verified 2026-09-09).** Four documents violated this while `presentation` did not
   exist — three Interviews and one Talk, all stored as `article` — and the Insights index
   over-collected by that many. No article carries a Presentation-branch genre now: the only genres
   in use there are Perspective, Method and Conference Themes. The corpus stood at 42 insights
   (30 articles, 5 notes, 7 case studies), 4 presentations and 41 events.

   **Re-measured 2026-09-14: 42 insights (unchanged), 10 presentations, 47 events.** The
   Presentation branch is where the migration is moving — and **35 of those 47 events are not
   referenced by any presentation**, which is the bulk of the modelling work still outstanding.
   Events render no page of their own, so an unattached one is invisible rather than broken.
   Expect these numbers to move again; re-measure rather than quoting them.

   The invariant is still worth a build-time check, because nothing enforces it — the Studio will
   happily accept a Presentation genre on an `article` again. It just has no violations to find
   today.

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
   deleted them from `production-26`; the old `production` dataset still holds all four**
   (checked 2026-10-08), so that is where to read them when Consulting's positioning is worked out.

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
     hotspots. See docs/feeds-kickoff.md → Settled: heroes and posters lead the entry.*

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

   **How the two generations compare is [docs/eleventy-astro-comparison.md](docs/eleventy-astro-comparison.md)**
   (measured 2026-10-06): code, page weight, droplet resources and accessibility, and how to rebuild
   the old site to measure it again. Start there before quoting any before-and-after figure. The
   11ty release no longer exists on the droplet, so its numbers can only come from a rebuild.

   **THE SSR PREVIEW IS DONE (2026-09-29), AND WITH IT PHASE 6.** `preview.` is Astro's SSR build
   behind an nginx proxy, and visual editing works end to end from the deployed Studio: overlays,
   click-through to the document, reload on edit, navigation sync. The plan and what was measured
   along the way are [docs/ssr-preview-kickoff.md](docs/ssr-preview-kickoff.md); where it departed
   from ux-methods, and which departures apply back, is
   [docs/ux-methods-notes.md](docs/ux-methods-notes.md). Five departures from that plan, each decided
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
     not adopted** — though the old `production` dataset still has both; see Consulting under
     phase 4. **A third orphan turned up while checking:** `media.tag`, one "banner" tag left by the
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
   **"per-taxonomy RSS feeds" means feeds per CONCEPT — EVALUATED, NOT BUILT (Andy,
   2026-10-09).** There is no user warrant for them yet; build them if one emerges. The
   measurements and a ready recommendation are in docs/feeds-kickoff.md → *Per-concept feeds*,
   so a revisit starts there rather than from scratch. Five feeds shipped 2026-09-13 —
   `/feed.xml`, `/insights/feed.xml`, `/insights/feed-articles.xml`,
   `/insights/feed-notes.xml`, `/presentations/feed.xml` — and those are section and type
   feeds, not taxonomy ones. `RssBand`'s `buttonTarget` is content precisely so a page can
   point at a per-taxonomy feed without a code change if they arrive. See
   [docs/feeds-kickoff.md](docs/feeds-kickoff.md), which also carries two live
   carry-forwards: nginx must serve the feeds as `application/atom+xml`, and the YouTube
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

   **External links are deferred to their own warning-only piece** — 325 URLs on 132 hosts
   (2026-10-08). Another site's outage is not a defect here, and checking them well needs
   retries, rate limits and a tool built for it; lychee is the likely one. A `schedule:` trigger
   has the 60-day catch noted under `u-syndication` below.

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
   spans — not the comma that `docs/eleventy-astro-comparison.md` had blamed. And the
   **close-search button**, whose visible text is "esc", is now named "Close search, esc", for
   voice-control users who say what they see. The check takes about 125s on the runner against
   45s on a Mac, the slowest gate by far; beside the deploy, that delays only the report.

   **BYTE BUDGETS ARE BUILT (2026-10-09)**, the fourth site gate, and with them **the quality
   gates are complete**: `web/scripts/check-budgets.mjs`, run with `pnpm budgets` after a build.
   It weighs the build in brotli-compressed bytes against six budgets, and **the numbers live in
   the script** (Andy, 2026-10-09) — a value with one consumer is not a token, and the reason for
   each sits beside it. Its header records the reasoning; what is worth not re-deriving:

   - **Bytes, not timings or scores** (Andy, 2026-10-09). Bytes are deterministic — the runner and
     a Mac measured identically, to the tenth of a KB. LCP sat at 1.8–2.4s against Google's 2.5s
     line, so a timing gate would fail at random, and a Lighthouse score does not say what got
     worse. Timings are still measured by hand; docs/eleventy-astro-comparison.md says how.
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

   **What is left in phase 8 is the warning-only external link check** deferred above. Per-concept
   feeds were evaluated and set aside (see the top of this entry), and the service worker was
   declined (see below).

   **POSSE IS DEFERRED (Andy, 2026-10-09)** — to after more writing on the new site. It was
   researched and planned, and nothing was built:
   **[docs/future-work/posse-and-syndication.md](docs/future-work/posse-and-syndication.md) is the
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

**Two homes for planning notes** (Andy, 2026-10-09):

- **`docs/future-work/`** holds follow-on work that was planned and deliberately deferred, each
  file written so a later session can pick it up cold. It starts with
  `posse-and-syndication.md`.
- **`docs/astro-migration/`** is where the phase kickoffs and planning notes in `docs/` — the
  `*-kickoff.md` files and their kin — move **once every phase is confirmed closed**. Not before,
  and not phase by phase: they cross-reference each other and CLAUDE.md, so the move is one pass
  that updates the links with it.

### Deploy shape — static production, SSR preview, one droplet

**Ported from `andybywire/ux-methods`, where this is already working.** One codebase, two build
modes selected by environment:

| | `ASTRO_OUTPUT` | Served by | Visual editing | Indexed |
|---|---|---|---|---|
| production | `static` | nginx, static files | off | yes |
| preview | `server` | a systemd user unit + Node, behind an nginx proxy, on the same droplet | on | `noindex` |

This is what makes visual editing possible **without giving up a static production site.** The
official Astro visual-editing integration requires `output: "server"` because draft mode depends on
per-request cookie checking — running that in front of the public site would trade the tar → scp →
symlink deploy for a supervised Node process. Pointing Presentation at `preview.` instead keeps
production static and bulletproof.

Copy the workflow pair from `ux-methods` rather than reinventing it, but **fix three things**: both
workflows pin Node 22 and the preview deploy script does `nvm use 20` — use 24 throughout; both
trigger on identical paths so every push builds twice; and the droplet gains a dependency on Node,
pnpm and PM2 surviving reboots.

**Built 2026-09-29, and it kept the shape but not the parts.** Node 24 throughout; the two workflows
share triggers but build different artifacts for different hosts, which is the point rather than the
duplication ux-methods has; and the reboot dependency shrank to Node and one lingering user unit —
no pnpm and no PM2 on the droplet at all. See Phase 6 above for the five departures and why.

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
containerizing means either a sidecar sharing webroot and cert volumes or host certbot with mounts —
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
  **Enforced since 2026-10-08:** TypeGen's `path` covers `web/src/sanity/` only, so a query
  defined anywhere else gets no type at all. Widen the path rather than let one live elsewhere —
  see `studio/sanity.cli.ts`.
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
`width` and `height`. The 11ty build's `clientLogo.js` shortcode had most of the logic. Sanity's
`auto=format` still negotiates AVIF/WebP.

**Astro's `<Image>` still applies to repo assets** — logo, OG images, anything checked in. Two
pipelines, each doing what it is good at.

**Dropped, not verified (2026-08-25).** Andy's call: neither high-impact nor certain enough to spend
phase 3 on. Images are served from `cdn.sanity.io`. The builder is still a single wrapper module, so
this stays a one-line change if it comes back. The rest of this note is kept as the record of what
would need confirming.

**Was: to verify in phase 3 — serving Sanity images from a Cloudflare-CNAMEd subdomain.** The intent is
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

**The control lives in the footer** (decided 2026-08-21), so the `ThemeToggle` component lands with
the footer in phase 3 rather than in phase 2. Phase 2 shipped the mechanism — the three CSS blocks and
the head script — plus a throwaway control in the specimen page purely to exercise it. All three
blocks are verified, including the case the structure exists for: OS dark with `data-theme="light"`
correctly resolves to light. **"System" is the absence of a choice**, not a third stored value: it
removes both the attribute and the `localStorage` key, so there is no third state to keep in sync.

### Branching and verification

**`main` is the site** (since the phase 6 cutover, 2026-09-28). `deploy-astro.yml` deploys it to
production on every push to `main` touching `web/**` and on every Sanity publish webhook — so **a
push to `main` IS a production deploy**, which is one more reason commit and push are Andy's call.

- **`main`** — the only long-lived branch.
- **Work branches** — branch from `main`, one coherent piece of work each, merged back once
  verified. A merge leaves you on `main`, so check the branch when a new task starts.
- **`next`** — **retired at the cutover merge** (`0f8884e`). It was the integration branch while
  the Astro site was built beside the live 11ty one, and it deployed the static staging rehearsal.
  Don't build on it, or on `origin/dev` (Aug 2025), which was abandoned before it.
- **The preview host tracks `main`** (since 2026-09-29): `deploy-preview.yml` deploys it on every
  push to `main` touching `web/**`, with `workflow_dispatch` on any ref to rehearse a branch before
  merging it (Andy, 2026-09-28). GitHub runs `workflow_dispatch` only for a workflow file that
  exists on the default branch, which is why the first run was the merge.

**nginx is deployed by hand**, with `nginx/deploy.sh` from a laptop, never by CI — its header says
why. `validate-nginx.yml` runs `nginx -t` on a push to any branch touching `nginx/`, so a config
that cannot load is caught on the branch, before anything is installed. **`checks.yml` follows the
same pattern for code and the built site** (2026-10-08): every branch push, deploys nothing,
gates nothing — a red run says not to merge. See phase 8.

**Andy does the visual verification himself.** Get changes green and integration-verified, then hand
him the specific eyeball steps rather than asking him to check things you could have checked.

**The URL contract is verified against the live apex now**, not only against staging — through
Cloudflare AND pinned to the origin with `--resolve`, because the two can differ. The method, and
the 93-URL sweep that passed both ways at cutover, is recorded in `nginx/redirects.conf`.

Branch names are plain kebab-case, no prefix (`type-foundations`, `add-php-mail-support`). Commit
subjects use conventional-commit prefixes (`feat:`, `chore:`). **Commit and push only when asked.**

*The pre-cutover model — `main` frozen on the 11ty site, `next` as integration, phase branches off
`next`, one deliberate `next` → `main` merge — ran from phase 0 to the cutover and is in git history.
Its rule against merging `main` → `next` never came into play: `main` had no commits `next` lacked.*

**Sequencing constraint from POSSE:** syndicated copies link to canonical permalinks permanently, so
**URL design must land before notes go live** — which is why permalink design sits in phase 1 rather
than emerging page by page.

**Microformats2 (`h-entry`/`h-card`) sits alongside the existing JSON-LD without conflict**, and
**webmentions are why it is not optional** (2026-08-26). Worth being precise about what reads what,
because "webmentions need mf2" is true in a roundabout way:

- **Webmention itself is protocol-only** — an HTTP POST carrying `source` and `target`. It mandates no
  vocabulary at either end.
- **mf2 is how a mention is interpreted.** A receiver fetches the *source* page and parses its mf2 to
  tell a reply from a like from a repost, and to get the sender's name and photo. So other people's
  mf2 powers what shows up here, and **this site's mf2 is what lets its own mentions display properly
  elsewhere.**
- **Bridgy is the concrete dependency.** Bridgy Publish reads `h-entry` / `p-name` / `e-content` off
  the page to build the syndicated copy, and Bridgy's backfeed matches replies to posts via
  `u-syndication`. Both are mf2 only.

**The structural consequence, and it is not free:** `h-entry` needs **one element containing both
`p-name` (the h1) and `e-content` (the body)**. On the article page those sit in two different bands
so that the hero can be reordered between them, and no element contains both — see
`web/src/pages/insights/[slug].astro`. Resolving that is a real markup decision, not a class
attribute.

**Decided against:** the **domain change to andyfitzgerald.net is off** (2026-07-27). Also **against
a separate v3 repository** (2026-08-17) — same site, same domain, and a single history running
Jekyll → 11ty → Astro is the more useful record. Splitting it would also mean re-establishing deploy
keys, Actions secrets and Sanity webhooks at the worst possible moment.

## Look and feel

Andy's read is that the site is **already typography-driven and lightly styled** — closer to a
digital garden or blog than a corporate site. So the reframe is carried mostly by content and IA
plus tightening, not a visual overhaul. Don't propose a redesign.

**Color, type, grid and rhythm live in [DESIGN.md](DESIGN.md)** — values, rules and rationale
alike. Don't restate them here.

**Layout and page-template changes get discussed against the whole page inventory** — index,
detail, singleton — not derived from one page type. That is a rule about how the conversation goes,
which is why it sits here; the layout constraints it protects are in DESIGN.md.

## Known debt

**Most of the old debt list has been deleted rather than carried forward.** It described the 11ty
build's `web/style/` — the import chain, uncontrolled measure, ten hand-picked font sizes, Sass-era dead
comments, the ungoverned grays, the shipped contrast failures. None of it survives a build that
starts from DESIGN.md, and keeping it would only invite someone to "migrate" the thing we are
deliberately not migrating. **If you want to know how the old CSS worked, read the git history.**

What remains is content-model constraints and one measured input.

**The three CI carry-forwards from the 11ty deploy are resolved**, verified 2026-10-08 in
`deploy-astro.yml` and on the droplet. The `.env` is created `640 afc:www-data` by `install -m 640`,
so it is never world-readable even briefly; it was `644` under `build-prod.yml`, which made it a
live security issue rather than a migration note. Three releases are kept, pruned by name. And the
Composer step ships the PHP dependencies with the release. Each is commented in the workflow where
it lives.

**Content-model constraints the new front end inherits:**

- **`h5` was dropped from the schema in phase 1** — `article`, `caseStudy` and `singleton` offer
  `h1`–`h4` only, matching DESIGN.md, so no h5 role is needed. `h4` renders from day one in
  `web/src/styles/base.css`. The residue this note used to warn about — dropping a style from a
  schema does not remove it from published blocks — **was measured on 2026-09-09 and there is none.**
  Zero documents of those three types carry an `h5`. No longer a phase 5 item.
- **Portable Text emits a flat sequence with no section wrappers**, which is why vertical rhythm is
  sibling margins rather than `gap`. This is a constraint on the markup, not a preference — see
  DESIGN.md and docs/decisions/layout.md.

**Fonts — settled in phase 2, recorded because the shape is easy to undo by accident:**

The 11ty build's `web/assets/fonts/` held **2.7 MB** across six files. The Astro site ships **154 KB**
across four. At the cutover rename the four upstream files `subset-fonts.sh` reads moved to
`web/scripts/font-sources/`; Open Sans and Lato Medium went with the old tree.

- **Two families, four faces.** Noto Serif roman and italic (variable `wght 100–900`), Lato 400 and
  700. Open Sans was dropped because DESIGN.md never mentions it, and `Lato-Medium.woff2` because it
  had **no consumer at all** — DESIGN.md's only `fontWeight: 500` role is `display`, which is *Noto
  Serif* and covered by its variable axis. Together those two were ~780 KB of pure deletion.
- **Astro's Fonts API with the `local` provider**, configured in `web/astro.config.mjs`, with
  `<Font>` in `BaseLayout`. `local` rather than `google` on purpose: a downloading provider would be
  cold on every CI run, the same problem recorded against Content Layer and the image cache. What it
  buys over hand-written `@font-face` is **`optimizedFallbacks`** — a metric-matched fallback face per
  weight, derived from the real font metrics.
- **`--font-prose` and `--font-heading` are declared by Astro, not by `tokens.css`.** Don't re-declare
  them there; it would shadow the matched fallback, which is the point of the arrangement.
- **Latin only. There is no Extended-A tier, and reintroducing one would be a regression.** An earlier
  build shipped one for Noto Serif and none for Lato, so a Czech or Hungarian name rendered in real
  Noto Serif in a paragraph and in Helvetica in a heading. Those characters now fall to the
  metric-matched fallback in **both** families, which is uniform and costs nothing.
- **`fallbacks` lists only the generic** (`serif` / `sans-serif`). Astro builds the matched face
  against the generic's canonical font — Times New Roman, Arial — whatever is named ahead of it, and
  that face resolves through `local()`. So any named family in the list sits behind a face that has
  already matched and is unreachable. Georgia and Helvetica Neue were both there, both dead.
- **`web/scripts/subset-fonts.sh` regenerates the four files** and is run by hand, never by the
  build. It pins `wdth=100` out of the Noto Serif variable files before subsetting, because DESIGN.md
  never uses a narrow width. It also pins `SOURCE_DATE_EPOCH`: fontTools stamps `head.modified` with
  the current time, and that 4-byte change perturbs woff2 compression enough that two runs on
  identical input produced 48016 and 48052 bytes. Without it, "the committed files are reproducible"
  is false.
