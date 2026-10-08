import iconUrl from '../web/public/icons/icon.svg?url'

/**
 * Sized 1.5em with a -0.25em margin: the slot is 1em, and react-icons glyphs fill it edge to edge,
 * but a disc reads smaller than the same-sized glyph. The negative margin lets the image overflow
 * the slot evenly, so the navbar layout doesn't shift. 1.5em is an eyeballed value, not derived.
 *
 * The Studio's workspace icon is the site's own icon, imported rather than copied so there is one
 * file to change. `?url` is a Vite import suffix: it yields the built asset's URL, not its markup.
 *
 * Rendered as an <img>, so the SVG's `prefers-color-scheme` rule follows the OS, not the Studio's
 * theme. With the Studio set to light on a dark OS, the dark variant shows. If that ever looks
 * wrong, drop the media query from a Studio-only copy and pick one palette.
 */
export const StudioIcon = () => (
  <img
    src={iconUrl}
    alt=""
    style={{width: '100%', height: '100%', display: 'block'}}
  />
)
