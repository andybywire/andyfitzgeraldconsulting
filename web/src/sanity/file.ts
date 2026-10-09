/**
 * File assets from Sanity — the counterpart to `image.ts`, and for the same reason.
 *
 * ── IT EXISTS TO BE A SINGLE PLACE, NOT BECAUSE THE LOGIC IS HARD ────────────
 *
 * Images have one wrapper that every URL passes through, which is what makes moving them
 * to another host a one-line change (`image.ts`, and the note there recording the
 * Cloudflare option that was dropped but kept cheap). Files had NO such place: the
 * presentation page emitted `deck.url` raw, so the same move would have meant editing
 * every call site and hoping none was missed.
 *
 * That matters more for files than for images here, because the deck is the one asset
 * with a real plan to move. CLAUDE.md phase 6: decks get served from the droplet, whose
 * transfer allowance is 500 GiB–4 TB against Sanity's capped 100 GB — and on the Free
 * plan exhausting that quota does not bill, it BLOCKS, which takes every image on the
 * site down until the month resets. When that lands, it lands here.
 *
 * ── `?dl=` IS A CONTENT-DISPOSITION REQUEST, NOT A COSMETIC ──────────────────
 *
 * Without it Sanity's CDN serves a PDF inline and the browser opens it in a tab, which is
 * not what "Download the slides" promises. With it the response carries a download
 * disposition and the filename given, so the file lands in Downloads under a name that
 * means something rather than under its 40-character content hash.
 */

/** The shape `PRESENTATION_DELIVERY_QUERY` projects from a file asset. */
export interface DeckAsset {
  url?: string | null
  originalFilename?: string | null
  size?: number | null
  extension?: string | null
}

/**
 * The download URL for a deck.
 *
 * Returns null when the asset has no URL, so a caller renders no link rather than one
 * pointing at `null?dl=…`. The filename falls back rather than being asserted: it is
 * optional on the asset document, and a missing one should still download.
 *
 * ── THE FILENAME IS ENCODED, BECAUSE IT IS UNTRUSTED TEXT IN A QUERY STRING ──
 *
 * It went in raw until 2026-10-08, when the HTML validator reported a space in the href
 * on all six decks: `?dl=Orchestrating the Mundane.pdf` is not a valid URL. For spaces
 * that was cosmetic — a browser encodes them before sending, so the request was
 * byte-identical either way (measured). The real exposure was the characters it does
 * NOT fix for you: a `#` in a filename would cut the query off as a fragment, and an `&`
 * or `+` would split or alter it. `originalFilename` is whatever the uploader's file was
 * called, so this is the one place it can be made safe.
 *
 * Sanity echoes the name back percent-encoded — `filename="Orchestrating%20the%20Mundane.pdf"`
 * — with or without this change. How a browser turns that into a saved name is its own
 * business, and untouched here.
 */
export function deckUrl(deck: DeckAsset | null | undefined): string | null {
  if (!deck?.url) return null
  return `${deck.url}?dl=${encodeURIComponent(deck.originalFilename ?? 'presentation.pdf')}`
}

/**
 * A deck's size for display — "7.9 MB".
 *
 * ── MB, DECIMAL, ONE DECIMAL PLACE ──────────────────────────────────────────
 *
 * 1000-based rather than 1024-based, matching what every operating system's download UI
 * shows: a visitor comparing this number to what their browser reports should see the
 * same figure. `size` is already projected by the delivery query and was previously
 * unused, so this costs no extra data.
 *
 * The point of showing it at all is that a deck is a heavy, deliberate download and the
 * weight belongs next to the link rather than being discovered after the click.
 */
export function deckSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null
  const mb = bytes / 1_000_000
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}
