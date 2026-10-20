/**
 * Protocol precondition 3: are the arm diffs clean?
 *
 *   node docs/project-graph/harness/arm-diff.mjs                every arm, against 086dd0f
 *   node docs/project-graph/harness/arm-diff.mjs --diff - [b|c]  a diff on stdin, for proving it
 *
 * protocol.md → "The three arms": the arms differ only in how knowledge is retrieved, so "a diff of
 * B or C against 086dd0f must show comment annotations, graph and glossary files, the extractor,
 * and the CLAUDE.md section below. Nothing else." A is 086dd0f itself.
 *
 * ── OUTSIDE project-graph/: EVERY CHANGED LINE ACCOUNTED FOR ─────────────────
 *
 * Each added or deleted line must be one of:
 *
 *   - a TAG LINE, by the extractor's own pattern;
 *   - a SEPARATOR, blank or a lone `*`, that leads into tag lines. The guide's worked example puts
 *     one before the tags, and inside an Astro comment, which has no marker, it is a blank line;
 *   - a MOVED CLOSER: a deleted `text *\/` whose text is re-added unchanged, the closer now on the
 *     last tag line. Accepted with the annotation (Andy, 2026-10-19), and the only deletion allowed;
 *   - the arm's CLAUDE.md SECTION, read from protocol.md's recorded text, added once as a block.
 *
 * Anything else is printed. A reworded comment shows up twice, as a deletion with no re-add and
 * an addition that is not annotation.
 *
 * ── INSIDE project-graph/: ONLY WHAT THE ARM IS SUPPOSED TO CARRY ────────────
 *
 * B adds `glossary.md` and nothing else. C's folder is the tooling at d8e60ee, without `tests/`,
 * plus `claims.ttl`, byte for byte the accepted annotation's. That glossary.md is what
 * glossary.mjs generates is glossary.mjs's to check, since it needs Jena.
 *
 * ── PROVEN 2026-10-19 ────────────────────────────────────────────────────────
 *
 * Run first as a scratchpad script, on planted diffs: a reworded comment, a dropped line, a
 * separator with no tag after it, and a CLAUDE.md without its section each failed, and a clean
 * moved closer passed. Then on the arms: A was 086dd0f; B and C each had 45 files, 325 tag lines,
 * 90 separators and 24 moved closers, with no problems, and only their sections set them apart.
 * Moved here, it failed the same planted diffs, and B's real diff checked against C's section.
 * The folder check passed both arms and failed pg-guide-trial, judged as if it were C, on its
 * changed guide and vocabulary and its own claims.ttl.
 *
 * Exit 0 when every arm is clean, 1 when one is not, 2 when it can't run.
 */
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {REPO} from './harness.mjs'

const BASE = '086dd0f'
const TOOLING = 'd8e60ee'
const RECORD = join(REPO, 'docs', 'project-graph', 'runs', 'annotation-2026-10-19T23-10-29-827Z')

const TAG = /^\s*(?:\{\/\*\*?|\/\*\*?|\*|\/\/|<!--|#)?\s*@(?:concepts?|claims?)(?=\s|$)/
const SEPARATOR = /^\s*\*?\s*$/
const CLOSER = /\s*(\*\/\}?|-->)\s*$/

const git = (...args) =>
  spawnSync('git', ['-C', REPO, ...args], {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024})

/** The arms' CLAUDE.md sections as protocol.md records them, B's then C's, each with its blank. */
export function sectionsFromProtocol(
  text = readFileSync(join(REPO, 'docs', 'project-graph', 'protocol.md'), 'utf8'),
) {
  const [b, c] = [...text.matchAll(/```markdown\n(## Comment tags\n[\s\S]*?)```\n/g)].map((m) =>
    m[1].split('\n'),
  )
  return {b, c}
}

/** Every line of a `git diff -U0` that is not annotation or the given section, and the counts. */
export function unexplained(diff, section = []) {
  const hunks = []
  let file = ''
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git')) file = line.split(' b/')[1]
    else if (line.startsWith('@@')) hunks.push({file, del: [], add: []})
    else if (line.startsWith('-') && !line.startsWith('---')) hunks.at(-1).del.push(line.slice(1))
    else if (line.startsWith('+') && !line.startsWith('+++')) hunks.at(-1).add.push(line.slice(1))
  }

  const problems = []
  const counts = {tags: 0, separators: 0, moved: 0, section: 0}
  let sectionSeen = false
  for (const h of hunks) {
    if (h.file === 'CLAUDE.md' && section.length) {
      const at = h.add.findIndex((_, i) => section.every((s, j) => h.add[i + j] === s))
      if (at !== -1) {
        if (sectionSeen) problems.push(`${h.file}: the section is added twice`)
        sectionSeen = true
        h.add.splice(at, section.length)
        counts.section += section.length
      }
    }
    const unpaired = [...h.del]
    h.add.forEach((line, i) => {
      if (TAG.test(line)) return counts.tags++
      if (SEPARATOR.test(line)) {
        let j = i + 1
        while (j < h.add.length && SEPARATOR.test(h.add[j])) j++
        if (j < h.add.length && TAG.test(h.add[j])) return counts.separators++
        return problems.push(`${h.file}: separator not followed by a tag: ${JSON.stringify(line)}`)
      }
      const k = unpaired.findIndex(
        (d) => CLOSER.test(d) && d.replace(CLOSER, '') === line.replace(/\s+$/, ''),
      )
      if (k !== -1) {
        unpaired.splice(k, 1)
        return counts.moved++
      }
      problems.push(`${h.file}: added line that is not annotation: ${JSON.stringify(line)}`)
    })
    for (const d of unpaired)
      problems.push(`${h.file}: deleted line not re-added: ${JSON.stringify(d)}`)
  }
  if (section.length && !sectionSeen) problems.push('CLAUDE.md: the approved section is missing')
  counts.files = new Set(hunks.map((h) => h.file)).size
  return {counts, problems}
}

/** What an arm's project-graph/ holds beyond what it should, as problems. */
export function toolingProblems(arm) {
  if (arm === 'pg-arm-b') {
    const changed = git('diff', '--name-status', BASE, arm, '--', 'project-graph').stdout.trim()
    return changed === 'A\tproject-graph/glossary.md'
      ? []
      : [`project-graph/ is not just glossary.md:\n${changed}`]
  }
  const problems = git('diff', '--name-status', TOOLING, arm, '--', 'project-graph')
    .stdout.split('\n')
    .filter(
      (l) => l && !l.startsWith('D\tproject-graph/tests/') && l !== 'A\tproject-graph/claims.ttl',
    )
    .map((l) => `project-graph/ differs from ${TOOLING}: ${l}`)
  const claims = git('show', `${arm}:project-graph/claims.ttl`).stdout
  if (claims !== readFileSync(join(RECORD, 'claims.ttl'), 'utf8'))
    problems.push("claims.ttl is not the accepted annotation's")
  return problems
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sections = sectionsFromProtocol()
  if (!sections.b || !sections.c) {
    console.error("protocol.md doesn't record both arms' sections. Nothing checked.")
    process.exit(2)
  }

  if (process.argv[2] === '--diff') {
    const {counts, problems} = unexplained(readFileSync(0, 'utf8'), sections[process.argv[4]] ?? [])
    console.log(JSON.stringify(counts))
    for (const p of problems) console.log(`  ${p}`)
    process.exit(problems.length ? 1 : 0)
  }

  let dirty = 0
  const same = git('rev-parse', 'pg-arm-a').stdout === git('rev-parse', `${BASE}^{commit}`).stdout
  console.log(`pg-arm-a: ${same ? `is ${BASE}` : `IS NOT ${BASE}`}`)
  if (!same) dirty++
  for (const [arm, section] of [
    ['pg-arm-b', sections.b],
    ['pg-arm-c', sections.c],
  ]) {
    const diff = git('diff', '-U0', '--no-color', BASE, arm, '--', '.', ':!project-graph')
    if (diff.status !== 0) {
      console.error(diff.stderr)
      process.exit(2)
    }
    const {counts, problems} = unexplained(diff.stdout, section)
    problems.push(...toolingProblems(arm))
    console.log(`${arm}: ${JSON.stringify(counts)}, ${problems.length} problem(s)`)
    for (const p of problems) console.log(`  ${p}`)
    if (problems.length) dirty++
  }
  process.exit(dirty ? 1 : 0)
}
