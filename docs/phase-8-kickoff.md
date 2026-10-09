# Phase 8 — quality gates, per-taxonomy feeds, POSSE

Paste this into a new session. CLAUDE.md loads automatically; this covers what it doesn't, plus
what the phase 7 close-out found that bears on this phase.

---

CLAUDE.md is loaded. **Read the phase 8 entry under `## Current direction`, then "Deploy shape"
and "Branching and verification".** Read `docs/feeds-kickoff.md` and `docs/urls-and-filtering.md`
when the feeds work starts, not before. This prompt covers what those don't.

**Do not write code in the first turn.** Propose the order of work and the shape of the first
piece, put the seams that block it to Andy, and stop.

## Start state

Phase 7 closed on 2026-10-08. `main` was at `d79aa35` and **4 commits ahead of `origin/main`,
unpushed**, when this was written; check `git status -sb` rather than trusting that, since Andy
may have pushed since. A push to `main` touching `web/**` deploys production AND preview.

Green at handoff: `astro check` 0/0/0, `pnpm typegen` makes no diff, Prettier clean on every
touched file, `nginx/deploy.sh` 9/9, all four droplet hosts 200 from outside.

Branch from `main` for each piece. Plain kebab-case, no prefix.

## What phase 8 holds, and what exists today

| Strand | The work | What exists |
|---|---|---|
| **Quality gates** | performance budgets, accessibility, link checking, HTML validation, a TypeGen drift check | Almost nothing. `validate-nginx.yml` runs `nginx -t`. `deploy-preview.yml` fails if any sitemap URL is not 200 from the SSR build. **The production deploy checks nothing.** `astro check` and `pnpm parity` exist, run by hand. |
| **Per-taxonomy feeds** | one feed per concept | Five section and type feeds since 2026-09-13. `RssBand`'s `buttonTarget` is content, so a page can point at a concept feed without a code change. |
| **POSSE + the mf2 remainder** | `u-syndication`, `p-summary`, `dt-updated`, `rel="webmention"` plus rendering received mentions, `h-feed`; syndication to LinkedIn, Bluesky and Mastodon through Bridgy | `h-entry` on the detail pages; the representative `h-card` on home only (`Masthead`, opt-in); `<link rel="author" href="/">` on every page. |
| **Service worker** | decide whether to have one at all | Nothing here. `ux-methods` runs one; read it first. |

Also in this phase, per CLAUDE.md: **trailing slashes on internal links** and **hrefs to the site's
own domain** (absolute, or legacy schemes like `www.` and `/writing/`) as rules in the link check.
Two open GitHub issues sit next to the feeds work — #4 (a copy-to-clipboard button on feed links)
and #6 (counting feed subscribers from the nginx logs). Neither is in scope unless Andy pulls it in.

## Recommended order — the first thing to put to Andy

**Gates first, then feeds, then POSSE. The service worker last, or declined.** This is a
recommendation; the order is his call.

- **Gates before anything that changes templates.** Feeds and mf2 both touch every detail page, and
  a regression there should be caught by a check, not by eye. The cheapest gate would also have
  caught a real miss this week: phase 7 removed seven schema fields, and `sanity.types.ts` declared
  all of them until someone ran `pnpm typegen` by hand.
- **Within the gates, cheap and deterministic first:** TypeGen drift, `astro check` and Prettier,
  then the link check, then HTML validation, then accessibility, then performance budgets. Budgets
  come last because they need numbers, and numbers are a seam (below).
- **Feeds before POSSE.** Feeds are self-contained once their URLs are designed. POSSE has the most
  external dependencies, the most content-model seams, and the Cloudflare risk.

## The seams in this phase — surface, recommend, stop

Each of these is Andy's. Bring a recommendation; do not build past one.

1. **What each gate blocks.** `deploy-astro.yml` also runs on every Sanity publish webhook. A gate
   that fails on an external dead link would block a content publish for a reason the author cannot
   fix in the Studio. A likely shape: gates run on a push to any branch, as `validate-nginx.yml`
   does; webhook-triggered builds run a narrower set; and each gate is either blocking or advisory.
   Decide per gate.
2. **Where budget numbers live.** A budget is a value with one consumer, so by the project's own
   rule it is not a token. But it needs a home that is diffable and explained.
3. **Per-concept feed URLs.** URL design is his. `docs/urls-and-filtering.md` fixes `/feed.xml` in
   place and calls per-taxonomy feeds "additions, not a reorganization". It also rules out
   per-topic PAGES, so a concept feed addresses a resource with no page behind it. What does the URL
   identify, and what does it key on? Two related questions: whether the feed follows the filter
   rule (direct tags only, no roll-up), and whether Genre concepts get feeds as well as Topics.
4. **`p-summary`'s source.** `shortDescription` is card copy, and syndication text is a different
   job: Bluesky allows 300 characters, and Bridgy truncates by its own rule without a summary.
   Whether syndication gets its own field is content modeling.
5. **`u-syndication`.** An array-of-URLs field on `article` and `note`, plus a way to fill it.
   Andy's inclination (2026-08-26) was a webhook writing back to Sanity. A scheduled workflow as a
   backstop has a catch: **GitHub disables scheduled workflows after 60 days of repo inactivity.**
6. **Displaying webmentions.** Receiving is inert without a build-time fetch and somewhere to render
   what arrives. That is a component boundary, plus a moderation question: what is shown at all.
7. **The service worker**, whether at all. CLAUDE.md's phase 8 entry has the four constraints;
   the marginal benefit over correct `Cache-Control` is small.

## Traps already found

- **`pnpm typegen` prints "⚠ Encountered errors in 3 files" on every run.** The three
  `[slug].astro` pages have a top-level `return Astro.rewrite('/404')`, which does not parse as a
  module. No queries live there — every file that defines one is under `web/src/sanity/` — so
  nothing is lost. **A drift check must therefore key on
  `git diff --exit-code web/sanity.types.ts`, not on typegen's output or exit status.** Narrowing
  typegen's `path` in `studio/sanity.cli.ts` to `../web/src/sanity/**` would silence it; propose
  that with the check. The same file's comment says "Phase 7 should add a CI check", so correct it
  to phase 8 when the check lands.
- **Prove the regeneration is deterministic in CI before making it blocking.** `sanity.cli.ts`
  records that two Prettier resolutions once produced identical types in different formats (827
  lines against 901). CI must run the same `pnpm typegen` path, and a clean-tree regen on the runner
  must show zero diff first.
- **A gate is not known to work until it has failed.** Prove each one on a scratch branch with a
  deliberate violation, watch it fail, then remove the violation.
- **`trailingSlash: 'always'` may change the SSR preview's behavior.** Check that before choosing it
  over a link-check rule.
- **Cloudflare fails POSSE silently.** Bot protection challenges exactly the non-browser clients
  this phase depends on (Bridgy, webmention.io, feed readers), and a challenged fetch never arrives
  rather than erroring. When something IndieWeb-shaped does not work, check Cloudflare first. The
  one custom challenge rule matches filter-combination URLs, not clients; see
  `nginx/afc-production.conf`.
- **The Sanity CLI's `documents query` exits 1 on any falsy result**, so a `count()` of 0 reads as
  an error. Hand Andy queries whose clean answer is truthy, like `count(...) == 0`.
- **Re-measure the corpus before quoting it.** Andy edits content mid-session.

## Verification

Static build, then the checks that exist today:

```bash
pnpm --filter web build && pnpm parity && pnpm --filter web check
```

Andy does the visual checks. Get each piece green and integration-verified, then hand him the
specific steps to look at.

## How to work

Small, reviewable pieces: one gate or one feed decision per branch. Say the shape in a sentence
before building a surface; a seam ends the turn. Prototype in the scratchpad. Commit and push only
when asked — and remember that a push to `main` is a production deploy.
