import type {APIRoute} from 'astro'
import {loadQuery} from '../../sanity/load-query'
import {FEED_ARTICLES_QUERY} from '../../sanity/queries/feeds'
import {articleEntries, feedResponse} from '../../lib/feed-entries'
import {FEEDS} from '../../lib/feeds'

/**
 * `/insights/feed-articles.xml` — long-form only, no notes.
 *
 * ── THE `feed-` PREFIX IS THE WHOLE POINT OF THE NAME ─────────────────────────
 *
 * `/insights/articles/feed.xml` was rejected in the kickoff because it asserts a path
 * that is not a page: there is no `/insights/articles/`, and `urls-and-filtering.md`
 * settled that genre subsets are query params rather than paths. A filename prefix
 * claims no such path — `feed-articles.xml` is a file in `/insights/`, which is a real
 * directory.
 *
 * ── AND IT IS `_type`, NOT A GENRE WALK ───────────────────────────────────────
 *
 * Verified in the kickoff and still true: all 5 `note` documents carry Note-branch
 * genres and zero `article` documents do, so `_type == "article"` IS the long-form set.
 * No `broader` traversal, which is what keeps this query identical to the one
 * `/insights/feed.xml` already runs — the same 20 rows, fetched once per route.
 */
export const prerender = true

export const GET: APIRoute = async ({site}) => {
  if (!site) throw new Error('[insights/feed-articles.xml] `site` is unset in astro.config.mjs')

  const articles = await loadQuery(FEED_ARTICLES_QUERY)

  return feedResponse(articleEntries(articles, site), FEEDS.articles, site)
}
