# Colour — decisions and rationale

Backs the **Colors** and **Elevation & Depth** sections of [DESIGN.md](../../DESIGN.md).

Read this when a colour decision is being **questioned, excepted, or changed** — not as background
for ordinary work. DESIGN.md carries the values and the rules; this carries why they are what they
are, so the same ground does not get re-argued.

---

## The accent is `blue-500` `#326e85`, and the ramp is numbered for it

**It is the lightest step in this hue that carries white text at AA — 5.67.** That single constraint
set the palette. The previous brand blue `#4e9dbc` reached only 3.09 under white and could never be a
button, a band, or a link colour; it survives in the ramp as `blue-300`.

**Step numbers do not track lightness.** `500` sits at L 36%, where most ramps put it near 52%. The
trade was deliberate: the number a person reaches for first should be the primary. The cost is that
`blue-500` reads like a mid-tone in a picker and is not one.

**The gap between `blue-200` (L 78%) and `blue-300` (L 52%) is deliberate.** The ramp is dense at the
dark end where every step is a legal text or surface colour, and sparse in the middle where nothing
needed a value. Dark mode later found a use for that gap — see `blue-250` below.

**`blue-300` and `blue-400` have almost no legal use on light** — 2.92 and 3.91 on the ground, so 300
fails even the 3:1 large-text threshold. Both were kept because dark mode would want mid-tones, which
turned out to be correct: `blue-300` is the dark theme's accent.

---

## Six text roles, and the two pairs that share a value

| Role | Light | Use |
|---|---|---|
| `text` | `neutral-900` | body prose, and anything with no reason to differ |
| `text-heading` | `neutral-800` | document headings, h1–h3 |
| `text-title` | `neutral-800` | block-level link titles — card titles, list headings |
| `text-muted` | `neutral-700` | captions, labels, metadata — apparatus around the content |
| `text-lead` | `neutral-700` | the lead paragraph |
| `text-on-accent` | `white` | on accent bands and accent fills |

**Two pairs share a value on light, and that is why they are separate roles.** They answer to
different things and were expected to diverge: lighten captions and the lead should not follow;
restyle card links and page headings should not follow.

- **`text-lead` / `text-muted` diverged, as intended.** In dark they sit two steps apart —
  `neutral-300` against `neutral-500`. Light's compressed top end could not separate them without
  making one too pale; dark has the room.
- **`text-heading` / `text-title` did not, and correctly so.** Card titles are identified as links by
  position, which is theme-independent. No reason to split has been found.

**The collision is a live hazard.** Two roles that render identically are unpickable by eye, and this
has already produced wrong bindings in Figma — lead paragraphs bound to `text-muted`, invisible until
dark mode pulled them apart. **Pick by name, never by value.**

**`text-lead` is content, not apparatus.** The lead is the most prominent prose on the page; a caption
is furniture around it. The trade worth knowing: the lead ends up **larger but lighter** than body, so
size and colour point in opposite directions. Size wins. This is a common editorial pattern but a
deliberate choice rather than a neutral one.

---

## Roles are named for the quality, not the position

This has been got wrong three times and corrected three times, which makes it a pattern rather than
an incident:

| Was | Became | Why |
|---|---|---|
| `Eyebrow` | `Label` | named for where it sat, not what it was |
| `rhythm/pair` | `rhythm/tight` | ditto |
| `text-page-title` | `text-heading` | would have been wrong the moment it landed on an h2 — 45 of its 68 nodes are section headings |
| `*-inverse` | `*-on-accent` | see below |

**Superseded: `text-inverse`, `icon-inverse`, `border-inverse`.** "Inverse" claims a *direction* — the
opposite of the default text colour. True on light, where `text` is near-black and the band carries
white. False on dark, where `text` is already light. `-on-accent` names the **pairing**, which is the
same in every theme, and it is what made the dark theme expressible at all: `text-inverse:
neutral-900` is a contradiction, `text-on-accent: neutral-900` is a fact about that theme's band.

---

## Links are identified by underline, not by colour

**Inline links take body text colour with a persistent underline**, moving to `link-hover` on hover.
Because the underline rather than the colour carries the affordance, this satisfies WCAG 1.4.1, which
a coloured-text link does not.

**Block-level link titles take `text-title` with no underline.** 1.4.1 governs links being
distinguishable *from surrounding text*, which is an inline problem; a title in its own block at
heading size is identified as a link by position. Dark titles also quiet the page down and pass on
both surfaces at any size, which coloured titles did not.

---

## The dark theme inverts the accent

### Contrast is non-linear, so a mirrored ramp gives unmirrored ratios

**This governs every dark value.** Near white, large lightness differences produce small ratios; near
black, small differences produce large ones. Mirror `border` from `neutral-300` to `neutral-700` and
the hairline lands at **2.28** where light sits at 1.48 — half again as loud, with nobody having
chosen that.

**Every mirrored step has to be re-measured. Roughly half land somewhere you would not have picked.**

### The two-surface model does not invert — light was jammed against a ceiling

Light already raises the surface *lighter* than the ground; it manages only 1.045 because `#f9fafb`
has nowhere left to go. Dark keeps the same direction with room to spare. The question was never
whether raised-means-lighter flips, only how much of that room to spend.

**Spending it is expensive, which is why `surface` is `neutral-850` and not `neutral-800`.** In light,
raising a surface is free — `white` is maximum headroom, so a card is the *best* place to put text. In
dark it is the opposite: every step the card lifts costs every ratio on it. `neutral-800` reads as a
more solid card and then fails `link-hover` on it at 4.19, which would have forced a new blue *and*
pushed every text role up a step. `neutral-850` cost one primitive and nothing else.

**The ramp's density was tuned for light — dense at 100–300 — and dark needed the mirror density at
the dark end.** That is the whole reason `neutral-850` exists.

### The accent family inverts, and that is the design

**On light the accent band flips text polarity** — the page is dark-on-light, the band is
light-on-dark. That flip is a large part of what makes a band read as a fundamentally different *kind*
of region rather than a tinted paragraph. A dark theme that keeps light text on both loses it, and the
band degrades into a slightly different dark.

So dark inverts the whole accent family: light blue fills carrying `neutral-900` text.

**Rejected: keeping white text on a darkened band.** This is the obvious first move and it fails
structurally, not aesthetically. A white label pins the fill to `blue-500` or darker (`blue-400` is
only 4.08 under white), and on a near-black page every legal step from there moves *toward* the page —
3.33 → 2.32 → 1.78. **A white-text accent fill on a near-black page has no working interaction ramp at
any values.** Dark text on a light fill has somewhere to go: 6.17 → 16.03 → 18.86.

**Inverting wholesale is also what keeps `text-on-accent` a single role.** Light has exactly one accent
polarity across band, button and chip. A dark theme with two would invent a distinction light does not
have, and force the role to split.

### What dark gave up

**The band's tonal hierarchy is thinner.** `neutral-900` sits at 6.17 on the `blue-300` band and
`neutral-800` at 4.19 — large text only — where light gets two full AA steps. **If a second step is
wanted, `blue-250` `#76b3cb` gives 8.15 and 5.54**, filling the deliberate 200–300 gap.

**Headings no longer sit softer than body.** `text`, `text-heading` and `text-title` all resolve to
`neutral-200`, so *"headings sit one step softer than body"* holds on light (12.25 against 18.04) and
not on dark (15.64 against 15.64). This was a deliberate correction — `neutral-300` headings read too
dim on the dark ground — but it means `text-title`'s justification, *"one lightness step off `text`,
and that difference has to survive a theme change,"* is not true in this theme. **Getting the softening
back needs a step between `200` and `300`, which the ramp does not have.**

### The error set gained a light variant

`error-300` `#e09185` and `error-800` `#341814`, on the existing hue-8° / S-59% recipe. `error-text`
reaches 7.68 on the dark ground and 6.65 on the dark field; `error-line` stays `error-500` in both
themes. The original set measured 1.26 and 1.01 against the accent — it vanished on any dark ground.

---

## Accent bands

Five bands bind `surface-accent`: **Hero, Topics, RSS CTA, Footer, and the Case Study testimonial.**

**`surface-accent` is split from `accent` because one role was doing two jobs.** A full-bleed band and
a button fill have different area and therefore different tolerance for brightness. The split costs
nothing on light — both are `blue-500` — and is what lets the dark band differ from the dark button.

**Changing a band's fill is never a one-property change.** The text on it has to move in the same
breath; dark text on a dark fill fails exactly as surely as blue on blue.

**No blue reaches AA on the dark band, and only the palest reaches it on light.** Against the light
`blue-500` band every step from `blue-300` down measures ≤ 1.87, and only `blue-50` clears 4.5, at
4.82. Against the dark `blue-300` band the best any blue manages is `blue-700` at 3.47 — large text
only.

> **Superseded:** the rule was once recorded as *"nothing blue goes on the accent band — every step
> measures ≤ 1.87."* That overstated what had been measured; it is true of `blue-300` and darker only.
> Treat *no blue on the band* as the working rule, and check the measurement before excepting it.

**Tonal hierarchy on the band is thin in both themes.** Light gets two AA steps beyond white —
`blue-50` at 4.82 and `neutral-200` at 4.70. Dark gets one. Whether the pale end of the ramp is
*wanted* on the band is still open; the contrast question is settled and does not forbid it.

**Superseded:** `Connect/Work with me` was a band on `surface`. It now takes `surface-logo-band`, its
own role — white on light so that client logos carrying their own white backgrounds sit without a
visible edge, falling back to the page ground in dark. **It is a light-theme accommodation only; dark
depends on transparent assets, and the light/dark asset swap belongs in CSS on the front end.**

---

## `border-control` misses WCAG 1.4.11 deliberately, in both themes

`neutral-400` at 1.91 on light, `neutral-700` at 2.28 on dark, where 1.4.11 wants 3:1 on a control
boundary. It was originally specified at `neutral-600` (3.85) precisely to meet that threshold and was
moved for how the chips read. Two places surface it: the unselected chip at rest, and every form input.

**The reason is density, not the individual control.** A chip and a tag are quiet on their own; they
arrive on the page as a *cluster*, and it is their number that makes them loud. A boundary sized to
pass 1.4.11 in isolation is sized wrong for twelve of them on one card.

**Dark mode is where this was tested and re-declined.** The non-linearity offers compliance cheaply
there — the mirror step `neutral-600` lands at 4.00 with no effort — and it was refused on exactly the
density reasoning. **Reproducing light's miss was the choice, not an oversight carried forward.**

If revisited, the compliant values are `neutral-600` (3.85) on light and `neutral-650` `#656e72` (3.09)
on dark, the latter sized as the quietest value that still clears 3:1. **Revisit both together or not
at all** — a threshold met in one theme and missed in the other is the worse outcome.

---

## Depth is tonal, and the border carries the boundary

**There are no shadows.** Depth is tonal layering plus a hairline border, which suits a
typography-driven page where drop shadows would read as imported furniture.

**Ground-to-surface separation is 1.045 on light and 1.17 on dark** — at or near the edge of
perceptibility either way — so a **borderless card would not be distinguishable in either theme**.
Borders are not optional decoration here. Unboxed note cards sit directly on the ground by design and
need no boundary.

A tinted ground is also easier on the eye than pure white for long reading, which is the primary job.

**`surface`, not `card`.** "Surface" names a position in the layering, so one token serves cards,
toggles, panels and overlays, and it scales to a second elevation. Naming it for a component would put
a role name in a slot that should hold a value. A full-bleed band can therefore be a surface.

**The ground's hue is nominal.** `#f9fafb` computes to 210°, not the brand's 197°, and that distinction
is not representable: at 98% lightness the colour spans 2 units of 255 per channel, so both hues
quantize to the same hex. For anyone tempted to fix it — **a perceptibly brand-tinted ground needs
lightness at ~95% or below**, where the channel span widens enough for hue to be encodable.

---

## Standing constraints

- **Success and warning tokens are deliberately omitted.** There is no designed use, and the previous
  palette's alert pair sat declared-but-unused for years. Per WCAG 3.3.1 errors must be identified in
  **text**, never by colour alone.
- **Disabled states are exempt** from 1.4.3 and 1.4.11, and their low contrast *is* the signal. Read
  the guardrail as being about the *pairing*, not about which side the colour sits on — a resting
  control wearing the disabled colour is the precedent this exists to prevent.
- **Verify against four combinations**, not two: ground and card, in each theme.
