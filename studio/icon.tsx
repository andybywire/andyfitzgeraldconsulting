import iconUrl from '../web/scripts/icon-sources/app-icon.svg?url'

/**
 * The Studio's workspace icon is the site's square app icon, imported rather than copied so there
 * is one drawing to change. `?url` is a Vite import suffix: it yields the built asset's URL, not
 * its markup.
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
  <img src={iconUrl} alt="" style={{width: '1em', height: '1em', display: 'block'}} />
)
