/**
 * Shared projection fragments, composed into queries rather than repeated. A change to how a
 * document is addressed or dated then happens in one place instead of once per query.
 *
 * These are plain template strings, not `defineQuery()` calls: a fragment is not a query, and
 * TypeGen types whole queries. Interpolating one into a `defineQuery` template is what makes
 * it visible to TypeGen.
 *
 * VERIFY IN PHASE 1, when TypeGen is wired: that TypeGen resolves these across module
 * boundaries. ux-methods keeps its fragments in the same file as the queries that use them, so
 * cross-file resolution is the one part of this structure it does not prove. If types come back
 * as `any`, moving a fragment next to its queries is mechanical — but the whole point of the
 * split is that this site has far more document types than one file can hold.
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
 * `insightType` is the semantic-type vocabulary — it distinguishes kinds that share a single
 * structural Sanity type, so an `article` may be a Perspective where another is an Interview.
 * `topic` is the hierarchical topic vocabulary used for tag browsing and related content.
 *
 * Both vocabularies are designed properly in phase 4; this reflects the model as it stands.
 */
export const TAXONOMY = /* groq */ `
	"insightType": insightType->prefLabel,
	"topics": topic[]->prefLabel
`
