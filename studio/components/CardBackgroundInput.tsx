import {useEffect, useState} from 'react'
import {set, useClient, useFormValue, type StringInputProps} from 'sanity'

/**
 * The input for `bookRef.img.cardBackground`: pick the color beside a book cover on its
 * link-preview card, from the cover's own palette.
 *
 * ── EACH CHIP IS A SMALL COPY OF THE CARD ───────────────────────────────────
 *
 * The field stores a swatch NAME ("dominant", "darkMuted"…), which says nothing on its
 * own, and the plain radio list it replaces asked for a choice made blind. So every
 * option is drawn as the card it would produce: the cover, `object-fit: contain`, on
 * that swatch's color, at the card's 1200/630 shape. That is the same choice
 * `fit: 'contain'` makes in web/src/sanity/image.ts, made here by CSS, so what you see
 * is what gets shared.
 *
 * It matters because a palette color can look right as a chip and wrong beside the
 * cover: SHACL's dominant yellow IS its cover's background, so the cover's edges
 * vanish into it. Showing the pairing is the point.
 *
 * ── REAL RADIO INPUTS, AND NOT BY COLOR ALONE ───────────────────────────────
 *
 * Each chip is a <label> around a native radio with one `name`, so arrow keys move
 * between them and a screen reader announces a radio group, as the default input does.
 * Every option carries its name and hex in text; the color is never the only label.
 * A swatch the palette lacks is disabled and says so.
 *
 * ── NO @sanity/ui, ON PURPOSE ────────────────────────────────────────────────
 *
 * Sanity UI is what a custom input usually uses, and it is not a dependency of this
 * Studio, only of `sanity`. Declaring it was tried and rolled back (2026-10-22): the
 * resolved copy matched `sanity`'s, but pnpm also moved two plugins' copies of it to that
 * version and their `motion` from 13 to 14, unrequested churn for one input. So these
 * are plain elements, themed by the CSS custom properties Sanity UI already sets on the
 * card around every field (`--card-border-color` and the rest), which follow the
 * Studio's light and dark themes without importing anything.
 *
 * If no palette can be read, it falls back to the built-in radio list rather than
 * offering colors it cannot show.
 */

/* The site's queries pin this in web/astro.config.mjs. Matching it means GROQ behaves
   here as it does in the build. */
const API_VERSION = '2026-08-18'

/* CARD_NEUTRAL in web/src/layouts/BaseLayout.astro: the gray an unset choice gets. The
   two packages share no module, so it is repeated. Change both or neither. */
const NEUTRAL = '#e9eaea'

type AssetFacts = {
  url?: string
  palette?: Record<string, {background?: string} | null | undefined>
} | null

export function CardBackgroundInput(props: StringInputProps) {
  const {value, onChange, schemaType, path, readOnly, elementProps} = props

  /* The image object is this field's parent, so its asset is a sibling of this path. */
  const assetRef = useFormValue([...path.slice(0, -1), 'asset', '_ref']) as string | undefined
  const client = useClient({apiVersion: API_VERSION})

  /* undefined while loading; null when the fetch failed or found no asset. */
  const [asset, setAsset] = useState<AssetFacts | undefined>(undefined)

  useEffect(() => {
    if (!assetRef) return
    let current = true
    setAsset(undefined)
    client
      .fetch<AssetFacts>('*[_id == $id][0]{url, "palette": metadata.palette}', {id: assetRef})
      .then((result) => current && setAsset(result ?? null))
      .catch(() => current && setAsset(null))
    /* A replaced cover can answer after its successor; only the current one may land. */
    return () => {
      current = false
    }
  }, [client, assetRef])

  if (!assetRef || asset === null) return props.renderDefault(props)

  const loading = asset === undefined
  const options = (
    (schemaType.options?.list ?? []) as Array<string | {title?: string; value?: string}>
  ).map((item) => (typeof item === 'string' ? {title: item, value: item} : item))

  return (
    <div
      role="radiogroup"
      aria-label={schemaType.title}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(8.5rem, 1fr))',
        gap: '0.5rem',
      }}
    >
      {options.map(({title, value: name}, index) => {
        if (!name) return null
        const color = name === 'neutral' ? NEUTRAL : asset?.palette?.[name]?.background
        const checked = value === name
        const disabled = readOnly || loading || !color
        const isDefault = name === 'neutral' && !value

        return (
          <label
            key={name}
            style={{
              display: 'grid',
              gap: '0.375rem',
              padding: '0.375rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--card-border-color)',
              /* A ring rather than a thicker border, so a selected chip does not grow. */
              boxShadow: checked ? '0 0 0 2px var(--card-focus-ring-color)' : 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: !loading && !color ? 0.5 : 1,
            }}
          >
            <div
              style={{
                aspectRatio: '1200 / 630',
                borderRadius: '0.25rem',
                background: color ?? 'var(--card-muted-bg-color)',
                /* A hairline, so a swatch close to the Studio's own background still has
                   an edge. */
                boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
                overflow: 'hidden',
              }}
            >
              {asset?.url && color && (
                <img
                  src={`${asset.url}?h=160&auto=format`}
                  alt=""
                  style={{width: '100%', height: '100%', objectFit: 'contain', display: 'block'}}
                />
              )}
            </div>
            <span style={{display: 'flex', alignItems: 'center', gap: '0.375rem'}}>
              <input
                type="radio"
                name={path.join('.')}
                value={name}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(set(name))}
                onFocus={elementProps.onFocus}
                onBlur={elementProps.onBlur}
                /* The field's label and "jump to field" both target the first radio. */
                {...(index === 0 ? {id: elementProps.id, ref: elementProps.ref} : {})}
                style={{margin: 0, accentColor: 'var(--card-focus-ring-color)'}}
              />
              <span style={{display: 'grid', lineHeight: 1.25}}>
                <span style={{fontSize: '0.8125rem', color: 'var(--card-fg-color)'}}>
                  {title}
                  {isDefault && ' (default)'}
                </span>
                <span style={{fontSize: '0.75rem', color: 'var(--card-muted-fg-color)'}}>
                  {loading ? 'Loading…' : (color ?? 'Not in this image')}
                </span>
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
