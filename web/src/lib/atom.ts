/**
 * The Atom 1.0 envelope. One module, because five feeds are coming and the part
 * least worth writing twice is the escaping.
 *
 * ── ATOM, NOT RSS 2.0 ──────────────────────────────────────────────────────────
 *
 * Settled in the feeds kickoff. `/feed.xml` is already Atom, `urls-and-filtering.md`
 * records that it must not move, and switching format under existing subscribers
 * buys nothing. On the merits Atom is also the better-specified of the two here:
 * `<id>` and `<updated>` are required and mean something exact, where RSS 2.0's
 * `<guid isPermaLink>` is famously ambiguous.
 *
 * ── ESCAPED, NOT CDATA, AND THAT IS A CHANGE FROM THE LIVE FEED ────────────────
 *
 * `web/_src/feed.njk` wraps every title, summary and body in `<![CDATA[…]]>`. That
 * works right up until content contains the three characters `]]>`, at which point
 * the section terminates early and the feed is malformed — and nothing in the
 * authoring path prevents an editor from writing that, least of all in a code block.
 *
 * Escaping has no such edge. `type="html"` is what tells the reader the escaped text
 * is markup to be unescaped and rendered, so the round trip is exactly as intended.
 * It costs a few percent in bytes over CDATA and removes a whole failure mode.
 */

/**
 * XML escaping, which is NOT the same set as HTML escaping.
 *
 * `&` first, or it would double-escape the ampersands the later replacements
 * introduce. Apostrophe and quote are escaped too: attribute values here are
 * built by interpolation, and an unescaped `"` in a title would close the
 * attribute early.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * A `date` field to an RFC 3339 instant.
 *
 * ── WHY THIS IS A STRING CONCATENATION AND NOT `new Date()` ────────────────────
 *
 * `pubDate` is a Sanity `date`, so it arrives as `"2020-01-29"` with no time and no
 * zone. Atom requires a full RFC 3339 timestamp, so something has to be invented,
 * and the only question is what.
 *
 * Parsing it into a Date and formatting back out would apply the BUILD MACHINE'S
 * timezone: `new Date('2020-01-29')` is midnight UTC, but any local-time formatting
 * of it lands on the 28th anywhere west of Greenwich. A feed whose dates move by a
 * day depending on which runner built it is a genuinely nasty bug to chase, and CI
 * and a laptop in Seattle would disagree.
 *
 * So: treat the date as UTC midnight and say so. Deterministic, and the same on
 * every machine.
 *
 * The live 11ty feed hardcodes `T00:00:00-08:00` instead, which claims PST all year
 * and is therefore wrong for roughly half of each one. Not carried over.
 */
export function toRfc3339(date: string): string {
  return `${date}T00:00:00Z`
}

export interface AtomEntry {
  /** Permanent, unique IRI. The canonical permalink. */
  id: string
  title: string
  /** Canonical URL, emitted as `rel="alternate"`. Usually the same as `id`. */
  url: string
  /** RFC 3339. */
  published: string
  /** RFC 3339. */
  updated: string
  /** Plain text. Omitted when absent. */
  summary?: string | null
  /** An HTML fragment, escaped on the way out. */
  content: string
  /** Genre and topics. Rendered as `<category term>`. */
  categories?: string[]
}

export interface AtomFeed {
  /** Permanent, unique IRI for the feed itself — its own absolute URL. */
  id: string
  title: string
  subtitle?: string
  /** This feed's own URL, for `rel="self"`. */
  selfUrl: string
  /** The human page this feed accompanies, for `rel="alternate"`. */
  alternateUrl: string
  authorName: string
  entries: AtomEntry[]
}

function entryXml(entry: AtomEntry): string {
  const lines = [
    '  <entry>',
    `    <title type="text">${escapeXml(entry.title)}</title>`,
    `    <link rel="alternate" type="text/html" href="${escapeXml(entry.url)}"/>`,
    `    <id>${escapeXml(entry.id)}</id>`,
    `    <published>${entry.published}</published>`,
    `    <updated>${entry.updated}</updated>`,
  ]

  if (entry.summary) {
    lines.push(`    <summary type="text">${escapeXml(entry.summary)}</summary>`)
  }

  /* `term` is the only required attribute, and without a `scheme` it is a plain
     uncontrolled label — which is the honest reading here. These are SKOS concept
     prefLabels, but the site publishes no per-concept URL for a `scheme` to point
     at, and inventing one would assert an address that does not resolve. Same
     reasoning that kept topics as plain `keywords` in the JSON-LD. */
  for (const term of entry.categories ?? []) {
    lines.push(`    <category term="${escapeXml(term)}"/>`)
  }

  lines.push(`    <content type="html">${escapeXml(entry.content)}</content>`, '  </entry>')
  return lines.join('\n')
}

export function atomFeed(feed: AtomFeed): string {
  /**
   * The feed's own `<updated>` is the newest entry's, NOT build time.
   *
   * The live 11ty feed gets this wrong, and instructively: `feed.njk:22` reads
   * `collections.articles`, a collection no template ever defines, so the filter
   * falls through to `new Date()` and every build stamps the moment it ran. The
   * result is a feed that claims to have changed on every deploy whether or not any
   * content did — which is exactly the signal a polling reader uses to decide
   * whether to bother.
   *
   * Entries are pre-sorted by the caller, so the newest is first. The fallback
   * matters for the Notes feed's neighbours later: an empty feed is valid Atom and
   * still needs an `<updated>`.
   */
  const updated = feed.entries[0]?.updated ?? toRfc3339(new Date().toISOString().slice(0, 10))

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">',
    `  <title type="text">${escapeXml(feed.title)}</title>`,
    ...(feed.subtitle ? [`  <subtitle type="text">${escapeXml(feed.subtitle)}</subtitle>`] : []),
    /* Correctly typed and correctly aimed, both of which the live feed gets wrong:
       it advertises `application/rss+xml` on an Atom document and points rel=self at
       the site root rather than at the feed. rel=self is how a reader re-finds a feed
       it was handed by some other route, so aiming it at the wrong resource defeats
       the one thing it is for. */
    `  <link rel="self" type="application/atom+xml" href="${escapeXml(feed.selfUrl)}"/>`,
    `  <link rel="alternate" type="text/html" href="${escapeXml(feed.alternateUrl)}"/>`,
    `  <id>${escapeXml(feed.id)}</id>`,
    `  <updated>${updated}</updated>`,
    '  <author>',
    `    <name>${escapeXml(feed.authorName)}</name>`,
    '  </author>',
    ...feed.entries.map(entryXml),
    '</feed>',
    '',
  ].join('\n')
}
