import type {APIRoute} from 'astro'
import {buildSearchIndex} from '../lib/search-index'
import {stegaClean} from '@sanity/client/stega'
import {loadQuery} from '../sanity/load-query'
import {
  SEARCH_CONCEPTS_QUERY,
  SEARCH_INSIGHTS_QUERY,
  SEARCH_PAGES_QUERY,
  SEARCH_PRESENTATIONS_QUERY,
  SEARCH_REVIEWS_QUERY,
} from '../sanity/queries/search'

/**
 * The search index, as a real file emitted at build.
 *
 * ── `prerender` IS EXPLICIT, AND IT IS NOT REDUNDANT ────────────────────────
 *
 * Under production's `output: 'static'` every route prerenders and this line changes
 * nothing. Under the PREVIEW build's `output: 'server'` it is the difference between a
 * build artifact and a per-request handler — and a handler would hit Sanity four times
 * per visitor for content that changes once per deploy.
 *
 * So it is written for the mode where it matters, in the file it governs, rather than
 * inferred from a config the reader is not looking at.
 *
 * ── THIS IS NOT THE ON-DEMAND ROUTE astro.config.mjs FORBIDS ────────────────
 *
 * That note (astro.config.mjs:50) rules out `src/pages/api/…` with
 * `export const prerender = false`, because an on-demand route needs an adapter and
 * production has none — so it would build under preview and fail under production. A
 * prerendered endpoint is the opposite case: it needs no adapter in either mode, because
 * by the time the server starts the answer is already a file on disk.
 *
 * ── FETCHED LAZILY, WHICH IS WHY IT IS A FILE AND NOT INLINE MARKUP ─────────
 *
 * The masthead field is on all 61 pages and only one of them is `/search/`, so inlining
 * the index would put ~40 KB of JSON into every page to serve the small fraction of
 * visits that search. As a file it is fetched once, on first use, and cached.
 */
export const prerender = true

export const GET: APIRoute = async () => {
  /* Five independent queries, so five concurrent round trips rather than five serial
     ones. Independent because they are split by the ClientReturn ceiling rather than by
     any data dependency — see the header of queries/search.ts. */
  const [insights, presentations, pages, reviews, concepts] = await Promise.all([
    loadQuery(SEARCH_INSIGHTS_QUERY),
    loadQuery(SEARCH_PRESENTATIONS_QUERY),
    loadQuery(SEARCH_PAGES_QUERY),
    loadQuery(SEARCH_REVIEWS_QUERY),
    loadQuery(SEARCH_CONCEPTS_QUERY),
  ])

  /* ── CLEANED BEFORE THE INDEX IS BUILT, NOT AFTER ─────────────────────────────
     This route is prerendered, so a preview build runs it with stega ON: measured
     2026-09-29, 759,424 invisible characters in the preview index. Cleaning the finished
     JSON (feed-entries.ts cleans its finished XML) would be too late here — keyword
     extraction and tokenizing read the text, and stega sits glued to the last word of
     every field. `stegaClean` rather than a zero-width regex, because it removes only
     encoded sequences: real content carries zero-width joiners too (emoji). No effect in
     production, where stega is off. See STEGA AND LOGIC in sanity/load-query.ts. */
  const entries = buildSearchIndex(stegaClean({insights, presentations, pages, reviews, concepts}))

  /* Minified. The entries are sorted for determinism rather than for reading — see
     buildSearchIndex — and anything inspecting this by hand has `jq`. */
  return new Response(JSON.stringify(entries), {
    headers: {'content-type': 'application/json; charset=utf-8'},
  })
}
