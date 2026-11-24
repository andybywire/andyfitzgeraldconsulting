import {defineQuery} from 'groq'
import {DATES, IDENTITY, IMAGE} from '../fragments'

/**
 * The pool a "Related" band ranks over — every publishable document plus the Genre tree
 * needed to decide which category each belongs to.
 *
 * ── ONE QUERY, AND THE GENRE PARTITION RIDES ALONG ───────────────────────────
 *
 * Category is a genre rule: Insights is the Document subtree of the Genre scheme, and
 * Presentations the Presentation subtree. Resolving that needs the Genre scheme, and filtering
 * the pool needs the resolved ids — a dependency that would make two round trips per page.
 *
 * Fetching the scheme ALONGSIDE the unfiltered pool removes the dependency: both are
 * independent, so they travel together and `lib/related.ts` does the partition. The pool is
 * 76 rows of card data (2026-11-23), which is small enough that filtering server-side would
 * not pay for the extra round trip. If it ever is, the cheap fix is a module-level cache — the
 * pool is identical for every page in a build.
 *
 * ── WHAT EACH TOPIC CARRIES, AND WHY `parentIsTop` IS PROJECTED ──────────────
 *
 * Ranking matches on the nearest common ancestor and refuses to let that ancestor be a TOP
 * concept: two mid-level tags under Engineering are not meaningfully related, where two
 * leaves under Evaluation are. Rather than ship the top-concept list and compare against
 * it, each topic reports whether its own parent is a top — which is true exactly when the
 * parent has no parent of its own. Self-contained, and one less thing to keep in step.
 *
 * ── A GENRE CONCEPT CARRIES ALL ITS PARENTS; A TOPIC ONLY ITS FIRST ─────────
 *
 * The ranker sorts genres into its two categories by walking the whole Genre tree with
 * lib/genres.ts's `subtree`, which reads every `broader` ref and has no depth limit. So a genre
 * concept projects `broader` whole.
 *
 * A topic projects only `broader[0]`, as `parent`, on purpose: the tiers relate two tags
 * through a concept's first parent alone (lib/related.ts). The two are different questions —
 * "is this genre anywhere under Document?" against "do these tags share a parent?" — not one
 * rule applied twice.
 *
 * Genre concepts projected a first `parent` too, for the branch rule the ranker replaced, which
 * walked two levels. It left with that rule (2026-11-23).
 */
export const RELATED_POOL_QUERY = defineQuery(`
	{
		"genres": *[_type == "skosConceptScheme" && title == "Genre"][0] {
			"tops": topConcepts[]->{_id, prefLabel},
			"concepts": concepts[]->{
				_id,
				prefLabel,
				"broader": broader[]._ref
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
