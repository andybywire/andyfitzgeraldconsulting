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

/**
 * `"2005-04-01"` -> `"2005"`, for a book's publication year. Null in, null out.
 *
 * ── IT SHARES `FORMAT`'s UTC PIN, AND FOR THE SAME REASON ────────────────────
 *
 * `new Date("2025-01-01").getFullYear()` returns **2024** anywhere west of
 * Greenwich, because the string parses as midnight UTC and `getFullYear` is local.
 * That is the module's own bug in its worst form — a January date is the only case
 * that shows it, so it would pass every test written with a mid-year date and be
 * wrong on exactly the books published in January.
 *
 * `iso.slice(0, 4)` would also be correct, and is rejected on purpose: it would put
 * a second, unrelated date-parsing rule in the one module that exists to hold one.
 */
const YEAR = new Intl.DateTimeFormat('en-US', {timeZone: 'UTC', year: 'numeric'})

export function formatYear(iso: string | null | undefined): string | null {
  return iso ? YEAR.format(new Date(iso)) : null
}
