/**
 * External link check — do this site's links to other sites still lead somewhere?
 *
 * ── RUN IT AGAINST A BUILD ──────────────────────────────────────────────────
 *
 *   pnpm --filter web build && pnpm external-links
 *
 * This is the second of two steps. lychee requests every external link in the build and writes
 * what came back as JSON — web/lychee.toml says how, and why it is set up as it is. This reads
 * that JSON, decides what each failure means, and sets the exit code. Its one argument is the
 * JSON's path. `pnpm external-links` runs both steps locally, lychee in Docker;
 * .github/workflows/external-links.yml runs them in CI.
 *
 * lychee collects and this judges because of the middle category below. lychee's `accept` list
 * can make a status pass or fail and nothing else, so "blocked" would have to be red or invisible.
 *
 * ── WHAT FAILS ──────────────────────────────────────────────────────────────
 *
 * Only the clearly broken (Andy, 2026-10-09):
 *
 *   404, 410        The page is gone, and the site says so.
 *   no such host    The name does not resolve at all — decided here, by a DNS lookup, not by
 *                   lychee. See TRAPS.
 *
 * A failure turns the run red, and GitHub's failure email is the notification.
 *
 * ── WHAT IS LISTED, AND NEVER FAILS ─────────────────────────────────────────
 *
 * Everything else that did not answer 2xx is listed to "check by hand", because a person with a
 * browser can tell what an automated request cannot:
 *
 *   blocked   401, 403, 429, 999, or a host that resolves but would not talk to us. The site
 *             turned away a robot, which says nothing about the page.
 *   TLS       A certificate or handshake failure. 17 of the 19 on 2026-10-10 were one conference
 *             site, whose files open in a browser.
 *   moved     A redirect lychee did not follow. On 2026-10-10, three old uxbooth links
 *             redirecting in a loop: worth updating, not broken.
 *   other     5xx, timeouts, protocol errors — anything that may be gone by the next run.
 *
 * Keeping these out of the exit code is not leniency. They do not repeat: two runs ten minutes
 * apart on 2026-10-10 disagreed about Amazon, Medium, GitHub and LinkedIn, while the 404s did not
 * move. A gate that failed on them would fail at random.
 *
 * Also listed, as NOT CHECKED: every URL lychee.toml excludes, apart from this site's own and
 * Sanity's CDN, which belong to other checks. LinkedIn is the one today. An exclusion makes a
 * link unchecked, never invisible.
 *
 * ── WHERE TO FIX IT ─────────────────────────────────────────────────────────
 *
 * Each URL is reported with the pages that show it AND the documents that hold it, each with a
 * link that opens it in the Studio, which is where it gets fixed (Andy, 2026-10-10). The two are
 * not the same thing: an event's URL is held by the `event` and shown on a presentation's page.
 *
 * The lookup reads every published document, anonymously, as the production build does, and
 * matches whole string values against each URL, both sides normalized by `new URL()`. So there is
 * no list of link-carrying fields to keep current: a new one is found the day it exists. A URL no
 * document holds is in a template, like web/src/lib/social.ts, or is built from a field rather
 * than stored in one, and is reported with its pages alone.
 *
 * A lookup that fails is reported, and the URLs carry pages alone. It never changes the exit code:
 * whether a link is broken does not depend on Sanity answering.
 *
 * ── TRAPS, MEASURED 2026-10-10 AGAINST lychee 0.24.2 ────────────────────────
 *
 *   dead hosts      lychee reports a name that does not resolve as "Connection failed. Check
 *                   network connectivity and firewall settings" — the same words as a firewall
 *                   that drops the connection. Both dead hosts on 2026-10-10 read that way. So
 *                   every network failure that is not TLS gets a DNS lookup here: no such name
 *                   is broken, and a name that resolves is blocked.
 *   repeats         lychee requests a URL once and reports it on every page that carries it.
 *                   The repeats read "Error (cached)": they keep an HTTP code but lose a network
 *                   failure's detail. So results are grouped by URL and judged on the first full
 *                   entry; the rest are only more pages.
 *   GitHub          Answers some requests 503 and not others. The same ux-methods link was a 404
 *                   in one run and a 503 in the next, so a broken GitHub link can spend a run in
 *                   "other" before it shows as broken.
 *   root-relative   lychee reports every `/insights/…` link as an error unless it can resolve
 *                   it. lychee.toml's `base_url` handles that; anything that is not http(s) is
 *                   dropped here too, so losing the setting costs noise, not a false failure.
 *   an empty run    Given a glob that matches no files, lychee warns, writes a report with
 *                   `"total": 0` and EXITS 0. Read naively that is "every link fine", so a run
 *                   that checked nothing exits 2 here instead.
 *
 * ── PROVEN 2026-10-10 ───────────────────────────────────────────────────────
 *
 * A gate is not known to work until it has failed, so this one was made to:
 *
 *   real reports     The two lychee runs made while building this, on Andy's Mac. The first,
 *                    made before `base_url`, carried 3,956 root-relative errors; all were dropped,
 *                    and 15 broken links came out — the 13 404s and both dead hosts, each matched
 *                    to its article. The second found 13, with two ux-methods 404s answered 503
 *                    that run: the GitHub trap above, caught in the act. Andy's own LinkedIn
 *                    link, blocked on all 84 pages, came out as "no document — a template".
 *   by hand          A fake report with one entry of each kind: 404, 410, a dead `.invalid` host,
 *                    403, 429, a refusal from a host that resolves, two TLS failures — one whose
 *                    first entry was a detail-less repeat — 301, 503, 418, a timeout, two non-http
 *                    entries, and one exclusion of each kind. Each landed in its category, and the
 *                    exclusions that belong to other checks stayed silent. Then the exit codes: 0
 *                    for a report with only a 403, 2 for an empty file, a truncated one, a missing
 *                    one, no argument and lychee's own report of an empty glob. With Sanity
 *                    unreachable, the report said so, named pages alone and still exited 1.
 *   end to end       `pnpm external-links` with LinkedIn excluded: 16 seconds, 15 broken, 32 to
 *                    check by hand, 31 not checked.
 *   on the runner    external-links.yml on the `external-link-check` branch: RED, on the same 15,
 *                    each with its Studio link, and the lychee step green beside it, as designed.
 *                    None of the five ux-methods 404s came back 503 there — lychee checks
 *                    github.com through the API when it has the workflow's token. The runner was
 *                    blocked more than a Mac (Gartner, ISO, Udemy), and infotoday reset the
 *                    connection rather than failing TLS: 39 to check by hand, none failing. Andy
 *                    fixed the 15 in the Studio, and a re-run went GREEN with nothing broken.
 *   still unproven   The monthly schedule, whose first run is 2026-11-01.
 *
 * To re-prove it after changing it, do the same: break it on purpose and watch it go red.
 *
 * ── EXIT CODES ──────────────────────────────────────────────────────────────
 *
 *   0  nothing broken — there may still be links to check by hand
 *   1  at least one broken link
 *   2  no lychee report to read, or one from a run that checked nothing
 */
import {createClient} from '@sanity/client'
import {lookup} from 'node:dns/promises'
import {appendFileSync, existsSync, readFileSync} from 'node:fs'

/** The deployed Studio — `studioHost` in studio/sanity.cli.ts — not the local .env's, which may
 * point at a dev server. The report is read from a GitHub email, where only this one opens. */
const STUDIO = 'https://afconsulting.sanity.studio'

/** lychee.toml's exclusions that belong to other checks, so are never reported as unchecked.
 * The same two patterns as there: change them together. */
const SILENT = [
  /^https?:\/\/([a-z]+\.)?andyfitzgeraldconsulting\.com([/:?#]|$)/i,
  /^https:\/\/cdn\.sanity\.io\//i,
]

const HTTP = /^https?:\/\//i
const BLOCKED = new Set([401, 403, 429, 999])

const stop = (message) => {
  console.error(message)
  process.exit(2)
}

/* ── Reading lychee's report ──────────────────────────────────────────────── */

const input = process.argv[2]
if (!input) stop('Usage: node scripts/check-external-links.mjs <lychee JSON report>')

let report
try {
  report = JSON.parse(readFileSync(input, 'utf8'))
} catch (error) {
  stop(
    `No lychee report to read at ${input}: ${error.message}\n` +
      'lychee writes it, from a build, in Docker: run `pnpm --filter web build` first, check\n' +
      'that Docker is running, then `pnpm external-links`. lychee’s own error is above.',
  )
}
if (!report?.error_map || !report.total) {
  stop(`lychee checked nothing (total: ${report?.total}). Was there a built site where it looked?`)
}

/** The path a page is served at, from the file lychee read: `/input/…` in Docker, `web/dist/…`
 * in CI. */
const pageOf = (file) =>
  file.replace(/^(?:.*?\/)?(?:input|dist)\//, '/').replace(/(^|\/)index\.html$/, '$1')

/** Every page lychee read. Each carries own-domain links, which lychee excludes and lists, so
 * every page appears in some map even though passing links are not listed at all. */
const allPages = new Set()

/** url → {url, status, pages}: the failures, timeouts included. */
const failures = new Map()

/** url → pages: what lychee.toml excluded, and this report still names. */
const unchecked = new Map()

const isRepeat = (status) => /\(cached\)/i.test(status.text)

for (const map of ['error_map', 'timeout_map', 'excluded_map']) {
  for (const [file, entries] of Object.entries(report[map] ?? {})) {
    const page = pageOf(file)
    allPages.add(page)
    for (const {url, status} of entries) {
      if (!HTTP.test(url)) continue // root-relative and the like belong to check-links.mjs

      if (map === 'excluded_map') {
        if (SILENT.some((pattern) => pattern.test(url))) continue
        if (!unchecked.has(url)) unchecked.set(url, new Set())
        unchecked.get(url).add(page)
        continue
      }

      // The first full entry decides. A repeat only adds a page. See TRAPS → repeats.
      const failure = failures.get(url) ?? {url, status, pages: new Set()}
      if (isRepeat(failure.status) && !isRepeat(status)) failure.status = status
      failure.pages.add(page)
      failures.set(url, failure)
    }
  }
}

/* ── Judging each failure ─────────────────────────────────────────────────── */

/** lychee's reason, shortened: "Network error: TLS handshake failed. Check …" becomes "TLS
 * handshake failed". */
const reason = (status) =>
  (status.details ?? status.text).replace(/^(?:network error:\s*)+/i, '').split('. ')[0]

/** [category, label] for one failing URL. */
const classify = async ({url, status}) => {
  const {code} = status
  if (code === 404 || code === 410) return ['broken', String(code)]
  if (BLOCKED.has(code)) return ['blocked', String(code)]
  if (code >= 300 && code < 400) return ['moved', String(code)]
  if (code) return ['other', String(code)]

  const why = reason(status)
  if (/tls|ssl|certificate|handshake/i.test(why)) return ['tls', why]
  if (/timeout|timed out/i.test(why)) return ['other', why]

  // Any other network failure: does the name exist at all? See TRAPS → dead hosts.
  try {
    await lookup(new URL(url).hostname)
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') return ['broken', 'no such host']
    return ['other', `${why}, and DNS answered ${error.code}`]
  }
  return ['blocked', why]
}

const judged = await Promise.all(
  [...failures.values()].map(async (failure) => {
    const [category, label] = await classify(failure)
    return {...failure, category, label}
  }),
)

/* ── Which documents hold each URL ────────────────────────────────────────── */

const normalize = (value) => {
  if (typeof value !== 'string' || !HTTP.test(value.trim())) return null
  try {
    return new URL(value.trim()).href
  } catch {
    return null
  }
}

/** url → [{id, type, title}]. Throws when Sanity cannot be read, and the caller reports it. */
const holdersOf = async (urls) => {
  const env = new URL('../.env', import.meta.url)
  if (existsSync(env)) process.loadEnvFile(env) // in CI the workflow's `env` sets these instead
  const {PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset} = process.env
  if (!projectId || !dataset) {
    throw new Error('PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET are not set')
  }

  // Published content, anonymously, as the production build reads it. `sanity.*` are the asset
  // records, which hold no links of ours.
  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2026-08-18',
    useCdn: false,
    perspective: 'published',
  })
  const docs = await client.fetch('*[!(_type match "sanity.*")]')

  const wanted = new Map([...urls].map((url) => [normalize(url), url]))
  const holders = new Map()
  const walk = (value, doc) => {
    if (Array.isArray(value)) return value.forEach((item) => walk(item, doc))
    if (value && typeof value === 'object') {
      return Object.values(value).forEach((item) => walk(item, doc))
    }
    const url = wanted.get(normalize(value))
    if (!url) return
    if (!holders.has(url)) holders.set(url, new Map())
    // An event is named by its `event` field, a client by `name`, everything else by `title`.
    const title = doc.title ?? doc.name ?? doc.event ?? doc._id
    holders.get(url).set(doc._id, {id: doc._id, type: doc._type, title})
  }
  for (const doc of docs) walk(doc, doc)
  return new Map([...holders].map(([url, byId]) => [url, [...byId.values()]]))
}

let holders = new Map()
let lookupError
if (failures.size) {
  try {
    holders = await holdersOf(failures.keys())
  } catch (error) {
    lookupError = error.message
  }
}

/* ── Report ───────────────────────────────────────────────────────────────── */

const CATEGORIES = {
  blocked: 'blocked — the site refused an automated request',
  tls: 'TLS — a certificate or handshake failure',
  moved: 'moved — a redirect that was not followed',
  other: 'other — server errors, timeouts, protocol errors',
}

const byUrl = (a, b) => a.url.localeCompare(b.url)
const broken = judged.filter((f) => f.category === 'broken').sort(byUrl)
const byHand = Object.keys(CATEGORIES).map((category) => [
  category,
  judged.filter((f) => f.category === category).sort(byUrl),
])
const handCount = judged.length - broken.length

const where = (pages) => {
  if (pages.size === allPages.size) return `every page (${allPages.size}) — likely a template`
  const list = [...pages].sort()
  return list.slice(0, 3).join(', ') + (list.length > 3 ? `, and ${list.length - 3} more` : '')
}

const studioLink = ({id, type}) => `${STUDIO}/intent/edit/id=${id};type=${type}/`
const NO_DOCUMENT = 'no document — a template, or built from a field'
const docsFor = (url) => (lookupError ? null : (holders.get(url) ?? []))

const verdict = broken.length
  ? `✗ ${broken.length} broken external ${broken.length === 1 ? 'link' : 'links'}.`
  : '✓ No broken external links.'

// For the terminal and the run's log.

const lines = [
  `External link check: ${allPages.size} pages, lychee ${report.duration?.secs ?? '?'}s, from ${input}`,
  '',
]
if (lookupError)
  lines.push(`! The Studio lookup failed, so links name pages only: ${lookupError}`, '')

const textEntry = (f) => {
  const out = [`    ${f.label}  ${f.url}`]
  const docs = docsFor(f.url)
  if (docs?.length)
    for (const d of docs) out.push(`        in  ${d.title} (${d.type})  ${studioLink(d)}`)
  else if (docs) out.push(`        in  ${NO_DOCUMENT}`)
  out.push(`        on  ${where(f.pages)}`)
  return out
}

if (broken.length) {
  lines.push(`✗ broken — ${broken.length}. These fail the run.`)
  for (const f of broken) lines.push(...textEntry(f))
  lines.push('')
}
if (handCount) {
  lines.push(`? to check by hand — ${handCount}. Listed, never failed.`)
  for (const [category, list] of byHand) {
    if (!list.length) continue
    lines.push(`  ${CATEGORIES[category]} (${list.length})`)
    for (const f of list) lines.push(...textEntry(f))
  }
  lines.push('')
}
if (unchecked.size) {
  lines.push(`– not checked — ${unchecked.size}, excluded in web/lychee.toml`)
  for (const [url, pages] of [...unchecked].sort()) lines.push(`    ${url}  on ${where(pages)}`)
  lines.push('')
}
lines.push(verdict)
console.log(lines.join('\n'))

// For the run's summary page, as Markdown, so the Studio links can be clicked. A red run is read
// there, from GitHub's failure email.

if (process.env.GITHUB_STEP_SUMMARY) {
  const escape = (text) => String(text).replace(/[\\[\]*_`<>]/g, '\\$&')
  const mdEntry = (f) => {
    const docs = docsFor(f.url)
    const held = docs?.length
      ? `in ${docs.map((d) => `[${escape(d.title)}](${studioLink(d)}) (${d.type})`).join(', ')} · `
      : docs
        ? `in ${NO_DOCUMENT} · `
        : ''
    return `- \`${f.label}\` <${f.url}><br>${held}on ${where(f.pages)}`
  }

  const md = ['## External link check', '', `**${verdict}**`, '']
  if (lookupError)
    md.push(`> The Studio lookup failed, so links name pages only: ${lookupError}`, '')
  if (broken.length) md.push('These fail the run:', '', ...broken.map(mdEntry), '')
  if (handCount) {
    md.push(`<details><summary>${handCount} to check by hand — listed, never failed</summary>`, '')
    for (const [category, list] of byHand) {
      if (list.length)
        md.push(`**${CATEGORIES[category]} (${list.length})**`, '', ...list.map(mdEntry), '')
    }
    md.push('</details>', '')
  }
  if (unchecked.size) {
    md.push(
      `<details><summary>${unchecked.size} not checked — excluded in web/lychee.toml</summary>`,
      '',
    )
    for (const [url, pages] of [...unchecked].sort()) md.push(`- <${url}> · on ${where(pages)}`)
    md.push('', '</details>', '')
  }
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n'))
}

process.exit(broken.length ? 1 : 0)
