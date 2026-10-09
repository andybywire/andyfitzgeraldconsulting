/**
 * Link check — does every link in the built site name something the build contains?
 *
 * ── RUN IT AGAINST A BUILD ──────────────────────────────────────────────────
 *
 *   pnpm --filter web build && pnpm links
 *
 * It reads a built site and nothing else: no network, no Sanity, no dependencies. An optional
 * argument names the directory to read, which is how deploy-astro.yml points it at the release
 * tarball's `public/`. The default is `web/dist`.
 *
 * ── WHAT FAILS ──────────────────────────────────────────────────────────────
 *
 * Every `<a href>` that stays on this site is checked against the build it sits in. Four kinds
 * of finding, and every one fails:
 *
 *   no page             Nothing in the build at that path. Old paths like `/writing/…` land
 *                       here too: nginx 301s them, but a link should name where it lands, not
 *                       where it used to.
 *   no trailing slash   `/consulting` where the page is `/consulting/`. It works, through a 301
 *                       on every click. Two template links had drifted this way by 2026-10-02,
 *                       with nothing to stop the next.
 *   own domain          `https://andyfitzgeraldconsulting.com/…`, or www., or preview., in an
 *                       href. Moz's redirect-chain report found 45 of these in article bodies,
 *                       fixed by hand. Root-relative is shorter and survives a domain change —
 *                       and on the preview host, an absolute link leaves for production.
 *   missing fragment    `#x` or `/page/#x` where no element on that page carries `id="x"`. The
 *                       skip link, footnotes and heading anchors all depend on this.
 *
 * All four stood at ZERO on 2026-10-08, across 84 pages and 2,849 on-site links, so the check
 * started green without any content work.
 *
 * `trailingSlash: 'always'` in astro.config.mjs was the other way to enforce the slash, and was
 * passed over. It catches template links only, and only in the dev server, and only when
 * someone follows one. This reads article bodies too — which is where the 45 were.
 *
 * ── WHAT IT DOES NOT CHECK ──────────────────────────────────────────────────
 *
 *   external links     325 URLs on 132 hosts (2026-10-08). Deferred to its own warning-only
 *                      piece (Andy, 2026-10-08): another site's outage is not a defect here,
 *                      and checking them well takes retries, rate limits and a tool built for
 *                      it.
 *   assets             `<link>`, `<img>`, `<script>`. Astro writes and hashes its own, so a
 *                      broken one is a build bug; images are on cdn.sanity.io.
 *   feeds, sitemap     Absolute URLs by design, and not HTML.
 *   search results     Rendered in the browser from /search.json, so not in any page.
 *
 * ── PATTERNS, NOT A PARSER, AND WHY THAT IS SAFE HERE ──────────────────────
 *
 * This reads Astro's output, not arbitrary HTML, and Astro writes every attribute value in
 * double quotes. So two patterns are enough: one finds each `<a …>` tag, stepping over quoted
 * values so `title="a > b"` cannot end the tag early, and one reads the `href` out of it. A
 * parser would be a dependency spent on quoting styles this input does not contain.
 *
 * `<script>`, `<style>` and comments are removed first. Without that, an inline script that
 * builds markup — `<a href="${url}">` — would read as a link to a page called `${url}`.
 *
 * WHAT WOULD BREAK IT, and both fail OPEN: a single-quoted or unquoted href, which Astro never
 * writes but a raw HTML block in content could, would be skipped rather than checked; and
 * `id="x"` appearing as literal text, in a code sample, would let `#x` pass with no element
 * behind it. Neither occurs today, and a silent pass on a rare input is an accepted trade
 * against a dependency.
 *
 * ── A BUILD CHECKED AGAINST ITSELF NEEDS NO STALENESS GUARD ───────────────
 *
 * parity.mjs refuses a stale `dist/`, because it compares the build with the dataset. This
 * compares the build with the build, so a stale `dist/` gets a correct answer about an old
 * build. Rebuild first when the question is about today's content.
 *
 * ── WHERE IT RUNS, AND WHAT A FAILURE HOLDS ─────────────────────────────────
 *
 * Decided 2026-10-08 (Andy):
 *
 *   every branch push    checks.yml builds the site and runs this, so a template change that
 *                        breaks links is red BEFORE the merge.
 *   every production     deploy-astro.yml runs this BESIDE the deploy, not in front of it. A
 *   build                failure turns the run red once the site has shipped. It NEVER holds
 *                        the deploy.
 *
 * Never holding the deploy is the point. Production rebuilds on every Sanity publish, so a
 * blocking check would let an editorial action freeze the site. The case that decided it is
 * unpublishing: take down an article other pages link to, and a blocking check would keep it
 * LIVE until every link to it was fixed. parity.mjs reached the same conclusion by the same
 * route — see its EXIT CODES.
 *
 * A branch builds against PUBLISHED content, as production does, so a branch can go red for a
 * link published from the Studio rather than for anything on the branch. The report names the
 * pages carrying each link, and a link found on every page is almost certainly a template's.
 *
 * ── PROVEN 2026-10-08 ───────────────────────────────────────────────────────
 *
 * A gate is not known to work until it has failed, so this one was made to:
 *
 *   by hand          A fake site holding one of each fault, plus the traps above — a `>` in a
 *                    quoted title, links inside a `<script>` and a comment, a protocol-relative
 *                    own-domain link, a percent-escaped fragment. Every fault was reported, and
 *                    none of the traps.
 *   on the runner    checks.yml on the `link-check` branch: green, at 84 pages and 2,849 links,
 *                    the same as on a Mac. Then a scratch branch, `link-check-proof`, with three
 *                    faults in the footer: a missing slash, an own-domain link and a missing
 *                    fragment. The site job went red with all three, each "on every page (84) —
 *                    likely a template", while the code job stayed green.
 *   in production    deploy-astro.yml's job, on the merge (2026-10-08): green, and it started in
 *                    the same second as the deploy, which is the arrangement working — nothing
 *                    waited on it. It was `links` then and is `site` now, beside HTML validation.
 *   still unproven   Red-after-deploy from a Sanity publish, which only a real broken link will
 *                    exercise, or a deliberate one published and taken back.
 *
 * To re-prove it after changing it, do the same: break it on purpose and watch it go red.
 *
 * ── EXIT CODES ──────────────────────────────────────────────────────────────
 *
 *   0  every on-site link resolves
 *   1  at least one finding
 *   2  no built site where it looked
 */
import {appendFileSync, existsSync, readFileSync, readdirSync, statSync} from 'node:fs'
import {join, posix, relative, resolve, sep} from 'node:path'
import {fileURLToPath} from 'node:url'

const DIST = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../dist', import.meta.url))

/** The hosts that ARE this site. An href naming one should be root-relative instead. */
const OWN_HOSTS = new Set([
  'andyfitzgeraldconsulting.com',
  'www.andyfitzgeraldconsulting.com',
  'preview.andyfitzgeraldconsulting.com',
])

/** Relative hrefs resolve against this, so they come out on one of OWN_HOSTS. */
const BASE = 'https://andyfitzgeraldconsulting.com'

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`No built site at ${DIST}. Run \`pnpm --filter web build\` first.`)
  process.exit(2)
}

/** Every `.html` file under the build, as [file, the URL path it is served at]. */
const pages = (dir = DIST) =>
  readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return pages(path)
    if (!entry.name.endsWith('.html')) return []
    const url = '/' + relative(DIST, path).split(sep).join('/')
    return [[path, url.replace(/(^|\/)index\.html$/, '$1')]]
  })

/** Markup that is not the page's own: inline scripts and styles, and comments. */
const strip = (html) =>
  html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, '')

/** An `<a>` start tag, stepping over double-quoted values. Group 1 is its attributes. */
const ANCHOR = /<a\b((?:"[^"]*"|[^>"])*)>/gi
const HREF = /\shref="([^"]*)"/i
const ID = /\sid="([^"]*)"/g

/** The entities Astro writes inside attribute values. `&amp;` last, so nothing decodes twice. */
const decode = (value) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

/** `decodeURIComponent`, or null for a malformed escape rather than a crash. */
const unescape = (value) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

/** The file that serves a URL path, or null. A path ending in `/` is a directory's index. */
const fileFor = (pathname) => {
  const path = unescape(pathname)
  if (path === null) return null
  const file = join(DIST, ...path.split('/'))
  if (path.endsWith('/'))
    return existsSync(join(file, 'index.html')) ? join(file, 'index.html') : null
  return existsSync(file) && statSync(file).isFile() ? file : null
}

const idCache = new Map()
const idsIn = (file) => {
  if (!idCache.has(file)) {
    const html = strip(readFileSync(file, 'utf8'))
    idCache.set(file, new Set([...html.matchAll(ID)].map((match) => decode(match[1]))))
  }
  return idCache.get(file)
}

/** kind → href → the pages that carry it. */
const findings = new Map()
const report = (kind, href, page) => {
  if (!findings.has(kind)) findings.set(kind, new Map())
  const hrefs = findings.get(kind)
  if (!hrefs.has(href)) hrefs.set(href, new Set())
  hrefs.get(href).add(page)
}

const all = pages()
let checked = 0

for (const [file, page] of all) {
  for (const [, attributes] of strip(readFileSync(file, 'utf8')).matchAll(ANCHOR)) {
    const raw = attributes.match(HREF)?.[1]
    if (raw === undefined) continue // an `<a>` with no href is not a link
    const href = decode(raw).trim()

    // mailto:, tel: and the like name no page. Only http(s) and scheme-less hrefs go on.
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) && !/^https?:/i.test(href)) continue

    let url
    try {
      url = new URL(href, BASE + page)
    } catch {
      report('unparseable', href, page)
      continue
    }
    if (!OWN_HOSTS.has(url.hostname)) continue // external — not this check
    checked++

    // Absolute or protocol-relative. Reported AND resolved, so an old `www.…/writing/` link
    // shows up as both of the things wrong with it.
    if (/^(https?:)?\/\//i.test(href)) report('own domain', href, page)

    const target = fileFor(url.pathname)
    if (!target) {
      const slashless =
        !url.pathname.endsWith('/') && !posix.extname(url.pathname) && fileFor(url.pathname + '/')
      report(slashless ? 'no trailing slash' : 'no page', href, page)
      continue
    }

    const fragment = url.hash.length > 1 ? unescape(url.hash.slice(1)) : undefined
    if (fragment !== undefined && !idsIn(target).has(fragment)) {
      report('missing fragment', href, page)
    }
  }
}

/* ── Report ───────────────────────────────────────────────────────────────── */

const where = (pageSet) => {
  if (pageSet.size === all.length) return `every page (${all.length}) — likely a template`
  const list = [...pageSet].sort()
  return list.slice(0, 3).join(', ') + (list.length > 3 ? `, and ${list.length - 3} more` : '')
}

const lines = [`Link check: ${all.length} pages, ${checked} on-site links in ${DIST}`, '']
for (const [kind, hrefs] of findings) {
  lines.push(`✗ ${kind} — ${hrefs.size} ${hrefs.size === 1 ? 'link' : 'links'}`)
  for (const [href, pageSet] of [...hrefs].sort((a, b) => b[1].size - a[1].size)) {
    lines.push(`    ${href}`, `        on ${where(pageSet)}`)
  }
  lines.push('')
}
lines.push(findings.size ? '✗ Links need fixing.' : '✓ Every on-site link resolves.')

const text = lines.join('\n')
console.log(text)

// On GitHub, also put the report on the run's summary page — a red production run is read
// there, after the deploy, by someone who may not open the logs.
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + text + '\n```\n')
}

process.exit(findings.size ? 1 : 0)
