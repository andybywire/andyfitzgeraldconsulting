/**
 * The site-level JSON-LD graph — Organization, Person, WebSite — plus the serializer
 * every page's graph goes through.
 *
 * Piece 1 of four. The Document branch, the Presentation branch, and the remaining
 * page types each land later; this file settles the two things they all depend on: how
 * entities are identified, and how the graph reaches the page.
 *
 * ── ONE GRAPH PER PAGE, ENTITIES LINKED BY `@id` ────────────────────────────
 *
 * Carried over from `web/_includes/linked-data/`, which had this right. Every page emits
 * a single `<script type="application/ld+json">` holding one `@graph`, and the nodes
 * inside it refer to each other by `@id` rather than repeating themselves — so the
 * article on a detail page points at the same Person the home page does, and a consumer
 * merging the site's pages gets one author rather than forty-two copies.
 *
 * That is also why <BaseLayout> takes the page's nodes as a prop instead of each page
 * emitting its own script. Two scripts would be two disconnected graphs, and the
 * cross-references between them would dangle.
 *
 * ── TWO DEFECTS IN THE OLD BUILD, FIXED HERE RATHER THAN COPIED ─────────────
 *
 * Both are live on production today and would have come across unnoticed:
 *
 *   1. `website.json` writes `"publisher": { "id": … }` — no `@`. That is not a
 *      reference; it is a literal property called `id`, so the WebSite has never had a
 *      resolvable publisher. The kind of thing that validates as "no errors" because
 *      an unknown property is simply ignored.
 *
 *   2. `addressCountry: "United States"`. schema.org wants ISO 3166-1 alpha-2 here.
 *      Already flagged for `PostalAddress` in the phase 4 notes; fixed at the source.
 *
 * ── VALUES LIVE HERE, NOT IN SANITY (Andy, 2026-09-11) ──────────────────────
 *
 * `sameAs` and the postal address carry no editorial judgment, change about once a year
 * and are nobody's but Andy's to edit — the same argument that keeps the nav in code.
 * Putting them in `settings` would be schema work for values that do not move.
 *
 * The Organization carried a `telephone` until 2026-09-11, when Andy removed it. Worth
 * a line because its absence is a decision rather than an oversight: schema.org treats
 * it as optional, so nothing is now under-specified, and a phone number is the one fact
 * here that publishing makes harvestable.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  FOUR OF THESE DO ALSO EXIST IN `settings`, AND THAT IS A REAL OVERLAP.   │
 * │  `siteTitle`, `description`, `url` and `authorName` are editable there    │
 * │  and constants here, so the two can disagree. Nothing reads `settings`    │
 * │  for them today — no layout fetches it — so there is no live conflict,    │
 * │  and the fix if one appears is a single settings query in <BaseLayout>    │
 * │  feeding this module, which is why the constants are exported separately  │
 * │  from the builders below.                                                 │
 * │                                                                           │
 * │  The question put to Andy covered `sameAs`, phone and address, which      │
 * │  `settings` genuinely lacks. This overlap was found while building and    │
 * │  is flagged rather than quietly decided.                                  │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
import {PUBLIC_SANITY_DATASET, PUBLIC_SANITY_PROJECT_ID} from 'astro:env/client'

/**
 * A node in the graph. Deliberately loose: schema.org has thousands of properties and a
 * faithful TypeScript model of it is a dependency and a maintenance burden, not a
 * safety net. What is worth enforcing is that every node declares a type, and that the
 * whole thing is JSON-serializable.
 */
export type GraphNode = Record<string, unknown> & {
  '@type': string | string[]
  '@id'?: string
}

/**
 * Fragment identifiers, resolved against the SITE being built.
 *
 * `Astro.site` differs between modes — production is the real host, preview is
 * `preview.andyfitzgeraldconsulting.com` — so a preview build's entities identify
 * themselves as preview entities rather than claiming production's. That is the honest
 * arrangement: preview is `noindex` and nothing consumes it, but a graph that asserted
 * production `@id`s from a different host would be lying in a way no validator catches.
 */
export const nodeId = (site: URL, fragment: string) => new URL(`#${fragment}`, site).href

/* The headshot, as the asset `settings.authorImage` holds — same hash in both datasets.
   Built from the configured project and dataset rather than pasted as a URL: the old
   build's `person.json` hardcoded one pointing at the `production` dataset with a crop
   baked into the query string, which would survive the cutover only by luck. */
const AUTHOR_IMAGE_REF = 'image-09e1fa5707b3fa56ad1522de8a923ff1d0182732-1262x823-jpg'

/**
 * A CDN URL for an asset ref, capped rather than served at source size.
 *
 * The cap is not cosmetic. These URLs are FETCHED — by Google for rich results, by a
 * social card renderer, by anything that reads the graph — and the originals are large:
 * `who-kap`'s hero is a 3494 x 1964 PNG. Google asks for at least 1200px wide, so 1200
 * satisfies the guidance and stops several megabytes being the thing a consumer pulls.
 *
 * `auto=format` lets the CDN negotiate — WebP in practice here, measured during the deck
 * work. No crop or hotspot: this is an identifying image for a machine, not a rendered
 * one, and applying a crop would need the image object rather than just its ref.
 */
function assetUrl(ref: string, width = 1200): string | null {
  const parts = ref.split('-')
  if (parts.length < 4 || parts[0] !== 'image') return null
  const [, id, dimensions, extension] = parts
  return (
    `https://cdn.sanity.io/images/${PUBLIC_SANITY_PROJECT_ID}/${PUBLIC_SANITY_DATASET}/` +
    `${id}-${dimensions}.${extension}?w=${width}&auto=format`
  )
}

/** The constants, exported so a future settings-fed version can override them in one place. */
export const SITE_FACTS = {
  organizationName: 'Andy Fitzgerald Consulting, LLC',
  siteName: 'Andy Fitzgerald Consulting',
  description: 'The professional consulting web site of information architect Andy Fitzgerald.',
  addressLocality: 'Seattle',
  addressRegion: 'WA',
  /* ISO 3166-1 alpha-2. The old build wrote "United States" here. */
  addressCountry: 'US',
  organizationSameAs: 'https://www.linkedin.com/company/andy-fitzgerald-consulting-llc',
  personName: 'Andy Fitzgerald',
  givenName: 'Andy',
  familyName: 'Fitzgerald',
  alternateName: 'andybywire',
  jobTitle: 'Information Architect',
  email: 'mailto:andy@andyfitzgeraldconsulting.com',
  personDescription:
    'Andy Fitzgerald is an independent user experience professional with applied expertise in ' +
    'design research, information architecture, interaction design, and usability testing.',
  disambiguatingDescription: 'User experience architecture and design consultant.',
  personSameAs: [
    'https://www.oreilly.com/pub/au/6128',
    'https://alistapart.com/author/andyfitzgerald/',
    'http://www.iasummit.org/person/andy-fitzgerald/',
    'https://www.worldiaday.org/people/andy-fitzgerald',
    'https://www.uxbooth.com/author/andyfitzgerald/',
    'https://aycl.uie.com/experts/andy_fitzgerald',
    'https://www.theiaconference.com/person/andy-fitzgerald/',
    'https://www.crunchbase.com/person/andy-fitzgerald',
  ],
} as const

/**
 * The three nodes every page carries.
 *
 * `additionalType` on the Organization points at a productontology term for "consulting
 * firm", which is the old build's way of saying something schema.org has no type for.
 * Kept: it is valid, it is cheap, and it is the only statement here about what the
 * business actually does.
 */
export function siteGraph(site: URL): GraphNode[] {
  const organization = nodeId(site, 'organization')
  const person = nodeId(site, 'person')
  const logo = nodeId(site, 'logo')
  const image = assetUrl(AUTHOR_IMAGE_REF)

  return [
    {
      '@id': organization,
      '@type': 'Organization',
      additionalType: 'http://www.productontology.org/doc/Consulting_firm',
      name: SITE_FACTS.organizationName,
      description: SITE_FACTS.description,
      url: new URL('/', site).href,
      address: {
        '@type': 'PostalAddress',
        '@id': nodeId(site, 'locality'),
        addressLocality: SITE_FACTS.addressLocality,
        addressRegion: SITE_FACTS.addressRegion,
        addressCountry: SITE_FACTS.addressCountry,
      },
      sameAs: SITE_FACTS.organizationSameAs,
      logo: {
        '@type': 'ImageObject',
        '@id': logo,
        url: new URL('/icons/icon_x512.png', site).href,
        caption: SITE_FACTS.siteName,
      },
      image: {'@id': logo},
    },
    {
      '@id': person,
      '@type': 'Person',
      name: SITE_FACTS.personName,
      givenName: SITE_FACTS.givenName,
      familyName: SITE_FACTS.familyName,
      alternateName: SITE_FACTS.alternateName,
      jobTitle: SITE_FACTS.jobTitle,
      email: SITE_FACTS.email,
      description: SITE_FACTS.personDescription,
      disambiguatingDescription: SITE_FACTS.disambiguatingDescription,
      url: new URL('/', site).href,
      ...(image ? {image} : {}),
      sameAs: SITE_FACTS.personSameAs,
    },
    {
      '@id': nodeId(site, 'website'),
      '@type': 'WebSite',
      additionalType: 'CreativeWork',
      url: new URL('/', site).href,
      name: SITE_FACTS.siteName,
      inLanguage: 'en-US',
      description: SITE_FACTS.description,
      author: {'@id': person},
      /* `@id`, not `id`. See the header — the old build's missing `@` meant this
         reference never resolved. */
      publisher: {'@id': organization},
      /* NO `potentialAction`/SearchAction yet. It names the URL a site search accepts a
         query at, and search is not built (the masthead toggle is still inert from
         phase 3). Purely additive when it lands; the old build has none either. */
    },
  ]
}

/* ── PIECE 2: THE DOCUMENT BRANCH ─────────────────────────────────────────── */

/** A note's `clipRef` — the piece it comments on. */
export interface ClipSource {
  url?: string | null
  title?: string | null
  publisher?: string | null
}

/** A note's `bookRef` — the book it is about. */
export interface BookSource {
  url?: string | null
  title?: string | null
  author?: string | null
  publisher?: string | null
  pubDate?: string | null
}

export interface DocumentNodeInput {
  site: URL
  /** The canonical URL, already built by the page. */
  permalink: string
  title?: string | null
  /** Becomes `abstract`. See the note below on why it is not `description`. */
  shortDescription?: string | null
  pubDate?: string | null
  updatedAt?: string | null
  genre?: string | null
  topics?: string[]
  /** The hero's asset `_ref`, or null. Notes have no hero. */
  heroRef?: string | null
  /** Case study only — the client the work was for. */
  clientName?: string | null
  /** Web Clipping only. */
  clip?: ClipSource | null
  /** Book Note only. */
  book?: BookSource | null
}

/**
 * One node for an `article`, `caseStudy` or `note`.
 *
 * ── ALL THREE ARE `Article`, AND THE DISTINCTIONS RIDE ELSEWHERE ────────────
 *
 * schema.org has no CaseStudy and nothing that fits a book note, and inventing a split
 * with `BlogPosting` would put a guess where the site already has an answer: the Genre
 * vocabulary is what distinguishes a Method from a Web Clipping, and it travels on the
 * node as `genre`. So the type stays `Article` throughout and the SKOS concept does the
 * work it was built for.
 *
 * What DOES differ per variant is what the document points AT — a clipping is about
 * someone else's piece, a book note is about a book, a case study is about work done
 * for a client. Those are three different properties, below.
 *
 * ── `abstract`, NOT `description`, AND THAT IS THE OLD BUILD'S CHOICE ───────
 *
 * `article.json` uses `abstract: shortDescription`, which is right: `shortDescription`
 * is card copy — a summary of the piece — where the `description` field is the meta
 * tag's text, aimed at a search snippet. They read similarly and are not the same job.
 *
 * It also sidesteps the gap Andy expected to surface here. `note` has no `description`
 * field at all, but all five notes carry `shortDescription`, so nothing is missing — and
 * the page already falls back to `shortDescription` for the meta tag too.
 *
 * ── TOPICS AND GENRE AS PLAIN STRINGS (Andy, 2026-09-11) ────────────────────
 *
 * `keywords` and `genre` rather than `about` with DefinedTerm nodes. DefinedTerm is the
 * faithful SKOS mapping and would be better linked data, but every concept would need an
 * `@id`, and concepts are NOT addressable on this site — filtering is a query parameter
 * on the index, and `docs/urls-and-filtering.md` rules out per-topic pages. Minting
 * `/#topic-taxonomy` would assert an identifier for something the site does not publish.
 *
 * Revisit if topics ever become addressable. Until then the structure has nowhere to
 * point, and `keywords` is what search engines read anyway.
 *
 * ── NO `Review` NODES (Andy, 2026-09-11) ────────────────────────────────────
 *
 * Five of seven case studies carry a client testimonial and none of them appears here. A
 * `Review` whose `itemReviewed` is your own Organization is self-serving review markup:
 * Google ignores it for rich results and lists it among practices that can draw a manual
 * action. It buys nothing and carries a real risk. The testimonials stay on the page,
 * which is where they do their work.
 *
 * The CLIENT still appears, via `about` — that is a fact about the engagement rather
 * than an opinion about it, and it is the case study's actual subject. Emitted as an
 * inline Organization with no `@id`, because these are other people's organizations and
 * this site is not the right place to mint identifiers for them.
 */
export function documentNode(input: DocumentNodeInput): GraphNode {
  const {site, permalink} = input
  const image = input.heroRef ? assetUrl(input.heroRef) : null

  const node: GraphNode = {
    '@id': `${permalink}#article`,
    '@type': 'Article',
    url: permalink,
    /* Defines a minimal WebPage inline rather than referencing one declared elsewhere —
       there is no WebPage node in the graph, and this is the idiomatic way to say "this
       article is the main thing on that page" without inventing one. */
    mainEntityOfPage: {'@type': 'WebPage', '@id': `${permalink}#webpage`},
    author: {'@id': nodeId(site, 'person')},
    publisher: {'@id': nodeId(site, 'organization')},
  }

  if (input.title) node.headline = input.title
  if (input.shortDescription) node.abstract = input.shortDescription
  if (input.pubDate) node.datePublished = input.pubDate
  /* `_updatedAt`, which the DATES fragment already projects. Honest about revision in a
     way `pubDate` alone is not, and the same field mf2's `dt-updated` will read. */
  if (input.updatedAt) node.dateModified = input.updatedAt
  if (input.genre) node.genre = input.genre
  if (input.topics?.length) node.keywords = input.topics

  if (image) {
    node.image = {
      '@type': 'ImageObject',
      '@id': `${permalink}#primaryimage`,
      inLanguage: 'en-US',
      url: image,
    }
  }

  /* A Web Clipping comments on someone else's piece: `isBasedOn` is the property for a
     work this one derives from, which is exactly the relationship. */
  if (input.clip?.url) {
    node.isBasedOn = {
      '@type': 'Article',
      url: input.clip.url,
      ...(input.clip.title ? {name: input.clip.title} : {}),
      ...(input.clip.publisher
        ? {publisher: {'@type': 'Organization', name: input.clip.publisher}}
        : {}),
    }
  }

  /* A Book Note is ABOUT a book — `about`, not `isBasedOn`: the note is not derived from
     the book, it discusses it. `bookRef` carries enough for a real Book node. */
  if (input.book?.title) {
    node.about = {
      '@type': 'Book',
      name: input.book.title,
      ...(input.book.url ? {url: input.book.url} : {}),
      ...(input.book.author ? {author: {'@type': 'Person', name: input.book.author}} : {}),
      ...(input.book.publisher
        ? {publisher: {'@type': 'Organization', name: input.book.publisher}}
        : {}),
      ...(input.book.pubDate ? {datePublished: input.book.pubDate} : {}),
    }
  } else if (input.clientName) {
    node.about = {'@type': 'Organization', name: input.clientName}
  }

  return node
}

/**
 * Serialize a graph for a `<script type="application/ld+json">`.
 *
 * ── TWO SUBSTITUTIONS, BOTH LOAD-BEARING ────────────────────────────────────
 *
 * `<` becomes `<`. Inside a script element the parser is looking for `</script`,
 * and it does not care that the sequence sits inside a JSON string — a title containing
 * one would end the script early and dump the rest of the graph into the document as
 * markup. Escaping the character is the standard fix and JSON-equivalent, so a consumer
 * reads exactly the same string. It closes `<!--` at the same time.
 *
 * Then the Unicode tag block, U+E0000–U+E007F, is stripped. That is where Sanity's stega
 * encoding hides its edit references: invisible characters woven into every string the
 * preview build fetches. They would be invisible in rendered text and NOT invisible to a
 * structured-data validator, which is exactly where someone would go looking for a
 * problem that is not there. Production disables stega, so this only ever fires in
 * preview — which is precisely the build a person inspects by hand.
 */
export function serializeGraph(nodes: GraphNode[]): string {
  return JSON.stringify({'@context': 'https://schema.org', '@graph': nodes})
    .replace(/</g, '\\u003c')
    .replace(/[\u{E0000}-\u{E007F}]/gu, '')
}
