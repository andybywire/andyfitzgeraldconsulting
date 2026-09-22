# Cutover — phase 6's second half, with SSR preview folded in

Companion to [staging-and-cutover-kickoff.md](staging-and-cutover-kickoff.md), which this follows.
**Staging is live, verified, and serving.** What remains is pointing the apex at it, and — a change
from the earlier plan — building the SSR preview in the same pass rather than as a post-launch
follow-up (Andy, 2026-09-21).

**Re-measure rather than trust.** Numbers here were taken on **2026-09-21**, and Andy is making
content updates before this session starts, so the corpus has moved by definition.

## Start state

**Branch `next`, clean, pushed.** Staging has been deployed from it twice.

```
cff6920 docs: record the measured rate limit, which makes real_ip a blocker
dd3dd2f docs: record the uxm-preview restore and the Node 24 upgrade traps
ef6fdfd docs: record the Cloudflare cutover checklist and its phase 8 risk
1a3d889 docs: record that `http2` on a shared socket affects the other sites
29d49f2 fix: use nginx 1.24's http2 syntax, and pin CI to the droplet's version
5b70d9d Merge staging-deploy: phase 6's nginx config, deploy workflows, and what the droplet taught
```

`pnpm parity` → **0 fail, 0 warn, 5 info** (253 documents, 83 built pages). The five are the Media
Library references, 2 of 40 unattached events, and the three phase 7 carry-forwards. `astro check`
0/0/0. Build: 84 pages.

**`https://preview.andyfitzgeraldconsulting.com/`** serves the Astro build behind basic auth, with the
full 301 map, verified.

## What is already done — do not rebuild or re-verify it

The last session did more than the plan called for, and several phase 5 prerequisites landed
incidentally. Verified, not assumed:

| | |
|---|---|
| nginx config | written, installed, reloaded; `nginx/deploy.sh` runs it from a laptop |
| `deploy-astro.yml` | ran twice; release at `/var/www/afc-preview/releases/<ts>` |
| `.env` | `0640 afc:www-data` — `www-data` reads it, `uxm` cannot. Tested |
| 301 map | **76 redirects verified against the live staging host**, every target correct |
| contact form | **sends mail end to end**; the Gmail path survived trimming vendor 220 MB → 4.4 MB |
| rate limiter | measured: 6 through, then limited, replenishing 1 per 6s |
| Node 24 | on the droplet; Node 20 uninstalled; nvm default is 24 |
| PM2 | `uxm-preview` restored and running on 24; **systemd boot path tested**, not assumed |
| memory | one Astro SSR process = **66–96 MB**. Two fit in 458 MB. No resize needed |
| port 8081 | reserved for AFC's SSR preview; 8080 belongs to uxm |
| disk | 80%, 1.8 GB free (was 100% for five weeks) |
| stega | **already wired** — 7 files, incl. `load-query.ts`, `feed-entries.ts`, `linked-data.ts` |

## The job

### 1. Cutover

**The ordering trap is written into `nginx/afc-production.conf`'s header — read it first.** Installing
that file and removing `/etc/nginx/sites-enabled/andyfitzgeraldconsulting.com` must land **together**,
then test, then reload. Either alone leaves a window, and nginx reports the resulting conflict as a
**warning**, so `nginx -t` passes and the breakage arrives at reload.

Beyond that file:

- **`/var/www/afc/html` still has the 11ty layout.** The production block points at
  `html/public`, which does not exist there. Nothing has addressed this; it is the piece most likely
  to be discovered late.
- **The Cloudflare `real_ip` block is a BLOCKER, not a tidiness item.** Measured: six contact-form
  submissions across *all* visitors, then everyone gets the generic failure — and `contact.php` makes
  every non-field failure byte-identical, so a visitor cannot tell a rate limit from a broken
  endpoint. Ranges from https://www.cloudflare.com/ips/, which change.
- **Confirm the thin-proxy settings** — the checklist is in that same header. Rocket Loader,
  minification and Email Obfuscation all **off**; they rewrite HTML, which would eventually fight
  stega and the mf2 markup.
- **`deploy-astro.yml` changes in three places**, all named in its header: `DEPLOY_BASE` →
  `/var/www/afc`, the push branch → `main`, and the `repository_dispatch` checkout-ref override
  removed.
- Rename `web-next` → `web` and `studio-next` → `studio`; archive the old pair alongside
  `web/__web_2022/`; retire `build-prod.yml`; give `studio-next` its `studioHost` (deliberately absent
  today, because `sanity deploy` would overwrite the Studio still serving live `production`).

### 2. SSR preview, folded in

**Moved from post-launch into this pass (Andy, 2026-09-21).** The original reason for deferring was
that debugging PM2, tokens and stega before a real subdomain existed would be theoretical — and that
is no longer true. PM2 is proven on this droplet, Node 24 is installed, the boot path is tested, the
memory is measured, and stega is already encoding.

**Sequence it AFTER the apex is live.** Flipping preview to SSR consumes the static staging host,
which is the only rehearsal surface; do that once its rehearsal job is finished, not before.

What is genuinely missing — smaller than the earlier plan implied, because stega is the hard half and
it is done:

- **`@sanity/visual-editing` is not a dependency and `<VisualEditing />` is rendered nowhere.**
  Measured, 0 references. This is the actual code gap: the edit links are already encoded, nothing
  draws the overlays. *Safe to land before cutover — it is inert in a production build.*
- **`presentationTool` is not in `studio-next/sanity.config.ts`.** Also 0 references.
- **`afc.conf`'s preview block flips to `proxy_pass http://127.0.0.1:8081`**, plus
  `X-Forwarded-Proto $scheme` — without it the app computes `http` for its own scheme and emits
  `http://` in every absolute URL it derives. `preview.uxmethods.org` is missing that line today.
- **`site-common.conf` has to SPLIT.** Under SSR Astro serves its own `_astro/` assets, so the cache
  tiers, the feed content-type and `try_files` all move behind the proxy. The preview block would
  include the contact location and the redirects, not the rest. Plan it as a split, not an edit.
- **A preview variant of the deploy** — `PUBLIC_SITE_MODE=preview`, its own release path,
  `pm2 startOrRestart` with an ecosystem file. `ux-methods/astro/ecosystem.config.cjs` is the pattern,
  written last session; copy its shape and **not** its surrounding mistakes (see Gotchas).
- **The basic-auth question gets decided here**, with evidence rather than speculation. It was removed
  and restored on 2026-09-20 on the grounds that auth costs nothing while staging is static and might
  cost something under Presentation. This is when that gets tested. If it breaks the iframe, remove
  it — the reasoning is recorded in `afc.conf`.

## Andy's, outside the repo

- Content updates, before this session starts.
- A **Sanity viewer token** with draft access, and a **CORS origin** for the preview host. **The token
  must not pass through chat** — straight into GitHub secrets and the droplet.
- The Cloudflare settings above, and the `real_ip` ranges.
- DNS: the apex already resolves to Cloudflare, which already proxies to this droplet, so cutover is a
  config change rather than a DNS one.

## Verification

Most of the URL contract is already verified against staging and does not need repeating. What is new
at cutover:

- The apex serves the Astro build, and `www.` 301s to it — **a behavior change**: today both names
  serve content directly.
- The 301 map behaves **through Cloudflare**, which can cache redirects. This has only ever been
  tested direct-to-origin.
- The contact form works through the CDN, with `real_ip` in place.
- `certbot renew --dry-run` still passes for both names once the config has changed.
- `pnpm parity` green, and Andy's visual pass on the apex.

## Gotchas

**Verify what a check MATCHED, not that it matched.** This cost real time repeatedly last session:
a `grep -r` that silently skipped symlinks and reported "no conflicts"; a `sed` pattern with leading
spaces the file did not have, so a negative control tested an unmodified file; a `perl -pi` multiline
pattern that could not match line-by-line; a `grep -q` that passed on an empty body; and `grep | head`
swallowing the exit code so an `|| echo "none"` fallback never fired. **Every negative control needs
to be shown failing before a passing result means anything.**

**`nginx -t` checks less than you think.** Measured: it fails on a missing certificate, a missing
`include` target, or a syntax error. It does **not** look at web roots or `auth_basic_user_file`. A
config can validate, install, reload and serve 404 to everything.

**And it accepts things the droplet rejects if the versions differ.** `nginx:alpine` was 1.31.6 while
the droplet runs 1.24.0, so `http2 on;` validated in CI and failed on the server. CI is now pinned to
`nginx:1.24-alpine` — **keep it in step with `nginx -v` there.**

**`deploy.sh`'s restore path works.** Exercised in a container both ways, and then for real on the
droplet when the `http2` deploy was rejected: it installed, failed the test, restored, re-tested and
reloaded, leaving the box byte-identical. Trust it, but re-read it before changing it.

**The concurrency groups and disk guard have never fired.** They are the fix for an incident that took
five weeks to notice, and only a real burst would prove them.

**`pm2 resurrect` restores the stored `PATH`**, so an app can keep running on an old Node after the
daemon moves. `readlink /proc/<pid>/exe` is the only way to see it. The systemd unit hardcodes the
Node version in two places.

**Cloudflare fronts everything except `preview.`** — so anything tested against the apex measures the
CDN, not nginx. Use `--resolve` to reach the origin.

## How to work together

Unchanged, and it worked:

- **Draft the UI, then hand it over.** For surfaces the invitation is standing; state the shape in a
  sentence, then build it in the same turn.
- **Seams stop the draft.** Surface with a recommendation and let Andy answer.
- **One step at a time on the droplet.** Give one command, wait for the output, then the next. Label
  clearly whether a command runs on the Mac or the droplet — the Run button executes locally.
- **Andy does the visual verification.** Get it green and MEASURED, then hand him specific steps.
- **Report honestly**, including your own errors, and correct numbers in place.
- Commit and push only when asked. American spellings in prose, comments and commit messages alike;
  never rewrite an identifier to match.
