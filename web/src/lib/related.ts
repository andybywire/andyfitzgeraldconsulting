/**
 * Related-content ranking.
 *
 * Kept out of GROQ deliberately. The joins belong in the query — and they are there, in
 * RELATED_POOL_QUERY — but the SCORING is a formula with a rationale, and a formula is
 * worth having somewhere it can be read, argued with and tested. Expressing a Jaccard
 * ratio and a three-way ancestor comparison in GROQ would hide both.
 *
 * ── THE RULE: NEAREST COMMON ANCESTOR, NEVER A TOP CONCEPT ───────────────────
 *
 * Two topics are related by how close they sit in the Topic tree, and the tiers are one
 * rule rather than three (Andy, 2026-09-01):
 *
 *   | relationship                      | nearest common ancestor | tier      |
 *   | same tag                          | the tag itself          | shared    |
 *   | one tag is the parent of the other| the parent tag          | nearer    |
 *   | two tags share a parent           | that shared parent      | sibling   |
 *   | two mid tags under one top        | A TOP CONCEPT           | EXCLUDED  |
 *
 * The exclusion is the point of the rule rather than a clause bolted onto it. Content is
 * tagged at mid and leaf level, so two mid tags always share a top concept — "both are
 * somewhere under Engineering" is not relatedness, and 14 of 45 documents carry a mid-level
 * tag, so this is a live case rather than a hypothetical.
 *
 * `nearer` OUTRANKS `sibling` because it is one hop rather than two, and the semantics
 * agree with the arithmetic: a document tagged *Accessibility Evaluation* is INSIDE my
 * *Evaluation*, where one tagged *Performance Evaluation* is merely BESIDE it. It is also
 * symmetric — my leaf finds your mid exactly as your mid finds my leaf, which a
 * one-directional "look at my children" rule would miss half of.
 *
 * ── WHY THE SCORES ARE RATIOS ────────────────────────────────────────────────
 *
 * Andy's formulation: two documents with two tags each, sharing both, are more related than
 * two documents with ten tags each sharing two. So every count is divided by the size of
 * the union — relatedness relative to how much was on offer. Normalising the two weaker
 * tiers the same way keeps a nine-tag document from winning on volume alone.
 *
 * ── ORDERING IS LEXICOGRAPHIC, WHICH IS WHAT "MORE WEIGHT" MEANS ─────────────
 *
 * Sort by shared, then nearer, then sibling, then date. Any candidate with a shared tag
 * outranks every candidate without one, no matter how many sibling hits it accumulates —
 * which is "shared tags carry more weight than sibling tags" stated exactly, and avoids
 * inventing weights whose relative size would be arbitrary.
 */

export type RelatedTopic = {
  _id: string | null
  parent?: string | null
  parentIsTop?: boolean | null
}

/** The shape the ranker needs. Card fields ride along untouched. */
export type RelatedCandidate = {
  _id: string
  genreId?: string | null
  pubDate?: string | null
  topics?: (RelatedTopic | null)[] | null
}

export type GenreConcept = {_id: string | null; prefLabel: string | null; parent?: string | null}
export type GenreTops = {_id: string | null; prefLabel: string | null}

/** Which branch of the Genre tree a page's related list may draw from. */
export type Branch = 'document' | 'note' | 'presentation'

/**
 * The Sanity type a page is built from decides its branch. Genre then does the filtering,
 * and it is not redundant with the type: four documents stored as `article` carry a
 * Presentation genre (they are interviews awaiting the `presentation` type), and genre is
 * what keeps them out of an article's related list.
 */
export function branchForType(type: string): Branch {
  if (type === 'note') return 'note'
  if (type === 'presentation') return 'presentation'
  return 'document'
}

/**
 * The genre ids eligible for a branch.
 *
 * ── THE ONE PLACE A LABEL IS LOAD-BEARING ────────────────────────────────────
 *
 * "Document", "Presentation" and "Note" are matched by `prefLabel`, because the rule itself
 * is stated in terms of those named concepts and the tree offers nothing else to key on —
 * "the Document child that happens to have children" would identify Note today and break
 * the day Case Study gains a narrower concept.
 *
 * So renaming one of those three in the Genre scheme silently empties a pool, and the page
 * would fall back to "Recent" everywhere while looking entirely plausible. It THROWS
 * instead: a build that cannot resolve the vocabulary should fail, not quietly degrade.
 */
export function genresForBranch(
  branch: Branch,
  tops: (GenreTops | null)[] | null | undefined,
  concepts: (GenreConcept | null)[] | null | undefined,
): Set<string> {
  const allTops = (tops ?? []).filter(Boolean) as GenreTops[]
  const all = (concepts ?? []).filter(Boolean) as GenreConcept[]

  const topId = (label: string) => allTops.find((t) => t.prefLabel === label)?._id
  const conceptId = (label: string) => all.find((c) => c.prefLabel === label)?._id

  const documentId = topId('Document')
  const presentationId = topId('Presentation')
  const noteId = conceptId('Note')

  if (!documentId || !presentationId || !noteId) {
    throw new Error(
      '[related] the Genre scheme is missing one of "Document", "Presentation" or "Note". ' +
        'Related-content pools are derived from those three concepts by prefLabel — see ' +
        'genresForBranch. Renaming one requires updating this function.',
    )
  }

  /* The Note subtree is Note plus anything whose parent is Note. Two levels is all the
     scheme has, and a deeper Note branch would want a real ancestor walk. */
  const noteBranch = new Set<string>([noteId])
  for (const c of all) if (c.parent === noteId && c._id) noteBranch.add(c._id)

  if (branch === 'note') return noteBranch

  const wanted = branch === 'presentation' ? presentationId : documentId
  const ids = new Set<string>()
  for (const c of all) {
    if (!c._id || c.parent !== wanted) continue
    /* An article's pool is the Document branch MINUS the Note subtree. Clipping and Book
       Note are excluded by their parent already; Note itself has to be named. */
    if (branch === 'document' && noteBranch.has(c._id)) continue
    ids.add(c._id)
  }
  return ids
}

type Scored<T> = {item: T; shared: number; nearer: number; sibling: number}

/**
 * Counts the three kinds of overlap between two topic sets.
 *
 * Every pair is examined rather than short-circuiting, because one document can relate to
 * another in more than one way at once — a shared tag AND a sibling tag — and the tiers are
 * sorted independently.
 */
function compare(mine: RelatedTopic[], theirs: RelatedTopic[]) {
  const mineIds = new Set(mine.map((t) => t._id).filter(Boolean) as string[])
  const theirIds = new Set(theirs.map((t) => t._id).filter(Boolean) as string[])
  const union = new Set([...mineIds, ...theirIds]).size || 1

  let shared = 0
  let nearer = 0
  let sibling = 0

  for (const a of mine) {
    for (const b of theirs) {
      if (!a._id || !b._id) continue

      if (a._id === b._id) {
        shared++
        continue
      }

      /* One hop: either tag is the other's parent. */
      if (a.parent === b._id || b.parent === a._id) {
        nearer++
        continue
      }

      /* Two hops, and only where the shared parent is specific enough to mean something.
         `parentIsTop` on either side disqualifies the pair — that is the mid-versus-mid
         case the whole rule exists to exclude. */
      if (a.parent && a.parent === b.parent && !a.parentIsTop && !b.parentIsTop) {
        sibling++
      }
    }
  }

  return {shared: shared / union, nearer: nearer / union, sibling: sibling / union}
}

export type RankedRelated<T> = {
  /** Up to `limit` items. Empty only when nothing in the pool scored at all. */
  items: T[]
  /** True when nothing scored, so the band shows recent content under a changed heading. */
  isFallback: boolean
}

/**
 * Rank a pool against one document.
 *
 * The pool arrives newest-first from GROQ, and every sort below is stable, so publication
 * date is the tie-break at every level without being compared explicitly.
 */
export function rankRelated<T extends RelatedCandidate>(
  current: {_id: string; topics?: (RelatedTopic | null)[] | null},
  pool: T[],
  eligibleGenres: Set<string>,
  limit = 3,
): RankedRelated<T> {
  const mine = ((current.topics ?? []).filter(Boolean) as RelatedTopic[]).filter((t) => t._id)

  /* Self is never its own related content, and a document whose genre sits outside the
     branch is not eligible — including one with no genre at all. */
  const candidates = pool.filter(
    (c) => c._id !== current._id && c.genreId && eligibleGenres.has(c.genreId),
  )

  const scored: Scored<T>[] = []
  for (const candidate of candidates) {
    const theirs = (candidate.topics ?? []).filter(Boolean) as RelatedTopic[]
    if (!mine.length || !theirs.length) continue

    const {shared, nearer, sibling} = compare(mine, theirs)
    if (shared || nearer || sibling) scored.push({item: candidate, shared, nearer, sibling})
  }

  scored.sort((a, b) => b.shared - a.shared || b.nearer - a.nearer || b.sibling - a.sibling)

  if (scored.length) return {items: scored.slice(0, limit).map((s) => s.item), isFallback: false}

  /* Nothing matched on any tier. Measured on the current corpus this never happens — the
     thinnest document, `who-kap`, has no shared tags and five sibling matches — so this is
     a guard for a newly published document with an unusual tag rather than a live path. */
  return {items: candidates.slice(0, limit), isFallback: true}
}
