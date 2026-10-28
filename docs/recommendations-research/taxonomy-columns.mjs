// The taxonomy columns of M3.n, derived from tags: the hand tags, and each simulated tag set.
// Reads files only; no queries.
//
// Imported by m3-report.mjs and cross-dryrun.mjs. It is the counterpart of baseline-columns.mjs,
// which derives the two embeddings columns.
//
// ── ONE RANKER, ONE RULE, SO THE COLUMNS DIFFER ONLY IN THEIR TAGS ───────────────────────────
//
// Every taxonomy column runs the site's real ranker (web/src/lib/related.ts → rankAcross) under
// TAXONOMY_CROSS, which is held fixed through the revisions (plan.md → Decisions, 2026-10-28). So
// a change between two columns comes from the tags, and through them from the vocabulary.
//
// ── A TAG SET'S TAGS ARE BARE CONCEPT IDS, AND THE RANKER WANTS MORE ─────────────────────────
//
// RELATED_POOL_QUERY gives each topic its first parent and whether that parent is a top concept.
// A tag set holds only concept ids, so the shape is rebuilt from the Topic scheme. checkShape()
// proves the rebuild against the hand tags, which the query did project: if the two ever differ,
// a tag set would be ranked on a shape the site never sees.
import {readFileSync} from 'node:fs'
import {rankAcross} from '../../web/src/lib/related.ts'
import {TAXONOMY_CROSS} from './baseline-columns.mjs'

/** A tag set file, `tagsets/<version>.json`, as tagset.mjs wrote it. */
export const loadTagSet = (version) =>
  JSON.parse(readFileSync(new URL(`./tagsets/${version}.json`, import.meta.url)))

/**
 * A function from concept id to the topic shape RELATED_POOL_QUERY projects: the first parent, and
 * whether that parent is a top concept, which is true when the parent has no parent of its own.
 * That is the query's `!defined(broader[0]->broader[0]._ref)`.
 */
export function topicShaper(topicScheme) {
  const parentOf = new Map(topicScheme.concepts.map((c) => [c._id, c.parents?.[0] ?? null]))
  return (id) => {
    const parent = parentOf.get(id) ?? null
    return {_id: id, parent, parentIsTop: !parentOf.get(parent)}
  }
}

/**
 * Throws unless rebuilding every document's hand tags gives back exactly what the query projected.
 * Only the three fields the ranker reads are compared: fetch-corpus.mjs adds a `prefLabel` for its
 * reports.
 */
export function checkShape(pool, shape) {
  const key = (ts) =>
    JSON.stringify(
      (ts ?? [])
        .filter(Boolean)
        .map(({_id, parent, parentIsTop}) => [_id, parent, parentIsTop])
        .sort(),
    )
  const misshapen = pool.filter(
    (d) => key(d.topics) !== key((d.topics ?? []).filter(Boolean).map((t) => shape(t._id))),
  )
  if (misshapen.length) {
    throw new Error(`rebuilt topics differ from the query's on ${misshapen.map((d) => d.slug)}`)
  }
}

/** The pool with every document's topics replaced by a tag set's. Throws if the set misses one. */
export function withTagSet(pool, tagSet, shape) {
  const tagsFor = new Map(tagSet.documents.map((d) => [d._id, d.tags.map((t) => t.concept)]))
  const missing = pool.filter((d) => !tagsFor.has(d._id))
  if (missing.length) {
    throw new Error(`tag set ${tagSet.version} has no entry for ${missing.map((d) => d.slug)}`)
  }
  return pool.map((d) => ({...d, topics: tagsFor.get(d._id).map(shape)}))
}

/** One page's taxonomy column: rankAcross over a pool, under TAXONOMY_CROSS unless told otherwise. */
export function taxonomyColumn(page, pool, categories, rule = TAXONOMY_CROSS) {
  const self = pool.find((d) => d._id === page._id)
  return rankAcross({_id: page._id, type: page._type, topics: self.topics}, pool, categories, rule)
}
