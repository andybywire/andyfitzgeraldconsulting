import type {APIRoute} from 'astro'
import {PUBLIC_SITE_MODE} from 'astro:env/client'

/**
 * `/robots.txt`.
 *
 * ── AN ENDPOINT RATHER THAN A FILE IN `public/` ────────────────────────────
 *
 * A static file would be byte-identical in both builds, so the preview deploy would
 * advertise PRODUCTION's sitemap and invite crawlers to index preview's copy of every
 * page. Reading `Astro.site` is the same arrangement `linked-data.ts` uses for `@id` and
 * for the SearchAction target, and it is the only thing that makes the preview case
 * expressible at all.
 *
 * ── ALLOW EVERYTHING, INCLUDING `/search/`, AND THAT IS NOT AN OVERSIGHT ────
 *
 * The tempting line is `Disallow: /search/`, and it would be actively harmful.
 * `Disallow` blocks CRAWLING, not indexing — so a crawler never fetches the page and
 * never sees the `noindex` that is already on it. A disallowed URL can still be indexed
 * from inbound links, showing as a bare URL with no description, and the one directive
 * that actually says "do not index this" has been made unreachable.
 *
 * So the pages that should stay out of the index say so themselves, in a meta tag, and
 * this file keeps them crawlable so that the tag can be read. Same for `/404.html`.
 *
 * ── AI CRAWLERS: NO SPECIAL RULES, DELIBERATELY ────────────────────────────
 *
 * Andy's call, 2026-09-13, and a values call rather than a technical one. Two reasons
 * recorded so the absence reads as a decision: his writing being findable by the
 * assistants people now ask questions of is continuous with why the site exists — CLAUDE.md's
 * "drawing more people into that network" — and the bot list churns, so a stale blocklist
 * is worse than none. Worth saying plainly: robots.txt is voluntary either way. It stops
 * the well-behaved and nobody else.
 *
 * ── WHAT THIS DOES NOT SOLVE, AND WHERE THAT LANDS ─────────────────────────
 *
 * Preview is protected by `noindex` on every page and by a sitemap it does not advertise.
 * That is adequate, not strong. The strong answer is HTTP basic auth on the preview server
 * block, which is one line in an nginx config phase 6 is writing anyway — and unlike a
 * `Disallow: /`, it does not trade the noindex away to get it.
 */
export const prerender = true

const isPreview = PUBLIC_SITE_MODE === 'preview'

export const GET: APIRoute = ({site}) => {
  if (!site) throw new Error('[robots] `site` is unset in astro.config.mjs')

  /*
   * `Allow: /` is redundant — allow-all is the default when no `Disallow` matches — and it
   * is kept because a robots.txt is read by people deciding whether a site minds being
   * crawled. Saying it costs one line and answers the question without inference. The live
   * `web/robots.txt` says nothing but a Sitemap line, which is valid and reads like an
   * omission.
   *
   * The Sitemap line is ABSENT on preview. Preview's sitemap is a real file and would be a
   * perfectly good map of a site that should not be mapped; leaving the line off means the
   * pages stay crawlable, so their `noindex` is still read, without the crawl being invited.
   */
  const lines = [
    'User-agent: *',
    'Allow: /',
    ...(isPreview ? [] : ['', `Sitemap: ${new URL('/sitemap.xml', site).href}`]),
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {'content-type': 'text/plain; charset=utf-8'},
  })
}
