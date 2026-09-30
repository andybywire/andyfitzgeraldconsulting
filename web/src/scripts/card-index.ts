/**
 * The card index behaviour — facet filtering and the reveal, shared by the Insights and
 * Presentations indexes.
 *
 * ── EXTRACTED, AND THE ORIGINAL PREDICTED THE SHAPE ──────────────────────────
 *
 * This was written inline in `insights/index.astro`, where a note on `NOUN` recorded the
 * intent: "Presentations gets the same masonry, the same facet groups and the same
 * footer, so this whole script is portable — everything else in it is addressed by class
 * name or read from `location.pathname`… When it does, this and the masonry belong in
 * one module together and the noun becomes its argument."
 *
 * That is what happened, with one change: the masonry went to <CardMasonry> rather than
 * into this module, because it is genuinely independent — it measures and packs whatever
 * cards it holds and needs to work on a page with no filter at all. The two now meet
 * through an event, not a function reference; see `relayout` below.
 *
 * The noun did become an argument, and it arrives through the DOM rather than a call
 * parameter — <ResultsFooter> renders it as data attributes, because it is also the
 * component that renders the server-side resting sentence and the two must not disagree.
 *
 * ── NOTHING IN HERE NAMES A ROUTE ────────────────────────────────────────────
 *
 * Every URL is built from `location.pathname`, so the module carries no second copy of
 * either route and a trailing-slash difference cannot turn a history write into a
 * navigation.
 */

/**
 * ── THE DOM IS THE FACET INDEX ───────────────────────────────────────────────
 *
 * There is no JSON index and there does not need to be one while every document renders.
 * Every card carries `data-genre` and `data-topics` as space-separated clean slugs, so
 * one CSS selector IS the whole AND intersection and the counts come from the same query
 * that does the hiding. It comes back when show-more stops rendering everything, around
 * 150 items.
 */
type FacetKey = 'topic' | 'genre'
type Selection = Record<FacetKey, string[]>

const FACET_KEYS: readonly FacetKey[] = ['topic', 'genre']

/**
 * ── THE REVEAL STEP, AND ITS CSS TWIN ────────────────────────────────────────
 *
 * <CardMasonry truncate> carries the pre-paint rule that hides everything past the first
 * `STEP` cards, and CSS cannot read this constant — it is written there as `n + 25`.
 * THE TWO MUST AGREE: the CSS floor is `STEP + 1`. Both sides carry a comment naming the
 * other. If this changes, that changes.
 */
const STEP = 24

/**
 * ── THE FACET CHIPS: ENABLE, THEN GROW TO FILL THE ROW BUDGET ────────────────
 *
 * The markup ships 5 topics and 3 genres, disabled, because filtering is client-side and
 * a control that cannot work should say so. Everything below is the enhancement: enable
 * what is there, then reveal as many more chips as fit in two rows (three below `md`,
 * where the groups stack and there is width to spare).
 *
 * ── PACKED IN ARITHMETIC, NOT BY TRYING LAYOUTS ──────────────────────────────
 *
 * The obvious implementation reveals one chip, measures the row count, and repeats —
 * which is up to 31 forced layout flushes per group, on every resize. A chip's width does
 * not depend on how many of its siblings are visible, so instead: reveal everything once,
 * read every width in a single pass, then simulate the wrap in arithmetic. One layout
 * read, no thrash.
 */
function fitRow(list: HTMLElement, budget: number) {
  const entries = Array.from(list.children) as HTMLElement[]
  const chips = entries.filter((li) => !li.querySelector('.chip-more, .chip-fewer'))
  const more = entries.find((li) => li.querySelector('.chip-more'))
  const fewer = entries.find((li) => li.querySelector('.chip-fewer'))
  if (!more || !fewer) return

  const expanded = list.dataset.expanded === 'true'

  /* Reveal everything so every width is measurable, then read in one pass. The `more`
     control has to be measured too: it occupies a slot in the last kept row, so packing
     without it would reveal one chip too many. */
  for (const li of chips) li.hidden = false
  more.hidden = false
  fewer.hidden = true

  const available = list.clientWidth
  /* Read from the cascade rather than hardcoded, so it follows the token. */
  const gap = parseFloat(getComputedStyle(list).columnGap) || 0
  const widths = chips.map((li) => li.getBoundingClientRect().width)
  const moreWidth = more.getBoundingClientRect().width

  /* How many rows a given prefix of chips occupies, with `tail` parked at the end. */
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

  if (expanded) {
    /* Everything shown, and `fewer` closes it — parked at the end of the run, which is
       where the reader's eye ends up rather than back at the heading. */
    more.hidden = true
    fewer.hidden = false
    return
  }

  /* The largest prefix that still fits the budget. It CAN land below the static floor of
     5 and 3 — at 375 a couple of long labels fill three rows on their own — and that is
     right: fitting the space is the goal, and overflowing it to honour a floor chosen for
     the no-script case would be the wrong trade. */
  let shown = chips.length
  while (shown > 1 && rowsFor(shown, moreWidth) > budget) shown--

  for (const [i, li] of chips.entries()) li.hidden = i >= shown

  /* Nothing left to reveal means nothing to reveal it with. */
  more.hidden = shown >= chips.length
}

/* Two rows from `md`, three below it — reading the flag rather than restating the width,
   so tokens.css stays the only place 48rem is written. */
function rowBudget() {
  const md = getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-md')
  return md.trim() === 'true' ? 2 : 3
}

function fitAllFacets() {
  const budget = rowBudget()
  for (const list of document.querySelectorAll<HTMLElement>('.facet-chips')) {
    fitRow(list, budget)
  }
}

/* Wiring for the disclosure controls. Runs exactly once — SEPARATE FROM THE RE-FIT ON
   PURPOSE: that runs on every resize and on font load, and folding the listener
   registration in would attach a new click handler on each pass. */
function wireFacets() {
  const groups = document.querySelectorAll<HTMLElement>('.facet-group')
  if (!groups.length) return

  for (const group of groups) {
    const list = group.querySelector<HTMLElement>('.facet-chips')
    if (!list) continue

    /* Enable. The label's missing verb is NOT restored here — `applySelection` rewrites
       every chip's `aria-label` from its live count and state, and two writers of one
       attribute is a bug waiting to be found. This clears only the resting
       `aria-disabled`; a zero-hit chip earns it back there. */
    for (const chip of group.querySelectorAll<HTMLElement>('.chip[aria-disabled]')) {
      chip.removeAttribute('aria-disabled')
    }

    const more = list.querySelector<HTMLButtonElement>('.chip-more')
    const fewer = list.querySelector<HTMLButtonElement>('.chip-fewer')

    more?.addEventListener('click', () => {
      list.dataset.expanded = 'true'
      fitRow(list, rowBudget())
      /* Focus follows the disclosure to the control that replaced it, so a keyboard user
         is not dropped at the top of a list that just grew under them. */
      fewer?.focus()
    })

    fewer?.addEventListener('click', () => {
      list.dataset.expanded = 'false'
      fitRow(list, rowBudget())
      more?.focus()
    })
  }

  fitAllFacets()

  /*
   * Label widths change with the font and the row budget changes with the rung, so the
   * fit re-runs on both.
   *
   * OBSERVING A GROUP, NOT `.facets` — that element is `display: contents`, so it has no
   * box and a ResizeObserver on it would never fire. Width-guarded for the same reason
   * the masonry's is: revealing chips changes the list's HEIGHT, and an unguarded
   * observer feeds itself.
   */
  document.fonts.ready.then(fitAllFacets)

  let queuedFit = 0
  let lastFacetWidth = 0
  new ResizeObserver((entries) => {
    const width = Math.round(entries[0].contentRect.width)
    if (width === lastFacetWidth) return
    lastFacetWidth = width
    cancelAnimationFrame(queuedFit)
    queuedFit = requestAnimationFrame(fitAllFacets)
  }).observe(groups[0])
}

function wireFilter(grid: HTMLElement, nav: HTMLElement) {
  const cards = Array.from(grid.children) as HTMLElement[]
  const chips = Array.from(nav.querySelectorAll<HTMLAnchorElement>('.chip[data-facet]'))
  const groups = Array.from(nav.querySelectorAll<HTMLElement>('.facet-group'))
  const footer = document.querySelector<HTMLElement>('[data-results-footer]')
  const countLine = document.querySelector<HTMLElement>('.result-count')
  const results = document.querySelector<HTMLElement>('[data-card-results]')
  const resultsLabel = document.querySelector<HTMLElement>('[data-results-label]')
  const status = document.querySelector<HTMLElement>('.result-status')
  const showMore = document.querySelector<HTMLButtonElement>('.show-more')
  const showAll = document.querySelector<HTMLButtonElement>('.show-all')

  /*
   * ── THE NOUN, THE ONLY PAGE-SPECIFIC THING LEFT ──────────────────────────
   *
   * Read off <ResultsFooter> rather than passed in, because that component also renders
   * the server-side resting sentence — so one element is the single source for the word
   * and the two cannot disagree. Falling back to "result" means a page that forgot the
   * footer still emits English rather than "undefined".
   */
  const NOUN = {
    one: footer?.dataset.nounOne || 'result',
    many: footer?.dataset.nounMany || 'results',
  }
  const noun = (n: number) => (n === 1 ? NOUN.one : NOUN.many)

  /* Handed to <CardMasonry> as an event, since an Astro component's script is its own
     module and holds no reference we could call. The grid re-measures every visible
     card; see that component for why the spans cannot be computed at build time. */
  const relayout = () => grid.dispatchEvent(new Event('card-masonry:relayout'))

  /*
   * ── THE REVEAL, WHICH IS THE SECOND AXIS ─────────────────────────────────
   *
   * How many cards are shown is two independent things: the FILTER, which lives in the
   * URL and is shareable, and the REVEAL, which does not and is not (Andy, 2026-08-31).
   * It resets on navigating away, which is the point — a link should carry what you
   * searched for, not how far you had scrolled through it.
   *
   * THE TWO NEVER OVERLAP. A filtered view shows every match and offers no controls:
   * filtering is already a reduction, and truncating a reduction would be a second cut
   * nobody asked for. The reveal is REMEMBERED across that, so expanding, filtering, and
   * clearing puts you back where you were rather than back at 24.
   *
   * That non-overlap is also what keeps the masonry honest: truncation is always a DOM
   * SUFFIX, so it can never disturb the ladder's count over the visible set. If the two
   * axes ever did combine, that guarantee would need re-checking.
   */
  let revealed = STEP

  /* Every slug the page knows about, read off the chips the build already tallied. An
     unrecognised `?topic=` value is dropped against this — and because slugify emits only
     [a-z0-9-], anything that survives is safe to interpolate into a selector without
     escaping. */
  const known: Record<FacetKey, Set<string>> = {topic: new Set(), genre: new Set()}
  for (const chip of chips) {
    const key = chip.dataset.facet as FacetKey
    if (chip.dataset.slug) known[key].add(chip.dataset.slug)
  }

  const empty = (): Selection => ({topic: [], genre: []})

  function withGroup(sel: Selection, key: FacetKey, values: string[]): Selection {
    const next: Selection = {topic: [...sel.topic], genre: [...sel.genre]}
    next[key] = values
    return next
  }

  function toggle(sel: Selection, key: FacetKey, slug: string): Selection {
    const on = sel[key].includes(slug)
    return withGroup(sel, key, on ? sel[key].filter((s) => s !== slug) : [...sel[key], slug])
  }

  /*
   * ── READING THE URL ──────────────────────────────────────────────────────
   *
   * COMMA-JOINED — `?topic=a,b&genre=method` (Andy, 2026-08-31). `getAll().join()` rather
   * than `get()` so a repeated parameter is understood too: it costs one word and means a
   * hand-edited or double-appended URL still resolves.
   *
   * UNKNOWN VALUES ARE DROPPED SILENTLY, and the cleaned URL is written back with
   * `replaceState` so a stale shared link heals itself. Note the consequence for phase 6:
   * the nginx rule rewriting `/insights/tag/{slug}/` to `?topic={slug}` was designed
   * assuming altLabel matching would catch a renamed concept. Without it a renamed
   * concept's old tag URL lands here, drops, and shows the unfiltered index — graceful,
   * and now a known consequence rather than a surprise.
   */
  function readSelection(search: string): Selection {
    const params = new URLSearchParams(search)
    const sel = empty()

    for (const key of FACET_KEYS) {
      const raw = params.getAll(key).join(',').split(',')
      sel[key] = [...new Set(raw.filter((slug) => known[key].has(slug)))]
    }

    return sel
  }

  /*
   * The URL for a given selection. Values are sorted ALPHABETICALLY rather than kept in
   * click order, so one filter state is one URL — the normalisation
   * docs/urls-and-filtering.md asks for. Alphabetical rather than chip order because chip
   * order is count-descending and therefore moves as content is published; a shared link
   * should not depend on the corpus.
   *
   * Built from `location.pathname`, which is also what makes this module route-agnostic.
   */
  function urlFor(sel: Selection) {
    const params = FACET_KEYS.filter((key) => sel[key].length).map(
      (key) => `${key}=${[...sel[key]].sort().join(',')}`,
    )
    return params.length ? `${location.pathname}?${params.join('&')}` : location.pathname
  }

  /*
   * ── ONE SELECTOR IS THE WHOLE INTERSECTION ───────────────────────────────
   *
   * `~=` matches one word of a space-separated attribute natively, so
   * `[data-topics~="knowledge-graphs"][data-genre="method"]` is the AND of a topic and a
   * genre as a single selector. The script never splits a string to test membership, and
   * nothing here reads rendered text — which is what keeps preview mode's stega-encoded
   * strings out of the comparison.
   *
   * AND ACROSS GENRES IS A REAL CONSTRAINT, NOT A BUG. `data-genre` is single-valued, so
   * two selected genres produce a selector that can never match. That is AND behaving as
   * specified, and it is exactly why live counts are not separable from it: once one
   * genre is chosen, every other genre counts zero and goes unavailable, so the empty
   * state is unreachable by clicking.
   */
  function matcher(sel: Selection) {
    return (
      sel.topic.map((slug) => `[data-topics~="${slug}"]`).join('') +
      sel.genre.map((slug) => `[data-genre="${slug}"]`).join('')
    )
  }

  function countFor(selector: string) {
    return selector === '' ? cards.length : cards.filter((card) => card.matches(selector)).length
  }

  const isFiltered = (sel: Selection) => FACET_KEYS.some((key) => sel[key].length)

  /*
   * ── ONE STRING, THREE CONSUMERS ──────────────────────────────────────────
   *
   * The visible line and the announcement are the same sentence, built once. That is the
   * answer to "can the message that changes on screen be the message a screen reader
   * hears" — it can, and it is the same function; the two elements exist only because one
   * of them must not speak on load.
   *
   * The third is the card grid's accessible name, which is `aria-labelledby` the visible
   * line — see "THE GRID IS A REGION" below. Nothing extra is written for it: a name
   * computed by reference follows the referenced text, so every rewrite here renames the
   * grid too.
   *
   * IT HAS TO BE SELF-SUFFICIENT. A live region is heard with no surrounding context, so
   * "14" would be meaningless — the sentence has to say what 14 is.
   *
   * What it deliberately does NOT say is which filter caused the change, and that is not
   * an omission: the chip that was just clicked is the focused element, and its own
   * accessible name already changed to "Method, 14 results, selected, remove filter".
   * Naming the filter here would say it twice.
   *
   * Wording is Andy's, 2026-08-31. Two cases he did not specify are filled in rather than
   * emitting bad English — the singular, and zero, which reads "No matching insights"
   * rather than "Displaying 0". The no-filter branch is mirrored server-side by
   * <ResultsFooter>; if this sentence changes, that one does.
   */
  function describe(sel: Selection, shown: number) {
    if (isFiltered(sel)) {
      if (shown === 0) return `No matching ${NOUN.many}`
      return `Displaying ${shown} matching ${noun(shown)}`
    }
    const total = cards.length
    if (shown >= total) return `Displaying all ${total} ${noun(total)}`
    return `Displaying ${shown} of ${total} ${noun(total)}`
  }

  /*
   * The live region is CLEARED shortly after it speaks, and that is not housekeeping. Its
   * text duplicates the visible line word for word, so leaving it populated puts the same
   * sentence twice in a row for anyone reading the page linearly. Announcing is a
   * mutation, not a state — once it has been read the region has no reason to hold
   * anything.
   *
   * One timer, reset on each call, so a second change inside the window replaces the
   * message rather than having its own clear cancelled by the first.
   */
  let clearAnnouncement = 0
  function announce(message: string) {
    if (!status) return
    status.textContent = message
    clearTimeout(clearAnnouncement)
    clearAnnouncement = window.setTimeout(() => {
      status.textContent = ''
    }, 3000)
  }

  /*
   * ── THE ONE WRITER ───────────────────────────────────────────────────────
   *
   * Everything derived from the selection is written here and nowhere else: which cards
   * are visible, every chip's count, state, name and href, each group's reset control,
   * the results label and the grid's accessible name. State goes in, the whole page comes
   * out — so there is no incremental update to get out of step with the URL.
   */
  let current = empty()

  /* The single-tag selection the page LOADED with, as its canonical URL — or null when it
     loaded with none or with several. Set once, in the initial-state block; see "A
     SINGLE-TAG ARRIVAL IS NAMED" there. A URL rather than a Selection because `urlFor`
     already normalizes, so comparing two of them IS selection equality. */
  let arrivalUrl: string | null = null

  /* False for exactly one call — the initial render — because the region must not read a
     shared `?topic=` link's count out over the page load. Back and Forward DO announce:
     the content changed and the visitor asked for it. */
  function applySelection(sel: Selection, shouldAnnounce = true) {
    current = sel

    /*
     * ONE PASS SETS BOTH AXES. A card is shown when it matches the filter AND falls within
     * the reveal — and the reveal only applies when there is no filter, so in practice
     * exactly one of the two is ever doing work.
     *
     * `shown` counts survivors rather than using the loop index, so the cutoff is "the
     * first N that match" rather than "the first N in the DOM". Those are the same thing
     * while the axes stay mutually exclusive; writing it this way means the day they stop
     * being exclusive, this line is already right.
     */
    const filtered = isFiltered(sel)
    const selector = matcher(sel)
    let shown = 0
    for (const card of cards) {
      const matches = selector === '' || card.matches(selector)
      card.hidden = !matches || (!filtered && shown >= revealed)
      if (!card.hidden) shown++
    }

    /* The handover: from here `hidden` is the only thing truncating, so the pre-paint CSS
       rule must stop. Set in the same synchronous pass that writes the flags above, so no
       frame sees both mechanisms or neither. */
    grid.dataset.hydrated = ''

    /* "Show all" while anything is held back; "Show more" only while a further step would
       leave a remainder — otherwise it is a second button doing exactly what the first one
       does. Both stay hidden on a corpus smaller than one step, which is the Presentations
       index today. */
    if (showMore) showMore.hidden = filtered || revealed + STEP >= cards.length
    if (showAll) showAll.hidden = filtered || shown >= cards.length

    for (const chip of chips) {
      const key = chip.dataset.facet as FacetKey
      const slug = chip.dataset.slug ?? ''
      const selected = sel[key].includes(slug)
      const next = toggle(sel, key, slug)

      /* STRICT AND: an unselected chip shows what you would get by adding it. A selected
         one shows the current result count, since adding what is already there changes
         nothing — the honest number either way. */
      const count = countFor(selected ? selector : matcher(next))

      chip.setAttribute('href', urlFor(next))

      /* The count is still written even when it will not be shown, so the chip has
         something to reveal the moment the intersection opens up again. `is-zero` drops it
         and widens the chip to fill the space it left — see the rule. */
      const countEl = chip.querySelector<HTMLElement>('.chip-count')
      if (countEl) countEl.textContent = String(count)
      chip.classList.toggle('is-zero', count === 0 && !selected)
      const label = chip.querySelector('.chip-label')?.textContent ?? ''

      /*
       * THE ACCESSIBLE NAME CHANGES BY STATE, and that is the point rather than a
       * workaround: a selected chip's href REMOVES its filter where an unselected one's
       * adds it, so the same control means opposite things and only the fill says so
       * visually.
       *
       * `aria-current`, never `aria-pressed`, which is button-only — and it draws the
       * selected pill too, since DESIGN.md has the attribute carry the fact.
       * `aria-disabled` rather than dropping `href`, so a zero-hit chip stays focusable
       * and discoverable.
       */
      if (selected) {
        chip.setAttribute('aria-current', 'true')
        chip.removeAttribute('aria-disabled')
        chip.setAttribute('aria-label', `${label}, ${count} results, selected, remove filter`)
      } else {
        chip.removeAttribute('aria-current')
        if (count === 0) {
          chip.setAttribute('aria-disabled', 'true')
          chip.setAttribute('aria-label', `${label}, no results, unavailable`)
        } else {
          chip.removeAttribute('aria-disabled')
          chip.setAttribute('aria-label', `${label}, ${count} results, add filter`)
        }
      }
    }

    /* Present only once its own group has a selection, and pointing at the current state
       minus that group — which is why there is no global reset: two scoped controls are
       unambiguous where one would not be. */
    for (const group of groups) {
      const key = group.dataset.facetGroup as FacetKey
      const reset = group.querySelector<HTMLAnchorElement>('.facet-reset')
      if (!reset) continue
      reset.hidden = sel[key].length === 0
      reset.setAttribute('href', urlFor(withGroup(sel, key, [])))
    }

    /* The results label shows only while the selection IS the arrival — so adding a tag
       hides it and taking that tag away again, or pressing Back, brings it back. The
       grid's name follows it, joined ahead of the count line: `aria-labelledby` reads
       referenced text even while it is hidden, so the label's id is only in the list
       while the label is on screen. */
    const labelled = arrivalUrl !== null && urlFor(sel) === arrivalUrl
    if (resultsLabel) resultsLabel.hidden = !labelled
    if (countLine?.id) {
      const names = labelled && resultsLabel?.id ? [resultsLabel.id, countLine.id] : [countLine.id]
      grid.setAttribute('aria-labelledby', names.join(' '))
    }

    const message = describe(sel, shown)
    if (countLine) countLine.textContent = message
    if (shouldAnnounce) announce(message)

    /* Counts change chip widths, so the row budget has to be re-packed; and the visible
       card set changed, so the spans have to be re-measured. */
    fitAllFacets()
    relayout()
  }

  /*
   * ── HISTORY: PUSH ONCE, THEN REPLACE ─────────────────────────────────────
   *
   * (Andy, 2026-08-31.) The first filter pushes and every refinement replaces, so one Back
   * returns to the unfiltered index and a second leaves the page — rather than trapping
   * someone behind a dozen presses, which is what a push per toggle would do.
   *
   * `pushed` is re-armed on `popstate`: once Back has moved off the entry this script
   * pushed, the next filter has to push a fresh one rather than overwrite the entry the
   * visitor just returned to.
   */
  let pushed = false

  function commit(sel: Selection) {
    const url = urlFor(sel)
    if (pushed) history.replaceState(null, '', url)
    else {
      history.pushState(null, '', url)
      pushed = true
    }
    applySelection(sel)
  }

  /*
   * ONE DELEGATED LISTENER, on the nav rather than per control — `.facets` is
   * `display: contents` and so has no box, but events bubble through it regardless (that
   * only bites a ResizeObserver, which needs one).
   *
   * MODIFIED CLICKS ARE LEFT ALONE. Middle-click, cmd-click and shift-click all navigate
   * to the filtered URL for real, which is the whole reason these are anchors: a filtered
   * view is meant to be a shareable artifact.
   */
  nav.addEventListener('click', (event) => {
    if (event.defaultPrevented) return
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }

    const target = (event.target as Element | null)?.closest<HTMLElement>(
      '.chip[data-facet], .facet-reset',
    )
    if (!target) return

    /* `pointer-events: none` already stops the mouse reaching a disabled chip, but it
       stays in the tab order by design, and Enter on a focused anchor still fires a
       click. */
    if (target.getAttribute('aria-disabled') === 'true') {
      event.preventDefault()
      return
    }

    event.preventDefault()

    const group = target.closest<HTMLElement>('.facet-group')
    const isReset = target.classList.contains('facet-reset')
    const key = (isReset ? group?.dataset.facetGroup : target.dataset.facet) as FacetKey
    if (!key) return

    commit(isReset ? withGroup(current, key, []) : toggle(current, key, target.dataset.slug ?? ''))

    /* Reset moves focus to the first facet in the group it cleared — the control it
       replaced has just gone `hidden`, so focus would otherwise fall to the body.
       `:not([hidden])` because the re-fit above may have re-packed the row. Whether this
       should be the group HEADING instead, which announces "Topics" where a chip name is
       contextless, is still open and pairs with the wording of the live region. */
    if (isReset) group?.querySelector<HTMLElement>('li:not([hidden]) .chip')?.focus()
  })

  /*
   * ── REVEALING MORE ───────────────────────────────────────────────────────
   *
   * No history entry: the reveal is not in the URL, so pressing Back after "Show all"
   * leaves the page rather than re-collapsing it. That is the accepted cost of keeping the
   * URL about WHAT you are looking at rather than how much of it.
   *
   * FOCUS HAS TO BE CAUGHT. Both controls can disappear as a result of being pressed, and
   * a button that removes itself drops focus to the body — which for a keyboard user means
   * starting the page again. The fallback ladder is: the other control if it survived,
   * otherwise the count line, which is focusable for exactly this and reads out the new
   * total when focus lands on it.
   */
  function reveal(next: number, pressed: HTMLButtonElement) {
    revealed = Math.min(next, cards.length)
    applySelection(current)

    if (!pressed.hidden) return
    const fallback = pressed === showMore && showAll && !showAll.hidden ? showAll : countLine
    fallback?.focus()
  }

  showMore?.addEventListener('click', () => reveal(revealed + STEP, showMore))
  showAll?.addEventListener('click', () => reveal(cards.length, showAll))

  /* Back and Forward re-read the URL rather than replaying a stored state object: one
     parser, and an entry written before a vocabulary change still gets cleaned. */
  addEventListener('popstate', () => {
    pushed = false
    applySelection(readSelection(location.search))
  })

  /* Initial state. The canonical URL is written back whenever the address bar does not
     already hold it — which covers both a dropped unknown value and an unsorted one, with
     `replaceState` so no entry is added. */
  const initial = readSelection(location.search)
  const canonical = urlFor(initial)
  if (canonical !== location.pathname + location.search) {
    history.replaceState(null, '', canonical)
  }

  /*
   * ── ARRIVING FILTERED OPENS BOTH GROUPS ──────────────────────────────────
   *
   * (Andy, 2026-08-31.) Someone who clicks a chip watched the row they clicked it in, so
   * they know what the truncated set held. Someone arriving on a shared `?topic=` link did
   * not — and because excluded facets are disabled IN PLACE rather than sorted away, the
   * five chips they land on may all be dimmed, which reads as a broken page rather than a
   * narrow one. Opening both groups shows what the filter is a filter OF.
   *
   * BOTH groups, not just the one carrying a parameter: a topic filter is exactly what
   * makes the Genres row go quiet, so the group with no parameter in the URL is the one
   * most likely to look inexplicable.
   *
   * This is the arrival state only. From here the disclosure is the visitor's — "See
   * fewer" collapses it and clearing the filter does not reopen it.
   *
   * THE OPENED GROUPS NOW SIT ABOVE THE LANDING POINT, since a filtered arrival scrolls
   * to the cards (below). Still right: someone who scrolls back up to see what this is a
   * filter OF is exactly who this was for, and they find it open.
   */
  if (isFiltered(initial)) {
    for (const group of groups) {
      const list = group.querySelector<HTMLElement>('.facet-chips')
      if (list) list.dataset.expanded = 'true'
    }
  }

  /*
   * ── THE GRID IS A REGION, NAMED BY THE COUNT LINE ────────────────────────
   *
   * (Andy, 2026-09-30.) A filtered arrival moves focus to the grid, and a `<div>` has no
   * role and so no name — focus would land on something a screen reader can only describe
   * by reading into it. `aria-labelledby` the count line makes the landing announce
   * "Displaying 8 matching insights, region", which is also the only thing on screen that
   * says the list is filtered once the chips have scrolled away.
   *
   * ON EVERY ENHANCED LOAD, not only a filtered one, so the landmark does not come and go
   * depending on how the visitor got here. Set by script rather than in <CardMasonry>'s
   * markup because only script ever focuses it, and the name it points at is only
   * rewritten by script — a no-JS page gains nothing from the stop.
   *
   * `tabIndex = -1` so it is focusable programmatically without joining the tab order;
   * BaseLayout's skip link records the same reasoning for `<main>`. The id is read off the
   * count line rather than restated, so <ResultsFooter> is the one place it is written —
   * and no id, no name, which is why focus below is gated on this having happened.
   *
   * `aria-labelledby` itself is written by `applySelection`, not here, because since the
   * results label arrived it depends on the selection: the label joins the name while it
   * shows. That makes the one writer the only place the name is decided.
   */
  const named = Boolean(countLine?.id)
  if (countLine?.id) {
    grid.setAttribute('role', 'region')
    grid.tabIndex = -1
  }

  /*
   * ── A SINGLE-TAG ARRIVAL IS NAMED ────────────────────────────────────────
   *
   * (Andy, 2026-09-30.) Once the arrival scroll has taken the chips out of view, nothing
   * on screen says the list is filtered — worst on mobile, where the groups stack and sit
   * furthest above. So a page LOADED with exactly one tag names it over the cards:
   * "Interoperability Insights", "Case Study Insights", "Talk Presentations".
   *
   * EXACTLY ONE, across both groups. The case this serves is someone following a topic
   * tag or a genre link from another page, which is common and which always carries one.
   * `?topic=a,b` or a topic plus a genre gets no label — deliberately, not as an
   * omission: composing a sentence for every combination is complexity spent on people
   * hand-building query strings, and the chips already say what those are.
   *
   * COUNTED AFTER CLEANING, like everything else here, so `?topic=a,not-a-slug` heals to
   * one tag and is labelled. Any navigation type counts — a reload or Back to a one-tag
   * URL is still a page loaded with one tag — unlike the scroll below, which is about
   * position rather than description.
   *
   * THE LABEL IS THE CHIP'S OWN TEXT, found by the chip's data attributes rather than by
   * a selector built from the slug, and the noun is <ResultsFooter>'s, capitalized — so
   * neither the concept's name nor the page's word is written a second time.
   */
  const tags = FACET_KEYS.flatMap((key) => initial[key].map((slug) => ({key, slug})))
  if (tags.length === 1 && resultsLabel) {
    const [{key, slug}] = tags
    const chip = chips.find((c) => c.dataset.facet === key && c.dataset.slug === slug)
    const tag = chip?.querySelector('.chip-label')?.textContent?.trim()
    if (tag) {
      resultsLabel.textContent = `${tag} ${NOUN.many.charAt(0).toUpperCase()}${NOUN.many.slice(1)}`
      arrivalUrl = canonical
    }
  }

  applySelection(initial, false)

  /*
   * ── ARRIVING FILTERED LANDS ON THE CARDS ─────────────────────────────────
   *
   * (Andy, 2026-09-30.) A tag link asks for the matching cards, and the opened facet
   * groups above push those below the fold — further on mobile, where the groups stack.
   * So a filtered arrival scrolls the grid to the top of the viewport and focuses it.
   *
   * ONLY A FRESH NAVIGATION. On a reload or Back/Forward the browser restores the reader's
   * own scroll position, and overriding it is the script fighting them — a reader who
   * scrolled up to the chips and reloaded would be yanked back down. A bfcache restore
   * never re-runs this module at all. An unavailable timing entry means no scroll, which
   * is the page as it was before this existed.
   *
   * ONLY ARRIVAL. Never on a chip click, a reset or popstate: someone clicking a chip is
   * looking at the chips, and scrolling them away would pull the control out from under
   * the pointer. And only a URL that is STILL filtered once unknown values are dropped — a
   * stale link that heals to the bare index stays at the top, like the bare index.
   *
   * ── THE MOTION IS THE CASCADE'S, AND IT IS THE WAYFINDING ────────────────
   *
   * (Andy, 2026-09-30.) `behavior: 'auto'` defers to base.css, which makes <html>
   * `scroll-behavior: smooth` only under `prefers-reduced-motion: no-preference` — so the
   * page visibly glides from the top to the cards, exactly as a heading anchor does on an
   * article page, and a reader who asked for reduced motion gets the jump. The glide IS
   * the affordance: it shows where on the page you landed and that the page moved you.
   *
   * TRIED FIRST AND REJECTED: `behavior: 'instant'`, on the grounds that motion on load
   * was motion nobody asked for. They did ask — they clicked a tag — and the instant
   * version made the page appear simply to LOAD at the grid, with no sense of what
   * happened or of the chips above.
   *
   * No fragment id is needed for any of this, and none is added: the animation comes from
   * the property, not the fragment, and a script scroll gets it the same way.
   *
   * ── IT WAITS FOR THE FONTS, BECAUSE A GLIDE CANNOT HIT A MOVING TARGET ───
   *
   * Measured: with the faces held back 1.5s, the swap grows everything above the Insights
   * grid by 45px at 1024 wide. Chrome's scroll anchoring hid it; with anchoring off — which
   * is Safari, which has none — the grid came to rest 45px low, a band of chips showing
   * above the cards. A smooth scroll fixes its destination when it STARTS, so a swap
   * mid-glide lands short in every engine.
   *
   * So the glide starts on `document.fonts.ready`, when the target has stopped moving.
   * The facets' own re-fit is registered on the same promise in `wireFacets`, which runs
   * before this, so it has already repacked the chip rows by the time this callback
   * fires. The cost is that the page rests at the top until the faces arrive — which, with
   * them preloaded, is the "page loads, then scrolls" sequence a heading anchor has anyway.
   *
   * This replaced a planned second pass that would have re-aligned AFTER the fonts. With
   * a smooth scroll that pass would have had to detect the end of an animation first;
   * starting late needs no guard beyond the one below.
   *
   * THE READER'S OWN MOVE WINS. A non-zero `scrollY` by then means they scrolled first —
   * or the URL carried a fragment the browser has already honored. Either way, theirs.
   *
   * THE TARGET IS <CardResults>, NOT THE GRID. When a single-tag arrival shows its label,
   * the label is what should land in view, with the cards under it; when it does not
   * show, `hidden` takes it out of layout and the wrapper's top is the grid's. So one
   * target is right either way, and focus still goes to the grid, which is the region.
   * Falls back to the grid on a page without the wrapper.
   *
   * THE OFFSET IS IN THE CASCADE. `scrollIntoView` honors <CardResults>'s
   * `scroll-margin-block-start`, so no number is restated here. Focus goes second, with
   * `preventScroll`, because focus scrolls with its own "nearest" alignment and would
   * ignore the `start` just asked for — and `preventScroll` means no scroll action, so it
   * does not cancel the glide already under way.
   *
   * THE SILENT FIRST RENDER STILL HOLDS. `applySelection(initial, false)` above keeps the
   * live region quiet on load, and this does not contradict it: the count is heard once,
   * as the name of where focus landed, rather than spoken OVER the page load by a region.
   *
   * SEARCH NEVER REACHES THIS. It is excluded by construction, not by a route check:
   * only <FacetFilters> boots this module, and `/search/` composes <SearchResults>.
   */
  const navigation = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined
  if (isFiltered(initial) && navigation?.type === 'navigate') {
    document.fonts.ready.then(() => {
      if (scrollY !== 0) return
      const target = results ?? grid
      target.scrollIntoView({block: 'start', behavior: 'auto'})
      if (named) grid.focus({preventScroll: true})
    })
  }
}

/**
 * Boot. Called by <FacetFilters>, which is the component that owns the controls — so a
 * page without filters loads none of this.
 *
 * Every element is found by selector rather than passed in, which is what the original
 * inline script did too. The grid is addressed by `[data-card-masonry]` rather than by
 * class, so restyling can never break the behaviour.
 */
export function initCardIndex() {
  wireFacets()

  const grid = document.querySelector<HTMLElement>('[data-card-masonry]')
  const nav = document.querySelector<HTMLElement>('.facets')
  if (grid && nav) wireFilter(grid, nav)
}
