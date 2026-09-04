import {defineQuery} from 'groq'
import {DATES, IDENTITY, IMAGE, TAXONOMY} from '../fragments'

/**
 * The Home page's content bands.
 *
 * Query names must be globally unique: TypeGen keys generated types by variable name and
 * will silently overwrite a duplicate defined in another file.
 */

/**
 * The Genre scheme, flat, for the caller to walk.
 *
 * ── WHY THE HIERARCHY COMES BACK UNRESOLVED ─────────────────────────────────
 *
 * Home splits its Insights band by where a genre sits in the taxonomy: Articles are the
 * Document subtree MINUS the Note subtree, Notes are the Note subtree. Neither set can be
 * written as a GROQ filter, because SKOS `broader` is a chain of arbitrary depth and GROQ
 * has no transitive traversal — `broader[]._ref` reaches one level and stops.
 *
 * The alternative is hardcoding the depth: "children of Document, plus children of those".
 * That works on today's two levels and silently drops a genre the day a third appears,
 * which is exactly the kind of quiet wrong answer Andy asked this band NOT to have. So the
 * concepts come back flat with their parent refs and lib/genres.ts walks them, where the
 * walk can be depth-agnostic and can be reasoned about.
 *
 * ── IT RETURNS EVERY CONCEPT, INCLUDING THE TOPIC SCHEME'S ──────────────────
 *
 * ~70 rows of three small fields. Filtering to the Genre scheme is not possible here for
 * the same reason the partition is not: membership is the transitive closure of `broader`
 * from a top concept, which is the thing the walk computes. Starting the walk from
 * Document means the Topic concepts are simply never reached.
 *
 * `topConcepts` is matched on the scheme's TITLE. That is a real dependency on a string an
 * editor can rename, and it is accepted rather than swapped for the scheme's `_id`: an id
 * is opaque and would be worse to debug. lib/genres.ts fails loudly if Document is not
 * found rather than rendering an empty band.
 */
export const GENRE_TREE_QUERY = defineQuery(`
	{
		"topConcepts": *[_type == "skosConceptScheme" && title == "Genre"][0].topConcepts[]->{
			_id,
			prefLabel
		},
		"concepts": *[_type == "skosConcept"]{
			_id,
			prefLabel,
			"broader": broader[]._ref
		}
	}
`)

/**
 * The author's photo, for the representative h-card's `u-photo`.
 *
 * ── IT IS FETCHED BY HOME, NOT BY THE MASTHEAD ─────────────────────────────
 *
 * The masthead renders on all 46 pages and only ONE of them carries the representative
 * h-card, so putting this query in the component would mean 45 pages fetching a settings
 * field to throw it away. The page that needs it asks for it.
 *
 * `authorImage` and `authorName` were added to `settings` in phase 4 specifically for
 * this, and have been waiting since — see CLAUDE.md, which files the h-card under the
 * home page rather than under phase 8's microformats work.
 *
 * `authorName` is projected but NOT rendered. The masthead's `p-name` marks up the
 * wordmark, which is visible text, and swapping it for a CMS value would move a heading
 * a reader sees into a field they cannot check. It comes back so the page can assert the
 * two agree, which is the only useful thing to do with it here.
 */
export const HOME_AUTHOR_QUERY = defineQuery(`
	*[_type == "settings"][0]{
		authorName,
		"authorImage": authorImage{asset, crop, hotspot, altText}
	}
`)

/**
 * The Topics band's two lists — genres and topics, each with how much content carries it.
 *
 * ── BOTH ARE FILTERED BY USE, WHICH IS THE BAND'S WHOLE PREMISE ────────────
 *
 * The band points a reader at where the writing is, so a concept nothing is tagged with
 * has nothing to show them. Genres come back with their counts and the page drops the
 * empty ones; topics are filtered here, because 33 of roughly 70 concepts are in use and
 * returning the rest would be payload the page throws away.
 *
 * That difference is deliberate rather than inconsistent: the genre list is small and
 * bounded by `$documentGenres`, so its counts are worth having in the page for the
 * assertion that Document itself carries nothing. The topic list is neither.
 *
 * ── THE COUNT IS COMPUTED TWICE IN THE TOPICS QUERY ────────────────────────
 *
 * Once to filter, once to project. GROQ has no way to bind a subquery result and reuse it
 * in the same projection, so the alternative is returning every concept and filtering in
 * the page — trading a duplicated expression for a payload of nulls. At build time and at
 * this size the duplicate is the cheaper mistake to make.
 *
 * ── `genre._ref` FOR GENRES, `^._id in topic[]._ref` FOR TOPICS ────────────
 *
 * Not a stylistic difference. `genre` is a single reference, so the document's field is
 * compared to the concept; `topic` is an ARRAY of references, so the concept is looked for
 * inside it. Writing the second like the first silently matches nothing.
 */
export const HOME_TAXONOMY_QUERY = defineQuery(`
	{
		"genres": *[_type == "skosConcept" && _id in $documentGenres]{
			prefLabel,
			"count": count(*[
				_type in ["article", "caseStudy", "note"] && genre._ref == ^._id
			])
		},
		"topics": *[
			_type == "skosConcept"
			&& count(*[_type in ["article", "caseStudy", "note"] && ^._id in topic[]._ref]) > 0
		]{
			prefLabel,
			"count": count(*[
				_type in ["article", "caseStudy", "note"] && ^._id in topic[]._ref
			])
		}
	}
`)

/**
 * The two lists the Insights band renders, newest first.
 *
 * ── THE GENRE SETS ARE PARAMETERS, NOT A FILTER WRITTEN HERE ────────────────
 *
 * `$articleGenres` and `$noteGenres` are the concept ids lib/genres.ts resolved from the
 * tree above. That is what makes the band taxonomy-driven rather than type-driven: add a
 * genre under Document, tag something with it, and it appears in Articles with no code
 * change. Add one under Note and it appears in Notes.
 *
 * The four documents that were `article` carrying Presentation-branch genres are the proof
 * this matters — a type filter would have listed them among Articles, where the genre sets
 * exclude them by construction. They are unpublished now, but the shape of the mistake is
 * what the partition is defending against.
 *
 * ── THE TYPE LIST IS STILL HERE, AND IT IS ABOUT URLs, NOT GENRE ────────────
 *
 * `_type in ["article", "caseStudy", "note"]` is not a second, competing partition. It is
 * the set of documents that live under `/insights/`, and the caller builds that href. A
 * future type carrying a Document-branch genre would need its own route before it could
 * appear in a list that links this way, so the constraint keeps the href honest rather
 * than restating what `genre` already decides.
 *
 * ── THE COUNTS ARE PARAMETERS SO THE PAGE OWNS THEM ─────────────────────────
 *
 * `[0...$n]` accepts a variable — verified against production-26 rather than assumed. The
 * page states 4 and 5 in its frontmatter, which is where Andy asked the tuning to live:
 * visible when reading the template, and not a CMS field, because nobody needs to change
 * it from the Studio.
 *
 * The projection is INSIGHTS_INDEX_QUERY's, because the cards are the same cards. Both
 * type-specific fields are safe on every member: GROQ returns null for an attribute path a
 * document does not have, and TypeGen discriminates them on `_type`.
 */
export const HOME_INSIGHTS_QUERY = defineQuery(`
	{
		"articles": *[
			_type in ["article", "caseStudy", "note"]
			&& defined(slug.current)
			&& genre._ref in $articleGenres
		] | order(pubDate desc)[0...$articleCount] {
			${IDENTITY},
			${DATES},
			${TAXONOMY},
			title,
			shortDescription,
			heroImage { ${IMAGE} }
		},
		"notes": *[
			_type in ["article", "caseStudy", "note"]
			&& defined(slug.current)
			&& genre._ref in $noteGenres
		] | order(pubDate desc)[0...$noteCount] {
			${IDENTITY},
			${DATES},
			${TAXONOMY},
			title,
			shortDescription,
			clipRef { publisher }
		}
	}
`)
