import {defineQuery} from 'groq'

/**
 * The Reviews page — a singleton whose body is assembled from two OTHER document types.
 *
 * ── THE PAGE IS A THREE-LEVEL STRUCTURE, AND ONLY ONE LEVEL IS A DOCUMENT ────
 *
 *   relationship group   `client.relationship`, a string field — NOT a document
 *     client             one block: logo, name, engagement dates, role
 *       review           one blockquote + byline each
 *
 * So the query is rooted at `client`, not at `review`. Rooting it at `review` would
 * return 22 rows each carrying a duplicate copy of its client, and the page would have
 * to de-duplicate 16 clients back out of them — reassembling, at build time, a grouping
 * the query could have expressed directly.
 *
 * ── CLIENTS WITHOUT REVIEWS ARE EXCLUDED IN THE FILTER, NOT IN THE TEMPLATE ──
 *
 * `count(...) > 0` drops UW Medicine, which is a real client with a real logo and no
 * review. Doing it here rather than with a `{reviews.length > 0 && ...}` guard on the
 * page keeps the empty case out of the data instead of out of the markup — the page
 * never sees a client it must not render, and the relationship grouping downstream
 * cannot produce an empty group heading.
 *
 * ── ORDERING: MOST RECENT ENGAGEMENT FIRST, ACROSS ALL GROUPS AT ONCE ────────
 *
 * `engagementDates` is an ARRAY — 7 of the 16 clients have two or three — so there is
 * no single date to sort on and one has to be derived. `latestEnd` takes the newest
 * `endDate` of the set, which is the answer to "when did I last work with them".
 *
 * Sorting by `startDate` instead would rank a long-finished engagement that began early
 * above a recent short one, which is the opposite of what the page is for.
 *
 * The sort runs ONCE over all 16 rather than per group, and grouping preserves it: a
 * stable partition of a sorted list leaves each part sorted. So there is no second
 * ordering pass in reviews.ts, and no risk of the two disagreeing.
 *
 * `latestEnd` is projected rather than left implicit because `| order()` after a
 * projection can only see projected fields. It is not otherwise rendered.
 *
 * ── `logo`, NOT `tile` ───────────────────────────────────────────────────────
 *
 * The board draws a 146x146 square, and fragments.ts records why that settles it: these
 * are two different assets rather than two sizes of one — `logo` is the square 300x300
 * mark, `tile` the 5:3 lockup the Work with Me band wants.
 *
 * Projected inline rather than through the IMAGE fragment, for the reason
 * BAND_WORK_WITH_ME gives: `client` images carry `altText` and no `caption`, so the
 * shared fragment would add a field that is null on every row.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ────────────────────────────────────────────
 *
 * `excerpt` and `condensedBody` (19/22 and 7/22 populated). This page renders the full
 * `body`; `condensedBody` is the case study's testimonial band and `excerpt` has no
 * consumer in this build. Projecting either would type the page with fields it cannot
 * use — the reason singletons.ts splits its two queries.
 *
 * The singleton's own title, `heroCopy` and `bodyText` are NOT here either, and that is
 * the ClientReturn ceiling rather than a preference. This query already nests one
 * Portable Text array per review inside an array projection inside a document
 * projection; adding two more arrays at the top level is the shape that has tipped the
 * type lookup into `any` before. See CASE_STUDY_BAND_QUERY for the full account. The
 * page composes the two results.
 */
export const REVIEWS_BY_CLIENT_QUERY = defineQuery(`
	*[_type == "client" && count(*[_type == "review" && references(^._id)]) > 0] {
		_id,
		name,
		relationship,
		role,
		"logo": logo{asset, crop, hotspot, altText},
		"engagements": engagementDates[]{startDate, endDate},
		"latestEnd": engagementDates[].endDate | order(@ desc)[0],
		"reviews": *[_type == "review" && references(^._id)] {
			author,
			title,
			linkedIn,
			"slug": slug.current,
			body
		}
	} | order(latestEnd desc)
`)
