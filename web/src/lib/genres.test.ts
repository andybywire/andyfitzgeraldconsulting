/**
 * `subtree`: the Genre walk the related-content ranker sorts its two categories with.
 *
 * Run with `pnpm test`, from the root or from web/. node:test runs this file directly under
 * Node's type stripping, so it imports `./genres.ts` WITH its extension, as the research
 * scripts do; `astro check` type-checks it alongside everything else in src/.
 *
 * The taxonomy is made up, and small enough to hold in your head. Each test pins ONE
 * behavior the header of `subtree` promises, so a failure names the promise that broke.
 *
 *   top-a                    top-b
 *     ├─ mid-1                 └─ mid-3
 *     │    ├─ leaf-1a
 *     │    └─ leaf-1b
 *     └─ mid-2
 */
import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {subtree, type BroaderConcept} from './genres.ts'

const concept = (_id: string, ...broader: string[]): BroaderConcept => ({_id, broader})

const TREE: BroaderConcept[] = [
  concept('top-a'),
  concept('top-b'),
  concept('mid-1', 'top-a'),
  concept('mid-2', 'top-a'),
  concept('mid-3', 'top-b'),
  concept('leaf-1a', 'mid-1'),
  concept('leaf-1b', 'mid-1'),
]

describe('subtree', () => {
  /* Load-bearing for Note, which is both a branch and a genre documents carry: an exclusive
     walk would drop every document tagged with Note itself. */
  test('includes the root itself', () => {
    assert.ok(subtree(TREE, 'mid-1').has('mid-1'))
    assert.deepEqual(subtree(TREE, 'leaf-1a'), new Set(['leaf-1a']))
  })

  test('returns every descendant at any depth, and nothing outside the root', () => {
    assert.deepEqual(
      subtree(TREE, 'top-a'),
      new Set(['top-a', 'mid-1', 'mid-2', 'leaf-1a', 'leaf-1b']),
    )
  })

  /* SKOS allows poly-hierarchy, and the walk reads EVERY `broader` ref. That differs, on
     purpose, from the topic ranker, which relates a topic through its first parent only. */
  test('puts a concept with two parents in both parents’ subtrees', () => {
    const tree = [...TREE, concept('shared', 'mid-2', 'mid-3')]
    assert.ok(subtree(tree, 'top-a').has('shared'))
    assert.ok(subtree(tree, 'top-b').has('shared'))
  })

  /* The Studio does not stop a concept being its own ancestor. Without the `seen` set this
     test does not fail, it HANGS, which is why the cycle guard is not an optimization.

     Node's `--test-timeout` cannot catch that hang: the loop is synchronous, so it blocks the
     very process the timer would fire in. Tried 2026-11-21, with the guard removed and a 5s
     timeout; the run was still going at 180s. On the runner, the test step's `timeout-minutes`
     in checks.yml is what turns a hang into a failure. Locally, Ctrl-C. */
  test('terminates on a cycle, and on a concept that is its own parent', () => {
    const tree = [concept('x', 'y'), concept('y', 'x'), concept('self', 'self')]
    assert.deepEqual(subtree(tree, 'x'), new Set(['x', 'y']))
    assert.deepEqual(subtree(tree, 'self'), new Set(['self']))
  })

  /* A dereferenced `concepts[]->` yields null for a dangling reference, and a `broader[]._ref`
     projection can carry a null. Neither should cost a build. */
  test('skips null concepts, null ids and null parent refs', () => {
    const tree = [...TREE, null, {_id: null, broader: ['top-a']}, {_id: 'orphan', broader: [null]}]
    assert.deepEqual(subtree(tree, 'top-a'), subtree(TREE, 'top-a'))
  })
})
