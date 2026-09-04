import type {GENRE_TREE_QUERY_RESULT} from '../../sanity.types'

/**
 * Walking the Genre scheme, which is what turns a flat list of SKOS concepts into the
 * partition the Home page's Insights band is built on.
 *
 * GROQ returns the concepts with their parent refs and stops there — `broader` is a chain
 * of arbitrary depth and GROQ has no transitive traversal. The walk belongs somewhere it
 * can be depth-agnostic, so it lives here rather than as a hardcoded two-level filter.
 */

type Tree = GENRE_TREE_QUERY_RESULT
type Concept = Tree['concepts'][number]

/**
 * The two top concepts of the Genre scheme are the content model's own top-level division:
 * Document is everything that gets published as writing, Presentation is delivered work.
 * Only Document is walked here — Presentation has no content until the `presentation` type
 * exists, and when it does it gets its own page rather than joining this band.
 */
const DOCUMENT = 'Document'

/** Notes are a BRANCH, not a leaf: Note itself plus Clipping and Book Note beneath it. */
const NOTE = 'Note'

/**
 * Every descendant of `rootId`, inclusive, by breadth-first walk over `broader`.
 *
 * ── INCLUSIVE, AND THAT IS LOAD-BEARING FOR NOTE ────────────────────────────
 *
 * `Note` is both a branch and a genre documents actually carry — two published documents
 * are tagged with it directly, alongside the ones tagged Clipping or Book Note. An
 * exclusive walk would return the two children and silently drop the two documents tagged
 * with the parent.
 *
 * ── THE `seen` SET IS A CYCLE GUARD, NOT AN OPTIMISATION ────────────────────
 *
 * SKOS does not forbid a concept being its own ancestor, and the Studio does not prevent
 * it. Without the guard a mis-authored loop is an infinite walk at build time, which fails
 * as a hang rather than as an error. It also handles poly-hierarchy — a concept with two
 * parents inside the same subtree is visited once.
 */
function subtree(concepts: Concept[], rootId: string): Set<string> {
  const childrenOf = new Map<string, string[]>()
  for (const concept of concepts) {
    for (const parent of concept.broader ?? []) {
      const siblings = childrenOf.get(parent)
      if (siblings) siblings.push(concept._id)
      else childrenOf.set(parent, [concept._id])
    }
  }

  const seen = new Set<string>([rootId])
  const queue = [rootId]
  while (queue.length > 0) {
    const id = queue.shift()!
    for (const child of childrenOf.get(id) ?? []) {
      if (seen.has(child)) continue
      seen.add(child)
      queue.push(child)
    }
  }
  return seen
}

export interface GenrePartition {
  /** Document's subtree minus Note's — Perspective, Method, Case Study, Conference Themes. */
  articleGenres: string[]
  /** Note's subtree, inclusive — Note, Web Clipping, Book Note. */
  noteGenres: string[]
  /**
   * The whole Document subtree, for the Topics band's Genres list.
   *
   * It INCLUDES the Document top concept itself, which is not a genre anything is tagged
   * with — CLAUDE.md records that content is never tagged at a top concept. Rather than
   * special-case it out here, the band filters on "has content", which removes it for the
   * reason it should be removed: nothing carries it. If that ever stops being true the
   * band would start showing it, and that would be correct.
   */
  documentGenres: string[]
}

/**
 * A genre's plural, for a heading that labels a group rather than one document.
 *
 * ── A RULE, NOT A MAP, AND NOT `altLabel` ──────────────────────────────────
 *
 * Three cases cover the whole vocabulary: a label already ending in `s` is left alone
 * ("Conference Themes"), a consonant followed by `y` becomes `ies` ("Case Study" ->
 * "Case Studies"), and everything else takes an `s`. Verified against all seven genres in
 * use and against the five Presentation-branch genres waiting for their type — Keynotes,
 * Talks, Workshops, Panels, Interviews all come out right.
 *
 * `altLabel` was the obvious alternative, since SKOS has a field for exactly this and two
 * concepts already carry the plural there. It is not used: only two of seven have one, so
 * it would be a rule with five exceptions, and CLAUDE.md earmarks altLabel as the URL
 * ALIAS mechanism. An altLabel added later for search — "How-to" on Method, say — would
 * silently become a heading.
 *
 * If an irregular genre ever arrives ("Analysis" -> "Analyses"), this is where it goes,
 * and a dedicated plural field on the concept would be the honest fix rather than
 * overloading altLabel.
 */
export function pluralizeGenre(label: string): string {
  if (/s$/i.test(label)) return label
  if (/[^aeiou]y$/i.test(label)) return `${label.slice(0, -1)}ies`
  return `${label}s`
}

/**
 * Split the Genre scheme's Document branch into the band's two lists.
 *
 * ── ARTICLES ARE A SUBTRACTION, WHICH IS WHY NEITHER LIST IS ENUMERATED ─────
 *
 * "Everything under Document that is not under Note" is Andy's rule stated directly
 * (2026-09-03), and expressing it as a subtraction rather than as a list of four genre
 * names is the whole point: a genre added under Document joins Articles, one added under
 * Note joins Notes, and neither needs a code change. Today that resolves to 4 and 3.
 *
 * ── IT THROWS RATHER THAN RETURNING NOTHING ─────────────────────────────────
 *
 * A renamed scheme or top concept would otherwise produce two empty arrays, a query that
 * matches nothing, and a Home page that silently loses its Insights band — the failure
 * looking exactly like "there is no content yet". Failing the build names the cause at the
 * moment it is introduced. Both strings are prefLabels an editor can change in the Studio,
 * which is precisely why the failure has to be loud.
 */
export function partitionGenres(tree: Tree): GenrePartition {
  const documentTop = tree.topConcepts?.find((c) => c.prefLabel === DOCUMENT)
  if (!documentTop) {
    throw new Error(
      `Genre scheme has no "${DOCUMENT}" top concept — the Home Insights band cannot be built. ` +
        `Found: ${(tree.topConcepts ?? []).map((c) => c.prefLabel).join(', ') || 'none'}.`,
    )
  }

  const note = tree.concepts.find((c) => c.prefLabel === NOTE)
  if (!note) {
    throw new Error(`Genre scheme has no "${NOTE}" concept — the Insights band cannot be split.`)
  }

  const documentIds = subtree(tree.concepts, documentTop._id)
  const noteIds = subtree(tree.concepts, note._id)

  return {
    articleGenres: [...documentIds].filter((id) => !noteIds.has(id)),
    noteGenres: [...noteIds],
    documentGenres: [...documentIds],
  }
}
