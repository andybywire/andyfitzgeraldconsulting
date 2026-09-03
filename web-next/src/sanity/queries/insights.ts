import {defineQuery} from 'groq'
import {BAND_RSS, DATES, IDENTITY, IMAGE, TAXONOMY} from '../fragments'

/**
 * Insights — `article`, `caseStudy` and `note`.
 *
 * They are queried together because they are one thing to a reader and are distinguished by
 * `genre` rather than by structural type. That is also why `/insights/` can stay as the shared
 * path while the Sanity types remain separate. (This said `insightType` until phase 4;
 * `genre` replaced it in phase 1 and TAXONOMY has projected `genre` since — the comment was
 * describing a field the query no longer reads.)
 *
 * Query names must be globally unique: TypeGen keys generated types by variable name and will
 * silently overwrite a duplicate defined in another file.
 */

/**
 * Index listing, newest first. Every document of all three types carries `slug`, `pubDate` and
 * `shortDescription`, so nothing here is conditional except the two type-specific fields.
 *
 * ── IT OVER-COLLECTS BY FOUR, AND THAT IS DELIBERATE ─────────────────────────
 *
 * `earley-ia-knowledge-graphs-and-ia`, `the-informed-life-structured-content` and
 * `content-strategy-insights-data-stories-meaning` carry genre *Interview*, and `cs-meetup`
 * carries *Talk* — all four are Presentation-branch genres stored as `article`. They move when
 * the `presentation` type exists. NOT filtered out here: a genre exclusion would hide the thing
 * that needs migrating and would go stale the moment the migration happened.
 *
 * ── TWO TYPE-SPECIFIC PROJECTIONS ────────────────────────────────────────────
 *
 * `heroImage` exists on `article` and `caseStudy`; `clipRef` only on `note`. GROQ returns null
 * for an attribute path a document does not have, so both are safe on every member of the union
 * and TypeGen discriminates them on `_type`.
 *
 * `clipRef { publisher }` keeps the nesting rather than flattening to `"publisher": …`, because
 * `bookRef` carries a `publisher` too — the book's, not the source's. A flat name would be one
 * word away from projecting the wrong one. It stays inline rather than becoming a fragment: one
 * consumer is not a fragment, the same rule tokens.css applies to values.
 */
export const INSIGHTS_INDEX_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy", "note"] && defined(slug.current)] | order(pubDate desc) {
		${IDENTITY},
		${DATES},
		${TAXONOMY},
		title,
		shortDescription,
		heroImage { ${IMAGE} },
		clipRef { publisher }
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
 *
 * The RSS band is NOT projected here — see INSIGHT_RSS_BAND_QUERY below, which exists
 * because folding it in silently untypes this one.
 *
 * ── `clipRef` AND `bookRef` ARE HERE, AND caseStudy's FIELDS ARE NOT ──────────
 *
 * That looks like the same situation twice with two answers, so the difference is worth
 * naming: it is not about field count, it is about whether the type is in the UNION.
 *
 * `note` IS one of the three types this query matches, so its body has to come from here
 * — there is nowhere else to get it — and once the type is in the union TypeGen
 * discriminates the projection on `_type`. The note member carries the object; the
 * article and caseStudy members carry `null`. Nothing is typed with a field it can never
 * use, which is precisely the objection to caseStudy's `atGlance` / `projectGoal` set:
 * caseStudy's own PAGE is item 4 in the phase 4 order and will have its own query, so
 * projecting those fields here would add five permanent nulls to every article for a page
 * that is not this one.
 *
 * The two refs discriminate the three note variants between them — Note has neither,
 * Clipping has `clipRef`, Book Note has `bookRef`. The page branches on which one is
 * present rather than on the genre label, matching NoteCard: genre is a SKOS prefLabel
 * and can be renamed in the Studio, and a ref either exists or it does not.
 *
 * `img` is projected INLINE rather than through IMAGE, following BAND_WORK_WITH_ME's
 * precedent — both refs' images carry `altText` but no `caption`, so the shared fragment
 * would add a permanently-null field. (IMAGE's claim that every image field in this schema
 * carries all five does not hold here either.)
 *
 * ── KEEP COMMENTS OUT OF THE QUERY STRING ────────────────────────────────────
 *
 * This note started inside the template literal and broke the build twice over. Backticks
 * around field names closed the JS string, and once those were removed a block comment
 * still left TypeGen unable to parse the query — which does not error. It silently emits no
 * result type, so `insight` becomes `any` and the only symptom is a scatter of
 * implicit-any complaints in the PAGE that consumes it. Annotate the query from out here.
 */
export const INSIGHT_DETAIL_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy", "note"] && slug.current == $slug][0] {
		${IDENTITY},
		${DATES},
		${TAXONOMY},
		title,
		shortDescription,
		description,
		lede,
		bodyText,
		heroImage { ${IMAGE} },
		clipRef {
			clipUrl,
			publisher,
			title,
			img { asset, crop, hotspot, altText }
		},
		bookRef {
			bookUrl,
			title,
			author,
			publisher,
			pubDate,
			img { asset, crop, hotspot, altText }
		}
	}
`)

/**
 * The RSS band for a detail page, fetched SEPARATELY — and the separation is forced.
 *
 * ── A FRAGMENT CAN SILENTLY UNTYPE THE QUERY IT IS ADDED TO ──────────────────
 *
 * Interpolating BAND_RSS into INSIGHT_DETAIL_QUERY produced a correct query, correct
 * results, and a correctly generated `INSIGHT_DETAIL_QUERY_RESULT` carrying `rssBand`.
 * It still broke the build — because `loadQuery` is typed as `ClientReturn<Q>`, a lookup
 * into TypeGen's `SanityQueries` map keyed by the query's literal text, and that
 * resolution has a complexity ceiling. Past it the lookup yields `any` instead of failing.
 *
 * The symptom points nowhere near the cause: `insight` becomes `any`, so the page reports
 * four `implicit any` errors on unrelated callback parameters — `block`, `topic`,
 * `heading` — and the query file itself looks clean. Verified by bisection: removing the
 * fragment restored the type and every one of those errors at once, leaving only the
 * expected "Property 'rssBand' does not exist".
 *
 * The article's `bodyText` union is already large enough that TypeScript truncates it when
 * printing; a second Portable Text array is what tips it over. **The key matched exactly**
 * — checked byte for byte against the generated file — so this is not the usual
 * stale-typegen mismatch, and re-running typegen does not help.
 *
 * Splitting it costs one small query and buys the type back. It also generalises: note and
 * presentation detail pages can reuse this without touching their own detail queries.
 */
export const INSIGHT_RSS_BAND_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy", "note"] && slug.current == $slug][0] {
		${BAND_RSS}
	}
`)

/**
 * THROWAWAY — delete with `src/pages/index.astro`, its only consumer.
 *
 * A review index for the specimen page. It exists because the interesting question while
 * reviewing phase 4 is not "what are the 42 documents" but "which ones exercise a serializer
 * that is not written yet" — so it reports the block types, block styles and decorators each
 * document actually uses, and the page turns those into badges.
 *
 * Computed live rather than hardcoded from a one-off query, so it cannot go stale as the data
 * or the serializer coverage changes. That is the whole reason it is a query and not a list.
 *
 * `coalesce(count(...), 0)` throughout: a caseStudy has no `bodyText` field at all, so
 * `count()` returns null there and `null > 0` would not be the false it looks like.
 */
export const INSIGHTS_REVIEW_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy"] && defined(slug.current)] | order(pubDate desc) {
		_type,
		"slug": slug.current,
		title,
		pubDate,
		"genre": genre->prefLabel,
		"blocks": coalesce(count(bodyText), 0),
		"blockTypes": array::unique(bodyText[]._type),
		"styles": array::unique(bodyText[_type == "block"].style),
		"hasNestedList": coalesce(count(bodyText[level >= 2]), 0) > 0,
		"hasUnderline": coalesce(count(bodyText[_type == "block" && "underline" in children[].marks[]]), 0) > 0,
		"hasInlineCode": coalesce(count(bodyText[_type == "block" && "code" in children[].marks[]]), 0) > 0,
		"hasHero": defined(heroImage.asset)
	}
`)

/** Slugs only, for `getStaticPaths`. Kept separate so the build does not fetch bodies twice. */
export const INSIGHT_SLUGS_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy", "note"] && defined(slug.current)] {
		"params": {"slug": slug.current}
	}
`)
