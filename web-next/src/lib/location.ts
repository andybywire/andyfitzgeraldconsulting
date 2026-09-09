/**
 * An event's location, as one display string.
 *
 * ── `online` IS READ FIRST, AND THAT IS LOAD-BEARING ─────────────────────────
 *
 * Sanity's conditional `hidden` stops a field being EDITED, not stored. An event
 * switched from in-person to online keeps whatever city it had, and `country` carries
 * an `initialValue` of 'USA' regardless — so it is populated on online events that
 * never had a country at all.
 *
 * That is not hypothetical: "The Informed Life" comes back today as
 * `{online: true, country: 'USA', city: null, state: null}`. Inferring "in person"
 * from a present country would print a location for a podcast recorded over the
 * internet, so the boolean is the only thing that decides.
 *
 * ── STATE OR COUNTRY, NEVER BOTH ─────────────────────────────────────────────
 *
 * "Seattle, WA" and "Zürich, Switzerland" (Andy, 2026-09-08). Domestic events name the
 * state because the country is understood; international ones name the country because
 * the subdivision is not information a reader can place.
 *
 * The switch is a set of exact country strings, which is safe only because the Studio
 * now constrains that field with a list seeded from the five values in the data —
 * `USA`, `Canada`, `UK`, `Switzerland`, `Italy`. Before the list, a hand-typed "US"
 * would have fallen silently to the international branch and printed
 * "Seattle, United States".
 *
 * IT IS 'Canada', NOT 'CA'. The brief said `CA`, but no event stores that — and `CA`
 * DOES appear in this data as a STATE, meaning California. Matching on it would have
 * been wrong twice over.
 *
 * ── A MISSING COUNTRY FALLS BACK TO THE STATE, WHICH THE BRIEF DID NOT SAY ───
 *
 * The rule as given covered "USA or Canada" and "anything else" and had no third case,
 * but 10 of 40 events carry no country at all. The Information Architecture Conference
 * is one of them — `{city: 'Seattle', state: 'WA', country: null}` — and a first pass
 * that read the country before anything else printed "Seattle", silently dropping a
 * state that was sitting right there.
 *
 * So an absent country falls through to the state rather than to nothing. An event with
 * a city and a state and no country is overwhelmingly domestic, and the state is the
 * only regional information there is.
 *
 * THE INVERSE CASE PRINTS NOTHING RATHER THAN THE COUNTRY. A US event with no state
 * gives just the city — "Somewhere, USA" is noise on a site whose events are mostly
 * American, and the country was never the useful half of a domestic line.
 *
 * Worth knowing the field is populated backwards from what helps: `country` carries an
 * `initialValue`, so it is set on the online events where it means nothing and unset on
 * the in-person one where it would have decided the branch.
 *
 * Everything else assembles and drops out: a country with no city prints the country,
 * and an event with neither returns null so the caller can omit the line entirely.
 */
export interface EventLocation {
  online?: boolean | null
  city?: string | null
  state?: string | null
  country?: string | null
}

/** Countries whose subdivisions are named instead of the country itself. */
const SUBDIVISION_COUNTRIES = new Set(['USA', 'Canada'])

export function formatLocation(location: EventLocation | null | undefined): string | null {
  if (!location) return null
  if (location.online) return 'Online'

  /* Trimmed to null so a field holding only whitespace behaves as absent — the same
     treatment `headingText` gives a heading that slugs to nothing. */
  const city = location.city?.trim() || null
  const state = location.state?.trim() || null
  const country = location.country?.trim() || null

  const region = country ? (SUBDIVISION_COUNTRIES.has(country) ? state : country) : state

  return [city, region].filter(Boolean).join(', ') || null
}
