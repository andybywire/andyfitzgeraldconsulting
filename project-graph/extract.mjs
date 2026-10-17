/**
 * The extractor: reads the `@concept` and `@claim` tags at the end of comments and writes them as
 * code locations, in Turtle, for `pnpm graph check` to validate with everything else.
 *
 *   node project-graph/extract.mjs [root]    print what it finds, as Turtle, for a look by hand
 *
 * graph.mjs calls `extractTags()` and `toTurtle()`; nothing else needs to. The rules it implements
 * are docs/project-graph/id-design.md's, and the model it writes is model.ttl's `model:CodeLocation`.
 *
 * ── WHAT IS SCANNED ─────────────────────────────────────────────────────────
 *
 * A fixed list, not every file in the repository, because a tag only means something where code or
 * a record about code lives: `web/src`, `web/server` (the contact form's PHP carries claims too),
 * `docs`, `CLAUDE.md` and `DESIGN.md`. Within them, only the file types comments are written in.
 *
 * `docs/project-graph/` IS SKIPPED, and it has to be. It is the experiment's record, and id-design.md
 * shows tags as examples on lines of their own, which this would otherwise read as real tags citing
 * claims that don't exist. Nothing in that folder is code anyone relies on.
 *
 * ── WHAT A TAG IS ───────────────────────────────────────────────────────────
 *
 * id-design.md's rule: a line that, once any comment marker is removed, starts with `@concept` or
 * `@claim`, followed by slugs separated by spaces. The markers are `/*`, `/**`, `{/*`, `*`, `//`,
 * `<!--` and `#` (PHP), and a line inside a block comment may have none at all, as the template
 * comments in .astro files usually don't. A closing `*\/`, `*\/}` or `-->` on the same line is
 * removed too. A mention in the middle of a sentence ("the @concept and @claim tags") is not a tag:
 * only a line that STARTS with one is.
 *
 * CONSECUTIVE TAG LINES ARE ONE CODE LOCATION, at the first one's line. id-design.md says a tag
 * covers the comment it ends, and a comment's tags sit together at its end. Finding real comment
 * boundaries would mean parsing five languages; adjacent lines are the same unit in practice, and
 * a tag block split by a blank line becomes two locations, which is visible rather than wrong.
 *
 * ── A MALFORMED TAG IS AN ERROR, NEVER A SKIP ───────────────────────────────
 *
 * A tag that can't be read would otherwise disappear, and a comment nobody can find is the failure
 * the whole Project Graph exists to prevent. So each of these is reported with its file and line,
 * and `pnpm graph check` exits 1:
 *
 *   @concept                     no slugs
 *   @concept Landing-Point       not a slug: capitals
 *   @concept landing-point,      not a slug: the comma (slugs are separated by spaces)
 *   @concepts landing-point      the plural, the likeliest typo. `\b` alone would not catch it,
 *                                since "concepts" never matches "concept" followed by a boundary.
 *
 * A slug that is well formed but names nothing (`landing-pont`) is NOT this file's business. It
 * becomes an IRI, and the shapes catch it: a code location's `dcterms:subject` and `model:cites`
 * must name things that exist.
 */
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs'
import {extname, join, relative, resolve, sep} from 'node:path'
import {fileURLToPath} from 'node:url'

export const SCAN = ['web/src', 'web/server', 'docs', 'CLAUDE.md', 'DESIGN.md']
export const SKIP = ['docs/project-graph']
const EXTENSIONS = new Set(['.astro', '.ts', '.mjs', '.js', '.css', '.md', '.php'])

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// Optional leading marker, then the keyword. The plural is matched so that it can be reported.
const TAG = /^\s*(?:\{\/\*\*?|\/\*\*?|\*|\/\/|<!--|#)?\s*@(concepts?|claims?)(?=\s|$)(.*)$/
const CLOSER = /\s*(?:\*\/\}?|-->)\s*$/

/**
 * The tags in one file's text: `locations` ({line, concepts, claims}, one per run of consecutive tag
 * lines) and `errors` ({line, message}). Lines are numbered from 1.
 */
export function parseTags(text) {
  const locations = []
  const errors = []
  let current = null
  let previous = -1

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1
    const match = raw.match(TAG)
    if (!match) return

    const [, keyword, rest] = match
    if (keyword.endsWith('s')) {
      errors.push({line, message: `"@${keyword}" should be "@${keyword.slice(0, -1)}"`})
      return
    }
    const words = rest.replace(CLOSER, '').trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      errors.push({line, message: `"@${keyword}" with no slugs after it`})
      return
    }
    const bad = words.filter((word) => !SLUG.test(word))
    if (bad.length > 0) {
      errors.push({
        line,
        message: `${bad.map((word) => `"${word}"`).join(', ')} ${bad.length === 1 ? 'is' : 'are'} not a slug: lowercase words joined by hyphens, separated by spaces`,
      })
      return
    }

    if (!current || line !== previous + 1) {
      current = {line, concepts: [], claims: []}
      locations.push(current)
    }
    current[keyword === 'concept' ? 'concepts' : 'claims'].push(...words)
    previous = line
  })

  return {locations, errors}
}

/** Every file under `root` that the scan list covers, as paths relative to `root`, with `/`. */
function scannedFiles(root) {
  const files = []
  const visit = (rel) => {
    if (SKIP.some((skip) => rel === skip || rel.startsWith(`${skip}/`))) return
    const full = join(root, rel)
    if (!existsSync(full)) return
    if (statSync(full).isDirectory()) {
      for (const name of readdirSync(full).sort()) visit(`${rel}/${name}`)
    } else if (EXTENSIONS.has(extname(rel))) {
      files.push(rel)
    }
  }
  for (const entry of SCAN) visit(entry)
  return files
}

/** Every tag under `root`: locations and errors, each with its file's repository-relative path. */
export function extractTags(root) {
  const locations = []
  const errors = []
  const files = scannedFiles(root)
  for (const path of files) {
    const found = parseTags(readFileSync(join(root, path), 'utf8'))
    locations.push(...found.locations.map((location) => ({path, ...location})))
    errors.push(...found.errors.map((error) => ({path, ...error})))
  }
  return {locations, errors, files: files.length}
}

const literal = (text) => `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

/** The locations as Turtle: one blank node per location, as model.ttl's `model:CodeLocation`. */
export function toTurtle(locations) {
  const prefixes = [
    '@prefix model: <https://andyfitzgeraldconsulting.com/ns/project-graph/model#> .',
    '@prefix dcterms: <http://purl.org/dc/terms/> .',
    '@prefix concept: <https://andyfitzgeraldconsulting.com/ns/project-graph/concepts#> .',
    '@prefix claim: <https://andyfitzgeraldconsulting.com/ns/project-graph/claims#> .',
  ]
  const nodes = locations.map(({path, line, concepts, claims}) => {
    const properties = [
      `model:path ${literal(path)}`,
      `model:line ${line}`,
      ...(concepts.length
        ? [`dcterms:subject ${concepts.map((s) => `concept:${s}`).join(', ')}`]
        : []),
      ...(claims.length ? [`model:cites ${claims.map((s) => `claim:${s}`).join(', ')}`] : []),
    ]
    return `[] a model:CodeLocation ;\n  ${properties.join(' ;\n  ')} .`
  })
  return `${prefixes.join('\n')}\n\n${nodes.join('\n\n')}\n`
}

/* ── Run on its own: print what it finds ──────────────────────────────────── */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url)))
  const {locations, errors, files} = extractTags(root)
  process.stdout.write(toTurtle(locations))
  for (const {path, line, message} of errors)
    console.error(`${path.split('/').join(sep)}:${line}  ${message}`)
  const where = relative(process.cwd(), root)
  console.error(
    `${locations.length} tagged comments in ${files} files scanned${where ? ` under ${where}` : ''}.`,
  )
  if (errors.length > 0) process.exit(1)
}
