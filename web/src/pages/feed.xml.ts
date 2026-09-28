import type {APIRoute} from 'astro'
import {loadQuery} from '../sanity/load-query'
import {
  FEED_ARTICLES_QUERY,
  FEED_NOTES_QUERY,
  FEED_PRESENTATIONS_QUERY,
} from '../sanity/queries/feeds'
import {articleEntries, feedResponse, noteEntries, presentationEntries} from '../lib/feed-entries'
import {FEEDS} from '../lib/feeds'

/**
 * `/feed.xml` — everything Andy publishes. The only feed with existing subscribers.
 *
 * ── THIS URL MUST NOT MOVE, AND THAT IS RECORDED ELSEWHERE ────────────────────
 *
 * `urls-and-filtering.md` puts `/feed.xml` in the URL-surface table as "must not move",
 * with the reason: feed readers are the least forgiving consumers of a moved URL, and
 * some handle a 301 poorly and simply go quiet. The other four feeds are ADDITIONS
 * beside it, not a reorganization of it.
 *
 * ── IT WIDENS, AND EVERY EXISTING ITEM RE-DELIVERS ONCE ───────────────────────
 *
 * Two changes a subscriber will notice, both accepted by Andy in the kickoff.
 *
 * WIDER: the live 11ty feed is `article` only — 34 entries. (The kickoff originally said
 * "articles + notes"; that was checked and corrected. `web/_data/articles.js` fetches
 * `article` and `caseStudy`, and `web/_src/feed.njk` filters the case studies back out,
 * so no note has ever appeared in it.) This carries `article` + `note` + `presentation`.
 *
 * RE-DELIVERED: the live `<id>` values are `https://…/{slug}/index.html` — missing the
 * `/insights/` segment that their own `<link>` carries, so `<id>` and `<link>` disagree
 * about what the entry IS. Atom's `<id>` is how a reader decides it has seen something
 * before, so fixing it makes every existing item look new exactly once.
 *
 * That was worth doing rather than preserving: a feed with wrong GUIDs keeps causing
 * dedup problems, and phase 8's Bridgy backfeed matches replies against the canonical
 * permalink. Inheriting a broken identifier to avoid one day of noise would trade a
 * permanent defect for a temporary one.
 *
 * ── THE MIX IS LOPSIDED, ON PURPOSE ───────────────────────────────────────────
 *
 * An article entry runs 7–47 KB and a presentation entry 200–1,400 bytes, so the nine
 * presentations will rarely hold a place in the newest 20 for long. That is what a
 * combined feed of a prolific writer and an occasional speaker looks like, and it is why
 * `/presentations/feed.xml` exists separately — someone who wants the talks should
 * subscribe to the talks.
 */
export const prerender = true

export const GET: APIRoute = async ({site}) => {
  if (!site) throw new Error('[feed.xml] `site` is unset in astro.config.mjs')

  const [articles, notes, presentations] = await Promise.all([
    loadQuery(FEED_ARTICLES_QUERY),
    loadQuery(FEED_NOTES_QUERY),
    loadQuery(FEED_PRESENTATIONS_QUERY),
  ])

  return feedResponse(
    [
      ...articleEntries(articles, site),
      ...noteEntries(notes, site),
      ...presentationEntries(presentations, site),
    ],
    FEEDS.all,
    site,
  )
}
