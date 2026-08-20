import {defineCliConfig} from 'sanity/cli'

/**
 * Deliberately no `studioHost` or `deployment` block, unlike studio/. Those name the deployed
 * studio at af-consulting.sanity.studio, which still serves the live `production` dataset — a
 * `sanity deploy` from here carrying them would overwrite it. studio-next gets its own host at
 * the phase 6 cutover, not before.
 */
export default defineCliConfig({
  api: {
    projectId: '7v0qvet6',
    dataset: 'production-26',
  },

  /**
   * TypeGen runs here because the schema is here, but writes into web-next, because that is where
   * the queries are and where the types get consumed.
   *
   * `enabled: false` deliberately. With it on, `sanity dev` regenerates in watch mode, which makes
   * a second writer of a committed file — and the dev server's prettier resolves differently from
   * the CLI's, so the two produce identical types in different formats (827 lines against 901).
   * Whichever ran last won, and `sanity.types.ts` churned by ~900 lines between them. One writer,
   * invoked deliberately, is worth losing live regeneration for: run `pnpm typegen` from the root
   * after changing the schema or a query. Phase 7 should add a CI check that regenerates and fails
   * on a diff, which catches forgetting.
   *
   * No `--enforce-required-fields`: the preview environment reads drafts, and a draft can sit in
   * an invalid state, so a field marked required in the schema can still arrive undefined. Types
   * that promise otherwise would be lying exactly where it costs most.
   */
  typegen: {
    enabled: false,
    path: '../web-next/src/**/*.{ts,tsx,js,jsx,astro}',
    schema: 'schema.json',
    generates: '../web-next/sanity.types.ts',
    overloadClientMethods: true,
  },
})
