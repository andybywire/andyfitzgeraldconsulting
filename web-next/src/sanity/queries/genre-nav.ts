import {defineQuery} from 'groq'

/**
 * Previous / next within a genre — the chips at the foot of a Genre-labeled detail
 * page.
 *
 * ── ITS OWN MODULE, BECAUSE IT BELONGS TO NO ONE ROUTE ───────────────────────
 *
 * `related.ts` is the precedent: a cross-type concern that no single route owns gets
 * its own file. This one serves `article`, `caseStudy` and `note` at `/insights/`
 * today and `presentation` at `/presentations/` when that type exists, so filing it
 * under either route would be wrong within a phase.
 *
 * Pages and singletons never call it. They carry no Genre concept at all — CLAUDE.md
 * makes that the testable disqualifier for `page` — so there is nothing to be the
 * previous or next of.
 *
 * ── IT RETURNS `older` AND `newer`, NOT `prev` AND `next` ────────────────────
 *
 * Deliberate, and the rename is the fix for a real defect rather than tidying. These
 * projections were called `prev` and `next`, with `prev` meaning OLDER — so the chip
 * labelled "Next" walked backwards through the index, toward the top of the page and
 * off the left of a LTR reading order. Andy caught it from using the site (2026-09-11);
 * it was the design's intent rather than a coding slip, which is why nothing here was
 * wrong, only misnamed.
 *
 * A date is a fact and a direction is a decision, so this query now reports only the
 * fact. Which one reads as "next" belongs to the page, where it is one visible line —
 * rather than buried in the direction of a `<` and a matching `| order()`, where
 * changing it means reading two clauses and trusting they agree.
 */

/**
 * ── THE TYPES ARE A PARAMETER, AND THAT IS THE POINT ─────────────────────────
 *
 * `_type in $types` rather than a hardcoded list, so the presentations route can pass
 * `["presentation"]` without a second copy of this query. GROQ takes an array
 * parameter directly on `in`, so nothing about it is clever.
 *
 * IT ALSO KEEPS THE URL HONEST. A genre can outlive the type it currently sits on:
 * four documents stored as `article` carry a Presentation genre today — three
 * *Interview* and one *Talk* — and they move to `presentation` when it exists. While
 * they are articles, an Interview's siblings are the other Interview articles, which
 * is correct. Once they move, `/insights/` stops passing types that hold that genre
 * and `/presentations/` starts. Nothing here has to change for that.
 *
 * `_type` is projected as one line of insurance against the case the parameter is
 * meant to prevent: a caller passing types from two routes at once would get results
 * needing two different URL bases, and this makes that detectable instead of
 * producing quietly wrong links.
 *
 * ── THE TIEBREAK, WHICH THE CURRENT DATA DOES NOT NEED ──────────────────────
 *
 * Ordering on `pubDate` alone is PARTIAL: two documents sharing a date are neither
 * before nor after each other, so `pubDate < $pubDate` excludes both and each loses
 * a link with nothing to indicate it. `_id` makes the order total.
 *
 * No genre has a date collision today — measured across all 45 documents, and the
 * three notes that DO share 2026-08-26 sit in three different genres, each of which
 * has exactly one document. But two Methods published on one day is an ordinary thing
 * for an editor to do, and the failure would be silent.
 *
 * The comparison and the sort have to agree, which is the part that would rot: the
 * `desc, desc` and `asc, asc` pairs below mirror their own `<`/`>` clauses. Change one
 * and change the other.
 *
 * ── DATES ARE `pubDate`, NEVER `_updatedAt` ─────────────────────────────────
 *
 * "First published, not revised" (Andy, 2026-09-02). `_updatedAt` would reshuffle the
 * sequence every time a typo was fixed, so a reader's "next" would depend on Andy's
 * editing history rather than on when things were written. `defined(pubDate)` guards
 * a document mid-edit out of the ordering rather than letting it sort as null.
 */
export const GENRE_NAV_QUERY = defineQuery(`
	{
		"older": *[
			_type in $types
			&& defined(slug.current)
			&& defined(pubDate)
			&& genre->prefLabel == $genre
			&& (pubDate < $pubDate || (pubDate == $pubDate && _id < $id))
		] | order(pubDate desc, _id desc)[0] {
			_type,
			"slug": slug.current,
			title
		},
		"newer": *[
			_type in $types
			&& defined(slug.current)
			&& defined(pubDate)
			&& genre->prefLabel == $genre
			&& (pubDate > $pubDate || (pubDate == $pubDate && _id > $id))
		] | order(pubDate asc, _id asc)[0] {
			_type,
			"slug": slug.current,
			title
		}
	}
`)

/**
 * The types that live at `/insights/{slug}/` — the Document branch as it stands.
 *
 * Exported so the route and any future caller pass the same list, rather than each
 * spelling it out. It deliberately matches `INSIGHT_SLUGS_QUERY`'s filter: a document
 * that gets a page on that route is exactly a document that can be a sibling in this
 * sequence, and the two drifting apart would mean a chip linking to a 404.
 */
export const INSIGHT_NAV_TYPES = ['article', 'caseStudy', 'note']
