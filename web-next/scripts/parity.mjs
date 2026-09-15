/**
 * Content parity — does every published document still reach the site, intact?
 *
 * ── RUN BY HAND, AGAINST A FRESH BUILD ──────────────────────────────────────
 *
 *   pnpm --filter web-next build && pnpm --filter web-next parity
 *
 * The same arrangement as `subset-fonts.sh` and `phrase-candidates.mjs`: a person runs it
 * and a person reads it. Nothing in the build depends on it. Phase 8 owns automated quality
 * gates and this is a candidate to join them, which is why it exits with a real code — but
 * see the note on CI under EXIT CODES before wiring it to a deploy.
 *
 * ── WHY THIS EXISTS, WHICH DECIDES WHAT IT CHECKS ───────────────────────────
 *
 * The original migration plan held the design constant so the port could be DIFFED against
 * live production. That plan is gone: the design system is complete, it includes elements
 * the 11ty front end never had, and the content model changed. There is no longer an
 * automated way to prove the port is faithful, because it is not meant to be.
 *
 * So this replaces the diff. Not "does it look the same" but "does every document still
 * render, carrying everything it holds". A changed model quietly breaking a published
 * document is the failure mode that actually bites here, and it has bitten twice already.
 *
 * ── IT READS `dist/`, AND THAT IS THE WHOLE POINT ───────────────────────────
 *
 * A checker that only ran GROQ would be structurally blind to the class of bug this is
 * hunting. When `bodyText` was projected across the insight union, seven case studies came
 * back as perfectly valid results — `caseStudy` keeps its prose in five other fields — and
 * the build stayed green while the search index held card copy alone. The query SUCCEEDED.
 * Only the built output knows what actually rendered, so the built output is what we read.
 *
 * The cost is a dependency on a fresh build, and a stale `dist/` would answer confidently
 * and wrongly — worse than no checker, because it trains you to ignore the output. Hence
 * the staleness guard below, which refuses rather than guesses.
 *
 * ── RAW DOCUMENTS, NOT PROJECTIONS ──────────────────────────────────────────
 *
 * Every other query in this repo projects. This one deliberately does not, for two reasons:
 *
 *   1. A projection over a union is only as complete as its least-similar member — the trap
 *      above. Fetching whole documents cannot have that bug, because there is nothing to
 *      leave out.
 *   2. An audit that knew the field list would inherit the field list's staleness. The
 *      kickoff for this phase enumerated six reference fields; the schema actually declares
 *      eighteen, including three on `settings` and one nested inside a band object. Walking
 *      the JSON for `_ref` needs no schema knowledge at all and cannot drift.
 *
 * ── THE PUBLISHED PERSPECTIVE, ON PURPOSE ───────────────────────────────────
 *
 * Production builds from `published`, so that is the corpus whose parity matters. A
 * reference pointing at a document that exists only as a draft is genuinely dangling as far
 * as the static site is concerned, and should be reported as such rather than resolved away.
 *
 * ── EXIT CODES ──────────────────────────────────────────────────────────────
 *
 *   FAIL  exit 1  a document is missing, a reference dangles, two documents collide
 *   WARN  exit 0  something wants triage but is not a parity break
 *   INFO  exit 0  expected mid-migration noise, reported so the numbers stay honest
 *
 * WARN does not fail deliberately. The corpus is mid-migration and moves under you — 9
 * presentations to 10 and 41 events to 47 during the feeds build alone — so a check that
 * fires routinely would be ignored within a week, and then the FAIL set would be ignored
 * with it. Unclassified fields warn for the same reason, and should be promoted to FAIL at
 * cutover once the model stops moving.
 *
 * If this ever joins CI, do NOT gate the deploy on it. Production rebuilds fire on Sanity
 * webhooks, so unpublishing a concept would dangle a reference and block a deploy on a
 * purely editorial action. A scheduled run keeps the signal without putting publishing
 * behind it.
 */
import {createClient} from '@sanity/client'
import {readFileSync, readdirSync, statSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

const WEB_NEXT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(WEB_NEXT, 'dist')
const PAGES = join(WEB_NEXT, 'src/pages')

/**
 * Types that own a URL, and the prefix they live under.
 *
 * Three types share `/insights/`, which is why slug collisions are a real hazard here
 * rather than a theoretical one — nothing in the Studio prevents a `note` and an `article`
 * from claiming the same slug. That is check 5.
 */
const CONTENT_ROUTES = {
  article: '/insights/',
  caseStudy: '/insights/',
  note: '/insights/',
  presentation: '/presentations/',
  page: '/',
}

/**
 * Singletons are addressed by slug from a bespoke route file each, so there is no pattern
 * to derive — this map is transcribed from the four `loadQuery(SINGLETON_*, {slug})` calls
 * in `src/pages/`.
 *
 * A hand-maintained map is exactly the thing that goes stale silently, so it is checked in
 * BOTH directions: a singleton with no entry fails, and an entry with no built page fails.
 * Adding a fifth singleton in the Studio therefore forces triage instead of vanishing.
 */
const SINGLETON_ROUTES = {
  home: '/',
  insights: '/insights/',
  presentations: '/presentations/',
  reviews: '/reviews/',
}

/**
 * Types that deliberately render no page of their own.
 *
 * `event` is a delivery occasion, surfaced through its presentation. `review` is an anchor
 * on `/reviews/`, and a fragment is a position within a document rather than a URL of its
 * own. `client` and `settings` are referenced, never addressed. The SKOS types are the
 * vocabularies — `docs/urls-and-filtering.md` rules out per-concept pages, which is also
 * why the JSON-LD carries topics as plain `keywords` rather than `DefinedTerm` nodes.
 *
 * `service` (4 documents) and `collection` (2) are the phase 7 orphans: live documents with
 * no schema file, which nothing renders. Listed here so they do not fail the run, and
 * reported as INFO by check 6 so they do not get forgotten either.
 *
 * `media.tag` belongs to the Media plugin and is infrastructure, not content. It landed here
 * by failing the first run as an unclassified type, which is the triage this list is for
 * working correctly — the alternative was for a new type to render nothing and say nothing.
 *
 * Verified complete on 2026-09-15: these eight plus CONTENT_ROUTES plus `singleton` account
 * for all fifteen types in the dataset, so the list was settled in one pass rather than one
 * failing run at a time.
 */
const NO_PAGE_TYPES = new Set([
  'event',
  'review',
  'client',
  'settings',
  'skosConcept',
  'skosConceptScheme',
  'service',
  'collection',
  'media.tag',
])

const findings = []
const report = (level, check, message, detail) => findings.push({level, check, message, detail})

/* ── Reading the built site ──────────────────────────────────────────────── */

/**
 * Every built page, as a URL path.
 *
 * Astro's default `build.format` is `directory`, so a page is a directory holding an
 * `index.html` — `/insights/<slug>/index.html`. Endpoints (`feed.xml`, `search.json`,
 * `robots.txt`, `sitemap.xml`) emit bare files instead and are deliberately out of scope:
 * this check answers "does every document have a page", and a feed is not a page.
 *
 * `_astro` holds hashed assets and contains no routes.
 */
const builtPages = (dir = DIST, base = '') => {
  const found = new Set()
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    if (!entry.isDirectory()) {
      if (entry.name === 'index.html') found.add(base === '' ? '/' : `${base}/`)
      continue
    }
    if (entry.name === '_astro') continue
    for (const url of builtPages(join(dir, entry.name), `${base}/${entry.name}`)) {
      found.add(url)
    }
  }
  return found
}

/**
 * Routes that come from a file rather than from content, so that a built page with no
 * document behind it can be told apart from a leftover.
 *
 * Dynamic routes are skipped — `[slug].astro` produces content URLs, which is precisely
 * what the diff is testing. `404.astro` emits `404.html` rather than a directory, so it
 * never appears in `builtPages` and needs no entry.
 */
const staticRoutes = (dir = PAGES, base = '') => {
  const found = new Set()
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const path = `${base}/${entry.name}`
    if (entry.isDirectory()) {
      for (const url of staticRoutes(join(dir, entry.name), path)) found.add(url)
      continue
    }
    if (path.includes('[') || !entry.name.endsWith('.astro')) continue
    if (entry.name === '404.astro') continue
    found.add(
      entry.name === 'index.astro'
        ? base === ''
          ? '/'
          : `${base}/`
        : `${path.replace(/\.astro$/, '')}/`,
    )
  }
  return found
}

/** The newest mtime anywhere under `dist/`, as the moment the build last wrote. */
const newestBuildTime = (dir = DIST) => {
  let newest = 0
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name)
    newest = Math.max(newest, entry.isDirectory() ? newestBuildTime(path) : statSync(path).mtimeMs)
  }
  return newest
}

/* ── Reading the dataset ─────────────────────────────────────────────────── */

process.loadEnvFile(new URL('../.env', import.meta.url).pathname)

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.PUBLIC_SANITY_DATASET,
  apiVersion: '2026-08-18',
  useCdn: false,
  perspective: 'published',
})

/**
 * Two fetches, because they want different scopes.
 *
 * `docs` excludes `sanity.*` — the image and file asset records, which outnumber the real
 * content several times over and carry no parity questions of their own.
 *
 * `ids` does NOT exclude them, and must not: an `asset` field is an ordinary reference, so
 * every image in the corpus would read as dangling if the asset records were missing from
 * the set of things that exist.
 */
const [docs, ids] = await Promise.all([
  client.fetch('*[!(_type match "sanity.*")]'),
  client.fetch('*[]._id'),
])

const existing = new Set(ids)

/* ── Staleness guard ─────────────────────────────────────────────────────── */

/**
 * Refuse rather than guess. A `dist/` older than the newest edit describes a corpus that no
 * longer exists, and check 1's answers would be confidently wrong.
 *
 * ── IT GUARDS CHECK 1 ONLY, AND SCOPES TO TYPES THAT OWN A URL ──────────────
 *
 * The first version of this compared against the newest edit to ANY document, on the
 * reasoning that "which edits could matter" was a judgement the script would get wrong when
 * the model changed. The first real run disproved that: an `event` was edited six seconds
 * after the build finished, and the guard refused to run.
 *
 * That is not an edge case, it is the working condition — events are where the migration is
 * moving, 35 of 47 are not yet attached to a presentation, and an `event` renders no page of
 * its own. A guard that blocks during the work it exists to support gets disabled, and then
 * it guards nothing.
 *
 * So it scopes to the types that own a URL. That judgement is not a new one to get wrong: it
 * is the SAME map check 1 already uses, it is verified in both directions, and an
 * unclassified type fails the run. Editing an event, a concept, a review or settings cannot
 * create, delete or move a URL, so it cannot make check 1 lie.
 *
 * Check 2 needs no guard at all — it reads the dataset live and never touches `dist/`.
 *
 * These are two different clocks, local filesystem against Sanity's server, so a build
 * racing an edit by a second or two can still read as stale. That direction is the safe one:
 * the remedy is a rebuild. The opposite tolerance would not be.
 */
const ROUTING_TYPES = new Set([...Object.keys(CONTENT_ROUTES), 'singleton'])

const newestEditOf = (rows) =>
  rows.reduce((max, doc) => Math.max(max, Date.parse(doc._updatedAt) || 0), 0)

const routingEdit = newestEditOf(docs.filter((doc) => ROUTING_TYPES.has(doc._type)))
const newestEdit = newestEditOf(docs)
const buildTime = newestBuildTime()

if (buildTime < routingEdit) {
  console.error(
    `\n  dist/ is STALE — built ${new Date(buildTime).toISOString()}, newest edit to a type ` +
      `that owns a URL ${new Date(routingEdit).toISOString()}.\n` +
      `  Run \`pnpm --filter web-next build\` first.\n`,
  )
  process.exit(1)
}

/* Still worth saying out loud. The build is fine for check 1, but it does not reflect every
   edit, and a number quoted off a run should carry that caveat. */
if (buildTime < newestEdit) {
  const since = docs.filter((doc) => Date.parse(doc._updatedAt) > buildTime)
  report(
    'INFO',
    'freshness',
    `dist/ predates ${since.length} edit(s) to types that render no page of their own`,
    `Newest ${new Date(newestEdit).toISOString()}: ${[...new Set(since.map((d) => d._type))].sort().join(', ')}. Check 1 is unaffected; check 2 reads live.`,
  )
}

/* ── Check 1: does every document that should have a URL have one? ───────── */

const built = builtPages()
const fromFile = staticRoutes()

/**
 * URL → the documents claiming it, one-to-MANY.
 *
 * Keyed by URL with a single document as the value in the first draft, which was a bug:
 * `set` overwrites, so two documents colliding on a slug would have left one of them
 * unexamined — the checker would have hidden exactly the fault check 5 exists to find, and
 * quietly reported clean. An array makes the collision visible instead of fatal, and check 5
 * then reads it for free rather than grouping the corpus a second time.
 */
const expected = new Map()
const claim = (url, doc) => expected.set(url, [...(expected.get(url) ?? []), doc])

for (const doc of docs) {
  if (NO_PAGE_TYPES.has(doc._type)) continue

  if (doc._type === 'singleton') {
    const url = SINGLETON_ROUTES[doc.slug?.current]
    if (!url) {
      report(
        'FAIL',
        'urls',
        `singleton \`${doc.slug?.current ?? doc._id}\` has no route in SINGLETON_ROUTES`,
        'Every singleton is rendered by a bespoke route file. Add the slug to the map, or the page does not exist.',
      )
      continue
    }
    claim(url, doc)
    continue
  }

  const prefix = CONTENT_ROUTES[doc._type]
  if (!prefix) {
    report(
      'FAIL',
      'urls',
      `unclassified document type \`${doc._type}\` (${doc._id})`,
      'Not in CONTENT_ROUTES and not in NO_PAGE_TYPES — decide which, so a new type cannot silently render nothing.',
    )
    continue
  }

  /* The published perspective can still hold a document with no slug — nothing in the
     Studio requires one. It renders no page, which is a real parity gap rather than a
     configuration detail, so it fails here rather than being skipped. */
  const slug = doc.slug?.current
  if (!slug) {
    report('FAIL', 'urls', `\`${doc._type}\` ${doc._id} has no slug, so it renders no page`)
    continue
  }
  claim(`${prefix}${slug}/`, doc)
}

for (const [url, claimants] of expected) {
  if (built.has(url)) continue
  for (const doc of claimants) {
    report('FAIL', 'urls', `${url} is not in dist/ — \`${doc._type}\` ${doc._id} renders nothing`)
  }
}

for (const url of built) {
  if (expected.has(url) || fromFile.has(url)) continue
  report(
    'WARN',
    'urls',
    `${url} is built but nothing explains it`,
    'No document claims this URL and no route file produces it. A leftover, or a route this check does not understand.',
  )
}

/* ── Check 2: are there dangling references? ─────────────────────────────── */

/**
 * Walk anything for `_ref`, recording where each one was found.
 *
 * Depth-first over plain objects and arrays, which reaches references nested in band
 * objects and inside Portable Text blocks — both of which a field list would have missed.
 * The path is carried along purely so the report can say WHERE, since `caseStudy.client`
 * and a reference buried in `customBands[2].clientLogos[0]` need very different responses.
 */
const walk = (node, path, found) => {
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${path}[${i}]`, found))
    return
  }
  if (!node || typeof node !== 'object') return
  if (typeof node._ref === 'string') {
    found.push({path, ref: node._ref, weak: node._weak === true})
    return
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('_')) continue
    walk(value, path ? `${path}.${key}` : key, found)
  }
}

/**
 * Media Library assets are not documents in this dataset, and must not be checked as if
 * they were.
 *
 * `media-library:<libraryId>:<assetId>` addresses Sanity's Media Library, a store shared
 * across projects rather than a row in `production-26`. Those ids can never appear in
 * `*[]._id` here, so testing them against it is a category error — the first run reported
 * all 77 as dangling, which is precisely the noise that gets a checker ignored by week two.
 *
 * They also correct something asserted further up this file. The SCHEMA declares no weak
 * references — `grep -rn weak studio-next/schemas/` returns nothing — but the Media Library
 * plugin writes `_weak` into the data regardless. Measured 2026-09-15: 77 weak references,
 * all of them Media Library, none anywhere else.
 *
 * Verifying one needs the Media Library API rather than a dataset id, so they are counted
 * and declared unverified rather than quietly dropped. An asset deleted from the library
 * would break an image and this would not catch it.
 */
const isMediaLibrary = (ref) => ref.startsWith('media-library:')
let mediaLibraryRefs = 0

for (const doc of docs) {
  const refs = []
  walk(doc, '', refs)
  for (const {path, ref, weak} of refs) {
    if (isMediaLibrary(ref)) {
      mediaLibraryRefs++
      continue
    }
    if (existing.has(ref)) continue

    /* A weak reference is ALLOWED to dangle by design, so failing on one would be reporting
       the feature as the bug. None exist in this dataset outside the Media Library today,
       measured rather than assumed, so one surfacing here is worth a look. */
    if (weak) {
      report(
        'INFO',
        'references',
        `${doc._type} ${doc._id} → ${path} is a weak ref to ${ref}, which does not exist`,
      )
      continue
    }

    report(
      'FAIL',
      'references',
      `${doc._type} ${doc._id} → ${path} points at ${ref}, which does not exist`,
      'Measured through the published perspective: a target that exists only as a draft is dangling as far as the static build is concerned.',
    )
  }
}

if (mediaLibraryRefs) {
  report(
    'INFO',
    'references',
    `${mediaLibraryRefs} Media Library reference(s) not verified`,
    'Global assets rather than dataset documents, so a dataset id check cannot speak to them. A deleted library asset would break an image and go unreported here.',
  )
}

/* ── Check 3: is any populated field going unrendered? ───────────────────── */

/**
 * The hardest of the six, and the one this phase was written for. A field carrying data that
 * no query projects renders as nothing, and nothing about that is an error anywhere: the
 * Studio saves it, the build succeeds, the page is simply missing something.
 *
 * ── DERIVED FROM THE QUERY SOURCE, NOT FROM A HAND-KEPT ALLOWLIST ───────────
 *
 * The kickoff proposed an explicit allowlist of "rendered" and "deliberately ignored",
 * failing on anything unclassified. That shape has a flaw this session already demonstrated
 * twice: a hand-maintained inventory of the content model drifts, silently, and then asserts
 * something false with total confidence. The kickoff's own list of reference fields named six
 * where the schema declares eighteen.
 *
 * So "rendered" is read off the queries themselves. No GROQ projection in this repo uses a
 * spread — verified, the only `...` in `src/sanity/queries/` are `[0...n]` range slices — so
 * every projected field is named literally in the query text, and a field name that appears
 * nowhere in it cannot be reaching any page.
 *
 * ── WHAT THIS GETS WRONG, AND IN WHICH DIRECTION ────────────────────────────
 *
 * It UNDER-reports, deliberately. The match is by name across all query source at once, so a
 * `title` projected for `article` makes `title` look covered for every type. Scoping the
 * match per type would need the queries parsed rather than searched, and a false accusation
 * is the failure that gets a checker switched off — a missed one only leaves you where you
 * already were.
 *
 * Two more knowable gaps, stated rather than hidden: a field can be projected and then never
 * used by the template that receives it, which this cannot see; and `false` is treated as
 * unpopulated, because a boolean at its default is indistinguishable from one never set.
 *
 * Comments are stripped before matching. Without that the check is nearly inert here — the
 * prose in these files discusses `bodyText`, `atGlance` and most of the model by name, so
 * almost everything would match something.
 */
const QUERY_DIR = join(WEB_NEXT, 'src/sanity')

const querySource = (dir = QUERY_DIR) => {
  let text = ''
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) text += querySource(path)
    else if (entry.name.endsWith('.ts')) text += readFileSync(path, 'utf8')
  }
  return text
}

const projected = querySource()
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^[ \t]*\/\/.*$/gm, ' ')

/**
 * Fields that are real, populated, and correctly never projected.
 *
 * `insightType` is the deprecated reference `genre` replaced — phase 7 unsets it. `baseIri`,
 * `conceptId`, `definition`, `related`, `broader`, `topConcepts`, `editorialNote`, `scopeNote`
 * and `schemeId` belong to the taxonomy plugin and drive the Studio, not the site.
 * `adjBright` and `outline` are image treatment flags read by the components rather than
 * fetched by name.
 *
 * Anything NOT in here and not named in a query warns, which is the point: a new field added
 * in the Studio has to be triaged rather than silently dropped.
 */
const IGNORED_FIELDS = new Set([
  'insightType',
  'baseIri',
  'conceptId',
  'definition',
  'related',
  'broader',
  'topConcepts',
  'editorialNote',
  'scopeNote',
  'schemeId',
  'adjBright',
  'outline',
])

/**
 * Types with no schema file, nothing rendering them, and an open adopt-or-delete decision.
 *
 * Skipped by the field and alt-text checks, and NOT because they do not matter — check 6
 * reports both wholesale, with counts. Auditing the fields of a type that renders nothing
 * produced eleven warnings and four missing-alt reports on the first run, which is eleven
 * more reasons to stop reading the output before reaching `article.canonical`.
 *
 * The moment either is adopted into the schema, delete it from here and the fields get
 * audited like everything else.
 */
const ORPHAN_TYPES = new Set(['service', 'collection'])

const populated = (value) => {
  if (value === null || value === undefined || value === false || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

const fieldsByType = new Map()

for (const doc of docs) {
  if (ORPHAN_TYPES.has(doc._type)) continue
  for (const [field, value] of Object.entries(doc)) {
    if (field.startsWith('_') || !populated(value)) continue
    if (!fieldsByType.has(doc._type)) fieldsByType.set(doc._type, new Set())
    fieldsByType.get(doc._type).add(field)
  }
}

for (const [type, fields] of [...fieldsByType].sort()) {
  for (const field of [...fields].sort()) {
    if (IGNORED_FIELDS.has(field)) continue
    if (new RegExp(`\\b${field}\\b`).test(projected)) continue
    report(
      'WARN',
      'fields',
      `\`${type}.${field}\` holds data but is named in no query`,
      'Either project it, or add it to IGNORED_FIELDS with a reason. Warns rather than fails while the model is still moving; promote to FAIL at cutover.',
    )
  }
}

/* ── Check 4: does the Genre invariant hold? ─────────────────────────────── */

/**
 * A document's genre must sit under the top concept matching its structural family. The
 * Genre scheme's two top concepts ARE the content model's top-level division — Document over
 * Perspective, Method, Case Study, Conference Themes and Note; Presentation over Keynote,
 * Talk, Workshop, Panel and Interview — so an `article` carrying a Presentation-branch genre
 * is a document filed as something it is not.
 *
 * This has had four violations: three Interviews and a Talk stored as `article` while
 * `presentation` did not yet exist, which made the Insights index over-collect by exactly
 * that many. They were re-typed in phase 4 and there are none today. Nothing prevents a
 * fifth — the Studio will accept any concept in the field — which is why CLAUDE.md has called
 * this worth a build-time check since phase 4.
 *
 * ── RESOLVED BY WALKING `broader`, NOT BY A HARDCODED ID ────────────────────
 *
 * Concepts carry no scheme reference; the scheme holds `topConcepts` and children point
 * upward through `broader`. So the branch a concept belongs to is found by climbing until
 * something has no `broader` left. `broader` is an ARRAY — SKOS permits polyhierarchy — so
 * this collects every root reachable, not the first, and a concept under both branches would
 * satisfy either family rather than being judged by whichever edge came first.
 *
 * The expected top is looked up by label from the Genre scheme rather than pinned by id, so
 * rebuilding the vocabulary does not silently disable the check.
 */
const conceptById = new Map(docs.filter((d) => d._type === 'skosConcept').map((d) => [d._id, d]))

const rootsOf = (id, seen = new Set()) => {
  if (seen.has(id)) return new Set() /* Cycles are possible in hand-built SKOS. */
  seen.add(id)
  const concept = conceptById.get(id)
  if (!concept) return new Set()
  const parents = (concept.broader ?? []).map((b) => b._ref).filter((ref) => conceptById.has(ref))
  if (!parents.length) return new Set([id])
  return new Set(parents.flatMap((parent) => [...rootsOf(parent, seen)]))
}

const genreScheme = docs.find((d) => d._type === 'skosConceptScheme' && d.title === 'Genre')
const topByLabel = new Map(
  (genreScheme?.topConcepts ?? [])
    .map((top) => conceptById.get(top._ref))
    .filter(Boolean)
    .map((concept) => [concept.prefLabel, concept._id]),
)

/** Which top concept each structural family must resolve under. */
const EXPECTED_BRANCH = {
  article: 'Document',
  caseStudy: 'Document',
  note: 'Document',
  presentation: 'Presentation',
}

if (!genreScheme || topByLabel.size < 2) {
  report(
    'WARN',
    'genre',
    'the Genre scheme or its top concepts could not be resolved, so the invariant went unchecked',
    'A silently skipped check is worse than a failing one — this says so out loud rather than reporting clean.',
  )
} else {
  for (const doc of docs) {
    const branch = EXPECTED_BRANCH[doc._type]
    if (!branch || !doc.genre?._ref) continue

    const expectedTop = topByLabel.get(branch)
    const roots = rootsOf(doc.genre._ref)
    if (roots.has(expectedTop)) continue

    const label = conceptById.get(doc.genre._ref)?.prefLabel ?? doc.genre._ref
    const under =
      [...roots].map((id) => conceptById.get(id)?.prefLabel ?? id).join(', ') || 'nothing'
    report(
      'FAIL',
      'genre',
      `\`${doc._type}\` ${doc.slug?.current ?? doc._id} carries genre "${label}", which sits under ${under}, not ${branch}`,
    )
  }
}

/* ── Check 5: do any two documents collide in a URL space? ───────────────── */

/**
 * `article`, `caseStudy` and `note` all live at `/insights/{slug}/`, and nothing in the
 * Studio prevents two of them claiming the same slug — slug uniqueness is scoped per type by
 * default, and this URL space spans three. Whichever `getStaticPaths` emits last wins, so one
 * document simply stops existing while every count still looks right.
 *
 * Reads the map check 1 already built, which is why that map holds an array.
 */
for (const [url, claimants] of expected) {
  if (claimants.length < 2) continue
  report(
    'FAIL',
    'collisions',
    `${url} is claimed by ${claimants.length} documents`,
    claimants.map((doc) => `${doc._type} ${doc._id}`).join(' · '),
  )
}

/* ── Check 6: report-only signals ────────────────────────────────────────── */

/**
 * None of this fails, and that is deliberate. These are conditions that are either expected
 * mid-migration or editorial judgements rather than defects — reported so the numbers stay
 * honest and visible, not so the run goes red.
 */

/* Events not referenced by any presentation. 35 of 47 on 2026-09-14, and the bulk of the
   modelling work still outstanding. An event renders no page of its own, so an unattached
   one is invisible rather than broken — which is exactly why it needs counting. */
const attached = new Set(
  docs
    .filter((doc) => doc._type === 'presentation')
    .flatMap((doc) => (doc.eventDetail ?? []).map((ref) => ref._ref)),
)
const events = docs.filter((doc) => doc._type === 'event')
const orphanEvents = events.filter((doc) => !attached.has(doc._id))

if (orphanEvents.length) {
  report(
    'INFO',
    'events',
    `${orphanEvents.length} of ${events.length} events are not referenced by any presentation`,
    'Expected while the Presentation branch is being migrated. Renders nothing, so it is invisible rather than broken.',
  )
}

/* Fields every publishable document is expected to carry. Missing ones are an editorial
   gap, not a build failure — the page still renders, with a hole in it. */
const REQUIRED = {
  article: ['title', 'pubDate', 'genre'],
  caseStudy: ['title', 'pubDate', 'genre'],
  note: ['title', 'pubDate', 'genre'],
  presentation: ['title', 'pubDate', 'genre'],
  page: ['title'],
  singleton: ['title'],
}

for (const doc of docs) {
  for (const field of REQUIRED[doc._type] ?? []) {
    if (populated(doc[field])) continue
    report('WARN', 'required', `\`${doc._type}\` ${doc.slug?.current ?? doc._id} has no ${field}`)
  }
}

/**
 * Alt text on heroes and body figures.
 *
 * Scoped to those two deliberately. `heroImage` travels furthest — php-mf2 returns `u-photo`
 * as `{value, alt}`, so a hero's alt text is carried into every syndicated copy, costing
 * twice rather than once — and `figure` is the body image the reader meets in prose.
 *
 * NOT covered: slide images, posters, client logos and the author image, which are also
 * `image` objects. Those are decorative, media-library-backed, or captioned elsewhere, and
 * folding them in would bury the two that matter under two hundred that do not.
 */
const missingAlt = []

const walkImages = (node, docRef, path) => {
  if (Array.isArray(node))
    return node.forEach((item, i) => walkImages(item, docRef, `${path}[${i}]`))
  if (!node || typeof node !== 'object') return
  const isHero = path.endsWith('heroImage')
  if ((isHero || node._type === 'figure') && node.asset && !populated(node.altText)) {
    missingAlt.push({doc: docRef, path, kind: isHero ? 'hero' : 'figure'})
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('_')) continue
    walkImages(value, docRef, path ? `${path}.${key}` : key)
  }
}

for (const doc of docs) if (!ORPHAN_TYPES.has(doc._type)) walkImages(doc, doc, '')

for (const {doc, path, kind} of missingAlt) {
  report(
    'WARN',
    'alt-text',
    `${kind} at ${doc._type} ${doc.slug?.current ?? doc._id} → ${path} has no altText`,
  )
}

/* Phase 7's cleanup list, counted rather than described, so the size of the job is known
   when it is picked up. Neither is a defect today. */
const deprecated = docs.filter((doc) => doc.insightType).length
if (deprecated) {
  report('INFO', 'phase-7', `${deprecated} documents still carry the deprecated \`insightType\``)
}

for (const type of ['service', 'collection']) {
  const count = docs.filter((doc) => doc._type === type).length
  if (count) {
    report(
      'INFO',
      'phase-7',
      `${count} \`${type}\` documents exist with no schema file and nothing rendering them`,
      'Adopt into the schema or delete — an editorial call, not a structural one.',
    )
  }
}

/* ── Report ──────────────────────────────────────────────────────────────── */

const LEVELS = ['FAIL', 'WARN', 'INFO']
const counts = Object.fromEntries(LEVELS.map((l) => [l, 0]))

console.log(
  `\n  ${docs.length} documents, ${built.size} built pages, ` +
    `dist/ from ${new Date(buildTime).toISOString()}\n`,
)

for (const level of LEVELS) {
  const group = findings.filter((f) => f.level === level)
  counts[level] = group.length
  if (!group.length) continue
  console.log(`  ${level} (${group.length})`)
  for (const {check, message, detail} of group) {
    console.log(`    [${check}] ${message}`)
    if (detail) console.log(`      ${detail}`)
  }
  console.log('')
}

if (!findings.length) console.log('  Clean.\n')
else console.log(`  ${counts.FAIL} fail, ${counts.WARN} warn, ${counts.INFO} info\n`)

process.exit(counts.FAIL > 0 ? 1 : 0)
