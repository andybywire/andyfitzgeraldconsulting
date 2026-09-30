/**
 * Build the site's icon set from the two masters in icon-sources/.
 *
 * Run by hand, not by the build. The outputs are committed, so this only needs re-running when
 * a master changes. Paths resolve from this file, so it runs from anywhere:
 *
 *   node web/scripts/make-icons.mjs
 *
 * ── WHAT IT WRITES ───────────────────────────────────────────────────────────
 *
 * Every output is under public/.
 *
 *   favicon.svg   →  icons/icon.svg                the tab favicon, comments stripped
 *                 →  favicon.ico                   16 + 32, for clients that skip the HTML
 *                 →  icons/icon_x192.png, _x512    the manifest's `any` icons
 *   app-icon.svg  →  icons/maskable_icon_x512.png  the manifest's `maskable` icon
 *                 →  apple-touch-icon.png          180, older iOS and the root path clients guess
 *
 * The two square icons are ONE drawing, on purpose. For one day they were two, with the letters
 * drawn bigger for iOS alone; but current iOS takes its Home Screen icon from the manifest, so
 * the iOS drawing never reached an iPhone. app-icon.svg records the measurement that showed
 * it, and the Android trade its ×1.15 letters make.
 *
 * Only two files sit at the root, and they are the two paths clients GUESS: feed readers, link
 * previews and bookmark tools ask for `/favicon.ico` and `/apple-touch-icon.png` without reading
 * the page. Everything else is named by our own markup or the manifest, so it keeps the
 * `/icons/` names the live site already used.
 *
 * ── RENDERED AT SIZE, NOT DOWNSCALED ─────────────────────────────────────────
 *
 * Each PNG is rasterized straight from the vectors at its final size, by setting sharp's SVG
 * `density` so the 100-unit viewBox lands on the target width. Antialiasing then happens at the
 * size the icon is seen at. Rendering one big bitmap and shrinking it would resample edges that
 * were already antialiased, which is what makes a 16px icon look soft.
 *
 * sharp rasterizes SVG with librsvg. It was already in the lockfile through Astro, so adding it
 * as a devDependency downloaded nothing.
 *
 * ── THE RASTERS CARRY THE LIGHT COLORS ───────────────────────────────────────
 *
 * favicon.svg's dark version lives in a `prefers-color-scheme` media query, and librsvg does not
 * match it, so every PNG here renders the light colors. That is the right default: a PNG is
 * what a platform uses when it will not run the SVG, and it has no way to ask about the theme.
 * Checked by sampling the disc, not assumed.
 *
 * ── THE ICO IS WRITTEN BY HAND ───────────────────────────────────────────────
 *
 * sharp does not write ICO, and it does not need a library: since Windows Vista an ICO may hold
 * PNG data verbatim. The container is a 6-byte header and one 16-byte directory entry per image,
 * followed by the PNGs themselves.
 *
 * ── THE SQUARE ICONS HAVE NO ALPHA CHANNEL AT ALL ────────────────────────────
 *
 * iOS fills transparent pixels with black. The square master is full-bleed, so every pixel is
 * already opaque, but `removeAlpha()` drops the channel from the file entirely, so no platform is
 * left to decide what an alpha channel means.
 */
import {readFile, writeFile} from 'node:fs/promises'
import sharp from 'sharp'

const SOURCES = new URL('./icon-sources/', import.meta.url)
const PUBLIC = new URL('../public/', import.meta.url)

/* The masters' viewBox width. Density is DPI, and librsvg maps 1 user unit to 1px at 72. */
const VIEWBOX = 100

const favicon = await readFile(new URL('favicon.svg', SOURCES))
const appIcon = await readFile(new URL('app-icon.svg', SOURCES))

const render = (svg, size) => sharp(svg, {density: (72 * size) / VIEWBOX}).resize(size, size)
const png = (svg, size) => render(svg, size).png({compressionLevel: 9}).toBuffer()
const opaquePng = (svg, size) =>
  render(svg, size).removeAlpha().png({compressionLevel: 9}).toBuffer()

/**
 * An ICO container around PNG payloads. Directory entries store width and height in one byte
 * each, with 0 meaning 256 — irrelevant at 16 and 32, but it is what the format says.
 */
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: 1 is an icon, 2 a cursor
  header.writeUInt16LE(images.length, 4)

  let offset = header.length + 16 * images.length
  const entries = images.map(({size, data}) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size % 256, 0) // width
    entry.writeUInt8(size % 256, 1) // height
    entry.writeUInt8(0, 2) // palette size: none
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...images.map(({data}) => data)])
}

const outputs = {
  'icons/icon.svg': Buffer.from(favicon.toString().replace(/\s*<!--[\s\S]*?-->/g, '')),
  'favicon.ico': ico([
    {size: 16, data: await png(favicon, 16)},
    {size: 32, data: await png(favicon, 32)},
  ]),
  'icons/icon_x192.png': await png(favicon, 192),
  'icons/icon_x512.png': await png(favicon, 512),
  'icons/maskable_icon_x512.png': await opaquePng(appIcon, 512),
  'apple-touch-icon.png': await opaquePng(appIcon, 180),
}

for (const [path, data] of Object.entries(outputs)) {
  await writeFile(new URL(path, PUBLIC), data)
  console.log(`${String(data.length).padStart(7)} B  public/${path}`)
}
