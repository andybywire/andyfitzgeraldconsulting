# UX Methods notes

Improvements discovered while building **this** site that look applicable to
[`andybywire/ux-methods`](https://github.com/andybywire/ux-methods), collected so they are available
when that project is next iterated rather than re-derived.

The two projects are close relatives — same stack, same Sanity-plus-Astro shape, same static-plus-SSR
preview deploy — and `ux-methods` is the older of the two. CLAUDE.md cites it as the working
reference for the data layer, so **borrowing runs both ways**: patterns come from there, and fixes
found here should go back.

**This is not a task list and not a review of that repository.** It records only findings that arose
from work done here, with enough mechanism that each one can be acted on without reconstructing the
reasoning.

**On confidence.** Findings below are marked as either *read* (verified by reading the file in that
repo) or *carried* (described in this project's CLAUDE.md, not independently checked). The
distinction matters, because a `carried` item may already be fixed there.

## The `loadQuery` wrapper discards the types TypeGen generates — *read*

This is the one worth acting on first, because `ux-methods` **already runs TypeGen**
(`gen:types: sanity typegen generate`, wired as a `predev` hook) and then throws the result away at
every call site. The cost is invisible: nothing errors, types just quietly become `any`.

`astro/src/sanity/lib/load-query.ts` currently reads:

```ts
export async function loadQuery<QueryResponse>({
  query,
  params,
}: {
  query: string
  params?: QueryParams
})
```

**The mechanism.** TypeGen does not annotate call sites. It emits a module augmentation on
`@sanity/client` populating an otherwise-empty `SanityQueries` interface, **keyed by the query's
literal text**:

```ts
declare module '@sanity/client' {
  interface SanityQueries {
    '*[_type == "method"]{...}': MethodResult
  }
}
```

The client's own `fetch` is declared `fetch<R, Q, const G extends string>(query: G, ...)` returning
`ClientReturn<G, R>`, where `ClientReturn<GroqString, Fallback> = GroqString extends keyof
SanityQueries ? SanityQueries[GroqString] : Fallback`. So the lookup key **is** the literal type of
the query string, and the `const` modifier on `G` is what stops TypeScript widening it to `string`.

Declaring the parameter as `query: string` erases that key before the lookup happens. `ClientReturn`
then falls through to its fallback, which is the client's internal `any` alias. Taking the result
type as a caller-supplied `<QueryResponse>` compounds it: the value is `any`, and the annotation is a
hand-written promise that nothing checks against the actual projection.

**The fix, and it does not touch call sites.** Verified here: `const` inference survives an object
parameter, including through a real call rather than only an explicit type argument. So the object
call shape `loadQuery({query, params})` can stay exactly as it is — only the generic changes.

```ts
export async function loadQuery<const Q extends string>({
  query,
  params,
}: {
  query: Q
  params?: QueryParams
})
```

**One adaptation needed.** `ux-methods` fetches with `filterResponse: false` and returns
`{data, sourceMap, perspective}`, which this site does not. Do not copy this site's return type
wholesale — the typed result lands on the raw response's `result` property there, so the return
annotation has to thread `ClientReturn<Q>` through to `data` while keeping `sourceMap`. Worth
checking against the `filterResponse: false` overload rather than assuming.

**How to prove it either way.** A type-level probe is faster than inspecting inferred types by hand,
and needs no schema. Stand in for TypeGen with a hand-written `SanityQueries` entry, then assert the
result is neither `any` nor merely assignable:

```ts
type Expect<T extends true> = T
type IsAny<T> = 0 extends 1 & T ? true : false
type IsExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
```

Include the negative control — assert `IsAny<ClientReturn<string>>` — or the passing assertions prove
nothing, since a lookup that resolved unconditionally would satisfy them too.

## Environment variables are read by hand where `astro:env` would type them — *read*

Already noted in this project's CLAUDE.md as an improvement to make here; it applies there too.

`load-query.ts` reads `import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === 'true'`, then
reaches for the token through a fallback chain across `import.meta.env` and `process.env` with a
string coercion and an emptiness check. Declaring an `env.schema` in `astro.config.mjs` with
`envField` replaces all of it: `envField.boolean` removes the `=== 'true'` comparison, and
`envField.string({context: 'server', access: 'secret'})` removes the chain, the coercion and the
guard, because a secret server field is validated where it is declared.

**The one place `astro:env` cannot reach** is `astro.config.mjs` itself, which runs before Astro
loads `.env`. Config-time values — the Sanity integration's `projectId` and `dataset` — still need
Vite's `loadEnv`. That is a genuine platform constraint, not a shortcut, and it is worth a comment in
whichever file keeps it.

## Three mode flags where one would do — *read*

`package.json` there sets `ASTRO_OUTPUT`, `ASTRO_SITE_MODE` and
`PUBLIC_SANITY_VISUAL_EDITING_ENABLED` across four script entries, in combinations that have to be
kept consistent by hand.

They are not independent. Static output, the production host and visual-editing-off always travel
together, as do server output, the preview host and visual-editing-on. Three booleans expose eight
combinations of which two are meaningful, and the other six are only reachable by typo.

This site collapses them to a single `PUBLIC_SITE_MODE` of `production | preview`, and derives output
target, canonical host and adapter from it in `astro.config.mjs`. If a static preview build ever
turns out to be wanted, splitting `ASTRO_OUTPUT` back out is the escape hatch — but it should be
split deliberately, not by default.

## Fail once at module load, not per query — *read*

The token check there lives inside `loadQuery`, so it re-runs per call and reports on first fetch. A
missing token in a preview build is a configuration error, not a runtime condition, so failing at
module load surfaces it before any content is fetched.

The failure mode this guards against is the quiet one: published content on a public dataset reads
anonymously, so a preview build with no token **succeeds** and renders only published content. It
looks like it works, which is exactly what makes it expensive.

## Fragments can be split across files — resolved, so the query file can be broken up

`sanity.queries.ts` keeps projection fragments in the same file as the queries that interpolate them,
which is the only arrangement it proves. This site put fragments in a separate module, requiring
TypeGen to resolve **imported** string constants rather than local ones.

**Verified working in phase 1 here.** Every field from three separate imported fragments landed in the
generated types, with the result union correctly discriminated on `_type`. So `ux-methods` can split
`sanity.queries.ts` per document type or route whenever that file becomes unwieldy, without losing
type generation.

The mechanism worth knowing, because it is quiet when broken: it works because the fragments are
`const` string literals, so the interpolated template resolves to a single literal type — and that
literal is exactly the key TypeGen writes into `SanityQueries`. A fragment assembled at runtime, or
typed as `string` rather than left literal, breaks the chain and silently yields `any` while still
looking correct.

## Runtime and CI items — *read*, 2026-09-20

Previously carried from CLAUDE.md without checking. Both workflows have now been read, and the two
concrete items are confirmed:

- **Both deploy workflows pin Node 22, and the preview deploy script does `nvm use 20`.** Node 20
  reached end of life in April 2026, so that is an unsupported runtime rather than merely an old one.
  **And the two numbers differ**, which is the part worth noticing: `deploy-preview.yml` builds on
  Node 22 in CI and then runs the result under Node 20 on the droplet. Astro output is generally
  portable across those, so this is latent rather than broken — but it is a mismatch nobody chose.
- **Both workflows trigger on identical paths**, so every push builds twice. Confirmed: both list
  `astro/**`, `sanity.types.ts`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`.
- **The droplet gains a dependency on Node, pnpm and PM2 surviving reboots** — still *carried*.

One more from the same reading: **`pnpm install` runs without `--frozen-lockfile`** in both
workflows. In CI that lets a resolution drift from the committed lockfile without failing, so the
thing built is not necessarily the thing the lockfile describes.

## Deploy resilience — *read* and *measured*, 2026-09-20

Found while bootstrapping this project's staging host **on the same droplet**, so the measurements
are of shared infrastructure rather than of `ux-methods` specifically.

### A webhook storm is not hypothetical — it already happened here

On 2026-08-14 a Sanity dataset duplication fired one `repository_dispatch` per document into this
repository: **266 workflow runs in 179 seconds**, 9 of which reached the deploy step concurrently.
They raced to extract ~200 MB releases into the same directory, filled the droplet's 8.7 GB disk,
and then failed — `set -e` aborting each run *before* its cleanup step, so the releases accumulated
instead of being pruned. The disk sat at 100% for five weeks. Nothing reported it, because a static
site serves perfectly well with no free space; only writes fail.

**`ux-methods` has the same exposure and no brake.** Its workflows carry no `concurrency` block, and
`deploy-astro-ssg.yml` listens on four `repository_dispatch` types. Any bulk operation on that
dataset repeats this.

The fix used here is two concurrency groups at job level rather than one at workflow level:

- **build** — `cancel-in-progress: true`. Content builds supersede; only the newest matters.
- **deploy** — `cancel-in-progress: false`. Never interrupt a run that is mid-extraction on the
  droplet.

Cancelled builds never reach deploy, so a storm collapses to one or two builds and their deploys
queue. A single workflow-level group cannot express this: it either interrupts droplet writes or
serializes hundreds of builds.

Also worth adding: **a `df` check before extracting**, failing loudly. That is the difference between
one red X and five weeks of silent 100% disk.

### The preview deploy has no atomic swap, and therefore no rollback

`deploy-preview.yml` does this on the droplet:

```sh
rm -rf astro/dist astro/package.json astro/node_modules
tar xzf /tmp/astro-preview-artifact.tar.gz -C astro
pnpm install --prod
pm2 restart uxm-preview
```

The old build is deleted **before** the new one is known to be good. Between those lines the preview
has no application at all, and a failed extract or a failed install leaves it that way with nothing
to revert to — which on a disk that has already hit 100% once is not a remote scenario.

The SSG workflow has the same shape (`rm -rf /var/www/uxm/*`).

This project uses timestamped release directories and an atomic symlink swap, inherited from the
11ty deploy: extract beside the live one, repoint a symlink, prune to three. Rollback is repointing
the symlink. It costs disk — three releases instead of one — which on this droplet is a real
consideration rather than free, but two spare copies bought nothing during the incident above
precisely because they were all partial.

### `pnpm install` on the droplet is the expensive choice

The droplet is **1 vCPU and 512 MB of RAM** — which is why that step already carries
`NODE_OPTIONS="--max-old-space-size=512"`. Installing dependencies there means the deploy needs
network access to a registry, competes with serving four sites for one core, and can fail for
reasons entirely outside the repository.

Shipping `node_modules` inside the artifact is the alternative: a larger tar and a longer scp, in
exchange for a deploy that cannot fail on a registry outage and does not run a memory-hungry step on
the box that serves the sites. Worth weighing rather than assuming the current shape is cheaper.

This site's staging deploy sidesteps the question by being static, so it has no runtime dependencies
at all — but that stops being true when its own SSR preview lands, at which point the same decision
arrives here.

### `preview.uxmethods.org` is down, and has been for about five weeks — *measured*

Found while sizing this droplet, not by looking for it. **`curl -sI https://preview.uxmethods.org/`
returns 502**, measured 2026-09-20.

What makes it worth recording is that every safeguard people reach for was already in place:

| | |
|---|---|
| `pm2-uxm.service` | **enabled** |
| `~/.pm2/dump.pm2` | **present**, dated 2025-11-28 |
| droplet uptime | **42 weeks** — it has not rebooted |
| `pm2 list` | **empty** — no apps registered at all |
| `~/.pm2/pm2.log` | last entry **2026-08-26**, mtime **2026-09-20** |

`pm2 startup` and `pm2 save` were both done, which is the advice everyone gives, and they did not help.

**The list is EMPTY rather than `errored`, and that distinction is the whole diagnosis.** A crashed
app stays in the table with a failure status and PM2 keeps trying to restart it. An empty table means
the daemon's in-memory list was lost and never restored — and because the machine has not rebooted in
42 weeks, `pm2-uxm.service` has had no occasion to run `resurrect`. A startup unit only fires at boot.
It is insurance against reboots, and nothing else.

**The log's shape points at the disk.** PM2's version check writes at 00:23 daily. The last content is
from 2026-08-26, twelve days after the disk hit 100% on 14 August, yet the mtime updates daily — an
attempted write that lands no bytes, which is what a full filesystem produces. *Inference from the
timestamps, not proof; a definitive answer would need logs that no longer exist.*

Recovery is `pm2 resurrect` followed by `pm2 save`, noting that the dump predates the last deploy by
seven months, so it restores November's configuration rather than June's.

**What nobody had: any way to find out.** A public URL returned 502 for roughly five weeks with
correct supervision configured. Supervision restarts a process that dies; it does nothing about a
process that was never started. Whatever AFC's SSR preview looks like, "PM2 will handle it" covers
materially less than it sounds like — a check that fetches the URL is the thing that was missing, and
it is cheap.

### `pm2 restart` is the wrong verb in a deploy — *read*, consequence *inferred*

`deploy-preview.yml` ends with:

```sh
pm2 restart uxm-preview --update-env
```

`pm2 restart <name>` addresses an app that must already be registered. Against the empty process list
above it reports the app as not found and exits non-zero, which under the script's `set -e` aborts the
deploy — **after** the step that has already deleted `dist`, `package.json` and `node_modules`. The
delete-before-verify shape recorded earlier and this line combine into a deploy that cannot recover
the thing it just removed.

**Correcting an earlier draft of this note:** it said those deploys have been failing since August.
They have not. `gh run list --workflow=deploy-preview.yml` shows 20 consecutive successes and **no run
since 2026-06-26** — the app died well after the last deploy touched it. So this is a prediction about
the next deploy, not an observed failure, and the distinction matters: the trap is armed and untripped.

`pm2 startOrRestart ecosystem.config.js` is idempotent — it starts the app when absent and restarts it
when present. With that verb, the next deploy would have silently repaired all of this. It needs an
ecosystem file rather than a bare name, which is worth having anyway: it puts the app's port, name,
interpreter and environment under version control instead of in a daemon's memory and a stale dump.

### Node 20 is the only runtime installed — *measured*

`nvm current` under the `uxm` user reports **v20.19.6**, and `~/.nvm/versions/node/` contains nothing
else. So `nvm use 20 >/dev/null 2>&1 || true` in the deploy script is not selecting one version among
several — it is the only option, and the `|| true` would silently fall through to the system Node if
it ever disappeared.

Node 20 reached end of life in April 2026. This droplet is moving to **Node 24** (Andy, 2026-09-20),
which is also what this project's CI builds against. Worth knowing before that upgrade: whatever
restarts `uxm-preview` afterwards will be running it on a major version it has never run on, and the
app is currently stopped, so the upgrade and the first restart will land together.

### Capacity, which is now a shared concern

The droplet serves four sites from an 8.7 GB disk with 512 MB of RAM, and `/home/uxm` alone holds
1.7 GB (1.2 GB of it `.local`, plus 229 MB of `.nvm`).

**Disk turns out not to be the constraint, and an earlier draft of this note said otherwise.** It
estimated ~200 MB per release for this project's staging tree, carried across from the 11ty releases
on the droplet without checking. Measured: the Astro build is **7.8 MB across 107 files**, because
Sanity images are served from `cdn.sanity.io` at runtime rather than packaged.

The 11ty releases are 211 MB for an unrelated reason worth knowing, since `ux-methods` shares the
dependency pattern if it ever adds a PHP endpoint: **`google/apiclient` pulls
`google/apiclient-services`, which ships class definitions for all 670 Google APIs** — 220 MB and
37,282 files, for one service actually used. Adding `Google\Task\Composer::cleanup` as a
`pre-autoload-dump` script with `extra.google/apiclient-services` naming only the needed service
takes it to **4.4 MB and 571 files**, measured, with every used class still resolving.

**RAM is the real question, and it is emptier than it looks.** At the time of measurement the droplet
was using 168 Mi of 458 Mi with 289 Mi available — but that includes **no Node application at all**,
because `uxm-preview` is stopped (above). Those figures are nginx, PHP-FPM, systemd and PM2's
supervisor idling. Restoring that app and adding this project's SSR preview means going from zero
running Node apps to two, at roughly 80–150 MB each.

Feasible with 1.8 GB of swap free, but tighter than "plenty of headroom", and swapping on one vCPU is
felt. **Measure one real process before assuming two fit** — which is now possible for free, since
restoring `uxm-preview` gives exactly that measurement.

One structural note that falls out of the same reading: **PM2 is per-user.** Each user running it gets
its own supervisor daemon at ~16 MB. Two apps under one user share a daemon; two apps under two users
do not. That also decides who can restart what and where the logs land, so it is worth choosing rather
than inheriting.

## nginx configuration lives only on the server — *measured*, 2026-09-20

Both `uxmethods.org` and `preview.uxmethods.org` are configured through
`/etc/nginx/sites-available/`, edited in place, with no copy in the repository. That was true of this
project too until phase 6; the change here was to author the config in the repo and deploy it — scp,
`nginx -t`, reload — with every failure path restoring the previous files.

The reason that restore matters is not obvious and is worth carrying across: **`nginx -t` protects
the running process, not the files on disk.** Install a broken config, fail the test, never reload,
and the site stays up — until certbot's renewal hook or logrotate reloads hours later and it goes
down with no deploy anywhere near it.

One caveat found the same day, and it argues for reading the existing config before adopting this
pattern anywhere: the live `andyfitzgeraldconsulting.com` block carried a
`rewrite ^/writing/(.*)/?$ /insights/$1 permanent;` that existed **nowhere** in this repository's
records or in an archive of the live site — because a wget mirror captures what a site serves, and
that rule had been quietly honoring Jekyll-era URLs for years. If `ux-methods` adopts repo-authored
nginx, diff the installed files against what gets written rather than assuming the repo is complete.

## Dependency pins — *read*

`@sanity/client` is pinned `^7.20.0` there. `@sanity/visual-editing@6` peers on `^7.26.2`, so a
visual-editing upgrade will want the client moved up within v7. Worth noting that v8 exists but that
both `@sanity/astro` and `@sanity/visual-editing` still peer on v7, so v7 is the compatible ceiling
for now rather than a lag to fix.
