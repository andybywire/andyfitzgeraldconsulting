# External link check — the last phase 8 item

Paste this into a new session. CLAUDE.md loads automatically; **read its phase 8 entry first** —
the code gates, the four site gates, and what was evaluated, deferred or declined — then
`web/scripts/check-links.mjs`, whose header is the model for how a gate here explains itself.
This prompt covers what those don't.

**Do not write code in the first turn.** Re-measure (below), say the shape of the first piece, and
stop. The decisions are already made; the first turn is about confirming the ground has not moved.

## Start state

`main` was at `df1c113` and clean when this was written, with `main` the only branch. Check
`git status -sb` rather than trusting that. A push to `main` touching `web/**` deploys production
AND preview. Branch from `main`, plain kebab-case — `external-link-check`.

Phase 8, as this was written: the quality gates are **done** (code gates on every push; link check,
HTML validation, byte budgets and accessibility on every branch build and beside every production
deploy); per-concept feeds were **evaluated, not built**; POSSE is **deferred** to
`docs/future-work/`; the service worker was **declined**. **This check is the last item.** When it
closes, phase 8 closes.

## Settled — Andy, 2026-10-09

1. **When it runs: monthly on a schedule, plus `workflow_dispatch`.** Never on deploys, branch
   builds or Sanity webhooks: a run makes roughly 800 requests to other people's sites, and every
   publish would repeat them. **Caveat:** GitHub disables scheduled workflows after 60 days with no
   commits; the manual button covers the gap. Consider also triggering on a push that touches the
   workflow, its config or its script, so a change to the check can be proven on a branch —
   `workflow_dispatch` only runs workflow files that already exist on `main`.
2. **What fails: only the clearly broken** — `404`, `410`, and hosts that do not exist (DNS). That
   failure turns the run red, which gets Andy GitHub's failure email. **Blocked and TLS results do
   not fail**: they are listed in the run's summary as "check by hand". A tracking issue the workflow
   keeps updated was the alternative, and was not chosen.
3. **The tool: lychee**, pinned to an exact version, configured by a commented `lychee.toml` in the
   repo — our own domains and `cdn.sanity.io` excluded, and LinkedIn's `999` treated as blocked,
   not broken. CI runs `lycheeverse/lychee-action`, pinned; locally it runs through Docker, so the Mac
   gains no new install. A hand-written checker would duplicate what lychee already does —
   retries, rate limits, caching — which is why this was split from the internal link check.

**Recommended, not yet decided — a surface for the session to propose:** let lychee only *collect*
(JSON output, never failing its own step), and let a small dependency-free script in `web/scripts/`
classify the results into broken / blocked / TLS, write the summary and set the exit code — 0 clean,
1 broken, 2 could-not-run, as the other gates do. lychee's own `accept` list can only make a status
pass or fail; it cannot make "blocked" a visible third category, which is the whole point.

## Measured 2026-10-09 — re-measure before quoting

Over a fresh production build, all 84 pages, 72 seconds:

```bash
docker run --rm -v "$PWD/web/dist:/input:ro" lycheeverse/lychee:latest --no-progress \
  --format json --scheme https --scheme http \
  --exclude '^https?://([a-z]+\.)?andyfitzgeraldconsulting\.com' --exclude 'cdn\.sanity\.io' \
  --max-concurrency 8 --timeout 20 --max-retries 2 '/input/**/*.html' > lychee.json
```

**62 distinct external URLs failed, and only about a third were broken:**

| Class | Count | |
|---|---|---|
| Broken — `404` | 13 | five are links to Andy's own `ux-methods` repo whose paths moved |
| Moved, not followed — `301` | 3 | old `http://www.uxbooth.com/articles/…` links |
| Dead hosts | 2 | `poc.uxmethods.org` (Andy's), `wildlyappropriate.com` |
| Blocked — LinkedIn `999` | 13 | LinkedIn refuses automated requests; not broken |
| Blocked — `403`, and Amazon refusing connections | 12 | O'Reilly, Crunchbase, ed.gov, OpenBSD man pages, 7 Amazon links |
| TLS failures | 18 | 16 on `conferences.infotoday.com`; probably fine in a browser |
| Timeout | 1 | |

**Andy was going to fix the broken ones in the Studio**, so expect fewer. If any remain, they are
the natural failing case for proving the gate on the runner, and fixing them is the passing case —
the way HTML validation was proven.

## Traps found while measuring

- **lychee also tries the site's own root-relative links** (`/insights/…`) and reports them as
  errors — "Unresolved root-relative links in local files". They belong to `check-links.mjs`.
  Drop every non-`http(s)` entry when classifying; do **not** pass `--root-dir`, which would make
  lychee re-check internal links the existing gate already owns.
- **lychee's exit code is non-zero whenever anything fails**, blocked links included — another
  reason it should collect and something else should judge.
- **A monthly run cannot reuse a production artifact**: `deploy-astro.yml` keeps its artifact 7 days.
  The workflow builds the site itself, as `checks.yml`'s site job does.
- **The user agent is a small decision worth making on purpose.** lychee's default identifies itself;
  a browser-like string gets past more bot walls but misrepresents the client. A descriptive agent
  with a contact URL is the honest middle.

## Fold in two one-line fixes

Both have waited for the next change under `web/`, since a comment-only push would deploy for
nothing. If this branch touches `web/`, take them with it:

- `web/scripts/check-budgets.mjs` → *PROVEN 2026-10-09* still says "unproven when this was written:
  deploy-astro.yml's step". It **ran green on the merge `f49f572`**, beside a deploy that finished
  first. Replace it with an "in production" line, keeping "still unproven: red-after-deploy from a
  Sanity publish" — as `check-links.mjs` and `check-a11y.mjs` already read.
- `web/public/serviceworker.js` → its header ends "If phase 8 ships a real worker, it can live at this
  URL". Phase 8 **declined** the worker; reword it as "If a worker is ever wanted…", pointing at the
  offline-page-only shape in CLAUDE.md.

## When it lands

Update CLAUDE.md: the external link check built, and **phase 8 closed**. Then, at Andy's word and
not before, the planning-notes move CLAUDE.md records under *Two homes for planning notes*: the
`docs/*-kickoff.md` files and their kin into `docs/astro-migration/`, in one pass that updates every
link to them — CLAUDE.md, DESIGN.md, the decision records and source comments all cite them.

## How to work

Unchanged. Small, reviewable pieces; say the shape before building a surface; a seam ends the turn.
Andy does the visual and in-browser checks. Prove a gate by making it fail before trusting it pass.
Commit and push only when asked — a push to `main` is a production deploy. American spellings in
prose, comments and commit messages; never rewrite an identifier to match.
