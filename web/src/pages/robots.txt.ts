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
 * ── `/search/` STAYS CRAWLABLE, AND THAT IS NOT AN OVERSIGHT ───────────────
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
 * ── FILTER COMBINATIONS ARE THE ONE DISALLOW ───────────────────────────────
 *
 * Added 2026-10-02, after Googlebot fell into the index filters. `card-index.ts` rewrites
 * every chip's href to "the current selection, toggled", and Google renders JavaScript —
 * so each filtered page it fetched handed it dozens of new combinations, each of which
 * handed it dozens more. It began 2026-09-29, the day after cutover, and roughly doubled
 * daily: 417,000 requests on 2026-10-02, nearly all 200s for distinct
 * `/insights/?topic=a,b,c&genre=x,y` URLs, every one a copy of the index. They were
 * filling the droplet's shared access log on a disk at 85%.
 *
 * NEARLY ALL OF IT WAS EMPTY PAGES, and the reason is worth knowing. A zero-count chip keeps
 * its href — `aria-disabled` rather than no link, so that it stays focusable — and from an
 * empty state every chip is zero-count, so a crawl only ever goes deeper. Measured on
 * 2026-10-05: 99.98% of Meta's combination requests and 99.1% of a browser fleet's were
 * filter states with no results, while the states that DO have results number about 1,650
 * across both indexes. SINCE 2026-10-08 A ZERO-HIT CHIP LINKS TO THE VIEW IT IS ON, which
 * bounds the crawl at those states — see card-index.ts. Nothing below depends on it: these
 * lines and the edge rule still stop the crawl from the URLs already discovered.
 *
 * `/*,` matches a comma anywhere — one facet holding several values. `/*&` matches an
 * ampersand — more than one facet. No page URL on the site contains either. SINGLE-facet
 * URLs stay crawlable, which matters: they are what the server-rendered chips link to, and
 * where the 67 old tag pages redirect (nginx/redirects.conf).
 *
 * This is not the `/search/` mistake above. That page's own `noindex` had to be readable.
 * These carry only a canonical to `/insights/`, and Google's faceted-navigation guidance
 * names robots.txt as THE way to stop this crawl — a canonical "may, over time, decrease
 * the crawl volume", which is too slow at a doubling rate. A blocked URL could in principle
 * be indexed bare from inbound links, but nothing links to these except the page's own
 * script.
 *
 * Google applies the LONGEST matching rule, so `Disallow: /*,` outranks `Allow: /` for the
 * URLs it matches, and `Allow: /` stays true of everything else. Both builds carry it:
 * preview renders each combination on demand in Node, so a crawl costs more there, not
 * less. Google re-reads this file within about a day.
 *
 * ── IT WORKED FOR GOOGLE AND NOT FOR META, SO IT IS ENFORCED AT THE EDGE ────
 *
 * The check named here was Googlebot's combination requests falling to zero, and they did:
 * 396,658 on 2026-10-02, none from 2026-10-04 on. `meta-externalagent` never stopped — 46,685
 * on 2026-10-05, every one disallowed — and never fetched this file at all, though Meta's
 * link-preview fetcher reads it daily and Meta documents the crawler as honoring it. A fleet
 * presenting a browser user agent followed, one request per address from 50,008 addresses.
 *
 * So since 2026-10-06 a Cloudflare custom rule challenges these URLs at the edge, before
 * they reach the droplet. nginx/afc-production.conf records it: the expression, why a
 * Managed Challenge, and the check to repeat. THE RULE MIRRORS THE TWO DISALLOW LINES BELOW,
 * more narrowly, and the two must change together. The lines still earn their place: they
 * are what the rule enforces, and a crawler that honors them never meets it.
 *
 * ── AI CRAWLERS: NO SPECIAL RULES, DELIBERATELY ────────────────────────────
 *
 * Andy's call, 2026-09-13, and a values call rather than a technical one. Two reasons
 * recorded so the absence reads as a decision: his writing being findable by the
 * assistants people now ask questions of is continuous with why the site exists — CLAUDE.md's
 * "drawing more people into that network" — and the bot list churns, so a stale blocklist
 * is worse than none. Worth saying plainly: robots.txt is voluntary either way. It stops
 * the well-behaved and nobody else — shown on 2026-10-06, above. The Cloudflare rule that
 * followed is not an AI-crawler rule: it applies to every client alike, and only to URLs
 * this file already disallows.
 *
 * ── WHAT THIS DOES NOT SOLVE, AND WHERE THAT LANDED ────────────────────────
 *
 * Preview is kept out of the index by `noindex` twice over — nginx's `X-Robots-Tag` and a
 * robots meta the preview build writes into every page — and by a sitemap it does not
 * advertise. This comment used to call that "adequate, not strong" and name HTTP basic auth as
 * the strong answer. Phase 6 built it, and then took it out (2026-09-29): Presentation's frame
 * cannot authenticate against basic auth, so it broke visual editing, which is the only reason
 * the preview host exists. See nginx/afc.conf for the evidence.
 *
 * So the host is open, and crawlable on purpose, for the same reason `/search/` is above: a
 * crawler has to fetch a page to read its `noindex`. What basic auth ALSO did — make bots cheap
 * — moved to a per-address render limit in nginx, not here.
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
    'Disallow: /*,',
    'Disallow: /*&',
    ...(isPreview ? [] : ['', `Sitemap: ${new URL('/sitemap.xml', site).href}`]),
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {'content-type': 'text/plain; charset=utf-8'},
  })
}
