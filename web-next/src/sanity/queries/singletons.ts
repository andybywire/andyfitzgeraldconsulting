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
