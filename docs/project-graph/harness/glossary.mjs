/**
 * Arm B's glossary, generated from arm C's vocabulary and claims.
 *
 *   node docs/project-graph/harness/glossary.mjs [out-file]     stdout when no file is named
 *
 * protocol.md → "The three arms": B carries C's tags, and a plain-text glossary "generated from the
 * same `claims.ttl`, recording the same fields as plain text" (id-design.md). This reads
 * `concepts.ttl` and `claims.ttl` as committed on pg-arm-c, so the glossary describes exactly the
 * claims B's tags name, and never a working copy.
 *
 * ── THE SHAPE: A DICTIONARY (Andy, 2026-10-19) ───────────────────────────────
 *
 * Every id in alphabetical order, concepts then claims, and every recorded field once, where the
 * Turtle records it. A concept gives its labels, its broader concept and its scope note. A claim
 * gives its kind, the concepts it is about, its sentence and its backing: measured (how, when,
 * with what), assumed, unattributed, or decided by whom and when. What the shape leaves out is the
 * point of it, because each omission is something arm C computes and B is measured without:
 *
 *   - NO GROUPING BY CONCEPT. Claims listed under their concepts would be the answer to C's `about`
 *     query, handed to B as static text.
 *   - AN OVERTURNING IS STATED ONCE, on the claim that overturns ("Overturns `x`"). The overturned
 *     claim's own entry doesn't say so. A search for its id still finds the "Overturns" line, and
 *     marking both ends would be the status C's queries and check compute.
 *
 * ── HOW IT READS THE TURTLE ──────────────────────────────────────────────────
 *
 * Jena's riot turns both files into N-Triples, one statement a line, so nothing here parses
 * Turtle. A line the pattern can't read stops the build (exit 2) rather than dropping a field.
 *
 * ── THE COVERAGE CHECK ───────────────────────────────────────────────────────
 *
 * Every id that pg-arm-b's tags use must have an entry, or the glossary is written but the run
 * exits 1. It is the one job of the deferred lint that B needs before any run. Entries no tag uses
 * are expected: a broader concept nothing is tagged with directly, and a disproved belief, which
 * the guide records in claims.ttl but never tags. Proven 2026-10-19 by removing `landing-point`
 * from the entries compared, which the check then reported missing.
 *
 * Exit 0 when the glossary is complete, 1 when a tag names an id it lacks, 2 when it can't run.
 */
import {spawnSync} from 'node:child_process'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {ensureJena, runJena} from '../../../project-graph/jena.mjs'
import {REPO} from './harness.mjs'

const SOURCE = 'pg-arm-c'
const ARM = 'pg-arm-b'
const BASE = '086dd0f'

const NS = {
  concept: 'https://andyfitzgeraldconsulting.com/ns/project-graph/concepts#',
  claim: 'https://andyfitzgeraldconsulting.com/ns/project-graph/claims#',
  model: 'https://andyfitzgeraldconsulting.com/ns/project-graph/model#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  prov: 'http://www.w3.org/ns/prov#',
  dct: 'http://purl.org/dc/terms/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
}

/** One N-Triples statement: subject, predicate, and an IRI, blank node or literal object. */
const LINE =
  /^(<[^>]*>|_:\S+) <([^>]*)> (<[^>]*>|_:\S+|"(?:[^"\\]|\\.)*"(?:@[a-z-]+|\^\^<[^>]*>)?) \.$/
const term = (t) =>
  t.startsWith('<')
    ? t.slice(1, -1)
    : t.startsWith('"')
      ? JSON.parse(t.match(/^"(?:[^"\\]|\\.)*"/)[0])
      : t

/** Statements from N-Triples text, or the first line that couldn't be read. */
export function parseNTriples(text) {
  const triples = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const m = line.match(LINE)
    if (!m) return {unread: line}
    triples.push([term(m[1]), m[2], term(m[3])])
  }
  return {triples}
}

/** The glossary, as Markdown, from the vocabulary's and the claims' statements together. */
export function glossaryFrom(triples) {
  const objects = (s, p) => triples.filter((t) => t[0] === s && t[1] === p).map((t) => t[2])
  const one = (s, p) => objects(s, p)[0]
  const local = (iri, ns) => (iri.startsWith(ns) ? iri.slice(ns.length) : iri)
  const code = (s) => `\`${s}\``
  const ofType = (type) => [
    ...new Set(triples.filter((t) => t[1] === NS.rdf + 'type' && t[2] === type).map((t) => t[0])),
  ]

  const out = [
    `# Glossary

Every id a \`@concept\` or \`@claim\` tag can name, in alphabetical order. A concept is a term the
comments use; a claim is one statement the comments make, recorded once however many comments
make it. Search the repository for an id to find the comments tagged with it.
`,
    '## Concepts\n',
  ]

  for (const c of ofType(NS.skos + 'Concept').sort()) {
    out.push(`### ${code(local(c, NS.concept))}: ${one(c, NS.skos + 'prefLabel')}\n`)
    const alt = objects(c, NS.skos + 'altLabel')
    if (alt.length) out.push(`Also: ${alt.join(', ')}.`)
    const broader = objects(c, NS.skos + 'broader').map((b) => code(local(b, NS.concept)))
    out.push(`Broader: ${broader.length ? broader.join(', ') : 'none'}.`)
    const note = one(c, NS.skos + 'scopeNote')
    if (note) out.push(`\n${note}`)
    out.push('')
  }

  out.push('## Claims\n')
  const KINDS = {Observation: 'Observation', Decision: 'Decision', RepoFact: 'Repo fact'}
  const claims = Object.keys(KINDS)
    .flatMap((k) => ofType(NS.model + k).map((c) => [c, KINDS[k]]))
    .sort((a, b) => a[0].localeCompare(b[0]))

  for (const [c, kind] of claims) {
    const about = objects(c, NS.dct + 'subject').map((s) => code(local(s, NS.concept)))
    out.push(`### ${code(local(c, NS.claim))}\n`)
    out.push(`${kind}, about ${about.join(', ')}.\n`)
    out.push(`${one(c, NS.dct + 'description')}\n`)
    const how = []
    for (const a of objects(c, NS.prov + 'wasGeneratedBy')) {
      const method = one(a, NS.model + 'method')
      const date = one(a, NS.dct + 'date')
      const used = objects(a, NS.prov + 'used').map((u) => code(local(u, NS.concept)))
      const overturns = objects(a, NS.prov + 'invalidated').map((o) => code(local(o, NS.claim)))
      if (method) {
        how.push(
          `Measured: ${method.replace(/[.\s]+$/, '')}${date ? ` (${date})` : ''}` +
            `${used.length ? `, using ${used.join(', ')}` : ''}.`,
        )
      }
      if (overturns.length) how.push(`Overturns ${overturns.join(', ')}.`)
    }
    const basis = one(c, NS.model + 'basis')
    if (basis) {
      how.push(
        basis.endsWith('#assumed')
          ? 'Assumed: no basis is stated.'
          : 'Unattributed: nobody is named.',
      )
    }
    const who = one(c, NS.prov + 'wasAttributedTo')
    const decided = one(c, NS.dct + 'date')
    if (who) how.push(`Decided by <${who}>${decided ? ` on ${decided}` : ''}.`)
    else if (decided) how.push(`Dated ${decided}.`)
    if (how.length) out.push(`${how.join(' ')}\n`)
  }
  return out.join('\n')
}

/** Every id the tag lines added in a diff name. */
export function tagIds(diff) {
  const ids = new Set()
  for (const line of diff.split('\n')) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue
    const m = line.match(/@(?:concepts?|claims?)\s+(.*)$/)
    if (!m) continue
    for (const id of m[1].replace(/\s*(\*\/\}?|-->)\s*$/, '').split(/\s+/)) if (id) ids.add(id)
  }
  return ids
}

/** Ids among `ids` that have no `### \`id\`` entry in the glossary. */
export function missingFrom(glossary, ids) {
  const entries = new Set([...glossary.matchAll(/^### `([^`]+)`/gm)].map((m) => m[1]))
  return [...ids].filter((id) => !entries.has(id)).sort()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const git = (...args) => spawnSync('git', ['-C', REPO, ...args], {encoding: 'utf8'})
  const dir = mkdtempSync(join(tmpdir(), 'glossary-'))
  let glossary
  try {
    const files = ['concepts.ttl', 'claims.ttl'].map((name) => {
      const shown = git('show', `${SOURCE}:project-graph/${name}`)
      if (shown.status !== 0) {
        console.error(`Can't read ${name} from ${SOURCE}: ${shown.stderr.trim()}`)
        process.exit(2)
      }
      const path = join(dir, name)
      writeFileSync(path, shown.stdout)
      return path
    })
    await ensureJena()
    const riot = runJena('riotcmd.riot', ['--output=nt', ...files])
    if (riot.status !== 0) {
      console.error(riot.stderr)
      process.exit(2)
    }
    const {triples, unread} = parseNTriples(riot.stdout)
    if (unread) {
      console.error(`Unread N-Triples line, so nothing was written: ${unread}`)
      process.exit(2)
    }
    glossary = glossaryFrom(triples)
  } finally {
    rmSync(dir, {recursive: true, force: true})
  }

  const outFile = process.argv[2]
  if (outFile) writeFileSync(outFile, glossary)
  else process.stdout.write(glossary)

  const missing = missingFrom(glossary, tagIds(git('diff', BASE, ARM).stdout))
  if (missing.length) {
    console.error(`${ARM}'s tags name ${missing.length} id(s) with no entry: ${missing.join(' ')}`)
    process.exit(1)
  }
}
