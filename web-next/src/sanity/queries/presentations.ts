import {defineQuery} from 'groq'
import {BAND_RSS, DATES, IDENTITY, IMAGE, TAXONOMY} from '../fragments'

/**
 * The Presentations index — every presentation, as a card.
 *
 * ── THE POSTER LADDER IS RESOLVED HERE, WHICH THE DETAIL QUERY DELIBERATELY IS NOT ──
 *
 * PRESENTATION_DELIVERY_QUERY projects each recording's poster as itself, because the
 * detail page shows every poster in its own player. A CARD has one image slot, so the
 * ladder is a card concern and this is where it belongs — presentation poster first,
 * else the first recording that carries one, walking events then recordings in STORED
 * ORDER. Both arrays are user-sortable in the Studio and that sort is an editorial
 * judgment, so this must not reorder by date.
 *
 * ── THE PARENTHESES ARE THE WHOLE TRAP, AND THEY ARE NOT OPTIONAL ────────────
 *
 * `eventDetail[]->eventRecordings[]` FLATTENS to one array of every recording, but a
 * following `[filter][0]` DISTRIBUTES per parent unless the traversal is parenthesised
 * first. Without the parens this returns one poster PER EVENT — an array where a single
 * value is expected, which reads downstream as "no value" rather than as an error.
 * Verified 2026-09-08; the long note is in studio-next/schemas/objects/recording.ts.
 *
 * VERIFIED AGAINST THE REAL FOUR, and they happen to cover all four outcomes, which is
 * why this corpus is worth keeping as the test set:
 *
 *   language-arts     poster            -> rung 1
 *   yes-and           poster            -> rung 1
 *   taxonomy-mgmt     recording poster  -> rung 2, image-2b919a88…-1280x720-png
 *   beyond-the-page   neither           -> null, and the card renders unboxed
 *
 * The null is not a defect to guard away: DESIGN.md's Elevation rule makes the BOX the
 * signal, so a presentation with no poster is meant to sit on the page ground with no
 * boundary. Same mechanism NoteCard already uses.
 *
 * ── `venue` IS THE FIRST EVENT, AND `eventCount` CARRIES THE REST ────────────
 *
 * The board draws one venue line per card — "Button Events • Online" — with the extra
 * deliveries reduced to a `+N` chip. `eventDetail[0]` is therefore the FIRST STORED
 * event, not the earliest or the latest; see above on why stored order is the editorial
 * one. Location comes back RAW and `formatLocation` composes it, so the display rule
 * lives in one place rather than being half in GROQ.
 *
 * `online` is projected first and must be READ first — Sanity's conditional `hidden`
 * stops a field being edited, not stored, so an event switched to online keeps its old
 * city. lib/location.ts carries the full note.
 *
 * ── THE CHIP FACTS, AND WHY `count()` IS NOT USED FOR THE RECORDINGS ─────────
 *
 * `count(eventDetail)` is safe: that is a plain reference array, so every entry is real.
 *
 * `count(eventDetail[]->eventRecordings[])` would NOT be, and this is the trap worth
 * naming because it produces a plausible number rather than an error: an event carrying
 * no recordings still contributes a NULL to the flattened array, so the count reports
 * deliveries rather than recordings. `language-arts` has three events and no recordings
 * at all, and would have come back as 3. Projecting the `kind` values through a
 * `defined()` filter counts only what exists — it returns `[]` there, and `["audio"]`
 * and `["video"]` on the two that do have one.
 *
 * `defined(transcript)` rather than `count(transcript) > 0`: on a document with no
 * transcript `count()` returns null, and `null > 0` is null rather than false — so the
 * flag would be three-valued where the card wants a boolean.
 */
export const PRESENTATIONS_INDEX_QUERY = defineQuery(`
	*[_type == "presentation" && defined(slug.current)] | order(pubDate desc) {
		${IDENTITY},
		${DATES},
		${TAXONOMY},
		title,
		"poster": coalesce(
			poster,
			(eventDetail[]->eventRecordings[])[defined(poster)][0].poster
		) { ${IMAGE} },
		"venue": eventDetail[0]->{
			"name": event,
			"online": location.online,
			"city": location.city,
			"state": location.state,
			"country": location.country
		},
		"eventCount": count(eventDetail),
		"hasTranscript": defined(transcript),
		"hasDeck": defined(presentationDeck.asset),
		"recordingKinds": (eventDetail[]->eventRecordings[])[defined(kind)].kind
	}
`)

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
 * The deck's slides — the images that make the deck viewable in the page.
 *
 * ── A SEVENTH QUERY RATHER THAN A FIELD ON AN EXISTING ONE ───────────────────
 *
 * PRESENTATION_DELIVERY_QUERY's own note names it "the query most likely to tip the
 * ceiling", and this would add an array of image objects each dereferencing an asset to
 * exactly that query. The detail query is no better: it already carries three Portable
 * Text arrays. So this is split from the start rather than combined and then caught — the
 * same reasoning that produced the other six.
 *
 * PROBED with a deliberate bogus property access against PRESENTATION_DETAIL_QUERY as a
 * known-good control. Re-probe before adding a field; a green `astro check` proves nothing
 * here, because an `any` result type-checks perfectly.
 *
 * ── IT DEREFERENCES `asset`, WHICH THE `IMAGE` FRAGMENT DELIBERATELY DOES NOT ─
 *
 * fragments.ts keeps `asset` undereferenced because the ref encodes the original's pixel
 * dimensions, so a join "would cost a join and buy nothing". Here it buys two things that
 * live only on the asset document:
 *
 *   assetAlt   alt text set ON THE ASSET, which follows the image everywhere it is used.
 *              Verified as a real, separate layer from the object's own `altText`: a
 *              `figure` block carries its alt on the block while its asset carries null,
 *              and `consulting_1262.jpg` carries alt on the asset with no field set.
 *              The renderer prefers this, so setting it once applies to every instance.
 *   filename   the ONLY thing that can detect a dropped upload. Batch upload into an array
 *              silently loses files — measured, 8 of 40 on one attempt — and a gap in a
 *              zero-padded run is the one observable trace it leaves.
 *
 * Written inline rather than through `${IMAGE}` because a slide carries no `caption`, so
 * the shared fragment would add a permanently-null field. Same call BAND_WORK_WITH_ME
 * records for `client.tile`.
 *
 * ── NOT ORDERED HERE, AND THAT IS DELIBERATE ─────────────────────────────────
 *
 * `| order(filename asc)` would be one line and is wrong. GROQ's string ordering is
 * lexicographic with no natural-number mode, so it is correct only while every filename is
 * zero-padded — true of Keynote's export today, false the first time a single slide is
 * re-exported as `deck_7.png`. The page sorts with `localeCompare(…, {numeric: true})`
 * instead, which handles both. See the note there.
 */
export const PRESENTATION_SLIDES_QUERY = defineQuery(`
	*[_type == "presentation" && slug.current == $slug][0] {
		"slides": presentationSlides[]{
			asset,
			crop,
			hotspot,
			altText,
			"assetAlt": asset->altText,
			"filename": asset->originalFilename
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
		"older": *[
			_type == "presentation"
			&& defined(slug.current)
			&& (pubDate < ^.pubDate || (pubDate == ^.pubDate && _id < ^._id))
		] | order(pubDate desc, _id desc)[0] {
			"slug": slug.current,
			title
		},
		"newer": *[
			_type == "presentation"
			&& defined(slug.current)
			&& (pubDate > ^.pubDate || (pubDate == ^.pubDate && _id > ^._id))
		] | order(pubDate asc, _id asc)[0] {
			"slug": slug.current,
			title
		}
	}
`)
