import {defineQuery} from 'groq'
import {DATES, IDENTITY, IMAGE, TAXONOMY} from '../fragments'

/**
 * Insights — `article` and `caseStudy`.
 *
 * They are queried together because they are one thing to a reader and are distinguished by
 * `genre` rather than by structural type. That is also why `/insights/` can stay as the shared
 * path while the two Sanity types remain separate. (This said `insightType` until phase 4;
 * `genre` replaced it in phase 1 and TAXONOMY has projected `genre` since — the comment was
 * describing a field the query no longer reads.)
 *
 * Query names must be globally unique: TypeGen keys generated types by variable name and will
 * silently overwrite a duplicate defined in another file.
 */

/** Index listing, newest first. Every insight in the dataset has a slug and a shortDescription. */
export const INSIGHTS_INDEX_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy"] && defined(slug.current)] | order(pubDate desc) {
		${IDENTITY},
		${DATES},
		${TAXONOMY},
		title,
		shortDescription,
		heroImage { ${IMAGE} }
	}
`)

/**
 * A single insight by slug.
 *
 * `bodyText` is projected BARE on purpose — see the note on IMAGE in fragments.ts. A Portable
 * Text array comes back whole, so its image blocks keep their asset, crop and hotspot without
 * a projection, and adding one would only be a way to drop a block type by omission.
 *
 * `description` is the meta description, and is a different field from `shortDescription`,
 * which is card copy. Both are needed: one goes in <head>, one in a listing.
 *
 * caseStudy's body fields — atGlance, whatDid, projectGoal/Approach/Outcome, before/after
 * images — are deliberately NOT here. It has its own Figma board and its own page type, which
 * is item 4 in the phase 4 order; adding them now would type every article result with five
 * null fields it can never use.
 */
export const INSIGHT_DETAIL_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy"] && slug.current == $slug][0] {
		${IDENTITY},
		${DATES},
		${TAXONOMY},
		title,
		shortDescription,
		description,
		lede,
		bodyText,
		heroImage { ${IMAGE} }
	}
`)

/** Slugs only, for `getStaticPaths`. Kept separate so the build does not fetch bodies twice. */
export const INSIGHT_SLUGS_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy"] && defined(slug.current)] {
		"params": {"slug": slug.current}
	}
`)
