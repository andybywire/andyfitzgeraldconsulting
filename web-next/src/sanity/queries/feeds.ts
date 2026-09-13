import {defineQuery} from 'groq'
import {IDENTITY, TAXONOMY} from '../fragments'

/**
 * The queries behind the Atom feeds. Two document types, one query each.
 *
 * ── `article` AND `note` ONLY — CASE STUDIES ARE OUT OF EVERY FEED ─────────────
 *
 * Andy, 2026-09-13, after reading a built feed. A case study is five template-arranged
 * fields rather than prose, and syndicating it means rebuilding the template's own
 * headings; it read as a flattened form. `FEED_CASE_STUDIES_QUERY` and the `labelled()`
 * helper that went with it were deleted rather than commented out. See the header of
 * `pages/insights/feed.xml.ts` for the full reasoning.
 *
 * This retires the `caseStudy`-has-no-`bodyText` trap FOR THE FEEDS specifically —
 * nothing here projects those five fields any more. The trap itself is alive and well
 * everywhere else; `search.ts` still has to concatenate them.
 *
 * ── ONE QUERY PER TYPE, AND THE REASON IS NOW CONSUMERS, NOT THE CEILING ──────
 *
 * Worth being honest about, because the justification changed under it. The split was
 * written to stay under the `defineQuery` complexity ceiling: `article | caseStudy |
 * note` in one query meant six Portable Text arrays, and `case-studies.ts` records the
 * ceiling sitting right about there. With case studies gone that pressure is off —
 * `article | note` is three arrays across two types and would union comfortably.
 *
 * They stay split anyway, on a better reason: `/insights/feed-articles.xml` IS
 * `FEED_ARTICLES_QUERY` and `/insights/feed-notes.xml` IS `FEED_NOTES_QUERY`. Merging
 * them now would mean splitting them again in the next piece. The per-type shape is
 * what the remaining feeds are made of.
 *
 * ── BOTH WERE PROBED, WHICH IS THE ONLY THING THAT PROVES THEY ARE TYPED ───────
 *
 * 2026-09-13. A deliberate bogus property access on each result, with
 * `INSIGHT_DETAIL_QUERY` as the known-good control. Both raised ts(2339); so did the
 * control. Two subjects, one control, matching results.
 *
 * RE-PROBE BEFORE ADDING A FIELD TO EITHER. A green `astro check` proves nothing here —
 * past the ceiling `ClientReturn` yields `any` rather than failing, which is how the
 * LADDER defect survived for weeks.
 *
 * Query names must be globally unique: TypeGen keys generated types by variable name
 * and silently overwrites a duplicate defined in another file.
 */

/**
 * The 20 most recent, uniformly across every feed (Andy, 2026-09-13).
 *
 * Measured before choosing: the live 11ty feed — 34 entries, uncapped — is 481 KB raw
 * and 156 KB gzipped, re-fetched by every subscriber on every poll. Capped at 20 this
 * one is a third of that. Note the cap got MORE load-bearing when case studies left:
 * they were the two shortest documents in range, so dropping them pulled two long
 * articles up into the window.
 *
 * A `const` interpolated into the template, never a function. The distinction is the
 * one `fragments.ts` spells out at length: a const whose initialiser is a plain
 * literal keeps the query's literal type intact, so TypeGen's map lookup still hits.
 * A function call in the same position widens it to `string` and untypes the result.
 */
const FEED_LIMIT = '20'

/**
 * Taking each type's top 20 and merging is correct for an overall top 20: whatever a
 * type contributes to the combined newest 20 is necessarily within its own newest 20.
 * Up to 40 documents fetched to emit 20, which is the price of two typed queries.
 *
 * `defined(pubDate)` is in the filter because the ordering and both Atom timestamps
 * depend on it. 35 of 35 articles and notes carry one today — a guard, not a fix.
 */
export const FEED_ARTICLES_QUERY = defineQuery(`
	*[_type == "article" && defined(slug.current) && defined(pubDate)]
		| order(pubDate desc)[0...${FEED_LIMIT}] {
			${IDENTITY},
			${TAXONOMY},
			pubDate,
			title,
			shortDescription,
			lede,
			bodyText
		}
`)

/** No `lede` — that field exists only on `article` (30 of 30 carry one; 0 notes do). */
export const FEED_NOTES_QUERY = defineQuery(`
	*[_type == "note" && defined(slug.current) && defined(pubDate)]
		| order(pubDate desc)[0...${FEED_LIMIT}] {
			${IDENTITY},
			${TAXONOMY},
			pubDate,
			title,
			shortDescription,
			bodyText
		}
`)

/**
 * ── PRESENTATIONS CARRY `bodyText` + `highlights`, AND NOT MUCH ELSE ───────────
 *
 * Andy, 2026-09-13, decided with the measurements in hand. Worth recording them,
 * because they are the reason this projection looks so thin:
 *
 *   bodyText      130–922 chars across all 9
 *   highlights    198–472 chars, on 5 of 9 (absent on Interviews)
 *   transcript    19,410 and 31,337 chars, on 2 of 9
 *
 * ── WHAT IS LEFT OUT, AND WHY EACH ──────────────────────────────────────────
 *
 * `transcript` is EXCLUDED, and it is the interesting omission because it is real
 * prose and reads well in a reader. Two entries would be twenty to sixty times the
 * size of the other seven and would dominate `/feed.xml` outright. It is also a
 * record of one DELIVERY rather than the work itself, which is the distinction
 * `presentation` exists to draw.
 *
 * `eventDetail`, `presentationDeck` and the recordings are excluded for the reason
 * case studies were: they are not prose, they are structured metadata that the
 * detail template arranges under headings it supplies ("Venue(s)", "View Slides",
 * "Listen to the Interview"). Syndicating them means rebuilding that scaffolding in
 * the feed, which is exactly what read badly and got deleted. The entry links to the
 * page; the page is where a venue list and a player belong.
 *
 * `description` is the meta-description string and goes to `<summary>`, not to
 * content — `presentation` has no `shortDescription`, so it plays the card-copy role
 * here that `shortDescription` plays for articles and notes.
 */
export const FEED_PRESENTATIONS_QUERY = defineQuery(`
	*[_type == "presentation" && defined(slug.current) && defined(pubDate)]
		| order(pubDate desc)[0...${FEED_LIMIT}] {
			${IDENTITY},
			${TAXONOMY},
			pubDate,
			title,
			description,
			bodyText,
			highlights
		}
`)
