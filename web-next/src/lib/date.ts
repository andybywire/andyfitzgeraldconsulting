/**
 * Publication dates, formatted once.
 *
 * ── `timeZone: 'UTC'` IS THE WHOLE REASON THIS IS A MODULE ───────────────────
 *
 * `pubDate` is a DATE-ONLY string ("2026-08-26"), which `new Date()` parses as
 * midnight UTC — so formatting it in a negative-offset zone renders the PREVIOUS
 * DAY. Andy is in Pacific and CI runs in UTC, which is the worst possible shape for
 * the bug: correct in the deployed build, one day early on the machine where anyone
 * would notice.
 *
 * It was inline on the article page until the cards needed the same thing. Three
 * consumers now, and a rule that is invisible when wrong is exactly the kind that
 * should exist once.
 *
 * MODULE SCOPE, NOT COMPONENT FRONTMATTER. An Astro component's frontmatter runs
 * per instance, so building the formatter there would construct one
 * `Intl.DateTimeFormat` per card — 45 of them on a full index. Here it is built
 * once per build.
 */
const FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

/** `"2022-11-17"` -> `"November 17, 2022"`. Null in, null out. */
export function formatDate(iso: string | null | undefined): string | null {
  return iso ? FORMAT.format(new Date(iso)) : null
}
