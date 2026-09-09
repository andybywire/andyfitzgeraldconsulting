import {defineQuery} from 'groq'
import {BAND_RSS, DATES, IDENTITY, IMAGE, TAXONOMY} from '../fragments'

/**
 * `presentation` — the Presentation branch of the Genre vocabulary: a delivered work,
 * with `event` recording each occasion it was delivered.
 *
 * ── FIVE QUERIES, AND THE SPLIT IS FORCED RATHER THAN TIDY ───────────────────
 *
 * `loadQuery` is typed `ClientReturn<Q>`, a lookup into TypeGen's `SanityQueries` map
 * keyed by the query's literal text, and past a complexity ceiling that lookup silently
 * yields `any`. singletons.ts names the tipping shape as "two Portable Text arrays and a
 * band fragment".
 *
 * This document is well past that on its own: THREE Portable Text arrays — `bodyText`,
 * `highlights` and `transcript` — plus an image, a file asset and a two-level
 * `eventDetail[]->eventRecordings[]` traversal. So it is split from the start rather
 * than combined and then caught, and each query below stays inside a shape that has been
 * probed.
 *
 * EVERY ONE OF THESE WAS PROBED with a deliberate bogus property access against a
 * known-good control, 2026-09-08. Re-probe before adding a field to any of them; a green
 * `astro check` proves nothing here, because an `any` result type-checks perfectly.
 *
 * Query names must be globally unique: TypeGen keys generated types by variable name and
 * will silently overwrite a duplicate defined in another file.
 */

/**
 * Every presentation's slug, for `getStaticPaths`.
 *
 * `defined(slug.current)` rather than trusting the schema, matching the other two slug
 * queries: the field carries no `required` validation, and a slugless document would
 * otherwise generate the literal path `/presentations/null`.
 */
export const PRESENTATION_SLUGS_QUERY = defineQuery(`
	*[_type == "presentation" && defined(slug.current)] {
		"params": {"slug": slug.current}
	}
`)

/**
 * The entry itself: identity, taxonomy, the poster, and the two prose fields that render
 * above the delivery detail.
 *
 * ── `description` IS THE META STRING AND `bodyText` IS THE PROSE ─────────────
 *
 * Worth stating because this type had them the other way round until 2026-09-08, when
 * both were renamed to match `article`, `caseStudy` and `page`. The old names were
 * `shortDescription` for the meta tag and `description` for the body, which inverted
 * every other type and would have fed meta text to the cards through
 * RELATED_POOL_QUERY's shared `shortDescription` projection.
 *
 * There is deliberately NO card-copy field: the Presentations board draws cards as title,
 * genre, date, event and chips, with no description, so a second string would exist only
 * to go unused.
 *
 * `highlights` is a bulleted list in Portable Text — `listItem: 'bullet'` on `normal`
 * blocks — not a plain array of strings, so it goes through <Prose> like any other body.
 * Absent on an Interview, which is why the section is conditional.
 *
 * `poster` is the FIRST RUNG of the card image ladder and the deck's face on the detail
 * page. The second rung lives in PRESENTATION_DELIVERY_QUERY; see the note there, and
 * objects/recording.ts for the rule and the GROQ trap it carries.
 */
export const PRESENTATION_DETAIL_QUERY = defineQuery(`
	*[_type == "presentation" && slug.current == $slug][0] {
		${IDENTITY},
		${DATES},
		${TAXONOMY},
		title,
		description,
		poster { ${IMAGE} },
		bodyText,
		highlights
	}
`)

/**
 * The transcript, alone.
 *
 * ── SEPARATE FOR TWO REASONS, ONLY ONE OF WHICH IS THE CEILING ───────────────
 *
 * It is the largest field on the type — 92 blocks on the one interview that has one —
 * and it is carried by a minority of presentations. Folding it into the detail query
 * would put that payload on every presentation page whether or not it renders one.
 *
 * Its `h3`s are the transcript's own table of contents, built with `headingLinks(…,
 * 'h3')`. The ids come from `Heading.astro`, which serializes both h2 and h3 through the
 * shared `headingId`, so the list and the headings cannot disagree.
 *
 * TRANSCRIPT_STYLES also allows `h4`, which renders but is deliberately NOT in the
 * contents list (Andy, 2026-09-08). If that ever changes it is one argument to
 * `headingLinks`, not a schema change.
 */
export const PRESENTATION_TRANSCRIPT_QUERY = defineQuery(`
	*[_type == "presentation" && slug.current == $slug][0] {
		transcript
	}
`)

/**
 * The deck and the deliveries — everything about how and where the work was given.
 *
 * ── THE DEEPEST TRAVERSAL ON THE TYPE, WHICH IS WHY IT IS ALONE ──────────────
 *
 * `eventDetail[]->eventRecordings[]` is two levels of array with a dereference between
 * them, and each recording carries its own image object. Combined with anything else
 * this is the query most likely to tip the ceiling.
 *
 * ── LOCATION COMES BACK RAW, AND THE TEMPLATE FORMATS IT ─────────────────────
 *
 * `online` is projected FIRST AND READ FIRST. Sanity's conditional `hidden` stops a field
 * being edited, not stored, so an event switched from in-person to online keeps whatever
 * city it had — inferring "in person" from a present `city` would resurrect it. Same
 * shape of trap as the `bandCopy: null` default.
 *
 * The display rule is the template's, not the query's: `USA` and `Canada` print
 * "City, State", anything else prints "City, Country" (Andy, 2026-09-08). That turns on
 * exact matching of a value the Studio now constrains with a list, seeded from the five
 * countries in the data. 10 events carry no country at all and are not online, so the
 * formatter needs a city-only fallback.
 *
 * ── THE POSTER LADDER IS *NOT* RESOLVED HERE ─────────────────────────────────
 *
 * Deliberately. A recording's poster is projected as itself, and the ladder —
 * presentation poster, else the first recording that has one — is a CARD concern, so it
 * belongs to the index and related-list queries rather than to the detail page, which
 * shows each recording's poster in its own player.
 *
 * When those queries are written, the ladder's GROQ needs parentheses to work:
 * `(eventDetail[]->eventRecordings[])[defined(poster)][0]`. Without them the filter and
 * index distribute per event and return one poster each. Verified 2026-09-08; the full
 * note is in studio-next/schemas/objects/recording.ts.
 */
export const PRESENTATION_DELIVERY_QUERY = defineQuery(`
	*[_type == "presentation" && slug.current == $slug][0] {
		"deck": presentationDeck.asset->{url, originalFilename, size, extension},
		"events": eventDetail[]->{
			_id,
			"name": event,
			date,
			link,
			"online": location.online,
			"city": location.city,
			"state": location.state,
			"country": location.country,
			"recordings": eventRecordings[]{
				kind,
				url,
				mediaUrl,
				sourceName,
				duration,
				poster { ${IMAGE} }
			}
		}
	}
`)

/**
 * The RSS band, fetched separately for the reason INSIGHT_RSS_BAND_QUERY records.
 *
 * `presentation.customBands` accepts only `bandRss`, matching all three detail boards:
 * RSS CTA, then Related Presentations, then the footer. No Work With Me and no Get in
 * Touch — the latter belongs to the Presentations *singleton*, which resolves it through
 * the three-rung `BAND_GET_IN_TOUCH` rather than through anything here.
 */
export const PRESENTATION_RSS_BAND_QUERY = defineQuery(`
	*[_type == "presentation" && slug.current == $slug][0] {
		${BAND_RSS}
	}
`)

/**
 * Previous and next, across ALL presentations rather than within a genre.
 *
 * ── NOT GENRE-SCOPED, WHICH IS THE OPPOSITE OF THE ARTICLE ROUTE ─────────────
 *
 * `GENRE_NAV_QUERY` sequences an article within its genre because a Note and a Case Study
 * are genuinely different kinds of reading. The Presentation branch's genres — Keynote,
 * Talk, Workshop, Panel, Interview — are much closer to each other than that, so
 * "Previous Presentation" is the more useful step (Andy, 2026-09-07).
 *
 * <GenreNav> needs no change to render it: its `genre` prop is only the chip copy, so
 * passing "Presentation" gives "Previous Presentation" and the component is unaware.
 *
 * ── IT RESOLVES ITS OWN COMPARISON KEY, SO IT RUNS CONCURRENTLY ──────────────
 *
 * The article route awaits its detail query before it can run the nav one, because
 * GENRE_NAV_QUERY takes `$pubDate` and `$id` as parameters. This does not: `^.pubDate`
 * and `^._id` reach the outer document from inside each subquery, so one `$slug` is
 * enough and the whole page fetches in a single round trip.
 *
 * Verified against real data before being written here (2026-09-08), because a `^.` in
 * that position is exactly the kind of thing that returns null rather than erroring: on a
 * known article it returned the two documents either side by date, in the right
 * direction. Worth applying back to the article route.
 *
 * `_id` breaks the tie on identical dates, and the two clauses use the same ordering in
 * opposite directions so a document can be neither before nor after itself.
 */
export const PRESENTATION_NAV_QUERY = defineQuery(`
	*[_type == "presentation" && slug.current == $slug][0] {
		"prev": *[
			_type == "presentation"
			&& defined(slug.current)
			&& (pubDate < ^.pubDate || (pubDate == ^.pubDate && _id < ^._id))
		] | order(pubDate desc, _id desc)[0] {
			"slug": slug.current,
			title
		},
		"next": *[
			_type == "presentation"
			&& defined(slug.current)
			&& (pubDate > ^.pubDate || (pubDate == ^.pubDate && _id > ^._id))
		] | order(pubDate asc, _id asc)[0] {
			"slug": slug.current,
			title
		}
	}
`)
