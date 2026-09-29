import {defineQuery} from 'groq'

/**
 * Slugs and revision dates for `/sitemap.xml`.
 *
 * ── `_updatedAt`, WHICH IS THE ONE FIELD THIS NEEDS AND THE ONE SURFACE IT SUITS ──
 *
 * `fragments.ts:27` records `_updatedAt` as the field for revision dates and sitemap
 * timestamps, and explicitly NOT the one the site orders or displays by. That is exactly
 * this: `<lastmod>` asks when the document last changed, not when it was published, so a
 * corrected typo in a 2019 article should move it and `pubDate` would not.
 *
 * Separate from `queries/search.ts` rather than folded into it. Those queries answer "what
 * can be found", project card copy and taxonomy, and are split four ways against the
 * `ClientReturn` ceiling; these answer "what exists and when did it change" in two scalars.
 * Adding `_updatedAt` there would have made four queries carry a field one consumer wants.
 *
 * ── SPLIT BY TYPE BECAUSE THE URL SHAPE IS, NOT BECAUSE OF THE CEILING ──────
 *
 * Three types live under `/insights/`, one under `/presentations/`, and `page` sits at the
 * root — so the split follows the URL prefix each group takes, and the endpoint pairs each
 * result with its own prefix. A single union query would type fine at two scalar fields,
 * and would then need a `_type` switch in TypeScript to rebuild exactly this grouping.
 *
 * Probe before adding a field here, per the standing rule in `queries/search.ts`: a query
 * past the complexity ceiling yields `any` rather than failing, and `astro check` stays
 * green over it.
 */

/** The Document branch — 42 rows on 2026-09-13, all under `/insights/`. */
export const SITEMAP_INSIGHTS_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy", "note"] && defined(slug.current)] {
		"slug": slug.current,
		_updatedAt
	}
`)

/** The Presentation branch — 9 rows, all under `/presentations/`. */
export const SITEMAP_PRESENTATIONS_QUERY = defineQuery(`
	*[_type == "presentation" && defined(slug.current)] {
		"slug": slug.current,
		_updatedAt
	}
`)

/** Website-generic scaffolding — 5 rows, at the root rather than under a section. */
export const SITEMAP_PAGES_QUERY = defineQuery(`
	*[_type == "page" && defined(slug.current)] {
		"slug": slug.current,
		_updatedAt
	}
`)

/**
 * Reviews — 22 rows with no pages of their own.
 *
 * Fetched for their DATES only. Every review renders as an anchor on `/reviews/`, and a
 * fragment is not a separate URL — the sitemaps protocol addresses documents, and
 * `/reviews/#phil-coady` is a position within one. So none of these become entries; they
 * decide when `/reviews/` itself last changed.
 */
export const SITEMAP_REVIEWS_QUERY = defineQuery(`
	*[_type == "review" && defined(slug.current)] {
		_updatedAt
	}
`)
