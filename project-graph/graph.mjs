/**
 * The Project Graph's commands: is every Turtle file well formed, does the graph satisfy its
 * shapes, do the shapes and queries still do what they are meant to, and what does the graph say?
 *
 *   pnpm graph check                check project-graph/, and every tagged comment in the repository
 *   pnpm graph test                 run the planted cases: shapes, then queries, then the extractor
 *   pnpm graph query [name] [slug]  run a saved query; with no name, list them (see queries.mjs)
 *
 * `check` and `test` take a directory as well, which is how a planted violation or a weakened shape
 * is proven against a copy rather than the real files. `check` reads tags from the folder that
 * directory sits in, so a copy needs a source tree beside it to have tags at all.
 *
 * A WEAKENED COPY MUST RUN ITS OWN graph.mjs. Running this file against a copy reads the copy's
 * Turtle and queries but imports THIS folder's modules, so a weakened queries.mjs is never executed
 * and its test passes for the wrong reason. That happened on 2026-10-17: disabling the slug check
 * in a copy's queries.mjs left every case green until the copy was run as `node <copy>/graph.mjs`.
 *
 * Part of the Project Graph experiment. docs/project-graph/ is its record: the protocol, and
 * id-design.md for the namespaces these files use.
 *
 * ── WHAT A CHECK IS ─────────────────────────────────────────────────────────
 *
 * Every `*.ttl` file directly in the directory takes part, and nothing in its subfolders, so the
 * planted cases in tests/ can never reach a real check. `shapes.ttl` holds the SHACL shapes, and
 * every other file is data. Three steps, the last two each one Java start (about 0.4s apiece):
 *
 *   0. TAGS      extract.mjs reads the `@concept` and `@claim` tags in the repository's comments.
 *                A malformed one fails here, with its file and line. The rest become code
 *                locations, written to a temporary file outside the repository and passed to
 *                both later steps, so the shapes judge real comments: a tag citing an overturned
 *                claim, or naming a slug that doesn't exist, fails at step 2.
 *   1. SYNTAX    `riot --validate` over every file, shapes and the generated locations included.
 *                Strict parsing, with IRIs and literals checked as well.
 *   2. SHAPES    `shacl validate`, with every data file passed as its own `--data`. Jena merges
 *                them into one graph, so a shape sees every file at once. (Checked on
 *                2026-10-17 with two files holding different concepts. An earlier probe seemed
 *                to show the second file ignored, but both files used the same IRI, so the merged
 *                concept genuinely had its label.)
 *
 * ── WHAT A TEST IS: THE SHAPES' OWN TESTS ───────────────────────────────────
 *
 * A check asks whether the data is right. A test asks whether the SHAPES are: whether each
 * constraint still fails what it should fail and passes what it should pass. Without it, the only
 * way to know a shape works is to break something by hand. That is how every gate in this repo
 * was first proven, and it proves a shape only on the day it was written.
 *
 * Each file in tests/ is one planted case: standalone Turtle with its own prefixes, and a comment
 * line saying what must happen:
 *
 *   # expect: conforms
 *   # expect: violation "<text that must appear in the report>"
 *
 * A case is validated MERGED WITH THE REAL DATA, one case at a time. That way a case tests the
 * shapes against the real vocabulary, which matters for the rules that compare concepts with each
 * other, like no shared label. Cases plant their own concepts, with slugs starting `planted-`,
 * rather than editing real ones. A real concept's labels can change, and a case that depended on
 * them would quietly start testing something else.
 *
 * "Violation" matches on the message, not just the outcome. A case planted to break the cycle rule
 * must fail BECAUSE of the cycle rule, or a different constraint failing would hide the one under
 * test. It is a substring match, not "only this message": typing the scheme as a concept also pulls
 * it into the concept shapes, which is correct, so other results may appear beside the expected one.
 *
 * Two cases expect `conforms`, and they matter as much as the violations. One is the template the
 * other cases break in one place, so a broken template can't make every case "pass". The other is
 * the qualified pair "mercury (car)" and "mercury (element)", which proves the qualifier rule allows
 * what Andy said it may.
 *
 * HOW THE TEST WAS PROVEN, 2026-10-17: five realistic weakenings of shapes.ttl, each made in a
 * copy, and each caught by exactly the cases it should break and no others. Shortening the cycle
 * path from `broader+` to `broader` broke `broader-cycle`. Comparing labels with case broke
 * `label-shared-ignoring-case`. Forbidding qualifiers broke `qualifier-keeps-labels-apart`. Dropping
 * a preferred label's `maxCount` broke `two-preferred-labels`. Un-targeting the placement shape
 * broke `orphan-concept` and `top-concept-with-broader`. No cases, a case with no `# expect:` line,
 * and a malformed case each exited 2.
 *
 * The claim shapes, the same day, seven more. Misbinding the overturned-claim query's variable
 * broke `claim-location-cites-overturned`. Turning each of the three "exactly one" rules (an
 * observation's basis, a decision's basis, a claim's kind) into "at least one" broke the case for
 * that rule's "both". Dropping the "does this claim exist?" filter from the tag rule broke the
 * mistyped-tag case, and dropping a claim's subject `minCount` broke `claim-without-subject`. Making a measurement's date
 * required broke the two cases that conform without one. All five earlier weakenings still broke
 * exactly their own cases with the 28 claim cases added.
 *
 * The extractor, the same day. Six breakages of extract.mjs, each caught by exactly the unit tests
 * it should break, with every shape case still passing: the Markdown marker dropped, the plural
 * check dropped, the docs/project-graph skip dropped, the slug pattern loosened to any non-space,
 * consecutive tags no longer merged, and closers left on. Then end to end, in a scratch repository
 * with real source files: clean tags conform; a tag citing an overturned claim, a mistyped claim
 * slug and a mistyped concept slug each fail with the file and line in the message; and a
 * malformed tag fails before Jena starts.
 *
 * The saved queries, the same day. Seven breakages, each run with the copy's own graph.mjs and
 * each caught by exactly the query cases it should break, with every shape case and extractor test
 * still passing: `about` without `skos:broader*`, `about` blind to overturned claims, `where`
 * without its citation branch, `settled` accepting any kind of claim, `weak` not requiring a gap,
 * `automation-only` not excluding real-browser evidence, and queries.mjs skipping the slug check.
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
 * A CHECK THAT CHECKED NOTHING IS NOT A PASS, and neither is a test run with no cases. Either
 * exits 2. lychee taught the same lesson in the external link check (web/scripts/
 * check-external-links.mjs): a run with nothing to look at must not look green.
 *
 * ── EXIT CODES ──────────────────────────────────────────────────────────────
 *
 *   0  check: every file is well formed and the graph conforms. test: every case came out as
 *      expected. query: it ran, whether or not anything matched.
 *   1  check: a malformed tag, a syntax error, a warning, or a shape violation. test: at least one
 *      case did not come out as expected, or an extractor test failed. query: no such query, or a
 *      slug that is malformed or names nothing.
 *   2  it could not run: no Java 21, Jena could not be fetched, nothing to check or test, a case
 *      with no `# expect:` line, a malformed case, the extractor's tests missing or not running,
 *      or a report it could not read. Kept apart from 1 so a broken tool is never read as a
 *      verdict.
 */
import {spawnSync} from 'node:child_process'
import {existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {basename, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {extractTags, toTurtle} from './extract.mjs'
import {format, listQueries, QueryError, runQuery} from './queries.mjs'
import {ensureJena, runJena, VERSION} from './jena.mjs'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const SHAPES = 'shapes.ttl'
const TESTS = 'tests'

const fail = (message) => {
  console.error(message)
  process.exit(2)
}

// Relative to where the command ran when that is shorter; absolute for a directory elsewhere.
const shown = (file) => {
  const path = relative(process.cwd(), file)
  return path.startsWith('..') ? file : path
}

const turtleIn = (dir) =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.ttl'))
    .sort()
    .map((name) => join(dir, name))

/** The shapes file and the data files directly in `dir`, or exit 2 if either is missing. */
function graphFiles(dir) {
  if (!existsSync(dir)) fail(`No directory at ${dir}.`)
  const files = turtleIn(dir)
  const shapes = files.find((file) => basename(file) === SHAPES)
  const data = files.filter((file) => file !== shapes)
  if (!shapes) fail(`No ${SHAPES} in ${shown(dir)}, so there is nothing to check against.`)
  if (data.length === 0) fail(`No data files in ${shown(dir)}, only ${SHAPES}.`)
  return {shapes, data}
}

async function jena() {
  try {
    await ensureJena()
  } catch (error) {
    fail(error.message)
  }
}

/** Every WARN or ERROR riot reports for `files`, as text, or '' when they are all well formed. */
function syntaxProblems(files) {
  const run = runJena('riotcmd.riot', ['--validate', ...files])
  if (run.error) fail(`Jena did not start: ${run.error.message}`)
  const problems = (run.stderr ?? '').split('\n').filter((line) => /\b(WARN|ERROR)\b/.test(line))
  if (run.status !== 0 || problems.length > 0) {
    return (problems.length > 0 ? problems.join('\n') : run.stderr).trim()
  }
  return ''
}

/** Validates `data` against `shapes`: `{conforms: true}`, or the report and how many results. */
function validate(shapes, data) {
  const run = runJena('shacl.shacl', [
    'validate',
    '--text',
    '--shapes',
    shapes,
    ...data.flatMap((file) => ['--data', file]),
  ])
  if (run.error) fail(`Jena did not start: ${run.error.message}`)
  const report = (run.stdout ?? '').trim()
  if (run.status === 0 && report === 'Conforms') return {conforms: true}
  if (run.status === 0 && report.startsWith('Node=')) {
    const count = report.split('\n').filter((line) => line.startsWith('Node=')).length
    return {conforms: false, report, count}
  }
  return fail(
    `shacl did not produce a report it could read (exit ${run.status}):\n` +
      `${run.stderr || report}`.trim(),
  )
}

/* ── check ────────────────────────────────────────────────────────────────── */

/**
 * The tagged comments in the repository the graph describes (the folder project-graph/ sits in),
 * written as code locations to a temporary file outside the repository and removed on exit,
 * whichever way the command ends. A `finally` would not do: `process.exit()` skips it.
 *
 * A malformed tag stops `check` (exit 1). A query only warns, since partial answers to a question
 * are still worth having, but it says loudly what it could not read.
 */
function gatherLocations(dir, {strict}) {
  const tags = extractTags(resolve(dir, '..'))
  if (tags.errors.length > 0) {
    const say = strict ? console.error : (line) => console.error(`warning: ${line}`)
    say(
      `${tags.errors.length} malformed tag${tags.errors.length === 1 ? '' : 's'}${strict ? '' : ', left out of these results'}:`,
    )
    for (const {path, line, message} of tags.errors) say(`  ${path}:${line}  ${message}`)
    if (strict) process.exit(1)
  }
  const scratch = mkdtempSync(join(tmpdir(), 'project-graph-'))
  process.on('exit', () => rmSync(scratch, {recursive: true, force: true}))
  const file = join(scratch, 'locations.ttl')
  writeFileSync(file, toTurtle(tags.locations))
  return {file, tags}
}

async function check(dir) {
  const {shapes, data} = graphFiles(dir)

  // A tag that can't be read is reported before Jena starts.
  const {file: locations, tags} = gatherLocations(dir, {strict: true})
  await jena()

  // The generated file goes through riot too, so an extractor bug shows as a syntax error rather
  // than as Jena failing to read its input.
  const problems = syntaxProblems([shapes, ...data, locations])
  if (problems) {
    console.error(`Not well formed:\n${problems}`)
    process.exit(1)
  }

  const result = validate(shapes, [...data, locations])
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
  const counted = `${plural(tags.locations.length, 'tagged comment')} in ${plural(tags.files, 'file')}`
  if (result.conforms) {
    console.log(
      `Conforms: ${data.map(shown).join(', ')} and ${counted}, against ${shown(shapes)} (Jena ${VERSION}).`,
    )
    return
  }
  console.error(
    `${result.count} shape violation${result.count === 1 ? '' : 's'}:\n\n${result.report}`,
  )
  process.exit(1)
}

/* ── test ─────────────────────────────────────────────────────────────────── */

/** The expectation a case states in its `# expect:` line, or exit 2 when it states none. */
function expectationOf(file) {
  const line = readFileSync(file, 'utf8').match(/^# expect: (.*)$/m)?.[1]
  if (line === 'conforms') return {conforms: true}
  const message = line?.match(/^violation "(.+)"$/)?.[1]
  if (message) return {conforms: false, message}
  return fail(
    `${shown(file)} needs a line saying \`# expect: conforms\` or \`# expect: violation "<text>"\`.`,
  )
}

async function test(dir) {
  const {shapes, data} = graphFiles(dir)
  const casesDir = join(dir, TESTS)
  const cases = existsSync(casesDir) ? turtleIn(casesDir) : []
  if (cases.length === 0)
    fail(`No planted cases in ${shown(casesDir)}, so there is nothing to test.`)
  const expectations = new Map(cases.map((file) => [file, expectationOf(file)]))
  await jena()

  // One riot run over everything. A malformed case is a broken test rather than a verdict on the
  // shapes, and malformed real files would make every case meaningless, so either one is exit 2.
  const problems = syntaxProblems([shapes, ...data, ...cases])
  if (problems) fail(`Not well formed, so the cases cannot run:\n${problems}`)

  let failures = 0
  for (const file of cases) {
    const want = expectations.get(file)
    const got = validate(shapes, [...data, file])
    const name = basename(file, '.ttl')

    let why = ''
    if (want.conforms && !got.conforms) why = `expected it to conform; got:\n\n${got.report}`
    if (!want.conforms && got.conforms)
      why = `expected a violation saying "${want.message}"; it conforms`
    if (!want.conforms && !got.conforms && !got.report.includes(want.message)) {
      why = `expected a violation saying "${want.message}"; got:\n\n${got.report}`
    }

    if (why) {
      failures++
      console.error(`FAIL  ${name}: ${why.replace(/\n/g, '\n      ')}\n`)
    } else {
      console.log(
        `ok    ${name}${got.conforms ? '' : ` (${got.count} result${got.count === 1 ? '' : 's'})`}`,
      )
    }
  }

  const passed = cases.length - failures
  console.log(`\n${passed} of ${cases.length} cases as expected (Jena ${VERSION}).`)

  // The saved queries' planted cases: a fixture, the query to run on it, and what must come back.
  const queryCasesDir = join(casesDir, 'queries')
  const queryCases = existsSync(queryCasesDir) ? turtleIn(queryCasesDir) : []
  if (queryCases.length === 0)
    fail(`No query cases in ${shown(queryCasesDir)}, so the queries are untested.`)
  const queryProblems = syntaxProblems(queryCases)
  if (queryProblems) fail(`Not well formed, so the query cases cannot run:\n${queryProblems}`)
  let queryFailures = 0
  for (const file of queryCases) {
    const name = basename(file, '.ttl')
    const why = queryCaseFailure(dir, file, data)
    if (why) {
      queryFailures++
      console.error(`FAIL  query/${name}: ${why.replace(/\n/g, '\n      ')}\n`)
    } else {
      console.log(`ok    query/${name}`)
    }
  }
  console.log(
    `${queryCases.length - queryFailures} of ${queryCases.length} query cases as expected.`,
  )

  // The extractor's own tests: ordinary unit tests, since a parser is ordinary code. Run from the
  // directory under test, so a copy with a weakened extractor tests that copy.
  const unitTests = join(dir, 'extract.test.mjs')
  if (!existsSync(unitTests)) fail(`No ${shown(unitTests)}, so the extractor is untested.`)
  const run = spawnSync(process.execPath, ['--test', '--test-reporter=spec', unitTests], {
    encoding: 'utf8',
  })
  const count = (label) => Number(run.stdout.match(new RegExp(`ℹ ${label} (\\d+)`))?.[1] ?? NaN)
  const [total, pass] = [count('tests'), count('pass')]
  if (Number.isNaN(total) || total === 0) fail(`The extractor's tests did not run:\n${run.stderr}`)
  if (run.status !== 0) console.error(run.stdout)
  console.log(`${pass} of ${total} extractor tests pass.`)

  if (failures > 0 || queryFailures > 0 || run.status !== 0) process.exit(1)
}

/**
 * Why a query case did not come out as expected, or '' when it did. A case states:
 *
 *   # query: <name> [slug]
 *   # expect: <first-column values, separated by spaces>    the EXACT set, or `nothing`
 *   # expect <column>: <text>                               some result's column contains it
 *   # expect error: <text>                                  the query refuses, saying this
 *
 * The first form is an exact set on purpose: what a query leaves out is as much its job as what it
 * finds, as `automation-only` leaving out a claim also seen in a real browser shows.
 */
function queryCaseFailure(dir, file, data) {
  const text = readFileSync(file, 'utf8')
  const [name, slug] = (text.match(/^# query: (.+)$/m)?.[1] ?? '').trim().split(/\s+/)
  if (!name) fail(`${shown(file)} needs a \`# query: <name> [slug]\` line.`)
  const exact = text.match(/^# expect: (.+)$/m)?.[1].trim()
  const contains = [...text.matchAll(/^# expect (?!error)(\w+): (.+)$/gm)].map((m) => [
    m[1],
    m[2].trim(),
  ])
  const error = text.match(/^# expect error: (.+)$/m)?.[1].trim()
  if (!exact && contains.length === 0 && !error) fail(`${shown(file)} states nothing to expect.`)

  let result
  try {
    result = runQuery(dir, name, slug, [...data, file])
  } catch (e) {
    if (!(e instanceof QueryError)) fail(e.message)
    if (error && e.message.includes(error)) return ''
    return `refused: ${e.message}`
  }
  if (error) return `expected it to refuse, saying "${error}"; it ran`

  const first = result.rows.map((row) => row[result.vars[0]]).sort()
  if (exact) {
    const want = exact === 'nothing' ? [] : exact.split(/\s+/).sort()
    if (JSON.stringify(first) !== JSON.stringify(want)) {
      return `expected exactly [${want.join(' ')}]; got [${first.join(' ')}]`
    }
  }
  for (const [column, needle] of contains) {
    if (!result.rows.some((row) => (row[column] ?? '').includes(needle))) {
      return `expected some result's ${column} to contain "${needle}"; got:\n${format(result)}`
    }
  }
  return ''
}

/* ── query ────────────────────────────────────────────────────────────────── */

async function query(dir, name, slug) {
  if (!name) {
    console.log('Saved queries (pnpm graph query <name> [slug]):\n')
    for (const q of listQueries(dir)) {
      console.log(`  ${q.name}${q.param ? ` <${q.param}>` : ''}\n    ${q.description}\n`)
    }
    return
  }
  const {data} = graphFiles(dir)
  const {file: locations} = gatherLocations(dir, {strict: false})
  await jena()
  try {
    console.log(format(runQuery(dir, name, slug, [...data, locations])))
  } catch (e) {
    if (e instanceof QueryError) {
      console.error(e.message)
      process.exit(1)
    }
    fail(e.message)
  }
}

/* ── Commands ─────────────────────────────────────────────────────────────── */

const [command, ...args] = process.argv.slice(2)

if (command === 'check') await check(args[0] ? resolve(args[0]) : HERE)
else if (command === 'test') await test(args[0] ? resolve(args[0]) : HERE)
else if (command === 'query') await query(HERE, args[0], args[1])
else {
  fail(
    'Usage: pnpm graph check [dir]\n       pnpm graph test [dir]\n       pnpm graph query [name] [slug]',
  )
}
