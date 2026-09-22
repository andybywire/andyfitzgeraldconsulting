/**
 * Pairs each attributed quote with its attribution, before anything renders.
 *
 * ── WHY THIS IS A PASS OVER THE ARRAY AND NOT A SERIALIZER ───────────────────
 *
 * The `attribution` style (studio-next/schemas/portableText.ts) credits the Quote block
 * directly above it, and the pair renders as one `<figure>`: the quote in a
 * `<blockquote>`, the credit in its `<figcaption>`. That is the WHATWG pattern for a
 * quotation with a source, and the one the Reviews page builds by hand.
 *
 * No serializer can produce it. A block component receives only `node`, `index` and
 * `isInline` — it cannot see its neighbors, so a Quote block cannot know that an
 * attribution follows it, and the attribution cannot reach back and wrap the quote.
 * Only something that holds the WHOLE array can. So this runs first and replaces each
 * attributed run with a single synthetic node, and the serializers only ever see a
 * node they can render on its own. Portable Text's lists are grouped the same way, by
 * `nestLists`, for the same reason.
 *
 * ── THE RULE ─────────────────────────────────────────────────────────────────
 *
 * A run of consecutive Quote blocks IMMEDIATELY followed by an attribution becomes one
 * `quotation`. A run, not the single block above, because a multi-paragraph quote is
 * stored as one Quote block per paragraph — and it becomes ONE `<blockquote>` holding
 * those paragraphs, where today each would be a `<blockquote>` of its own.
 *
 * Everything else passes through untouched, and that is load-bearing: a Quote with no
 * attribution after it renders exactly as it did before this module existed. Only one
 * run of adjacent Quote blocks exists in the corpus (two separate one-line quotes in a
 * transcript; measured 2026-09-22) and no attribution follows it, so nothing already
 * published changes.
 *
 * ── AN ORPHAN IS RENDERED, NOT DROPPED ───────────────────────────────────────
 *
 * An attribution with anything between it and a Quote — a paragraph, a heading, an
 * EMPTY paragraph, which is the likely one — has nothing to credit. It is restyled to
 * `normal` so it renders as an ordinary paragraph, and a warning names it. Dropping it
 * would lose content without a trace; letting it fall through to the serializers'
 * unknown-style fallback would render the same paragraph with a less useful warning.
 *
 * The warning quotes the text rather than a document id, because this function is
 * handed an array and never knows which document it came from.
 *
 * ── STRUCTURAL, LIKE headingId.ts ────────────────────────────────────────────
 *
 * Two callers, two renderers: Prose.astro (astro-portabletext) and lib/feed-html.ts
 * (@portabletext/to-html). Both hold `TypedObject[]`, and nothing here depends on
 * either library. It never mutates what it is given — astro-portabletext writes to
 * the nodes it renders, so a shared object is a shared hazard.
 */
import type {TypedObject} from 'astro-portabletext/types'
import {headingText} from './headingId'

export interface Quotation<T extends TypedObject = TypedObject> {
  _type: 'quotation'
  _key: string
  /** One or more Quote blocks, in order. At least one, always. */
  quote: T[]
  /** The block styled `attribution` that followed them. */
  attribution: T
}

/**
 * What precedes every attribution, written by the renderer so the author types only the
 * name (Andy, 2026-09-22). An en dash and a space — the same pair reviews.astro writes
 * before a byline, and NOT the em dash an author tends to reach for, which is how the
 * first real use came out as `– — Phil Coady`.
 *
 * Here rather than in either renderer because both must write the same thing: the
 * site's Quotation.astro and the feeds' lib/feed-html.ts.
 */
export const ATTRIBUTION_DASH = '– '

const styleOf = (node: TypedObject): unknown =>
  node._type === 'block' && 'style' in node ? node.style : undefined

export function groupQuotations<T extends TypedObject>(
  blocks: readonly T[],
): Array<T | Quotation<T>> {
  const out: Array<T | Quotation<T>> = []
  let run: T[] = []

  for (const block of blocks) {
    const style = styleOf(block)

    if (style === 'blockquote') {
      run.push(block)
      continue
    }

    if (style === 'attribution') {
      if (run.length > 0) {
        out.push({
          _type: 'quotation',
          /* The first quote block's key, so the node is identified by where it starts.
             Sanity always writes `_key` on an array member; the fallback only keeps the
             type honest against astro-portabletext's optional one. */
          _key: run[0]._key ?? block._key ?? '',
          quote: run,
          attribution: block,
        })
        run = []
      } else {
        /* `headingText` is the plain-text join of a block's spans. It is named for its
           first caller and works on any text block. */
        console.warn(
          `[quotations] An attribution with no Quote directly above it renders as a paragraph: "${headingText(block)}" (_key ${block._key ?? 'none'})`,
        )
        out.push({...block, style: 'normal'})
      }
      continue
    }

    out.push(...run, block)
    run = []
  }

  out.push(...run)
  return out
}
