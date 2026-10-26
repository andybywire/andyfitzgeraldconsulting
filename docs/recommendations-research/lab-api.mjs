// The authenticated half of the research scripts: reads that can see drafts, and writes.
// Shared by tags-backup.mjs and tags-restore.mjs, and meant for the tagger next.
//
// ── THE TOKEN COMES FROM `sanity exec --with-user-token`, NEVER FROM A FILE ──────────────────
//
// Run these scripts from studio/, under the CLI:
//
//   pnpm --dir studio exec sanity exec ../docs/recommendations-research/<script>.mjs \
//     --with-user-token -- <flags>
//
// The CLI resolves Andy's login token in its own process and hands it to the script as
// SANITY_AUTH_TOKEN (read out of @sanity/cli 8.14.0's execScript.js, 2026-10-26). Nothing here
// stores, prints or asks for it. The CLI's own comment explains why it moved to an env var: the
// older mechanism patched `getCliClient` in place, which failed when the script imported a
// different copy of the module. That is exactly the case here, because these scripts live outside
// studio/ and cannot resolve `sanity` at all. So they use the HTTP API with fetch, like
// fetch-corpus.mjs, and need no package.
//
// ── PRODUCTION-26 IS REFUSED FOR WRITES UNLESS NAMED TWICE ───────────────────────────────────
//
// The experiments write only to the lab (plan.md). `assertWritable` throws for production-26
// unless the command line also carries --allow-production. That is meant to be typed only at
// promotion, at the end. A wrong default should fail loudly, not quietly retag the live site.

export const PROJECT = '7v0qvet6'
export const API_VERSION = '2026-08-18'
export const LAB = 'recommendations-lab'
export const LIVE = 'production-26'

/** The document types that carry Topic tags and render a Related band. */
export const TAGGED_TYPES = ['article', 'caseStudy', 'note', 'presentation']

/** `--name value` from anywhere in argv; `--flag` alone reads as true. */
export function arg(name) {
  const argv = process.argv
  const i = argv.indexOf(`--${name}`)
  if (i === -1) return undefined
  const next = argv[i + 1]
  return next === undefined || next.startsWith('--') ? true : next
}

function token() {
  const t = process.env.SANITY_AUTH_TOKEN
  if (!t) {
    throw new Error(
      'No SANITY_AUTH_TOKEN. Run this under `sanity exec --with-user-token` (see lab-api.mjs).',
    )
  }
  return t
}

async function call(path, body) {
  const res = await fetch(`https://${PROJECT}.api.sanity.io/v${API_VERSION}/${path}`, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${token()}`},
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

/**
 * A GROQ query with the user's token. `raw` sees published documents AND drafts side by side,
 * which is how the scripts notice a draft they would otherwise write past.
 */
export async function query(dataset, groq, params = {}, perspective = 'published') {
  const {result} = await call(`data/query/${dataset}?perspective=${perspective}`, {
    query: groq,
    params,
  })
  return result
}

/** Throws unless writing to `dataset` is allowed — see the box above. */
export function assertWritable(dataset) {
  if (dataset === LIVE && arg('allow-production') !== true) {
    throw new Error(
      `Refusing to write to ${LIVE}. The experiments write to ${LAB}; pass --allow-production ` +
        'only for the promotion step.',
    )
  }
}

/** One transaction. Sanity applies all of it or none of it. */
export async function mutate(dataset, mutations) {
  assertWritable(dataset)
  return call(`data/mutate/${dataset}?returnIds=true&visibility=sync`, {mutations})
}
