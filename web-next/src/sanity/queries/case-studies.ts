import {defineQuery} from 'groq'
import {BAND_WORK_WITH_ME, DATES, IDENTITY, IMAGE, TAXONOMY} from '../fragments'

/**
 * Case studies — the Document branch's third shape, and the one that shares almost
 * nothing with an article but its addressing.
 *
 * ── ITS OWN FILE, THOUGH IT SHARES THE /insights/ ROUTE ──────────────────────
 *
 * `INSIGHT_SLUGS_QUERY` already matches `caseStudy`, so these documents live at
 * `/insights/{slug}/` alongside articles and notes — unchanged, per
 * docs/urls-and-filtering.md. What is NOT shared is the projection: a case study has
 * no `bodyText` at all and instead carries five separate Portable Text fields, a
 * client, two comparison images and a review.
 *
 * CLAUDE.md's data-fetching note asks for queries split per document type rather than
 * one file per route, and this is the case that shows why: folding these fields into
 * `INSIGHT_DETAIL_QUERY` would give every article and note eleven permanently-null
 * fields, which is the objection that file's own header already records against
 * caseStudy's body fields.
 *
 * Query names must be globally unique: TypeGen keys generated types by variable name
 * and will silently overwrite a duplicate defined in another file.
 */

/**
 * One case study by slug.
 *
 * ── THE FIVE PORTABLE TEXT FIELDS ARE THE PAGE'S STRUCTURE ───────────────────
 *
 * `atGlance` is the summary paragraph beside the client logo — one block on all seven
 * documents. `whatDid` is a bullet list. The three `project*` fields are the sections
 * in article band 2, and each one CARRIES ITS OWN TITLE as its first block, styled
 * `h2` — the board's static label ("Project Goal") sits above content that begins
 * "Align Navigation and Home Page with User and Business Needs".
 *
 * So there is no separate heading field and none is wanted: the label is a string in
 * the template and the title is the first thing `<Prose>` renders. Verified across
 * all seven (2026-09-02).
 *
 * All five are projected BARE, per the note on IMAGE in fragments.ts: a Portable Text
 * array comes back whole, so its `figure` blocks keep their asset, crop and hotspot
 * without a projection, and adding one would only be a way to drop a block type by
 * omission.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ────────────────────────────────────────────
 *
 * `heroImage.adjBright` and the RSS band.
 *
 * `adjBright` is a live schema field with NO RENDERER anywhere in the build —
 * `SanityHero` does not read it and neither does `SanityImage`. It is true on exactly
 * one document. Projecting it would imply it does something; whether it should is a
 * design question, not a query one.
 *
 * There is no RSS band because `caseStudy.bands` accepts only `bandWorkWithMe`, and
 * the Figma board agrees — it carries the board's RSS CTA instance marked
 * `hidden="true"` and a Connect/Work with me band in its place.
 *
 * `outline` IS projected on `afterImage`, because `Figure` already reads that flag for
 * Portable Text figures and three of the seven after-images set it. `beforeImage` has
 * no such field in the schema, so it takes IMAGE alone.
 *
 * ── KEEP COMMENTS OUT OF THE QUERY STRING ────────────────────────────────────
 *
 * Backticks close the JS template literal, and a block comment inside it leaves
 * TypeGen unable to parse the query — which does not error. It silently emits no
 * result type, so the result becomes `any` and the only symptom is a scatter of
 * implicit-any complaints in the PAGE. Annotate from out here. (Learned twice on
 * INSIGHT_DETAIL_QUERY; recorded again because this file is the next place to try it.)
 */
export const CASE_STUDY_DETAIL_QUERY = defineQuery(`
	*[_type == "caseStudy" && slug.current == $slug][0] {
		${IDENTITY},
		${DATES},
		${TAXONOMY},
		title,
		shortDescription,
		description,
		client->{
			name,
			"image": tile{asset, crop, hotspot, altText}
		},
		heroImage { ${IMAGE} },
		atGlance,
		whatDid,
		projectGoal,
		beforeImage { ${IMAGE} },
		projectApproach,
		projectOutcome,
		afterImage { ${IMAGE}, outline },
		review->{
			author,
			title,
			"slug": slug.current,
			"employer": employer->name,
			condensedBody
		}
	}
`)

/**
 * The Work with Me band, fetched SEPARATELY — and the separation is not a preference.
 *
 * Interpolating a band fragment into a detail query has already broken this build
 * once: `loadQuery` is typed as `ClientReturn<Q>`, a lookup into TypeGen's
 * `SanityQueries` map keyed by the query's literal text, and that resolution has a
 * complexity ceiling. Past it the lookup yields `any` instead of failing, and the
 * symptom appears in the consuming PAGE as implicit-any errors on unrelated
 * callbacks. See INSIGHT_RSS_BAND_QUERY for the full account.
 *
 * The detail query above carries FIVE Portable Text arrays plus a sixth in the review,
 * where the article's one plus a band was already enough to tip it. So this is split
 * from the start rather than after being bisected.
 *
 * `BAND_WORK_WITH_ME` rather than `BAND_RSS`: see the note above on why a case study
 * has no RSS band. The fragment's own `^._type` handles the page-type override tier
 * without a per-type copy.
 */
export const CASE_STUDY_BAND_QUERY = defineQuery(`
	*[_type == "caseStudy" && slug.current == $slug][0] {
		${BAND_WORK_WITH_ME}
	}
`)
