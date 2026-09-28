/**
 * Shared Portable Text editor configuration — the styles and marks that every
 * rich-text field in this schema draws from.
 *
 * ── WHY IT IS SHARED ─────────────────────────────────────────────────────────
 *
 * Eleven `block` definitions across five files declared these lists inline:
 * article (lede, body), caseStudy (atGlance, whatDid, projectGoal,
 * projectApproach, projectOutcome), review (two), singleton (two) and table
 * (one). Eleven copies is ten chances to drift, and the drift is invisible in
 * review — an editor simply finds a different toolbar in one field than another,
 * with nothing to say which is intended.
 *
 * The front end is the other half of the argument. Every one of these renders
 * through the same Portable Text serializers and the same `base.css` element
 * roles, so a style or decorator offered here that the front end has no rule for
 * ships as unstyled markup. Declaring the sets once makes "what can an editor
 * make" a single answerable question.
 *
 * ── UNDERLINE IS GONE, AND THAT IS THE POINT OF THE MODULE ───────────────────
 *
 * Sanity's default decorators are `strong`, `em`, `code`, `underline` and
 * `strike-through`, and most of these fields took that default by declaring no
 * `marks` at all. Underline is removed everywhere (2026-08-26):
 *
 *   > THE UNDERLINE SHOULD ONLY EVER MEAN "LINK".
 *
 * That is the rule this list enforces. An underlined word that is not a link is
 * indistinguishable from one that is — `base.css` gives every inline link a
 * persistent underline, and DESIGN.md makes that underline the whole affordance,
 * satisfying WCAG 1.4.1. A second meaning for the same mark breaks it.
 *
 * Two published articles carried underline and have been corrected. Removing the
 * button is what stops the next one — and note that removing it does NOT strip
 * the mark from existing content: Sanity keeps marks the schema no longer offers.
 *
 * ── `strike-through` IS KEPT, AND NOW HAS A TREATMENT ────────────────────────
 *
 * Kept deliberately (Andy's call, 2026-08-26) rather than removed alongside
 * underline. It is accounted for on the render side rather than left to the UA:
 * the serializer emits `<s>` and `base.css` gives it a rule. See
 * web-next/src/components/prose/Strike.astro.
 *
 * ── DECLARING `decorators` DOES NOT DROP THE LINK ANNOTATION ─────────────────
 *
 * Worth stating, because it looks like it should. `marks` has two independent
 * keys and the schema compiler falls back per key:
 *
 *     {name: 'markDefs', type: 'array', of: marks?.annotations || DEFAULT_ANNOTATIONS}
 *
 * — from `@sanity/schema`'s `BlockType.extend`. So overriding `decorators` leaves
 * `annotations` at its default of `[link]`, and the existing link markDefs across
 * 34 articles keep working. Verified in the compiler source rather than assumed,
 * because getting it wrong would have silently broken link editing everywhere.
 */

import {AttributionStyle} from './AttributionStyle'

/**
 * The credit line for a quote: who said it. Offered wherever Quote is, except review
 * bodies — see REVIEW_STYLES.
 *
 * ── THE TIE TO ITS QUOTE IS POSITIONAL ───────────────────────────────────────
 *
 * An attribution belongs to the Quote block (or run of Quote blocks) IMMEDIATELY above
 * it. Nothing in the data records that relationship; the front end infers it by
 * position and renders the pair as one `<figure>`, the quote in a `<blockquote>` and
 * this line in its `<figcaption>` — the same WHATWG pattern the Reviews page builds by
 * hand. See web-next/src/components/prose/quotations.ts.
 *
 * A style rather than a quote object with an attribution field (Andy, 2026-09-22),
 * because a style keeps authoring fluid, carries inline links — the existing credits
 * link to `/reviews/#slug` — and needs no migration of the quotes already written with
 * the Quote style. The cost is that the tie can be broken: an attribution with anything
 * between it and a quote, an empty paragraph included, is an ORPHAN. The build renders
 * an orphan as an ordinary paragraph, so nothing disappears, and warns naming it.
 *
 * ── TYPE THE NAME, NOT THE DASH ──────────────────────────────────────────────
 *
 * The front end supplies the leading en dash, as the Reviews page does (Andy, 2026-09-22).
 * An author who types one as well gets two — which is what the first real use did, and
 * why the editor now shows the renderer's dash in front of the line (AttributionStyle).
 */
const ATTRIBUTION = {title: 'Attribution', value: 'attribution', component: AttributionStyle}

/**
 * The heading range for long-form body fields: `h2` through `h4`, plus quote.
 *
 * ── `h1` IS DELIBERATELY ABSENT ──────────────────────────────────────────────
 *
 * Removed 2026-08-26. A page's title is already its `h1`, so a body `h1` gives the
 * document two — a document-outline problem rather than a style one. Nothing in
 * the 34 published articles used it, and the one place it appeared (the serializer
 * specimen, which existed to make the problem visible) has been corrected.
 *
 * So the body's headings start at `h2`, which is what the Figma Article board
 * draws and what the rhythm ramp in base.css is built around — `* + h2` takes
 * `rhythm-heading-major` on the premise that an h2 opens a section.
 *
 * `h5` and `h6` are absent for a different reason, settled earlier: phase 1
 * dropped them to match DESIGN.md, which defines roles for `h1`–`h4` only. The 27
 * `h5` blocks that survived that change have since been corrected in the data.
 */
export const BODY_STYLES = [
  {title: 'Normal', value: 'normal'},
  {title: 'H2', value: 'h2'},
  {title: 'H3', value: 'h3'},
  {title: 'H4', value: 'h4'},
  {title: 'Quote', value: 'blockquote'},
  ATTRIBUTION,
]

export const TRANSCRIPT_STYLES = [
  {title: 'Normal', value: 'normal'},
  {title: 'H3', value: 'h3'},
  {title: 'H4', value: 'h4'},
  {title: 'Quote', value: 'blockquote'},
  ATTRIBUTION,
]

/**
 * BODY_STYLES without Attribution — for the two review bodies, `body` and
 * `condensedBody`.
 *
 * A review body IS a quote: both the Reviews page and the case study testimonial wrap
 * it in a hand-built `<blockquote>` and build its attribution from structured fields
 * (`author`, `title`, `employer`). An Attribution block inside it would put a second
 * `<figure>` inside that outer quote, crediting someone within a credited quote.
 *
 * Derived by filter rather than listed, so it cannot drift from BODY_STYLES. Note it
 * still offers Quote, which has the same nesting problem and which no review uses —
 * whether a review body should offer Quote at all is open, and separate.
 */
export const REVIEW_STYLES = BODY_STYLES.filter(({value}) => value !== 'attribution')

/**
 * Paragraphs only — for fields that are one unit of prose rather than a document:
 * the article lede, a singleton's intro, a table cell. Sanity always prepends
 * `normal` if it is missing, so this is the minimum meaningful set rather than a
 * way of saying "no styles".
 */
export const PLAIN_STYLES = [{title: 'Normal', value: 'normal'}]

/**
 * Titles match Sanity's own defaults, so the toolbar reads exactly as it did
 * minus one button and no editor has to relearn anything.
 */
export const DECORATORS = [
  {title: 'Strong', value: 'strong'},
  {title: 'Italic', value: 'em'},
  {title: 'Code', value: 'code'},
  {title: 'Strike', value: 'strike-through'},
]

/** The `marks` object to hand a `block` definition. Annotations stay at their default. */
export const MARKS = {decorators: DECORATORS}
