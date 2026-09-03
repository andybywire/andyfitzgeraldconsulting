import {defineQuery} from 'groq'
import {BAND_WORK_WITH_ME} from '../fragments'

/**
 * Singletons — CMS-governed pages with a UNIQUE layout, as opposed to `page`, which is
 * website-generic scaffolding on one repeatable template. Home, Insights, Reviews,
 * Presentations and Contact.
 *
 * Query names must be globally unique: TypeGen keys generated types by variable name and
 * will silently overwrite a duplicate defined in another file.
 */

/**
 * A singleton's HEADER only — the title and the lead.
 *
 * Deliberately not a general `SINGLETON_QUERY`. `heroImg` and `bodyText` are on the type
 * and are wanted by Home and Services, which have their own layouts; projecting them here
 * would type this result with fields the index page can never use, which is the same
 * reason INSIGHT_DETAIL_QUERY leaves caseStudy's body fields out. A fuller query lands
 * with the page that needs one.
 *
 * `heroCopy` is projected BARE. It is Portable Text — an array comes back whole, so its
 * blocks and marks survive without a projection, and adding one would only be a way to
 * drop a block type by omission. See the note on IMAGE in fragments.ts.
 *
 * `lede` is the same field flattened to plain text, for `<meta name="description">`. Both
 * are needed and they are not interchangeable: one is rendered, one goes in <head>, and a
 * meta description containing markup would be wrong.
 *
 * ALL SEVEN SINGLETONS NOW CARRY A SLUG (verified 2026-08-28). Insights was the one that
 * did not, which is why this is addressed by slug rather than by `_id`.
 */
export const SINGLETON_HEADER_QUERY = defineQuery(`
	*[_type == "singleton" && slug.current == $slug][0] {
		_id,
		title,
		heroCopy,
		"lede": pt::text(heroCopy)
	}
`)

/**
 * A singleton's header PLUS its Work with Me band — Insights today, and whichever of
 * Home or Presentations lands next.
 *
 * Separate from SINGLETON_HEADER_QUERY rather than folded into it, for the reason that
 * query's own note gives: a page should not be typed with fields it cannot use. Not every
 * singleton carries this band, and the ones that do not would get a `workBand` that is
 * always the site default whether or not anything renders it.
 *
 * The band resolves through the three-tier ladder in fragments.ts. For a singleton that
 * is really two tiers — its own `bands` or the site default — because Settings offers no
 * page-type override for singletons. Insights currently sets its own.
 */
export const SINGLETON_WORK_BAND_QUERY = defineQuery(`
	*[_type == "singleton" && slug.current == $slug][0] {
		_id,
		title,
		heroCopy,
		"lede": pt::text(heroCopy),
		${BAND_WORK_WITH_ME}
	}
`)

/**
 * A singleton's header PLUS `bodyText` — the title, the lead, and a paragraph of intro
 * copy beneath it.
 *
 * ── THE THIRD FIELD IS THE WHOLE DIFFERENCE FROM SINGLETON_HEADER_QUERY ─────
 *
 * Reviews is the first page to render all three, and it will not be the last: the
 * generic `page` type is expected to open the same way (Andy, 2026-09-03), which is why
 * this is named for the SHAPE rather than for Reviews. <PageHeader>'s optional third
 * slot is the rendering half of the same pattern.
 *
 * Still not folded into SINGLETON_HEADER_QUERY, for the reason that query already gives:
 * a page should not be typed with fields it cannot use. The Insights index renders no
 * intro copy under its lead — the facets come next — so `bodyText` would be a field it
 * is handed and must ignore.
 *
 * `bodyText` is projected BARE, like `heroCopy`. It is Portable Text and can contain
 * images as well as blocks, so an array comes back whole and a projection here could
 * only drop a block type by omitting it.
 *
 * NO BAND. Reviews sets none and the board draws none — the footer follows the content
 * directly. A page wanting one composes BAND_WORK_WITH_ME in its own query, which is
 * also what keeps this one clear of the ClientReturn ceiling: two Portable Text arrays
 * and a band fragment is the shape that has tipped it before.
 */
export const SINGLETON_INTRO_QUERY = defineQuery(`
	*[_type == "singleton" && slug.current == $slug][0] {
		_id,
		title,
		heroCopy,
		"lede": pt::text(heroCopy),
		bodyText
	}
`)
