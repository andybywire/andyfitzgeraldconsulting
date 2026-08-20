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
