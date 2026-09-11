import {slugify} from './slug'

/**
 * Facet tallying for the card indexes — Insights and Presentations.
 *
 * Extracted from `insights/index.astro` when Presentations became the second consumer
 * and computed the identical thing from a different document set.
 */

/** One facet control: the slug the URL carries, the label shown, and its hit count. */
export interface Facet {
  slug: string
  label: string
  count: number
}

/** A group of facet controls — one vocabulary, with the copy its UI needs. */
export interface FacetGroup {
  /** The URL parameter, and the `data-facet` a chip carries. */
  key: 'topic' | 'genre'
  /** For `aria-labelledby` from the chip list to the visible heading. */
  id: string
  heading: string
  reset: string
  more: string
  fewer: string
  /** How many chips render before any script runs — see below. */
  initial: number
  items: Facet[]
}

/**
 * ── THE FACETS, TALLIED AT BUILD TIME ────────────────────────────────────────
 *
 * Counted from the same documents the cards come from, so the number on a chip and the
 * number of cards it would leave standing cannot disagree.
 *
 * SORTED BY COUNT, DESCENDING — urls-and-filtering.md: "Facet controls sort by hit
 * count, descending, so the next-broadest cut is always nearest the front." The
 * alphabetical tiebreak is not decoration: `Map` iteration order is insertion order,
 * which would make ties depend on document order and quietly reshuffle the chip row
 * whenever an unrelated document was published. This makes the build reproducible.
 *
 * It also gets the zero-hit case for free. The same doc weighs hiding unavailable
 * facets against disabling them and lands on neither: "sort by count descending and a
 * zero-hit facet sinks to the bottom on its own", below the truncation point, still in
 * the model for anyone who opens "See all".
 *
 * ── THE VOCABULARY IS WHATEVER THE ROWS CONTAIN ──────────────────────────────
 *
 * There is no vocabulary parameter and there must not be one: the groups are tallied
 * from the documents the page actually rendered, so a page shows exactly the concepts
 * its own corpus uses. That is what makes the Presentations index list only
 * Presentation-branch genres — Talk, Keynote, Interview — without filtering for them
 * anywhere. Its query selects `_type == "presentation"`, and the genres fall out.
 *
 * It also means the invariant CLAUDE.md records is load-bearing here: an `article`
 * carrying a Presentation-branch genre would surface on the Insights index as a genre
 * chip that does not belong to the Document branch. Measured clean on 2026-09-09.
 *
 * `slugify` rather than a stored slug, because concepts have no slug field — and
 * because this is the same transform the phase 6 nginx rule assumes when it rewrites
 * `/insights/tag/{slug}/` to `?topic={slug}`. altLabels are deliberately not rendered
 * as chips: two controls with identical behaviour side by side.
 */
export function tally(rows: (string | null)[][]): Facet[] {
  const bySlug = new Map<string, Facet>()

  for (const row of rows) {
    for (const label of row) {
      if (!label) continue
      const slug = slugify(label)
      const seen = bySlug.get(slug)
      if (seen) seen.count++
      else bySlug.set(slug, {slug, label, count: 1})
    }
  }

  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/**
 * The Topic and Genre groups for a set of documents.
 *
 * ── THE STATIC FLOOR, WHICH IS DELIBERATELY BELOW THE BOARD'S COUNT ──────────
 *
 * `initial` is what renders before any script runs: 5 topics and 3 genres, and every
 * chip DISABLED. It is not the board's count — the board draws 6 and 4, which is what
 * fills two rows at 571 and 316 — because how many chips fill two rows depends on how
 * wide their labels are, which only the browser knows. Same shape as the masonry spans:
 * ship a conservative floor, then measure and grow.
 *
 * DISABLED IS THE HONEST RESTING STATE, not a placeholder. Filtering is client-side by
 * design (docs/urls-and-filtering.md), so with no script these controls cannot work —
 * and a control that looks live and no-ops is worse than one that says it is inactive.
 * They stay readable either way, which keeps the vocabulary informative: a visitor
 * still learns what this collection is about. Andy's call, 2026-08-31.
 *
 * The floor is the same on both pages on purpose. It answers "how many chips fit two
 * rows before measurement", which is a question about label widths and column widths —
 * and both indexes put these groups in the same 571 and 316 columns.
 */
export function facetGroups(rows: {topics?: (string | null)[] | null; genre?: string | null}[]) {
  return [
    {
      key: 'topic',
      id: 'facet-topics',
      heading: 'Topics',
      reset: 'reset topics',
      more: 'See all topics',
      fewer: 'See fewer topics',
      initial: 5,
      items: tally(rows.map((row) => row.topics ?? [])),
    },
    {
      key: 'genre',
      id: 'facet-genres',
      heading: 'Genres',
      reset: 'reset genres',
      more: 'See all genres',
      fewer: 'See fewer genres',
      initial: 3,
      items: tally(rows.map((row) => [row.genre ?? null])),
    },
  ] satisfies FacetGroup[]
}
