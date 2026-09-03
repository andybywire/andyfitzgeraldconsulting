/**
 * Text -> URL-safe slug.
 *
 * Two consumers today and they are deliberately not coupled to each other:
 * `components/prose/headingId.ts` turns an h2 into a fragment id, and the article
 * page turns a topic's prefLabel into a `?topic=` value. They share this function
 * because the transform is the same, NOT because the two slugs have to agree — see
 * the note at the topic call site, where the value has to match a facet index that
 * does not exist yet.
 *
 * ── WHY NFKD FIRST ───────────────────────────────────────────────────────────
 *
 * `[^a-z0-9]` would turn "Café" into "caf-" and "Zoë" into "zo-", dropping the
 * character rather than transliterating it. Decomposing to NFKD splits an accented
 * letter into its base plus a combining mark, so stripping the marks leaves the
 * base letter: "cafe", "zoe". Nothing in the content needs this today — worth 60
 * bytes anyway, because the failure mode is a silently truncated slug rather than
 * an error.
 *
 * The combining range is U+0300–U+036F, Combining Diacritical Marks. That covers
 * Latin; it does not attempt Greek, Cyrillic or CJK, which have no base letter in
 * `a-z` to fall back to and would slug to empty. Callers handle empty.
 *
 * ── APOSTROPHES ARE DELETED, NOT HYPHENATED ──────────────────────────────────
 *
 * Added 2026-08-26, because the general rule alone gets this wrong. Collapsing every
 * non-alphanumeric run to a hyphen turns `Gall's` into `gall-s`, so the real heading
 * `Andy's 2c: Taxonomy and the Headless CMS` was generating the fragment id
 * `andy-s-2-taxonomy-and-the-headless-cms`. Stripping apostrophes FIRST leaves
 * `andys`, and only then does everything else collapse. The ORDER is the whole fix.
 *
 * Three characters, because all three appear inside words: the typewriter quote, the
 * curly one a CMS produces (U+2019), and the modifier letter (U+02BC). Opening
 * quotes are left to the general rule, where they collapse to a hyphen and are then
 * trimmed as leading or trailing anyway.
 *
 * `studio-next/schemas/slug.ts` carries the same rule for document slugs and had the
 * same bug. The two are deliberately NOT one shared module — different jobs,
 * different packages, and a workspace package for ten lines would add build config
 * on both sides to remove a duplication that is only skin deep. They are kept in
 * step on this rule, which is the one that matters.
 *
 * Returns '' for input with no sluggable characters at all. That is a real result,
 * not an error — the caller knows what to substitute.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0027\u2019\u02bc]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
