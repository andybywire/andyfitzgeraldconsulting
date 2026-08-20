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
   * the queries are and where the types get consumed. `enabled` regenerates during `sanity dev`
   * and `sanity build`; the `typegen` script does the same thing on demand.
   *
   * No `--enforce-required-fields`: the preview environment reads drafts, and a draft can sit in
   * an invalid state, so a field marked required in the schema can still arrive undefined. Types
   * that promise otherwise would be lying exactly where it costs most.
   */
  typegen: {
    enabled: true,
    path: '../web-next/src/**/*.{ts,tsx,js,jsx,astro}',
    schema: 'schema.json',
    generates: '../web-next/sanity.types.ts',
    overloadClientMethods: true,
  },
})
