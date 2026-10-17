/**
 * The Project Graph's checks: is every Turtle file well formed, and does the graph satisfy its
 * shapes?
 *
 *   pnpm graph check          check project-graph/
 *   pnpm graph check <dir>    check another directory, as when proving a planted violation fails
 *
 * Part of the Project Graph experiment. docs/project-graph/ is its record: the protocol, and
 * id-design.md for the namespaces these files use. Saved queries (`pnpm graph query <name>`) join
 * this file in stage 4.
 *
 * ── WHAT A CHECK IS ─────────────────────────────────────────────────────────
 *
 * Every `*.ttl` file directly in the directory takes part. `shapes.ttl` holds the SHACL shapes,
 * and every other file is data. Two steps, each one Java start (about 0.4s apiece):
 *
 *   1. SYNTAX    `riot --validate` over every file, shapes included. Strict parsing, with IRIs
 *                and literals checked as well.
 *   2. SHAPES    `shacl validate`, with every data file passed as its own `--data`. Jena merges
 *                them into one graph, so a shape sees every file at once. (Checked on
 *                2026-10-17 with two files holding different concepts. An earlier probe seemed
 *                to show the second file ignored, but both files used the same IRI, so the merged
 *                concept genuinely had its label.)
 *
 * ── NEITHER TOOL'S EXIT STATUS CAN BE TRUSTED ON ITS OWN ────────────────────
 *
 * Both were probed by hand before this was written; jena.mjs lists what that found.
 *
 *   riot     exits 1 on an error but 0 on a WARNING, and a malformed IRI is only a warning. So
 *            this reads stderr too, and any WARN or ERROR line fails the check. A graph is
 *            either clean or it is not, and a warning nobody reads is how bad IRIs accumulate.
 *   shacl    exits 0 whether or not the data conforms. With `--text` it prints exactly
 *            "Conforms", or one block per result starting `Node=`. So this reads the report,
 *            and treats anything that is neither as Jena failing to run, not as a verdict.
 *
 * A CHECK THAT CHECKED NOTHING IS NOT A PASS. A directory with no shapes or no data files exits
 * 2. lychee taught the same lesson in the external link check (web/scripts/
 * check-external-links.mjs): a run with nothing to look at must not look green.
 *
 * ── EXIT CODES ──────────────────────────────────────────────────────────────
 *
 *   0  every file is well formed, and the graph conforms to its shapes
 *   1  a syntax error, a warning, or a shape violation
 *   2  it could not run: no Java 21, Jena could not be fetched, nothing to check, or a report it
 *      could not read. Kept apart from 1 so a broken tool is never read as a verdict.
 */
import {existsSync, readdirSync} from 'node:fs'
import {basename, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {ensureJena, runJena, VERSION} from './jena.mjs'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const SHAPES = 'shapes.ttl'

const fail = (message) => {
  console.error(message)
  process.exit(2)
}

async function check(dir) {
  if (!existsSync(dir)) fail(`No directory at ${dir}.`)
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.ttl'))
    .sort()
    .map((name) => join(dir, name))
  const shapes = files.find((file) => basename(file) === SHAPES)
  const data = files.filter((file) => file !== shapes)
  // Relative to where the command ran when that is shorter; absolute for a directory elsewhere.
  const shown = (file) => {
    const path = relative(process.cwd(), file)
    return path.startsWith('..') ? file : path
  }

  if (!shapes) fail(`No ${SHAPES} in ${shown(dir)}, so there is nothing to check against.`)
  if (data.length === 0) fail(`No data files in ${shown(dir)}, only ${SHAPES}.`)

  try {
    await ensureJena()
  } catch (error) {
    fail(error.message)
  }

  /* ── 1. Syntax ──────────────────────────────────────────────────────────── */

  const syntax = runJena('riotcmd.riot', ['--validate', ...files])
  if (syntax.error) fail(`Jena did not start: ${syntax.error.message}`)
  const problems = (syntax.stderr ?? '').split('\n').filter((line) => /\b(WARN|ERROR)\b/.test(line))
  if (syntax.status !== 0 || problems.length > 0) {
    console.error(`Not well formed (riot, exit ${syntax.status}):`)
    console.error((problems.length > 0 ? problems.join('\n') : syntax.stderr).trim())
    process.exit(1)
  }

  /* ── 2. Shapes ──────────────────────────────────────────────────────────── */

  const validation = runJena('shacl.shacl', [
    'validate',
    '--text',
    '--shapes',
    shapes,
    ...data.flatMap((file) => ['--data', file]),
  ])
  if (validation.error) fail(`Jena did not start: ${validation.error.message}`)
  const report = (validation.stdout ?? '').trim()

  if (validation.status === 0 && report === 'Conforms') {
    console.log(
      `Conforms: ${data.map(shown).join(', ')} against ${shown(shapes)} (Jena ${VERSION}).`,
    )
    return
  }
  if (validation.status === 0 && report.startsWith('Node=')) {
    const count = report.split('\n').filter((line) => line.startsWith('Node=')).length
    console.error(`${count} shape violation${count === 1 ? '' : 's'}:\n\n${report}`)
    process.exit(1)
  }
  fail(
    `shacl did not produce a report it could read (exit ${validation.status}):\n` +
      `${validation.stderr || report}`.trim(),
  )
}

/* ── Commands ─────────────────────────────────────────────────────────────── */

const [command, target] = process.argv.slice(2)

if (command === 'check') {
  await check(target ? resolve(target) : HERE)
} else {
  fail('Usage: pnpm graph check [dir]')
}
