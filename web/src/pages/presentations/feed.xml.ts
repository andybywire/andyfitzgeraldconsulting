import type {APIRoute} from 'astro'
import {loadQuery} from '../../sanity/load-query'
import {FEED_PRESENTATIONS_QUERY} from '../../sanity/queries/feeds'
import {feedResponse, presentationEntries} from '../../lib/feed-entries'
import {FEEDS} from '../../lib/feeds'

/**
 * `/presentations/feed.xml` — the Presentation branch.
 *
 * ── THE SHORTEST ENTRIES IN THE BUILD, AND THAT IS CORRECT ────────────────────
 *
 * Bodies run 130–922 characters. Where an article's page is prose and the feed can carry
 * all of it, a presentation's page is mostly NOT prose — the value is in the venues, the
 * deck, the recording and the transcript, which are structured metadata and a player.
 * So "full content" for this type is genuinely a paragraph plus a takeaways list, and an
 * entry that looks thin next to an article is describing something thin.
 *
 * What it is NOT is a summary feed. `<content>` carries every prose field this type has
 * except the transcript; see `FEED_PRESENTATIONS_QUERY` for why that one is out and why
 * the venue/deck/recording sections are not rebuilt here.
 *
 * ── `/talks/` DOES NOT REDIRECT HERE ──────────────────────────────────────────
 *
 * The old build had no presentations feed at all, so nothing is inheriting subscribers
 * and no redirect is owed. `urls-and-filtering.md` maps `/talks/` → `/presentations/`,
 * the page; this file is new in every sense.
 */
export const prerender = true

export const GET: APIRoute = async ({site}) => {
  if (!site) throw new Error('[presentations/feed.xml] `site` is unset in astro.config.mjs')

  const presentations = await loadQuery(FEED_PRESENTATIONS_QUERY)

  return feedResponse(presentationEntries(presentations, site), FEEDS.presentations, site)
}
