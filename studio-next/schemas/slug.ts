import {defineField} from 'sanity'

/**
 * Title -> slug, and the one slug field every document uses.
 *
 * SIX COPIES BEFORE THIS (2026-08-26) — `article`, `caseStudy`, `client`, `note`,
 * `review` and `singleton` each carried the same inline function, and each would
 * have had to be fixed separately. They differ only in `source`, which is why this
 * takes it as an argument rather than hardcoding `title`.
 *
 * ── APOSTROPHES ARE DELETED, NOT HYPHENATED, AND THE ORDER IS THE POINT ──────
 *
 * The old function replaced only whitespace, so `Gall's Law When Complexity Comes
 * Cheap` slugged to `gall's-law-…` — an apostrophe in a URL path. It is legal
 * (RFC 3986 lists `'` as a sub-delim, so nothing percent-encodes it) which is
 * exactly why it survived unnoticed: nothing errors, the directory is simply named
 * with a quote in it. A curly `’` would be worse, since that is non-ASCII and does
 * need encoding.
 *
 * The obvious fix — collapse every non-alphanumeric run to a hyphen — is WRONG on
 * its own: it turns `Gall's` into `gall-s`, which is worse than the apostrophe. So
 * apostrophes are stripped FIRST, leaving `galls`, and only then does everything
 * else collapse. Three characters are stripped because all three appear inside
 * words: the typewriter `'`, the curly `’` a CMS produces, and the modifier letter
 * `ʼ`. Opening quotes are left to the general rule, where they collapse to a
 * hyphen and then get trimmed as leading or trailing anyway.
 *
 * `it's` and `its` now collide. Accepted: a real collision needs two documents
 * whose titles differ by exactly one apostrophe.
 *
 * ── WHY THE 200 CUT COMES BEFORE THE TRIM ────────────────────────────────────
 *
 * Slicing last could leave a trailing hyphen when the cut lands on one, so the
 * trim runs after the slice and cleans up whatever the cut exposed.
 *
 * ── NOT SHARED WITH web-next, DELIBERATELY ───────────────────────────────────
 *
 * `web-next/src/lib/slug.ts` does nearly the same thing for a different job —
 * heading fragment ids and `?topic=` values, from arbitrary text rather than from a
 * title, with no length cut. A workspace package for ten lines would add build
 * config to both sides to remove a duplication that is only skin deep. The two are
 * kept in step on the ONE rule that matters, which is this one; that file had the
 * same apostrophe bug and was fixed in the same pass.
 *
 * EXISTING SLUGS ARE NOT AFFECTED. This runs when an editor generates a slug, and
 * stored values are never recomputed — so no published URL changes. The one
 * document already carrying an apostrophe has to be re-slugged by hand.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0027\u2019\u02bc]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 200)
    .replace(/^-+|-+$/g, '')
}

/**
 * The slug field.
 *
 * `maxLength` is deliberately absent. `singleton` used to set it to 200 with the
 * comment "will be ignored if slugify is set", which was correct — Sanity applies
 * `maxLength` only to its own default slugifier, so with a custom one it is dead
 * configuration. The 200 cut lives in `slugify` instead, where it actually runs.
 */
export function slugField(source = 'title') {
  return defineField({
    title: 'Slug',
    name: 'slug',
    type: 'slug',
    options: {source, slugify},
  })
}
