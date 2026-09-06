// @ts-check
import {defineConfig, envField, fontProviders} from 'astro/config'
import {loadEnv} from 'vite'
import sanity from '@sanity/astro'
import react from '@astrojs/react'
import node from '@astrojs/node'

/**
 * This file runs at config time, BEFORE Astro loads `.env`, so `astro:env` is not
 * importable here. Vite's `loadEnv` reads the same files, and is the only way to hand
 * the Sanity integration a projectId at the moment it is constructed. Application code
 * should never do this — it imports from `astro:env/client` or `astro:env/server`
 * instead, where the values are typed and validated.
 */
const fileEnv = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')
const {PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET} = fileEnv

/**
 * One flag drives the whole deploy shape. CLAUDE.md's table has production/static/nginx/
 * indexed on one row and preview/server/PM2/noindex on the other, so output target, canonical
 * host and visual-editing state are all functions of the mode rather than independent knobs.
 */
const MODE = process.env.PUBLIC_SITE_MODE === 'preview' ? 'preview' : 'production'
const isPreview = MODE === 'preview'

/**
 * Check the read token here as well as in load-query.ts, because the two catch different
 * failures. A preview build renders on demand, so load-query.ts is bundled but never executed
 * during the build — its check fires on the first request, which means a preview deploy would
 * succeed and only then start returning 500s. This runs at config time, so it fails the build
 * instead. The runtime check still earns its place: it catches the token going missing from a
 * restarted process on the droplet, which is invisible at build time.
 *
 * `process.env` is checked first because CI supplies secrets that way; `loadEnv` covers a
 * local `.env` file.
 */
if (isPreview && !(process.env.SANITY_API_READ_TOKEN || fileEnv.SANITY_API_READ_TOKEN)) {
  throw new Error(
    'SANITY_API_READ_TOKEN is required when PUBLIC_SITE_MODE=preview — drafts cannot be read anonymously.',
  )
}

/**
 * Pinned, not an env var: the API version is a property of the queries we have written and
 * tested, not of the environment they run in.
 */
const SANITY_API_VERSION = '2026-08-18'

/**
 * ── THE DEV-ONLY STUB FOR /api/contact ──────────────────────────────────────
 *
 * In production and preview that path is served by `web-next/server/contact.php`, which
 * exists only on the droplet. Locally there is no PHP and no nginx, so without this the
 * contact form has nothing to talk to and none of its client behaviour can be developed.
 *
 * ── IT IS A VITE PLUGIN AND NOT AN ASTRO API ROUTE, WHICH IS NOT A STYLE CHOICE ──
 *
 * The obvious approach — `src/pages/api/contact.ts` with `export const prerender = false`
 * — WOULD BREAK THE PRODUCTION BUILD. An on-demand route needs an adapter, and this config
 * adds the Node adapter only when `isPreview` (see `output` below), because production is
 * a static tar deployed behind nginx. So the route would build under preview and fail
 * under production, which is the worst of both.
 *
 * `apply: 'serve'` confines this to the dev server. It is not present in either build
 * output, and it answers at the SAME path the real endpoint uses — so nothing about
 * ContactForm changes between local, preview and production. That is also why the form's
 * endpoint is a plain relative constant rather than an environment variable.
 *
 * ── IT MIRRORS THE CONTRACT, INCLUDING THE PARTS THAT LOOK WRONG ────────────
 *
 * Same status codes and same bodies as the PHP, uniform 500 for every non-field failure
 * included. A stub that returned friendlier errors than production would hide exactly the
 * cases the client has to handle.
 *
 * It also honours `Accept`, so the no-JS full-page POST path can be exercised locally by
 * disabling JavaScript — that path is otherwise only testable on the droplet.
 *
 * ── TWO TEST HOOKS, BECAUSE FAILURE IS OTHERWISE UNREACHABLE LOCALLY ───────
 *
 * A subject containing `!error` forces the generic 500; `!invalid` forces a 422 with
 * field errors. Without them the error and validation states could not be developed at
 * all, since a healthy stub always succeeds. Dev-only by construction.
 *
 * The `@returns` annotation is load-bearing rather than decorative: this file carries
 * `// @ts-check`, so without it every callback parameter below is an implicit `any` and
 * `astro check` fails the build.
 *
 * @returns {import('vite').Plugin}
 */
function contactEndpointStub() {
  return {
    name: 'afc:contact-endpoint-stub',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/contact', (req, res, next) => {
        if (req.method !== 'POST') return next()

        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        req.on('end', () => {
          const form = new URLSearchParams(raw)
          /** @param {string} key */
          const field = (key) => (form.get(key) ?? '').trim()
          const wantsJson = (req.headers.accept ?? '').includes('application/json')

          /**
           * @param {number} status
           * @param {Record<string, unknown>} payload
           */
          const send = (status, payload) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(payload))
          }

          /** @param {string} reason */
          const fail = (reason) => {
            console.log(`\n[contact stub] REJECTED — ${reason}\n`)
            if (wantsJson) return send(500, {ok: false})
            res.statusCode = 500
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end('<h1>Message not sent</h1><p>Stubbed failure.</p>')
          }

          const subject = field('subject')

          if (field('website') !== '') return fail('honeypot filled')
          if (subject.includes('!error')) return fail('forced by "!error" in subject')

          const errors = {}
          if (field('name') === '') errors.name = 'Enter your name.'
          if (field('email') === '') errors.email = 'Enter your email address.'
          else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field('email')))
            errors.email = 'Enter a valid email address.'
          if (subject === '') errors.subject = 'Enter a subject.'
          if (field('message') === '') errors.message = 'Enter a message.'

          if (subject.includes('!invalid')) {
            errors.subject = 'Forced by "!invalid" in the subject.'
          }

          if (Object.keys(errors).length > 0) {
            console.log('\n[contact stub] 422 —', errors, '\n')
            if (wantsJson) return send(422, {ok: false, errors})
            res.statusCode = 422
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end('<h1>Message not sent</h1><p>Stubbed validation failure.</p>')
          }

          /* NOT SENT ANYWHERE. The whole point of the stub is that developing the form
             never puts mail in Andy's inbox and never spends a real Gmail token. */
          console.log('\n[contact stub] would send:', Object.fromEntries(form), '\n')

          if (wantsJson) return send(200, {ok: true})

          const source = field('source_page')
          const safe = /^\/(?!\/)/.test(source) && !/[\\\r\n]/.test(source) ? source : '/contact/'
          res.statusCode = 303
          res.setHeader('Location', `${safe}#contact-sent`)
          res.end()
        })
      })
    },
  }
}

export default defineConfig({
  site: isPreview
    ? 'https://preview.andyfitzgeraldconsulting.com'
    : 'https://andyfitzgeraldconsulting.com',

  // Static in production so the tar → scp → symlink deploy keeps working. The preview
  // environment needs per-request rendering for visual editing, and only it pays for Node.
  output: isPreview ? 'server' : 'static',
  ...(isPreview ? {adapter: node({mode: 'standalone'})} : {}),

  /**
   * Two families, four faces, our own subset files — the `local` provider rather than
   * `google`, so nothing is fetched at build time. A provider that downloads would be
   * cold on every CI run, the same problem already recorded against Content Layer and
   * the Astro image cache.
   *
   * The files are `wdth`-instanced at 100 and Latin-subset by hand; Astro only wires
   * them up. What it adds over hand-written @font-face is `optimizedFallbacks`, which
   * reads each face's real metrics and emits a metric-matched fallback @font-face, so a
   * swap reflows far less. The last entry in `fallbacks` MUST be a generic family name
   * or that optimization is skipped.
   *
   * Extended-A is deliberately absent. Those glyphs fall through to the metric-matched
   * fallback, which is uniform across both families — the previous hand-rolled setup
   * gave Noto Serif an ext tier and Lato none, so a Czech name rendered in real Noto
   * Serif in prose and in Helvetica in a heading.
   */
  fonts: [
    {
      name: 'Noto Serif',
      cssVariable: '--font-prose',
      provider: fontProviders.local(),
      display: 'swap',
      // Just the generic. Astro builds the metric-matched face against the
      // generic's canonical font — Times New Roman for `serif` — regardless of
      // what is named ahead of it, and that face resolves via local(). So any
      // named family listed here sits AFTER a face that has already matched and
      // is never reached. Georgia and an explicit Times New Roman were both in
      // this list and both were dead weight.
      fallbacks: ['serif'],
      options: {
        variants: [
          {
            weight: '100 900',
            style: 'normal',
            src: ['./src/assets/fonts/noto-serif-latin.woff2'],
          },
          {
            weight: '100 900',
            style: 'italic',
            src: ['./src/assets/fonts/noto-serif-italic-latin.woff2'],
          },
        ],
      },
    },
    {
      name: 'Lato',
      cssVariable: '--font-heading',
      provider: fontProviders.local(),
      display: 'swap',
      // Same reasoning as above: the matched face is built against Arial, so
      // 'Helvetica Neue' and 'Helvetica' would sit behind it unreachable.
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {weight: 400, style: 'normal', src: ['./src/assets/fonts/lato-regular.woff2']},
          {weight: 700, style: 'normal', src: ['./src/assets/fonts/lato-bold.woff2']},
        ],
      },
    },
  ],

  integrations: [
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      // Never the CDN: static builds want fresh content at build time, and the preview
      // build wants drafts. Neither benefits from an edge cache.
      useCdn: false,
    }),
    react(),
  ],

  vite: {
    plugins: [contactEndpointStub()],
  },

  env: {
    schema: {
      PUBLIC_SANITY_PROJECT_ID: envField.string({context: 'client', access: 'public'}),
      PUBLIC_SANITY_DATASET: envField.string({context: 'client', access: 'public'}),
      PUBLIC_SITE_MODE: envField.enum({
        context: 'client',
        access: 'public',
        values: ['production', 'preview'],
        default: 'production',
      }),
      // Where the Studio lives, for stega's click-to-edit links. Optional because only
      // the preview build encodes them, and it is not set until studio-next exists.
      PUBLIC_SANITY_STUDIO_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      // Only the preview build reads drafts, so this is optional by design — a missing
      // token must not fail a production build.
      SANITY_API_READ_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },
})
