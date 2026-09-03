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

/**
 * A client's engagement history, as the one line the Reviews page prints under its name.
 *
 * ── THREE OUTPUTS, AND THE ARRAY LENGTH DECIDES WHICH ───────────────────────
 *
 *   []                       -> null           nothing to say
 *   one range, two months    -> "April 2017 — August 2017"
 *   one range, same month    -> "July 2016"
 *   two or more ranges       -> "Multiple engagements"
 *
 * The last rule is Andy's (2026-09-03) and it is an editorial choice rather than a
 * technical one: a client with three separate engagements has a relationship, not a
 * date range, and listing all three would give the most-repeated clients the noisiest
 * line on the page. Sixteen clients render this; seven take the plural branch.
 *
 * ── THE SAME-MONTH TEST COMPARES THE FORMATTED STRINGS ──────────────────────
 *
 * Not the month numbers, and not `startDate.slice(0, 7)`. Comparing what will actually
 * be printed tests month AND year in one step and cannot drift from the output, because
 * it IS the output. Extracting the parts would be a second, parallel notion of "same
 * month" sitting next to the formatter it is supposed to agree with.
 *
 * Only one client in the dataset takes this branch — Wintr's single engagement opens and
 * closes on 2016-07-19 — which is exactly the kind of lone case that a build with no
 * test for it renders as "July 2016 — July 2016" forever.
 *
 * ── IT SHARES THE MODULE'S UTC PIN, AND THE STAKES ARE HIGHER HERE ──────────
 *
 * `startDate` and `endDate` are date-only strings, so the module's founding bug applies:
 * `new Date("2020-01-01")` is midnight UTC, and formatting it in Pacific yields DECEMBER
 * 2019. Off-by-one-day is invisible in a month-and-year string — off-by-one-MONTH is not,
 * and it only shows on dates near a month boundary. Elemeno's engagement starts on
 * January 1st, so this would be wrong on the first client the page renders and right on
 * most of the others.
 *
 * ── NOT VALIDATED: A RANGE THAT RUNS BACKWARDS ──────────────────────────────
 *
 * `endDate` before `startDate` prints as given. The Studio requires both fields but
 * cannot order them, and one such row existed in the data until 2026-09-03 (Frog, fixed
 * by Andy). A guard here would hide the next one rather than surface it; the schema is
 * where that belongs.
 */
const MONTH_YEAR = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
})

/** The em dash is the board's, and it is not the en dash the bylines use. */
const RANGE_SEPARATOR = ' — '

export function formatEngagements(
  engagements:
    ReadonlyArray<{startDate?: string | null; endDate?: string | null}> | null | undefined,
): string | null {
  if (!engagements?.length) return null
  if (engagements.length > 1) return 'Multiple engagements'

  const {startDate, endDate} = engagements[0]
  if (!startDate || !endDate) return null

  const start = MONTH_YEAR.format(new Date(startDate))
  const end = MONTH_YEAR.format(new Date(endDate))

  return start === end ? start : `${start}${RANGE_SEPARATOR}${end}`
}
