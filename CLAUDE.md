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
pnpm test                    # unit tests, node:test, every package — no build or dataset needed
pnpm checks                  # all five code gates as checks.yml runs them — before a push, and after ANY Studio upgrade
pnpm parity                  # render-every-document check — after `pnpm --filter web build`
pnpm links                   # link check over the build — after `pnpm --filter web build`
pnpm validate                # HTML validation over the build — needs Java 11+ (Temurin 21 here)
pnpm a11y                    # accessibility (axe) over the build — needs Google Chrome
pnpm budgets                 # byte budgets over the build — the numbers live in the script
pnpm external-links          # external links over the build — lychee in Docker, then a classifier
pnpm format                  # Prettier, repo-wide — fixes what the Prettier check reports
```

The code checks in `.github/workflows/checks.yml` run on every branch push, and each one runs
locally as it does in CI: `pnpm typegen` then `git diff --exit-code web/sanity.types.ts`,
`pnpm --filter web check`, `pnpm --filter studio typecheck`, `pnpm test`,
`pnpm exec prettier --check .`. `pnpm checks` runs all five in that order and names what failed.
**A Studio upgrade upgrades TypeGen**, which ships in `sanity`, so it can change the generated
types with no query touched: regenerate in the upgrade's own commit (2026-11-25; checks.yml's
TypeGen step has the case). **Tests are `*.test.ts` beside the module they test**, run by
Node's own `node:test` with no dependency (2026-11-21, stream 2 of the recommendations work); a
run that finds no test file fails rather than passing on nothing. On a branch it also builds the site and runs `pnpm links`, `pnpm validate`, `pnpm budgets` and
`pnpm a11y`.

**Java is a local dependency now**, for the HTML validator only: Temurin 21, installed with
`brew install --cask temurin@21` (2026-10-08). Not the plain `temurin` cask, which tracks the
newest release rather than a long-term-support one; CI pins 21 with `actions/setup-java`.

**So is Google Chrome**, for the accessibility check: the installed one, in `/Applications` or on
the PATH, with `CHROME_PATH` to override. Nothing is downloaded. CI uses the Chrome that GitHub's
runner image preinstalls.

**And Docker**, for the external link check: lychee runs from the pinned `lycheeverse/lychee`
image, so the Mac installs nothing for it. That check is the one gate NOT in `checks.yml`:
`.github/workflows/external-links.yml` runs it monthly, on demand, and on a push that changes the
check itself — never on a deploy or a publish. See Where the rebuild left things → Quality gates.

Deploy is `.github/workflows/deploy-astro.yml` — builds the static site and the PHP dependencies,
tars a two-directory release (`public/` + `server/`), scps it to the droplet and swaps an atomic
symlink at `/var/www/afc-production/html`. Triggered by pushes to `main` touching `web/**`,
`pnpm-lock.yaml`, `pnpm-workspace.yaml` or the workflow itself, and by Sanity
`repository_dispatch` webhooks per document type. A `site` job runs the site gates against
the same release **beside** the deploy, so a failure turns the run red without holding the site —
see Where the rebuild left things → Quality gates.
**nginx config is deployed separately and by hand**, with `nginx/deploy.sh` — its header says why
that is not in CI. `build-prod.yml`, which deployed the 11ty site from `/var/www/afc`, was retired
at the cutover.

The preview is `.github/workflows/deploy-preview.yml` — builds the SSR site with its server
dependencies bundled, runs the release from a directory with no `node_modules` against every sitemap
URL before shipping it, then activates it under the `afc-preview` user unit on `127.0.0.1:8081`,
health-checks it and rolls back if it is not serving. Triggered by pushes to `main` touching `web/**`,
`pnpm-lock.yaml`, `pnpm-workspace.yaml` or the workflow itself, and by `workflow_dispatch` on any
ref — **no** `repository_dispatch`, since SSR reads drafts per request. A push to `main` touching
`web/`, the lockfile or the workspace file therefore deploys BOTH hosts. So does a merge that edits
either deploy workflow, for its own host: each lists its own file under `paths:`.

**A dependency change is a deploy, even one made only for the Studio**, because the lockfile is
shared by both packages. This passage said "touching `web/**`" alone until 2026-10-22, when a
Studio-only lockfile fix was wrongly expected not to deploy. The workflows' `paths:` lists are the
authority; read them rather than this paragraph if the two ever disagree.

**The workflows' actions and tokens are locked down** (Andy, 2026-10-10). Every action not owned by
GitHub is pinned to a full commit SHA with its release as a trailing comment, `actions/*` stays on
major tags, every workflow's token is read-only, and both deploy jobs get none. **The record is
`deploy-astro.yml`'s header** — the reasoning, what the pins do not cover, and how to move a pin.
Read it before adding or bumping an action. One gap is knowingly open: the two appleboy SSH actions
still download their real code at run time and never check the droplet's host key. Replacing them
with the runner's own OpenSSH is planned and **deferred** (Andy, 2026-10-10):
[docs/future-work/deploy-over-openssh.md](docs/future-work/deploy-over-openssh.md) is the pickup
point.

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

**The old `production` dataset is GONE** (Andy deleted it on 2026-10-22 to free the Free plan's
second slot). It was exported first to
`~/Archives/afc/2022-production-dataset-2026-10-22/production.tar.gz`, with drafts and assets, and
checked against the live dataset before the delete. **The second slot now holds
`recommendations-lab`**, a copy of `production-26` for the recommendations research, where tags are
rewritten and the taxonomy is restructured without touching the live site. The research's record
is [docs/recommendations/](docs/recommendations/README.md), which says where its full folder went.
Run the lab's Studio with `pnpm --filter studio dev:lab` on :3031. The project's one webhook is
scoped to `production-26`, so nothing written to the lab deploys anything.

**`dev:lab` stays for now, but the lab is not stream 3's test bed** (Andy, 2026-11-24). The
plugin's assisted tagging is experimented with and tested in the Taxonomy Manager's own dev Studio,
with content created or copied there, so this site and the plugin stop depending on each other.
Its starting document moved to that repository: `docs/development/embeddings-tagging/`.

**Stream 1 made the lab production** (2026-11-21). The research's revised Topic scheme and its tags
went live by recreating `production-26` from the lab: production was archived twice, to
`~/Archives/afc/production-26-2026-11-20/`, deleted, and created again under the same name. So the
site's environment, the preview, the deployed Studio and the webhook needed no change.
**[docs/recommendations/stream-1-data.md](docs/recommendations/stream-1-data.md) is the record**,
step by step. The lab was identical to production at the switch.

**Stream 2 rebuilt the related-content ranker** (2026-11-23): cross-category ranking from Topic
tags, a tested module, and the old branch rule removed.
**[docs/related-content.md](docs/related-content.md) explains it**, and
[docs/recommendations/stream-2-ranker.md](docs/recommendations/stream-2-ranker.md) is the record.

Two things moved at the switch, both expected:
- **Every document's `_updatedAt` now reads the import time.** The feeds date their entries by
  `pubDate`, so no entry moved, but JSON-LD `dateModified`, the sitemap's `<lastmod>` and search's
  date for a `page` all moved once.
- **The fresh embeddings index agrees with the lab's closely but not exactly.**

### Where the rebuild left things

**Every phase of the Astro rebuild is closed** (phases 0–8, 2026-08-17 to 2026-10-10). How each
one ran, what it measured and what it found on the way is
**[docs/astro-migration/phase-history.md](docs/astro-migration/phase-history.md)**, moved there
verbatim from this file on 2026-11-24, beside the phase kickoffs. What follows is only what still
governs work, by topic, naming the phase whose record holds the reasoning. Read the record when a
rule here is questioned, not as background.

#### Content model and vocabularies (phases 1 and 4)

- **The URL surface and addressing scheme** are designed in
  [docs/urls-and-filtering.md](docs/urls-and-filtering.md); `nginx/redirects.conf` serves the
  redirects.
- **Five content types:**

  | Type | What it is | Layout |
  |---|---|---|
  | `singleton` | CMS-governed content with a **unique** layout | bespoke per page |
  | `page` | website-**generic** scaffolding | one repeatable template |
  | `article` / `caseStudy` / `note` | the Document branch — what gets published | detail templates |
  | `presentation` | the Presentation branch — a delivered work | detail template |
  | `event` | one **delivery occasion** of a presentation | no page of its own |

  **Singletons:** Home, Insights, Reviews, Presentations (index). **Pages:** About, Apologia,
  Projects, Consulting, Contact.
- **`page` means generic to the medium "website", not generic in the Genre sense,** and the
  disqualifier is testable: a `page` carries no Topic or Genre concepts and never appears in a
  listing. Anything that wants either belongs in the Document branch. The risk is drift: `page`
  must not become where things land that should have been modeled.
- **Consulting is a `page` for now and will likely become a singleton,** an index drawing together
  positions, methods and case studies per service. The four deleted `service` documents that are
  its obvious content survive in the old dataset's export,
  `~/Archives/afc/2022-production-dataset-2026-10-22/production.tar.gz` (`data.ndjson`,
  `_type == "service"`).
- **`note` is ONE type;** `genre` tells Note, Web Clipping, Book Note and Project Note apart, with
  `clipRef` and `bookRef` as optional objects. Validation that keeps a variant's fields
  consistent is deferred.
- **`presentation` inverts `event`:** one delivered work, many deliveries, which is why interviews
  are Presentations. Transcripts are Portable Text on `presentation`; recordings are `recording[]`
  on `event`, since a recording belongs to a delivery. `studio/schemas/objects/recording.ts`
  records the poster ladder and its GROQ trap.
- **Genre has two top concepts, the content model's own division:**

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

- **Topic** has 75 concepts under seven top concepts (Engineering Practices, Design Practices,
  Design Approaches, Project Management, Engineering Tools, Outcomes, Human Factors), live since
  stream 1. Facets filter on **direct tags only**, and content is **never tagged at a top
  concept**, which is what keeps a "Design Practices" chip from competing with its children.
- **A document's genre sits under the top concept matching its type.** `pnpm parity` checks it
  (Check 4, walking `broader`); it is not gated, and the Studio will accept a violation.
- **Corpus counts move.** Re-measure rather than quote them.

#### Search (phase 4)

- **MiniSearch, not Fuse.js,** which matched substrings and returned nothing for `design system`.
  The behavior is specified in DESIGN.md → Components → Search, and
  **[docs/search-ranking.md](docs/search-ranking.md) is the explainer** — read it before changing
  what search matches on.
- **Multiword terms come from the vocabulary, not from statistics,** so **adding a concept is a
  search change**: `bodyTerms` matches prose against the Topic and Genre schemes, and a term is
  invisible until a scheme has it. `web/scripts/phrase-candidates.mjs` proposes candidates by hand;
  `keywords.ts`'s `ALLOW` list keeps `ai`, `ia`, `ui` and `ux` past the two-character floor.
- **`/search.json` revalidates; it is not `immutable`.** It is a route with a stable URL, kept
  stable on purpose: guessable and inspectable. Revisit only if the index grows, since a
  content-hashed name is what would make a full-text index (134 KB gzipped) affordable.

#### Linked data, microformats and syndication (phases 4 and 8)

- **JSON-LD is `web/src/lib/linked-data.ts`;** `<BaseLayout>` takes each page's nodes, so every
  page emits one `@graph`. Three decisions not to re-derive: topics and genre ride as plain
  `keywords` and `genre` strings, since concepts aren't addressable; no `Review` nodes, since a
  review of your own Organization is self-serving markup; a page gets a page-level node only
  where its type says more than `WebPage`.
- **The mf2 that's built:** `h-entry` on detail pages, and the representative `h-card` on the
  home page only (`Masthead.astro` says why), which the `<link rel="author" href="/">` every page
  carries resolves to. **What isn't,** each waiting on a schema field or a live target:
  `u-syndication`, `p-summary` (decide its field first: `shortDescription` is card copy),
  `dt-updated`, `<link rel="webmention">` with a build-time fetch of mentions, and `h-feed` on
  index pages.
- **POSSE is deferred;** [docs/future-work/posse-and-syndication.md](docs/future-work/posse-and-syndication.md)
  is the pickup point. **Cloudflare can fail it silently:** a challenged fetch never arrives, so
  check that Bridgy, webmention.io and feed readers get through before debugging anything else.
  The one Managed Challenge rule matches facet-combination URLs only (`nginx/afc-production.conf`).
- **Per-concept feeds were evaluated and not built,** for want of a warrant;
  `docs/astro-migration/feeds-kickoff.md` → Per-concept feeds has the ready recommendation. The five
  feeds are section and type feeds.

#### Quality gates (phase 8)

- **Code gates test the repository:** TypeGen drift, `astro check`, the Studio's `tsc`, the unit
  tests and Prettier. They never run on `repository_dispatch`, and neither deploy waits for them,
  except that `astro check` also blocks inside both deploys.
- **Site gates test the built site:** links, HTML validation, accessibility and budgets. They run
  on a branch push in `checks.yml`, and beside the production deploy, **never holding it** — the
  deciding case is an unpublish. Do not add a site gate to the deploy job's `needs:`.
- **A gate is not known to work until it fails.** Prove a new one with a deliberate violation.
- What not to re-derive, gate by gate; each script's header has the rest:
  - **Links** (`check-links.mjs`): four kinds of on-site failure, found with patterns rather than
    an HTML parser. External links are a separate check.
  - **HTML validation:** the W3C Nu checker, pinned. `CSS:` messages and warnings are filtered; a
    skipped heading level and a duplicate id fail, and both can come from content. `vnu-jar`'s
    postinstall stays disallowed.
  - **Accessibility:** axe-core over five configurations, with reduced motion on. Test a fix
    inside the real page, not a bare file. A pass is a floor: keyboard use, focus order, screen
    reader output and interactive states are untested.
  - **Budgets:** brotli bytes, not timings, with the numbers in the script. Raise one only on
    purpose, in a commit that says why. Images, Plausible and files no page loads aren't weighed.
  - **External links:** monthly and on demand, outside `checks.yml`. Only 404s, 410s and hosts
    that don't resolve fail; LinkedIn is excluded. GitHub disables the schedule after 60 days
    without a commit (`gh workflow enable external-links.yml`), and a scheduled failure emails
    whoever last edited the cron line.

#### Deploys, the droplet and caching (phases 6 and 7)

- **The SSR preview departs from ux-methods five ways,** each recorded beside the code it shaped:
  no `node_modules` on the droplet (`bundleServerDependencies`); a systemd user unit, not PM2;
  the preview's contact form runs production's PHP; no basic auth, since Presentation's frame
  can't authenticate, so `noindex` is carried twice, a per-address render limit applies, and
  **drafts on preview are readable by anyone who finds the host** (Andy's call); memory limits
  sized on Linux, `MemoryHigh=200M` and `MemoryMax=256M`, never from macOS numbers.
- **Releases are pruned by name,** not by `ls -t`, which could delete the live release.
- **Hashed `_astro/` assets, fonts included, are `immutable` for a year;** HTML, `/search.json`
  and the feeds revalidate.
- **`cms.` is a 302 to the Studio's `/` only,** left that way: deeper paths returning 522 is
  accepted.
- **The service worker is declined;** `/serviceworker.js` is the 11ty worker's kill switch and
  stays indefinitely. If a worker is ever wanted, start from the offline-page-only shape in the
  phase 8 record.
- **Rolling back to 11ty means rebuilding `06cd8e5`;** its release is gone from the droplet.
- **A field removal is three steps:** the schema, an `unset` on published documents and drafts,
  and `pnpm typegen`. The Sanity MCP patch tool writes drafts only, so on a published document it
  is patch then publish, and every publish fires the deploy webhook.
- **The journal is capped at 100 MB** on the droplet, by `/etc/systemd/journald.conf.d/size.conf`.
- **For the next droplet reboot, check before touching anything,** since a deploy restarts the
  very things being tested. As root on the droplet:

  ```bash
  uname -r
  systemctl is-active nginx php8.3-fpm certbot.timer do-agent pm2-uxm
  systemctl --failed --no-legend
  sudo -iu afc XDG_RUNTIME_DIR=/run/user/1001 systemctl --user status afc-preview --no-pager | head -5
  readlink /proc/$(sudo -iu afc XDG_RUNTIME_DIR=/run/user/1001 systemctl --user show -p MainPID --value afc-preview)/exe
  swapon --show
  ```

  Expect `active` five times, no failed units, the unit active since boot, and `/usr/bin/node`.
  Then, from the Mac, `AFC_SSH=do nginx/deploy.sh`, and curl the four hosts from outside: from
  the droplet, a request to its own non-Cloudflare names never leaves the box.

#### Templates and measurement (phases 5 and 6)

- **Every `<main>` carries `id="main"` and `tabindex="-1"`,** for the skip link `<BaseLayout>`
  puts first in `<body>`. Without the tabindex a fragment moves the scroll position but not
  keyboard focus, so the link looks like it works and leaves you in the nav. A new page template
  needs both.
- **Before quoting any before-and-after figure** between the 11ty and Astro sites, start from
  [docs/astro-migration/eleventy-astro-comparison.md](docs/astro-migration/eleventy-astro-comparison.md)
  (measured 2026-10-06), which also says how to rebuild the old site to measure it again.

#### Open, and waiting for a reason

- **`BAND_GET_IN_TOUCH` has never been exercised.** The Presentations singleton is to be its first
  consumer; probe that query when it lands, with a known-good control, per the box in
  `web/src/sanity/fragments.ts`. A fragment that untypes its query fails silently and
  `astro check` stays green.
- **Copy-to-clipboard on feed links** is
  [issue #4](https://github.com/andybywire/andyfitzgeraldconsulting/issues/4), with its whole spec.
- **Slides should carry alt text eventually,** as a project of its own (Andy). Asset-level alt is
  already preferred wherever it is set, and the Media Library can't be read from the build.

**Two homes for planning notes** (Andy, 2026-10-09):

- **`docs/future-work/`** holds follow-on work that was planned and deliberately deferred, each
  file written so a later session can pick it up cold. It holds `posse-and-syndication.md` and
  `deploy-over-openssh.md`.
- **`docs/astro-migration/`** holds the record of the Astro rebuild: the 19 phase kickoffs, their
  one kin `eleventy-astro-comparison.md`, and `phase-history.md`, the phase sequence this file
  carried until 2026-11-24. The kickoffs moved there in one pass on 2026-10-10, once every phase
  was closed; its README lists them in phase order. **`docs/recommendations/`** is its counterpart
  for the recommendations work (2026-11-24).
  What stayed in `docs/` is living reference — the decision records, open questions, the URL
  contract, search ranking, related content, and the Figma, Moz and ux-methods notes.

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
no pnpm and no PM2 on the droplet at all. Where the rebuild left things → Deploys lists the five
departures.

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
production on every push to `main` touching `web/**` or the pnpm lockfile or workspace file, and on
every Sanity publish webhook — so **a
push to `main` IS a production deploy**, which is one more reason commit and push are Andy's call.

- **`main`** — the only long-lived branch.
- **Work branches** — branch from `main`, one coherent piece of work each, merged back once
  verified. A merge leaves you on `main`, so check the branch when a new task starts.
- **`next`** — **retired at the cutover merge** (`0f8884e`). It was the integration branch while
  the Astro site was built beside the live 11ty one, and it deployed the static staging rehearsal.
  Don't build on it, or on `origin/dev` (Aug 2025), which was abandoned before it.
- **The preview host tracks `main`** (since 2026-09-29): `deploy-preview.yml` deploys it on every
  push to `main` touching `web/**` or the pnpm lockfile or workspace file, with `workflow_dispatch`
  on any ref to rehearse a branch before
  merging it (Andy, 2026-09-28). GitHub runs `workflow_dispatch` only for a workflow file that
  exists on the default branch, which is why the first run was the merge.

**nginx is deployed by hand**, with `nginx/deploy.sh` from a laptop, never by CI — its header says
why. `validate-nginx.yml` runs `nginx -t` on a push to any branch touching `nginx/`, so a config
that cannot load is caught on the branch, before anything is installed. **`checks.yml` follows the
same pattern for code and the built site** (2026-10-08): every branch push, deploys nothing,
gates nothing — a red run says not to merge. See Where the rebuild left things → Quality gates.

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
