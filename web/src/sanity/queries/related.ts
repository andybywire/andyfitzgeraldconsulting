import {defineQuery} from 'groq'
import {DATES, IDENTITY, IMAGE} from '../fragments'

/**
 * The pool a "Related" band ranks over — every publishable document plus the Genre tree
 * needed to decide which of them are eligible.
 *
 * ── ONE QUERY, AND THE GENRE PARTITION RIDES ALONG ───────────────────────────
 *
 * Eligibility is a genre rule: an article's related list holds Document-branch genres
 * except the Note subtree, a note's holds the Note subtree, and a presentation's will hold
 * the Presentation branch. Resolving that needs the Genre scheme, and filtering the pool
 * needs the resolved ids — a dependency that would make two round trips per page.
 *
 * Fetching the scheme ALONGSIDE the unfiltered pool removes the dependency: both are
 * independent, so they travel together and `lib/related.ts` does the partition. The pool is
 * 45 rows of card data, which is small enough that filtering server-side would not pay for
 * the extra round trip. If it ever is, the cheap fix is a module-level cache — the pool is
 * identical for every page in a build.
 *
 * ── WHAT EACH TOPIC CARRIES, AND WHY `parentIsTop` IS PROJECTED ──────────────
 *
 * Ranking matches on the nearest common ancestor and refuses to let that ancestor be a TOP
 * concept: two mid-level tags under Engineering are not meaningfully related, where two
 * leaves under Evaluation are. Rather than ship the top-concept list and compare against
 * it, each topic reports whether its own parent is a top — which is true exactly when the
 * parent has no parent of its own. Self-contained, and one less thing to keep in step.
 */
export const RELATED_POOL_QUERY = defineQuery(`
	{
		"genres": *[_type == "skosConceptScheme" && title == "Genre"][0] {
			"tops": topConcepts[]->{_id, prefLabel},
			"concepts": concepts[]->{
				_id,
				prefLabel,
				"parent": broader[0]._ref
			}
		},

		"pool": *[
			_type in ["article", "caseStudy", "note", "presentation"]
			&& defined(slug.current)
			&& defined(pubDate)
		] | order(pubDate desc) {
			${IDENTITY},
			${DATES},
			title,
			shortDescription,
			"genreId": genre._ref,
			"genre": genre->prefLabel,
			heroImage { ${IMAGE} },
			"sourceDomain": clipRef.publisher,
			"topics": topic[]->{
				_id,
				"parent": broader[0]._ref,
				"parentIsTop": !defined(broader[0]->broader[0]._ref)
			},
			"poster": coalesce(
				poster,
				(eventDetail[]->eventRecordings[])[defined(poster)][0].poster
			) { ${IMAGE} },
			"venue": eventDetail[0]->{
				"name": event,
				"online": location.online,
				"city": location.city,
				"state": location.state,
				"country": location.country
			},
			"eventCount": count(eventDetail),
			"hasTranscript": defined(transcript),
			"hasDeck": defined(presentationDeck.asset),
			"recordingKinds": (eventDetail[]->eventRecordings[])[defined(kind)].kind
		}
	}
`)
