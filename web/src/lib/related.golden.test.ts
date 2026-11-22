/**
 * The golden test: the ranker over the 73 documents Andy judged in the recommendations research.
 *
 * related.test.ts pins each rule on a made-up taxonomy. This pins whole lists on the real one,
 * from related.golden.json, which docs/recommendations-research/golden-fixture.mjs wrote from
 * the lab's corpus, the v5 tag set and the M3.5 report. It reads no dataset.
 *
 * ── TWO SETS OF LISTS, TWO DIFFERENT GUARDS ─────────────────────────────────
 *
 *   WITH v5's SCORES, under the rule M3.5 used, every list must equal M3.5's v5 column. That
 *   column is what Andy judged, so this is the proof that the module the site runs is the
 *   ranker the research measured. A failure here means the port drifted.
 *
 *   WITHOUT SCORES, under the shipping rule — CROSS_RULE, ties by genre — the lists are what
 *   stream 2 ships until the tagger's scores arrive in stream 3. They are a node:test
 *   SNAPSHOT, related.golden.test.ts.snapshot, recorded once and reviewed by Andy against v5.
 *   A failure here means the shipped lists changed: deliberate, after a review, if the rule or
 *   the module changed on purpose, and a regression otherwise.
 *
 * ── UPDATING THE SNAPSHOT IS A DECISION, NOT A FIX ──────────────────────────
 *
 *   cd web && node --test --test-update-snapshots src/lib/related.golden.test.ts
 *
 * rewrites it. Do that only when the lists are meant to change, and say why in the commit: the
 * diff of the .snapshot file is the review of what every page will show.
 *
 * ── "WHAT SHIPS" MEANS ON THESE 73 DOCUMENTS ────────────────────────────────
 *
 * Production holds more than the judged corpus: Andy's three notes from after the research,
 * and every document published since. They can enter these pages' lists. So the snapshot is the
 * no-scores ranking of the judged corpus, and the band check against a real build (stream 2,
 * piece 4) is what shows production's lists.
 */
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import {
  CROSS_RULE,
  genresByCategory,
  rankAcross,
  type GenreConcept,
  type GenreTops,
  type RankRule,
  type RelatedTopic,
} from './related.ts'

type GoldenDocument = {
  _id: string
  slug: string
  _type: string
  genreId: string | null
  pubDate: string | null
  topics: RelatedTopic[]
}
/** One page's list, by slug, and whether it fell back to "Recent". */
type Lists = Record<string, {items: string[]; isFallback: boolean}>

const fixture: {
  rule: RankRule
  genres: {tops: GenreTops[]; concepts: GenreConcept[]}
  pool: GoldenDocument[]
  v5: Lists
} = JSON.parse(readFileSync(new URL('./related.golden.json', import.meta.url), 'utf8'))

const categories = genresByCategory(fixture.genres.tops, fixture.genres.concepts)

/** What every page's band shows, for one pool under one rule. */
const listsFor = (pool: GoldenDocument[], rule: RankRule): Lists =>
  Object.fromEntries(
    pool.map((page) => {
      const {items, isFallback} = rankAcross(
        {_id: page._id, type: page._type, genreId: page.genreId, topics: page.topics},
        pool,
        categories,
        rule,
      )
      return [page.slug, {items: items.map((item) => item.slug), isFallback}]
    }),
  )

/** The pool as stream 2 stores it: the same tags, with no `topicScores` to read. */
const withoutScores = fixture.pool.map((doc) => ({
  ...doc,
  topics: doc.topics.map(({score: _score, ...topic}) => topic),
}))

/** The rule the pages run. CROSS_RULE carries no tie-break of its own; the pages add it. */
const SHIPPING_RULE: RankRule = {...CROSS_RULE, tieBreak: 'genre-strength'}

test('the fixture holds the 73 judged documents, and a v5 list for each', () => {
  assert.equal(fixture.pool.length, 73)
  assert.deepEqual(Object.keys(fixture.v5).sort(), fixture.pool.map((d) => d.slug).sort())
})

test('with v5’s scores, every page’s list equals M3.5’s v5 column', () => {
  assert.deepEqual(listsFor(fixture.pool, fixture.rule), fixture.v5)
})

test('without scores, every page’s list matches the reviewed snapshot', (t) => {
  t.assert.snapshot(listsFor(withoutScores, SHIPPING_RULE))
})
