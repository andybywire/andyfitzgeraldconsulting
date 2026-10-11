import iconUri from '../web/scripts/icon-sources/app-icon.svg?inline'

/**
 * The Studio's workspace icon is the site's square app icon, imported rather than copied so there
 * is one drawing to change.
 *
 * ── WHY `?inline`, NOT `?url` ────────────────────────────────────────────────
 *
 * `?inline` is a Vite import suffix that yields a `data:` URI carrying the drawing itself. `?url`
 * yields a path (`/static/app-icon-<hash>.svg`) and that was the first version: it showed in the
 * Studio's own navbar and as a white square in sanity.io's "Studios & Apps" list. Deploying
 * extracts a manifest that stores this component rendered to an HTML string, and the dashboard
 * shows that string from ITS origin, where a relative path points at nothing. A data URI has no
 * origin to resolve against. Read out of `sanity manifest extract`'s output, not inferred.
 *
 * It is the SQUARE master, not the round tab favicon (`public/icons/icon.svg`), on purpose. The
 * Studio sets workspace icons beside rectangular, square-cornered controls, and a disc looked
 * wrong there — and, at 1em, small, because a circle leaves its corners empty. A full-bleed
 * square fills the slot, so it needs no size or margin tricks (an earlier attempt at 1.5em with a
 * negative margin was tried and dropped).
 *
 * `app-icon.svg` is a master under `web/scripts/icon-sources/`, which `make-icons.mjs` reads, so
 * this component reads the same file the site's PNG icons are made from. Its colors are fixed,
 * with no `prefers-color-scheme` rule, so the OS-versus-Studio-theme mismatch the round icon had
 * does not arise.
 */
export const StudioIcon = () => (
  <img src={iconUri} alt="" style={{display: 'block'}} />
)
