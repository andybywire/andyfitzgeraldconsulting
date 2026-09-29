import type {ClientReturn, QueryParams} from '@sanity/client'
import {sanityClient} from 'sanity:client'
import {PUBLIC_SANITY_STUDIO_URL, PUBLIC_SITE_MODE} from 'astro:env/client'
import {SANITY_API_READ_TOKEN} from 'astro:env/server'

/**
 * The single path to Sanity content. No page or component constructs a client, and no page
 * decides which perspective it is reading — that belongs here, once.
 *
 * Perspective is a build-mode flag, not a per-request cookie. The preview environment is a
 * separate deploy built with drafts on, which is what lets production stay static: there is
 * no cookie to check, so no need for a server in front of the public site.
 */
const isPreview = PUBLIC_SITE_MODE === 'preview'

/**
 * Fail at module load rather than per query. Published content on a public dataset reads
 * anonymously, but drafts never do, so a preview build without a token would otherwise
 * succeed while silently rendering nothing but published content.
 */
if (isPreview && !SANITY_API_READ_TOKEN) {
  throw new Error(
    'SANITY_API_READ_TOKEN is required when PUBLIC_SITE_MODE=preview — drafts cannot be read anonymously.',
  )
}

/**
 * `sanity:client` comes from the @sanity/astro integration, already carrying projectId,
 * dataset and apiVersion from astro.config. `withConfig` layers the mode-dependent half on
 * top, so the two halves stay in the places that own them.
 *
 * stega encodes edit references into the content strings themselves, which is what makes
 * click-to-edit work in Presentation. It needs the result source map to do that, so the two
 * are requested together or not at all.
 *
 * ── STEGA AND LOGIC: CLEAN ANY STRING THAT IS COMPARED, KEYED OR PARSED ────────────────
 *
 * In preview, almost every string this returns carries invisible characters after its
 * visible text. That is harmless in markup and fatal in logic: `'Document' + stega !==
 * 'Document'`, a Set of encoded kinds never `.has('video')`, and a slug built from an
 * encoded label carries the junk into its URL. So any value that is COMPARED, used as a
 * KEY, or PARSED must go through `stegaClean` (from '@sanity/client/stega') first; a value
 * that is only rendered must not, or it loses its click-to-edit link.
 *
 * THIS WENT UNSEEN UNTIL 2026-09-29 because stega had never actually run: it is enabled
 * only with a Studio URL, and none was set anywhere until the SSR preview work. The first
 * run 500'd 73 of 83 pages — `lib/genres.ts` and `lib/related.ts` identify Genre concepts
 * by prefLabel and threw — and a static audit then found five more sites failing SILENTLY,
 * with a 200 and the wrong output, which no status sweep can catch.
 *
 * What stega skips, read from @sanity/client 7.26's own filter rather than assumed: keys
 * beginning `_` or ending `Id` (so `_type`, `_id`, `_ref` are safe), `slug.current`, values
 * that parse as URLs or dates, anything under `meta`, `metadata`, `openGraph` or `seo`, any
 * path segment containing "type", a denylist (`id`, `key`, `slug`,
 * `url`, `href`, `status`, `theme`, `variant` and a few dozen more), and Portable Text's
 * `style`, `listItem` and `markDefs` — it walks only a block's `children` and a span's
 * `text`. Everything else is encoded, INCLUDING `prefLabel` and `kind`.
 *
 * To find every site that needs it after a change, audit comparisons rather than trusting a
 * list here (a list would rot):
 *
 *   grep -rnE "(===|!==)\s*'|\.has\('|slugify\(|new Set\(" web/src
 *
 * and ask of each hit whether the value came from a query. `feed-entries.ts` cleans its
 * whole input up front instead, which is the right shape for output that is never edited.
 */
const client = sanityClient.withConfig(
  isPreview
    ? {
        perspective: 'drafts',
        useCdn: false,
        token: SANITY_API_READ_TOKEN,
        resultSourceMap: 'withKeyArraySelector',
        stega: {
          // Without a Studio URL there is nowhere for an edit link to point, so
          // encoding would only corrupt the strings.
          enabled: Boolean(PUBLIC_SANITY_STUDIO_URL),
          studioUrl: PUBLIC_SANITY_STUDIO_URL,
        },
      }
    : {
        perspective: 'published',
        useCdn: false,
        resultSourceMap: false,
        stega: {enabled: false},
      },
)

/**
 * Run a named query from `./queries/`.
 *
 * The `const Q extends string` is load-bearing and easy to lose. TypeGen augments the client's
 * `SanityQueries` map keyed by the query's literal text, and `ClientReturn<Q>` is the lookup
 * into it. Typing this parameter as plain `string` — or taking the result type as a caller
 * supplied generic — widens that key away, and every call site silently degrades to `any`
 * while still looking typed. Passing the literal through keeps results typed from the real
 * projection rather than from a hand-written promise about it.
 */
export function loadQuery<const Q extends string>(
  query: Q,
  params: QueryParams = {},
): Promise<ClientReturn<Q>> {
  return client.fetch(query, params)
}
