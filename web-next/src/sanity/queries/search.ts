import {defineQuery} from 'groq'
import {IDENTITY} from '../fragments'

/**
 * The four queries behind `/search.json` — the site-wide search index.
 *
 * ── FOUR QUERIES, NOT ONE, AND THE CEILING IS THE REASON ────────────────────
 *
 * Search reaches four document families, which makes one query spanning
 * `article | caseStudy | note | presentation | page | review` the obvious shape. It is
 * also precisely the shape insights.ts:133 records as tipping `ClientReturn` past its
 * complexity ceiling — past which the lookup yields `any` rather than failing, and
 * `astro check` stays green over a wholly untyped result.
 *
 * So the split is not caution, it is the house pattern: presentations.ts:92 splits one
 * document across five queries for the same reason. Four round trips at build time, on a
 * build that already makes dozens, buys four genuinely typed results.
 *
 * NOTHING HERE PROJECTS A PORTABLE TEXT ARRAY. `pt::text()` returns a string, so the
 * page's `lede` costs nothing — it is the unions that accumulate, and a flat projection
 * of scalars has none. That is what keeps all four comfortably inside the ceiling.
 *
 * ── PROBE BEFORE ADDING A FIELD TO ANY OF THESE ─────────────────────────────
 *
 * Bogus property access on the result, with a known-good query as the control. All four
 * were probed on creation. A green `astro check` proves nothing here.
 *
 * Query names must be globally unique: TypeGen keys generated types by variable name and
 * silently overwrites a duplicate defined in another file.
 */

/**
 * ── WHY `TAXONOMY` IS NOT REUSED ────────────────────────────────────────────
 *
 * That fragment projects `genre` and `topics` as prefLabels, which is what a card needs.
 * Search needs the altLabels too, and only search does — `urls-and-filtering.md:82` parks
 * them for exactly this surface: "altLabels stay in the vocabulary for eventual search
 * support, which is the surface where a synonym earns its keep."
 *
 * They are searchable text and never a chip. Rendering an altLabel as its own control
 * would put two controls with identical behaviour side by side, which is the decision at
 * `urls-and-filtering.md:75` and is unaffected by this.
 *
 * ── THE PARENTHESES ARE LOAD-BEARING. THIS IS presentations.ts:16 AGAIN ─────
 *
 * Measured against `structured-content-in-product-design`, whose four topics carry
 * `null`, `[]`, `[]` and `["Content Management"]` — three different empty shapes, because
 * an absent field and an empty array are not the same value:
 *
 *   topic[]->altLabel            [null, [], [], ["Content Management"]]
 *   topic[]->altLabel[]          [null, "Content Management"]     <- flatten keeps null
 *   topic[]->altLabel[][@ != null]   [null, "Content Management"]  <- FILTER DOES NOT APPLY
 *   (A + B)[@ != null]           ["Content Management"]           <- correct
 *
 * A filter written directly after a `[]` flatten is silently ignored; the same filter on
 * a parenthesized expression applies. So the concatenation is wrapped and filtered as a
 * whole. Without it every entry whose topics are partly untagged carries a `null` in its
 * synonyms, which the engine then indexes as a term with no string.
 *
 * `coalesce(…, [])` on each side separately because `genre->altLabel` is `null` — not
 * `[]` — when the concept has none, and `null + []` is not a concatenation.
 */
const SYNONYMS = /* groq */ `
	"synonyms": array::unique(
		(coalesce(genre->altLabel, []) + coalesce(topic[]->altLabel[], []))[@ != null]
	)
`

/**
 * ── `headings` AND `keywordSource`: TWO WAYS INTO THE BODY, NEITHER OF THEM IT ──
 *
 * Added 2026-09-13, after measuring that the index reached only card copy: "unique
 * identifiers", "scannable", "card sorting", "tree testing" and "wayfinding" all returned
 * nothing, though every one of them is discussed at length somewhere in the corpus.
 *
 * Shipping the bodies themselves was measured and declined — 389 KB raw / 134 KB gzipped
 * against 36 / 10 today, for a file fetched on a visitor's FIRST search. These two
 * projections cost 16 KB gzipped between them and recover most of the reach. See
 * `lib/keywords.ts` for what the second one becomes.
 *
 * `headings` is the document's own outline, and it is the highest-signal prose on the
 * page precisely because a heading is written to be scanned. 242 blocks / 6,010
 * characters across the whole corpus — the entire outline of everything published here
 * costs six kilobytes. Verified against `boutique-knowledge-graphs`, whose 14,056-body
 * reduces to ten clean headings.
 *
 * `keywordSource` IS FETCHED AND THEN DISCARDED. It never reaches `/search.json`; it is
 * the corpus `extractKeywords` computes TF-IDF over, and `buildSearchIndex` strips it.
 * Named for its purpose rather than after the field, so the next reader does not "fix"
 * the missing body in the output.
 *
 * ── `caseStudy` HAS NO `bodyText`, AND THAT FAILED SILENTLY FOR ONE BUILD ───
 *
 * The first version of this projected `pt::text(bodyText)` across all three types in the
 * union. `article` and `note` have that field; `caseStudy` does NOT — its prose lives in
 * five separate Portable Text fields (`atGlance`, `whatDid`, `projectGoal`,
 * `projectApproach`, `projectOutcome`). GROQ returns null for a field a type does not
 * have rather than complaining, so all seven case studies indexed on card copy alone and
 * the build stayed green. Caught by counting coverage in the built file — 35 of 42
 * insights had keywords, and the 7 missing were exactly the case studies.
 *
 * That is 31,547 characters of prose and 1,262 of headings that were invisible. The
 * lesson is not "remember caseStudy": it is that a projection over a UNION is only ever
 * as complete as the least-similar member, and nothing type-checks that.
 *
 * ── CONCATENATE THE BLOCK ARRAYS, THEN FLATTEN ONCE ─────────────────────────
 *
 * `pt::text(A + B)` rather than `pt::text(A) + " " + pt::text(B)`, and the difference is
 * not stylistic. Measured:
 *
 *   pt::text(bodyText[style in [...]])   -> null, not "", when nothing matches
 *   pt::text(a) + " " + pt::text(b)      -> null when EITHER side is null
 *
 * String concatenation propagates a null through the whole expression — `SYNONYMS`'s trap
 * in a different costume, an operator failing quietly instead of loudly. Concatenating
 * the ARRAYS first means one `coalesce(…, [])` per field and one `pt::text` at the end,
 * so there is no string in the expression for a null to poison. It also reads as what it
 * is: one document's prose, however many fields the schema spread it across.
 *
 * The style filter applies to a parenthesised ARRAY, not to a `[]` flatten, so it is NOT
 * the ignored-filter trap above. Confirmed rather than assumed, because the two spellings
 * look alike.
 */

/**
 * Every Portable Text field on the Document branch, as one array.
 *
 * `article` and `note` fill only `bodyText`; `caseStudy` fills only the other five. A
 * type that gains a prose field needs it added HERE, once, and both projections below
 * pick it up — which is the entire reason this is a fragment and not two literals.
 */
const INSIGHT_BLOCKS = /* groq */ `
	coalesce(bodyText, []) + coalesce(atGlance, []) + coalesce(whatDid, []) +
	coalesce(projectGoal, []) + coalesce(projectApproach, []) + coalesce(projectOutcome, [])
`

/**
 * The Document branch — 43 rows on 2026-09-13.
 *
 * `shortDescription` rather than `description`: insights.ts:57 records that the two are
 * different fields doing different jobs, and card copy is the right one for a result
 * list. `lede` is deliberately absent — it exists only on `article`, it is Portable Text,
 * and `shortDescription` is populated on all 42 where `lede` covers 30.
 *
 * `sourceDomain` is a Clipping's publisher, and it is what that row shows INSTEAD of a
 * description — board 1010:4670 draws "It's Only Obvious to You / Note / odonnellweb.com".
 * Null on everything else, which is the discriminator <NoteCard> already uses: its header
 * records that the layout branches on the PRESENCE OF A SOURCE rather than on the genre
 * label, because a genre is a SKOS prefLabel and could be renamed while `clipRef` either
 * exists or does not. RELATED_POOL_QUERY projects it the same way.
 *
 * `defined(slug.current)` rather than trusting the schema, matching INSIGHT_SLUGS_QUERY:
 * the field carries no `required` validation, and a slugless document would otherwise
 * generate an entry pointing at `/insights/null/`. Measured clean — 0 of 79 rows across
 * all four queries lack one on 2026-09-13 — which makes this a guard rather than a fix.
 */
export const SEARCH_INSIGHTS_QUERY = defineQuery(`
	*[_type in ["article", "caseStudy", "note"] && defined(slug.current)] {
		${IDENTITY},
		pubDate,
		title,
		shortDescription,
		"headings": pt::text((${INSIGHT_BLOCKS})[style in ["h2", "h3", "h4"]]),
		"keywordSource": pt::text(${INSIGHT_BLOCKS}),
		"sourceDomain": clipRef.publisher,
		"genre": genre->prefLabel,
		"topics": topic[]->prefLabel,
		${SYNONYMS}
	}
`)

/**
 * The Presentation branch — 9 rows.
 *
 * `description` and NOT `shortDescription`, which is the opposite of the query above and
 * is not an inconsistency: presentations.ts:135 records that `presentation` has
 * deliberately NO card-copy field, so `description` — the meta string — is the only
 * prose this type offers. All nine carry one as of 2026-09-13 — the gap this note used to
 * record (`information-architecture-for-digital-content`) was written by Andy, so it is off
 * phase 5's parity list.
 *
 * ── THE SUBSTANCE OF A PRESENTATION IS ITS TRANSCRIPT, NOT ITS BODY ─────────
 *
 * Measured across the nine: `bodyText` totals 3,809 characters and holds ZERO headings,
 * while `transcript` holds 50,747 across the two that have one. So `keywordSource` reads
 * both, and `headings` is projected anyway — it is empty on every row today, and it is
 * here because the schema permits headings in `bodyText` and the next presentation may use
 * them. An empty string is not a defect to go looking for.
 */
export const SEARCH_PRESENTATIONS_QUERY = defineQuery(`
	*[_type == "presentation" && defined(slug.current)] {
		${IDENTITY},
		pubDate,
		title,
		description,
		"headings": pt::text((coalesce(bodyText, []) + coalesce(transcript, []))[style in ["h2", "h3", "h4"]]),
		"keywordSource": pt::text(coalesce(bodyText, []) + coalesce(transcript, [])),
		"genre": genre->prefLabel,
		"topics": topic[]->prefLabel,
		${SYNONYMS}
	}
`)

/**
 * Website-generic scaffolding — 5 rows: About, Apologia, Consulting, Contact, Projects.
 *
 * ── NO TAXONOMY, AND THAT IS THE TYPE'S DEFINITION RATHER THAN AN OMISSION ──
 *
 * CLAUDE.md's disqualifier for `page` is testable: it carries no Topic and no Genre
 * concepts and never appears in an article listing. So these rows have no `genre`, no
 * `topics` and no synonyms, and the SYNONYMS fragment is not interpolated here.
 *
 * The observable consequence is worth knowing rather than discovering: selecting any
 * facet chip drops every page from the results, because a page matches no facet. Same for
 * reviews below. A facet narrows to tagged content, which is defensible — but it is the
 * kind of thing that only reads right or wrong on screen.
 *
 * ── `pt::text(lede)`, THE PROJECTION PAGE_QUERY ALREADY USES ────────────────
 *
 * `lede` IS the Portable Text on this type, the inverse of `singleton`, where `heroCopy`
 * is the Portable Text and `lede` is the flattened string. pages.ts:34 spells that
 * inversion out and warns against "fixing" either type to match the other. Flattened here
 * for the same reason it is flattened there: a search snippet is a string.
 *
 * ── `_updatedAt` FOR THE DATE, WHICH IS A DEPARTURE WORTH NAMING ────────────
 *
 * A `page` has no `pubDate` — it is not a dated work. Andy's call (2026-09-12) is to show
 * `_updatedAt`, matching the board's "Page | April 4, 2022". Note that fragments.ts:27
 * describes `_updatedAt` as the field for revision dates and sitemap timestamps, and
 * explicitly NOT the one the site orders and displays by. This is the one surface that
 * displays it, deliberately, because the alternative is a result row with no date at all.
 */
export const SEARCH_PAGES_QUERY = defineQuery(`
	*[_type == "page" && defined(slug.current)] {
		${IDENTITY},
		_updatedAt,
		title,
		"description": pt::text(lede)
	}
`)

/**
 * Reviews — 22 rows, each addressed as an individual unit.
 *
 * ── THEY POINT AT AN ANCHOR, NOT A PAGE, AND THE ANCHOR ALREADY EXISTS ──────
 *
 * `/reviews/#{slug}`, which is exactly what CaseStudyEntry.astro:370 builds for a
 * testimonial byline and what reviews.astro:184 renders as `<figure class="review"
 * id={review.slug}>`. So search reuses an addressing scheme rather than inventing one,
 * and reviews.astro:487 already carries the scroll-margin that makes landing on one look
 * right. A review has no page of its own and does not need one.
 *
 * ── `author` AND `employer`, NOT `title` ────────────────────────────────────
 *
 * `review.title` is the reviewer's JOB TITLE — "Art Director", "Chief Product Officer" —
 * which is not what anyone scans a result list for. The card composes
 * `{author} - {employer}` instead (board 2776:4929), so the organization is searched at
 * title weight: "World Health Organization" and "Elemeno" now find a review, which the
 * old build could not do.
 *
 * ── THE DATE IS THE LATEST ENGAGEMENT END, AND THE ENDS ARE UNORDERED ───────
 *
 * Andy's rule (2026-09-12): the month and year of the newest `endDate` among the
 * employer's engagements. `| order(@ desc)[0]` rather than `[-1]` because the array is
 * NOT stored in order — Shoreline Community College holds
 * `["2020-06-01", "2017-05-12"]`, so taking the last element would be wrong by three
 * years on a live row. ISO dates sort lexically, so the ordering is chronological.
 *
 * This is the same expression REVIEWS_BY_CLIENT_QUERY uses for `latestEnd`, which is why
 * it is written in GROQ here rather than taken in TS: one idiom for one rule, in both
 * places that need it.
 *
 * Coverage is total — 22 of 22 reviews have an `employer`, 22 of 22 employers have at
 * least one engagement, and zero engagements lack an `endDate` — so there is no fallback
 * to design. The generated type still admits null, and `<Eyebrow>` omits the `<time>` and
 * its leading separator when the date is absent, so a future gap degrades rather than
 * renders wrong.
 */
export const SEARCH_REVIEWS_QUERY = defineQuery(`
	*[_type == "review" && defined(slug.current)] {
		_id,
		_type,
		"slug": slug.current,
		author,
		excerpt,
		"employer": employer->name,
		"latestEnd": employer->engagementDates[].endDate | order(@ desc)[0]
	}
`)
