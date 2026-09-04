/**
 * Shared projection fragments, composed into queries rather than repeated. A change to how a
 * document is addressed or dated then happens in one place instead of once per query.
 *
 * These are plain template strings, not `defineQuery()` calls: a fragment is not a query, and
 * TypeGen types whole queries. Interpolating one into a `defineQuery` template is what makes
 * it visible to TypeGen.
 *
 * VERIFIED in phase 1: TypeGen resolves these across module boundaries. Every field from all
 * three fragments lands in the generated types, and the result union is correctly discriminated
 * on `_type`. It works because these are `const` string literals, so the interpolated template
 * resolves to a single literal type — which is also the key TypeGen writes into `SanityQueries`.
 * Keep them `const` and keep them literal: a fragment built at runtime would break the chain
 * silently, leaving the types `any` while still looking correct.
 */

/**
 * Identity and address. `slug` is flattened from Sanity's slug object to the string it wraps,
 * so nothing downstream has to know about `.current`.
 */
export const IDENTITY = /* groq */ `
	_id,
	_type,
	"slug": slug.current
`

/**
 * Dates. `pubDate` is authored and is what the site orders and displays by; `_updatedAt` is
 * maintained by Sanity and is the one to use for revision dates and sitemap timestamps.
 */
export const DATES = /* groq */ `
	pubDate,
	_updatedAt
`

/**
 * An image object, for the `<SanityImage>` / `<SanityHero>` contract.
 *
 * ── THE PROJECTION TRAP, WHICH IS SILENT ─────────────────────────────────────
 *
 * This has to project the OBJECT. `"heroImage": heroImage.asset->url` returns a
 * working URL that renders a working picture and DISCARDS CROP AND HOTSPOT — the
 * URL builder never sees them, so there is no error and nothing looks wrong. Every
 * framing decision an editor made is gone and the page still looks fine. That is
 * the whole reason this fragment exists rather than each query spelling it out.
 *
 * `asset` stays UNDEREFERENCED. The ref encodes the original's pixel dimensions —
 * `image-<hash>-<w>x<h>-<format>` — which is what lets image.ts avoid upscaling
 * without a metadata query, so `asset->` would cost a join and buy nothing.
 *
 * ── FIVE FIELDS, BECAUSE FIVE IS WHAT IS UNIVERSAL ───────────────────────────
 *
 * Every image field in this schema carries these. The presentational flags do NOT
 * generalize — `adjBright` is on both heroImages, `outline` on `figure` and
 * `afterImage`, `floatLeft` on the article's inline body image — so they belong at
 * the call site rather than here. Adding one would return null on most consumers
 * and read as a field that stopped working.
 *
 * ── DO NOT REACH FOR THIS ON A PORTABLE TEXT BODY ────────────────────────────
 *
 * The natural mistake, because a body is full of images. A bare `bodyText`
 * projection already returns every block WHOLE, image objects included, with
 * `asset`, `crop` and `hotspot` intact — verified in sanity.types.ts, where the
 * generated union carries all three. The trap applies to named image FIELDS
 * (`heroImage`, `beforeImage`, `afterImage`), not to blocks inside an array.
 */
export const IMAGE = /* groq */ `
	asset,
	crop,
	hotspot,
	altText,
	caption
`

/**
 * SKOS labels. Both fields are references, so both need dereferencing.
 *
 * `genre` is the semantic-type vocabulary — it distinguishes kinds that share a single
 * structural Sanity type, so an `article` may be a Perspective where another is a Method.
 * `topic` is the hierarchical topic vocabulary used for tag browsing and related content.
 *
 * Both vocabularies are designed properly in phase 4; this reflects the model as it stands.
 */
export const TAXONOMY = /* groq */ `
	"genre": genre->prefLabel,
	"topics": topic[]->prefLabel
`

/**
 * ── THE BAND LADDER ──────────────────────────────────────────────────────────
 *
 * Repeated bands — Work with Me, RSS, Get in Touch — resolve through three tiers, most
 * specific first: the document's own `bands`, then the page-type override in Settings,
 * then the Settings default. `coalesce()` IS that ladder; there is no template logic and
 * no precedence rule written twice.
 *
 * ONE FRAGMENT SERVES EVERY DOCUMENT TYPE, and the reason is `^._type`. Inside the
 * Settings subquery a single `^` steps back out to the document being projected, so the
 * override rung matches on whatever that document happens to be. No per-type copy, and
 * nothing to update when `presentation` arrives.
 *
 * VERIFIED AGAINST production-26 rather than reasoned about, because GROQ scope depth is
 * exactly the kind of thing that silently returns null. Discriminating on `_key` so the
 * rungs are distinguishable even where two tiers carry identical copy:
 *
 *                own    page-type      default        resolved
 *   article       -     d58afffb05e2   555d843d7484   d58afffb05e2   -> override
 *   note          -     -              555d843d7484   555d843d7484   -> default
 *   singleton     3 logos   -          (exists)       its own        -> document
 *
 * Also verified: `^.^` returns null, so one caret is right and not merely sufficient;
 * projecting onto a `coalesce()` result works; and nesting the call inside an object
 * literal does NOT shift the scope depth.
 *
 * SINGLETONS NEED NO SPECIAL CASE. Settings offers no override tier for them — each is a
 * unique layout by definition — and that falls out for free, because a singleton simply
 * matches no `bandOverrides` entry and drops to the default.
 *
 * THREE FRAGMENTS RATHER THAN ONE BUNDLE. Which bands a page carries is expected to
 * change, and a page composes only the ones it renders; bundling all three would make
 * every page pay up to six Settings lookups for bands it never shows.
 */

/** The document's own `bands`, then its type's override, then the site default. */
const LADDER = (band: string) => `
	bands[_type == "${band}"][0],
	*[_type == "settings"][0].bandOverrides[documentType == ^._type][0].bands[_type == "${band}"][0],
	*[_type == "settings"][0].bands[_type == "${band}"][0]
`

/**
 * `LADDER` is a function, which the note at the top of this file warns against — a
 * fragment built at runtime is invisible to TypeGen. These three are not: each is a
 * `const` whose initialiser is fully evaluated at module load, so what TypeGen's parser
 * sees is still a single string literal. The function only removes the copy-paste; it
 * never runs per query.
 */
export const BAND_RSS = /* groq */ `
	"rssBand": coalesce(${LADDER('bandRss')}){title, message, buttonTarget}
`

/**
 * `clientLogos` are references and have to be dereferenced.
 *
 * ── IT PROJECTS `tile`, NOT `logo` ───────────────────────────────────────────
 *
 * The two are different assets, not two sizes of one (Andy, 2026-09-01). `logo` is a
 * square 300x300 mark; `tile` is a 5:3 lockup — verified across the three clients in
 * the band, at 500x300, 1000x600 and 500x300, so the aspect is uniform even where the
 * pixel size is not. The band wants the lockup.
 *
 * Projected as `image` rather than under either field name, so the component depends on
 * "a picture of a client" and not on which Sanity field currently supplies it.
 *
 * Inline rather than through IMAGE: `client.tile` carries `altText` but no `caption`, so
 * the shared fragment would add a permanently-null field. (Worth noting IMAGE's claim
 * that "every image field in this schema carries these" does not hold for `client`.)
 *
 * ── `caseStudy` IS THE CLIENT'S MOST RECENT ONE, AS A SLUG ───────────────────
 *
 * The logos are links, and this is where they point. `^._id` steps out to the client
 * being projected, so the subquery asks "case studies for THIS client, newest first,
 * take one" — which is why WHO resolves to `who-ntd` (2021) rather than `who-kap`
 * (2020) without either being named here.
 *
 * Projected to the SLUG STRING, not an object: the band builds `/insights/{slug}/`
 * itself, and a one-field object would only be something to unwrap at the call site.
 *
 * NULL IS REACHABLE AND IS RENDERED, not guarded away. A client in this band with no
 * case study yet gets an unlinked logo rather than a link to nowhere — the band still
 * makes its point. Andy is adding Studio validation to stop the state arising; this
 * degrades honestly until it exists, and stays correct afterwards.
 */
export const BAND_WORK_WITH_ME = /* groq */ `
	"workBand": coalesce(${LADDER('bandWorkWithMe')}){
		message,
		"clientLogos": clientLogos[]->{
			name,
			"image": tile{asset, crop, hotspot, altText},
			"caseStudy": *[_type == "caseStudy" && client._ref == ^._id]
				| order(pubDate desc)[0].slug.current
		}
	}
`

export const BAND_GET_IN_TOUCH = /* groq */ `
	"touchBand": coalesce(${LADDER('bandGetInTouch')}){message}
`
