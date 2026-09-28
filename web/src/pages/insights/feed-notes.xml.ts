import type {APIRoute} from 'astro'
import {loadQuery} from '../../sanity/load-query'
import {FEED_NOTES_QUERY} from '../../sanity/queries/feeds'
import {feedResponse, noteEntries} from '../../lib/feed-entries'
import {FEEDS} from '../../lib/feeds'

/**
 * `/insights/feed-notes.xml` — the Note branch: notes, clippings and book notes.
 *
 * ── ONE `_type`, THREE GENRES, AND THAT IS THE MODEL WORKING ──────────────────
 *
 * Note is a BRANCH in the Genre scheme with Clipping and Book Note beneath it, which is
 * why `note` is one Sanity type rather than three: `genre` discriminates. So this feed
 * filters on `_type` and gets all three, and each entry's `<category>` says which it is.
 *
 * ── THE CAP IS INERT HERE, AND WILL BE FOR A WHILE ────────────────────────────
 *
 * 5 documents against a limit of 20. It is applied anyway rather than special-cased,
 * because a feed that behaves differently from its siblings is a thing to remember, and
 * notes are the type most likely to grow fast — they are the reason the digital-garden
 * reframe exists.
 */
export const prerender = true

export const GET: APIRoute = async ({site}) => {
  if (!site) throw new Error('[insights/feed-notes.xml] `site` is unset in astro.config.mjs')

  const notes = await loadQuery(FEED_NOTES_QUERY)

  return feedResponse(noteEntries(notes, site), FEEDS.notes, site)
}
