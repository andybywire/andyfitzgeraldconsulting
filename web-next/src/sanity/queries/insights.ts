import {defineQuery} from 'groq'
import {DATES, IDENTITY, TAXONOMY} from '../fragments'

/**
 * Insights — `article` and `caseStudy`.
 *
 * They are queried together because they are one thing to a reader and are distinguished by
 * `insightType` rather than by structural type. That is also why `/insights/` can stay as the
 * shared path while the two Sanity types remain separate.
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
		shortDescription
	}
`)

/** A single insight by slug. Portable Text bodies are rendered, not queried into, in phase 4. */
export const INSIGHT_DETAIL_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy"] && slug.current == $slug][0] {
		${IDENTITY},
		${DATES},
		${TAXONOMY},
		title,
		shortDescription,
		lede,
		bodyText
	}
`)

/** Slugs only, for `getStaticPaths`. Kept separate so the build does not fetch bodies twice. */
export const INSIGHT_SLUGS_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy"] && defined(slug.current)] {
		"params": {"slug": slug.current}
	}
`)
