# Staging and cutover — phase 6, resequenced

Companion to [parity-check-kickoff.md](parity-check-kickoff.md), which this session followed. Phase
5 is done and merged; the parity check is green.

**Re-measure rather than trust.** Numbers here were taken on **2026-09-17**. The corpus moves — it
moved four times during the last two sessions — so re-run `pnpm parity` before quoting anything.

## Start state

**Branch `next`, working tree clean.** Nothing on `next` has ever been deployed.

```
ae3f88f docs: close out the three pre-cutover to-dos
60b583c feat: add a skip link to main content
89f5abb Merge content-parity: the phase 5 parity check, and what it found
ac9fe13 chore: drop seven unread fields from the settings schema
de81e7e feat: balance the masonry columns from measured heights
```

`pnpm --filter web-next build` → **85 pages**. `pnpm parity` → **0 fail, 0 warn, 5 info** (the five
being phase 7 carry-forwards and unverified Media Library references). `astro check` 0/0/0.

## The resequencing, and why it is not just "skip preview"

Phase 6 as written assumed the SSR preview environment came **before** cutover. **Andy's call
(2026-09-17): it does not.** He has no live preview today, so launching without it is no regression,
and debugging PM2 / tokens / stega before a real subdomain exists is theoretical bug-chasing.

That is right, but **preview was doing two jobs.** Besides live editing, CLAUDE.md assigned it the
rehearsal of the deploy machinery — *"nginx config, 301 redirects and CI build behavior cannot be
verified locally… the rest needs a staging deploy before cutover."* Dropping preview entirely would
point the apex at an untested nginx config, an untested 301 map and an untested CI rewrite at once.

**So the two jobs split.** A subdomain serving the **static** build does the rehearsal with none of
the fussy parts — no PM2, no Node on the droplet, no read token, no stega, no Presentation. Flipping
that same subdomain to SSR afterwards delivers live preview. **This is less pre-launch work than the
original plan, not more.**

**The real launch risk is the 301 map**, not preview. `urls-and-filtering.md` says outright it is the
one part of the URL contract that cannot be verified locally, and that the map is included into
*both* server blocks — so exercising it on staging exercises the real thing.

## What already exists — do not rebuild it

- **`astro.config.mjs` has the whole preview/production split**: site URL, `output: 'server'`, the
  Node adapter added only under preview, and a config-time token guard. **Verified** — a preview
  build with no token fails with the intended message.
- **`load-query.ts`** owns the perspective switch, `useCdn`, token and stega.
- **`BaseLayout`** already emits `noindex` and drops analytics under preview; `feed-entries.ts`
  already strips stega.
- **`web-next/server/contact.php`** exists with its own `composer.json` — the mail handler
  replacement is largely written, not pending.
- **`.env.example`** documents `SANITY_API_READ_TOKEN` and `PUBLIC_SANITY_STUDIO_URL`.

## The job

### 1. `nginx/` in the repo — new directory

Authored here and deployed, never edited on the server (decided 2026-08-20). **Write both server
blocks now** even though only staging is live; production's block then becomes a DNS change rather
than a new file.

- `nginx/redirects.conf` — the 301 map, `include`d by both blocks. Contents are already designed in
  `urls-and-filtering.md`: `rewrite ^/insights/tag/(.+?)/?$ /insights?topic=$1 permanent;` covers all
  ~70 tag URLs; `/talks/` → `/presentations/`; the 4 `/insights/page-N/` URLs retire; and
  **`/feed.xml` must not move** — some readers handle a 301 by going quiet.
- Cache headers per CLAUDE.md phase 6: `_astro/` (fonts included) gets
  `max-age=31536000, immutable`; **`/search.json` gets ETag/Last-Modified revalidation and NOT a
  long max-age**; feeds served as `application/atom+xml`.
- Staging block adds `X-Robots-Tag: noindex`.

### 2. `.github/workflows/deploy-astro.yml` — new

Model on `../ux-methods/.github/workflows/deploy-astro-ssg.yml` (cloned locally), keeping the
tar → scp → atomic-symlink shape from `build-prod.yml`. Four documented fixes:

- **Node 24 and pnpm.** ux-methods pins Node 22 and its preview script does `nvm use 20`.
- **Write `.env` as `640` owned by the web group.** `build-prod.yml:149` writes `644` —
  world-readable on the droplet, holding `GOOGLE_CLIENT_SECRET` and `GOOGLE_REFRESH_TOKEN`.
  CLAUDE.md calls this a live security issue on the running site. Fix it; do not reproduce it.
- **Keep 3 releases and write the comment to match.** `build-prod.yml:156` is
  `ls -1t | tail -n +4` — three — under a comment saying five.
- **Carry the Composer step** for `web-next/server/contact.php`.

**The webhook trigger list is stale and nobody has noticed.** `build-prod.yml` dispatches on
`article, caseStudy, service, client, event, review, singleton`. The new model added **`note`,
`presentation` and `page`** — none of which are listed — and `service` is a phase 7 orphan. Publish a
note today and nothing rebuilds. Fix this in the new workflow.

### 3. Trigger shape

`next` + `web-next/**` + `workflow_dispatch`. ux-methods' duplicate-path problem does not arise here:
production still builds from `web/**` on `main` until cutover.

**This contradicts one line in CLAUDE.md** — *"`next` … Never auto-deploys"* — and the contradiction
is deliberate. **Andy approved deploying staging from `next` (2026-09-17)**, on the grounds that
`web-next` exists only there and waiting forfeits the whole point. Amend that line to scope it to
production rather than leaving the file self-contradictory.

### 4. Cutover

Repoint the apex at the build that has been serving staging. Rename `web-next` → `web` and
`studio-next` → `studio`, archive the old pair alongside `web/__web_2022/`, retire `build-prod.yml`.
`studio-next` gains its `studioHost` here — `sanity.cli.ts` deliberately has none, because a
`sanity deploy` today would overwrite `af-consulting.sanity.studio`, which still serves live
`production`.

### 5. SSR preview — fast follow, after launch

Flip the staging subdomain from static to SSR. All additive to a block and workflow already proven:

- **`<VisualEditing />` is rendered nowhere today.** Stega encodes the edit links but nothing draws
  the overlays. This is the actual code gap.
- **`presentationTool` is not configured** in `studio-next/sanity.config.ts`.
- Droplet gains Node 24, pnpm, PM2, with `pm2 save` + `pm2 startup`.
- A Sanity viewer token with draft access → GitHub secret *and* the droplet.
- A Sanity CORS origin for the preview host.
- **The Studio stays local** (`localhost:3030`) with `PUBLIC_SANITY_STUDIO_URL` pointed there. No
  Studio deploy is needed for visual editing — which removes what looked like a blocker.

## Andy's, outside the repo

DNS A record for the staging subdomain; a certbot cert; GitHub secrets for host, user and SSH key.
Later, for SSR: the Sanity read token and CORS origin. **The token must not pass through chat** — it
goes straight into GitHub secrets and the droplet.

## Verification — the part that matters

Curl sweep against staging, asserting status codes rather than eyeballing.

> **Numbers corrected and most of this already run, 2026-09-18.** The list below conflated two
> different 42s — the live corpus and the new one, which overlap by only 37 — and it predated the
> decisions on `page-N` and the tag renames. It has also largely been *executed*: the redirect map
> and both snippets were served by real nginx in a container, against the real `web-next/dist` and
> then against the assembled release tree. What is left for staging is the part a container cannot
> stand in for.

**Already verified in a container — re-run on staging as confirmation, not discovery:**

- **37** of the live `/insights/{slug}/` → **200** (not 42: five were re-typed into the Presentation
  branch under different slugs)
- those **5** → **301**, hand-mapped; four to `/presentations/{slug}/`, one to `/projects/#ux-methods`
- **67** `/insights/tag/{term}/` → **301** to `/insights/?topic={term}` — note the **trailing
  slash** on `/insights/`, which saves a second hop; 7 of them carry explicit rename targets
- `/services/` → **301** to `/consulting/`; `/talks/` → **301** to `/presentations/`
- `/feed.xml` → **200** with `Content-Type: application/atom+xml` (all five feeds; `/sitemap.xml`
  keeps `text/xml`)
- `/insights/page-2/` … `page-5/` → **404**, no rule (Andy, 2026-09-18) — likewise
  `/insight-search.json` and `/manifest.json`
- `_astro/*` carries `immutable`; `/search.json` carries an ETag and `no-cache`, and an
  `If-None-Match` round trip returns **304**
- the preview host answers **401** without credentials, and `X-Robots-Tag: noindex, nofollow` is
  present on every location including `/_astro/`
- `release/server` is unreachable: `.env` → 403, `contact.php` / `composer.json` /
  `vendor/autoload.php` → 404

**Genuinely staging-only, because no container can stand in for it:**

- real certificates and TLS, and the `www.` → apex redirect over a real name
- the contact form actually POSTing through PHP-FPM and sending mail — the container reached
  FastCGI and got a 502, which proves routing and nothing else
- the rate limit under real conditions, and whether `burst=5` is enough for a correction loop
- the deploy pipeline end to end: CI → scp → symlink swap, and the `.env` landing at 640 owned by
  the web group
- Andy's visual pass, and `?topic=` filtering actually applying — curl proves the page loads, not
  that the client-side filter runs

Then `pnpm --filter web-next build && pnpm parity` green.

## Gotchas

**`nginx -s reload` on a bad config fails and leaves the running config in place.** That is the
safety gate the repo-authored approach depends on: `nginx -t` first, then reload.

**Astro's `redirects` config emits `<meta http-equiv="refresh">` under `output: "static"`, not real
301s.** Status codes need the server. This is why the map is nginx's.

**Verify patterns by checking what they matched, not that they matched.** Four measurement errors
happened across the last two sessions — a grep matching a hostname that was really a local directory
name, a regex truncating URLs at commas inside `?rect=a,b,c,d`, a checker that could not resolve
root-absolute paths, and a "fix" to that checker that split URLs into garbage. Every one produced a
confident wrong number. What caught them was running the tool against a **known-good control**, the
same discipline `fragments.ts` prescribes for GROQ.

**The corpus moves under you.** A working condition, not a caveat.

## Archives — done, and outside the repo

Captured 2026-09-17, before cutover destroys the 2024 site. In `~/Archives/afc/`:

| archive | pages | files | size | broken images |
|---|---|---|---|---|
| `2024-live-2026-09-17` | 191 | 1,038 | 155 MB | 0 |
| `2022-11ty-2026-09-17` | 68 | 476 | 31 MB | 0 |
| `2020-jekyll-2026-09-17` | 58 | 1,781 | 263 MB | 0 |

Each verified by resolving every `src`/`srcset` reference to a file on disk, then serving it and
fetching a page, an image and a stylesheet over HTTP. **2022 is fully self-contained** — its 424
Sanity CDN images are local, so the `production` dataset can be deleted whenever.

**wget follows `<img src>` and `<img srcset>` but not `<source srcset>`**, which is why the 2020
Jekyll build (all `<picture>`) silently lost ~1,500 images to a mirror and is archived as its
origin-neutralized source directory instead. Its 569 unresolved references are pre-existing in the
original build and are all missing `card368w` responsive widths — zero `<img src>` fallbacks are
missing, so pages render. Publishing these as no-index subdomains is a later phase; 16 of the 2024
archive's links are Cloudflare `/cdn-cgi/l/email-protection` rewrites and are dead outside Cloudflare.

## Smaller things left open

- **Heroes are not in the Atom feeds.** Never surfaced as a decision when the feeds were built.
- **The RSS Feeds page copy button** is [issue #4](https://github.com/andybywire/andyfitzgeraldconsulting/issues/4), deferred deliberately.
- **647 Media Library references are unverified**, and `media->` resolves to `null` from any dataset
  query — closing that needs the Media Library API, not a cleverer projection.
- Phase 7 carry-forwards: 37 documents with `insightType`, 4 `service`, 2 `collection`.

## How to work together

Unchanged, and it worked well:

- **Draft the UI, then hand it over.** For surfaces the invitation is standing; say the shape in a
  sentence, then build it in the same turn.
- **Seams stop the draft.** Surface with a recommendation and let Andy answer.
- **Andy does the visual verification.** Get it green and MEASURED, then hand him specific steps.
- **Report honestly**, including your own errors, and correct numbers in place.
- Commit and push only when asked. American spellings in prose, comments and commit messages alike;
  never rewrite an identifier to match.
