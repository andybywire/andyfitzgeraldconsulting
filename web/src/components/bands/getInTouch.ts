/**
 * The Get in Touch band's heading, and the fragment id that addresses it.
 *
 * ── TWO CALLERS THAT MUST AGREE, WHICH IS WHY THIS IS A MODULE ───────────────
 *
 * `GetInTouchBand` renders the h2 and carries the id; the `page` template lists that
 * heading in its rail's "On This Page". The schema has no `title` field for this band —
 * `bandGetInTouch` carries only `message` and `bandCopy` — so the string is not content
 * and cannot come from the document. It has to be written down somewhere, and if it were
 * written down twice the two could disagree.
 *
 * headingId.ts is the precedent and the failure mode is the one it names: a fragment with
 * no target scrolls nowhere rather than erroring, so a mismatched id would look fine on
 * the page and simply not work. The heading text is the same shape of problem one step
 * quieter — the rail would read correctly and just not match the heading it points at.
 *
 * NOT A TOKEN AND NOT CONTENT. If this string ever needs to vary by page, that is the
 * signal to give `bandGetInTouch` a `title` field the way `bandRss` has one, and to delete
 * this module rather than parameterise it.
 */
export const GET_IN_TOUCH_HEADING = 'Get In Touch'
export const GET_IN_TOUCH_ID = 'get-in-touch'
