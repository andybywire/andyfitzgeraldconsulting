// Write a tag set's tags into `topic`: on each judged document, and on its draft if it has one.
//
//   pnpm --dir studio exec sanity exec ../docs/recommendations-research/tags-write.mjs \
//     --with-user-token -- --tagset tagsets/v5.json [--write]
//
// Stream 1, step A6 (stream-1-data.md): the tags the M3 rounds simulated reach the dataset. A DRY
// RUN unless --write is given. It prints every change, by concept label, and touches nothing.
// --write applies them all in ONE transaction, then re-reads every document it wrote and exits
// non-zero if any differs from the tag set.
//
// ── THE DATASET COMES FROM THE TAG SET, NOT THE COMMAND LINE ─────────────────────────────────
//
// A tag set records the dataset its scores were computed in, and that is the only one it is
// written to: tags-restore.mjs's rule, for the same reason. v5 says `recommendations-lab`.
// Writing production-26 would still need --allow-production (lab-api.mjs), and stream 1 never
// does: the lab BECOMES production-26 at the switch, tags included.
//
// ── `topic` ONLY ──────────────────────────────────────────────────────────────────────────────
//
// The tag set carries each tag's score, and none of it is written. Scores ship with the Taxonomy
// Manager plugin in stream 3, so `topicScores` never reaches production's schema before then
// (Andy, 2026-11-19).
//
// ── DRAFTS TOO (Andy, 2026-11-20) ────────────────────────────────────────────────────────────
//
// Since A5 the lab holds production's drafts: Andy's working notes, kept on purpose. A draft
// carries its own `topic`. Writing only the published copy would leave the draft on its old tags,
// and publishing that draft later would put them back over the new ones, silently. So a judged
// document's draft gets the same `topic`, and nothing else in it is touched.
// tags-backup.mjs saves drafts for the same reason, so a restore can undo this as well.
//
// ── NOTHING IS WRITTEN UNLESS ALL OF THESE HOLD ──────────────────────────────────────────────
//
// 1. Every document in the tag set exists, published, in the dataset.
// 2. Every concept is a published skosConcept in the Topic scheme. A tag on a concept that
//    left the scheme would write a chip no facet can filter on.
// 3. A backup exists that holds every document this writes, drafts included, and was taken
//    after each one last changed. Without it, tags-restore.mjs could not undo the write.
//
// Each failure throws with what to do. These guards run on a dry run too, so a dry run that
// passes is one that --write will accept.
//
// ── KEYS AND ORDER ───────────────────────────────────────────────────────────────────────────
//
// Order is the tag set's: the tagger's slots, strongest first, which is the order the topic
// chips show in. A tag the document already had keeps its array `_key`, so the Studio sees the
// same item rather than a removal and an addition. A new tag gets a fresh 12-character key, the
// length the Studio uses.
import {readFileSync, readdirSync} from 'node:fs'
import {randomBytes} from 'node:crypto'
import {arg, mutate, query} from './lab-api.mjs'

const tagsetArg = arg('tagset')
if (typeof tagsetArg !== 'string') throw new Error('Name the tag set: --tagset tagsets/v5.json')
const tagsetFile = new URL(tagsetArg, `file://${process.cwd()}/`)
const tagset = JSON.parse(readFileSync(tagsetFile))
const {dataset} = tagset
const write = arg('write') === true

const ids = tagset.documents.map((d) => d._id)
const draftIds = ids.map((id) => `drafts.${id}`)

// ── read the dataset ──
const current = new Map(
  (
    await query(
      dataset,
      `*[_id in $ids]{_id, _type, _updatedAt, "slug": slug.current, topic}`,
      {ids: [...ids, ...draftIds]},
      'raw',
    )
  ).map((d) => [d._id, d]),
)
const topicScheme = await query(
  dataset,
  `*[_type == "skosConceptScheme" && title == "Topic"][0]{
    _id, "members": array::unique(coalesce(topConcepts[]._ref, []) + coalesce(concepts[]._ref, []))}`,
)
const inTopic = new Set(topicScheme?.members ?? [])
const labels = new Map(
  (await query(dataset, `*[_type == "skosConcept"]{_id, prefLabel}`)).map((c) => [
    c._id,
    c.prefLabel,
  ]),
)

// ── guards 1 and 2 ──
const missingDocs = ids.filter((id) => !current.has(id))
if (missingDocs.length)
  throw new Error(
    `Not published in ${dataset}: ${missingDocs.join(', ')}. Was the tag set made from another dataset?`,
  )
const badConcepts = [
  ...new Set(tagset.documents.flatMap((d) => d.tags.map((t) => t.concept))),
].filter((c) => !labels.has(c) || !inTopic.has(c))
if (badConcepts.length)
  throw new Error(
    `Not published concepts in the Topic scheme: ${badConcepts.map((c) => `${labels.get(c) ?? '(missing)'} ${c}`).join(', ')}`,
  )

// ── the changes ──
const key = () => randomBytes(6).toString('hex')
const show = (topic) => `[${(topic ?? []).map((r) => labels.get(r._ref) ?? r._ref).join(', ')}]`
const refs = (topic) => (topic ?? []).map((r) => r._ref).join(',')

const changes = []
let unchanged = 0
for (const doc of tagset.documents) {
  for (const id of [doc._id, `drafts.${doc._id}`]) {
    const now = current.get(id)
    if (!now) continue // no draft: nothing to keep in step
    const keep = new Map((now.topic ?? []).map((r) => [r._ref, r._key]))
    const topic = doc.tags.map((t) => ({
      _key: keep.get(t.concept) ?? key(),
      _ref: t.concept,
      _type: 'reference',
    }))
    if (refs(now.topic) === refs(topic)) {
      unchanged++
      continue
    }
    const before = new Set((now.topic ?? []).map((r) => r._ref))
    const after = new Set(topic.map((r) => r._ref))
    changes.push({
      id,
      label: `${now._type}:${now.slug ?? doc.slug ?? doc._id}${id.startsWith('drafts.') ? '  (DRAFT)' : ''}`,
      topic,
      from: show(now.topic),
      to: show(topic),
      added: [...after].filter((c) => !before.has(c)).map((c) => labels.get(c)),
      removed: [...before].filter((c) => !after.has(c)).map((c) => labels.get(c) ?? c),
      updatedAt: now._updatedAt,
    })
  }
}

// ── guard 3: a backup that can undo exactly this ──
const backupDir = new URL('./backups/', import.meta.url)
const backups = readdirSync(backupDir)
  .filter((n) => n.startsWith(`tags-${dataset}-`) && n.endsWith('.json'))
  .sort()
const backupName = backups.at(-1)
if (!backupName)
  throw new Error(`No ${dataset} backup in ${backupDir.pathname}; run tags-backup.mjs first.`)
const backup = JSON.parse(readFileSync(new URL(backupName, backupDir)))
const held = new Set(backup.documents.map((d) => d._id))
const notHeld = changes.filter((c) => !held.has(c.id)).map((c) => c.id)
const newer = changes.filter((c) => c.updatedAt > backup.takenAt).map((c) => c.id)
if (notHeld.length || newer.length)
  throw new Error(
    `${backupName} can't undo this write. ` +
      (notHeld.length ? `It doesn't hold: ${notHeld.join(', ')}. ` : '') +
      (newer.length ? `Changed since it was taken: ${newer.join(', ')}. ` : '') +
      'Run tags-backup.mjs again first.',
  )

// ── report ──
const drafts = changes.filter((c) => c.id.startsWith('drafts.'))
const tally = (k) => changes.reduce((n, c) => n + c[k].length, 0)
console.log(`${write ? 'WRITING' : 'Dry run'}: ${tagset.version} from ${tagsetFile.pathname}`)
console.log(`  into ${dataset}; undo with tags-restore.mjs --file backups/${backupName}`)
for (const c of changes) {
  console.log(`  ${c.label}`)
  console.log(`    ${c.from}\n ->   ${c.to}`)
  const delta = [...c.added.map((l) => `+${l}`), ...c.removed.map((l) => `-${l}`)]
  console.log(`    ${delta.length ? delta.join('  ') : '(same tags, new order)'}`)
}
console.log(
  `  ${changes.length - drafts.length} published and ${drafts.length} draft(s) change; ${unchanged} already match.` +
    ` Tags added ${tally('added')}, removed ${tally('removed')}.`,
)
if (!changes.length) process.exit(0)
if (!write) {
  console.log('  Nothing written. Add --write to apply.')
  process.exit(0)
}

// ── write, then prove it ──
await mutate(
  dataset,
  changes.map((c) => ({patch: {id: c.id, set: {topic: c.topic}}})),
)
const after = new Map(
  (await query(dataset, `*[_id in $ids]{_id, topic}`, {ids: changes.map((c) => c.id)}, 'raw')).map(
    (d) => [d._id, d],
  ),
)
const stillDiffer = changes.filter(
  (c) => JSON.stringify(after.get(c.id)?.topic) !== JSON.stringify(c.topic),
)
if (stillDiffer.length) {
  console.error(
    `  FAILED: ${stillDiffer.length} differ after the write: ${stillDiffer.map((c) => c.id).join(', ')}`,
  )
  process.exit(1)
}
console.log(`  Wrote ${changes.length} document(s) in one transaction, re-read and confirmed.`)
