/**
 * Andy's profile URLs, in one place.
 *
 * ── EXTRACTED ON THE SECOND CONSUMER, WHICH IS THE PROJECT'S RULE ────────────
 *
 * These lived in `Footer.astro`'s `SOCIAL` array until the contact form's error state
 * needed to link to LinkedIn and Bluesky ("you can reach me on…"). Two consumers is this
 * project's stated trigger for promotion, and a wrong profile URL in one of two places is
 * the kind of thing nobody notices until someone follows it.
 *
 * ── ONLY THE URLs MOVED, AND THAT SPLIT IS THE POINT ─────────────────────────
 *
 * The footer's array also carries each mark's `viewBox`, path data and tuned dash
 * `length`. None of that came with them, because none of it has a second consumer — the
 * error state links in prose and draws no icons. The address is the shared fact; the
 * geometry is the footer's own business, and moving it here would be creating a "shared"
 * module for something exactly one file uses.
 *
 * ── `rel="me"` IS NOT A PROPERTY OF THESE URLs ───────────────────────────────
 *
 * The footer marks its links `rel="me"`, which is an IndieWeb identity claim — "these
 * profiles are the same person as this site" — and it is what a `rel=me` verifier walks.
 * That is a statement the SITE makes once, in its representative markup, not something
 * every mention of a URL repeats. So consumers add it or not on their own; it is
 * deliberately not encoded here.
 *
 * ── ONE CONSUMER CANNOT IMPORT THIS, AND DUPLICATES TWO OF THEM ─────────────
 *
 * `web-next/server/contact.php` renders a no-JS failure page that links to LinkedIn and
 * Bluesky, and PHP cannot import a TypeScript module. Those two URLs are therefore copied
 * there with a note pointing back here. IF EITHER MOVES, IT MOVES IN BOTH PLACES.
 */

/**
 * Split out because it composes into the profile URL rather than being one. Kept from
 * Footer.astro, where a note recorded it as the one placeholder in that file — it is a
 * real handle now.
 */
const BLUESKY_HANDLE = 'andyfitzgerald.bsky.social'

export const SOCIAL_URLS = {
  gitHub: 'https://github.com/andybywire',
  linkedIn: 'https://www.linkedin.com/in/andyfitzgerald',
  bluesky: `https://bsky.app/profile/${BLUESKY_HANDLE}`,
  medium: 'https://medium.com/@andybywire',
} as const
