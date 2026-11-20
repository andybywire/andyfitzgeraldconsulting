// Snapshot every tagged document's tag fields, so any round of tagging can be undone.
//
//   pnpm --dir studio exec sanity exec ../docs/recommendations-research/tags-backup.mjs \
//     --with-user-token [-- --dataset production-26]
//
// Writes backups/tags-<dataset>-<UTC stamp>.json, which is committed: a backup that lives only
// in a session's scratchpad is gone when the session is. The dataset defaults to the lab, where
// every write happens. Backing up production-26 is allowed, since this script only reads.
//
// ── WHAT IS SAVED, AND WHAT IS ONLY FOR READING ──────────────────────────────────────────────
//
// FIELDS are restored exactly as stored: `topic` with its array `_key`s, and `topicScores`. The
// second does not exist yet; it arrives with the tagger, and a backup taken before it records
// null, which restore turns into an unset. `title`, `slug` and `topicLabels` ride along so a
// person can read the file. tags-restore.mjs never writes them.
//
// `topicLabels` is each tag's `prefLabel` at backup time, in `topic`'s order, so the file is a
// quick check without a query (Andy, 2026-10-26). It sits BESIDE `topic`, not inside it: restore
// writes `topic` back exactly, so a label added to each reference would be written into the data.
// A null label means a reference whose concept no longer exists. It is kept, not filtered,
// because a dangling tag is exactly what a quick check should catch.
//
// ── DRAFTS ARE BACKED UP TOO, SINCE STREAM 1 ─────────────────────────────────────────────────
//
// This saved published documents only, and listed drafts without saving them: the tagger wrote
// published documents, so those were what a restore had to put back. Two things changed on
// 2026-11-20 (stream-1-data.md, A5 and A6). The lab now holds production's drafts on purpose,
// Andy's working notes, carried over at A5. And tags-write.mjs sets `topic` on a judged
// document's draft as well as its published copy, so a later publish can't put old tags back over
// new ones. A restore must therefore be able to put drafts back too, and a backup that skipped
// them would look complete and not be.
//
// So every draft of a tagged type is saved beside the published documents, under its own
// `drafts.` id, and `drafts` lists which entries are drafts. The `raw` perspective sees both.
// Release versions (`versions.`) are still left out: releases are off in this Studio, and none
// exist.
import {mkdirSync, writeFileSync} from 'node:fs'
import {LAB, TAGGED_TYPES, arg, query} from './lab-api.mjs'

/* Recorded in the file too, and restore reads it from there: a backup describes its own shape. */
const FIELDS = ['topic', 'topicScores']

const dataset = typeof arg('dataset') === 'string' ? arg('dataset') : LAB

const rows = await query(
  dataset,
  `*[_type in $types] | order(_type asc, slug.current asc) {
    _id, _type, "slug": slug.current, title, topic, topicScores,
    "topicLabels": topic[]->prefLabel
  }`,
  {types: TAGGED_TYPES},
  'raw',
)

const versions = rows.filter((d) => d._id.startsWith('versions.'))
const saved = rows.filter((d) => !versions.includes(d))
const published = saved.filter((d) => !d._id.startsWith('drafts.'))
const drafts = saved.filter((d) => d._id.startsWith('drafts.')).map((d) => d._id)

const takenAt = new Date().toISOString()
const stamp = takenAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
const file = new URL(`./backups/tags-${dataset}-${stamp}.json`, import.meta.url)

mkdirSync(new URL('./backups/', import.meta.url), {recursive: true})
writeFileSync(
  file,
  JSON.stringify(
    {
      dataset,
      takenAt,
      fields: FIELDS,
      count: published.length,
      drafts,
      documents: saved.map((d) => ({
        _id: d._id,
        _type: d._type,
        slug: d.slug,
        title: d.title,
        topicLabels: d.topicLabels ?? [],
        topic: d.topic ?? null,
        topicScores: d.topicScores ?? null,
      })),
    },
    null,
    2,
  ) + '\n',
)

const tagged = published.filter((d) => d.topic?.length).length
console.log(
  `Backed up ${published.length} documents and ${drafts.length} drafts from ${dataset} (${tagged} published with tags).`,
)
console.log(`  ${file.pathname}`)
if (versions.length)
  console.log(
    `  WARNING: ${versions.length} release version(s) not backed up: ${versions.map((d) => d._id).join(', ')}`,
  )
