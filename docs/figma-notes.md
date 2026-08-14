# Figma notes

Companion to [DESIGN.md](../DESIGN.md). This file holds only the Figma mechanics that **constrain
the design system or explain why the file looks the way it does**. It is not a changelog and not an
inventory — the Figma file is authoritative for its own contents, and an inventory here would go
stale by construction.

Design file: `pPZPGT6EpSaLkoUDK8HMMp`.

## Collections and modes

| Collection | Contents | Modes |
|---|---|---|
| `Primitives` | 21 raw colours | single (`Value`) |
| `Semantic` | 28 colours aliasing primitives | single (`Light`) |
| `Type Scale` | 7 sizes `size/0`–`size/6` + `role/masthead-name` | `Desktop` / `Mobile` |
| `Spacing` | 29 — `space/*`, `rhythm/*`, `card/*`, `chrome/*`, `field/*`, `radius/*`, `border/*`, `quote/*` | `Desktop` / `Mobile` |
| `Grid` | 8 | `Desktop` / `Mobile` |

**Two mode axes are in play and they are not the same axis.** `Type Scale`, `Spacing` and `Grid`
carry **viewport**; `Semantic` will carry **theme** once `Dark` joins `Light`. Keeping them on
separate collections is what lets a frame be Mobile without also being Dark. Do not merge them.

**One viewport axis across three collections** — all three use the same `Desktop` / `Mobile` names,
so "set this frame to Mobile" is a single consistent action. A mode in one collection and a
differently-named variable in another is the trap this avoids.

**Never mint `*-mobile` twins in Figma.** The viewport is a mode, and a token whose name encodes a
viewport cannot participate in a mode switch. (DESIGN.md's front matter *does* carry `-mobile`
keys — that is a flat-file artifact, since the DESIGN.md format has no mode concept. The rule still
holds here.)

**`Spacing` keeps both layers in one collection, distinguished by prefix.** Colour splits its layers
across `Primitives` and `Semantic`; spacing does not, because 29 variables do not justify two more
collections and the prefixes already make the layer legible in the picker. Splitting later is a
rename, not a rebuild.

## Scoping does real work

**`space/*` and `rhythm/*` are scoped `GAP` only — never `WIDTH_HEIGHT`.** That is *grid owns
horizontal* made structural: Figma will not offer a rhythm token where a width belongs. It earned
its keep when the contact form's 48px input height turned out to be exactly `space/5` — because
Figma refused to offer it as a height, the gap surfaced as **a missing role** (`field/height`)
rather than being quietly bound to a spacing token that means something else.

The enforcement is one-directional. A horizontal *gap* is still a gap, so Figma will happily offer
a `rhythm/*` token for one. *Grid owns horizontal* is structural for **widths** only; for gaps it is
a rule you keep by hand.

## Three things Figma cannot represent

These are the reasons the two systems diverge, and each one is load-bearing.

1. **Figma cannot express `clamp()`.** The two modes hold the endpoints — `Desktop` is the 1200px
   end, `Mobile` the 375px floor — and the interpolation lives in CSS as one fluid token.

2. **A `lineHeight` variable is always pixels.** Bind a variable holding `1.25` and Figma renders a
   **1.25px** line box. There is no way to hold leading as a ratio, which means **leading cannot be
   made mode-aware** the way `fontSize` is. This is the direct cause of the open mobile-prose-leading
   question in DESIGN.md.

3. **`layoutMode` cannot be overridden on an instance** — the assignment silently no-ops, and
   `minWidth`/`maxWidth` throw outright. So **a component whose mobile form changes layout direction
   or nesting cannot be handled by a mode, however well bound it is. It needs a variant.** That is
   why `Top Bar`, `Topics`, `Footer` and `note card` carry `Viewport = Desktop | Mobile`.

**The variant sets are a drawing device for the spec, not architecture.** Astro still gets one
`<Header>`, one `<Topics>`, one `<Footer>` — direction, background, alignment, column count and the
card outline are all media queries.

## Text styles

**One set, viewport-agnostic — no `Desktop/` or `Mobile/` prefix.** Each binds `fontSize` to its
`size/N` variable, so setting a frame's `Type Scale` mode to `Mobile` resizes everything inside it.
Where a role occupies a *different step* per viewport it binds a `role/*` alias instead;
`Masthead/Name` is the only case.

**Leading and tracking are percentages, not px** — CSS unitless `line-height` is exactly a
percentage of font size, so `1.8` → `180%` and `-0.015em` → `-1.5%`. Because they are size-relative
they need no per-mode values, which is why only the sizes are mode-aware.

**Overriding any text-style property severs the style link and takes its variable bindings with
it.** If a node needs a property the style does not carry, its `fontSize` binding has to be re-set
directly on the node afterwards. This is affordable for one node and not for prose — see the
mobile-leading open question.

**`Caption` is roman in Figma and italic on the site.** Figma's `Noto Serif` ships 72 styles and not
one italic, and there is no separate `Noto Serif Italic` family; the repo's `.woff2` cannot be
installed, so closing the gap needs the TTF from Google Fonts. The style's description carries this
caveat so the roman is not mistaken for an intention.

## Why some things are drawn oddly — don't "fix" them

- **Focus rings are two absolutely-positioned rectangles, not a shadow.** Figma accepts drop-shadow
  `spread`, reports it back, and grows `absoluteRenderBounds` by it — then draws nothing. Anything
  needing a ring or halo has to be real geometry. CSS `box-shadow` handles spread correctly, so this
  is a drawing limitation, not a design constraint.
- **Focus ring radii are raw, with the derivation in the layer name** (`focus ring outer — 6+4`).
  Figma has no `calc()`, so binding them to a token would freeze the arithmetic and hide the
  dependency. Moving the chip from radius 5 to 6 required its rings to move 7 → 8 and 9 → 10 to stay
  concentric, and nothing but that name will tell the next person.
- **`Note list — 348 outdent (span-4 + 2x card/pad)`** — same device. 348 is the one number Figma
  cannot derive. If `card/pad` changes, the CSS follows automatically and Figma does not; the frame
  name is the tripwire.
- **The Insights masonry is faked** — three column-major stacks. The front end builds it for real, so
  **the card order on the board is not a specification**; only the column width, gutter and card
  rhythm are.

**Prefer a layer name for a derived number and a Dev Mode annotation for intent.** A layer name sits
where the number would be edited; annotations are the right home for what no property can express —
scroll behaviour, what is deliberately absent at a viewport, what is a mockup artefact.
`node.annotations` is readable through the plugin API, so they reach tooling too.

## `codeSyntax` — what the tokens emit

**Every one of the 94 variables emits `var(--name)`.** Two sweeps settled this: 16 semantic colours
had dropped the `color-` prefix, and 39 tokens emitted a bare `--name` rather than the usage form.
Dev Mode presents `codeSyntax` as *how to use* the token, so the wrapped form is the right one — and
these strings are what gets copied into `variables.css`.

| Layer | Emits |
|---|---|
| colour primitives | `var(--blue-500)`, `var(--neutral-100)`, `var(--white)` |
| semantic colours | `var(--color-<name>)` — **always** the prefix |
| type sizes | `var(--font-size-N)`, plus `var(--role-masthead-name)` |
| spacing and grid | `var(--<prefix>-<name>)` — `var(--rhythm-band)`, `var(--grid-margin)` |

**`white` is a full primitive** with its own custom property, rather than a value inlined by the
four semantic roles that alias it.

**Border widths emit `--border-width-*`, not `--border-*`.** That is deliberate: `color/border-quote`
emits `var(--color-border-quote)` and `border/quote` emits `var(--border-width-quote)`, so the quote
bar's colour and its width cannot collide. Naming the colour by its nearest siblings would have
produced `--border-quote` for both.

`codeSyntax` is read-only as a property — `variable.codeSyntax = {…}` throws *"no setter for
property"*. Use `variable.setVariableCodeSyntax('WEB', '--name')`.

## Stroke weights

**`border/hairline` is bound on every UI boundary** — all 206 nodes carrying a 1px stroke. The
leverage came from binding **components only, never instances**: 46 bindings on the Components page
propagated to 186 nodes across the boards, because an instance inherits its main component's
binding. The remaining 20 were non-instance frames bound directly.

**`setBoundVariable('strokeWeight', v)` fans out to the four side keys.** It writes
`strokeTopWeight`, `strokeRightWeight`, `strokeBottomWeight` and `strokeLeftWeight` — there is **no
`boundVariables.strokeWeight`** to read back. Checking for that key reports a clean write as a total
failure, which is exactly what it did here. Same species as `boundVariables.fontSize` being an
array: the read shape does not match the write shape. Verify with:

```js
const SIDES = ['strokeTopWeight','strokeRightWeight','strokeBottomWeight','strokeLeftWeight']
const ok = SIDES.every(s => n.boundVariables[s] && n.boundVariables[s].id === hairline.id)
```

**Three things at weight 1 were deliberately not swept**, and the distinction matters:

- **Focus rings sit at weight 2**, and their radii are derived from the control — see above.
- **The blockquote's other three sides are 0**; only `strokeLeftWeight` carries the bar, bound to
  `border/quote`.
- **~116 nodes at 1.2px named `stroke` / `fill+stroke`** are imported icon vector geometry, not UI
  boundaries. A hairline token has nothing to say about them. If icon stroke weight ever needs
  systematising it wants its own token, not this one.

**An image outline counts as a hairline.** `image 51` was the one judgement call — a `RECTANGLE`
rather than a card, panel, chip or input — and it takes `border/hairline` for the weight and
`color/border` for the stroke, like any other boundary. It is the only image on its page with a
stroke at all, and it carries `cornerRadius: 0` where its neighbours take `radius/2`.

## Outstanding

- **Sixteen `preso card` frames are hand-built, not instances** — eight on Desktop, eight on Mobile,
  sitting alongside a real five-variant `preso card` component whose instances are used elsewhere on
  the same boards. They are bound now, but binding does not stop them drifting from the component.
  This is the same failure the five hand-built blockquotes had before the component existed.
- **`Search Box` is hand-built three times** (two Desktop, one Mobile) with no component behind it.
