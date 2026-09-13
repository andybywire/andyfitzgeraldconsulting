/**
 * Labels a presentation page and its feed entry both need, derived from genre.
 *
 * Extracted immediately rather than inlined, which is the opposite of what
 * `Recording.astro` did with `youtubeId` — and for the stated reason. That note's rule is
 * "one consumer, keep it inline; a second consumer is the trigger to extract". This has
 * two the moment it exists: the detail template and the feed synthesize the same heading,
 * and a heading that says one thing on the page and another in a subscriber's reader is
 * exactly the drift a shared module prevents.
 */

/**
 * "Talk Highlights", "Keynote Highlights", "Panel Highlights".
 *
 * ── THE HEADING FOLLOWS GENRE; THE FRAGMENT ID DOES NOT ──────────────────────
 *
 * Andy, 2026-09-13: every genre was getting "Presentation Highlights", which is the
 * generic name for the type rather than the name of the thing on the page.
 *
 * The id stays `presentation-highlights` regardless, and that is deliberate rather than
 * an oversight. `presentations/[slug].astro` already argues this case at length for the
 * recording anchors: a fragment is an address, and an address that changes is a broken
 * link. A genre-derived id would rename `#presentation-highlights` to `#keynote-highlights`
 * the day an editor reclassifies a Talk — silently breaking anything anyone had shared,
 * for a purely cosmetic gain. So the visible text tracks the content and the address does
 * not.
 *
 * Note the FEED's copy of this heading does get a genre-derived id, because `headingId`
 * slugifies whatever text it is given. That is harmless — nothing links into a feed entry
 * by fragment — but it means the two ids differ, and the page's is the addressable one.
 *
 * ── EVERY GENRE IS EXERCISED, AND THAT CHANGED WHILE THIS WAS BEING WRITTEN ──
 *
 * Worth recording as a measurement, not as a rule, because it moved inside one session.
 *
 * A first pass measured nine presentations, five with highlights — Workshop, Panel, Talk,
 * Talk, Keynote — and NO interview, which matched `[slug].astro`'s section table calling
 * highlights "absent on an Interview". This comment said the Interview branch was
 * unreachable.
 *
 * It was wrong within the hour. Re-measured 2026-09-13 after the build surfaced an
 * "Interview Highlights" heading nobody expected: **ten** presentations, six with
 * highlights, and `knowledge-graphs-and-ia` is an Interview that carries them. Andy is
 * publishing into `production-26` while this is built — `docs/feeds-kickoff.md` opens by
 * warning that the corpus moves under you — so all five genres are live.
 *
 * The lesson is the general one rather than the document: a count in a comment is a
 * reading, dated, and a branch justified by "no content does this yet" is a branch waiting
 * to be wrong.
 *
 * The null fallback preserves the previous wording exactly, so a document mid-edit with no
 * genre reads "Presentation Highlights" rather than "null Highlights".
 */
export function highlightsHeading(genre: string | null): string {
  return `${genre ?? 'Presentation'} Highlights`
}
