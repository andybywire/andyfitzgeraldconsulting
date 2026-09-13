import type {APIRoute} from 'astro'
import {loadQuery} from '../sanity/load-query'
import {
  SITEMAP_INSIGHTS_QUERY,
  SITEMAP_PAGES_QUERY,
  SITEMAP_PRESENTATIONS_QUERY,
  SITEMAP_REVIEWS_QUERY,
} from '../sanity/queries/sitemap'

/**
 * `/sitemap.xml` — every indexable URL on the site, with a real revision date.
 *
 * ── HAND-AUTHORED, NOT `@astrojs/sitemap` ──────────────────────────────────
 *
 * The integration is the obvious choice and the wrong one here, for the same shape of
 * reason Content Layer was declined in phase 0.
 *
 * It enumerates BUILT ROUTES, so what a page is gets inferred from where it landed, and
 * everything that should not be listed is subtracted afterwards in a `filter` callback in
 * astro.config. That inverts the statement: exclusions accumulate in a file nobody reads
 * while writing pages, and a new route is in the sitemap by default — including the next
 * specimen. Driving it from the queries instead states INCLUSIONS positively, and a route
 * that wants listing has to say so here.
 *
 * It also cannot produce a true `lastmod`. Routes carry no revision date, so the
 * integration either omits it or stamps build time — and build time is a lie that Google
 * explicitly discounts: lastmod is used only where it is consistently accurate, so a
 * sitemap claiming all 60 URLs changed at once is worse than one claiming nothing.
 *
 * And `search.json.ts` is already this pattern — a prerendered endpoint driven by GROQ —
 * so this is the house pattern rather than a new one.
 *
 * ── ONE FILE, NOT A SITEMAP INDEX ──────────────────────────────────────────
 *
 * `ux-methods` emits `sitemap-index.xml` because `@astrojs/sitemap` always does. An index
 * exists to stitch together sitemaps past the protocol's 50,000-URL or 50 MB limit; this
 * one has 60 URLs and about 8 KB. `/sitemap.xml` is also the URL the LIVE `web/robots.txt`
 * already advertises, so keeping the name means one less thing to change at cutover.
 *
 * ── WHAT IS DELIBERATELY ABSENT ────────────────────────────────────────────
 *
 * `/search/` and `/404.html` — both `noindex`, and a results page and an error page have
 * no business in an index.
 *
 * `/specimen/` — a design specimen, reference material rather than content. NOTE that
 * leaving it out of here does not stop it being crawled: it builds into `dist` and answers
 * 200 with no `noindex`. Excluding it from the sitemap is half the job and the other half
 * is a decision about a page this file does not own.
 *
 * `changefreq` and `priority` — Google ignores both and has said so for years. The live
 * `sitemap.njk` already had `changefreq` commented out, which was the right instinct.
 *
 * Review anchors — see the note on SITEMAP_REVIEWS_QUERY. A fragment is a position within
 * a document, not a document.
 */
export const prerender = true

/** ISO-8601 is what `<lastmod>` takes, and `_updatedAt` is already ISO-8601. */
interface Dated {
  _updatedAt: string
}

/**
 * The newest revision among a set, for the index pages.
 *
 * A listing page changes when its listing does, so `/insights/` is as fresh as its
 * freshest article. That is the honest answer available without inventing one: the
 * alternatives are the singleton's own `_updatedAt`, which moves only when Andy edits the
 * page's own copy and would call a page stale while it lists something published today, or
 * omitting `lastmod`, which throws away a date we can compute correctly.
 *
 * ISO-8601 strings sort lexically, so `localeCompare` is a date comparison here — the same
 * property `queries/search.ts` relies on for `latestEnd`.
 */
const newest = (rows: Dated[]): string | undefined =>
  rows.map((row) => row._updatedAt).sort((a, b) => b.localeCompare(a))[0]

interface Entry {
  loc: string
  lastmod?: string
}

/**
 * `<loc>` must be a fully-qualified URL, per the protocol — relative paths are invalid.
 * Built from `Astro.site` so a preview build describes preview, the same arrangement
 * `linked-data.ts` uses for `@id` and for the SearchAction target.
 */
const urlset = (entries: Entry[], site: URL): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(({loc, lastmod}) =>
      [
        '  <url>',
        `    <loc>${new URL(loc, site).href}</loc>`,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n')

export const GET: APIRoute = async ({site}) => {
  /* Typed as optional because `Astro.site` is, though astro.config sets it in both modes.
     Failing loudly beats emitting a sitemap of relative paths, which is invalid XML per
     the protocol and would be accepted silently by anything that never validates it —
     the same reasoning BaseLayout gives for throwing on a missing `site`. */
  if (!site) throw new Error('[sitemap] `site` is unset in astro.config.mjs')

  const [insights, presentations, pages, reviews] = await Promise.all([
    loadQuery(SITEMAP_INSIGHTS_QUERY),
    loadQuery(SITEMAP_PRESENTATIONS_QUERY),
    loadQuery(SITEMAP_PAGES_QUERY),
    loadQuery(SITEMAP_REVIEWS_QUERY),
  ])

  /*
   * The URL shapes are stated here rather than imported, because this build has no
   * permalink module — `/insights/${slug}/` is written in `search-index.ts`, in
   * `specimen.astro`, in `WorkWithMeBand.astro` and as `basePath` on the cards. Adding a
   * fifth site is consistent rather than novel, and centralising them is a boundary call
   * that belongs to a piece of its own rather than to the sitemap.
   */
  /*
   * ── THE SLUG GUARD IS NOT CEREMONY ────────────────────────────────────────
   *
   * Every query filters `defined(slug.current)`, and TypeGen still types `slug` as
   * `string | null` because it cannot read a filter. Mapping without this produces
   * `/insights/null/` — a URL that 404s, submitted to Google as canonical, in a file
   * nobody reads by eye. `search-index.ts` guards the same way for the same reason, and
   * calls it "a guard, not a fix": 0 of 78 rows lack a slug today.
   */
  const slugged = <T extends {slug: string | null}>(rows: T[]) =>
    rows.filter((row): row is T & {slug: string} => Boolean(row.slug))

  const entries: Entry[] = [
    {loc: '/', lastmod: newest([...insights, ...presentations, ...pages, ...reviews])},
    {loc: '/insights/', lastmod: newest(insights)},
    {loc: '/presentations/', lastmod: newest(presentations)},
    {loc: '/reviews/', lastmod: newest(reviews)},
    ...slugged(pages).map((row) => ({loc: `/${row.slug}/`, lastmod: row._updatedAt})),
    ...slugged(insights).map((row) => ({
      loc: `/insights/${row.slug}/`,
      lastmod: row._updatedAt,
    })),
    ...slugged(presentations).map((row) => ({
      loc: `/presentations/${row.slug}/`,
      lastmod: row._updatedAt,
    })),
  ]

  return new Response(urlset(entries, site), {
    headers: {'content-type': 'application/xml; charset=utf-8'},
  })
}
