import {defineCliConfig} from 'sanity/cli'

/**
 * ── THE DEPLOYED STUDIO IS A NEW APP AT afconsulting.sanity.studio ─────────────────────────
 *
 * No hyphen, and a NEW Studio app — not the one the 11ty era deployed (Andy, 2026-09-28). This
 * file had no `studioHost` until the cutover, because the only deployed Studio then was the
 * `production` one and any `sanity deploy` from here risked overwriting it.
 *
 * ── WHAT IS THERE, MEASURED 2026-09-28, AND THE TRAP IN IT ────────────────────────────────
 *
 * The project has ONE Studio app, `nzdgq8jqulaft9768ud9xxk9`. Its `appHost` is `af-consulting`,
 * and it serves the 11ty-era Studio against the `production` dataset. Its dashboard TITLE is
 * "afconsulting.sanity.studio", which looks like it claims this host. It does not: a title is a
 * label, and no app's `appHost` is `afconsulting` — the host returned 404.
 *
 * So `deployment.appId` must NEVER be that id. With it, `sanity deploy` would replace the old
 * Studio instead of creating this one. Without an `appId`, the first deploy CREATES a new app at
 * `studioHost` and prints the id it issued; that id goes below, so later deploys update the same
 * app instead of prompting.
 *
 * DONE 2026-09-28: the first deploy created `g1jo20nnopb0mtoyt45zqakx` on `afconsulting`, at
 * 6.9.2 and not auto-updating. Confirmed through the management API, which also showed the old
 * app's active deployment still dated 2026-08-05 — untouched.
 *
 * `afconsulting.sanity.studio` 302s to the Studio's route on www.sanity.io, as the old host does,
 * and the redirect keeps the path — `/intent/edit/…` arrives intact, with the `default`
 * workspace inserted. So stega's edit links can name this host. The deploy did NOT add it to
 * CORS; the Studio runs on Sanity's own origin, so that is expected rather than missing.
 *
 * ── `autoUpdates: true` SINCE 2026-10-01, AFTER A LAUNCH PIN ─────────────────────────────
 *
 * It shipped `false` for the cutover (Andy, 2026-09-28). `sanity build` had shown that with
 * auto-updates on, the deployed Studio would run `sanity` 6.16.0 against a workspace written on
 * 6.9.2 — seven minors arriving on launch day, first exercised in production. The pin was always
 * meant to come off as its own piece of work, and did in `dc13a70`.
 *
 * What it means now: the deployed Studio loads the latest `sanity` in this major from Sanity's
 * CDN, so it can run AHEAD of the lockfile, which records only what was last tested locally.
 * Version-specific code is where that bites. The `sanity.videoAsset` workaround in
 * sanity.config.ts was read out of one release's bundle — 6.9.2, re-read in 6.18.0 — and nothing
 * announces when a later release makes it dead, so re-read it when upgrading.
 *
 * Presentation and stega's click-to-edit links point at this host — `PUBLIC_SANITY_STUDIO_URL`
 * in the preview build.
 */
export default defineCliConfig({
  api: {
    projectId: '7v0qvet6',
    dataset: 'production-26',
  },

  studioHost: 'afconsulting',
  deployment: {
    autoUpdates: true,
    // Issued by the first `sanity deploy`. Never 'nzdgq8jqulaft9768ud9xxk9' — see above.
    appId: 'g1jo20nnopb0mtoyt45zqakx',
  },

  /**
   * TypeGen runs here because the schema is here, but writes into web, because that is where
   * the queries are and where the types get consumed.
   *
   * `enabled: false` deliberately. With it on, `sanity dev` regenerates in watch mode, which makes
   * a second writer of a committed file — and the dev server's prettier resolves differently from
   * the CLI's, so the two produce identical types in different formats (827 lines against 901).
   * Whichever ran last won, and `sanity.types.ts` churned by ~900 lines between them. One writer,
   * invoked deliberately, is worth losing live regeneration for: run `pnpm typegen` from the root
   * after changing the schema or a query. `.github/workflows/checks.yml` regenerates on every push
   * and fails on a diff, which catches forgetting (phase 8, 2026-10-08).
   *
   * `path` covers `web/src/sanity/` only (Andy, 2026-10-08). It used to cover all of `web/src`,
   * and every run printed "⚠ Encountered errors in 3 files": the three `[slug].astro` pages have a
   * top-level `return Astro.rewrite('/404')`, which Astro's frontmatter allows and a module parser
   * rejects. No query lived in any of them, so nothing was lost — but a warning on every run is
   * how a real one gets missed.
   *
   * Narrowing it has a second effect, and that is the one that matters: a query defined anywhere
   * else is now INVISIBLE to TypeGen and gets no result type. So "queries live in their own
   * module" is enforced by the tool rather than by habit. If a query ever has to live elsewhere,
   * widen this — don't let it sit where TypeGen cannot see it.
   *
   * No `--enforce-required-fields`: the preview environment reads drafts, and a draft can sit in
   * an invalid state, so a field marked required in the schema can still arrive undefined. Types
   * that promise otherwise would be lying exactly where it costs most.
   */
  typegen: {
    enabled: false,
    path: '../web/src/sanity/**/*.ts',
    schema: 'schema.json',
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true,
  },
})
