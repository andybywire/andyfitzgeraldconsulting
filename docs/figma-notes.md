# Figma notes

Companion to [DESIGN.md](../DESIGN.md). This file holds only the Figma mechanics that **constrain
the design system or explain why the file looks the way it does**. It is not a changelog and not an
inventory — the Figma file is authoritative for its own contents, and an inventory here would go
stale by construction.

Design file: `pPZPGT6EpSaLkoUDK8HMMp`.

## Collections and modes

| Collection | Contents | Modes |
|---|---|---|
| `Primitives` | 24 raw colours | single (`Value`) |
| `Semantic` | 34 colours aliasing primitives | `Light` / `Dark` / `Dark Alt` |
| `Type Scale` | 7 sizes `size/0`–`size/6` + `role/masthead-name` | `Desktop` / `Mobile` |
| `Spacing` | 29 — `space/*`, `rhythm/*`, `card/*`, `chrome/*`, `field/*`, `radius/*`, `border/*`, `quote/*` | `Desktop` / `Mobile` |
| `Grid` | 8 | `Desktop` / `Mobile` |

**Two mode axes are in play and they are not the same axis.** `Type Scale`, `Spacing` and `Grid`
carry **viewport**; `Semantic` carries **theme**. Keeping them on separate collections is what lets a
frame be Mobile without also being Dark. Do not merge them.

**`Semantic` has used three of its four mode slots.** The Professional plan caps a collection at four
modes, and `Light` / `Dark` / `Dark Alt` leaves exactly one. `Dark Alt` is an experiment and one of
the two dark themes is expected to be deleted once chosen — but until then, **a fourth theme cannot
be added without first resolving that**, and no further axis can be folded into this collection.

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

## Counting anything in this file — `findAll` under-reports until the document is warm

**`page.findAll()` returns a partial tree on a cold document, and `await page.loadAsync()` is not
enough to prevent it.** Measured directly: two *identical* tallies inside one script returned **2671
nodes, then 3594** — a 26% undercount on the first pass, after every page had been awaited. The true
figures are 3594 nodes and 2328 semantic-bound paints.

This is not a rounding problem. It silently converts "I found every one" into "I found the ones that
had streamed in," and a single-pass sweep reports a clean result while leaving a quarter of the file
untouched. It is also why `color/accent/text-hover` was recorded here as having **zero** bindings when
it has one.

**Tally until two consecutive passes agree.** Three passes were needed here.

```js
for (const p of figma.root.children) await p.loadAsync()
let prev = null, cur = null
do { prev = cur; cur = tally() } while (!prev || prev.nodes !== cur.nodes)
```

**Treat every count written before this was understood as a floor, not a total** — the hairline
sweep's 206 stroked nodes and the 1,548 bound text paints among them. Nothing built on those numbers
is known to be wrong; the numbers themselves are simply not evidence of completeness.

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

## Semantic colour names — one axis, and the path is not the token

**The 34 semantic roles are grouped by *context*: `page/`, `surface/`, `accent/`, `control/`,
`error/`.** Context is the axis Figma cannot infer for itself. It already filters the picker by
**scope** — a text node is only offered `TEXT_FILL` variables — so grouping by *property*
(`text/`, `border/`, `bg/`) would duplicate work Figma does for free, while leaving the genuinely
ambiguous question unanswered: *which plane is this colour for?*

**Use one axis and only one.** An earlier pass mixed three at the same level — `ground/` and
`surface/` (context), `error/` (state), `icon/` (property) — and it immediately produced two
defects: the surface family scattered across three locations (`ground/surface`,
`surface/bg-muted`, and an ungrouped `surface-hover`), and `surface` living as both a leaf and a
group name. Neither was a mistake in placing any individual token; both followed from the axes
disagreeing. There was also no home for `focus-ring` or `link-strong` under any of the groups.

> **The folder path is a Figma affordance. `codeSyntax` is the contract.**

The path organises the picker; the emitted `var()` is what the codebase consumes, and it **does not
move when tokens are regrouped**. So `color/page/bg` emits `var(--color-bg)`, and `color/accent/band`
emits `var(--color-surface-accent)`. Renaming in the Figma UI leaves `codeSyntax` untouched, which is
what makes reorganising free — the 31-token regroup changed zero emitted names.

**Do not "fix" the divergence.** Fourteen roles now emit something that cannot be derived from their
path, and that is the design, not drift. Deriving the token from the path would either force verbose
CSS (`--color-page-text` for the most-used colour in the system) or freeze the Figma structure
against the codebase. Check `codeSyntax` in Dev Mode; never infer a token name from the layer path.

## `codeSyntax` — what the tokens emit

**Every variable emits `var(--name)`.** Two sweeps settled this: 16 semantic colours had dropped the
`color-` prefix, and 39 tokens emitted a bare `--name` rather than the usage form. Dev Mode presents
`codeSyntax` as *how to use* the token, so the wrapped form is the right one — and these strings are
what gets copied into `variables.css`.

| Layer | Emits |
|---|---|
| colour primitives | `var(--blue-500)`, `var(--neutral-100)`, `var(--white)` |
| semantic colours | `var(--color-<role>)` — **always** the prefix, and **not** the folder path |
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

## Paint bindings — bind the component, and know what escapes

Every component and instance now resolves its colour through the **`Semantic`** collection rather
than through a primitive or a raw hex. That is what a `Dark` mode switches on: a paint bound to
`color/text` flips, a paint bound to the `neutral/900` **primitive does not** (primitives have a
single `Value` mode), and a raw hex certainly does not. The mis-layered half is the dangerous one —
it looks bound, and it is, just to a layer that cannot carry a theme.

**Bind the main component, never the instance.** The leverage is large and consistent: 84 component
edits moved 471 paints; 19 moved 118; 7 moved 230. An instance inherits its component's binding, so
binding instances individually is both redundant and harmful — it converts inheritance into an
override.

> **A locally overridden property does not inherit a component's re-binding.**

This is the load-bearing caveat, and it accounts for every straggler in every sweep. If a node's
fill was ever set by hand, it keeps that binding when the component changes underneath it. The
masthead name `Andy Fitzgerald` is the standing example — hand-overridden across 26 instances, so it
stayed on `neutral/900` while its sibling `Information Architect` propagated from the same component.

**`resetOverrides()` is the trap, not the fix.** It would clear the stale paint override — and the
text override with it, taking every real card title back to `Card Title`. Rebind the fill directly
instead, and assert `characters` before and after.

**Converting a frame to an instance preserves its differences as overrides**, so a conversion carries
old bindings across intact rather than adopting the component's current ones. Expect a tail after any
such conversion.

### What is not a design token

Sweeps must exclude artwork, or they will bind it and read as thorough. Four kinds recur:

- **`VECTOR` nodes** — social icons (`brand / github`, `brand / LinkedIn`)
- **Page-loose frames** — client logos (`client/shoreline`, `client/moz`)
- **`#c4c4c4` placeholder greys** on `Ellipse 1` / `Rectangle 4`
- **Nodes named `fill` / `stroke` / `fill+stroke`** — imported icon geometry, and the same nodes that
  carry the 1.2px strokes the hairline sweep skipped. **Exclude them by property, not by name.**
  Their *stroke weight* is not a design token and never will be. Their *colour* is — `color/page/icon`
  exists for exactly this. Excluding the node wholesale is what left the Search Box magnifier on a
  raw primitive through an entire colour sweep, where it would have stayed black on a dark page.

## Two ways a node stops following its theme

Both were found by chasing a single "stuck" Hero band, and neither is visible by looking at the node.

**1. An explicit mode pin.** `node.explicitVariableModes` pins a subtree to one mode of one
collection, and it **outranks the page**. A node pinned to `Semantic = Light` will never go dark, no
matter what the board is set to — this is a *permanent* stick, not a refresh problem. Eleven existed
here: eight `filter` chip instances, one `filter` component, one nested instance, and one frame
pinned to a **mode id that no longer existed** (`899:0` — a dangling pin, which follows nothing at
all). None were deliberate. The likely cause is Figma's mode dropdown acting on the current
*selection* rather than on the page, which is easy to do by accident and leaves no visible trace.

```js
// audit — run this after any mode work
for (const n of page.findAll(x => x.explicitVariableModes && x.explicitVariableModes[sem.id] !== undefined))
  console.log(n.name, sem.modes.find(m => m.modeId === n.explicitVariableModes[sem.id]))  // undefined => dangling
```

Clear with `node.clearExplicitVariableModeForCollection(collection)`.

**2. A stale baked paint colour.** A `SolidPaint` carries *both* an RGB and a variable binding, and
the RGB is a stored value that does not refresh when the variable changes. Twenty-seven paints here
reported the previous `Dark Alt` accent while their binding resolved to the current one. Read
`paint.color` and you get the stale value; call `variable.resolveForConsumer(node)` and you get the
live one.

> **Do not "fix" this by re-baking.** A paint has one RGB slot and a themed paint has three correct
> values, so re-baking to the current mode only makes it stale for the other two. It also proves the
> baked value cannot be what Figma renders — otherwise modes would never work at all.

Baking still matters at **write** time, which is the rule already recorded under stroke weights:
build the paint with the resolved RGB *first*, then bind, so the file looks right immediately.
`setBoundVariableForPaint` does not do it for you.

## Outstanding

- **`color/accent/text-hover` has exactly one binding** — a `Chip Text` node. Effectively unused, the
  same shape as the old alert pair that sat unused for years. It is the ghost button's hover label in
  principle, but the component spec gives that state `color/accent/bg` instead. Delete it or give it
  the job; do not leave it drifting. (Recorded here as *zero* bindings until a warm re-count — see
  **Counting anything in this file**.)
- **`color/control/hover` has no bindings at all**, though the `filter / Selected=No, State=Hover`
  component exists and DESIGN.md specifies that state's fill as exactly this role. The component is
  drawn but not wired to it. Of the other unbound roles, `error/*` and `page/link-hover` are expected
  — the error state is undesigned and hovers are not drawn statically.
- **45 paints across 10 nodes bind a variable that no longer exists** — `time`, `reception`, `wifi`,
  `fill`, `outline`, on the Components and Mobile pages. iPhone status-bar mockup and imported icon
  geometry, not design tokens.
- **No paint anywhere binds a primitive.** Warm-counted at zero. See Resolved for what the last 15
  turned out to be.
- **One `#f3f3f3` fill on a Desktop board** was never identified. Not in the palette.
- **Tonal hierarchy on accent bands is thin.** Two muted options clear 4.5 — `blue-50` at 4.82 and
  `neutral-200` at 4.70 — but nothing on the boards uses either, so in the file an attribution is
  still separated from its quote by size alone. See DESIGN.md under Accent bands: the earlier
  "nothing blue on the band" reading overstated what was measured.

## Resolved, for reference

**`Search Box` stays hand-built three times, deliberately.** Two Desktop, one Mobile, with no
component behind them. It is the same shape as the `preso card` frames that were converted and the
five hand-built blockquotes before that, so the usual argument applies — but **it is a predictable
pattern that will be worked out in front-end development instead**, and it does not earn more time in
Figma. Its one real cost has already been paid down, below. Don't re-raise this.

**The Case Study testimonial band resolves through `color/accent/band`** like every other accent
band. It was the last one still on `color/accent/bg`, which looked correct only because the two
share a value in `Dark Alt`.

**The last 15 primitive-bound paints were one icon, drawn three times.** Not a scattered tail — every
one was the magnifier inside a `Search Box`, five paints per copy (`fill`, `stroke`, and
`fill+stroke` contributing both a fill and a stroke) across two Desktop boards and one Mobile. They
now bind `color/page/icon`, which aliases `neutral/900` in Light, so the rebinding was a Light no-op
and the glyph themes. **Two Outstanding entries turned out to be the same defect** — "paints on
primitives" and "Search Box is hand-built three times" — which is worth remembering as a pattern: a
duplicated hand-built frame shows up in an audit as N separate findings, and fixing the duplication
is what actually closes them.

**All 434 legacy raw text paints are bound** — `#000000`, `#646464`, `#2b383d`, `#414141` and
`#2b2b2b`, none of which were palette values. Each move was a real visual change rather than a
re-layering, so they were run one colour at a time with the rendered result asserted per paint. Zero
raw text paints remain on any page.

**The `Connect/Work with me` band takes `color/surface`** — confirmed, and the reasoning is recorded
in DESIGN.md under Elevation: a full-bleed band against the tinted ground is a raised plane in
exactly the sense the role names, and needs no border because the viewport edges do the containing.

The `preso card` frames that were hand-built rather than instanced have been converted, which closed
a tax that was being paid on every sweep — sixteen nodes bound by hand for hairlines, then sixteen
again for card titles. **A detached copy of an existing component costs a fixed amount per sweep,
forever**, which is the argument for converting early rather than when it becomes convenient.
