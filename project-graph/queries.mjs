/**
 * The saved queries: how a question about the codebase becomes a tool call rather than a search.
 *
 *   node project-graph/graph.mjs query                list the queries
 *   node project-graph/graph.mjs query <name> [slug]  run one, over the graph and every tagged
 *                                                     comment
 *
 * Each query is a SPARQL file in queries/, and its opening comment is its description. graph.mjs
 * runs them for the `query` command and for the planted cases in tests/queries/; this file holds
 * what both need.
 *
 * ── WHY THESE QUERIES, AND NOT OTHERS ───────────────────────────────────────
 *
 * docs/project-graph/claim-model.md admits a term to the model only when a shape or a saved query
 * reads it, and its table names the questions. Five queries answer those: `about`, `claim`,
 * `settled`, `weak` and `automation-only`. `where` is the sixth. It reads `dcterms:subject` on
 * code locations, and it answers the question a change starts from: every place a change to a
 * concept has to visit.
 *
 * ── A SLUG IS CHECKED BEFORE THE QUERY RUNS ─────────────────────────────────
 *
 * A query about a concept that doesn't exist returns nothing, and "nothing is claimed about
 * landing-pont" reads exactly like a true answer. So an ASK runs first, and a slug that names
 * nothing is an error. That costs one more Java start, about 0.4s, which an interactive question
 * can afford.
 *
 * A slug reaches the query by text substitution, `{{concept}}` or `{{claim}}`, and only after it
 * has matched the slug pattern, so nothing but lowercase words and hyphens can be substituted. A
 * placeholder left unfilled is not valid SPARQL, so a query can never run with one by mistake:
 * Jena exits 2.
 *
 * ── OUTPUT ──────────────────────────────────────────────────────────────────
 *
 * One block per result, its first column as the heading. IRIs in this project's namespaces are
 * shortened to `concept:`, `claim:`, `model:` and `site:`, including inside text a query has
 * built, and empty fields are left out.
 */
import {readdirSync, readFileSync} from 'node:fs'
import {basename, join} from 'node:path'
import {runJena} from './jena.mjs'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PLACEHOLDER = /\{\{(concept|claim)\}\}/

const NAMESPACES = [
  ['concept:', 'https://andyfitzgeraldconsulting.com/ns/project-graph/concepts#'],
  ['claim:', 'https://andyfitzgeraldconsulting.com/ns/project-graph/claims#'],
  ['model:', 'https://andyfitzgeraldconsulting.com/ns/project-graph/model#'],
  ['site:', 'https://andyfitzgeraldconsulting.com/#'],
]

const PREFIXES = `
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX concept: <${NAMESPACES[0][1]}>
PREFIX claim: <${NAMESPACES[1][1]}>
PREFIX model: <${NAMESPACES[2][1]}>
`

/** A user's mistake, such as an unknown query or a slug that names nothing: exit 1, not 2. */
export class QueryError extends Error {}

/** Every IRI in this project's namespaces, written short, wherever it appears in `text`. */
export function shorten(text) {
  return NAMESPACES.reduce(
    (out, [prefix, iri]) =>
      out.replace(new RegExp(`<?${iri.replace(/[.#/]/g, '\\$&')}([\\w-]+)>?`, 'g'), `${prefix}$1`),
    text,
  )
}

/** The queries in `dir`/queries: name, description, and the kind of slug it takes, if any. */
export function listQueries(dir) {
  const folder = join(dir, 'queries')
  return readdirSync(folder)
    .filter((name) => name.endsWith('.rq'))
    .sort()
    .map((file) => {
      const text = readFileSync(join(folder, file), 'utf8')
      const lead = []
      for (const line of text.split('\n')) {
        if (!line.startsWith('# ')) break
        lead.push(line.slice(2))
      }
      return {
        name: basename(file, '.rq'),
        description: lead.join(' '),
        param: text.match(PLACEHOLDER)?.[1] ?? null,
        text,
      }
    })
}

function sparql(query, data) {
  const run = runJena('arq.sparql', [
    ...data.flatMap((file) => ['--data', file]),
    '--results=json',
    query,
  ])
  if (run.error) throw new Error(`Jena did not start: ${run.error.message}`)
  if (run.status !== 0)
    throw new Error(`The query did not run (exit ${run.status}):\n${run.stderr}`)
  return JSON.parse(run.stdout)
}

/** Runs query `name` with `slug` over `data`: `{vars, rows}`, every value a shortened string. */
export function runQuery(dir, name, slug, data) {
  const query = listQueries(dir).find((q) => q.name === name)
  if (!query)
    throw new QueryError(
      `No query named "${name}". Run \`node project-graph/graph.mjs query\` to list them.`,
    )
  if (query.param && !slug) {
    throw new QueryError(
      `"${name}" needs a ${query.param}: node project-graph/graph.mjs query ${name} <${query.param}>`,
    )
  }
  if (!query.param && slug) throw new QueryError(`"${name}" takes no slug.`)

  let text = query.text
  if (query.param) {
    if (!SLUG.test(slug))
      throw new QueryError(`"${slug}" is not a slug: lowercase words joined by hyphens.`)
    const exists =
      query.param === 'concept'
        ? `ASK { concept:${slug} a skos:Concept }`
        : `ASK { claim:${slug} a/rdfs:subClassOf* model:Claim }`
    if (!sparql(`${PREFIXES}${exists}`, data).boolean) {
      throw new QueryError(`No ${query.param} named "${slug}". Is the slug mistyped?`)
    }
    text = text.replaceAll(`{{${query.param}}}`, `${query.param}:${slug}`)
  }

  const result = sparql(text, data)
  const vars = result.head.vars
  const rows = result.results.bindings.map((binding) =>
    Object.fromEntries(vars.map((v) => [v, shorten(binding[v]?.value ?? '')])),
  )
  return {vars, rows}
}

/** One block per row, headed by the first column; empty fields left out. */
export function format({vars, rows}) {
  if (rows.length === 0) return 'No results.'
  const [head, ...rest] = vars
  const width = Math.max(...rest.map((v) => v.length))
  return rows
    .map((row) =>
      [
        row[head],
        ...rest.filter((v) => row[v] !== '').map((v) => `  ${v.padEnd(width)}  ${row[v]}`),
      ].join('\n'),
    )
    .join('\n\n')
}
