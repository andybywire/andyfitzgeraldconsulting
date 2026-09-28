/**
 * A body h2's plain text and its fragment id.
 *
 * TWO CALLERS THAT MUST AGREE, which is the whole reason this is a module rather
 * than a line inside either of them: `Heading.astro` writes the `id` onto the
 * rendered h2, and the article page reads the same blocks to build the rail's "On
 * This Page" list. If the two computed ids differed, every link in that list would
 * point at nothing — and it would look fine on the page, because a fragment with no
 * target scrolls nowhere rather than erroring.
 *
 * PURE, and per block. Both callers see the same `bodyText` array, so the same
 * function over the same block gives the same answer with nothing passed between
 * them. That is what lets the serializer stay ignorant of the page.
 *
 * ── THE PARAMETER TYPE IS STRUCTURAL ON PURPOSE ──────────────────────────────
 *
 * The two callers hold the same block under two different type names. The page has
 * TypeGen's generated union, where a span is `{text?: string; _key: string; …}`;
 * `Heading.astro` has astro-portabletext's `Block`, whose children are
 * `PortableTextSpan | ArbitraryTypedObject` — and the latter's index signature
 * types every member `unknown`. Neither is assignable to the other, and importing
 * one here would make this module reject the other caller.
 *
 * So `children` is `readonly unknown[]` and the text is recovered by a runtime
 * check. Widening the type is not laziness here: an inline object inside a heading
 * is a real Portable Text shape that genuinely has no `text`, and the check is what
 * makes it contribute nothing rather than the string "undefined".
 *
 * `unknown[]` RATHER THAN `{text?: unknown}[]`, which was the first attempt and
 * which TypeScript rejects — a type whose properties are ALL optional is a "weak
 * type", and assignment to one requires at least one property in common. An
 * `ArbitraryTypedObject` reaches `text` only through its index signature, so it
 * shares no named property and the check fires. Narrowing per element sidesteps the
 * rule instead of arguing with it, and needs no cast.
 */
import {slugify} from '../../lib/slug'

export interface SluggableBlock {
  /** Optional because astro-portabletext types it so. Sanity always writes one. */
  _key?: string
  children?: readonly unknown[] | null
}

/** Every span's text, concatenated — the heading as a reader sees it. */
export function headingText(block: SluggableBlock): string {
  return (block.children ?? [])
    .map((child) =>
      child !== null &&
      typeof child === 'object' &&
      'text' in child &&
      typeof child.text === 'string'
        ? child.text
        : '',
    )
    .join('')
    .trim()
}

/**
 * The fragment id.
 *
 * ── NO DEDUPE, AND THAT IS A MEASURED CALL RATHER THAN AN OVERSIGHT ──────────
 *
 * Slugifying text can collide where slugifying an index cannot. Measured against
 * `production-26` on 2026-08-26: across all 42 insights, every document's count of
 * h2 blocks equals its count of DISTINCT h2 texts — so there is not one collision
 * in the corpus. 13 of the 42 have no h2 at all.
 *
 * Dedupe would also have to live here, and it cannot: a pure per-block function
 * has no view of its siblings. Adding it means both callers computing a Map over
 * the whole array, which is real machinery for a case the content does not have.
 *
 * THE FAILURE MODE IF IT EVER HAPPENS is that two headings carry the same id and
 * both rail links jump to the first. Degraded, not broken, and visible the moment
 * someone clicks. Duplicate ids are also invalid HTML, so the phase 8 HTML
 * validator is where this would surface — which is the right place for it.
 *
 * The `_key` fallback covers a heading whose text slugs to empty — punctuation
 * only, or a script outside Latin. `_key` is opaque in a URL, which is exactly
 * why it is the fallback and not the scheme: fragment URLs get shared.
 */
export function headingId(block: SluggableBlock): string {
  return slugify(headingText(block)) || `h-${block._key ?? ''}`
}

/** One entry in an in-page navigation list: a fragment target and its label. */
export interface HeadingLink {
  id: string
  label: string
}

/**
 * Every heading of one style in a Portable Text array, as fragment links.
 *
 * ── PROMOTED ON ITS THIRD CONSUMER ───────────────────────────────────────────
 *
 * The article page and the `page` template each wrote this `flatMap` inline for
 * their rail's "On This Page", and the Presentation transcript's table of
 * contents is the third — over `h3` rather than `h2`, which is the only thing
 * that ever varied between them. Two copies were tolerable; a third is this
 * project's stated trigger.
 *
 * It belongs beside `headingId` rather than in `lib/` because it is the same
 * agreement: `Heading.astro` writes these ids onto the rendered headings and
 * this builds the list that points at them. Both callers must compute the same
 * id from the same block, which is the reason that function is shared, and this
 * is simply the other half of it.
 *
 * ── `flatMap` OVER `filter().map()` ──────────────────────────────────────────
 *
 * It narrows and projects in one pass, so `block.style` is only read where
 * TypeScript has already established the block is a text block and not a
 * `figure`, `code` or `table` — the members of the generated union that carry no
 * `style` at all.
 *
 * ── THE PARAMETER TYPE IS STRUCTURAL, FOR THE REASON ABOVE ───────────────────
 *
 * Same argument as `SluggableBlock`: the callers hold these blocks under
 * different generated names, and importing any one of them here would reject the
 * others. `_type` is what every member of every union shares, which is also what
 * keeps this from tripping TypeScript's weak-type rule.
 *
 * ── AN EMPTY RESULT IS ORDINARY, NOT AN ERROR ────────────────────────────────
 *
 * 13 of 42 insights have no h2 at all, Contact has no body, and a transcript
 * with no h3s is exactly the case whose table of contents should not render. So
 * callers guard on `length` and omit the whole group rather than rendering an
 * empty heading.
 *
 * NO DEDUPE, inheriting `headingId`'s decision and its caveat — see that note.
 * The risk is higher here than it was for article h2s: transcript headings are
 * short and conversational, so a repeat is more plausible, and a collision would
 * point both links at the first one.
 */
export function headingLinks(
  blocks: readonly ({_type?: string; style?: string} & SluggableBlock)[] | null | undefined,
  style: 'h2' | 'h3',
): HeadingLink[] {
  return (blocks ?? []).flatMap((block) =>
    block._type === 'block' && block.style === style
      ? [{id: headingId(block), label: headingText(block)}]
      : [],
  )
}
