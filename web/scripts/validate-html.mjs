/**
 * HTML validation — is every page in the built site valid HTML, by the spec?
 *
 * ── RUN IT AGAINST A BUILD ──────────────────────────────────────────────────
 *
 *   pnpm --filter web build && pnpm validate
 *
 * NEEDS JAVA 11 OR NEWER. The validator is a Java program; this repo uses Temurin 21 — on a Mac,
 * `brew install --cask temurin@21`; in CI, `actions/setup-java`. `$JAVA_HOME/bin/java` is used
 * when JAVA_HOME is set, which is how setup-java points at the version it installed; otherwise
 * whatever `java` is on the PATH. An optional argument names the directory to read, as for the
 * link check; the default is `web/dist`.
 *
 * ── THE NU CHECKER, AND WHY IT RATHER THAN html-validate ───────────────────
 *
 * `vnu.jar` is the W3C's Nu Html Checker — the validator behind validator.w3.org/nu, and the
 * reference implementation of the HTML spec's conformance rules. Both it and html-validate (a
 * configurable linter in plain JavaScript) were run over the same 84 pages on 2026-10-08:
 *
 *   Nu checker      found all four real defects: `<p>` inside the home h1, a duplicate id,
 *                   unencoded spaces in the deck download URL, and skipped heading levels.
 *   html-validate   found the first two only. Its ~1,800 other findings were the empty
 *                   search-result skeletons inside `<template>`, Shiki's inline styles, and its
 *                   own opinions — title length, ids that start with a digit (valid HTML).
 *
 * "Valid" should mean what the spec says, not a rule set this repo tunes, and the reference found
 * more. html-validate's distinctive real findings — a `<fieldset>` with no `<legend>`, unnamed
 * `<nav>` landmarks — are accessibility, which is the next gate's job. Decided with Andy.
 *
 * Pinned to an exact version in package.json, because the validator's rules move between
 * releases, and a gate whose verdict changes when nothing in this repo did is a gate nobody
 * trusts. Upgrade it on purpose and read what newly fails.
 *
 * ── WHAT IS FILTERED OUT, AND WHY ───────────────────────────────────────────
 *
 *   CSS             Every message beginning "CSS:". The Nu checker validates inline <style>,
 *                   and its CSS checker lags the language: 543 of its 565 errors on 2026-10-08
 *                   were `@container style(…)` and `container-type`, both Baseline. So THIS
 *                   GATE DOES NOT CHECK CSS AT ALL. A CSS gate would be its own tool.
 *   warnings        `--errors-only`. 679 warnings on 2026-10-08, almost all `role="list"` on
 *                   a <ul> — deliberate, because `list-style: none` drops list semantics in
 *                   Safari (ConceptList.astro) — and `aria-disabled` on zero-hit facet links,
 *                   also deliberate (FacetFilters.astro). The rest were sections and articles
 *                   without headings, worth a look by hand but not a gate.
 *
 * ── WHAT IS NOT FILTERED, AND STARTED RED ──────────────────────────────────
 *
 * The Nu checker reports a SKIPPED HEADING LEVEL — an h3 straight after an h1 — as an error, and
 * it fails here (Andy, 2026-10-08). That decision moved the rail headings from h3 to h2; see
 * RailNav.astro. A DUPLICATE ID fails too, which is where headingId.ts said one would surface.
 * Both can come from content, so the fix may be an edit in the Studio rather than in code.
 *
 * ── WHERE IT RUNS, AND WHAT A FAILURE HOLDS ─────────────────────────────────
 *
 * Exactly where the link check runs, and on the same terms: checks.yml builds and runs it on
 * every branch push; deploy-astro.yml runs it beside the production deploy, never in front of it.
 * See check-links.mjs → WHERE IT RUNS for why a site gate never holds a deploy.
 *
 * ── EXIT CODES ──────────────────────────────────────────────────────────────
 *
 *   0  every page is valid
 *   1  at least one error
 *   2  it could not run — no build, no Java 11+, or the validator itself failed. Kept apart
 *      from 1 so a broken tool is never read as a verdict on the site, either way.
 */
import {appendFileSync, existsSync, readdirSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {join, relative, resolve, sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import vnuJar from 'vnu-jar'

const DIST = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../dist', import.meta.url))

const JAVA = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'java') : 'java'

const fail = (message) => {
  console.error(message)
  process.exit(2)
}

if (!existsSync(join(DIST, 'index.html'))) {
  fail(`No built site at ${DIST}. Run \`pnpm --filter web build\` first.`)
}

/* ── Java ─────────────────────────────────────────────────────────────────── */

// `java -version` writes to stderr, and names Java 8 as "1.8.0_…" — the old scheme, where the
// major version is the SECOND number. Everything from 9 on leads with it.
const probe = spawnSync(JAVA, ['-version'], {encoding: 'utf8'})
const versionLine = `${probe.stderr ?? ''}${probe.stdout ?? ''}`.match(/version "([^"]+)"/)?.[1]
const major = versionLine
  ? Number(versionLine.startsWith('1.') ? versionLine.split('.')[1] : versionLine.split('.')[0])
  : null

if (major === null || major < 11) {
  fail(
    `The HTML validator needs Java 11 or newer, and ${JAVA} is ` +
      (major === null ? 'not runnable.' : `Java ${major}.`) +
      '\nOn a Mac: `brew install --cask temurin@21`.',
  )
}

/* ── Validate ─────────────────────────────────────────────────────────────── */

const run = spawnSync(
  JAVA,
  [
    '-jar',
    String(vnuJar),
    '--skip-non-html',
    '--errors-only',
    '--filterpattern',
    'CSS: .*',
    '--format',
    'json',
    DIST,
  ],
  {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
)

// The report arrives on stderr, as JSON. Anything else there — a stack trace, a JVM complaint —
// means the validator did not finish, which is exit 2 rather than a clean bill.
let messages
try {
  messages = JSON.parse(run.stderr).messages
} catch {
  fail(`The validator did not produce a report (exit ${run.status}):\n${run.stderr || run.stdout}`)
}

// An I/O failure reading a page is the tool failing, not the page.
const broken = messages.filter((m) => m.type === 'non-document-error')
if (broken.length) fail(broken.map((m) => m.message).join('\n'))

const errors = messages.filter((m) => m.type === 'error')

/* ── Report ───────────────────────────────────────────────────────────────── */

/** `file:/…/dist/insights/x/index.html` → `/insights/x/`, the URL it is served at. */
const pageOf = (url) => {
  const path = '/' + relative(DIST, fileURLToPath(url)).split(sep).join('/')
  return path.replace(/(^|\/)index\.html$/, '$1')
}

/** message → {pages, extract}. The extract is the first occurrence's, as a pointer. */
const groups = new Map()
for (const error of errors) {
  if (!groups.has(error.message)) {
    groups.set(error.message, {pages: new Set(), extract: error.extract ?? ''})
  }
  groups.get(error.message).pages.add(pageOf(error.url))
}

const pageCount = readdirSync(DIST, {recursive: true}).filter((f) => f.endsWith('.html')).length

const where = (pages) => {
  if (pages.size === pageCount) return `every page (${pageCount}) — likely a template`
  const list = [...pages].sort()
  return list.slice(0, 3).join(', ') + (list.length > 3 ? `, and ${list.length - 3} more` : '')
}

const lines = [`HTML validation: ${pageCount} pages in ${DIST}`, '']
for (const [message, {pages, extract}] of [...groups].sort(
  (a, b) => b[1].pages.size - a[1].pages.size,
)) {
  lines.push(`✗ ${message}`, `    on ${where(pages)}`)
  if (extract) lines.push(`    near: ${extract.replace(/\s+/g, ' ').trim()}`)
  lines.push('')
}
lines.push(
  errors.length
    ? `✗ ${errors.length} ${errors.length === 1 ? 'error' : 'errors'} to fix.`
    : '✓ Every page is valid HTML.',
)

const text = lines.join('\n')
console.log(text)

// On GitHub, also put the report on the run's summary page, as the link check does.
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + text + '\n```\n')
}

process.exit(errors.length ? 1 : 0)
