/**
 * The extractor's planted cases: source snippets, and exactly what each must yield.
 * `node project-graph/graph.mjs test` runs this after the shapes' cases; on its own,
 * `node --test project-graph/extract.test.mjs`.
 *
 * Ordinary unit tests, because a parser is ordinary code: Node's built-in `node:test`, so no new
 * dependency. Each case pins one rule from extract.mjs's header, and the ones that matter most are
 * the negatives: a mention mid-sentence is not a tag, and a malformed tag is an error rather than a
 * silent skip.
 */
import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'
import {extractTags, parseTags, toTurtle} from './extract.mjs'

const tags = (text) => parseTags(text).locations
const errors = (text) => parseTags(text).errors

/* ── Where a tag can be ───────────────────────────────────────────────────── */

test('a tag line in a CSS or JSDoc block comment', () => {
  const text = [
    '/*',
    ' * Some reasoning.',
    ' *',
    ' * @concept landing-point focus-ring',
    ' */',
  ].join('\n')
  assert.deepEqual(tags(text), [{line: 4, concepts: ['landing-point', 'focus-ring'], claims: []}])
})

test('a tag on a // line comment', () => {
  assert.deepEqual(tags('// @claim scripted-focus-draws-ring'), [
    {line: 1, concepts: [], claims: ['scripted-focus-draws-ring']},
  ])
})

test('a tag with no marker, inside an Astro template comment', () => {
  const text = [
    '  {',
    '    /*',
    '      Some reasoning.',
    '      @concept hiding',
    '    */',
    '  }',
  ].join('\n')
  assert.deepEqual(tags(text), [{line: 4, concepts: ['hiding'], claims: []}])
})

test('a tag in a Markdown HTML comment, with its closer removed', () => {
  assert.deepEqual(tags('Some prose.\n\n<!-- @concept landing-point -->'), [
    {line: 3, concepts: ['landing-point'], claims: []},
  ])
})

test('one-line block comments, CSS and Astro, with their closers removed', () => {
  assert.deepEqual(tags('/* @concept hiding */\n\n{/* @claim planted-x */}'), [
    {line: 1, concepts: ['hiding'], claims: []},
    {line: 3, concepts: [], claims: ['planted-x']},
  ])
})

test('a tag on a PHP # comment', () => {
  assert.deepEqual(tags('# @concept hidden-from-assistive-technology'), [
    {line: 1, concepts: ['hidden-from-assistive-technology'], claims: []},
  ])
})

/* ── What counts as one location ──────────────────────────────────────────── */

test('consecutive tag lines are one location, at the first line', () => {
  const text = [
    ' * Reasoning.',
    ' *',
    ' * @concept landing-point',
    ' * @claim planted-x planted-y',
  ].join('\n')
  assert.deepEqual(tags(text), [
    {line: 3, concepts: ['landing-point'], claims: ['planted-x', 'planted-y']},
  ])
})

test('tags separated by another line are two locations', () => {
  const text = [' * @concept hiding', ' *', ' * @claim planted-x'].join('\n')
  assert.deepEqual(tags(text), [
    {line: 1, concepts: ['hiding'], claims: []},
    {line: 3, concepts: [], claims: ['planted-x']},
  ])
})

test('Windows line endings number lines the same way', () => {
  assert.deepEqual(tags('one\r\ntwo\r\n// @concept hiding\r\n'), [
    {line: 3, concepts: ['hiding'], claims: []},
  ])
})

/* ── What is not a tag ────────────────────────────────────────────────────── */

test('a mention in the middle of a sentence is not a tag', () => {
  assert.deepEqual(parseTags(' * Read the @concept and @claim tags at the end of a comment.'), {
    locations: [],
    errors: [],
  })
})

test('other @-words at the start of a line are not tags', () => {
  const text = [
    '@container style(--breakpoint-md: true) {',
    ' * @param el the element',
    '@media print {',
  ].join('\n')
  assert.deepEqual(parseTags(text), {locations: [], errors: []})
})

/* ── A malformed tag is an error, never a skip ────────────────────────────── */

test('a tag with no slugs', () => {
  assert.deepEqual(errors(' * @concept'), [{line: 1, message: '"@concept" with no slugs after it'}])
})

test('a slug with capitals', () => {
  assert.match(errors('// @concept Landing-Point')[0].message, /"Landing-Point" is not a slug/)
})

test('slugs separated by a comma rather than a space', () => {
  assert.match(
    errors('// @concept landing-point, focus-ring')[0].message,
    /"landing-point," is not a slug/,
  )
})

test('the plural keyword, the likeliest typo', () => {
  assert.deepEqual(errors(' * @concepts landing-point'), [
    {line: 1, message: '"@concepts" should be "@concept"'},
  ])
  assert.deepEqual(errors(' * @claims planted-x'), [
    {line: 1, message: '"@claims" should be "@claim"'},
  ])
})

test('a malformed tag yields no location, and the good tags around it still do', () => {
  const found = parseTags(['// @concept hiding', '// @claim Bad_Slug'].join('\n'))
  assert.deepEqual(found.locations, [{line: 1, concepts: ['hiding'], claims: []}])
  assert.equal(found.errors.length, 1)
})

/* ── Turtle, and which files are read ─────────────────────────────────────── */

test('toTurtle writes one code location per location, and escapes the path', () => {
  const turtle = toTurtle([
    {path: 'web/src/a "b".astro', line: 7, concepts: ['hiding'], claims: ['planted-x']},
  ])
  assert.match(turtle, /\[\] a model:CodeLocation ;/)
  assert.match(turtle, /model:path "web\/src\/a \\"b\\".astro" ;/)
  assert.match(turtle, /model:line 7 ;/)
  assert.match(turtle, /dcterms:subject concept:hiding ;/)
  assert.match(turtle, /model:cites claim:planted-x \./)
})

test('only the scan list is read, docs/project-graph is skipped, and paths use /', () => {
  const root = mkdtempSync(join(tmpdir(), 'extract-test-'))
  try {
    const write = (path, text) => {
      mkdirSync(join(root, path, '..'), {recursive: true})
      writeFileSync(join(root, path), text)
    }
    write('web/src/components/A.astro', '{/* @concept hiding */}')
    write('web/src/styles/b.css', '/* @concept focus-ring */')
    write('docs/notes.md', '<!-- @concept landing-point -->')
    write('CLAUDE.md', '<!-- @concept focus-loss -->')
    write('docs/project-graph/id-design.md', ' * @claim example-only-not-a-real-tag')
    write('web/src/assets/image.svg', '<!-- @concept hiding -->')
    write('studio/schemas/c.ts', '// @concept hiding')
    const found = extractTags(root)
    assert.deepEqual(found.locations.map(({path}) => path).sort(), [
      'CLAUDE.md',
      'docs/notes.md',
      'web/src/components/A.astro',
      'web/src/styles/b.css',
    ])
    assert.equal(found.errors.length, 0)
  } finally {
    rmSync(root, {recursive: true, force: true})
  }
})
