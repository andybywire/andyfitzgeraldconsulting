import {createImageUrlBuilder} from '@sanity/image-url'
import {PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET} from 'astro:env/client'

/**
 * Sanity image URLs, built at request time and never through Astro's asset
 * pipeline — see CLAUDE.md → Images. Build-time optimization would download and
 * process every image on every CI run against a cold cache and inflate the deploy
 * tar; serving Sanity URLs means the build never fetches an image at all.
 *
 * The cost is that Astro no longer generates `srcset`, so this module is that
 * arithmetic. It renders nothing: components import from here.
 *
 * ── THE BUILDER TAKES A CONFIG, NOT A CLIENT ─────────────────────────────────
 *
 * `@sanity/image-url` only needs a projectId and dataset to compose a URL, so this
 * deliberately does NOT import from load-query.ts. Nothing here reads content, so
 * nothing here should be able to: no perspective, no token, no stega. It keeps the
 * one path to content in load-query and leaves this a pure function of its inputs.
 *
 * The NAMED export, not the default: v2 deprecates the default in favour of
 * `createImageUrlBuilder`, and astro check flags it.
 *
 * Host swapping was considered and dropped (2026-08-25). CLAUDE.md floated serving
 * images from a Cloudflare-CNAMEd subdomain for hotlink protection; Andy's call is
 * that it is neither high-impact nor certain enough to spend the phase on. If it
 * comes back, this is still the one place it would go.
 */
const builder = createImageUrlBuilder({
  projectId: PUBLIC_SANITY_PROJECT_ID,
  dataset: PUBLIC_SANITY_DATASET,
})

/**
 * The shape a query must project for any of this to work.
 *
 * ── THE PROJECTION TRAP ──────────────────────────────────────────────────────
 *
 * It has to be the OBJECT, not a URL. A query that projects
 * `"image": image.asset->url` returns a perfectly good URL that renders a
 * perfectly good picture and SILENTLY DISCARDS crop and hotspot — the builder was
 * never involved, so there is nothing to warn you and no error to see. Every
 * framing decision an editor made is thrown away and the page still looks fine.
 *
 * `altText` and `caption` are fields on the image object in this schema rather
 * than on the asset, so they arrive with it.
 *
 * ── EVERY MEMBER IS OPTIONAL, AND THAT IS NOT LAXNESS ────────────────────────
 *
 * TypeGen emits `SanityImageCrop` and `SanityImageHotspot` with all four members
 * optional, because Sanity stores them that way. Declaring them REQUIRED here —
 * which this type did until phase 4 — made the generated types unassignable to it,
 * so the first page to hand a queried image to <SanityImage> failed `astro check`:
 *
 *     Type 'number | undefined' is not assignable to type 'number'.
 *
 * The specimen page hid it by hand-writing its image literals and omitting `crop`
 * altogether. Only the TYPE was ever wrong: every read below already defaults
 * (`crop?.left ?? 0`), so nothing about the arithmetic changes.
 *
 * A CONSUMER MUST DEFAULT TOO. `hotspot.x` is `number | undefined` now, so reading
 * it for an `object-position` needs a fallback rather than an assertion — see
 * SanityHero.
 */
export type SanityImageSource = {
  asset?: {_ref?: string | null} | null
  crop?: {top?: number; bottom?: number; left?: number; right?: number} | null
  hotspot?: {x?: number; y?: number; width?: number; height?: number} | null
  altText?: string | null
  caption?: string | null
}

/**
 * Candidate widths. Not a formula — a ladder chosen to cover the slot widths this
 * layout actually produces (231 rail, 656 prose, 996 content, full bleed) across
 * 1x, 2x and 3x, with roughly even steps so no slot lands far from a rung.
 *
 * Filtered per image and capped, so a small original never offers rungs it cannot
 * fill. See `maxRenderableWidth`.
 */
const LADDER = [320, 480, 640, 768, 1024, 1280, 1536, 1920, 2560]

/**
 * Original pixel dimensions, read straight out of the asset ref.
 *
 * The ref encodes them — `image-<40 hex>-<width>x<height>-<format>`, verified
 * against real data in this dataset — which is the whole reason no metadata query
 * is needed to avoid upscaling. Returns null rather than throwing on a ref that
 * does not match, so a malformed reference degrades to "no srcset" instead of
 * failing a build.
 */
export function parseRef(ref: string | null | undefined) {
  if (!ref) return null
  const match = /^image-[a-f0-9]+-(\d+)x(\d+)-\w+$/.exec(ref)
  if (!match) return null
  return {width: Number(match[1]), height: Number(match[2])}
}

/** `'16/9'` → 1.777…, the width-over-height ratio. Null for anything unparseable. */
export function parseAspect(aspect: string | null | undefined) {
  if (!aspect) return null
  const [w, h] = aspect.split('/').map(Number)
  if (!w || !h) return null
  return w / h
}

/**
 * The widest output that does not upscale, and the maths worth understanding.
 *
 * Two steps, in this order:
 *
 *   1. `crop` removes the outer regions. It is four INSET FRACTIONS of the
 *      original, so the source rectangle is what survives them. Deterministic;
 *      hotspot plays no part.
 *
 *   2. If a target aspect is forced and it differs from the crop's own, the
 *      builder has to throw more away — and THAT is the only situation in which
 *      the hotspot does anything at all. It marks the region that must stay in
 *      frame, so the window slides instead of centring.
 *
 * The cap follows from step 2. A forced aspect can be satisfied by losing width or
 * by losing height, and the limit is whichever runs out first:
 *
 *     no aspect     cropW
 *     aspect a      min(cropW, cropH * a)
 *
 * A concrete case from this dataset: a 2000x3000 portrait asked for 3/1 gives
 * min(2000, 9000) = 2000, so it caps at its own width. The other direction bites —
 * a 2000x500 panorama asked for 3/1 gives min(2000, 1500) = 1500, and offering a
 * 2000w rung there would just buy an upscale of 500px of real detail.
 *
 * ── THIS CAPS WHAT WE ASK FOR, NOT WHAT GETS DISPLAYED ───────────────────────
 *
 * Worth stating because the two are easy to conflate, and a component may well
 * WANT to render past this number.
 *
 * Asking Sanity for a width above the cap means paying for an upscale: a larger
 * file carrying no more information than the smaller one. That is the waste this
 * prevents. Letting the BROWSER stretch the largest real file to fill its box
 * costs nothing extra — same bytes, same detail, bigger box.
 *
 * So a full-bleed element on a screen wider than its source is expected to be
 * soft, and that is the correct trade rather than a bug: full bleed is the design,
 * and sharpness degrades gracefully where the layout could not. See SanityHero.
 */
export function maxRenderableWidth(
  ref: string | null | undefined,
  crop: SanityImageSource['crop'],
  aspect: number | null,
  capHeight?: number | null,
) {
  const original = parseRef(ref)
  if (!original) return null
  const cropW = original.width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0))
  const cropH = original.height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0))

  /**
   * A height cap RELAXES this limit, which is worth following. Without one, a
   * forced aspect makes tall output the binding constraint — `cropH * aspect`.
   * With one, every rung asks for a band no taller than the cap, so if the cap
   * already fits inside the crop the height can never be what runs out, and the
   * only limit left is the source's own width.
   */
  const heightNeverBinds = capHeight != null && capHeight <= cropH
  const limit = aspect && !heightNeverBinds ? Math.min(cropW, cropH * aspect) : cropW
  return {width: Math.floor(limit), sourceAspect: cropW / cropH}
}

/**
 * `object-position` for an image whose BOX is a different shape from its file —
 * the hotspot, expressed in the coordinate space of what actually gets served.
 *
 * ── THE TWO SPACES ARE NOT THE SAME, AND THAT IS THE WHOLE FUNCTION ──────────
 *
 * A hotspot is stored as fractions of the ORIGINAL asset. The file the builder
 * returns has already had the editor's crop applied, so its left edge is
 * `crop.left` of the way into the original and its width is `1 - left - right` of
 * it. Reading `hotspot.x` straight into a percentage therefore aims at the wrong
 * place by however much the crop removed:
 *
 *     fx = (hotspot.x - crop.left) / (1 - crop.left - crop.right)
 *
 * On the Consulting hero — `crop.left` 0.565, `hotspot.x` 0.781 — the raw value
 * is 78.1% where the correct one is 49.6%. A 28-point error, which at 1:1 puts
 * the subject out of frame entirely.
 *
 * ── IT WAS WRONG IN <SanityHero> FIRST, AND MEASURABLY SO ────────────────────
 *
 * That component computed the percentage inline from the raw hotspot. 6 of the 20
 * heroes carrying a hotspot also carry a non-zero crop (measured against
 * `production-26`, 2026-09-07), so it was live rather than latent — it just never
 * showed, because those crops are modest and their hotspots sit near the centre.
 * `graphcon-2026-themes-takeaways` is the worst of them: `crop.top` 0.212 with
 * `hotspot.y` 0.626 rendered at 62.6% where 52.5% is correct.
 *
 * IT LIVES HERE BECAUSE IT IS THE SAME ARITHMETIC THE CAP DOES. `maxRenderableWidth`
 * already reasons about the crop rectangle, so a second consumer reading crop
 * fractions belongs beside it rather than in whichever component needed it first.
 *
 * ── NULL MEANS "NO OPINION", NOT "CENTRE" ────────────────────────────────────
 *
 * With no hotspot this returns null and the caller emits no custom property, so
 * the stylesheet's own `50% 50%` fallback applies. Two defaults for two different
 * cases, which is the arrangement <SanityHero> already documented: this handles a
 * hotspot that EXISTS with a member missing — which Sanity's schema permits and
 * TypeGen therefore types `number | undefined` — while the CSS handles no hotspot
 * at all. Defaulting per axis keeps a half-populated hotspot useful, since a
 * present `x` can still aim the crop horizontally.
 *
 * CLAMPED, because the two fields are edited independently: moving a crop after
 * setting a hotspot can leave the hotspot outside it, which would otherwise
 * produce an out-of-range percentage. Clamping aims at the nearest edge, which is
 * the closest thing to what the editor meant.
 */
export function focalPoint(image: SanityImageSource): string | null {
  const hotspot = image?.hotspot
  if (!hotspot) return null

  const left = image?.crop?.left ?? 0
  const right = image?.crop?.right ?? 0
  const top = image?.crop?.top ?? 0
  const bottom = image?.crop?.bottom ?? 0

  const spanX = 1 - left - right
  const spanY = 1 - top - bottom
  /* A crop cannot legally remove everything, but the fields are four independent
     numbers — so a zero denominator fails to "no opinion" rather than to NaN%. */
  if (spanX <= 0 || spanY <= 0) return null

  const clamp = (n: number) => Math.min(1, Math.max(0, n))
  const x = clamp(((hotspot.x ?? 0.5) - left) / spanX)
  const y = clamp(((hotspot.y ?? 0.5) - top) / spanY)

  return `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`
}

export type ImageAttrs = {
  src: string
  srcset: string
  width: number
  height: number
}

/**
 * Everything an <img> or a <source> needs, for one aspect ratio.
 *
 * ONE ASPECT RATIO is the important limit. `srcset` varies RESOLUTION, never
 * shape — every candidate in one srcset is the same picture at different sizes. To
 * change the crop by viewport you need a second call and a <picture> with
 * `<source media>`, which is art direction rather than resolution switching. That
 * is the one thing this function cannot be asked to do.
 *
 * `aspect` absent means "keep the source's own shape", which also means the
 * hotspot is inert — correct, because nothing is being discarded for it to
 * protect.
 *
 * ── `capHeight` MAKES THE RUNGS DIFFERENT SHAPES, SO READ THIS FIRST ─────────
 *
 * It caps every rung's height in DEVICE pixels, which means rungs wider than
 * `capHeight * aspect` come back flatter than the ones below them. A srcset is
 * supposed to hold one picture at several sizes, and this bends that.
 *
 * IT IS ONLY SAFE WHERE THE CSS DETERMINES THE BOX WITHOUT REFERENCE TO THE FILE.
 * <SanityHero> qualifies: `aspect-ratio` and `max-block-size` fix its box, and
 * `object-fit: cover` absorbs whichever shape arrives, so a candidate swap on
 * resize cannot move anything. <SanityImage> does NOT qualify — its box comes from
 * the width/height attributes, and one pair cannot describe rungs of differing
 * shapes. Passing this there would reintroduce layout shift.
 *
 * Pass it in DEVICE pixels, and hedge for density: a rung of width w may be
 * serving a w-wide viewport at 1x or a w/2-wide one at 2x, and the second needs
 * twice the height. Capping at the CSS height would be exactly right at 1x and
 * visibly soft on every hi-DPI screen, so the hedge is 2x. That is never softer
 * than no cap at all, because 3x devices are narrow enough that their rungs fall
 * below the cap anyway.
 */
export function imageAttrs(
  image: SanityImageSource,
  {aspect, capHeight}: {aspect?: string | null; capHeight?: number | null} = {},
): ImageAttrs | null {
  const ref = image?.asset?._ref
  const ratio = parseAspect(aspect)
  const cap = ratio ? capHeight : null
  const bounds = maxRenderableWidth(ref, image?.crop, ratio, cap)
  if (!bounds) return null

  const outputAspect = ratio ?? bounds.sourceAspect

  /**
   * Rungs below the cap, then the cap itself. Appending it matters: without it a
   * 1800px-capped image would top out at the 1536 rung and a wider slot would get
   * a browser upscale of 1536 when 1800 real pixels existed.
   */
  const widths = [...LADDER.filter((w) => w < bounds.width), bounds.width]

  /**
   * The height of a given rung — `capHeight` is where the saving comes from.
   *
   * Without it every rung is the full forced aspect, so a full-bleed element whose
   * box has flattened past that aspect fetches a tall picture and crops most of it
   * away in the browser. Measured on a real hero: 64% of the file discarded.
   *
   * With it each rung is already close to the shape its box will have, and the
   * bytes follow. Only legal where the CSS determines the box independently of the
   * file — see the warning on `capHeight` in the options.
   */
  const heightFor = (w: number) => {
    const natural = Math.round(w / ratio!)
    return cap ? Math.min(natural, cap) : natural
  }

  const url = (w: number) => {
    let b = builder.image(image).width(w).auto('format')
    /**
     * Height is what forces the crop, so it is passed ONLY when an aspect was
     * asked for. `fit('crop')` is stated rather than relied on: it is the builder's
     * default once both dimensions are given, and being explicit is what makes the
     * hotspot's involvement legible at the call site.
     *
     * `dpr` is deliberately never set. `w` descriptors plus `sizes` already let the
     * browser account for device density; doing both double-counts it.
     */
    if (ratio) b = b.height(heightFor(w)).fit('crop')
    return b.url()
  }

  const top = widths[widths.length - 1]

  return {
    /**
     * Near-vestigial: every browser this build targets supports `srcset`, so `src`
     * is only reached by something that does not parse it. A middle rung rather
     * than the largest, so that fallback is not also the heaviest download.
     */
    src: url(widths.find((w) => w >= 1024) ?? top),
    srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
    /**
     * The intrinsic pair. Its job is the RATIO, not the size: with `height: auto`
     * in base.css the browser uses these two numbers to reserve the right box
     * before the file arrives, which is what stops the layout shifting.
     */
    width: top,
    height: ratio ? heightFor(top) : Math.round(top / outputAspect),
  }
}
