import {stegaClean} from '@sanity/client/stega'
import type {TypedObject} from 'astro-portabletext/types'
import type {
  FEED_ARTICLES_QUERY_RESULT,
  FEED_NOTES_QUERY_RESULT,
  FEED_PRESENTATIONS_QUERY_RESULT,
} from '../../sanity.types'
import {atomFeed, escapeXml, toRfc3339, type AtomEntry} from './atom'
import {feedImageAttrs} from '../sanity/image'
import {recordingHeading, recordingVerb, sourceLabelFor, youtubeId} from './recording'
import {toFeedHtml} from './feed-html'
import type {FeedMeta} from './feeds'

/**
 * Query results in, Atom entries out — and the response that wraps them.
 *
 * ── THIS IS THE PROMOTION, AND IT WAITED FOR THE SECOND CONSUMER ──────────────
 *
 * These builders lived inline in `pages/insights/feed.xml.ts` while that was the only
 * feed, with a note saying they would move when something else needed them. Five feeds
 * now need them, and `articleEntries` alone has three call sites. A second consumer is
 * this project's stated trigger for promotion, and waiting for it meant the interface
 * was shaped by real call sites rather than guessed at from one.
 *
 * The shape follows `lib/search-index.ts`: a function per query result, each taking the
 * whole array and returning a flat array, with the null-guards expressed as `flatMap`
 * rather than as a separate filter.
 *
 * ── WHY `feedResponse` IS HERE TOO ────────────────────────────────────────────
 *
 * Because five routes that each sort, cap, render and clean are five places to get the
 * cap wrong. What stays in a route is only what differs between feeds: which queries it
 * runs, what it is called, and where it lives.
 */

/**
 * The 20 most recent, uniformly across all five feeds (Andy, 2026-09-13, reaffirmed
 * after the number moved).
 *
 * Only three feeds actually truncate today — `/feed.xml` (44 in range),
 * `/insights/feed.xml` (35) and `/insights/feed-articles.xml` (30). Notes has 5 and
 * Presentations has 9, so the cap is inert there and will stay inert for a while.
 *
 * ── THE NUMBER MOVED ONCE ALREADY, WHICH IS WHY IT IS WORTH WATCHING ──────────
 *
 * `/insights/feed.xml` measured 248 KB raw / 75 KB gzipped with case studies in it, and
 * 326 KB / 96 KB once they came out — BIGGER, because the two case studies were the
 * shortest documents in the window and dropping them pulled two of the longest articles
 * up into it. A cap counts documents; it does not bound bytes. If a run of long articles
 * lands, this number is the lever.
 */
export const FEED_LIMIT = 20

/**
 * `<published>` and `<updated>` both from `pubDate` (Andy, 2026-09-13).
 *
 * Not `_updatedAt`, and the reason is circumstance rather than semantics. Atom's
 * `<updated>` means "last significant modification", which is literally what
 * `_updatedAt` records — so on the spec alone it is the better answer. It loses because
 * the migration to `production-26` is live and has touched every document: `_updatedAt`
 * would mark the whole corpus changed and re-surface it in every subscriber's reader,
 * repeatedly, for housekeeping. A feed that cries wolf gets muted.
 *
 * The cost is real: a genuinely revised piece will not re-notify anyone. Revisit in
 * phase 8, where `dt-updated` lands alongside it.
 */
function dates(pubDate: string) {
  const stamp = toRfc3339(pubDate)
  return {published: stamp, updated: stamp}
}

/** Genre first, then topics. Both are SKOS prefLabels; see the note in `atom.ts`. */
function categories(genre: string | null, topics: Array<string | null> | null): string[] {
  return [genre, ...(topics ?? [])].filter((term): term is string => Boolean(term))
}

/**
 * ── THE SLUG GUARD IS NOT CEREMONY ────────────────────────────────────────────
 *
 * Every feed query filters `defined(slug.current)`, and TypeGen still types `slug` as
 * `string | null` because it cannot read a filter. Unguarded, a null slug produces an
 * entry whose `<id>` and `<link>` are both `…/insights/null/` — a permanent, unique
 * identifier for a 404, which a subscriber's reader would then remember forever.
 * `sitemap.xml.ts` and `search-index.ts` guard the same way.
 *
 * `title` and `pubDate` are gated with it: an entry with no title is not something a
 * reader can display, and both Atom timestamps come from `pubDate`. 0 of 44 documents
 * in range lack any of the three today — a guard, not a fix.
 */
type Base = {slug: string | null; title: string | null; pubDate: string | null}

/**
 * GENERIC ON PURPOSE, and it is not stylistic. A predicate written as
 * `(row: Base) => row is Base & {...}` does not narrow through `Array.filter`: the
 * narrowed type is not a subtype of the row it came from — it has lost `bodyText`,
 * `lede` and the rest — so TypeScript declines the predicate overload and silently
 * returns the array unnarrowed. The symptom is six errors about `title` still being
 * `string | null` AFTER a filter that plainly checks it.
 *
 * `<T extends Base>` keeps the row's own type and intersects the guarantee onto it.
 * `sitemap.xml.ts` writes `slugged` the same way for the same reason.
 */
const usable = <T extends Base>(
  row: T,
): row is T & {slug: string; title: string; pubDate: string} =>
  Boolean(row.slug && row.title && row.pubDate)

export function articleEntries(rows: FEED_ARTICLES_QUERY_RESULT, site: URL): AtomEntry[] {
  return rows.filter(usable).map((row) => {
    const url = new URL(`/insights/${row.slug}/`, site).href
    return {
      id: url,
      url,
      title: row.title,
      summary: row.shortDescription,
      categories: categories(row.genre, row.topics),
      ...dates(row.pubDate),
      /* `lede` then `bodyText`, matching the page: the lede is the standfirst and reads
         as the article's opening, not as metadata. `shortDescription` is card copy and
         goes to <summary> instead — a different field for a different job. */
      content: toFeedHtml([...(row.lede ?? []), ...(row.bodyText ?? [])], {permalink: url}),
    }
  })
}

export function noteEntries(rows: FEED_NOTES_QUERY_RESULT, site: URL): AtomEntry[] {
  return rows.filter(usable).map((row) => {
    const url = new URL(`/insights/${row.slug}/`, site).href
    return {
      id: url,
      url,
      title: row.title,
      summary: row.shortDescription,
      categories: categories(row.genre, row.topics),
      ...dates(row.pubDate),
      /* No `lede` — that field exists only on `article`. A note is its body. */
      content: toFeedHtml(row.bodyText ?? [], {permalink: url}),
    }
  })
}

/**
 * ── THE ONE SYNTHESIZED HEADING IN THE WHOLE BUILD, AND IT IS DELIBERATE ──────
 *
 * "Presentation Highlights" is a string in `presentations/[slug].astro`, not a block in
 * `highlights` — which is a bare bulleted list. Lift the list out unlabelled and an
 * entry reads as a paragraph followed by an unexplained set of noun phrases.
 *
 * This is the same move that went wrong for case studies, at a fraction of the dose,
 * and the difference is the dose. A case study needed FIVE pieces of scaffolding
 * rebuilt — a heading over `whatDid` plus three section labels above three
 * content-supplied titles — and the result read as a flattened form. One heading over
 * one list is the shape `whatDid` had, which was never the part that read badly.
 *
 * `h2` because that is what the template draws it as. Everything else on that page —
 * Venue(s), View Slides, the recordings, the transcript — is left on the page; see the
 * note on `FEED_PRESENTATIONS_QUERY` for why each.
 */
const HIGHLIGHTS_HEADING: TypedObject = {
  _type: 'block',
  _key: 'feed-highlights-heading',
  style: 'h2',
  markDefs: [],
  children: [{_type: 'span', _key: 'label', text: 'Presentation Highlights', marks: []}],
} as TypedObject

/**
 * The recording block — a linked poster and a source line, appended after the prose.
 *
 * ── A REAL `<iframe>`, BECAUSE SUBSTACK PROVED THE ASSUMPTION WRONG ──────────
 *
 * This shipped first as a linked poster, on my claim that feed readers strip `<iframe>`
 * so an embed would render as nothing. Andy produced counter-evidence — Substack posts
 * that play video in his reader — and he was right.
 *
 * VERIFIED against `juansequeda.substack.com/feed` on 2026-09-13, by fetching it and
 * reading the markup rather than reasoning about it. Substack ships exactly this, with
 * NO thumbnail fallback of any kind:
 *
 *     <div class="youtube-wrap"><div class="youtube-inner">
 *       <iframe src="https://www.youtube-nocookie.com/embed/{id}?rel=0&autoplay=0…"
 *               frameborder="0" loading="lazy" allow="autoplay; fullscreen"
 *               allowfullscreen width="728" height="409"></iframe>
 *     </div></div>
 *
 * Nothing privileged about it: no Media RSS, no `<enclosure>` for the video, no platform
 * deal. The feed's only `<enclosure>` is the post's social image. It is plain markup we
 * can emit, and readers that render iframes — or that allowlist YouTube specifically —
 * show a player. The earlier claim was overstated; sanitizer behavior varies by reader
 * and enough of them allow this that the largest newsletter platform on the web ships it
 * with no fallback at all.
 *
 * `youtube-nocookie.com` follows Substack, and it matters more here than it does there:
 * `recording.ts` records a deliberate decision NOT to fetch YouTube thumbnails on the
 * page, because that pings Google before anyone asks for the video. An iframe does the
 * same thing, and a FEED CANNOT DO CLICK-TO-LOAD — no script runs — so this is a real,
 * if small, departure from the page's privacy posture. The nocookie domain is the
 * available mitigation, not a cure. Worth knowing rather than discovering later.
 *
 * ── AND A LINK LINE UNDER IT, WHICH IS THE FALLBACK ──────────────────────────
 *
 * Substack ships the iframe bare; this does not. A reader that strips the iframe would
 * then show a heading and nothing else. The source line was already there, so making it
 * a link costs nothing and degrades predictably across all three sanitizer behaviors:
 * render the iframe and it is an ordinary caption under a player, strip it and it is the
 * whole section.
 *
 * Putting the poster INSIDE the iframe as fallback content was considered and rejected:
 * browsers ignore iframe children, and whether a sanitizer unwraps them or drops them
 * with the element is unspecified and varies. A guess dressed as a safety net.
 *
 * ── THREE THINGS IT GETS FOR FREE, WHICH IS WHY THIS IS SMALL ────────────────
 *
 * NO URL PARSING. An embed needs the video id extracted, and one of the four YouTube
 * URLs carries a `&list=` playlist parameter — exactly what a naive regex mangles. The
 * link uses `url` verbatim.
 *
 * NO NEW IMAGE WORK. Posters are Sanity images at 1280x720 with real alt text on all six
 * recordings that have one, so `feedImageAttrs` already handles them. It also sidesteps
 * the objection `recording.ts` records against deriving thumbnails from `i3.ytimg.com`:
 * no request to Google before anyone has asked for the video.
 *
 * NO NEW WORDING. `recordingHeading` and `sourceLabelFor` are the page's own, promoted
 * rather than reimplemented, so the feed cannot drift from what the page calls things.
 *
 * ── AUDIO GETS THE SAME TREATMENT, AND THAT IS THE MODEL'S CALL ──────────────
 *
 * Andy asked about video; `recording.ts` is explicit that "audio and video are the same
 * fact" and that `kind` selects wording rather than a different model. Shipping video
 * only would have made the feed assert a split the content model deliberately refuses.
 * Andy, 2026-09-13: all recordings, `kind` picks the verb.
 *
 * ── AND A POSTERLESS RECORDING STILL GETS A LINK ─────────────────────────────
 *
 * One of the six has no poster (The Informed Life). It falls back to a text link, which
 * is the same shape of decision `Recording.astro` makes for enclosure-less audio: a
 * heading and a source line with no face. Emitting nothing would hide a recording that
 * exists.
 */
function recordingHtml(
  recording: FEED_PRESENTATIONS_QUERY_RESULT[number]['recording'],
  genre: string | null,
): string {
  if (!recording?.url) return ''

  const heading = escapeXml(recordingHeading(recording.kind, genre))
  const href = escapeXml(recording.url)
  const source = sourceLabelFor(recording)
  const duration = recording.duration ? escapeXml(recording.duration) : null
  const img = recording.poster ? feedImageAttrs(recording.poster) : null

  /* The link line, shared by every branch below. Under a player it reads as a caption;
     without one it IS the section. `Watch on YouTube · 29:19`. */
  const linkText = source ? `${recordingVerb(recording.kind)} on ${escapeXml(source)}` : heading
  const line = [`<a href="${href}">${linkText}</a>`, duration].filter(Boolean).join(' · ')

  /*
   * VIDEO WITH A PARSEABLE YOUTUBE ID GETS THE EMBED. Everything else — audio, and any
   * video whose URL `youtubeId` does not recognise — falls through to the poster
   * treatment below, which is what shipped first and still works.
   *
   * `title` because an iframe needs an accessible name; without one a screen reader
   * announces an unlabelled frame. 560x315 is YouTube's own 16:9 default rather than
   * Substack's 728x409, which is sized to their column and not to anyone else's.
   */
  const videoId = recording.kind === 'video' ? youtubeId(recording.url) : null
  if (videoId) {
    const embed =
      `<p><iframe src="https://www.youtube-nocookie.com/embed/${escapeXml(videoId)}" ` +
      `width="560" height="315" frameborder="0" loading="lazy" ` +
      `allow="autoplay; fullscreen; picture-in-picture" allowfullscreen ` +
      `title="${heading}"></iframe></p>`
    return `<h2>${heading}</h2>${embed}<p>${line}</p>`
  }

  if (img) {
    /* The poster IS the link, so the line below it is plain text: source and duration,
       joined only when both exist — "YouTube · 29:19", or either alone. */
    const caption = [source && escapeXml(source), duration].filter(Boolean).join(' · ')
    const alt = escapeXml(recording.poster?.altText ?? '')
    const face =
      `<p><a href="${href}">` +
      `<img src="${escapeXml(img.src)}" width="${img.width}" height="${img.height}" alt="${alt}" />` +
      `</a></p>`
    return `<h2>${heading}</h2>${face}${caption ? `<p>${caption}</p>` : ''}`
  }

  /*
   * NO POSTER AND NO EMBED: the link line is the whole section.
   *
   * Its text is deliberately NOT the heading. The first version linked the heading, so a
   * posterless recording rendered "Listen to the Interview" as an h2 and then again as
   * the link immediately under it — valid markup that simply read badly, caught by
   * diffing the built feed rather than by any check. "Listen on The Informed Life" is
   * the page's own idiom, which is what `sourceLabelFor` exists to fill in.
   */
  return `<h2>${heading}</h2><p>${line}</p>`
}

export function presentationEntries(rows: FEED_PRESENTATIONS_QUERY_RESULT, site: URL): AtomEntry[] {
  return rows.filter(usable).map((row) => {
    const url = new URL(`/presentations/${row.slug}/`, site).href
    const highlights = row.highlights ?? []
    return {
      id: url,
      url,
      title: row.title,
      /* `description` rather than `shortDescription`: `presentation` deliberately has no
         card-copy field, so its meta description plays that role — the same substitution
         `SEARCH_PRESENTATIONS_QUERY` makes. */
      summary: row.description,
      categories: categories(row.genre, row.topics),
      ...dates(row.pubDate),
      /* The recording block is raw HTML appended AFTER the serialized Portable Text,
         not synthesized as blocks. A linked image is not expressible as a standard
         Portable Text block, and inventing a custom type for one feed would put a
         rendering concern into the content vocabulary. */
      content:
        toFeedHtml(
          [
            ...(row.bodyText ?? []),
            ...(highlights.length > 0 ? [HIGHLIGHTS_HEADING, ...highlights] : []),
          ],
          {permalink: url},
        ) + recordingHtml(row.recording, row.genre),
    }
  })
}

/**
 * Sort, cap, render, clean, respond — the four lines every feed route would otherwise
 * repeat.
 *
 * ── THE TIEBREAK ON TITLE IS NOT COSMETIC ─────────────────────────────────────
 *
 * Three notes share `2026-08-26`, and a sort keyed on date alone would order them by
 * however the per-type arrays happened to concatenate. Byte-stable build output is what
 * lets a deploy diff mean something, and `search-index.ts` sorts the same way for the
 * same reason.
 *
 * ── STEGA IS STRIPPED HERE, ONCE, FOR ALL FIVE ────────────────────────────────
 *
 * `loadQuery` turns stega on for `PUBLIC_SITE_MODE=preview`, encoding invisible Unicode
 * into every string so Presentation can offer click-to-edit. Right for a page, wrong for
 * a feed: the characters are content, they travel into `<title>` and `<content>`, and a
 * subscriber has no Studio to click into. `loadQuery` offers no per-call opt-out.
 *
 * Applied to the finished XML rather than per row, so nothing can be missed by being
 * projected somewhere this function does not walk. In a production build stega is off
 * and this is a no-op.
 */
export function feedResponse(entries: AtomEntry[], meta: FeedMeta, site: URL): Response {
  const newest = entries
    .sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title))
    .slice(0, FEED_LIMIT)

  const self = new URL(meta.path, site).href

  const xml = atomFeed({
    id: self,
    selfUrl: self,
    alternateUrl: new URL(meta.alternatePath, site).href,
    title: meta.title,
    subtitle: meta.subtitle,
    authorName: 'Andy Fitzgerald',
    entries: newest,
  })

  /**
   * NOTE the `content-type` set here only reaches a visitor in the SSR preview build.
   * These are prerendered routes, so in production Astro writes the body to a `.xml`
   * file and discards the header; nginx then types it from its own extension map. Making
   * production serve `application/atom+xml` is an nginx change, recorded as a phase 6
   * carry-forward in `docs/feeds-kickoff.md`.
   */
  return new Response(stegaClean(xml), {
    headers: {'content-type': 'application/atom+xml; charset=utf-8'},
  })
}
