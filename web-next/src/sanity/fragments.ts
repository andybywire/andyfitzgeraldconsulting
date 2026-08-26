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
