/**
 * ── PRESENTATION'S RESOLVER: WHICH DOCUMENT A URL IS ABOUT, AND WHERE A DOCUMENT SHOWS ─────
 *
 * The Presentation Resolver API, wired 2026-09-29. Two halves, doing opposite lookups:
 *
 *   mainDocuments   URL → document. Navigate the preview and Presentation opens the document
 *                   that page is ABOUT, without hunting for it in Structure.
 *   locations       document → URLs. A document's form shows "Used on N pages", each a link
 *                   that opens that page in Presentation.
 *
 * Shaped after ux-methods' studio/resolve.ts, which is this pattern already working: one live
 * query, mapped per type. Unlike that one, this also defines `mainDocuments`.
 *
 * ── THE MAP IS web/'s ROUTING, RESTATED, AND HAS TO STAY IN STEP WITH IT ──────────────────
 *
 * Every route and href below mirrors a page in web/src/pages and the slug each one passes to its
 * query. Nothing enforces the correspondence: add a route or a singleton there and it needs a
 * line here, or Presentation simply opens no document for it — a silent gap, not an error.
 *
 * Measured against production-26 before this was written, rather than assumed: each
 * `mainDocuments` filter matches exactly one document for a real URL, and no slug is shared
 * across article, caseStudy and note — so `/insights/:slug` is unambiguous without knowing the
 * type.
 *
 * ── WHAT IS DELIBERATELY LEFT OUT (Andy, 2026-09-29) ──────────────────────────────────────
 *
 *   - Topic and Genre concepts. They are edited as vocabulary in the taxonomy manager, not beside
 *     a page, so a list of every tagged document would be long and beside the point.
 *   - Home as a location. Knowing what Home features means reproducing its selection logic —
 *     bands, the genre partition, counts — here, a second copy of a rule that lives in web/ and
 *     would drift. Add it if its absence is missed.
 *
 * Routes need no trailing slash although every URL on the site has one: Presentation matches
 * against `url.pathname` with path-to-regexp 8, whose `trailing` option defaults to true
 * (read from sanity 6.9.2's own matcher, not assumed). The query string never takes part.
 */

import {
  defineDocuments,
  type DocumentLocation,
  type DocumentLocationResolver,
  type DocumentLocationsState,
  type PresentationPluginOptions,
} from 'sanity/presentation'
import {map, type Observable} from 'rxjs'

const INSIGHT_TYPES = ['article', 'caseStudy', 'note']

/* First match wins, so the catch-all for `page` comes last — before it, `/insights/` would be
   read as a page with the slug "insights". */
const mainDocuments = defineDocuments([
  {route: '/', filter: `_type == "singleton" && slug.current == "home"`},
  {route: '/insights', filter: `_type == "singleton" && slug.current == "insights"`},
  /* The type list is written into the filter rather than passed as a static `params` value:
     the docs show static params and route params separately, never merged, and this route
     needs the route's :slug. */
  {
    route: '/insights/:slug',
    filter: `_type in ["article", "caseStudy", "note"] && slug.current == $slug`,
  },
  {route: '/presentations', filter: `_type == "singleton" && slug.current == "presentations"`},
  {route: '/presentations/:slug', filter: `_type == "presentation" && slug.current == $slug`},
  {route: '/reviews', filter: `_type == "singleton" && slug.current == "reviews"`},
  {route: '/:slug', filter: `_type == "page" && slug.current == $slug`},
])

/**
 * One row per document the query returns: the document itself plus everything that references
 * it. `name` is there because `client` titles itself with `name`, not `title` — every other
 * type here uses `title`, read from the extracted schema.
 */
type Row = {
  _id: string
  _type: string
  title?: string | null
  name?: string | null
  slug?: string | null
  hasClient?: boolean
}

const label = (row: Row, fallback: string) => row.title || row.name || fallback

const INSIGHTS_INDEX: DocumentLocation = {title: 'Insights', href: '/insights/'}
const PRESENTATIONS_INDEX: DocumentLocation = {title: 'Presentations', href: '/presentations/'}
const REVIEWS_INDEX: DocumentLocation = {title: 'Reviews', href: '/reviews/'}

const singletonHref = (slug: string) => (slug === 'home' ? '/' : `/${slug}/`)

const linksTo = (rows: Row[], type: string, href: (slug: string) => string): DocumentLocation[] =>
  rows
    .filter((row) => row._type === type && row.slug)
    .map((row) => ({title: label(row, 'Untitled'), href: href(row.slug!)}))

/** Where each type is shown by its own route or by a known relationship. */
function ownLocations(type: string, self: Row | undefined, rows: Row[]): DocumentLocation[] {
  switch (type) {
    case 'article':
    case 'caseStudy':
    case 'note':
      return self?.slug
        ? [{title: label(self, 'Untitled'), href: `/insights/${self.slug}/`}, INSIGHTS_INDEX]
        : []
    case 'presentation':
      return self?.slug
        ? [
            {title: label(self, 'Untitled'), href: `/presentations/${self.slug}/`},
            PRESENTATIONS_INDEX,
          ]
        : []
    case 'page':
      return self?.slug ? [{title: label(self, 'Untitled'), href: `/${self.slug}/`}] : []
    case 'singleton':
      return self?.slug ? [{title: label(self, 'Untitled'), href: singletonHref(self.slug)}] : []
    case 'event':
      return linksTo(rows, 'presentation', (slug) => `/presentations/${slug}/`)
    /* A review reaches /reviews/ through the client it names, and a client through its reviews:
       the Reviews page lists clients that have reviews, and each client's reviews under it. */
    case 'review':
      return [
        ...linksTo(rows, 'caseStudy', (slug) => `/insights/${slug}/`),
        ...(self?.hasClient ? [REVIEWS_INDEX] : []),
      ]
    case 'client':
      return [
        ...linksTo(rows, 'caseStudy', (slug) => `/insights/${slug}/`),
        ...(rows.some((row) => row._type === 'review') ? [REVIEWS_INDEX] : []),
      ]
    default:
      return []
  }
}

const HANDLED = [...INSIGHT_TYPES, 'presentation', 'page', 'singleton', 'event', 'review', 'client']

const locations: DocumentLocationResolver = (params, context) => {
  /* Settings reaches every page through the layout; there is no list worth showing. */
  if (params.type === 'settings') {
    return {message: 'Used on every page', tone: 'caution'} satisfies DocumentLocationsState
  }
  if (!HANDLED.includes(params.type)) return null

  /* References always point at the PUBLISHED id, so normalise in case a draft id arrives. */
  const id = params.id.replace(/^drafts\./, '')

  /* The document and everything referencing it, live. `hasClient` is only read for reviews. */
  const rows$ = context.documentStore.listenQuery(
    `*[_id == $id || references($id)]{
      _id, _type, title, name, "slug": slug.current,
      "hasClient": references(*[_type == "client"]._id)
    }`,
    {id},
    {perspective: 'drafts'},
  ) as Observable<Row[] | null>

  return rows$.pipe(
    map((rows): DocumentLocationsState | null => {
      if (!rows) {
        return {message: 'Unable to resolve locations for this document', tone: 'critical'}
      }
      const self = rows.find((row) => row._id === id)

      /* ── ANY PAGE OR SINGLETON THAT REFERENCES IT, FOR EVERY TYPE ────────────────────
         Found by querying rather than by reading the page templates: a client turned out to
         be referenced by the Projects page and the Insights singleton, each through its own
         Work-with-me band — locations the per-type rules above would have missed. A direct
         reference carries no selection logic, so listing it duplicates nothing in web/. That
         includes Home when Home references something directly; what Home SELECTS by query
         stays out, per the header. */
      const referencing = rows
        .filter((row) => row._id !== id && (row._type === 'page' || row._type === 'singleton'))
        .filter((row) => row.slug)
        .map((row) => ({
          title: label(row, 'Untitled'),
          href: row._type === 'singleton' ? singletonHref(row.slug!) : `/${row.slug}/`,
        }))

      /* De-duplicated by href: a review's Reviews link could otherwise arrive twice, once from
         the rule above and once because the Reviews singleton references it. */
      const seen = new Set<string>()
      const all = [...ownLocations(params.type, self, rows), ...referencing].filter(
        (location) => !seen.has(location.href) && seen.add(location.href),
      )

      /* An event renders no page of its own — only inside the presentations that list it — so
         one listed nowhere is invisible on the site. 8 were unattached when this was written,
         and this banner is where an editor notices. */
      if (params.type === 'event' && all.length === 0) {
        return {
          message: 'Not on any page yet: an event appears only on the presentations that list it',
          tone: 'caution',
          locations: [],
        }
      }

      /* ── A REFERENCE FROM SETTINGS IS NOTED, NOT ENUMERATED ─────────────────────────────
         Settings holds site-wide defaults — the Work-with-me band pages fall back to when they
         carry none of their own (9 pages and singletons did, 2026-09-29). Listing the pages
         that inherit it would mean restating web/'s band ladder here, the duplication the
         header rules out for Home. So the banner says so instead. */
      const inSettings = rows.some((row) => row._type === 'settings')
      if (all.length === 0 && !inSettings) return null
      return {
        locations: all,
        ...(inSettings
          ? {
              message: `Used on ${all.length} page${all.length === 1 ? '' : 's'}, and in the site-wide defaults in Settings`,
            }
          : {}),
      }
    }),
  )
}

export const resolve: PresentationPluginOptions['resolve'] = {mainDocuments, locations}
