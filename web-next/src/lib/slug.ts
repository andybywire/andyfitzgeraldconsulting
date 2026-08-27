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
 * Returns '' for input with no sluggable characters at all. That is a real result,
 * not an error — the caller knows what to substitute.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
