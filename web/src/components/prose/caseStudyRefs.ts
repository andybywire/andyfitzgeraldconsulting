/**
 * Groups each run of case study cards into one list, before anything renders.
 *
 * ── WHY THIS IS A PASS OVER THE ARRAY AND NOT A SERIALIZER ───────────────────
 *
 * A run of `caseStudyRef` blocks is a SET — "Structure, Labeling, and Search Case Studies"
 * followed by two of them — and it renders as one `<ul>`, so a screen reader announces
 * "list, 2 items" before the first card (Andy, 2026-10-23). Stored, they are separate
 * blocks with nothing around them, and no serializer can wrap its neighbors: a block
 * component receives only `node`, `index` and `isInline`. So this runs first and replaces
 * each run with a single synthetic `caseStudyRefList` node, the same arrangement as
 * quotations.ts — and as Portable Text's own lists, which `nestLists` groups for the same
 * reason.
 *
 * The list is also what keeps the card-to-card gap out of base.css. The rhythm ramp sees
 * one block, and the 16px between cards is the list's own business, inside its component.
 *
 * ── THE RULE ─────────────────────────────────────────────────────────────────
 *
 * ADJACENT `caseStudyRef` blocks become one list. A lone card becomes a list of one, which
 * is still true and keeps the component to one shape.
 *
 * Anything between two cards ends the run — including an EMPTY paragraph, the likely one.
 * That renders as two lists with an empty paragraph between them: every card still right,
 * the gap a little larger. Not worth special-casing until it happens; quotations.ts treats
 * an empty paragraph the same way.
 *
 * ── `_type` IS SAFE TO COMPARE IN PREVIEW ────────────────────────────────────
 *
 * The preview build stega-encodes query strings (see load-query.ts), which breaks equality
 * on most of them. Keys beginning with `_` are never encoded, so this test holds in both
 * builds.
 *
 * ── STRUCTURAL, AND IT NEVER MUTATES ─────────────────────────────────────────
 *
 * Generic over the block type, like groupQuotations, so it composes after it. Unlike that
 * pass it has one caller: feeds do not render `page` bodies, the only field offering the
 * type. If an article body ever does, lib/feed-html.ts will need it too.
 */
import type {TypedObject} from 'astro-portabletext/types'

export interface CaseStudyRefList<T extends TypedObject = TypedObject> {
  _type: 'caseStudyRefList'
  _key: string
  /** One or more `caseStudyRef` blocks, in order. */
  items: T[]
}

export function groupCaseStudyRefs<T extends TypedObject>(
  blocks: readonly T[],
): Array<T | CaseStudyRefList<T>> {
  const out: Array<T | CaseStudyRefList<T>> = []
  let run: T[] = []

  const flush = () => {
    if (run.length === 0) return
    /* The first card's key, so the list is identified by where it starts — the same
       convention as a quotation. */
    out.push({_type: 'caseStudyRefList', _key: run[0]._key ?? '', items: run})
    run = []
  }

  for (const block of blocks) {
    if (block._type === 'caseStudyRef') {
      run.push(block)
      continue
    }
    flush()
    out.push(block)
  }

  flush()
  return out
}
