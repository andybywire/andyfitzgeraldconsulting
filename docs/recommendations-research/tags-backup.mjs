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
// ── PUBLISHED ONLY, AND DRAFTS ARE NAMED RATHER THAN IGNORED ─────────────────────────────────
//
// The tagger writes published documents, so those are what a restore must put back. A draft of
// the same document would keep its own tags and show them in the Studio instead, so a backup
// that silently skipped drafts would look complete and not be. The `raw` perspective sees both;
// any draft found is listed in the file and on screen. The lab was imported with --no-drafts, so
// a draft there means someone has been editing in the lab Studio.
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

const published = rows.filter((d) => !d._id.startsWith('drafts.') && !d._id.startsWith('versions.'))
const drafts = rows.filter((d) => !published.includes(d)).map((d) => d._id)

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
      documents: published.map((d) => ({
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
console.log(`Backed up ${published.length} documents from ${dataset} (${tagged} with tags).`)
console.log(`  ${file.pathname}`)
if (drafts.length)
  console.log(`  WARNING: ${drafts.length} draft(s) not backed up: ${drafts.join(', ')}`)
