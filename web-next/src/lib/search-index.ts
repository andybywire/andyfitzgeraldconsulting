import type {
  SEARCH_INSIGHTS_QUERY_RESULT,
  SEARCH_PAGES_QUERY_RESULT,
  SEARCH_PRESENTATIONS_QUERY_RESULT,
  SEARCH_REVIEWS_QUERY_RESULT,
} from '../../sanity.types'
import {formatDate, formatMonthYear} from './date'
import {extractKeywords} from './keywords'
import type {TopicCount} from './topics'

/**
 * Four query results in, one flat array of search entries out.
 *
 * ── WHY THIS IS A MODULE AND NOT THE ENDPOINT'S FRONTMATTER ─────────────────
 *
 * Two consumers. `/search.json` serialises the entries, and `/search.astro` needs the
 * topic tally underneath them to render Common Topics at build time, with no JavaScript.
 * Both are answers about the same corpus, so they are computed from the same array rather
 * than from two queries that could come to disagree about what the site holds.
 *
 * ── THE INDEX CARRIES LABELS, NOT SLUGS ─────────────────────────────────────
 *
 * `topics` and `genre` are prefLabels. The facets need slugs, but `slugify` is a pure
 * function that ships to the client anyway, so the slug is derived once when the index
 * loads rather than stored beside the label it is derived from. One source of truth, and
 * it stays the same transform `?topic=` and the phase 6 nginx rewrite already assume.
 *
 * It also keeps the engine honest: matching runs against human words, so a query for
 * "knowledge graphs" meets "Knowledge graphs" rather than "knowledge-graphs".
 */
export interface SearchEntry {
  url: string
  title: string
  /** The genre prefLabel where there is one — "Case Study", "Keynote" — else the type. */
  kind: string
  /** ISO, for `<time datetime>`. Not what is displayed. */
  date: string | null
  /** Formatted at BUILD. See the note above `dateLabel` below. */
  dateLabel: string | null
  description: string | null
  /** A Clipping's publisher. Shown in place of the description; null on everything else. */
  sourceDomain: string | null
  genre: string | null
  topics: string[]
  /** altLabels of this entry's genre and topics. Searchable text, never a chip. */
  synonyms: string[]
  /**
   * The document's own h2/h3/h4 text, run together. Searchable, never displayed — the
   * highest-signal prose on the page, at 6 KB for the entire corpus. Empty on pages,
   * reviews, and every presentation so far.
   */
  headings: string
  /**
   * ~25 terms per document, by TF-IDF against the whole corpus. This is what stands in
   * for the body, which is deliberately not shipped — see `lib/keywords.ts`.
   */
  keywords: string[]
}

/**
 * A `SearchEntry` still carrying the body text its keywords are derived from.
 *
 * Build-only, and stripped before anything is serialised. It exists so that the URL an
 * entry is addressed by is composed EXACTLY ONCE, in the builder that owns that type's
 * URL shape. The alternative — collecting `{url, text}` pairs separately for the
 * extractor — would compose `/insights/${slug}/` in two places, and the day one of them
 * changed the keywords would silently attach to nothing. A join on a string is only as
 * good as the single place that string is built.
 */
interface Sourced extends SearchEntry {
  keywordSource: string
}

/**
 * Terms kept per document. Measured on the built index: 15 costs 7.7 KB, 25 costs 13.1 KB,
 * 40 costs 19.3 KB — flat enough that this is a precision choice, not a budget one. 25 is
 * where the sampled tails still read as subject matter rather than as debris.
 */
const KEYWORDS_PER_DOC = 25

/**
 * TypeGen types every projected field nullable, because it cannot know a field is always
 * set. These strip the nulls once, at the edge, so nothing downstream carries the
 * uncertainty — `selectTopics` makes the same call for the same reason.
 */
const strings = (values: Array<string | null> | null | undefined): string[] =>
  (values ?? []).filter((value): value is string => Boolean(value))

/**
 * The label a row falls back to when its `genre` reference is missing.
 *
 * ── UNREACHABLE AGAIN, AND IT HAS NOW BEEN EXERCISED ONCE ──────────────────
 *
 * All 43 insights and all 9 presentations carry a genre (2026-09-13), so nothing reaches
 * this today — which is what the note said before, and it is worth recording WHY the
 * claim is no longer merely untested.
 *
 * On 2026-09-13 a genre-less `article` appeared in the corpus,
 * `boutique-knowledge-graph-ux-methods`, and this branch quietly did its job: the row
 * rendered `kind: "Article"` instead of a bare separator. Andy identified it as an
 * artifact of an incomplete migration and unpublished it.
 *
 * So the guard is not theoretical and should not be tidied away as dead code. A document
 * can arrive without a genre — the Studio does not require one — and when it does, this
 * is the difference between an odd label and a broken row.
 *
 * "Article" rather than "Insight" matches the label the related band settled on.
 */
const TYPE_LABEL: Record<string, string> = {
  article: 'Article',
  caseStudy: 'Case Study',
  note: 'Note',
  presentation: 'Presentation',
}

/**
 * ── `dateLabel` IS FORMATTED HERE, AT BUILD, AND NOT IN THE BROWSER ─────────
 *
 * Three different rules produce the date on a result row: a `pubDate` for the Document
 * and Presentation branches, `_updatedAt` for a page, and the latest engagement month for
 * a review. Formatting in the client would mean the card branching on `kind` to choose a
 * formatter, which puts the rule in the one place it is hardest to see.
 *
 * Pre-formatting also keeps `Intl.DateTimeFormat` out of the bundle entirely. `date` stays
 * ISO so `<time datetime>` is still machine-readable and the array is still sortable.
 */
function insightEntries(rows: SEARCH_INSIGHTS_QUERY_RESULT): Sourced[] {
  return rows.flatMap((row) =>
    row.slug && row.title
      ? [
          {
            url: `/insights/${row.slug}/`,
            title: row.title,
            kind: row.genre ?? TYPE_LABEL[row._type] ?? 'Insight',
            date: row.pubDate,
            dateLabel: formatDate(row.pubDate),
            description: row.shortDescription,
            sourceDomain: row.sourceDomain,
            genre: row.genre,
            topics: strings(row.topics),
            synonyms: strings(row.synonyms),
            /* TypeGen types `pt::text()` as `string`, and ON THIS PROJECTION THAT IS
               WRONG: a style filter matching no blocks returns null, measured. So the
               coalesce is load-bearing rather than defensive — without it every
               heading-less document puts `null` where the engine expects text. */
            headings: row.headings ?? '',
            keywords: [],
            keywordSource: row.keywordSource ?? '',
          },
        ]
      : [],
  )
}

function presentationEntries(rows: SEARCH_PRESENTATIONS_QUERY_RESULT): Sourced[] {
  return rows.flatMap((row) =>
    row.slug && row.title
      ? [
          {
            url: `/presentations/${row.slug}/`,
            title: row.title,
            kind: row.genre ?? TYPE_LABEL[row._type] ?? 'Presentation',
            date: row.pubDate,
            dateLabel: formatDate(row.pubDate),
            description: row.description,
            sourceDomain: null,
            genre: row.genre,
            topics: strings(row.topics),
            synonyms: strings(row.synonyms),
            headings: row.headings ?? '',
            keywords: [],
            keywordSource: row.keywordSource ?? '',
          },
        ]
      : [],
  )
}

/**
 * Pages sit at the root — `/about/`, `/consulting/` — not under a section.
 *
 * No genre, no topics and no synonyms, and that is the type's definition rather than a
 * gap: CLAUDE.md's disqualifier for `page` is that it carries no Topic and no Genre
 * concepts. The consequence is that selecting any facet drops every page from the
 * results, which is a thing to look at on screen rather than to argue about here.
 */
function pageEntries(rows: SEARCH_PAGES_QUERY_RESULT): Sourced[] {
  return rows.flatMap((row) =>
    row.slug && row.title
      ? [
          {
            url: `/${row.slug}/`,
            title: row.title,
            kind: 'Page',
            date: row._updatedAt,
            dateLabel: formatDate(row._updatedAt),
            description: row.description,
            sourceDomain: null,
            genre: null,
            topics: [],
            synonyms: [],
            /* Neither query projects a body, so neither type contributes to the TF-IDF
               corpus. A page's body is scaffolding and a review IS its excerpt. */
            headings: '',
            keywords: [],
            keywordSource: '',
          },
        ]
      : [],
  )
}

/**
 * ── THE TITLE IS COMPOSED, AND THE EMPLOYER EARNS ITS PLACE TWICE ───────────
 *
 * `{author} - {employer}`, per board 2776:4929 — "Jack Fischer - World Health
 * Organization". The review's own `title` field is the reviewer's JOB TITLE and is not
 * used at all.
 *
 * The visible reason is that a name alone is thin in a result list. The better reason is
 * invisible: the employer now sits in `title`, which Fuse weights at 1.0, so "World
 * Health Organization" or "Elemeno" finds the review. The old build could not do that.
 *
 * THE SEPARATOR IS U+002D HYPHEN-MINUS, SPACED — read off the board rather than chosen,
 * and deliberately not the em dash `date.ts` uses for engagement ranges or the en dash
 * the bylines use. Three dash roles now, all different, all recorded where they are used.
 *
 * ── AND THE DATE IS THE EMPLOYER'S, NOT THE REVIEW'S ────────────────────────
 *
 * A review has no date of its own. `latestEnd` is already reduced to one ISO string by
 * the query's `| order(@ desc)[0]` — which is an ORDER and not `[-1]` because the
 * engagement array is not stored in order. See the note on SEARCH_REVIEWS_QUERY.
 */
function reviewEntries(rows: SEARCH_REVIEWS_QUERY_RESULT): Sourced[] {
  return rows.flatMap((row) =>
    row.slug && row.author
      ? [
          {
            url: `/reviews/#${row.slug}`,
            title: row.employer ? `${row.author} - ${row.employer}` : row.author,
            kind: 'Review',
            date: row.latestEnd,
            dateLabel: formatMonthYear(row.latestEnd),
            description: row.excerpt,
            sourceDomain: null,
            genre: null,
            topics: [],
            synonyms: [],
            headings: '',
            keywords: [],
            keywordSource: '',
          },
        ]
      : [],
  )
}

/**
 * Every indexable thing on the site, newest first.
 *
 * ── THE ORDER IS FOR THE FILE, NOT FOR THE READER ───────────────────────────
 *
 * Fuse re-ranks by score, so nothing a visitor sees depends on this. It exists so the
 * built `search.json` is STABLE between builds: document order out of Sanity carries no
 * such guarantee, so without a sort two builds of identical content would emit two
 * different files — which busts caches for no reason and makes a real content change
 * impossible to pick out of a build diff.
 *
 * The title tiebreak is what makes it total — five pages share no date rule with anything
 * else, and two reviews of the same client share an engagement end exactly.
 */
export function buildSearchIndex(sources: {
  insights: SEARCH_INSIGHTS_QUERY_RESULT
  presentations: SEARCH_PRESENTATIONS_QUERY_RESULT
  pages: SEARCH_PAGES_QUERY_RESULT
  reviews: SEARCH_REVIEWS_QUERY_RESULT
}): SearchEntry[] {
  const sourced = [
    ...insightEntries(sources.insights),
    ...presentationEntries(sources.presentations),
    ...pageEntries(sources.pages),
    ...reviewEntries(sources.reviews),
  ]

  /*
   * ── ONE EXTRACTION OVER ONE CORPUS, AND BOTH HALVES OF THAT MATTER ─────────
   *
   * ONE call, because IDF is a property of the corpus: run per document it would compute
   * `log(1 / 1)` for every term and return nothing at all, silently. See keywords.ts.
   *
   * ONE corpus spanning insights AND presentations rather than one per branch, so a term
   * that is ordinary across the site is discounted wherever it appears. Split in two, a
   * word common in articles would look distinctive inside the nine presentations purely
   * because that corpus is small.
   *
   * Entries with no body drop out here rather than being passed as empty text — an empty
   * document would still count toward `total` and quietly deflate every IDF.
   */
  const keywords = extractKeywords(
    sourced
      .filter((entry) => entry.keywordSource)
      .map((entry) => ({id: entry.url, text: entry.keywordSource})),
    KEYWORDS_PER_DOC,
  )

  /* `keywordSource` is destructured out and dropped: it was ~400 KB of body text, which
     is the whole reason keywords exist rather than the bodies themselves. If it ever
     shows up in `/search.json`, this line is what stopped working. */
  return sourced
    .map(({keywordSource: _dropped, ...entry}) => ({
      ...entry,
      keywords: keywords.get(entry.url) ?? [],
    }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.title.localeCompare(b.title))
}

/**
 * How much content carries each topic, for the empty state's Common Topics list.
 *
 * ── TALLIED FROM THE INDEX, NOT FROM A SECOND QUERY ─────────────────────────
 *
 * The annotation on board 1026:5247 says "We can use the same 'most common topics' list
 * that is used on the home page's 'Selected Topics' list", and `selectTopics` is that
 * rule — chosen by count, shown alphabetically, with a tiebreak that runs backwards on
 * purpose. This produces its input.
 *
 * Counting the INDEX rather than the corpus means the list can only offer topics that
 * search can actually return, which is the whole job of an empty state. It also means
 * pages and reviews contribute nothing, since they carry no topics — correct, and the
 * reason the counts here are smaller than the Home page's.
 */
export function topicCounts(entries: SearchEntry[]): TopicCount[] {
  const counts = new Map<string, number>()

  for (const entry of entries) {
    for (const topic of entry.topics) counts.set(topic, (counts.get(topic) ?? 0) + 1)
  }

  return [...counts].map(([prefLabel, count]) => ({prefLabel, count}))
}
