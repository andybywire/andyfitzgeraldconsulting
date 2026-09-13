/**
 * Shared logic for rendering a recording — the presentation detail page and the feeds.
 *
 * ── PROMOTED OUT OF `Recording.astro` WHEN THE FEEDS NEEDED IT ────────────────
 *
 * `sourceLabelFor` was module-private in that component until 2026-09-13, which was
 * right while the page was its only consumer. `/presentations/feed.xml` and `/feed.xml`
 * are the second and third, and a plain `.ts` module cannot import from an `.astro` one
 * anyway — so the choice was promote or duplicate. A second consumer is this project's
 * stated trigger for promotion.
 *
 * The reasoning below is carried over verbatim in substance, because it is a decision
 * about what `sourceName` MEANS and it outranks either consumer.
 */

export interface RecordingSource {
  url?: string | null
  sourceName?: string | null
}

/**
 * ── WHERE THE LINK GOES, WHEN `sourceName` IS EMPTY ─────────────────────────
 *
 * Decided with Andy 2026-09-11, after the model vet found `sourceName` doing two jobs:
 * half the recordings named the SHOW ("The Informed Life") and half named the PLATFORM
 * ("YouTube"). Both read fine in "Watch on ___", which is why it went unnoticed, but
 * they are different facts and only one of them is a property of the work.
 *
 * So `sourceName` now means the show or channel, and is left EMPTY for a one-off upload
 * that belongs to no publication — which is the honest answer, where "YouTube" pretended
 * the platform was a publisher. The label falls back to this instead.
 *
 * That split is the same argument `recording.ts` makes against `podcastId`: `url`
 * already carries the destination, so the platform is derivable and storing it would be
 * a rendering instruction in the content model.
 *
 * ── ONE NAMED PLATFORM, AND THE HOSTNAME FOR EVERYTHING ELSE ────────────────
 *
 * YouTube is the only platform with content, so it is the only one named. A map of
 * Vimeo, Spotify, SoundCloud and the rest would be a guess at what recordings that do
 * not exist would look like — the objection `recording.ts` already makes to `alsoAt[]`.
 *
 * The fallback is the bare hostname, which reads acceptably ("Watch on vimeo.com") and
 * is never wrong. If it ever looks shabby the fix is a filled-in `sourceName`, which is
 * an editor's decision rather than a code change.
 *
 * Measured 2026-09-13: 4 of 6 recordings leave `sourceName` empty and all four are
 * YouTube, so the fallback is the common path rather than the edge case.
 */
export function sourceLabelFor(recording: RecordingSource): string | null {
  const named = recording.sourceName?.trim()
  if (named) return named
  if (!recording.url) return null
  try {
    const host = new URL(recording.url).hostname.replace(/^www\./, '')
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
      return 'YouTube'
    }
    return host || null
  } catch {
    /* An unparseable URL gets no suffix at all, so the link reads "Watch" — which is
       what it read before this function existed. */
    return null
  }
}

/**
 * The section heading — "Watch the Talk", "Listen to the Interview".
 *
 * ── THE `kind` TEST IS `=== 'video'`, NOT `!== 'audio'`, AND THAT MATTERS ────
 *
 * `Recording.astro` spells this out: `kind` is `audio | video | null`, so testing for
 * one is NOT the complement of testing for the other. A null-kind recording — a document
 * mid-edit, since `kind` is required — must fall to the audio wording rather than pick
 * up the video treatment by default.
 *
 * `genre` falls back to 'Presentation' exactly as `[slug].astro:130` does, so the
 * heading reads "Watch the Presentation" rather than "Watch the null".
 */
export function recordingVerb(kind: string | null): 'Watch' | 'Listen' {
  return kind === 'video' ? 'Watch' : 'Listen'
}

export function recordingHeading(kind: string | null, genre: string | null): string {
  const verb = kind === 'video' ? 'Watch' : 'Listen to'
  return `${verb} the ${genre ?? 'Presentation'}`
}

/**
 * ── THE VIDEO ID IS PARSED HERE, AT BUILD TIME, AND NOT STORED ──────────────
 *
 * `recording.url` holds the watch URL and the front end derives the embed from it. That
 * is the schema's instruction, and its reason is worth keeping in view: storing the id
 * instead would be `article.podcastId` again under a new name — a rendering instruction
 * in the content model, which can only ever build one platform's embed.
 *
 * Build time rather than in the browser, so a URL nobody anticipated costs a missing
 * embed rather than a runtime throw. Returning null is a real branch in both consumers.
 *
 * PROMOTED FROM `Recording.astro` 2026-09-13, on that file's own instruction: it said
 * "inline rather than in lib/, because there is one consumer … if a second consumer
 * appears, that is the trigger to extract it." The feeds are the second consumer.
 *
 * Note it reads `v` via `searchParams`, so a watch URL carrying `&list=…` — one of the
 * four in this dataset does — parses correctly where a regex over the string would not.
 */
export function youtubeId(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    /* youtu.be/ID and /embed/ID both carry the id as the first path segment; the watch
       URL carries it in `v`. Anything else is deliberately unhandled. */
    if (host === 'youtu.be') return parsed.pathname.slice(1).split('/')[0] || null
    if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null
    if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.slice(7).split('/')[0] || null
    return parsed.searchParams.get('v')
  } catch {
    return null
  }
}
