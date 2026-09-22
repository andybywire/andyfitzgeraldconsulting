/**
 * The mark overrides, shared by the two places the site renders Portable Text.
 *
 * Prose.astro is one. Quotation.astro is the other: it renders the quote and its
 * attribution through a `<PortableText>` of its own, because they sit inside a
 * `<figure>` that Prose's flat output cannot express. Those blocks carry the same marks
 * as any other — a struck word in a quote, a link in a credit — so they need the same
 * map, and two copies of it would let a new override reach the prose and quietly miss
 * the quotes.
 *
 * A module rather than an export from Prose.astro, which cannot export values to its
 * importers. And a module rather than Quotation importing Prose, because Prose imports
 * Quotation: that cycle happens to work, since neither touches the other until render
 * time, but it works by accident and would break the first time either one read the
 * other at the top level.
 *
 * Only marks, because only marks can appear in a text block. The `type` entries
 * (figure, code) and the heading ids have no business inside a quotation.
 */
import Strike from './Strike.astro'

export const MARK_COMPONENTS = {'strike-through': Strike}
