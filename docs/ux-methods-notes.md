# UX Methods notes

Improvements discovered while building **this** site that look applicable to
[`andybywire/ux-methods`](https://github.com/andybywire/ux-methods), collected so they are available
when that project is next iterated rather than re-derived.

The two projects are close relatives — same stack, same Sanity-plus-Astro shape, same static-plus-SSR
preview deploy — and `ux-methods` is the older of the two. CLAUDE.md cites it as the working
reference for the data layer, so **borrowing runs both ways**: patterns come from there, and fixes
found here should go back.

**This is not a task list and not a review of that repository.** It records only findings that arose
from work done here, with enough mechanism that each one can be acted on without reconstructing the
reasoning.

**On confidence.** Findings below are marked as either *read* (verified by reading the file in that
repo) or *carried* (described in this project's CLAUDE.md, not independently checked). The
distinction matters, because a `carried` item may already be fixed there.

## The `loadQuery` wrapper discards the types TypeGen generates — *read*

This is the one worth acting on first, because `ux-methods` **already runs TypeGen**
(`gen:types: sanity typegen generate`, wired as a `predev` hook) and then throws the result away at
every call site. The cost is invisible: nothing errors, types just quietly become `any`.

`astro/src/sanity/lib/load-query.ts` currently reads:

```ts
export async function loadQuery<QueryResponse>({
  query,
  params,
}: {
  query: string
  params?: QueryParams
})
```

**The mechanism.** TypeGen does not annotate call sites. It emits a module augmentation on
`@sanity/client` populating an otherwise-empty `SanityQueries` interface, **keyed by the query's
literal text**:

```ts
declare module '@sanity/client' {
  interface SanityQueries {
    '*[_type == "method"]{...}': MethodResult
  }
}
```

The client's own `fetch` is declared `fetch<R, Q, const G extends string>(query: G, ...)` returning
`ClientReturn<G, R>`, where `ClientReturn<GroqString, Fallback> = GroqString extends keyof
SanityQueries ? SanityQueries[GroqString] : Fallback`. So the lookup key **is** the literal type of
the query string, and the `const` modifier on `G` is what stops TypeScript widening it to `string`.

Declaring the parameter as `query: string` erases that key before the lookup happens. `ClientReturn`
then falls through to its fallback, which is the client's internal `any` alias. Taking the result
type as a caller-supplied `<QueryResponse>` compounds it: the value is `any`, and the annotation is a
hand-written promise that nothing checks against the actual projection.

**The fix, and it does not touch call sites.** Verified here: `const` inference survives an object
parameter, including through a real call rather than only an explicit type argument. So the object
call shape `loadQuery({query, params})` can stay exactly as it is — only the generic changes.

```ts
export async function loadQuery<const Q extends string>({
  query,
  params,
}: {
  query: Q
  params?: QueryParams
})
```

**One adaptation needed.** `ux-methods` fetches with `filterResponse: false` and returns
`{data, sourceMap, perspective}`, which this site does not. Do not copy this site's return type
wholesale — the typed result lands on the raw response's `result` property there, so the return
annotation has to thread `ClientReturn<Q>` through to `data` while keeping `sourceMap`. Worth
checking against the `filterResponse: false` overload rather than assuming.

**How to prove it either way.** A type-level probe is faster than inspecting inferred types by hand,
and needs no schema. Stand in for TypeGen with a hand-written `SanityQueries` entry, then assert the
result is neither `any` nor merely assignable:

```ts
type Expect<T extends true> = T
type IsAny<T> = 0 extends 1 & T ? true : false
type IsExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
```

Include the negative control — assert `IsAny<ClientReturn<string>>` — or the passing assertions prove
nothing, since a lookup that resolved unconditionally would satisfy them too.

## Environment variables are read by hand where `astro:env` would type them — *read*

Already noted in this project's CLAUDE.md as an improvement to make here; it applies there too.

`load-query.ts` reads `import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === 'true'`, then
reaches for the token through a fallback chain across `import.meta.env` and `process.env` with a
string coercion and an emptiness check. Declaring an `env.schema` in `astro.config.mjs` with
`envField` replaces all of it: `envField.boolean` removes the `=== 'true'` comparison, and
`envField.string({context: 'server', access: 'secret'})` removes the chain, the coercion and the
guard, because a secret server field is validated where it is declared.

**The one place `astro:env` cannot reach** is `astro.config.mjs` itself, which runs before Astro
loads `.env`. Config-time values — the Sanity integration's `projectId` and `dataset` — still need
Vite's `loadEnv`. That is a genuine platform constraint, not a shortcut, and it is worth a comment in
whichever file keeps it.

## Three mode flags where one would do — *read*

`package.json` there sets `ASTRO_OUTPUT`, `ASTRO_SITE_MODE` and
`PUBLIC_SANITY_VISUAL_EDITING_ENABLED` across four script entries, in combinations that have to be
kept consistent by hand.

They are not independent. Static output, the production host and visual-editing-off always travel
together, as do server output, the preview host and visual-editing-on. Three booleans expose eight
combinations of which two are meaningful, and the other six are only reachable by typo.

This site collapses them to a single `PUBLIC_SITE_MODE` of `production | preview`, and derives output
target, canonical host and adapter from it in `astro.config.mjs`. If a static preview build ever
turns out to be wanted, splitting `ASTRO_OUTPUT` back out is the escape hatch — but it should be
split deliberately, not by default.

## Fail once at module load, not per query — *read*

The token check there lives inside `loadQuery`, so it re-runs per call and reports on first fetch. A
missing token in a preview build is a configuration error, not a runtime condition, so failing at
module load surfaces it before any content is fetched.

The failure mode this guards against is the quiet one: published content on a public dataset reads
anonymously, so a preview build with no token **succeeds** and renders only published content. It
looks like it works, which is exactly what makes it expensive.

## Fragments can be split across files — resolved, so the query file can be broken up

`sanity.queries.ts` keeps projection fragments in the same file as the queries that interpolate them,
which is the only arrangement it proves. This site put fragments in a separate module, requiring
TypeGen to resolve **imported** string constants rather than local ones.

**Verified working in phase 1 here.** Every field from three separate imported fragments landed in the
generated types, with the result union correctly discriminated on `_type`. So `ux-methods` can split
`sanity.queries.ts` per document type or route whenever that file becomes unwieldy, without losing
type generation.

The mechanism worth knowing, because it is quiet when broken: it works because the fragments are
`const` string literals, so the interpolated template resolves to a single literal type — and that
literal is exactly the key TypeGen writes into `SanityQueries`. A fragment assembled at runtime, or
typed as `string` rather than left literal, breaks the chain and silently yields `any` while still
looking correct.

## Runtime and CI items — *carried*

Recorded in this project's CLAUDE.md from an earlier reading, not re-checked here, and worth
confirming before acting:

- **Both deploy workflows pin Node 22, and the preview deploy script does `nvm use 20`.** Node 20
  reached end of life in April 2026, so that is an unsupported runtime rather than merely an old one.
- **Both workflows trigger on identical paths**, so every push builds twice.
- **The droplet gains a dependency on Node, pnpm and PM2 surviving reboots** once an SSR preview runs
  under a supervised process.

## Dependency pins — *read*

`@sanity/client` is pinned `^7.20.0` there. `@sanity/visual-editing@6` peers on `^7.26.2`, so a
visual-editing upgrade will want the client moved up within v7. Worth noting that v8 exists but that
both `@sanity/astro` and `@sanity/visual-editing` still peer on v7, so v7 is the compatible ceiling
for now rather than a lag to fix.
