# SSR preview — D4 onward, the last of phase 6

> **DONE 2026-09-29.** D4–D7 are built, installed and verified; `preview.` is the SSR build behind an
> nginx proxy, and visual editing works end to end from the deployed Studio. This file is kept as the
> plan it was. CLAUDE.md's phase 6 block has the outcome, and the code carries the reasoning.
>
> **Where the build departed from this plan**, each decided with Andy:
>
> | this plan said | what shipped, and why |
> |---|---|
> | D4: split `site-common.conf` into a new `site-static.conf` | the static tier moved **inline** into `afc-production.conf` — one consumer after the flip, so no snippet |
> | D5: `pnpm deploy --prod` for dependencies | **bundled** into `dist/server` — `pnpm deploy` measured 590 MB a release; no `node_modules` on the droplet |
> | D5/D6: PM2 with `ecosystem.config.cjs` | a **systemd user unit**, `web/afc-preview.service` — ux-methods' PM2 outage; no daemon |
> | D5: keep the PHP `server/` half in the preview release | preview's form runs **production's** PHP; the preview release is `app/` only |
> | D6: Node for `afc` — nvm or a system package | **NodeSource**, `/usr/bin/node` |
> | D7: basic auth, decided with evidence | **removed** — Presentation's frame gets a 401 with no prompt (Vivaldi); replaced by `noindex` ×2 and a render rate limit |
>
> **Claims below that turned out wrong**, so they are not re-derived from here:
>
> - "BaseLayout also emits a noindex meta in preview" — it did not; one was added.
> - "`Astro.url` reads [`X-Forwarded-Proto`]" — not without `security.allowedDomains`; the header is
>   sent and ignored today.
> - "Memory (built SSR server, Mac): RSS 280–355 MB" — very likely measured without
>   `NODE_ENV=production`, which halves it. The droplet's figure is a 148 MiB peak.
>
> One claim that held, and is now measured rather than assumed: the whole `visual-editing` branch
> left production's output byte-identical to `main` (108/108 files) before it merged.

Companion to [cutover-kickoff.md](cutover-kickoff.md), which this follows. **The cutover is done
and verified** (2026-09-28): the apex serves the Astro build, and CLAUDE.md's phase 6 block records
what was checked. What remains of phase 6 is flipping `preview.` from the static staging build to
SSR with visual editing. **D1–D3 are built and verified locally; D4–D7 are this session.**

**Re-measure rather than trust.** Numbers here were taken 2026-09-28/29.

## Start state

Two branches off `main` (`0f8884e`, the cutover merge), **both unmerged and unpushed**:

| branch | what | touches |
|---|---|---|
| `post-cutover` | 3 doc commits: C5 verification record, the http2-warning correction, CLAUDE.md's post-cutover branching model | `nginx/`, `CLAUDE.md`, a comment in `deploy-astro.yml` |
| `visual-editing` | 8 commits: D1–D3 and the Presentation resolver (below) | `web/`, `studio/`, `.claude/launch.json`, lockfile |

They touch different files and can merge in either order. **A push to `main` is a production
deploy** — `deploy-astro.yml` fires on `web/**` and on its own file, so merging either branch
triggers one. The production OUTPUT should be unchanged, but only part of that is proven: D3's
changes are byte-identical (108/108 files), and D1 adds no visual-editing code (436 KB). **Nobody
has byte-compared the whole `visual-editing` branch against `main`** — do that before merging
(build both, `diff -rq`); it takes two minutes and turns "should" into "is".

**Local dev servers** are defined in `.claude/launch.json` — start them with `preview_start`, not the
shell: `web-preview` (`dev:preview`, :4321), `studio` (:3030), `web-ssr` (the BUILT preview server on
:8081 — run `pnpm --filter web build:preview` first). `web/.env` now holds `SANITY_API_READ_TOKEN`
and `PUBLIC_SANITY_STUDIO_URL=http://localhost:3030`.

## What is already done — do not rebuild or re-verify it

| | |
|---|---|
| D1 `<VisualEditing>` | in `BaseLayout`, via an import gated on `import.meta.env.PUBLIC_SITE_MODE` — **not** `astro:env`, measured: only a build-time constant keeps 660 KB of dead chunks out of production (436 KB vs 1156 KB). The one place in the codebase that reads `import.meta.env`, and the comment says why |
| D2 Presentation | in `studio/sanity.config.ts`. Preview URL is a function of the Studio's own origin: localhost Studio → `localhost:4321`, anywhere else → the preview host. No `previewMode` (preview is a drafts BUILD, not a cookie) |
| Resolver | `studio/resolve.ts`: `mainDocuments` (7 routes, catch-all last) and `locations` (per type + any page/singleton that references the document; Settings noted not enumerated; unattached events flagged). Concepts and Home's query-based selection deliberately out (Andy). Needs `rxjs` — added to `studio` |
| Stega in logic | 7 sites fixed with `stegaClean`; the rule and what stega skips live as **STEGA AND LOGIC** in `web/src/sanity/load-query.ts`. Stega had NEVER run before this work — no Studio URL was ever set — and its first run 500'd 73/83 pages |
| SSR 404s | unknown slugs → the site's 404 under SSR, still a build error when prerendered (`Astro.isPrerendered`) |
| Dev pre-bundling | `optimizeDeps.include: ['@sanity/astro > @sanity/visual-editing/react']` in `astro.config.mjs`, preview only. Dev-only problem — the Rollup build hydrates fine |
| D3 audit | on the BUILT server: 83/83 render, 404s correct, island hydrates, no self-referencing `http://` with or without `X-Forwarded-Proto`. Stega cleaned from `search.json` (was 759k chars) and JSON-LD (was 8.8k; the old regex stripped the wrong Unicode range) |
| Token | GitHub secret **`VISUAL_EDITING`** → must be exposed as `SANITY_API_READ_TOKEN`. Measured: the value appears in **0** build-output files (`astro:env` secret is read at runtime) |
| Studio | deployed at `afconsulting.sanity.studio` as a NEW app `g1jo20nnopb0mtoyt45zqakx`, pinned (`autoUpdates: false`, 6.9.2). **Its deployed build predates D2** — redeploy after merging `visual-editing` (`pnpm --filter studio run deploy`; `run` matters, `pnpm deploy` is a built-in). The host 302s to sanity.io and keeps deep paths, so it works as `PUBLIC_SANITY_STUDIO_URL` |
| CORS | preview host already allowed (plus `*.andyfitzgeraldconsulting.com`, `localhost:4321`) |

## The job

### D4 — the nginx split

`afc.conf`'s preview block flips from static to `proxy_pass http://127.0.0.1:8081`. Its header
already lists what changes; the kickoff's own line: **`site-common.conf` has to SPLIT**.

- **Proposed**: `site-common.conf` keeps what both hosts share — the `/api/contact` PHP location
  (it must stay nginx-routed; Astro knows nothing of it) and the dotfile deny. A new
  `site-static.conf` takes `try_files`, `error_page 404`, the `_astro/` / search / feed cache tiers
  and content types. Production includes both; preview includes `site-common.conf` + redirects + a
  proxy `location /`. **File boundaries are a seam — confirm with Andy before writing.**
- Proxy headers: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`. D3 showed Astro's
  absolute URLs come from `Astro.site`, so `X-Forwarded-Proto` is not load-bearing for canonicals
  today — add it anyway, `Astro.url` reads it.
- **`X-Robots-Tag` must survive the proxy.** It is set per location because of nginx's
  `add_header` inheritance (see `site-common.conf`'s header) — the proxy location needs its own.
  `BaseLayout` also emits a `noindex` meta in preview.
- Update `validate-nginx.yml` (copies the new file) and **`deploy.sh`'s preview smoke checks**: the
  404 page now comes from Astro, not nginx's `error_page`, so check 2's reasoning changes.
- `deploy.sh` now also installs `afc-production.conf`; the cutover interlocks pass silently
  (link gone). Run it as `AFC_SSH=do AFC_STAGING_AUTH=… nginx/deploy.sh`.
- **Do not install D4's config before D5/D6 exist** — a proxy to an empty port 502s the preview host.

### D5 — `deploy-preview.yml` + `web/ecosystem.config.cjs`

- Triggers: push to `main` (`web/**`) + `workflow_dispatch` on any ref (Andy, Q4). **No
  `repository_dispatch`** — SSR reads drafts live; a publish needs no rebuild.
- Build with `PUBLIC_SITE_MODE=preview` (`build:preview`), `SANITY_API_READ_TOKEN` from the
  `VISUAL_EDITING` secret, `PUBLIC_SANITY_STUDIO_URL=https://afconsulting.sanity.studio`.
- **Shipping dependencies**: the standalone server still imports from `node_modules`. Prefer
  `pnpm deploy --prod --filter web <dir>` (lockfile-pinned) over ux-methods' unpinned
  `pnpm install --prod` on the droplet — **measure its size first**; `sanity` is a peer dependency
  and heavy, and releases are kept ×3 on a disk with ~1.7 GB free.
- Release dirs + symlink (as `deploy-astro.yml`), keeping the PHP `server/` half so the contact
  form works on preview. Health-check `127.0.0.1:8081` after restart; **on failure re-link the
  previous release and restart it** — ux-methods `rm -rf`s before knowing the new build is good.
- Token into a `0600` env file loaded with Node's `--env-file`, so it never sits in `dump.pm2`.
- **Memory guards** (see Measured below): `NODE_OPTIONS=--max-old-space-size=128` and PM2
  `max_memory_restart`. `ecosystem.config.cjs`: copy the SHAPE of ux-methods' (fork mode, explicit
  `cwd`, `startOrRestart`, `.cjs` because `type: module`) — its header records why each is there.

### D6 — the droplet (Andy runs; one command at a time)

- **Decision first: how does `afc` get Node 24?** It has none (no nvm, nothing on PATH). Options:
  per-user nvm to mirror `uxm`, or a system package. Surface with a recommendation.
- PM2 for `afc` with its own `pm2 startup` systemd unit (root runs the printed command) and
  `pm2 save`. uxm's PM2 daemon measured 28 MB; plan for one more.
- Confirm the process runs on 24: `readlink /proc/<pid>/exe` (resurrect restores stored PATH).
- **Measure memory on Linux under real use** — the Mac numbers below are not predictive.
- Then install D4's nginx via `deploy.sh`.

### D7 — basic auth, decided with evidence

Open Presentation from the **deployed** Studio with auth on. If the iframe cannot authenticate,
remove it and record why in `afc.conf` (its header already frames the question).

## Measured this session — so it is not re-derived

- **Memory (built SSR server, Mac):** RSS 280–355 MB after an 83-page sweep, but
  `process.memoryUsage()` shows the live set is ~60 MB (heapUsed 28, external 33); `heapTotal`
  swells to 176 MB during renders and falls back to 34 MB. The rest is transient garbage from stega's
  huge strings plus macOS not reclaiming freed pages. A 128 MB heap cap barely changed RSS. Linux
  will differ — measure there.
- **Stega's cost:** an article page carries ~300k invisible characters (~900 KB extra per render).
- **The droplet:** 458 MB total, 224 MB available, 1.9 GB swap; disk ~1.7 GB free after three
  production releases. `afc` is in `www-data`, **not** `sudo` (removed 2026-09-28). Port 8081 free.

## Andy's, outside the repo

- Merge and push the two branches, when ready.
- Redeploy the Studio after `visual-editing` merges.
- Follow-ups from the cutover, none blocking: delete `/var/www/afc` once the rollback window closes;
  retitle or undeploy the old `af-consulting` Studio app; delete the `RECAPTCHA_SECRET`,
  `AFC_MAIL_USERNAME`, `AFC_MAIL_PASSWORD` secrets; give the `cms.` redirect rule a wildcard.

## Gotchas — each cost time this session

- **Verify what a check MATCHED, with a control that can fail.** Still the rule. This session's
  instances: a count of 0 that was really "grep found an empty value", a positive control that
  silently never ran (busybox `pgrep` missed nginx), a feed "leak" that was an emoji's ZWJ.
- **The shell is zsh.** It does not word-split `$VAR`, so a space-separated file list reaches a
  command as ONE argument — use arrays. `timeout` does not exist on macOS. macOS `awk` counts
  BYTES (`─` is 3). `/` in a `sed` delimiter breaks on paths.
- **`set -u` + empty array in bash 3.2** (macOS's `bash`) is "unbound" — use
  `${arr[@]+"${arr[@]}"}`.
- **Stega is zero-width characters**, U+200B–U+200D and U+FEFF, in long runs — not the tag block.
  Remove it with `stegaClean`, never a regex: real content has ZWJs.
- **Astro dev pushes a server error onto every open page**, whichever request caused it.
- **`pnpm deploy` is a pnpm built-in**; a package script named `deploy` needs `pnpm … run deploy`.
- **The nginx image logs to `/dev/stdout`** — reading `access.log` in a container blocks forever.

## How to work together

Unchanged: surfaces are a standing invitation (state the shape, build it); seams stop the draft.
One step at a time on the droplet, labelled Mac or droplet. Andy does visual verification. Commit
and push only when asked. American spellings in prose, comments and commit messages.
