/**
 * Performance budgets — has the site got heavier than we agreed it would be?
 *
 * ── RUN IT AGAINST A BUILD ──────────────────────────────────────────────────
 *
 *   pnpm --filter web build && pnpm budgets
 *
 * It reads a built site and nothing else: no network, no browser, no dependencies. An optional
 * argument names the directory to read, as for the other site gates; the default is `web/dist`.
 *
 * ── BYTES, NOT TIMINGS OR SCORES ────────────────────────────────────────────
 *
 * Decided with Andy, 2026-10-09. A budget is a tripwire: a limit set in advance, so that "the site
 * got slower" fails on the commit that did it rather than being noticed months later. Three kinds
 * were on the table, and this is the one that makes a trustworthy gate:
 *
 *   bytes     What a page costs to send. Deterministic: the same build always measures the
 *             same, so a failure always means something changed.
 *   timings   LCP, CLS, INP — what a visitor experiences, and the better thing to care about.
 *             But they are measured in a simulated lab, and noisy on shared CI machines. LCP sat
 *             at 1.8–2.4s against Google's 2.5s "good" line on 2026-10-06, so as a gate it would
 *             fail at random. Measure them by hand; docs/eleventy-astro-comparison.md says how.
 *   scores    "Lighthouse ≥ 90" blends several timings, and the blend changes between Lighthouse
 *             versions. A failure would not even say what got worse.
 *
 * Bytes are not speed, but they are the input this repo controls, and every budget below guards a
 * failure that has already happened here or nearly did.
 *
 * ── WHAT IS MEASURED, AND WHAT IS NOT ───────────────────────────────────────
 *
 * Sizes are BROTLI-COMPRESSED, at Node's default settings, because compressed bytes are what cross
 * the network. They will not match the wire to the byte — Cloudflare compresses at its own level —
 * but the point of a budget is a consistent measure, and this is one. Font files are woff2, which is
 * already compressed, so they are counted as they sit on disk. 1 KB is 1,000 bytes, as in file.ts.
 *
 * NOT MEASURED, and the gaps are real:
 *
 *   images           They come from Sanity's CDN at runtime, at sizes the browser picks, so the
 *                    build never contains them. They are also what grows most: the insights index
 *                    reached 768 KB once scrolled to the bottom (2026-10-06). Covering them needs a
 *                    browser, or a rule about what <SanityImage> emits. Not this gate.
 *   third parties    Plausible's script is the one; a build cannot weigh another origin.
 *   unloaded files   The 191 KB React chunk in `_astro/client.*.js` ships and no page references
 *                    it, so no reader downloads it. Counting files by page rather than by
 *                    directory is deliberate: the budget is about what a visitor is sent.
 *
 * ── WHY HTML HAS TWO BUDGETS ────────────────────────────────────────────────
 *
 * Most of a page's weight is the template — inlined CSS, inline SVG icons, the JSON-LD graph,
 * microformats — but HTML also grows with what was written. A single budget on the heaviest page
 * would go red whenever a long piece was published, and that is not a defect. So:
 *
 *   the MEDIAN page   moves only when every page grows, which is what template bloat looks like.
 *   the HEAVIEST page gets a ceiling for the pathological — an image inlined as base64, a data
 *                     blob printed into every page — set well above long writing.
 *
 * ── CONTENT CAN TRIP SOME OF THESE, AND THAT IS INTENDED ───────────────────
 *
 * The search index grows with every document, and the HTML ceiling with a long one. Both can go
 * red after a Sanity publish with no code changed. Like the other site gates, this never holds a
 * deploy — see check-links.mjs → WHERE IT RUNS — so red there means "revisit", not "broken". The
 * search index budget is exactly that: CLAUDE.md says to reconsider its stable filename "only if
 * the index grows", and this is where it says so.
 *
 * ── CHANGING A BUDGET ───────────────────────────────────────────────────────
 *
 * Each was set at today's measurement plus headroom (2026-10-09). When the site gets lighter, lower
 * the budget to the new measurement — that is called ratcheting, and it is what keeps a win from
 * being spent quietly. Raise one only on purpose, in a commit that says what grew and why it is
 * worth it.
 *
 * ── WHERE IT RUNS ───────────────────────────────────────────────────────────
 *
 * Exactly where the other site gates run, on the same terms: checks.yml builds and runs it on every
 * branch push, and deploy-astro.yml runs it beside the production deploy, never in front of it.
 *
 * ── PROVEN 2026-10-09 ───────────────────────────────────────────────────────
 *
 * A gate is not known to work until it has failed, so this one was made to:
 *
 *   by hand          A copy of the build with one fault per budget failed all six, each for its
 *                    own reason. The JavaScript fault was a new chunk reachable only through an
 *                    `import`, which proves the import-following: without it, that page would
 *                    have read 10.1 KB and passed. A build with no fonts directory, and no build
 *                    at all, each exit 2.
 *   on the runner    The `performance-budgets` branch went green with every figure identical to a
 *                    Mac's, to the tenth of a KB — brotli is deterministic, which is the point.
 *                    A scratch branch, `performance-budgets-proof`, then put an incompressible
 *                    string in the masthead script and a hidden attribute in BaseLayout: the
 *                    Budgets step went red on exactly those two, and every other gate stayed
 *                    green.
 *   unproven when    deploy-astro.yml's step, which runs only from `main` — its first run is the
 *   this was written merge. And red-after-deploy from a Sanity publish, as for the other gates.
 *
 * To re-prove it after changing it, do the same: break it on purpose and watch it go red.
 *
 * ── EXIT CODES ──────────────────────────────────────────────────────────────
 *
 *   0  everything is within budget
 *   1  at least one budget is over
 *   2  it could not run — no build, or the build no longer has the shape this measures (the fonts
 *      directory or the search index moved). Kept apart from 1, so a budget that can no longer see
 *      what it guards fails loudly instead of passing for want of anything to weigh.
 */
import {appendFileSync, existsSync, readFileSync, readdirSync, statSync} from 'node:fs'
import {join, posix, resolve, sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import {brotliCompressSync} from 'node:zlib'

const DIST = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../dist', import.meta.url))

/* ── The budgets ──────────────────────────────────────────────────────────── */

/**
 * In bytes. Each records what it measured when it was set, and the failure it exists to catch.
 */
const BUDGETS = {
  /** 12.2 KB on 2026-10-09. HTML roughly doubled at the rebuild, to carry inlined CSS, SVG icons,
      a fuller JSON-LD graph and microformats; this makes the next doubling a decision. */
  htmlMedian: 15_000,

  /** 26.4 KB on 2026-10-09, a presentation with a full transcript. A ceiling for the
      pathological, set well above long writing; see WHY HTML HAS TWO BUDGETS. */
  htmlMax: 50_000,

  /** 6.5 KB on 2026-10-09. The old site's CSS was 21 render-blocking files; this one's is
      component-scoped and small, and should stay that way. */
  cssMax: 8_000,

  /** 10.1 KB on 2026-10-09, on the two index pages that carry the facet script. Catches a library
      pulled into a browser script by accident — the unreferenced 191 KB React chunk is how close
      that has come. */
  jsMax: 12_000,

  /** 158.1 KB across 4 files on 2026-10-09. Deliberately tight: fonts were 1.76 MB of the old
      site's 1.83 MB, and a new face or a returning extended-Latin tier is 25–55 KB, so either
      trips this. Fonts change only on purpose. */
  fonts: 170_000,

  /** 18.8 KB on 2026-10-09, and it grows with every document. The point at which CLAUDE.md's
      search decision says to revisit the index's stable, unhashed filename. */
  searchIndex: 25_000,
}

/* ── Measure ──────────────────────────────────────────────────────────────── */

const fail = (message) => {
  console.error(message)
  process.exit(2)
}

if (!existsSync(join(DIST, 'index.html'))) {
  fail(`No built site at ${DIST}. Run \`pnpm --filter web build\` first.`)
}

/** Brotli size, cached, since every page shares the same few assets. */
const compressed = new Map()
const brotli = (file) => {
  if (!compressed.has(file)) compressed.set(file, brotliCompressSync(readFileSync(file)).length)
  return compressed.get(file)
}

/** A site path like `/_astro/x.css` → the file in the build, or null for another origin. */
const local = (href) =>
  href.startsWith('/') && !href.startsWith('//')
    ? join(DIST, ...href.split('?')[0].split('/'))
    : null

/**
 * A script and everything it statically imports, as site paths. Nothing is split into chunks
 * today — Vite bundles each script whole — but the next module two scripts share would be, and a
 * budget that stopped at the entry would miss it. Dynamic `import()` is left out: it loads on
 * demand, not on arrival.
 */
const IMPORT = /(?:\bimport|\bexport)\s*(?:[\w*{}\s,$]*\bfrom\s*)?["']([^"']+\.js)["']/g
const scriptGraph = (href, seen = new Set()) => {
  if (seen.has(href)) return seen
  const file = local(href)
  if (!file || !existsSync(file)) return seen
  seen.add(href)
  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(IMPORT)) {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      scriptGraph(posix.resolve(posix.dirname(href), specifier), seen)
    }
  }
  return seen
}

const STYLESHEET = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g
const SCRIPT = /<script\b[^>]*\bsrc="([^"]+)"/g
const MODULEPRELOAD = /<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+)"/g
/** An inline module script's body. Its own bytes are in the HTML already; what it IMPORTS is not. */
const INLINE_MODULE = /<script\b(?![^>]*\bsrc=)[^>]*\btype="module"[^>]*>([\s\S]*?)<\/script>/g

const pages = readdirSync(DIST, {recursive: true})
  .filter((file) => file.endsWith('.html'))
  .map((file) => {
    const path = join(DIST, file)
    const html = readFileSync(path, 'utf8')
    const css = [...html.matchAll(STYLESHEET)].map((m) => local(m[1])).filter(Boolean)
    const scripts = new Set()
    for (const [, href] of [...html.matchAll(SCRIPT), ...html.matchAll(MODULEPRELOAD)]) {
      scriptGraph(href, scripts)
    }
    const url = ('/' + file.split(sep).join('/')).replace(/(^|\/)index\.html$/, '$1')
    for (const [, body] of html.matchAll(INLINE_MODULE)) {
      for (const [, specifier] of body.matchAll(IMPORT)) {
        if (specifier.startsWith('.') || specifier.startsWith('/')) {
          // Relative to the page's own directory: `/insights/` for `/insights/`, `/` for `/404.html`.
          const base = url.endsWith('/') ? url : posix.dirname(url)
          scriptGraph(posix.resolve(base, specifier), scripts)
        }
      }
    }
    return {
      url,
      html: brotli(path),
      css: css.reduce((sum, file) => sum + brotli(file), 0),
      js: [...scripts].reduce((sum, href) => sum + brotli(local(href)), 0),
    }
  })

const FONTS = join(DIST, '_astro', 'fonts')
if (!existsSync(FONTS))
  fail(`No fonts at ${FONTS}: the build has changed shape, so the font budget would weigh nothing.`)
const fontFiles = readdirSync(FONTS).filter((file) => file.endsWith('.woff2'))
const fonts = fontFiles.reduce((sum, file) => sum + statSync(join(FONTS, file)).size, 0)

const INDEX = join(DIST, 'search.json')
if (!existsSync(INDEX)) fail(`No search index at ${INDEX}: the build has changed shape.`)
const searchIndex = brotli(INDEX)

/* ── Compare ──────────────────────────────────────────────────────────────── */

const heaviest = (key) => [...pages].sort((a, b) => b[key] - a[key])
const median = (key) => heaviest(key)[Math.floor(pages.length / 2)][key]

/** Each check: what it weighed, against what, and — for a per-page budget — which pages are over. */
const checks = [
  {name: 'HTML, median page', value: median('html'), budget: BUDGETS.htmlMedian},
  {
    name: 'HTML, heaviest page',
    value: heaviest('html')[0].html,
    budget: BUDGETS.htmlMax,
    key: 'html',
  },
  {name: 'CSS, heaviest page', value: heaviest('css')[0].css, budget: BUDGETS.cssMax, key: 'css'},
  {
    name: 'JavaScript, heaviest page',
    value: heaviest('js')[0].js,
    budget: BUDGETS.jsMax,
    key: 'js',
  },
  {name: `Fonts, site-wide (${fontFiles.length} files)`, value: fonts, budget: BUDGETS.fonts},
  {name: 'Search index', value: searchIndex, budget: BUDGETS.searchIndex},
]

/* ── Report ───────────────────────────────────────────────────────────────── */

const kb = (bytes) => `${(bytes / 1000).toFixed(1)} KB`
const SHOWN = 5

const lines = [`Budgets: ${pages.length} pages in ${DIST}, brotli-compressed`, '']
for (const check of checks) {
  const over = check.value > check.budget
  const share = Math.round((check.value / check.budget) * 100)
  lines.push(
    `${over ? '✗' : '✓'} ${check.name.padEnd(32)} ${kb(check.value).padStart(9)} of ${kb(check.budget)} (${share}%)`,
  )
  if (over && check.key) {
    const offenders = heaviest(check.key).filter((page) => page[check.key] > check.budget)
    for (const page of offenders.slice(0, SHOWN))
      lines.push(`      ${kb(page[check.key]).padStart(9)}  ${page.url}`)
    if (offenders.length > SHOWN) lines.push(`      and ${offenders.length - SHOWN} more pages`)
  }
}
const overCount = checks.filter((check) => check.value > check.budget).length
lines.push(
  '',
  overCount
    ? `✗ ${overCount} ${overCount === 1 ? 'budget' : 'budgets'} over. Fix the growth, or raise the budget on purpose — see CHANGING A BUDGET.`
    : '✓ Everything is within budget.',
)

const text = lines.join('\n')
console.log(text)

// On GitHub, also put the report on the run's summary page, as the other site gates do.
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + text + '\n```\n')
}

process.exit(overCount ? 1 : 0)
