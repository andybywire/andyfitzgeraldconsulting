/**
 * Accessibility — does every page pass axe, in every theme, at both widths?
 *
 * ── RUN IT AGAINST A BUILD ──────────────────────────────────────────────────
 *
 *   pnpm --filter web build && pnpm a11y
 *
 * NEEDS GOOGLE CHROME. On a Mac, the one in /Applications; on GitHub's runner, the one the image
 * preinstalls. CHROME_PATH overrides the search. An optional argument names the directory to
 * read, as for the other two site gates; the default is `web/dist`. It serves that directory
 * itself, on a free port, and needs no dev server.
 *
 * ── axe-core, DRIVEN DIRECTLY, AND WHY NOT PLAYWRIGHT ──────────────────────
 *
 * axe-core is Deque's accessibility engine — the de facto standard, and the one Lighthouse runs
 * under its accessibility score. It is plain JavaScript that runs INSIDE a page, so all a gate
 * needs is a browser to load each page in and a way to hand it the script.
 *
 * That way is the Chrome DevTools Protocol, over Node's built-in WebSocket: launch headless
 * Chrome, navigate, evaluate. Playwright and Puppeteer wrap the same protocol, and each would
 * download a browser of its own (~150 MB) and a dependency tree, to do what the functions below
 * do. So `axe-core` is the only dependency, and it is pinned exactly, because axe adds rules in
 * minor releases and a gate whose verdict changes when nothing here did is a gate nobody trusts.
 * Decided with Andy, 2026-10-08.
 *
 * ── WHAT FAILS ──────────────────────────────────────────────────────────────
 *
 * Every rule axe runs by default: WCAG 2.0, 2.1 and 2.2 at levels A and AA, plus its
 * best-practice rules. Not AAA, and not the rules axe itself marks experimental. On 2026-10-08,
 * across 84 pages in four configurations, exactly one real failure existed — the facet chips'
 * Label in Name, fixed in the same change (see FacetFilters.astro) — so it started green.
 *
 * ── WHAT A PASS DOES NOT MEAN ──────────────────────────────────────────────
 *
 * Automated checks find roughly a third of WCAG failures. Nothing here tests keyboard use, focus
 * order, what a screen reader actually announces, whether alt text is any GOOD, or interactive
 * states — search open, the mobile menu expanded. A pass is a floor, not a verdict.
 *
 * ── FIVE CONFIGURATIONS, AND WHY THESE ─────────────────────────────────────
 *
 *   desktop  light                 tokens.css's `:root`
 *   desktop  dark, from the OS     the `prefers-color-scheme: dark` block
 *   desktop  dark, from the toggle the `[data-theme="dark"]` block
 *   phone    light
 *   phone    dark, from the OS
 *
 * The three desktop states are the three CSS blocks a color token can be wrong in — CLAUDE.md →
 * Theme switching: "every token now has three places it can be wrong". The toggle state is
 * reproduced the way a visitor makes it, by the stored choice BaseLayout's head script reads,
 * and every page is checked to have actually reached the theme it claims. A configuration that
 * silently scanned the wrong theme would pass for the wrong reason.
 *
 * The phone runs cover the other layout: the rail is gone, the navigation differs, and the
 * Topics list moves to the foot of the article. The toggle state is not repeated there — it is
 * the same tokens as on desktop, and the layout is covered by the two phone runs.
 *
 * ── REDUCED MOTION, AND THE ARTIFACT IT PREVENTS ────────────────────────────
 *
 * Every page is scanned with `prefers-reduced-motion: reduce`, and after any running animation
 * has finished. The first measurement found a dark-mode contrast failure in 1 run in 10, at
 * random: axe had sampled links partway through base.css's 0.15s color transition, in colors
 * that were no token at all. A normal page load starts no transition, so visitors never saw it —
 * it was the harness. base.css already turns link transitions off under reduced motion; this
 * uses that rule rather than inventing a second one.
 *
 * ── WHERE IT RUNS, AND WHAT A FAILURE HOLDS ─────────────────────────────────
 *
 * Exactly where the link check and HTML validation run, on the same terms: checks.yml builds and
 * runs it on every branch push, and deploy-astro.yml runs it beside the production deploy, never
 * in front of it. See check-links.mjs → WHERE IT RUNS.
 *
 * ── PROVEN 2026-10-08 ───────────────────────────────────────────────────────
 *
 * A gate is not known to work until it has failed, so this one was made to:
 *
 *   by hand          A build from before the chip fix failed on 20 elements — 19 chips and the
 *                    close-search button — in every configuration; the build after it, on the
 *                    button alone. The button's wordings were then tried inside the real
 *                    /search/ page, because in isolation axe passes even the failing one.
 *   on the runner    The `accessibility-check` branch went red on exactly that button, with the
 *                    runner's Chrome starting under its sandbox — Ubuntu 24.04 restricts the
 *                    namespaces it uses, and no flag turned out to be needed. With the button
 *                    renamed it went green: 84 pages × 5 configurations in 125s, against about
 *                    45s on a Mac. Every page reached its theme on both machines.
 *   in production    deploy-astro.yml's step, on the merge (2026-10-08): green, and still running
 *                    two minutes after the deploy beside it had finished — the arrangement
 *                    doing its job.
 *   still unproven   Red-after-deploy from a Sanity publish, as for the other gates.
 *
 * To re-prove it after changing it, do the same: break it on purpose and watch it go red.
 *
 * ── EXIT CODES ──────────────────────────────────────────────────────────────
 *
 *   0  no violations
 *   1  at least one violation
 *   2  it could not run — no build, no Chrome, a page that would not load, a theme that was not
 *      reached, or axe itself failing. Kept apart from 1, so a broken harness is never read as
 *      a verdict on the site.
 */
import {createServer} from 'node:http'
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs'
import {spawn, spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {tmpdir} from 'node:os'
import {extname, join, resolve, sep} from 'node:path'
import {fileURLToPath} from 'node:url'

const DIST = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../dist', import.meta.url))

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')

const CONFIGS = [
  {name: 'desktop, light', width: 1280, mobile: false, scheme: 'light'},
  {name: 'desktop, dark (system)', width: 1280, mobile: false, scheme: 'dark'},
  {name: 'desktop, dark (toggle)', width: 1280, mobile: false, scheme: 'light', stored: 'dark'},
  {name: 'phone, light', width: 375, mobile: true, scheme: 'light'},
  {name: 'phone, dark (system)', width: 375, mobile: true, scheme: 'dark'},
]

/** How long a page may take to load, and how long to wait for animations to settle. */
const LOAD_TIMEOUT_MS = 15_000
const SETTLE_CAP_MS = 2_000

/* ── Teardown, which every exit goes through ─────────────────────────────── */

let chrome, server, profile
const cleanup = () => {
  chrome?.kill()
  server?.close()
  // Chrome can still hold the profile for a moment after the kill; a leftover temp directory
  // is not worth failing a finished run over.
  try {
    if (profile) rmSync(profile, {recursive: true, force: true})
  } catch {}
}

const fail = (message) => {
  console.error(message)
  cleanup()
  process.exit(2)
}

if (!existsSync(join(DIST, 'index.html'))) {
  fail(`No built site at ${DIST}. Run \`pnpm --filter web build\` first.`)
}

/* ── The pages, and a server for them ────────────────────────────────────── */

/** Every `.html` file, as the URL path it is served at. */
const pages = readdirSync(DIST, {recursive: true})
  .filter((file) => file.endsWith('.html'))
  .map((file) => ('/' + file.split(sep).join('/')).replace(/(^|\/)index\.html$/, '$1'))
  .sort()

const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
}

server = createServer((request, response) => {
  let file = join(DIST, decodeURIComponent(new URL(request.url, 'http://x').pathname))
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) return response.writeHead(404).end()
  response.writeHead(200, {'content-type': TYPES[extname(file)] ?? 'application/octet-stream'})
  response.end(readFileSync(file))
})
await new Promise((ready) => server.listen(0, '127.0.0.1', ready))
const ORIGIN = `http://127.0.0.1:${server.address().port}`

/* ── Chrome ───────────────────────────────────────────────────────────────── */

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
]
  .filter(Boolean)
  .find((candidate) => spawnSync(candidate, ['--version']).status === 0)

if (!CHROME) fail('No Chrome found. Install Google Chrome, or set CHROME_PATH.')

// A throwaway profile, never anyone's real one. Port 0 lets Chrome pick a free debugging port
// and write it to DevToolsActivePort in the profile, so two runs never collide.
profile = mkdtempSync(join(tmpdir(), 'afc-a11y-'))
let chromeLog = ''
chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    'about:blank',
  ],
  {stdio: ['ignore', 'ignore', 'pipe']},
)
chrome.stderr.on('data', (chunk) => (chromeLog = (chromeLog + chunk).slice(-2000)))

let socket
for (let waited = 0; waited < 10_000 && !socket; waited += 100) {
  await new Promise((r) => setTimeout(r, 100))
  const portFile = join(profile, 'DevToolsActivePort')
  if (!existsSync(portFile)) continue
  const port = readFileSync(portFile, 'utf8').split('\n')[0]
  // The file can appear a moment before the port answers; the next pass retries.
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`)
    .then((r) => r.json())
    .catch(() => [])
  const page = targets.find((target) => target.type === 'page')
  if (page) socket = new WebSocket(page.webSocketDebuggerUrl)
}
if (!socket) fail(`Chrome did not start (${CHROME}).\n${chromeLog}`)
await new Promise((open) => socket.addEventListener('open', open))

/* ── The protocol, as much of it as this needs ───────────────────────────── */

let nextId = 0
const replies = new Map()
const listeners = new Set()
socket.addEventListener('message', ({data}) => {
  const message = JSON.parse(data)
  if (replies.has(message.id)) {
    replies.get(message.id)(message)
    replies.delete(message.id)
  } else {
    for (const listener of listeners) listener(message)
  }
})

const send = (method, params = {}) =>
  new Promise((reply) => {
    const id = ++nextId
    replies.set(id, reply)
    socket.send(JSON.stringify({id, method, params}))
  })

/** Evaluate in the page and return the value, failing the run on an exception. */
const evaluate = async (expression) => {
  const reply = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (reply.error) fail(`Chrome refused an evaluation: ${reply.error.message}`)
  if (reply.result.exceptionDetails) {
    fail(`Script failed in the page: ${reply.result.exceptionDetails.exception?.description}`)
  }
  return reply.result.result.value
}

/** Navigate, and resolve once the page's load event has fired. */
const load = (url) =>
  new Promise((loaded, failed) => {
    const timer = setTimeout(() => failed(new Error(`${url} did not load`)), LOAD_TIMEOUT_MS)
    const listener = (message) => {
      if (message.method !== 'Page.loadEventFired') return
      clearTimeout(timer)
      listeners.delete(listener)
      loaded()
    }
    listeners.add(listener)
    send('Page.navigate', {url}).then(({result}) => {
      if (result?.errorText) failed(new Error(`${url}: ${result.errorText}`))
    })
  })

await send('Page.enable')

/* ── Scan ─────────────────────────────────────────────────────────────────── */

/** rule → {help, impact, helpUrl, nodes: target → {html, pages, configs}} */
const rules = new Map()
const started = Date.now()

for (const config of CONFIGS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: config.width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: config.mobile,
  })
  await send('Emulation.setEmulatedMedia', {
    features: [
      {name: 'prefers-color-scheme', value: config.scheme},
      {name: 'prefers-reduced-motion', value: 'reduce'},
    ],
  })

  // The stored theme choice, set before any of the page's own script runs — which is how the
  // head script finds it on a real visit. Cleared for the configurations that have none.
  const {result: injected} = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: config.stored
      ? `try { localStorage.setItem('theme', ${JSON.stringify(config.stored)}) } catch {}`
      : `try { localStorage.removeItem('theme') } catch {}`,
  })

  for (const page of pages) {
    await load(ORIGIN + page).catch((error) => fail(error.message))

    // Prove the configuration reached the theme it claims, before trusting anything it finds.
    const theme = await evaluate(`JSON.stringify({
      attribute: document.documentElement.dataset.theme ?? null,
      dark: matchMedia('(prefers-color-scheme: dark)').matches,
    })`).then(JSON.parse)
    if (theme.attribute !== (config.stored ?? null) || theme.dark !== (config.scheme === 'dark')) {
      fail(`${page} did not reach "${config.name}": ${JSON.stringify(theme)}`)
    }

    await evaluate(`(async () => {
      await document.fonts.ready
      const settled = Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})))
      await Promise.race([settled, new Promise((r) => setTimeout(r, ${SETTLE_CAP_MS}))])
    })()`)

    // `void 0` so the evaluation returns nothing: axe's source evaluates to its API object,
    // which cannot be sent back by value. The newline keeps it clear of a trailing comment.
    await evaluate(`${AXE}\n;void 0`)
    const violations = await evaluate(`axe.run(document, {resultTypes: ['violations']}).then((r) =>
      r.violations.map((v) => ({
        id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({target: n.target.join(' '), html: n.html})),
      })))`)

    for (const violation of violations) {
      if (!rules.has(violation.id)) rules.set(violation.id, {...violation, nodes: new Map()})
      const nodes = rules.get(violation.id).nodes
      for (const node of violation.nodes) {
        if (!nodes.has(node.target)) {
          nodes.set(node.target, {html: node.html, pages: new Set(), configs: new Set()})
        }
        nodes.get(node.target).pages.add(page)
        nodes.get(node.target).configs.add(config.name)
      }
    }
  }

  await send('Page.removeScriptToEvaluateOnNewDocument', {identifier: injected.identifier})
}

const seconds = Math.round((Date.now() - started) / 1000)
cleanup()

/* ── Report ───────────────────────────────────────────────────────────────── */

const where = (set) => {
  if (set.size === pages.length) return `every page (${pages.length}) — likely a template`
  const list = [...set].sort()
  return list.slice(0, 3).join(', ') + (list.length > 3 ? `, and ${list.length - 3} more` : '')
}
const when = (set) =>
  set.size === CONFIGS.length ? 'every configuration' : `only ${[...set].join('; ')}`

/** How many elements to show per rule before summarizing the rest. */
const SHOWN = 8

const lines = [
  `Accessibility: ${pages.length} pages × ${CONFIGS.length} configurations, ${seconds}s, in ${DIST}`,
  '',
]
let elements = 0
for (const [id, rule] of rules) {
  elements += rule.nodes.size
  lines.push(`✗ ${id} (${rule.impact}) — ${rule.help}`, `    ${rule.helpUrl}`)
  const sorted = [...rule.nodes].sort((a, b) => b[1].pages.size - a[1].pages.size)
  for (const [target, node] of sorted.slice(0, SHOWN)) {
    lines.push(
      `    ${target}`,
      `        ${node.html.replace(/\s+/g, ' ').slice(0, 160)}`,
      `        on ${where(node.pages)}, in ${when(node.configs)}`,
    )
  }
  if (sorted.length > SHOWN) lines.push(`    and ${sorted.length - SHOWN} more elements`)
  lines.push('')
}
lines.push(
  rules.size
    ? `✗ ${rules.size} ${rules.size === 1 ? 'rule' : 'rules'} failing on ${elements} ${elements === 1 ? 'element' : 'elements'}.`
    : '✓ No axe violations.',
)

const text = lines.join('\n')
console.log(text)

// On GitHub, also put the report on the run's summary page, as the other site gates do.
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + text + '\n```\n')
}

process.exit(rules.size ? 1 : 0)
