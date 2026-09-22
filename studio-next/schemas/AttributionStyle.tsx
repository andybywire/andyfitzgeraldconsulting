import {styled} from 'styled-components'
import type {BlockStyleProps} from 'sanity'

/**
 * How an `attribution` block looks IN THE EDITOR — not on the site.
 *
 * Without this the style is indistinguishable from Normal in the Studio: Sanity renders a
 * custom style it knows nothing about as a plain paragraph. Quote gets its bar for free
 * because Sanity has a built-in rendering for `blockquote`; nothing equivalent exists
 * for a value this schema invented. So an author could not see, scanning a document,
 * which lines are credits and which are prose — the one thing the style exists to say.
 *
 * It borrows the site's treatment in outline (end-aligned, italic, muted) so the editor
 * reads the same way the page does, without trying to match its type sizes. The Studio
 * has its own type scale and matching the site's here would be a second copy to keep in
 * step for no gain.
 *
 * Sanity uses this component in TWO places: around the block in the editor, and around
 * the style's title in the toolbar's style menu. So the menu entry previews the style
 * too, dash and all — which is how Quote's entry works as well.
 *
 * ── THE DASH IS SHOWN BECAUSE THE FRONT END SUPPLIES IT ──────────────────────
 *
 * The site writes an en dash before every attribution (Quotation.astro), so an author
 * types only the name. Typing a dash anyway is the natural move and it happened on the
 * first real use: `– — Phil Coady` (2026-09-22). Showing the renderer's dash here puts
 * it in front of the author at the moment the mistake would be made.
 *
 * A `::before`, NOT an element. The editor is a contenteditable that owns its DOM, and a
 * node it did not create inside the block — even one marked non-editable — can confuse
 * caret placement at the start of the line. A pseudo-element is not in the DOM at all.
 * Sanity's own blockquote bar is drawn the same way, with a styled-components `::before`.
 *
 * The flex row is what keeps the dash on the SAME line: the block this wraps renders as
 * a block-level element, so a plain `::before` would sit on a line of its own above it.
 *
 * ── MUTED BY OVERRIDING A VARIABLE, BECAUSE `color` DOES NOT REACH ──────────
 *
 * The first version set `color` on this wrapper, and the text never went muted. Sanity
 * UI's Text sets `color: var(--card-fg-color)` on its OWN root, which beats anything
 * inherited — so only the italic and the alignment took. Redefining `--card-fg-color`
 * here instead lets Text's own rule resolve to the muted value. Sanity UI is a
 * transitive dependency and these names are not a contract this repo controls; if one
 * is ever renamed, the variable goes invalid, the text inherits an ordinary color, and
 * nothing else changes.
 */
const Root = styled.div`
  --card-fg-color: var(--card-muted-fg-color);

  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  color: var(--card-fg-color);
  font-style: italic;
  text-align: end;

  &::before {
    content: '–';
    margin-inline-end: 0.3em;
  }
`

export function AttributionStyle({children}: BlockStyleProps) {
  return <Root>{children}</Root>
}
