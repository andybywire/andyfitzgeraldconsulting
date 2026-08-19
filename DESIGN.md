---
version: alpha
name: Andy Fitzgerald Consulting
description: >-
  Typography-driven design system for andyfitzgeraldconsulting.com. Values here are
  the specification for the build; the Figma library (pPZPGT6EpSaLkoUDK8HMMp) is the
  source of truth for colour roles. Desktop values are canonical — see Layout for the
  mobile variants and Typography for the fluid clamps.

colors:
  # ── Primitives ────────────────────────────────────────────────────────────
  # Blue: hue 197° / saturation 45%, stepped by lightness.
  # Step numbers do NOT track lightness — 500 is the accent, at L 36%.
  blue-50: "#e1eff4"
  blue-100: "#c4dee9"
  blue-200: "#aed2e0"
  blue-300: "#4e9dbc"
  blue-400: "#3e86a3"
  blue-500: "#326e85"
  blue-600: "#275568"
  blue-700: "#1f4351"

  # Neutral: derived from #051319 (198°, essentially the brand hue) toward white.
  neutral-900: "#051319"
  neutral-850: "#142329"
  neutral-800: "#283439"
  neutral-700: "#505a5e"
  neutral-600: "#788083"
  neutral-500: "#969c9e"
  neutral-400: "#b4b8ba"
  neutral-300: "#d2d5d6"
  neutral-200: "#e9eaea"
  neutral-100: "#f9fafb"

  # Error: hue 8°, deliberately far from the brand's 197°.
  error-100: "#f9e9e7"
  error-300: "#e09185"
  error-500: "#cc4c38"
  error-600: "#b33f2e"
  error-800: "#341814"

  white: "#ffffff"

  # ── Semantic roles (35) — LIGHT theme; dark is in the Colors table ────────
  # Keys are the emitted CSS custom property: --color-<key>. In Figma the same
  # roles are grouped by context and the folder path does NOT track this name —
  # check codeSyntax, never a layer path. See docs/figma-notes.md.
  #
  # `primary` is a 36th key required by the DESIGN.md format, not a role here.
  # Nothing binds it. Don't bind it, and don't delete it.
  primary: "{colors.blue-500}"

  bg: "{colors.neutral-100}"
  surface: "{colors.white}"
  surface-hover: "{colors.neutral-100}"
  surface-pressed: "{colors.neutral-200}"
  surface-muted: "{colors.neutral-200}"
  surface-accent: "{colors.blue-500}"
  surface-logo-band: "{colors.white}"

  text: "{colors.neutral-900}"
  text-muted: "{colors.neutral-700}"
  text-lead: "{colors.neutral-700}"
  text-title: "{colors.neutral-800}"
  text-heading: "{colors.neutral-800}"
  text-on-accent: "{colors.white}"
  text-on-accent-hover: "{colors.white}"

  icon: "{colors.neutral-900}"
  icon-on-accent: "{colors.white}"

  border: "{colors.neutral-300}"
  border-control: "{colors.neutral-400}"
  border-control-hover: "{colors.blue-500}"
  border-on-accent: "{colors.white}"
  border-quote: "{colors.neutral-300}"

  accent: "{colors.blue-500}"
  accent-hover: "{colors.blue-600}"
  accent-pressed: "{colors.blue-700}"
  link-hover: "{colors.blue-500}"
  link-strong: "{colors.blue-700}"

  control-hover: "{colors.blue-300}"
  control-pressed: "{colors.blue-400}"

  focus-ring: "{colors.blue-500}"
  focus-offset: "{colors.white}"
  disabled-surface: "{colors.neutral-200}"
  disabled-text: "{colors.neutral-500}"

  error-bg: "{colors.error-100}"
  error-line: "{colors.error-500}"
  error-text: "{colors.error-600}"

typography:
  # Desktop sizes. Every step below is fluid — see Typography → the clamp table.
  # Leading is a function of MEASURE, not of size step.
  h1:
    fontFamily: Lato
    fontSize: 2.746582031rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.015em
  h2:
    fontFamily: Lato
    fontSize: 1.7578125rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.015em
  h3:
    fontFamily: Lato
    fontSize: 1.40625rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0em
  h4:
    fontFamily: Lato
    fontSize: 1.125rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.02em
  display:
    fontFamily: Noto Serif
    fontSize: 2.197265625rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0em
  lead:
    fontFamily: Noto Serif
    fontSize: 1.40625rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
  body:
    fontFamily: Noto Serif
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: 0em
  body-compact:
    fontFamily: Noto Serif
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  small:
    fontFamily: Noto Serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  caption:
    fontFamily: Noto Serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
    fontStyle: italic
  label:
    fontFamily: Lato
    fontSize: 1rem
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0.02em
  nav:
    fontFamily: Lato
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  masthead-name:
    fontFamily: Noto Serif
    fontSize: 1.7578125rem
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: 0em
  masthead-role:
    fontFamily: Lato
    fontSize: 1.40625rem
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0em
  chip:
    fontFamily: Lato
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  tag:
    fontFamily: Lato
    fontSize: 0.875rem
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0em

rounded:
  sm: 3px
  md: 6px
  full: 9999px

spacing:
  # ── Primitives — one body line box (32.4px) rounded to 32, then quartered ──
  space-1: 8px
  space-2: 16px
  space-3: 24px
  space-4: 32px
  space-5: 48px
  space-6: 64px
  space-7: 96px

  # ── Page flow ─────────────────────────────────────────────────────────────
  rhythm-tight: "{spacing.space-1}"
  rhythm-heading-close: "{spacing.space-2}"
  rhythm-item: "{spacing.space-2}"
  rhythm-paragraph: "{spacing.space-3}"
  rhythm-list: "{spacing.space-4}"
  rhythm-block: "{spacing.space-5}"
  rhythm-heading-minor: "{spacing.space-5}"
  rhythm-heading-major: "{spacing.space-6}"
  rhythm-band: "{spacing.space-6}"
  rhythm-section: "{spacing.space-7}"

  # ── Component internals ───────────────────────────────────────────────────
  card-gap: "{spacing.space-1}"
  card-pad: "{spacing.space-2}"
  card-media: "{spacing.space-3}"
  chrome-pad-header: "{spacing.space-4}"
  chrome-pad-footer: "{spacing.space-5}"
  chrome-inset: "{spacing.space-5}"
  field-height: "{spacing.space-5}"
  quote-indent: "{spacing.space-5}"
  border-hairline: 1px
  border-quote: 6px

  # ── Grid — 12 columns, 996px content, 222px margins at 1440 ───────────────
  grid-margin: 222px
  grid-gutter: 24px
  grid-gutter-content: 24px
  grid-column: 61px
  grid-skip-1: 109px
  grid-skip-2: 194px
  grid-span-3: 231px
  grid-span-4: 316px

  # ── Mobile variants ───────────────────────────────────────────────────────
  # A flat-file artifact: this format has no mode concept, so a viewport-varying
  # token needs a twin key. In Figma the viewport is a MODE and `*-mobile` twins
  # are forbidden. Only these thirteen vary.
  rhythm-band-mobile: "{spacing.space-4}"
  rhythm-section-mobile: "{spacing.space-6}"
  chrome-inset-mobile: "{spacing.space-2}"
  quote-indent-mobile: "{spacing.space-3}"
  border-quote-mobile: 4px
  grid-margin-mobile: 16px
  grid-gutter-mobile: 8px
  grid-gutter-content-mobile: 32px
  grid-column-mobile: 20px
  grid-skip-1-mobile: 36px
  grid-skip-2-mobile: 64px
  grid-span-3-mobile: 343px
  grid-span-4-mobile: 343px

components:
  # ── Primary button, light ground ──────────────────────────────────────────
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-on-accent}"
    typography: "{typography.nav}"
    rounded: "{rounded.sm}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.text-on-accent}"
  button-primary-pressed:
    backgroundColor: "{colors.accent-pressed}"
    textColor: "{colors.text-on-accent}"
  button-primary-disabled:
    backgroundColor: "{colors.disabled-surface}"
    textColor: "{colors.disabled-text}"

  # ── Primary button, accent band — a ghost that inverts on hover ───────────
  button-ghost:
    backgroundColor: "{colors.accent}"
    borderColor: "{colors.border-on-accent}"
    textColor: "{colors.text-on-accent}"
    typography: "{typography.nav}"
    rounded: "{rounded.sm}"
  button-ghost-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent}"
  button-ghost-pressed:
    backgroundColor: "{colors.surface-pressed}"
    textColor: "{colors.accent-hover}"
  button-ghost-disabled:
    backgroundColor: "{colors.accent}"
    borderColor: "{colors.disabled-text}"
    textColor: "{colors.disabled-text}"

  # ── Filter chip ───────────────────────────────────────────────────────────
  filter-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    borderColor: "{colors.border-control}"
    typography: "{typography.chip}"
    rounded: "{rounded.full}"
  filter-chip-hover:
    backgroundColor: "{colors.control-hover}"
    textColor: "{colors.text}"
    borderColor: "{colors.border-control}"
  filter-chip-pressed:
    backgroundColor: "{colors.control-pressed}"
    textColor: "{colors.text}"
    borderColor: "{colors.border-control}"
  filter-chip-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-on-accent}"
    borderColor: "{colors.accent}"
  filter-chip-selected-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.text-on-accent}"
    borderColor: "{colors.accent-hover}"
  filter-chip-disabled:
    backgroundColor: "{colors.disabled-surface}"
    textColor: "{colors.disabled-text}"
    borderColor: "{colors.border}"

  # ── Tag — a marker, deliberately not a control. No hover, pressed or focus.
  tag:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-muted}"
    typography: "{typography.tag}"
    rounded: "{rounded.sm}"
    padding: "{spacing.space-1}"

  # ── Cards ─────────────────────────────────────────────────────────────────
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: "{spacing.card-pad}"
  card-title:
    textColor: "{colors.text-title}"
  note-card:
    backgroundColor: transparent
    padding: "{spacing.card-pad}"
  note-card-hover:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"

  # ── Input field ───────────────────────────────────────────────────────────
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    borderColor: "{colors.border-control}"
    typography: "{typography.body}"
    height: "{spacing.field-height}"
  input-field-hover:
    borderColor: "{colors.border-control-hover}"
  input-field-error:
    backgroundColor: "{colors.error-bg}"
    borderColor: "{colors.error-line}"
    textColor: "{colors.error-text}"

  # ── Blockquote — an element rule in CSS, not a component ──────────────────
  blockquote:
    borderColor: "{colors.border-quote}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    padding: "{spacing.quote-indent}"

  # ── Focus ring — inner contrasts the control, outer contrasts the surface ─
  focus-ring-on-light:
    borderColor: "{colors.focus-ring}"
  focus-ring-on-accent:
    borderColor: "{colors.focus-offset}"
---

# Design system — andyfitzgeraldconsulting.com

## Overview

Andy Fitzgerald's professional home, re-envisioned as a **digital garden** — still publishing
substantial articles and describing consulting services, reframed from "consultancy website" toward
"engaged professional's digital home."

The surface is **typography-driven and lightly styled**. Long-form reading is the primary job and
everything else is chrome around it: one accent colour, no shadows, no illustration, hierarchy carried
by type, space and a hairline border. **When two options are equally defensible, the quieter one
wins.**

Everything is **hand-authored CSS and HTML** — native nesting, no preprocessor, no utility framework,
no component library. A project goal, not an implementation detail.

**Two layers.** Primitives name *values* (`blue-500`, `space-4`); semantic roles name *uses*
(`accent`, `rhythm-paragraph`). A semantic colour or size is genuinely one value, so it stays a token.
A semantic *text* role is a bundle of applied properties, so in CSS it becomes a rule — `h2 { … }` —
not a variable. **Do not collapse that distinction.**

**Where things live.** The Figma library `pPZPGT6EpSaLkoUDK8HMMp` is the source of truth for colour
roles; this file reflects it and is authoritative for everything else.

- **[docs/decisions/](docs/decisions/)** — why the system is the way it is. Read a record only when a
  decision is being questioned, excepted or changed.
- **[docs/open-questions.md](docs/open-questions.md)** — what is not settled.
- **[docs/figma-notes.md](docs/figma-notes.md)** — Figma mechanics and the constraints they impose.

## Colors

One accent, a neutral ramp derived from it, and an error hue deliberately far from both. Values are
in the front matter; the reasoning is in [docs/decisions/colour.md](docs/decisions/colour.md).

- **Accent `#326e85` (`blue-500`)** — brand surfaces, buttons, link hover. It is the lightest step in
  this hue that carries white text at AA (5.67), and almost everything else follows from that.
- **Neutral `#051319` → `#f9fafb`** — derived from a near-black at 198°, essentially the brand hue.
  Text, borders and both surfaces.
- **Error (hue 8°)** — far enough from 197° that it cannot be mistaken for the accent.

### Text roles

| Role | Use |
|---|---|
| `text` | body prose, and anything with no reason to differ |
| `text-heading` | document headings, h1–h3 |
| `text-title` | block-level link titles — card titles, list headings |
| `text-muted` | captions, labels, metadata — apparatus around the content |
| `text-lead` | the lead paragraph |
| `text-on-accent` | on accent bands and accent fills |

`text-heading`/`text-title` and `text-lead`/`text-muted` share a value on light and stay separate
roles because they diverge in dark.

`icon` and `icon-on-accent` mirror `text` and `text-on-accent`, so an icon beside a label reads as
part of it. **Third-party brand marks are not bound at all** — a client logo is not ours to theme, and
the light/dark asset swap belongs in CSS on the front end.

### Links

**Inline links take body text colour with a persistent underline**, moving to `link-hover` on hover.
The underline rather than the colour carries the affordance, which satisfies WCAG 1.4.1.
**Block-level link titles take `text-title` with no underline** — a title in its own block at heading
size is identified as a link by position.

### Accent bands

Five bands bind `surface-accent`: Hero, Topics, RSS CTA, Footer and the Case Study testimonial.
`Connect/Work with me` takes `surface-logo-band`.

**Changing a band's fill is never a one-property change** — the text on it has to move in the same
breath.

### Dark mode

Light is the default and the one the front matter carries. Figma holds both themes as modes on one
collection, so a component binds a role once and both themes reach it.

**Dark is not twinned into the front matter as `*-dark` keys.** There would be 35 of them, none
referenced by a component, so each would raise an `orphaned-tokens` lint warning and bury the real
ones — and a theme is one CSS override block, where a viewport twin is a real second declaration.
**The table below is authoritative for dark; the front matter is authoritative for light.**

| Role | Light | Dark |
|---|---|---|
| `bg` | `neutral-100` | `neutral-900` |
| `surface` | `white` | `neutral-850` |
| `surface-hover` / `-pressed` / `-muted` | `neutral-100` / `200` / `200` | `neutral-800` / `700` / `800` |
| `surface-accent` | `blue-500` | `blue-300` |
| `surface-logo-band` | `white` | `neutral-900` |
| `text` · `icon` | `neutral-900` | `neutral-200` |
| `text-heading` · `text-title` | `neutral-800` | `neutral-200` |
| `text-lead` | `neutral-700` | `neutral-300` |
| `text-muted` | `neutral-700` | `neutral-500` |
| `text-on-accent` (+`-hover`) · `icon-on-accent` · `border-on-accent` | `white` | `neutral-900` |
| `border` · `border-quote` · `border-control` | `neutral-300` / `300` / `400` | `neutral-700` |
| `border-control-hover` · `focus-ring` · `link-hover` | `blue-500` | `blue-300` |
| `accent` / `-hover` / `-pressed` | `blue-500` / `600` / `700` | `blue-300` / `blue-50` / `white` |
| `link-strong` | `blue-700` | `blue-200` |
| `control-hover` / `-pressed` | `blue-300` / `400` | `blue-700` / `600` |
| `focus-offset` | `white` | `neutral-900` |
| `disabled-surface` / `-text` | `neutral-200` / `500` | `neutral-800` / `600` |
| `error-bg` / `-line` / `-text` | `error-100` / `500` / `600` | `error-800` / `500` / `error-300` |

**Dark is not a mechanical inversion of light, and two of its rules will surprise you.** Contrast is
non-linear, so mirrored steps give unmirrored ratios; and the accent family inverts to dark text on
light fills rather than keeping white text. Both follow from measurement — **read
[the record](docs/decisions/colour.md) before changing a dark value.**

## Typography

Two faces. **Noto Serif** for running prose, leads, captions, pull-quotes and the hero `display`
statement; **Lato** for h1–h4 and all metadata and UI. Reasoning in
[docs/decisions/typography.md](docs/decisions/typography.md).

**Scale: 18px base, ratio 1.25 (major third).** Step 1 is a clamped floor at 16px, off the ratio —
don't add a step below it for reading text. `size/0` (14px) is chrome only. The odd values
(`2.746582031rem`) are exact on purpose; reference them by name and never retype them.

### Fluid sizing — per-step `clamp()`, 375 → 1200px

| Step | Mobile | Desktop | Declaration | rem share @1200 |
|---|---|---|---|---|
| 0 | 14 | 14 | `0.875rem` — static, chrome only | — |
| 1 | 16 | 16 | `1rem` — static; the legibility floor | — |
| 2 | 17 | 18 | `clamp(1.0625rem, 1.0341rem + 0.1212vw, 1.125rem)` | 92% |
| 3 | 21 | 22.5 | `clamp(1.3125rem, 1.2699rem + 0.1818vw, 1.40625rem)` | 90% |
| 4 | 25 | 28.125 | `clamp(1.5625rem, 1.4737rem + 0.3788vw, 1.7578125rem)` | 84% |
| 5 | 30 | 35.15625 | `clamp(1.875rem, 1.7285rem + 0.625vw, 2.197265625rem)` | 79% |
| 6 | 32 | 43.9453125 | `clamp(2rem, 1.6606rem + 1.4479vw, 2.746582031rem)` | 60% |

### Leading — indexed by measure, not by size step

> **Leading pairs with the measure.** The size step is only a *proxy*, and it breaks the moment the
> same step appears at two measures.

| Register | Value | Measure | Roles |
|---|---|---|---|
| prose, short | **1.5** | ~29–33 chars | `small`, `body-compact` |
| prose, medium | **1.6** | ~54 chars | `lead` |
| prose, full | **1.8** | ~67 chars | `body` |
| statement | **1.4** | ~43 chars at 35px | `display` |
| heading | 1.3 / 1.25 / 1.1 | — | h4 and h3 / h2 / h1 |

**The prose ramp is deliberately non-monotonic.** `body` and `body-compact` share a size step and
differ only in leading.

### Tracking — Lato only

| Applied to | Tracking | Roles |
|---|---|---|
| Lato at display sizes (28px+) | **−1.5%** | h1, h2 |
| Lato as a small label | **+2%** | h4, `label` |
| Lato, everything else | 0% | h3, `nav`, `masthead-role`, `chip`, `tag` |
| **Noto Serif, every size** | **0%** | `display`, `lead`, `body`, `small`, `caption` |

**h4 has no size step left** — it differentiates by family + weight + tracking. If it reads as bold
body text the levers are uppercase, small caps, colour or a rule, **not** a smaller size.

### Measure

Target **60–75 characters**; `66ch` measures ~67. On the 996px grid the measure comes from the column
span — 8 of 12 is 656px — and the cap is a safety net for anything wider.

```css
article.detail :where(p, ul, ol, blockquote, figure) { max-width: 66ch; }
```

- Apply to prose elements **and** `figure` — both inherit the body font, so `ch` resolves identically
  and their edges align.
- **Not** on `figcaption`: its 16px font makes `ch` resolve narrower than its own image.
- **Headings need a separate value if capped at all** — `ch` resolves against each element's own font,
  so `66ch` on an h2 is 66 characters of Lato.

## Layout & Spacing

**12 columns, 996px content, 222px margins at 1440.** Detail-page prose is **8 columns = 656px**; the
right rail is one skipped column away. Both ends close exactly, at 1440 and at the 375 floor — don't
nudge the numbers. Grids stretch rather than centre. Reasoning in
[docs/decisions/layout.md](docs/decisions/layout.md).

### Grid owns horizontal, rhythm owns vertical

The rule that decides most spacing questions.

- Column gaps, page margins and the one-column skip come from `grid-*`.
- A wrapped column's *row* gap is vertical, so it is rhythm — `rhythm-heading-major`, because what
  lands below always starts with a heading.
- A component's intrinsic height (`field-height`) is a component internal, like `card-pad`.
- **Not self-enforcing for gaps.** A horizontal gap *is* a gap, so nothing stops a rhythm token being
  used for one. Keep it by hand.

### The skip family

| | Formula | Desktop | Splits it serves |
|---|---|---|---|
| `grid-skip-1` | column + 2 × gutter | 109 | **asymmetric**: 8+3, 7+4 |
| `grid-skip-2` | 2 × column + 3 × gutter | 194 | **6+4** |

**Bind the skips rather than retyping** — 109 and 194 look arbitrary enough to get "corrected." A
12-column grid is generous for asymmetric splits and poor for symmetric ones.

**Two rail relationships, and the gap is the message.** 8 + `skip-1` + 3 reads as a **sidebar**, set
apart from the prose; 8 + `gutter` + 4 reads as a **figure belonging to** the paragraph beside it.

**Pin the narrow column and let the wide one fill** — `996 − 316 − 109 = 571`, computed rather than
typed. This is why `span-3` and `span-4` exist and `span-7`/`span-8` do not. Every span token
collapses to the full content width on mobile.

### Vertical rhythm

Body is 18px at 1.8, so one line box is 32.4px, rounded to **32px = 2rem**. `space-1` … `space-7` are
¼, ½, ¾, 1, 1½, 2 and 3 units — an 8px grid derived from the line box rather than imposed on it.

**Check ratios in apparent space, not token values.** Half-leading means the white above an h2
measures ~81px and below it ~33px — about 2.5:1, not the 4:1 the raw numbers suggest.

### The CSS mechanism — sibling margins, no container

Portable Text emits a flat sequence with no section wrappers, so `gap` cannot express "tighter after a
heading."

```css
article.detail > * + *                                    { margin-top: var(--rhythm-paragraph); }
article.detail > * + :is(ul, ol, blockquote, figure, pre) { margin-top: var(--rhythm-block); }
article.detail > :is(ul, ol, blockquote, figure, pre) + * { margin-top: var(--rhythm-block); }
article.detail > * + h3                                   { margin-top: var(--rhythm-heading-minor); }
article.detail > * + h2                                   { margin-top: var(--rhythm-heading-major); }
article.detail > :is(h2, h3, h4) + *                      { margin-top: var(--rhythm-heading-close); }
```

**Source order decides** — all six have equal specificity, and `heading-close` is last so a heading
binds to whatever follows it. No `margin-bottom` anywhere, so no collapsing. The base rule needs
`:not(.sidebar):not(.banner)` — both are explicitly grid-placed.

### Responsive — split by cause, not by size

**Type-derived spacing does not change; page-derived spacing does.** Only `band`, `section` and
`chrome-inset` vary, and the band roles interpolate with no breakpoint:

```css
--rhythm-band:    clamp(2rem, 1.0909rem + 3.8788vw, 4rem);
--rhythm-section: clamp(4rem, 3.0909rem + 3.8788vw, 6rem);
```

**What the collapse settles on its own:** content goes 996 → 343, every span token collapses so all
four two-column splits stack, both band paddings drop a step, and the Home notes outdent disappears.

**What it does not:** the masthead stacks and the nav moves to a full-bleed accent strip; the hero
moves onto the page ground at 1.25 leading; article cards swap to their **vertical variant** rather
than merely narrowing; and the footer restacks. **Author the footer DOM in mobile order** and place it
with grid, so source order equals reading order at both sizes.

### Outdenting

Note cards sit unboxed at rest, so their text must align with the heading above. On hover the box
appears and bleeds outward:

```css
@media (min-width: 60rem) {
  .home .notes > .note { margin-inline: calc(var(--card-pad) * -1); }
}
```

**Outdent the card, never the column** — widening the column looks like the same fix and drifts a
sibling column off the grid. Scope it deliberately: on mobile the cards go full width with no room to
bleed, and on an index an unboxed card's hover should match the boxed cards beside it, not exceed them.

## Elevation & Depth

**There are no shadows.** Depth is tonal layering plus a hairline border, which suits a
typography-driven page where drop shadows would read as imported furniture.

| Layer | Token | Light | Dark |
|---|---|---|---|
| page ground | `bg` | `#f9fafb` | `#051319` |
| raised surface | `surface` | `#ffffff` | `#142329` |
| boundary | `border` | `#d2d5d6` | `#505a5e` |

**The border carries the card boundary in both themes, not the fill difference.** Ground to surface is
1.045 on light and 1.17 on dark, so a **borderless card would not be distinguishable** in either.
Unboxed note cards sit directly on the ground by design and need no boundary.

**A full-width band can be a surface.** `surface` names a position in the layering, not a component,
so a band at full bleed is a raised plane in exactly the sense the token means. It carries no radius
and no border — the viewport edges do the containing.

## Shapes

The shape language is quiet: small radii, hairline strokes, no ornament. Reasoning in
[docs/decisions/components.md](docs/decisions/components.md).

- **`rounded.sm` (3px)** — the button, and content images taking the tighter corner.
- **`rounded.md` (6px)** — exactly 2 × `sm`. Every card surface, card images and photographs.
- **`rounded.full` (9999px)** — the filter chip only, which is a capsule. Nothing else is fully
  rounded, and the value is arbitrarily large because `border-radius` clamps to half the shorter
  side; it is not a measurement.
- **`border-hairline` (1px)** — cards, panels, chips, inputs; every boundary that is a *line*.
- **`border-quote` (6px desktop / 4px mobile)** — the blockquote bar, a *mark* rather than a boundary,
  and the one stroke that varies by viewport.

**Focus-ring radii derive from the control they wrap** — inner at `radius + 2`, outer at `radius + 4`.
Write it as a real `calc()` so the dependency stays live. On the capsule chip the derivation
degenerates harmlessly: the clamp means a ring around a capsule is a capsule.

**The quote bar sits inside the indent**, so text sits 42px from the bar on desktop and 20 on mobile,
not 48 and 24.

## Components

**Buttons.** The primary button steps `accent` → `accent-hover` → `accent-pressed`.

> **Interaction increases the fill's separation from the page** — 5.42 → 7.77 → 10.15 on light,
> 6.17 → 16.03 → 18.86 on dark. Check the direction against the page, never the previous step.

**The light-ground button has no border.** Only the accent-band ghost takes one, and it takes
`border-on-accent`. On a band the ghost cannot lighten while keeping its label legible, so it inverts:
**outline → solid white → grey**.

**Filter chips.** Rest is a surface with a control border; hover and pressed tint toward the accent;
selected is a filled accent pill. **The chip border is its own role, not the card hairline** — a card
is not a control, a chip is, and form inputs take the same token.

**Tags are markers, deliberately not controls.** No hover, no pressed, no focus — those states don't
exist and shouldn't be added. If tags ever become links they need hover and focus at 4.5.

**Note cards are unboxed at rest on desktop and boxed at rest on mobile, with no hover state on
mobile at all.** Touch devices have no hover, so a permanently-hovered mobile card would encode a
state that cannot occur.

**Blockquote is an element rule in CSS, not a component.** The indent is `padding-inline-start`,
**not margin** — the bar sits at the box edge, so a margin would put the gap outside it.

**The focus ring is stated by relationship, not by fixed colours:**

> **Inner ring contrasts with the control; outer ring contrasts with the surface.**

The same two colours in both contexts, order swapped. In CSS:
`box-shadow: 0 0 0 2px <inner>, 0 0 0 4px <outer>`.

**The page header is one component with an optional lead**, and the boolean is required by the rail
rather than offered as flexibility. **The gap after the header belongs to the parent band**, not the
component, so pages legitimately differ there.

## Do's and Don'ts

The build checklist. Each rule stands on its own; the link is the reasoning, for when a rule is being
questioned rather than followed.

**Colour** — [record](docs/decisions/colour.md)

- **Don't** infer lightness from a colour step number — `blue-500` is the accent at L 36%.
- **Do** verify novel pairings against **four combinations**: ground and card, in each theme.
- **Don't** carry a light rule of thumb into dark. *"`blue-500` or darker always passes"* is true on
  light and **false on dark**, where `blue-500` reaches 3.33 on the ground and `neutral-700` is the
  border.
- **Don't** put blue on an accent band in either theme without measuring. On light only `blue-50`
  clears AA; on dark nothing blue does.
- **Don't** use `neutral-600` for text on light — its one sanctioned light job is a control boundary.
  In dark it is `disabled-text`, where low contrast is the point.
- **Do** pick a colour role by name, never by value — two pairs render identically on light and have
  already produced wrong bindings.
- **Don't** treat the disabled states' low contrast as a bug. Disabled is exempt (WCAG 1.4.3, 1.4.11)
  and the low contrast *is* the signal — but read the guardrail as being about the *pairing*, not
  which side the colour sits on.
- **Do** identify errors in text, never by colour alone (WCAG 3.3.1).
- **Don't** add success or warning colours until a state is actually designed.

**Typography** — [record](docs/decisions/typography.md)

- **Do** index leading by measure. **Don't** "fix" the non-monotonic prose ramp, and don't merge
  `body` and `body-compact` because they share a size step.
- **Don't** reach for `body-compact` for running prose — only for a column too narrow for `body`.
- **Do** keep every `clamp()` preferred value `rem`-dominant, ~85% for body. A `vw`-dominant value
  locks the reader's font-size preference.
- **Don't** add a size step below 16px for reading text. The levers for a smaller-feeling role are
  weight, tracking, colour and italic.
- **Do** give headings their own `ch` value if capping them at all — `ch` resolves against each
  element's own font.

**Layout** — [record](docs/decisions/layout.md)

- **Do** cap measure with `max-width` on existing left-aligned grid items. **Don't** introduce a
  `.prose` container — it re-centres the measure and moves the left edge of text between page types.
- **Do** pick a spacing token by prefix first, then by name. **Never** by value — four values are
  shared by two or more roles.
- **Do** let the wide column fill and pin only the narrow one. **Don't** let a rail size itself from
  its contents, or the grid ends up downstream of a photo crop.
- **Do** use `grid-gutter-content` for real gaps between content columns; `grid-gutter` exists to make
  the arithmetic close.
- **Don't** widen a column to solve an alignment problem that belongs to a card — outdent the card.

**Components** — [record](docs/decisions/components.md)

- **Do** check an interaction ramp's direction against **the page**, never the previous step.
- **Do** state the focus ring as a relationship — inner contrasts the control, outer contrasts the
  surface. A fixed colour pair fails on the accent band.
- **Don't** give tags hover, pressed or focus states. They are markers, not controls.

## Open questions

Tracked in **[docs/open-questions.md](docs/open-questions.md)**. In brief: custom form-validation
messaging blocks the error state; the fixed 222px margin does not survive intermediate widths; mobile
prose leading is still at its desktop value; rail headings have no role; and dark has lost the
heading-softer-than-body relationship. Five smaller taste calls sit alongside them.
