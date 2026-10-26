// Put tag fields back exactly as a backup recorded them.
//
//   pnpm --dir studio exec sanity exec ../docs/recommendations-research/tags-restore.mjs \
//     --with-user-token -- [--file backups/<name>.json] [--id <documentId>] [--write]
//
// A DRY RUN unless --write is given: it prints what would change, by concept label, and touches
// nothing. --id limits it to one document, which is how a restore is tested before it is trusted.
// --file defaults to the newest lab backup and the run says which it chose. Name the file
// explicitly for anything but the most recent round.
//
// ── THE DATASET COMES FROM THE BACKUP, NOT THE COMMAND LINE ──────────────────────────────────
//
// A backup records the dataset it was taken from, and that is the only one it is restored into.
// That way a lab backup can never be written over production-26 by a mistyped flag. Writing to
// production-26 still needs --allow-production on top (lab-api.mjs).
//
// ── EXACT RESTORE: KEYS INCLUDED, AND ABSENCE IS RESTORED TOO ────────────────────────────────
//
// Each field is compared as stored, array `_key`s and order included, and set back to precisely
// that. A field the backup holds as null is UNSET. That is how a restore removes `topicScores`
// the tagger added after the backup was taken. Documents missing from the dataset are reported
// and skipped. Documents the backup never saw are left alone.
//
// After a write it re-reads every document it touched and exits non-zero if any still differs.
// A restore that only claims to have worked is the failure this guards against.
import {readFileSync, readdirSync} from 'node:fs'
import {LAB, arg, mutate, query} from './lab-api.mjs'

const dir = new URL('./backups/', import.meta.url)
const fileArg = arg('file')
const file =
  typeof fileArg === 'string' ? new URL(fileArg, `file://${process.cwd()}/`) : newestLabBackup()
const backup = JSON.parse(readFileSync(file))
const {dataset, fields} = backup
const only = arg('id')
const write = arg('write') === true

function newestLabBackup() {
  const names = readdirSync(dir).filter((n) => n.startsWith(`tags-${LAB}-`) && n.endsWith('.json'))
  if (!names.length)
    throw new Error(`No ${LAB} backup in ${dir.pathname}; run tags-backup.mjs first.`)
  /* The stamp in the name sorts as time, so the last name is the newest. */
  return new URL(names.sort().at(-1), dir)
}

const wanted = backup.documents.filter((d) => only === undefined || d._id === only)
if (only !== undefined && !wanted.length) throw new Error(`${only} is not in ${file.pathname}`)

const ids = wanted.map((d) => d._id)
const current = new Map(
  (await query(dataset, `*[_id in $ids]{_id, ${fields.join(', ')}}`, {ids})).map((d) => [d._id, d]),
)
const labels = new Map(
  (await query(dataset, `*[_type == "skosConcept"]{_id, prefLabel}`)).map((c) => [
    c._id,
    c.prefLabel,
  ]),
)

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const show = (field, value) => {
  if (value == null) return '(none)'
  if (field === 'topic') return `[${value.map((r) => labels.get(r._ref) ?? r._ref).join(', ')}]`
  return Array.isArray(value) ? `${value.length} entries` : JSON.stringify(value)
}

const missing = []
const changes = []
for (const want of wanted) {
  const now = current.get(want._id)
  if (!now) {
    missing.push(want._id)
    continue
  }
  const set = {}
  const unset = []
  const lines = []
  for (const f of fields) {
    if (same(now[f], want[f])) continue
    if (want[f] == null) unset.push(f)
    else set[f] = want[f]
    lines.push(`    ${f}: ${show(f, now[f])} -> ${show(f, want[f])}`)
  }
  if (lines.length) changes.push({doc: want, set, unset, lines})
}

console.log(`${write ? 'RESTORING' : 'Dry run'} from ${file.pathname}`)
console.log(
  `  into ${dataset}; backup taken ${backup.takenAt}; ${wanted.length} document(s) considered`,
)
for (const c of changes)
  console.log(`  ${c.doc._type}:${c.doc.slug ?? c.doc._id}\n${c.lines.join('\n')}`)
if (missing.length) console.log(`  Missing from ${dataset}, skipped: ${missing.join(', ')}`)
console.log(`  ${changes.length} document(s) differ from the backup.`)

if (!changes.length) process.exit(0)

const drafts = await query(
  dataset,
  `*[_id in $ids]._id`,
  {
    ids: changes.map((c) => `drafts.${c.doc._id}`),
  },
  'raw',
)
if (drafts.length) {
  console.log(`  WARNING: these have drafts, which keep their own tags: ${drafts.join(', ')}`)
}

if (!write) {
  console.log('  Nothing written. Add --write to apply.')
  process.exit(0)
}

await mutate(
  dataset,
  changes.map((c) => ({
    patch: {
      id: c.doc._id,
      ...(Object.keys(c.set).length ? {set: c.set} : {}),
      ...(c.unset.length ? {unset: c.unset} : {}),
    },
  })),
)

const after = await query(dataset, `*[_id in $ids]{_id, ${fields.join(', ')}}`, {
  ids: changes.map((c) => c.doc._id),
})
const stillDiffer = changes.filter((c) => {
  const now = after.find((d) => d._id === c.doc._id)
  return fields.some((f) => !same(now?.[f], c.doc[f]))
})
if (stillDiffer.length) {
  console.error(
    `  FAILED: ${stillDiffer.length} still differ: ${stillDiffer.map((c) => c.doc._id).join(', ')}`,
  )
  process.exit(1)
}
console.log(`  Restored ${changes.length} document(s), re-read and confirmed.`)
