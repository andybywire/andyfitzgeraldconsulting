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
 * specific first: the document's own `customBands`, then the page-type `overrideBands` in
 * Settings, then Settings' `defaultBands`. `coalesce()` IS that ladder; there is no
 * template logic and no precedence rule written twice.
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
 * RE-RUN AGAINST THE PUBLISHED PERSPECTIVE AFTER THE 2026-09-04 RENAME, and the same
 * three keys came back. Worth doing rather than assuming: a field rename is precisely the
 * change that makes a rung read a missing field, return null and fall quietly to the next
 * one — the table would still have LOOKED right, because every rung resolves to something.
 * The article's `d58afffb05e2` is the tell, since only the override rung can produce it.
 *
 * SINGLETONS NEED NO SPECIAL CASE. Settings offers no override tier for them — each is a
 * unique layout by definition — and that falls out for free, because a singleton simply
 * matches no `bandOverrides` entry and drops to the default.
 *
 * THREE FRAGMENTS RATHER THAN ONE BUNDLE. Which bands a page carries is expected to
 * change, and a page composes only the ones it renders; bundling all three would make
 * every page pay up to six Settings lookups for bands it never shows.
 */

/**
 * ── THE THREE RUNGS NOW NAME THEMSELVES ────────────────────────────────────
 *
 *     customBands     the document's own
 *     overrideBands   its type's, from Settings
 *     defaultBands    the site's, from Settings
 *
 * Which is the precedence order in three words, and is the point of the renaming done on
 * 2026-09-04. Before it, all three were `bands` and the ladder could only be read by
 * tracing which object each subscript hung off.
 *
 * THE ALTERNATIVE WAS `customBands` EVERYWHERE, and it was rejected on purpose. It is
 * literally consistent and semantically wrong: Settings' defaults are the least custom
 * thing in the system, and naming them `customBands` would have restored the ambiguity
 * under a longer name. Consistency here means each array says what it is, not that they
 * all say the same thing.
 *
 * Every rename made a field's `name` agree with a `title` it already carried — "Custom
 * Bands" on the five document types, "Default Bands" and "Page Type Bands" in Settings —
 * so this corrected the keys to the model rather than changing the model.
 */
/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │  THE LADDER IS WRITTEN OUT PER BAND, THREE TIMES, ON PURPOSE.                │
 * │  DO NOT FOLD IT BACK INTO A `LADDER(band)` HELPER — A FUNCTION CALL IN A      │
 * │  TEMPLATE LITERAL COSTS EVERY QUERY BUILT FROM IT ITS TYPE.                   │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *
 * There WAS such a helper, from the day the ladder was written until 2026-09-07, and
 * every query built through it was typed `any` for that whole time. The note here argued
 * it was harmless because TypeGen's parser evaluates the module and still sees a single
 * string literal — which is true, and is exactly what hid the fault: TypeGen generated a
 * correct `_RESULT` type for each of these queries. The types were right the whole time.
 * Nothing was looking them up.
 *
 * ── THE MECHANISM ──────────────────────────────────────────────────────────────
 *
 * `loadQuery` is typed `ClientReturn<Q>`, a lookup into TypeGen's `SanityQueries` map
 * keyed by the query's LITERAL TEXT. TypeScript does not evaluate a function call inside a
 * template literal, so `${LADDER('bandRss')}` widened the query's type from a literal to
 * `string`, the map lookup missed, and the result came back `any`.
 *
 * Interpolating a const whose initialiser is a plain literal is completely fine — the
 * literal type survives — which is why `${IMAGE}`, `${DATES}`, `${IDENTITY}` and
 * `${TAXONOMY}` have always cost nothing and are not the same hazard.
 *
 * So the distinction is not "no interpolation" but:
 *
 *     A GROQ FRAGMENT MAY BE A `const`, NEVER A FUNCTION.
 *
 * ── HOW IT WAS FOUND, AND HOW TO CHECK IT AGAIN ────────────────────────────────
 *
 * By probe, with a control, because a green `astro check` proves nothing here — an `any`
 * result type-checks perfectly. A deliberate bogus property on `INSIGHT_RSS_BAND_QUERY`'s
 * result raised nothing while the same line against `INSIGHT_DETAIL_QUERY` raised
 * ts(2339). One subject, one control, opposite results.
 *
 * It surfaced sideways: the helper was rebuilt as `PAGE_LADDER` for the `page` template's
 * two bands, and probing THAT change is what exposed the original. Worth remembering that
 * the fault had been shipping silently for weeks and was found by accident.
 *
 * ── WHAT THIS COSTS ───────────────────────────────────────────────────────────
 *
 * Three copies of the precedence rule instead of one, which is a real loss — the whole
 * point of the helper was that the ladder is a single idea. It buys three typed queries,
 * and that is the better side of the trade: preserving these types is the reason band
 * projections are split into their own queries at all, so a DRY ladder that untypes them
 * defeats the arrangement it lives inside.
 *
 * IF THE LADDER CHANGES, IT CHANGES IN THREE PLACES. That is the maintenance burden this
 * accepts. The rungs are documented once, above, rather than three times.
 */
export const BAND_RSS = /* groq */ `
	"rssBand": coalesce(
		customBands[_type == "bandRss"][0],
		*[_type == "settings"][0].bandOverrides[documentType == ^._type][0].overrideBands[_type == "bandRss"][0],
		*[_type == "settings"][0].defaultBands[_type == "bandRss"][0]
	){title, message, buttonTarget}
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
	"workBand": coalesce(
		customBands[_type == "bandWorkWithMe"][0],
		*[_type == "settings"][0].bandOverrides[documentType == ^._type][0].overrideBands[_type == "bandWorkWithMe"][0],
		*[_type == "settings"][0].defaultBands[_type == "bandWorkWithMe"][0]
	){
		message,
		"clientLogos": clientLogos[]->{
			name,
			"image": tile{asset, crop, hotspot, altText},
			"caseStudy": *[_type == "caseStudy" && client._ref == ^._id]
				| order(pubDate desc)[0].slug.current
		}
	}
`

/**
 * ── `bandCopy` DECIDES WHETHER THE BAND SPEAKS FOR ITSELF ────────────────────
 *
 * The band is one component in two modes. With `bandCopy` true it carries its own h2 and
 * message above the form — what every page appending it gets from the Settings default.
 * With it false the form stands alone, because the HOST PAGE's title and lede are already
 * doing that work. Contact is the case it was added for: its `page` document sets false,
 * and its board (2562:2663) draws the component 451 tall with no heading.
 *
 * IT IS READ AS PLAIN TRUTHINESS ON THE FRONT END, AND THAT IS ONLY SAFE BECAUSE THE DATA
 * WAS FIXED. `initialValue: true` applies to objects created after the field existed, and
 * the Settings default band predates it — so it sat `null`, which would have given every
 * page falling through to the site default a heading-less, message-less band. The inverse
 * of the intent, and silent. Andy toggled it on in the Studio on 2026-09-04; re-verified
 * against production-26 before this fragment was written.
 *
 * A `!== false` guard would have papered over that and made the stored value a lie. The
 * fix belonged in the data, and that is where it went.
 *
 * ── NO CONSUMER TODAY, BUT ONE TYPE CAN STILL ACQUIRE ONE ───────────────────
 *
 * No query composes this fragment. Both documents rendering a Get in Touch band —
 * Consulting and Contact — are `page`s, and a `page` resolves through
 * `PAGE_BAND_GET_IN_TOUCH` instead, which carries the `pageBands` opt-in gate and two
 * rungs rather than three. Two fragments project the same BAND TYPE for different
 * DOCUMENT types; do not conflate them.
 *
 * It is kept because `singleton` can carry this band — its `customBands` offers all three
 * types (checked in the schema, 2026-09-07) — so Home, Insights, Reviews or Presentations
 * could compose this tomorrow. That is a real prospective consumer rather than a guess,
 * and it is the whole reason this is not dead code.
 *
 * The other three types cannot reach it: `article` and `note` offer only `bandRss`, and
 * `caseStudy` only `bandWorkWithMe`. So a Get in Touch band on anything but a `page` or a
 * `singleton` is not a state the schema can express.
 *
 * IT IS UNPROBEABLE UNTIL THEN — there is no query whose result type can be checked — so
 * whichever singleton composes it first should be probed at that point rather than
 * trusted. The ladder text here is hand-transcribed like the other two and has never been
 * exercised.
 */
export const BAND_GET_IN_TOUCH = /* groq */ `
	"touchBand": coalesce(
		customBands[_type == "bandGetInTouch"][0],
		*[_type == "settings"][0].bandOverrides[documentType == ^._type][0].overrideBands[_type == "bandGetInTouch"][0],
		*[_type == "settings"][0].defaultBands[_type == "bandGetInTouch"][0]
	){message, bandCopy}
`

/**
 * ── A `page` RESOLVES ITS BANDS DIFFERENTLY, AND `LADDER` CANNOT SERVE IT ────
 *
 * `LADDER`'s whole virtue is that one fragment serves every document type, and `page` is
 * the one exception. The reason is the opt-in gate below and NOTHING ELSE — the field
 * names agree again.
 *
 * That is worth saying because it was briefly untrue. `page` introduced `customBands`
 * while the other four types still said `bands`, which would have made `LADDER` read a
 * missing field on a page and fall silently through to the Settings default. Andy renamed
 * the other four the same day rather than let two names for one thing survive, so this
 * fragment now differs from `LADDER` by exactly one idea instead of two.
 *
 * ── BANDS ARE OPT-IN PER PAGE, WHICH `LADDER` CANNOT EXPRESS ────────────────
 *
 * `pageBands` is an array of type names saying which bands this page carries AT ALL. A
 * band absent from it does not render even when Settings defines a default — which is the
 * inverse of `LADDER`, where the default always wins if nothing else does.
 *
 * The guard case Andy specified: a `customBands` entry whose type is NOT listed in
 * `pageBands` does not render. The gate is outermost, so that falls out rather than being
 * special-cased. Verified against production-26 — Work With Me and RSS both resolve to
 * null on the Contact page despite Settings defining defaults for both. Studio validation
 * to prevent the state is deferred; this degrades to "not shown", which is the safe way
 * round.
 *
 * ── TWO RUNGS, NOT THREE, AND BOTH REASONS WERE MEASURED ────────────────────
 *
 * The middle rung — `bandOverrides[documentType == ^._type]` — is deliberately absent:
 *
 *   1. `bandOverrides.documentType` offers only note, article and caseStudy, so `page` is
 *      not a selectable value and the rung could never match.
 *   2. `^._type` DOES NOT SURVIVE `select()`. Verified rather than reasoned about:
 *      `select(cond => ^._type)` returns null on a document whose `_type` is plainly
 *      "page". So the rung would silently never match even where it should.
 *
 * (2) is the one to remember. If this gate is ever extended to article, note or caseStudy
 * — which DO have override entries — the override tier will break silently. Test `^._type`
 * inside the `select()` before trusting it there.
 *
 * ── SHAPE NOTES ─────────────────────────────────────────────────────────────
 *
 * `coalesce(pageBands, [])` because `in` against a null array is not the false it looks
 * like. Contact carries the field; a page authored without it would not.
 *
 * `select()` with a single condition and no fallback yields null when the gate is closed,
 * and projecting onto null yields null. Both verified.
 *
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │  STAYS INLINE. A `PAGE_LADDER(band)` HELPER WAS BUILT AND ROLLED BACK.       │
 * │  DO NOT RE-EXTRACT IT — A FUNCTION CALL HERE COSTS THE QUERY ITS TYPE.       │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *
 * This note used to nominate its own extraction: "A second — Work With Me is the other
 * type `pageBands` offers — is this project's stated trigger for extracting it." The
 * Projects page made that two, the helper was written, and it broke both page band
 * queries silently. Measured on 2026-09-07, subject and control in one `astro check`:
 * with `PAGE_LADDER` interpolated, a deliberate bogus property on either band result
 * raised NOTHING, while the same line against `PAGE_QUERY` raised ts(2339) as it should.
 *
 * THE MECHANISM IS THE INTERPOLATED TYPE, NOT THE GROQ. `loadQuery` is typed
 * `ClientReturn<Q>`, a lookup into TypeGen's `SanityQueries` map keyed by the query's
 * LITERAL TEXT. Interpolating a const whose initialiser is a plain literal preserves that
 * literal type — which is why PAGE_QUERY types correctly with `${IMAGE}` folded in.
 * Interpolating a FUNCTION CALL cannot: TypeScript does not evaluate calls in template
 * literals, so the type widens to `string`, the map lookup misses, and the result is
 * `any`.
 *
 * TypeGen itself is not the problem and is what makes this so quiet: its parser evaluates
 * the module, so it generated a perfectly correct `_RESULT` type for each query. The types
 * exist and are right; nothing is looking them up.
 *
 * ── SO THE DUPLICATION BELOW IS BOUGHT, NOT OVERLOOKED ──────────────────────
 *
 * Two nearly identical gates, differing only in a band name, in exchange for two typed
 * queries. That is the correct side of the trade: preserving these types is the entire
 * reason the page's queries are split across three round trips in the first place, so
 * spending them on a DRY gate would be self-defeating.
 *
 * The general rule this leaves: A GROQ FRAGMENT MAY BE A `const`, NEVER A FUNCTION.
 * `LADDER` above is a function, which is a live instance of this same fault — see its own
 * note.
 */
export const PAGE_BAND_GET_IN_TOUCH = /* groq */ `
	"touchBand": select(
		"bandGetInTouch" in coalesce(pageBands, []) => coalesce(
			customBands[_type == "bandGetInTouch"][0],
			*[_type == "settings"][0].defaultBands[_type == "bandGetInTouch"][0]
		)
	){message, bandCopy}
`

/**
 * A `page`'s Work With Me band — the same opt-in gate, the same projection as
 * `BAND_WORK_WITH_ME`.
 *
 * ── WRITTEN OUT IN FULL, GATE AND PROJECTION BOTH ──────────────────────────────
 *
 * Neither half is shared with anything: not the gate, for the typing reason in the box
 * above, and not the `clientLogos` projection, which BAND_WORK_WITH_ME also writes. A
 * shared projection const WOULD be type-safe — it is a plain literal, unlike a function —
 * so that one is a readability call rather than a forced hand: extracting it would leave a
 * fragment existing only to be interpolated into two others, at which point the GROQ is
 * assembled from pieces none of which can be read on its own.
 *
 * See BAND_WORK_WITH_ME for what `tile`, `image` and the `caseStudy` subquery are doing
 * and why they are what they are.
 *
 * ── IT IS AN APPENDED BAND, WHICH GET IN TOUCH IS NOT ──────────────────────────
 *
 * Worth recording here because the two page bands differ in placement and the query gives
 * no hint of it: <WorkWithMeBand> owns its own <Band> and <Grid> at full bleed with
 * `tone="logo"`, so it is appended to the page stack, while <GetInTouchBand> owns no frame
 * and sits in the prose column as body content. That difference is also why Work With Me
 * stays out of the rail's "On This Page" — see the note in pages/[slug].astro.
 */
export const PAGE_BAND_WORK_WITH_ME = /* groq */ `
	"workBand": select(
		"bandWorkWithMe" in coalesce(pageBands, []) => coalesce(
			customBands[_type == "bandWorkWithMe"][0],
			*[_type == "settings"][0].defaultBands[_type == "bandWorkWithMe"][0]
		)
	){
		message,
		"clientLogos": clientLogos[]->{
			name,
			"image": tile{asset, crop, hotspot, altText},
			"caseStudy": *[_type == "caseStudy" && client._ref == ^._id]
				| order(pubDate desc)[0].slug.current
		}
	}
`
