import {defineQuery} from 'groq'
import {IMAGE, PAGE_BAND_GET_IN_TOUCH} from '../fragments'

/**
 * `page` — website-GENERIC scaffolding on one repeatable template, as opposed to
 * `singleton`, which is CMS-governed content with a UNIQUE layout. Contact is the first,
 * with About, Colophon, Apologia and Projects behind it.
 *
 * The disqualifier is testable rather than a matter of taste: a `page` carries no Topic
 * and no Genre concepts and never appears in an article listing. Anything that wants
 * either belongs in the Document branch instead. The risk this type carries is drift —
 * `page` becoming where things land that should have been modeled — not the type itself.
 *
 * Query names must be globally unique: TypeGen keys generated types by variable name and
 * will silently overwrite a duplicate defined in another file.
 */

/**
 * Every page's slug, for `getStaticPaths`.
 *
 * `defined(slug.current)` rather than trusting the schema, matching INSIGHT_SLUGS_QUERY:
 * the field carries no `required` validation, and a slugless document would otherwise
 * generate the literal path `/null`.
 */
export const PAGE_SLUGS_QUERY = defineQuery(`
	*[_type == "page" && defined(slug.current)] {
		"params": {"slug": slug.current}
	}
`)

/**
 * One page, with its Get in Touch band.
 *
 * ── `lede` IS THE PORTABLE TEXT, NOT THE META STRING — THE OPPOSITE OF SINGLETONS ──
 *
 * Worth stating plainly, because the two types name the same role differently and the
 * word `lede` means different things on either side of that line:
 *
 *   singleton   `heroCopy` is the Portable Text; `"lede": pt::text(heroCopy)` is the
 *               flattened string for <meta name="description">
 *   page        `lede` IS the Portable Text field; `"description"` is the flattened string
 *
 * So this projects `lede` bare and names the flattened one `description` after the job it
 * does. Do NOT "fix" either type to match the other — the field names come from the
 * schema and renaming a projection to paper over that would only hide it.
 *
 * The upside of the schema's naming is that `page` maps straight through: <PageHeader>'s
 * prop is `lede` and takes Portable Text, so nothing is renamed at the call site. The
 * singleton queries are the ones that have to map.
 *
 * `lede` and `bodyText` are both projected BARE. They are Portable Text — an array comes
 * back whole, so blocks and marks survive without a projection, and adding one would only
 * be a way to drop a block type by omission. `bodyText` can also contain images. See the
 * note on IMAGE in fragments.ts.
 *
 * `heroImg` is the opposite case and is exactly the trap that note names: a named image
 * FIELD needs the fragment, because a bare projection is fine but `heroImg.asset->url`
 * would silently discard crop and hotspot. Both matter here — the source is landscape and
 * both breakpoints are portrait, so the reframe is doing real work.
 *
 * ── NO BAND HERE. SEE THE QUERY BELOW; THE SPLIT IS FORCED ─────────────────
 *
 * ── AND `heroImg` DID NOT TIP IT, WHICH WAS WORTH ESTABLISHING ─────────────
 *
 * Adding a named image field to a query already carrying two Portable Text arrays and a
 * `pt::text` is precisely the direction that pushes `ClientReturn` past its ceiling and
 * yields `any`. RE-PROBED after this edit (2026-09-07), subject and control: a deliberate
 * `page.thisFieldDoesNotExist` raised ts(2339) here, as did the same line against
 * `bands` — so the lookup still resolves and the result is genuinely typed.
 *
 * Probe again before adding a fourth field. The failure is silent, and this page hands
 * `heroImg` straight to a component with no callback over the result to reveal it.
 */
export const PAGE_QUERY = defineQuery(`
	*[_type == "page" && slug.current == $slug][0] {
		_id,
		title,
		lede,
		"description": pt::text(lede),
		heroImg { ${IMAGE} },
		bodyText
	}
`)

/**
 * A page's Get in Touch band, fetched SEPARATELY — forced, exactly as it is for
 * INSIGHT_RSS_BAND_QUERY.
 *
 * ── THIS WAS BUILT THE OTHER WAY FIRST, AND THE OTHER WAY WAS SILENTLY BROKEN ──
 *
 * The fragment was interpolated into PAGE_QUERY above. That produced a correct query,
 * correct results, and a correct `PAGE_QUERY_RESULT` in sanity.types.ts whose map key
 * matched byte for byte. It still broke: `loadQuery` is typed `ClientReturn<Q>`, a lookup
 * into TypeGen's `SanityQueries` map keyed by the query's literal text, and past a
 * complexity ceiling that lookup yields `any` rather than failing. singletons.ts names
 * the tipping shape as "two Portable Text arrays and a band fragment", which is precisely
 * what the combined query was.
 *
 * ── AND IT RAISED NOTHING AT ALL, WHICH IS WHY IT NEEDS A PROBE ────────────
 *
 * On the article page the same fault at least surfaced as four `implicit any` errors on
 * unrelated callbacks. This page has no callbacks over the result — `lede` and `bodyText`
 * go straight to <PageHeader> — so `any` type-checked perfectly green and would have
 * shipped a wholly untyped query looking correct.
 *
 * Established by probe rather than by reading: a deliberate `page.thisFieldDoesNotExist`
 * raised nothing with the fragment folded in, while the identical line against
 * SINGLETON_INTRO_QUERY in reviews.astro raised ts(2339) as it should. One subject, one
 * control, opposite results — which is the difference between knowing and assuming.
 *
 * RUN THAT PROBE AGAIN before folding any fragment into a query in this file. The failure
 * is silent, its symptom points nowhere near its cause, and re-running typegen does not
 * help because the generated types were never the problem.
 */
export const PAGE_GET_IN_TOUCH_BAND_QUERY = defineQuery(`
	*[_type == "page" && slug.current == $slug][0] {
		${PAGE_BAND_GET_IN_TOUCH}
	}
`)
