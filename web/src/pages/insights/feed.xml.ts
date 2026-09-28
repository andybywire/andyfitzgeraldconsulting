import type {APIRoute} from 'astro'
import {loadQuery} from '../../sanity/load-query'
import {FEED_ARTICLES_QUERY, FEED_NOTES_QUERY} from '../../sanity/queries/feeds'
import {articleEntries, feedResponse, noteEntries} from '../../lib/feed-entries'
import {FEEDS} from '../../lib/feeds'

/**
 * `/insights/feed.xml` — published writing, full content, Atom.
 *
 * ── `article` AND `note`. CASE STUDIES ARE OUT OF EVERY FEED ──────────────────
 *
 * Andy, 2026-09-13, after reading a built feed: they did not come through well, and he
 * had been on the fence about including them at all.
 *
 * The reason is structural rather than a rendering bug, which is why the fix was removal
 * rather than repair. A case study is not prose with a beginning — it is five fields
 * arranged by a template, two of whose headings exist only in that template. Lift the
 * fields out and the scaffolding has to be rebuilt by whatever lifts them. That was
 * built, it worked, and it still read as a flattened form rather than as something
 * written. `FEED_CASE_STUDIES_QUERY` and the `labelled()` helper are deleted, not
 * disabled; see `docs/feeds-kickoff.md` for the full record.
 *
 * ── SO THIS FEED IS EXACTLY ITS TWO SIBLINGS ADDED TOGETHER ───────────────────
 *
 * `feed-articles.xml` + `feed-notes.xml`, with nothing left over. A feed and its two
 * halves, which is a cleaner story than the overlapping one the kickoff started with —
 * but it does mean the Articles feed is this one minus five notes. Worth a look at
 * whether all three earn their place once they have subscribers.
 *
 * TRUE OF THE DEFINITIONS, NOT OF THE OUTPUT, because the cap counts documents per
 * feed. Subscribing to both halves yields MORE than this feed, not the same: dropping
 * the five notes lets `feed-articles.xml` reach five articles further back, which is
 * also why it is the largest of the five at 404 KB against this one's 326 KB.
 */
export const prerender = true

export const GET: APIRoute = async ({site}) => {
  if (!site) throw new Error('[insights/feed.xml] `site` is unset in astro.config.mjs')

  const [articles, notes] = await Promise.all([
    loadQuery(FEED_ARTICLES_QUERY),
    loadQuery(FEED_NOTES_QUERY),
  ])

  return feedResponse(
    [...articleEntries(articles, site), ...noteEntries(notes, site)],
    FEEDS.insights,
    site,
  )
}
