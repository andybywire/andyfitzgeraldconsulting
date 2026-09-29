import MiniSearch from 'minisearch'
import type {SearchEntry} from '../lib/search-index'
import {topicCounts} from '../lib/search-index'
import {slugify} from '../lib/slug'
import {selectTopics} from '../lib/topics'

/**
 * Site search: opening the field, and answering it.
 *
 * ── TYPING PREVIEWS, RETURN COMMITS ─────────────────────────────────────────
 *
 * Andy's model (2026-09-12), and it is what removes the History API from this file
 * entirely. Results appear in place from the second character, with the URL untouched —
 * an ephemeral preview of the page you are already on. Pressing Return submits the form,
 * which is a real GET to `/search/?q=…`, and THAT is what puts a query in the address bar.
 *
 * So there is no pushState, no replaceState and no popstate handling, and the plan's
 * "push once, then replace" contract does not apply: nothing here writes history, because
 * the only thing that changes the URL is a form the browser submits itself. A shared link
 * and a typed preview reach the same view by different routes.
 *
 * ── THE SUBMIT IS DELIBERATELY NOT INTERCEPTED ──────────────────────────────
 *
 * Not an omission. The field is a real form pointed at a real prerendered page, so the
 * browser's own submission is both the no-JavaScript behaviour and the committed one —
 * intercepting it would mean reimplementing navigation to arrive somewhere the browser
 * already goes.
 */

/**
 * Two characters, per Andy — results appear from the second keystroke.
 *
 * This used to have to agree with Fuse's `minMatchCharLength`, and in the old build it
 * did not. MiniSearch has no such setting — it tokenises, so a two-character query is
 * simply a two-character term, matched by prefix. The number is now free to be whatever
 * Andy wants it to be, which is the point of writing it down: nothing else constrains it.
 */
const MIN_QUERY = 2

/**
 * Long enough to coalesce a burst of keystrokes, short enough to feel immediate. The
 * index is already in memory by the time this matters, so the debounce is protecting the
 * render rather than a request.
 */
const DEBOUNCE_MS = 120

/** Matching search.astro's build-time list, so the two empty states agree. */
const COMMON_TOPIC_LIMIT = 12

/**
 * An entry with its facet slugs already derived.
 *
 * The index ships prefLabels, because the engine should match human words and because one
 * source of truth beats a label and a slug that can disagree. The slug is what the
 * filtering compares, so it is computed ONCE when the index loads rather than on every
 * chip against every result — which at 78 entries and a dozen chips is thousands of
 * string transforms per keystroke, all of them producing the same answers.
 */
interface Indexed extends SearchEntry {
  topicSlugs: string[]
  genreSlug: string | null
}

interface Facet {
  slug: string
  label: string
}

interface Index {
  entries: Indexed[]
  /* A closure rather than the MiniSearch instance, so everything this file knows about
     the engine lives in `loadIndex` and the call site just asks a question and gets
     entries back. It also hides the id→entry hop below. */
  search: (query: string) => Indexed[]
  topics: Array<{label: string; slug: string}>
}

type FacetKey = 'topic' | 'genre'

/**
 * ── FETCHED ONCE, LAZILY, AND THE PROMISE IS THE CACHE ──────────────────────
 *
 * Holding the PROMISE rather than the resolved value means two keystrokes racing the
 * first fetch share it instead of starting two. It is never re-fetched: the index is a
 * build artifact, so it cannot change while the page is open.
 */
let indexPromise: Promise<Index> | null = null

function loadIndex(): Promise<Index> {
  indexPromise ??= fetch('/search.json')
    .then((response) => response.json() as Promise<SearchEntry[]>)
    .then((raw) =>
      raw.map((entry) => ({
        ...entry,
        topicSlugs: entry.topics.map(slugify),
        genreSlug: entry.genre ? slugify(entry.genre) : null,
      })),
    )
    .then((entries) => {
      /*
       * ── WORD BOUNDARIES, NOT SUBSTRINGS: WHY THE ENGINE CHANGED ─────────
       *
       * Fuse until 2026-09-13. The symptom on record was that "rien" returned 7 results
       * at every threshold including 0.0, because it sits inside "expe(rien)ce" — and
       * the note here concluded the board had picked an unlucky word.
       *
       * It had not. The same property was breaking ordinary queries. Re-measured against
       * the live index on 2026-09-13, at 79 entries:
       *
       *                  Fuse   MiniSearch
       *   design system     0        8   ← Fuse matched the whole query as ONE contiguous
       *                                    pattern per field, so a title holding "design"
       *                                    and a topic holding "Systems" could never meet
       *   user research     1        2
       *   tent             34        0   ← was identical to "content"
       *   onomy            13        0   ← was identical to "taxonomy"
       *   ia               14        7   ← Fuse's included "Apologia"
       *
       * No threshold reaches any of that; it is what substring matching IS.
       *
       * The lesson worth keeping: "rien" was not an unlucky example, it was the visible
       * end of a defect. A recorded limitation that only ever shows up on a silly input
       * is worth re-testing on serious ones.
       */
      const byUrl = new Map(entries.map((entry) => [entry.url, entry]))

      const mini = new MiniSearch<Indexed>({
        idField: 'url',
        fields: [
          'title',
          'kind',
          'topics',
          'headings',
          'description',
          'bodyTerms',
          'keywords',
          'synonyms',
        ],
        /*
         * `topics` and `synonyms` are arrays and `description` is nullable, where
         * MiniSearch tokenises a string. Joining on a space is enough rather than lossy:
         * the space is itself a boundary, so no term can span two array members.
         */
        extractField: (entry, field) => {
          const value = entry[field as keyof Indexed]
          return Array.isArray(value) ? value.join(' ') : (value ?? '')
        },
      })

      mini.addAll(entries)

      return {
        entries,
        /*
         * ── THE THREE SEARCH OPTIONS, EACH MEASURED ─────────────────────────
         *
         * `combineWith: 'AND'`. The default is OR, which ranks multi-term matches first
         * and would be the forgiving choice — but on this corpus it is not forgiving,
         * it is indiscriminate: "design system" returns 44 of 79 entries under OR and 8
         * under AND, "user research" 23 against 2, "governance model" 26 against 2
         * (2026-09-13). At 79 entries a result list that long is the same as none.
         *
         * `prefix: true` is what makes results appear from the second keystroke rather
         * than only on a completed word — "tax" and "taxo" both return the 13 that
         * "taxonomy" does. Removing it would quietly undo MIN_QUERY.
         *
         * `fuzzy` IS GATED ON TERM LENGTH, and this is the non-obvious one. A flat 0.2
         * allows one edit on a four-character term, which let two of the defects above
         * back in through a different door: "rien" matched "Rizen" (one deletion) and
         * "tent" matched a four-letter neighbour, so both returned rows again. At four
         * characters one edit is a quarter of the word and stops discriminating.
         *
         * Measured across gates at >4, >5 and >6 characters: all three fix rien, tent
         * and note identically, and all three keep every typo case working — "taxonmy"
         * 13, "knowlege graphs" 5, "architecure" 12. >4 is chosen because it is the most
         * PERMISSIVE of the three, so a five-letter word still gets its typo forgiven.
         *
         * ── THE WEIGHTS ─────────────────────────────────────────────────────
         *
         * Descended from the old build's Fuse weights — title 1.0, topics 0.9,
         * description 0.8 — rescaled because a MiniSearch boost is a multiplier rather
         * than a 0–1 weight. The ORDER is what carried over, and one reason with it:
         * `synonyms` sits below everything because a concept's altLabel should FIND a
         * document, never outrank a title match. Verified — "a11y" returns exactly the
         * one entry tagged Accessibility, scoring 2.9 where a title match scores 20+.
         *
         * `kind` is new, and the old note ruled it out: searching "note" would match
         * every Note, "which is worse than the gap." That reasoning was substring-shaped
         * and does not survive tokenisation — measured, "note" returns the 3 documents in
         * the Note branch, "case study" the 7 case studies, "keynote" the 1 keynote.
         * Worth knowing rather than fixing: "review" returns 23 and "perspective" 15,
         * i.e. everything of that kind, which is a fair reading of the query.
         *
         * ── AND THE TWO THAT REACH INTO THE BODY ────────────────────────────
         *
         * `headings` ABOVE `description` because a heading is written to be scanned and
         * card copy is written to sell — the heading is the better description of what
         * the document actually covers. Only just above: card copy is still authored
         * prose about the same document, not a proxy for it.
         *
         * `keywords` near the bottom, above only `synonyms`, and for a related reason.
         * These terms are DERIVED rather than written — nobody chose them, TF-IDF did —
         * so a keyword hit is evidence the subject appears in the body, which is weaker
         * than evidence somebody named it. It should pull a document into the results
         * and almost never to the top of them.
         *
         * `bodyTerms` sits just above `keywords` and well below `topics`, and the gap on
         * each side is the whole claim. All three can match the same words, so the ladder
         * has to say what KIND of evidence each one is:
         *
         *   topics 2.0     a person tagged THIS DOCUMENT with the concept
         *   bodyTerms 0.85 a person put the term in the vocabulary; the prose uses it
         *   keywords 0.7   nobody chose it; TF-IDF found it distinctive
         *
         * So an article tagged "Card Sorting" outranks one that merely discusses card
         * sorting, and the second is still found — which was the requirement. Only just
         * above `keywords`, because both are statements about the body rather than about
         * the document, and the vocabulary's authority is over what COUNTS AS A TERM, not
         * over what this document is about.
         *
         * Measured against the built index on 2026-09-14, and the gap is wide: on
         * "knowledge graphs" the tagged documents score 50.0 down to 34.6 while the
         * body-only match scores 12.1. On "information architecture" every tagged
         * document outranks the first body-only one.
         *
         * A TITLE match does outrank a tag, and that is correct rather than a leak —
         * "Knowledge Graphs and IA" takes the top slot on that query without carrying the
         * tag, because a document named for the thing is the best answer to it. The
         * ladder holds wherever title evidence is equal, which is the claim; it is a
         * tendency and not a guarantee, because BM25 also normalises by field length and
         * `bodyTerms` is short — a median of 7 terms.
         *
         * Retrieval is the bigger win and it is what this was built for: "tree testing"
         * went from 0 results to 5, "card sorting" 1 to 3, "linked data" 2 to 5, and
         * "information architecture" 10 to 23.
         *
         * Note also that MiniSearch tokenises this field like every other, so "card
         * sorting" is indexed as two terms and `combineWith: 'AND'` is what makes the
         * phrase behave like one. Adjacency is NOT preserved — a document using both
         * words far apart matches too. See `docs/search-ranking.md`.
         */
        search: (query: string) =>
          mini
            .search(query, {
              combineWith: 'AND',
              prefix: true,
              fuzzy: (term) => (term.length > 4 ? 0.2 : false),
              boost: {
                title: 3,
                topics: 2,
                kind: 1.5,
                headings: 1.2,
                description: 1,
                bodyTerms: 0.85,
                keywords: 0.7,
                synonyms: 0.6,
              },
            })
            /* Every id came out of `entries`, so the lookup cannot miss. Going back to
               the entry rather than using MiniSearch's `storeFields` is what keeps
               `Indexed` — with its precomputed slugs — the only shape the rest of this
               file ever sees. */
            .map((hit) => byUrl.get(hit.id as string)!),
        /*
         * Tallied from the index rather than fetched separately, so the list a failed query
         * offers is the same one `/search/` renders at build — same function, same corpus.
         */
        topics: selectTopics(topicCounts(entries), COMMON_TOPIC_LIMIT).map((topic) => ({
          label: topic.label,
          slug: slugify(topic.label),
        })),
      }
    })

  return indexPromise
}

export function initSearch() {
  const header = document.querySelector<HTMLElement>('.masthead')
  const main = document.querySelector<HTMLElement>('main')
  const viewTemplate = document.querySelector<HTMLTemplateElement>('template[data-search-view]')
  const rowTemplate = document.querySelector<HTMLTemplateElement>('template[data-search-result]')
  const chipTemplate = document.querySelector<HTMLTemplateElement>('template[data-search-chip]')

  const toggle = header?.querySelector<HTMLButtonElement>('.search-toggle')
  const field = header?.querySelector<HTMLFormElement>('.search-field')
  const input = header?.querySelector<HTMLInputElement>('.search-field-input')
  const dismiss = header?.querySelector<HTMLButtonElement>('.search-dismiss')

  if (
    !header ||
    !main ||
    !viewTemplate ||
    !rowTemplate ||
    !chipTemplate ||
    !toggle ||
    !field ||
    !input ||
    !dismiss
  ) {
    return
  }

  /*
   * Which elements THIS script hid, rather than "everything in <main>". Restoring by
   * clearing `hidden` on every child would reveal anything a page had hidden for its own
   * reasons — and both index pages hide cards past the truncation point.
   */
  let hidden: HTMLElement[] = []
  let view: HTMLElement | null = null
  let timer = 0

  const ensureView = (): HTMLElement => {
    if (!view) {
      view = viewTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement
      view.addEventListener('click', onFacetClick)
      main.append(view)
    }
    return view
  }

  /*
   * Hiding rather than removing, which is the whole reason this is cheap. The host page's
   * own scripts keep their listeners, their ResizeObservers and their state — the Insights
   * masonry is mid-measurement behind this — so closing search restores a live page rather
   * than rebuilding one.
   */
  const takeOver = () => {
    const current = ensureView()
    for (const child of Array.from(main.children)) {
      if (child !== current && child instanceof HTMLElement && !child.hidden) {
        child.hidden = true
        hidden.push(child)
      }
    }
    current.hidden = false
  }

  const restore = () => {
    for (const child of hidden) child.hidden = false
    hidden = []
    if (view) view.hidden = true

    /*
     * ── CLEARING THE PRE-PAINT FLAG IS PART OF RESTORING ──────────────────────
     *
     * `data-search-query` is set by BaseLayout's head script to hide `/search/`'s resting
     * body before first paint, so a query does not flash the wrong page on its way in. It
     * is a guess made before this script exists — "a q is arriving" — and THIS is where
     * that guess is resolved.
     *
     * Leaving it set is what broke `/search/?q=` and `/search/?q=a` (Andy, 2026-09-12):
     * the head script hid the invitation and the topic list, this script then declined to
     * search because the query was under two characters, and nothing was put in their
     * place. The page kept its h1 and lost everything below it.
     *
     * Two separate faults produced that, and both are fixed: the flag now lifts here, and
     * `run` is called unconditionally at the end of this file rather than only when a
     * query is present.
     */
    delete document.documentElement.dataset.searchQuery
  }

  const row = (entry: SearchEntry): HTMLElement => {
    const item = rowTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement
    const link = item.querySelector<HTMLAnchorElement>('[data-result-link]')!
    link.href = entry.url
    link.textContent = entry.title

    /* <Eyebrow>'s own elements, rendered with placeholders at build. See its note in
       SearchResults.astro: removing the <time> is the same state Eyebrow produces for an
       entry with no date, and it takes the `span + time::before` pipe with it. */
    item.querySelector('.eyebrow span')!.textContent = entry.kind
    const time = item.querySelector<HTMLTimeElement>('.eyebrow time')!
    if (entry.date && entry.dateLabel) {
      time.dateTime = entry.date
      time.textContent = entry.dateLabel
    } else {
      time.remove()
    }

    /* A Clipping shows its source INSTEAD of a description — the presence of a source is
       the discriminator, not the genre, which is what <NoteCard> does and for the reason
       its header gives: a genre is a renameable label, `clipRef` either exists or not. */
    const desc = item.querySelector<HTMLElement>('[data-result-desc]')!
    const source = item.querySelector<HTMLElement>('[data-result-source]')!
    if (entry.sourceDomain) {
      desc.remove()
      source.querySelector('[data-result-source-text]')!.textContent = entry.sourceDomain
      source.hidden = false
    } else {
      source.remove()
      if (entry.description) desc.textContent = entry.description
      else desc.remove()
    }

    return item
  }

  /*
   * ── WHAT A QUERY PRODUCES, AND WHAT A CLICK CHANGES ────────────────────────
   *
   * `results` is the UNFILTERED answer to the current query and `facets` is derived from
   * it once. Selecting a chip never re-derives either — the chip set is a property of the
   * QUERY, not of the selection, so the row of available filters holds still while you
   * use it. That is the same instinct that froze chip order at build time on the indexes:
   * controls that rearrange as you click them read as broken.
   *
   * It is also why there are no counts. The indexes need them because AND across a large
   * vocabulary strands you in empty results; here the chips come from a result set that is
   * already small, and the board draws none.
   */
  let query = ''
  let results: Indexed[] = []
  let facets: Record<FacetKey, Facet[]> = {topic: [], genre: []}
  const selected: Record<FacetKey, Set<string>> = {topic: new Set(), genre: new Set()}

  /*
   * Whether each group has been expanded past its line budget. Per QUERY, not per click —
   * a chip click re-renders the chips, and collapsing the row under the pointer that just
   * used it would be hostile. `run` resets it alongside the selection, which is right:
   * a new query brings a new vocabulary and the old expansion means nothing.
   */
  const expanded: Record<FacetKey, boolean> = {topic: false, genre: false}

  /*
   * ── TOPICS AND · GENRES OR · THE TWO GROUPS AND ────────────────────────────
   *
   * Straight from the filters annotation (2763:4482), and the genre half is the part that
   * differs from every other facet row on the site: "here, if Interviews and Methods are
   * both clicked, the results list will be filtered to show entries with those two
   * genres". An entry holds exactly ONE genre, so "entries with those two genres" can only
   * mean either — where the indexes treat genre as an exclusive filter and two selections
   * produce a selector that can never match.
   *
   * Topics stay AND, per the same annotation: "any results that do not have that tag are
   * removed from the list. The same applies if an additional chip is clicked."
   */
  const matchesWith = (sel: Record<FacetKey, Set<string>>) => (entry: Indexed) =>
    [...sel.topic].every((slug) => entry.topicSlugs.includes(slug)) &&
    (sel.genre.size === 0 || (entry.genreSlug !== null && sel.genre.has(entry.genreSlug)))

  const matches = (entry: Indexed) => matchesWith(selected)(entry)

  /*
   * ── WOULD CLICKING THIS CHIP LEAVE ANYTHING STANDING? ──────────────────────
   *
   * urls-and-filtering.md's argument for the indexes applies here with more force: "AND on
   * its own would strand a visitor in empty results routinely. It is safe ONLY because
   * unavailable options are removed, which makes an empty result unreachable by clicking."
   *
   * Search makes that worse than an index does, because its chips come from a result set
   * rather than a whole corpus — the intersections are smaller, so two plausible-looking
   * topics empty the list far more often. Measured on `?q=content`: Taxonomy leaves 6 and
   * adding Governance leaves 0, and nothing on screen warned you.
   *
   * ── THE TEST HAS TO MIRROR THE COMBINATION RULE, AND IT IS ASYMMETRIC ──────
   *
   * This is the part that was wrong, and wrong in a way that looked right until a genre was
   * selected (Andy, 2026-09-12): search "mental model", pick a topic, watch four genres
   * dim — then pick one of the live genres and every dimmed genre came back.
   *
   * The cause is that genres are OR. Testing "the current selection PLUS this chip" is the
   * right question for an AND group, where adding narrows. For an OR group adding WIDENS,
   * so once one genre matches, `some` is trivially true for every other genre — the first
   * genre's own rows keep satisfying the predicate and nothing can ever come back empty.
   *
   * So an OR chip is tested ALONE against the other groups: "is there a row with THIS
   * genre that survives the topic filter?" Which also makes a genre chip's availability
   * depend only on the topics — it does not move as other genres are picked, which is
   * exactly what a visitor expects of a group whose members do not compete.
   *
   * `some` rather than `filter().length`: this only needs to know whether ONE row survives,
   * and it runs once per unselected chip on every render. It short-circuits on the first
   * hit, where counting would always walk the whole set.
   */
  const wouldYield = (key: FacetKey, slug: string) => {
    const next: Record<FacetKey, Set<string>> = {
      topic: new Set(selected.topic),
      genre: new Set(selected.genre),
    }

    if (key === 'genre') next.genre = new Set([slug])
    else next.topic.add(slug)

    return results.some(matchesWith(next))
  }

  /*
   * The vocabulary of the current result set, alphabetical.
   *
   * Alphabetical rather than the indexes' count-descending, because without counts on the
   * chips a frequency order has nothing on screen explaining it — it would just look
   * shuffled. Alphabetical is the order you can scan.
   */
  const deriveFacets = (rows: Indexed[]): Record<FacetKey, Facet[]> => {
    const topic = new Map<string, string>()
    const genre = new Map<string, string>()

    for (const entry of rows) {
      entry.topics.forEach((label, i) => topic.set(entry.topicSlugs[i], label))
      if (entry.genre && entry.genreSlug) genre.set(entry.genreSlug, entry.genre)
    }

    const sorted = (map: Map<string, string>) =>
      [...map]
        .map(([slug, label]) => ({slug, label}))
        .sort((a, b) => a.label.localeCompare(b.label))

    return {topic: sorted(topic), genre: sorted(genre)}
  }

  /*
   * ── HOW MANY ROWS EACH GROUP GETS, BELOW `md` ──────────────────────────────
   *
   * Annotation 2763:4679: "See all Topics only appears on Mobile (to save vertical space).
   * As on other screens, it truncates to three lines for topics, and two lines for Genres.
   * As in this example, if there aren't more than two lines for Genres, the button is not
   * shown."
   *
   * Different budgets per group, which the indexes do not need — theirs sit side by side in
   * columns of different widths and take the same two rows. Here they stack in one column,
   * so the only thing rationing them is how much vertical space each deserves, and topics
   * are the group worth more of it.
   */
  const ROW_BUDGET: Record<FacetKey, number> = {topic: 3, genre: 2}

  /*
   * ── BUDGETED BELOW `md`, WHICH IS THE ANNOTATION AS WRITTEN ────────────────
   *
   * 2763:4679 puts the control on Mobile only, "to save vertical space", and that is what
   * this reads: the flag is absent below `md`, which is the base state by construction.
   *
   * ── THE md-TO-lg BAND IS UNBUDGETED, AND THAT IS ACCEPTED ──────────────────
   *
   * The rail is at its NARROWEST just above `md` — 229px at 768 against 316 at 1440 — so
   * that band shows the most chip rows of any width. Measured on `?q=content`: 27 topics
   * wrap to 24 rows, about 1525px of chips, where the budget would give 310.
   *
   * Briefly moved to the `lg` flag to bound it, and reverted (Andy, 2026-09-13). The
   * annotation is about which widths get the control, and it says Mobile; a tall rail
   * beside a results column that is taller still is a cost worth paying to keep that true.
   *
   * Reading the flag rather than restating 48rem, so tokens.css stays the only place that
   * width is written.
   */
  const isNarrow = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-md').trim() !== 'true'

  /*
   * ── PACKED IN ARITHMETIC, NOT BY TRYING LAYOUTS ────────────────────────────
   *
   * Lifted from `card-index.ts`, whose note is the reason: revealing one chip and measuring
   * the row count, repeatedly, is dozens of forced layout flushes per group. A chip's width
   * does not depend on how many siblings are visible, so reveal everything once, read every
   * width in a single pass, then simulate the wrap.
   *
   * The `more` control is measured too and parked at the end of the run — it occupies a
   * slot in the last kept row, so packing without it reveals one chip too many.
   */
  const fitGroup = (list: HTMLElement, key: FacetKey) => {
    const items = Array.from(list.children) as HTMLElement[]
    const more = items.find((li) => li.querySelector('[data-search-facet-more]'))
    const fewer = items.find((li) => li.querySelector('[data-search-facet-fewer]'))
    if (!more || !fewer) return
    const chips = items.filter((li) => li !== more && li !== fewer)

    /*
     * Reveal everything — the "see all" control INCLUDED — before reading a single width.
     * It has to be visible to be measured, and measuring it `hidden` is a silent
     * off-by-one-row: the tail costs 0, one extra chip gets packed, and then showing the
     * real 104px control pushes the group past its budget. Measured at 375: four rows
     * against a budget of three, and three against two, on exactly this mistake.
     *
     * `fewer` is hidden for the measurement because it never coexists with `more` — it is
     * the control for the state where nothing is being packed at all.
     */
    for (const li of chips) li.hidden = false
    more.hidden = false
    fewer.hidden = true

    /* From `lg` up the rail shows everything and neither control has a job. */
    if (!isNarrow()) {
      more.hidden = true
      return
    }

    /*
     * Expanded: every chip is shown and `fewer` closes it, parked at the END of the run
     * rather than back at the heading — which is where the reader's eye already is after
     * reading down the list they just revealed. <FacetFilters> makes the same choice.
     */
    if (expanded[key]) {
      more.hidden = true
      fewer.hidden = false
      return
    }

    const available = list.clientWidth
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0
    const widths = chips.map((li) => li.getBoundingClientRect().width)
    const moreWidth = more.getBoundingClientRect().width

    /* How many rows a prefix of chips occupies, with `tail` parked at the end. */
    const rowsFor = (count: number, tail: number) => {
      let rows = 1
      let used = 0
      for (const width of [...widths.slice(0, count), tail]) {
        if (used === 0) used = width
        else if (used + gap + width <= available) used += gap + width
        else {
          rows++
          used = width
        }
      }
      return rows
    }

    let shown = chips.length
    while (shown > 1 && rowsFor(shown, moreWidth) > ROW_BUDGET[key]) shown--

    for (const [i, li] of chips.entries()) li.hidden = i >= shown

    /* Nothing held back means nothing to reveal it with — which is the case the annotation
       names: "if there aren't more than two lines for Genres, the button is not shown." */
    more.hidden = shown >= chips.length
  }

  const fitFacets = () => {
    const current = ensureView()
    for (const group of current.querySelectorAll<HTMLElement>('[data-search-facet]')) {
      const list = group.querySelector<HTMLElement>('[data-search-chips]')
      if (list) fitGroup(list, group.dataset.searchFacet as FacetKey)
    }
  }

  const renderFacets = () => {
    const current = ensureView()
    const nav = current.querySelector<HTMLElement>('[data-search-facets]')!

    for (const group of nav.querySelectorAll<HTMLElement>('[data-search-facet]')) {
      const key = group.dataset.searchFacet as FacetKey
      const list = group.querySelector<HTMLElement>('[data-search-chips]')!
      const reset = group.querySelector<HTMLButtonElement>('[data-search-facet-reset]')!

      /* Both reveal controls are server-rendered inside this list; take them before the
         replace and put them back after, so they keep their scope attribute and <Chip>'s
         styles rather than being rebuilt without them. */
      const more = list.querySelector('[data-search-facet-more]')?.closest('li')
      const fewer = list.querySelector('[data-search-facet-fewer]')?.closest('li')

      list.replaceChildren(
        ...facets[key].map((facet) => {
          const item = chipTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement
          const chip = item.querySelector<HTMLButtonElement>('[data-facet-chip]')!
          const isSelected = selected[key].has(facet.slug)
          chip.textContent = facet.label
          chip.dataset.facetKey = key
          chip.dataset.facetSlug = facet.slug
          chip.setAttribute('aria-pressed', String(isSelected))

          /*
           * A SELECTED CHIP IS NEVER DISABLED — clicking it is how you get back, and a
           * control that both holds a filter and refuses to release it is a trap. Only
           * unselected chips are tested, and only for whether ADDING them empties the list.
           *
           * `aria-disabled` rather than the `disabled` attribute, which a <button> unlike
           * an anchor genuinely has. The reason is the one urls-and-filtering.md gives for
           * the indexes: the chip "stays focusable and discoverable rather than falling out
           * of the tab order". That matters more here, not less — with no counts on the
           * chips, the dimmed row IS the only thing saying what else the result set holds.
           */
          chip.setAttribute('aria-disabled', String(!isSelected && !wouldYield(key, facet.slug)))
          return item
        }),
      )

      if (more) list.append(more)
      if (fewer) list.append(fewer)

      /* A group with nothing in it is hidden rather than left as a bare heading — the
         Presentation-branch genres simply do not appear in a Document-only result set. */
      group.hidden = facets[key].length === 0
      reset.hidden = selected[key].size === 0
    }

    nav.hidden = false
    fitFacets()
  }

  const render = (topics: Index['topics']) => {
    const current = ensureView()
    const title = current.querySelector<HTMLElement>('[data-search-title]')!
    const list = current.querySelector<HTMLElement>('[data-search-list]')!
    const count = current.querySelector<HTMLElement>('[data-search-count]')!
    const advice = current.querySelector<HTMLElement>('[data-search-advice]')!
    const topicsNav = current.querySelector<HTMLElement>('[data-search-topics]')!
    const facetsNav = current.querySelector<HTMLElement>('[data-search-facets]')!

    /*
     * ── THE HEADING ALWAYS OPENS WITH "Search", AND ALWAYS CARRIES THE QUERY ──
     *
     * Andy, 2026-09-12. The count used to lead it, so the widest-moving part of the
     * sentence sat where the eye anchors and the whole line shifted on every keystroke.
     *
     * The query used to LEAVE the heading when a search failed — bare "Search", with the
     * query moving to the line below — because 1015:5035 and 1026:5211 each drew their
     * own state and the two did not agree. Settled by Andy 2026-09-13: one rule, and the
     * board was updated to match. Verified against 1026:5211, which now reads "Search
     * results for “xxyz”" — note the example term moved off "rien", which was never a
     * no-results case (it is inside "expe(rien)ce").
     *
     * Hence ONE assignment above the branch rather than two identical ones inside it.
     * Two would be free to drift back apart, which is exactly what just got fixed.
     */
    title.textContent = `Search results for “${query}”`

    if (!results.length) {
      /* "No items found", verbatim from 1026:5290 — and deliberately the SAME string the
         filtered-to-nothing branch below sets. The two states are told apart by what is
         on screen around it, not by the sentence: here the advice line and Common Topics
         are showing and the facet rail is hidden, and there it is the other way round.
         The query is not repeated, because the h1 above now carries it. */
      count.textContent = 'No items found'
      list.replaceChildren()
      advice.hidden = false
      facetsNav.hidden = true

      const topicList = topicsNav.querySelector<HTMLElement>('[data-search-topic-list]')!
      topicList.replaceChildren(
        ...topics.map((topic) => {
          const li = document.createElement('li')
          const link = document.createElement('a')
          /* The same `?topic=` contract <TopicList> owns, and the destination the board's
             annotation names: "This list links to the 'Insights' index page with query
             parameters applied." */
          link.href = `/insights/?topic=${topic.slug}`
          link.textContent = topic.label
          li.append(link)
          return li
        }),
      )
      topicsNav.hidden = false
    } else {
      const shown = results.filter(matches)

      list.replaceChildren(...shown.map(row))
      advice.hidden = true
      topicsNav.hidden = true

      /*
       * ── FILTERED TO NOTHING IS NOW UNREACHABLE, AND THIS IS THE GUARD ──────
       *
       * It WAS reachable, and that is why chips are disabled: within one query every click
       * either adds an option already known to yield a row, or removes one — and removing
       * only ever widens. So nothing a visitor can press empties this list.
       *
       * Kept anyway, and cheap. The indexes deleted their equivalent on the same reasoning
       * (urls-and-filtering.md: "The empty state needs no guard — it is unreachable from
       * the UI"), but their guarantee rests on a build-time tally where this one rests on a
       * predicate evaluated per render. If `wouldYield` and `matches` ever disagree, this
       * is the difference between a wrong number and a blank column.
       *
       * The chips STAY on screen and the advice stays hidden: the query succeeded and it is
       * the filter that is empty, so "try another search term" would be wrong advice.
       */
      count.textContent = shown.length
        ? `${shown.length} item${shown.length === 1 ? '' : 's'} found`
        : 'No items found'

      renderFacets()
    }

    count.hidden = false

    /* The host page's <title> is now describing something that is not on screen. The
       <head>'s JSON-LD is deliberately left alone — it describes the page a crawler
       actually fetched, which is the one that was server-rendered. */
    document.title = title.textContent ?? document.title
  }

  const run = async () => {
    const next = input.value.trim()

    if (next.length < MIN_QUERY) {
      restore()
      return
    }

    const index = await loadIndex()

    /* Re-read after the await: the index may have been fetched across several keystrokes,
       and rendering a stale query's results would be worse than rendering none. */
    if (input.value.trim() !== next) return

    /* A NEW QUERY CLEARS THE SELECTION. The chips are derived from this result set, so a
       filter carried over from the last one could name a facet that is no longer on
       screen — a filter in force with no control showing it. */
    query = next
    results = index.search(next)
    facets = deriveFacets(results)
    selected.topic.clear()
    selected.genre.clear()
    expanded.topic = false
    expanded.genre = false

    render(index.topics)
    takeOver()
  }

  const open = () => {
    header.dataset.search = 'open'
    toggle.setAttribute('aria-expanded', 'true')
    input.focus()
    input.select()
  }

  const close = () => {
    delete header.dataset.search
    toggle.setAttribute('aria-expanded', 'false')
    restore()

    /*
     * `focus()` is a no-op on a `display: none` element, and the rule that reveals the nav
     * again is keyed on the attribute deleted above — so without flushing the style recalc
     * first, focus lands on <body> and a keyboard user loses their place. Reading a layout
     * property is what flushes it.
     *
     * Deliberately not `requestAnimationFrame`: it does not fire in a hidden document,
     * which is exactly where this would be hardest to notice.
     */
    void toggle.offsetWidth
    toggle.focus()
  }

  /*
   * ── THE SHORTCUT HINT, AND WHY IT IS COMPUTED RATHER THAN WRITTEN ──────────
   *
   * Board annotation on `li:search` (1727:11250): "Tool tip: '⌘ K'".
   *
   * SET IN SCRIPT, NOT IN THE MARKUP, because the keydown handler below accepts
   * `metaKey || ctrlKey` — the shortcut really is Ctrl+K away from a Mac, so a hardcoded
   * ⌘ would be telling most Windows and Linux visitors to press a key their keyboard does
   * not have. The control is already script-gated (it does not exist without JavaScript),
   * so there is no state where the markup ships a hint the script cannot correct.
   *
   * `userAgentData.platform` first, since `navigator.platform` is deprecated, with the
   * old field and then the UA string behind it — every one of the three is a guess about
   * hardware, and being wrong here costs a tooltip rather than a behaviour.
   *
   * ── A NATIVE `title`, WHICH IS A DELIBERATE FLOOR ──────────────────────────
   *
   * The annotation names a tooltip and no board draws one, so there is no ground, border,
   * radius or placement to build to — inventing them would be a design decision rather
   * than an implementation of one. `title` also lands in the right place semantically:
   * the button already has an accessible NAME from its label, so this becomes its
   * description, and a screen reader reads "Search, button, ⌘ K" rather than replacing
   * one with the other.
   *
   * What it does not do is appear on keyboard focus, which is the honest limitation of
   * the native affordance. If that matters, it needs a designed tooltip.
   */
  const platform =
    (navigator as {userAgentData?: {platform?: string}}).userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent
  toggle.title = /mac|iphone|ipad|ipod/i.test(platform) ? '⌘ K' : 'Ctrl K'

  /*
   * ── ONE DELEGATED LISTENER, BECAUSE THE CHIPS ARE REPLACED EVERY QUERY ─────
   *
   * Binding per chip would mean re-binding on every keystroke that changes the result set.
   * The view outlives them all, so it is the listener's home — and it is cloned once, so
   * this is bound once.
   */
  const onFacetClick = (event: Event) => {
    const target = event.target as HTMLElement

    const reveal = target.closest<HTMLElement>(
      '[data-search-facet-more], [data-search-facet-fewer]',
    )
    if (reveal) {
      const key = reveal.closest<HTMLElement>('[data-search-facet]')!.dataset
        .searchFacet as FacetKey
      expanded[key] = reveal.hasAttribute('data-search-facet-more')
      fitFacets()

      /*
       * Focus has to move, because the control that was just pressed is now `hidden` and
       * would otherwise drop focus on <body>. The group's first chip is the same target a
       * reset uses — and it is the top of the run either way, expanding or collapsing.
       *
       * `expanded` still resets on a new query, so the row also collapses on its own at the
       * next keystroke; this control is for going back WITHIN a query.
       */
      const group = reveal.closest<HTMLElement>('[data-search-facet]')!
      group.querySelector<HTMLElement>('[data-facet-chip]')?.focus()
      return
    }

    const chip = target.closest<HTMLElement>('[data-facet-chip]')
    if (chip) {
      /* `pointer-events: none` stops the mouse, but an `aria-disabled` button is still in
         the tab order by design and Enter would otherwise activate it. */
      if (chip.getAttribute('aria-disabled') === 'true') return

      const key = chip.dataset.facetKey as FacetKey
      const slug = chip.dataset.facetSlug!
      if (selected[key].has(slug)) selected[key].delete(slug)
      else selected[key].add(slug)
      void loadIndex().then((index) => render(index.topics))
      return
    }

    const reset = target.closest<HTMLElement>('[data-search-facet-reset]')
    if (!reset) return

    const key = reset.closest<HTMLElement>('[data-search-facet]')!.dataset.searchFacet as FacetKey
    selected[key].clear()
    void loadIndex().then((index) => {
      render(index.topics)

      /*
       * Focus the group's first chip, matching the indexes: the reset control has just
       * gone `hidden`, so focus would otherwise fall to <body> and a keyboard user would
       * lose their place entirely. open-questions.md records the alternative — the group
       * heading with `tabindex="-1"` — as something to revisit with a live region, which
       * search does not have yet.
       */
      const group = ensureView().querySelector(`[data-search-facet="${key}"]`)
      group?.querySelector<HTMLElement>('[data-facet-chip]')?.focus()
    })
  }

  toggle.addEventListener('click', open)
  dismiss.addEventListener('click', close)

  input.addEventListener('input', () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(run, DEBOUNCE_MS)
  })

  document.addEventListener('keydown', (event) => {
    /* `metaKey || ctrlKey` so the shortcut is the platform's own on both. `key` rather
       than `code` so it respects the layout actually being typed on, lower-cased because
       Shift changes it. `preventDefault` because Ctrl+K focuses Firefox's own search bar. */
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      open()
      return
    }

    if (event.key === 'Escape' && header.dataset.search === 'open') close()
  })

  /*
   * Arriving WITH a query — a shared link, or the page the form just submitted to. The
   * field is server-rendered empty because `/search/` is one static file for every `?q=`,
   * so the value has to be put back client-side.
   */
  const initial = new URLSearchParams(location.search).get('q')?.trim()
  if (initial) input.value = initial

  /*
   * ── RUN UNCONDITIONALLY, EVEN WITH NOTHING TO SEARCH ────────────────────────
   *
   * `run` either renders results or RESTORES, and restoring is what lifts the pre-paint
   * flag. Calling it only when a query exists left `/search/?q=` — which is what Return
   * on an empty field submits — with the resting body hidden and nothing rendered.
   *
   * On a page with no query at all this costs one call that clears an attribute nobody
   * set and un-hides an empty list. The index is never fetched, because `run` returns
   * before `loadIndex` when the query is too short.
   */
  void run()
}
