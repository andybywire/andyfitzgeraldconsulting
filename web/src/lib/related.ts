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

import {stegaClean} from '@sanity/client/stega'
/* The `.ts` extension is deliberate, and the only one in src/ outside the tests. The tests and
   the recommendations research (docs/recommendations-research/) run this file under plain
   Node, whose type stripping resolves no extensionless paths. Astro's tsconfig allows it
   (allowImportingTsExtensions). */
import {subtree} from './genres.ts'

export type RelatedTopic = {
  _id: string | null
  parent?: string | null
  parentIsTop?: boolean | null
  /** How strongly the document matches this tag, on the tagger's anchored scale: its
      `topicScores` entry. Only read when a rule breaks ties by tag strength. */
  score?: number | null
}

/** The shape the ranker needs. Card fields ride along untouched. */
export type RelatedCandidate = {
  _id: string
  genreId?: string | null
  pubDate?: string | null
  topics?: (RelatedTopic | null)[] | null
}

export type GenreConcept = {
  _id: string | null
  prefLabel: string | null
  broader?: (string | null)[] | null
}
export type GenreTops = {_id: string | null; prefLabel: string | null}

/**
 * The three ratios rank; `sharedCount` is the raw number behind `shared`, for the crossing rule.
 * `sameGenre` and `strength` break ties when a rule asks (see TIES, above rankAcross), and are
 * 0 otherwise, which leaves the pool's newest-first order to decide.
 */
type Scored<T> = {
  item: T
  shared: number
  nearer: number
  sibling: number
  sharedCount: number
  sameGenre: number
  strength: number
}

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
  /* For each shared concept, the weaker of the two documents' scores on it: how strongly BOTH
     are about what they share. Untagged scores count nothing. */
  let strength = 0

  for (const a of mine) {
    for (const b of theirs) {
      if (!a._id || !b._id) continue

      if (a._id === b._id) {
        shared++
        if (typeof a.score === 'number' && typeof b.score === 'number') {
          strength += Math.min(a.score, b.score)
        }
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

  return {
    shared: shared / union,
    nearer: nearer / union,
    sibling: sibling / union,
    sharedCount: shared,
    strength,
  }
}

/** Shared before nearer before sibling: the lexicographic order the header explains. Then,
    only under a tie-breaking rule, same genre before strength; otherwise those are 0. */
const byTiers = (a: Scored<unknown>, b: Scored<unknown>) =>
  b.shared - a.shared ||
  b.nearer - a.nearer ||
  b.sibling - a.sibling ||
  b.sameGenre - a.sameGenre ||
  b.strength - a.strength

/**
 * Score every candidate against `mine`, keep those that relate on any tier, best first.
 * The sort is stable, so candidates that tie keep the pool's newest-first order. Given `tie`,
 * candidates of the page's own genre, then those sharing concepts more strongly, come first
 * among those that tie on every tier.
 */
function scoreCandidates<T extends RelatedCandidate>(
  mine: RelatedTopic[],
  candidates: T[],
  tie: {genreId: string | null} | null = null,
) {
  const scored: Scored<T>[] = []
  for (const candidate of candidates) {
    const theirs = (candidate.topics ?? []).filter(Boolean) as RelatedTopic[]
    if (!mine.length || !theirs.length) continue

    const {shared, nearer, sibling, sharedCount, strength} = compare(mine, theirs)
    if (shared || nearer || sibling) {
      scored.push({
        item: candidate,
        shared,
        nearer,
        sibling,
        sharedCount,
        sameGenre: tie && tie.genreId && candidate.genreId === tie.genreId ? 1 : 0,
        strength: tie ? strength : 0,
      })
    }
  }
  return scored.sort(byTiers)
}

/*
 * ══ CROSS-CATEGORY RANKING (2026-10-27) ═════════════════════════════════════
 *
 * Both detail pages' rule since 2026-11-23. Specified in docs/recommendations-research/plan.md
 * → Cross-category ranking; decided by Andy on 2026-10-22.
 *
 * It replaced the BRANCH RULE, which kept an article's list to articles, a note's to notes and
 * a presentation's to presentations, by three genre branches resolved from three labels. The
 * two were built side by side while the research ran, so the pages kept building; the branch
 * rule was removed once they moved over, and is in git history, last at `b4e85bd`.
 *
 * ── TWO CATEGORIES, AND THEY ARE THE GENRE SCHEME'S TWO TOP CONCEPTS ─────────
 *
 * Insights is everything under Document, notes included, so a note and an article can now
 * relate where the branch rule kept them apart. Presentations is everything under
 * Presentation. Each is a whole subtree, walked by lib/genres.ts's `subtree` to any depth.
 * The branch rule's two-level Note walk, and its third load-bearing label, are gone with it.
 *
 * ── HOME FIRST, AND CROSSING ONLY ON A STRONG MATCH ──────────────────────────
 *
 * A page ranks its own category exactly as before. A document from the other category may
 * then take a card only if:
 *   - it shares a tag. "Nearer" and "sibling" never cross: crossing is for documents about
 *     the same thing, and a neighbouring topic is not that;
 *   - its shared ratio reaches `crossMinShared`;
 *   - it shares at least `crossMinCount` tags. The ratio alone let ONE shared tag between two
 *     thinly tagged documents count as strong: on the hand tags, at a ratio of 0.5, requiring
 *     two removed 6 of 32 crossings (Andy, 2026-10-27);
 *   - it STRICTLY outranks the home card it would replace. A tie keeps the home card, which
 *     is what "prefer the page's own category" means;
 *   - fewer than `crossMax` cards have crossed already.
 * If the home category fills fewer than `limit` cards, a strong cross match fills the gap
 * without having to displace anything.
 *
 * The result says how many cards crossed, for the research's dry runs. The band does not
 * read it: it names its heading from the cards' own types, so "Related Insights &
 * Presentations" cannot appear over a list that holds no presentation.
 */

/** The two related-content categories. Each is a Genre top concept and everything below it. */
export type Category = 'insights' | 'presentations'

const TOP_FOR: Record<Category, string> = {insights: 'Document', presentations: 'Presentation'}

/** Which category a page's own document belongs to, by its Sanity type. */
export function categoryForType(type: string): Category {
  return type === 'presentation' ? 'presentations' : 'insights'
}

/**
 * The genre ids in each category.
 *
 * ── THE ONE PLACE A LABEL IS LOAD-BEARING ────────────────────────────────────
 *
 * "Document" and "Presentation" are matched by `prefLabel`, because the rule itself is stated
 * in terms of those named concepts and the tree offers nothing else to key on: they are the
 * Genre scheme's two top concepts, and nothing marks which is which.
 *
 * So renaming one in the Studio would silently empty a category, and every page in it would
 * fall back to "Recent" while looking entirely plausible. It THROWS instead: a build that
 * cannot resolve the vocabulary should fail, not quietly degrade. The branch rule this
 * replaced matched a third label, "Note", which the two-category rule no longer needs.
 */
export function genresByCategory(
  tops: (GenreTops | null)[] | null | undefined,
  concepts: (GenreConcept | null)[] | null | undefined,
): Record<Category, Set<string>> {
  const allTops = (tops ?? []).filter(Boolean) as GenreTops[]
  const all = (concepts ?? []).filter(Boolean) as GenreConcept[]

  /* stegaClean: preview encodes this label — see STEGA AND LOGIC in sanity/load-query.ts. */
  const topId = (label: string) => allTops.find((t) => stegaClean(t.prefLabel) === label)?._id

  const result = {} as Record<Category, Set<string>>
  for (const category of Object.keys(TOP_FOR) as Category[]) {
    const id = topId(TOP_FOR[category])
    if (!id) {
      throw new Error(
        `[related] the Genre scheme has no "${TOP_FOR[category]}" top concept. Related-content ` +
          'categories are the subtrees of the two top concepts, found by prefLabel — see ' +
          'genresByCategory.',
      )
    }
    result[category] = subtree(all, id)
  }
  return result
}

/** How readily a page's list crosses into the other category. */
export type CrossRule = {crossMinShared: number; crossMinCount: number; crossMax: number}

/**
 * The crossing rule both detail pages use: at least two shared tags, a shared ratio of at
 * least 0.5, and at most one card from the other category. RANK_RULE, below, adds the
 * tie-break, and is what the pages pass.
 *
 * ── SETTLED BY THE RESEARCH, WHICH ARRIVED AT THESE VALUES SEPARATELY ────────
 *
 * They were set here on 2026-10-27 as a provisional default, and this comment called them that
 * until stream 2 wired the pages to them (2026-11-23). The research ranked under its own rule,
 * held fixed so that a change between columns came from the tags:
 *   - `TAXONOMY_CROSS` (0.40, 3, 1) through v2, calibrated on tag set v0 (Andy, 2026-10-28).
 *     By v2, 45 of 73 documents carried exactly three tags, so three shared tags had come to
 *     mean IDENTICAL tag sets, and only 14 pages crossed.
 *   - `TAXONOMY_CROSS_RELAXED` (0.50, 2, 1) from v3 (Andy, 2026-11-05; plan.md → Phase 3b),
 *     which crossed on 34 pages of v2's tags. Every list Andy judged from M3.3 on was ranked
 *     under it, and it equals these values, so nothing here moved at promotion.
 *
 * The ratio has a cliff just above 0.5: two of three tags shared is exactly 0.50, and at 0.60
 * crossings fell to 9. The hand tags, with two to four a document, could not calibrate it at all.
 *
 * Tuning a value here changes what the golden test's snapshot records
 * (related.golden.test.ts), which is how the change gets reviewed, page by page.
 */
export const CROSS_RULE: CrossRule = {crossMinShared: 0.5, crossMinCount: 2, crossMax: 1}

/*
 * ── TIES: GENRE, THEN TAG STRENGTH, BEFORE DATE (research, 2026-11-06) ───────
 *
 * Candidates that tie on every tier keep the pool's order, which is newest first. Andy's
 * objection: recency is arbitrary as an ordering, and it shuts out older pieces that are just
 * as relevant. On the research's v3 tags it decides a lot: reversing the date order changes 24
 * of 73 lists.
 *
 * `tieBreak: 'genre-strength'` puts two things ahead of the date:
 *   - SAME GENRE: a case study before a talk on a case study's page. In M3.3 Andy kept the
 *     case-study neighbors whenever a cross card displaced one.
 *   - TAG STRENGTH: for each shared concept, the weaker of the two documents' scores on it,
 *     summed. Two pieces strongly about what they share outrank two that brush it. It reads
 *     only the scores of each document's own tags, as `topicScores`, so it adds no queries.
 *     Those scores arrive with the tagger in stream 3. Until then no topic carries one, and
 *     strength adds nothing: `compare` counts it only when both documents have a score.
 * The date still decides what neither separates, and orders the fallback within a genre.
 *
 * Measured against Andy's M3.3 picks, it moved 3 lists closer to them and none further. M3.4
 * then judged it: v4, the first tag set ranked under it, won 10 of the 16 pages where it showed
 * something new. Absent, the pool's newest-first order breaks every tie, as it always did.
 */
export type RankRule = CrossRule & {tieBreak?: 'genre-strength'}

/**
 * The rule both detail pages rank under: CROSS_RULE, with ties broken by genre, then tag
 * strength, before date.
 *
 * ONE value for both pages, rather than each spreading its own: they are its two consumers,
 * and a second consumer is this project's trigger for a shared value. The golden test reads it
 * too, so its snapshot is ranked under exactly what the pages run.
 *
 * Until stream 3's scores, ties break by genre, then date. That is a variation on M3.5's v5,
 * which ranked with scores: 19 of 73 lists differ, 12 by one card, and against Andy's picks it
 * shows the chosen list on 39 pages where v5 showed it on 40. Andy reviewed the 12 and
 * accepted them (2026-11-21; docs/recommendations-research/stream-2-ranker.md → piece 3).
 */
export const RANK_RULE: RankRule = {...CROSS_RULE, tieBreak: 'genre-strength'}

export type RankedAcross<T> = {
  /** Up to `limit` items. Empty only when the page's category holds no other document. */
  items: T[]
  /** True when nothing related, so the band shows the newest from home under "Recent". */
  isFallback: boolean
  /** How many of `items` came from the other category. 0 on a fallback. */
  crossed: number
}

/**
 * Rank a pool against one document: its own category first, the other on a strong match.
 *
 * The pool arrives newest-first from GROQ, and every sort below is stable, so publication date
 * is the last tie-break at every level without being compared explicitly. That is the
 * ranker's only notion of date: it never reads `pubDate`.
 */
export function rankAcross<T extends RelatedCandidate>(
  current: {
    _id: string
    type: string
    genreId?: string | null
    topics?: (RelatedTopic | null)[] | null
  },
  pool: T[],
  genres: Record<Category, Set<string>>,
  rule: RankRule,
  limit = 3,
): RankedAcross<T> {
  const tie = rule.tieBreak === 'genre-strength' ? {genreId: current.genreId ?? null} : null
  const mine = ((current.topics ?? []).filter(Boolean) as RelatedTopic[]).filter((t) => t._id)
  const home = categoryForType(current.type)
  const other: Category = home === 'insights' ? 'presentations' : 'insights'

  /* Self is never its own related content, and a document with no genre is in no category. */
  const inCategory = (category: Category) =>
    pool.filter((c) => c._id !== current._id && c.genreId && genres[category].has(c.genreId))
  const homeCandidates = inCategory(home)

  const list = scoreCandidates(mine, homeCandidates, tie).slice(0, limit)
  /* At least one shared tag whatever the rule says: nearer and sibling never cross. */
  const strong = scoreCandidates(mine, inCategory(other), tie).filter(
    (s) => s.sharedCount >= Math.max(1, rule.crossMinCount) && s.shared >= rule.crossMinShared,
  )

  let crossed = 0
  for (const candidate of strong) {
    if (crossed >= rule.crossMax) break
    if (list.length < limit) {
      list.push(candidate)
    } else if (byTiers(candidate, list[list.length - 1]) < 0) {
      list[list.length - 1] = candidate
    } else {
      /* `strong` is sorted best first, so if this one cannot displace, none after it can. */
      break
    }
    crossed++
    /* Stable, so a cross card that ties a home card on every tier sorts after it. */
    list.sort(byTiers)
  }

  if (list.length) return {items: list.map((s) => s.item), isFallback: false, crossed}

  /* Nothing related in either category: the newest from home, and under a tie-breaking rule the
     page's own genre first. Stable, so the date still orders each genre. */
  const fallback = tie
    ? [...homeCandidates].sort(
        (a, b) => Number(b.genreId === tie.genreId) - Number(a.genreId === tie.genreId),
      )
    : homeCandidates
  return {items: fallback.slice(0, limit), isFallback: true, crossed: 0}
}
