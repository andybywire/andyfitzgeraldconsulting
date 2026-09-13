/**
 * The five feeds, named once.
 *
 * ── ONE TABLE BECAUSE TWO THINGS READ IT ──────────────────────────────────────
 *
 * A feed route needs its `<title>` and its own URL; `BaseLayout` needs the same URL and
 * a name for the `<link rel="alternate">` picker. Written twice they would drift, and
 * the failure would be quiet: a reader's picker offering "Insights" for a feed that
 * calls itself something else is nobody's build error.
 *
 * Its own module rather than living in `feed-entries.ts`, so `BaseLayout` — which needs
 * nothing but these strings — does not pull the serializer and the Sanity client into
 * its import graph to get them.
 *
 * `path` is root-relative on purpose. Both `<link rel="alternate">` and `rel="self"`
 * resolve it against the current origin, which is what makes the preview deploy
 * advertise its own feeds rather than production's.
 */
export interface FeedMeta {
  /** Root-relative path of the feed itself. */
  path: string
  /** The human page it accompanies, for `rel="alternate"` inside the feed. */
  alternatePath: string
  /** The feed's own `<title>`. */
  title: string
  /**
   * Short name for the `<link rel="alternate" title>` attribute.
   *
   * Deliberately NOT `title`. Every feed's real title starts "Andy Fitzgerald
   * Consulting — ", which is exactly the part a reader's picker does not need: the
   * reader already knows which site it is asking about, and four entries sharing a
   * prefix are harder to tell apart, not easier.
   */
  label: string
  subtitle: string
}

export const FEEDS = {
  all: {
    path: '/feed.xml',
    alternatePath: '/',
    title: 'Andy Fitzgerald Consulting',
    label: 'All Content',
    subtitle:
      'Perspectives, methods, notes and presentations about information architecture and structured content design for the modern web.',
  },
  insights: {
    path: '/insights/feed.xml',
    alternatePath: '/insights/',
    title: 'Andy Fitzgerald Consulting — Insights',
    label: 'Insights',
    subtitle:
      'Perspectives, methods and notes about information architecture and structured content design for the modern web.',
  },
  articles: {
    path: '/insights/feed-articles.xml',
    alternatePath: '/insights/',
    title: 'Andy Fitzgerald Consulting — Articles',
    label: 'Articles',
    subtitle:
      'Long-form perspectives, methods and conference notes about information architecture and structured content design for the modern web.',
  },
  notes: {
    path: '/insights/feed-notes.xml',
    alternatePath: '/insights/',
    title: 'Andy Fitzgerald Consulting — Notes',
    label: 'Notes',
    subtitle: 'Short notes, clippings and book notes related to information architecture and structured content design for the modern web.',
  },
  presentations: {
    path: '/presentations/feed.xml',
    alternatePath: '/presentations/',
    title: 'Andy Fitzgerald Consulting — Presentations',
    label: 'Presentations',
    subtitle: 'Keynotes, talks, workshops, panels and interviews about information architecture and structured content design for the modern web..',
  },
} as const satisfies Record<string, FeedMeta>
