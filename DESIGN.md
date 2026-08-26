---
version: alpha
name: Andy Fitzgerald Consulting
description: >-
  Typography-driven design system for andyfitzgeraldconsulting.com. Authoritative for
  the RULES — the clamps, the leading ramp, measure, rhythm, the two-layer principle.
  For VALUES the built CSS is truth as of phase 2: web-next/src/styles/tokens.css wins
  if it and the front matter here ever disagree, and this file is the diffable record.
  Phase 3 moved several values OUT of tokens.css into the one component that consumes
  each — a value with one consumer is not a token — so for those the component is truth.
  Desktop values are canonical — see Layout for the mobile variants and Typography for
  the fluid clamps.

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
  # The one role that GROWS as the viewport narrows: 28.125 desktop, 30 mobile. See Typography.
  # NOT a token in the CSS — it briefly was, as `--role-masthead-name`, the only `--role-*`
  # in the system, and only because its size steps by viewport. A component can read
  # `--breakpoint-lg` and do that itself, so it lives in Masthead.astro as a rule like every
  # other text role. Both endpoints are static: this desktop value and size/5's mobile end.
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

radius:
  1: 3px
  2: 6px
  full: 9999px

spacing:
  # Keys self-prefix into the emitted property — `space-1` → `--space-1`, `rhythm-band` →
  # `--rhythm-band`, `card-pad` → `--card-pad`. TWO EXCEPTIONS, both deliberate:
  #   border-hairline → --border-width-hairline
  #   border-quote    → --border-width-quote
  # so that a stroke's WIDTH cannot collide with its COLOR — `color/border-quote` already emits
  # `--color-border-quote`. Verified against Figma codeSyntax 2026-08-20. See docs/figma-notes.md.
  #
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
  # space-4 until 2026-08-25, when the masthead was built and 32px top and bottom
  # made the header taller than the page wanted to give it. Reduced to shorten the
  # header's vertical footprint so it competes less with page content — a call made
  # against the real thing rather than the board, and expected to be revisited once
  # actual pages sit under it. The footer keeps space-5: it has nothing below it to
  # crowd, so the two chrome paddings are no longer a matched pair.
  chrome-pad-header: "{spacing.space-3}"
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
  # are forbidden. Only these thirteen vary HERE — and fewer than that in the CSS,
  # because five of them (grid-column, the two skips, the two spans) are expressed
  # structurally by a real grid and were never emitted, and grid-margin is a formula
  # that floors itself. The seven that survive all flip at `md`. `lg` carries nothing
  # but its flag: the three things that step there are component internals with one
  # consumer each, so they live in their components. See Layout → Two breakpoints.
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
    radius: "{radius.1}"
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
    radius: "{radius.1}"
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
    radius: "{radius.full}"
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
    radius: "{radius.1}"
    padding: "{spacing.space-1}"

  # ── Cards ─────────────────────────────────────────────────────────────────
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    radius: "{radius.2}"
    padding: "{spacing.card-pad}"
  card-title:
    textColor: "{colors.text-title}"
  note-card:
    backgroundColor: transparent
    padding: "{spacing.card-pad}"
  note-card-hover:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    radius: "{radius.2}"

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
everything else is chrome around it: one accent color, no shadows, no illustration, hierarchy carried
by type, space and a hairline border. **When two options are equally defensible, the quieter one
wins.**

Everything is **hand-authored CSS and HTML** — native nesting, no preprocessor, no utility framework,
no component library. A project goal, not an implementation detail.

**Two layers.** Primitives name *values* (`blue-500`, `space-4`); semantic roles name *uses*
(`accent`, `rhythm-paragraph`). A semantic color or size is genuinely one value, so it stays a token.
A semantic *text* role is a bundle of applied properties, so in CSS it becomes a rule — `h2 { … }` —
not a variable. **Do not collapse that distinction.**

**Where things live.** This file is authoritative for the **rules** below. For the **values**, the
built CSS is truth as of phase 2 — `web-next/src/styles/tokens.css` — and the front matter here is the
diffable record of it; if the two ever disagree, the CSS is right. The Figma library
`pPZPGT6EpSaLkoUDK8HMMp` is a **reference rather than an authority** — it cannot outrank either, but it
is still the most detailed description of anything not yet built, so keep reading it for component
composition. Full chain in CLAUDE.md → Design system.

- **[docs/decisions/](docs/decisions/)** — why the system is the way it is. Read a record only when a
  decision is being questioned, excepted or changed.
- **[docs/open-questions.md](docs/open-questions.md)** — what is not settled.
- **[docs/figma-notes.md](docs/figma-notes.md)** — Figma mechanics and the constraints they impose.

## Colors

One accent, a neutral ramp derived from it, and an error hue deliberately far from both. Values are
in the front matter; the reasoning is in [docs/decisions/color.md](docs/decisions/color.md).

- **Accent `#326e85` (`blue-500`)** — brand surfaces, buttons, link hover. It is the lightest step in
  this hue that carries white text at AA (5.67), and almost everything else follows from that.
- **Neutral `#051319` → `#f9fafb`** — derived from a near-black at 198°, essentially the brand hue.
  Text, borders and both surfaces.
- **Error (hue 8°)** — far enough from 197° that it cannot be mistaken for the accent.

### Text roles

| Role | Use |
|---|---|
| `text` | body prose, and anything with no reason to differ |
| `text-heading` | document headings, h1–h4 |
| `text-title` | block-level link titles — card titles, list headings |
| `text-muted` | captions, labels, metadata — apparatus around the content |
| `text-lead` | the lead paragraph |
| `text-on-accent` | on accent bands and accent fills |

`text-heading`/`text-title` and `text-lead`/`text-muted` share a value on light and stay separate
roles because they diverge in dark.

**The masthead's wordmark takes `text` and its role line takes `text-muted`** — decided at build
(2026-08-25) rather than transcribed, because the front matter assigns neither a color. `text` because
the wordmark is the site's own name rather than apparatus around content; `text-muted` on the line
below because at one size step apart the two were reading as equals.

`icon` and `icon-on-accent` mirror `text` and `text-on-accent`, so an icon beside a label reads as
part of it. **Third-party brand marks are not bound at all** — a client logo is not ours to theme, and
the light/dark asset swap belongs in CSS on the front end.

### Links

**Inline links take body text color with a persistent underline**, moving to `link-hover` on hover.
The underline rather than the color carries the affordance, which satisfies WCAG 1.4.1.
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
[the record](docs/decisions/color.md) before changing a dark value.**

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

**`masthead-name` does not ride this ramp — it is the one role that grows as the viewport narrows.**
It takes step 4 on desktop and step 5 on mobile, so **28.125 → 30**, while every other role shrinks.
That is deliberate: the wordmark holding roughly constant is what keeps it reading as the masthead
once the header stacks. Figma models it as `role/masthead-name`, an alias to a *different step per
mode* rather than a size of its own — the only token in the system shaped that way.

**Its endpoints are inverted, which `clamp()` will punish.** `clamp()` orders its arguments by
value, not by viewport, so 28.125 is still the first argument and 30 the third, and the `vw`
coefficient is **negative**. Whether it wants that inverted clamp or a plain step change at the
masthead's own breakpoint is a phase 3 call, since that is where the header restacks.

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
body text the levers are uppercase, small caps, color or a rule, **not** a smaller size.

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
nudge the numbers. Grids stretch rather than center. Reasoning in
[docs/decisions/layout.md](docs/decisions/layout.md).

### The page stack is a flex column

**The page is a vertical stack of bands, and that stack is a flex column — not a grid** (decided
2026-08-26). One axis is all it has to express, so grid's second dimension would be unused
machinery. `<Grid>` handles the horizontal, inside each band.

**Its one job beyond stacking is reordering.** At `lg` the hero swaps places with the page title,
sitting directly under the masthead — and since the two are sibling bands, that swap needs a shared
flex parent and `order`. The DOM is authored in the **narrow** order, title before hero, matching the
rule the footer already follows: source order is reading order, and the wide layout is the exception.

**`order` moves visual position without moving focus or reading order**, which is normally the
argument against it. It is safe here specifically because the hero is a non-interactive image —
nothing focusable changes place. A band containing controls must not be reordered this way.

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
article.detail > * + *:where(:not(.sidebar, .banner))     { margin-top: var(--rhythm-paragraph); }
article.detail > * + :is(ul, ol, blockquote, figure, pre) { margin-top: var(--rhythm-block); }
article.detail > :is(ul, ol, blockquote, figure, pre) + * { margin-top: var(--rhythm-block); }
article.detail > * + h3                                   { margin-top: var(--rhythm-heading-minor); }
article.detail > * + h2                                   { margin-top: var(--rhythm-heading-major); }
article.detail > :is(h2, h3, h4) + *                      { margin-top: var(--rhythm-heading-close); }
```

**Source order decides among the last five.** They have identical specificity — (0,1,2) — and
`heading-close` is last so a heading binds to whatever follows it. No `margin-bottom` anywhere, so
nothing collapses. The base rule sits deliberately one notch lower at (0,1,1), which is what makes it
the fallback the other five override.

> **The exclusion must be `:where(:not(…))`, never a bare `:not()`.**

`.sidebar` and `.banner` are explicitly grid-placed, so a flow margin would push them off their row —
but `*:not(.sidebar):not(.banner)` adds **two class weights** and lifts the base rule to **(0,3,1)**.
Three classes outrank one class plus two types, so it then beats all five overrides and **flattens the
whole ramp to `rhythm-paragraph`** — every heading and block gap silently gone. Uniform 24px spacing
reads as a design choice rather than a cascade bug, which is what makes this worth stating. `:where()`
contributes zero specificity whatever it contains.

**The exclusion is one-directional, by construction.** It stops a margin landing *on* a grid-placed
element; it does not stop the element's *successor* taking one. So `.sidebar + p` gets
`rhythm-paragraph`, and an `h2` → `.sidebar` → `p` sequence gives the paragraph 24px instead of
`heading-close`'s 16, losing its bond to the heading. Sibling margins cannot express "skip the
out-of-flow thing." See docs/open-questions.md.

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

**The masthead has three states, not two** (built 2026-08-25). Stacked, then the same thing with the
nav on one row, then inline with no band. The middle one was never drawn and needed no design: six
items in equal columns produce it on the way between the other two. Worth generalizing — *a shape that
falls out of the mechanism does not need a breakpoint, and giving it one only pins it in place.*

### Two breakpoints, mobile-first — and why that is not a conflict

**There are exactly two major breakpoints in the CSS and they live in one place:** `md` at 48rem and
`lg` at 64rem, as two `@media` blocks in `web-next/src/styles/tokens.css`. No component carries a
major breakpoint. They flip *tokens*, and components read tokens — including placement, because a
custom property can hold any token sequence, so `--col-rail: 10 / span 3` collapses to `1 / -1` at the
base and every consumer follows. There is no CSS way to put a breakpoint in a variable
(`@media (min-width: var(--bp))` is invalid — a media query has no element for `var()` to resolve
against), so this is the mechanism that gets it to one place.

**Major versus minor.** A *major* breakpoint is a width the whole page agrees on, and it lives in
tokens.css. A *minor* one is a single component adapting to the space **it** has — a card that wants
two columns once its own box is wide enough — and that belongs in the component, because its condition
is particular to it and could not be stated globally. Prefer a real **size container query** for those,
which answers to the space the component occupies rather than to the viewport, so the same card in the
rail and at full width get different treatment from one rule. There are none yet; this is the model for
when there are.

**Some rules cannot be expressed as a token, and those read a flag.** A token flip cannot say "this
rule exists at one width and not the other" — the masthead's accent band is a bundle of declarations,
not a value. So tokens.css also declares `--breakpoint-md` and `--breakpoint-lg`, and a component
reads one with a **style container query**:

```css
@container style(--breakpoint-lg: true) { … }
```

**Always the `: true` form, never the bare `style(--breakpoint-lg)`.** The bare form tests whether a
property is *declared*, so `false`, `0` and an empty value all match it. The case that protects is not
disabling a live breakpoint, which nobody does, but scaffolding the next one with a `false` stub —
ordinary to write, and live the moment it is typed under the bare form.

**Why 64rem is not a taste value.** The masthead's inline form needs 951px minimum, measured — its
mark, wordmark and six nav items plus two chrome insets. At 48rem it overflows and flex-shrink breaks
the wordmark onto two lines, which reads as a spacing bug rather than a breakpoint one. Do not move it
below ~62rem.

**This document's values stay desktop-first; the CSS is written mobile-first.** Those are not in
conflict, and the difference is deliberate:

- **Here, desktop is canonical** because it is the fuller specification — the mobile column is a set
  of exceptions to it, which is why the front matter carries desktop values and Layout describes the
  collapse.
- **In CSS, mobile is the base** because an unevaluated query should leave a phone with the phone
  layout, not a 996px grid.

So for the viewport-varying tokens, **the `@media` blocks are the side that matches this document**,
not `:root`. Each token in `:root` carries an inline note naming its wide value, so the pair is
readable without cross-referencing. Adding a third breakpoint is one more block, wider last.

**48rem was arrived at by eye and is the one to move first.** It currently carries two unrelated
decisions — the masthead nav going to a single row, and the content grid opening its 8+3 split — and
only the nav is comfortable there. The split takes the prose from 66 characters at 767 to **49 at
768**, recovering around 1028, and leaves the rail 166px wide. Both measured.

That is **accepted rather than overlooked** (2026-08-24): a short measure is the cheaper failure, since
a long line loses the reader at the return where a short one only costs a few extra returns, and the
rail is the likelier thing to force a change — `body-compact` already exists for "a column too narrow
for `body`". Revisit against real content pages rather than against a specimen. It stays cheap to
revisit precisely because no component hardcodes a width.

### Outdenting

Note cards sit unboxed at rest, so their text must align with the heading above. On hover the box
appears and bleeds outward:

```css
@container style(--breakpoint-lg: true) {
  .home .notes > .note { margin-inline: calc(var(--card-pad) * -1); }
}
```

**This used to read `@media (min-width: 60rem)`**, from before the breakpoints were settled. The note
cards do not exist yet, so nothing was broken — but a third width invented here would have been the
accidental breakpoint this section exists to prevent. Written against `lg` unless building the cards
shows they want their own width, in which case it is a *minor* breakpoint and belongs in the card.

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

- **`radius-1` (3px)** — the button, and content images taking the tighter corner.
- **`radius-2` (6px)** — exactly 2 × `radius-1`. Every card surface, card images and photographs.
- **`radius-full` (9999px)** — the filter chip only, which is a capsule. Nothing else is fully
  rounded, and the value is arbitrarily large because `border-radius` clamps to half the shorter
  side; it is not a measurement.
- **`border-hairline` (1px)** — cards, panels, chips, inputs; every boundary that is a *line*.
- **`border-quote` (6px desktop / 4px mobile)** — the blockquote bar, a *mark* rather than a boundary,
  and the one stroke that varies by viewport.

**These emit `--radius-1`, `--radius-2` and `--radius-full`**, matching the `codeSyntax` on the Figma
variables. Reasoning in [docs/decisions/components.md](docs/decisions/components.md).

**Focus-ring radii derive from the control they wrap** — inner at `radius + 2`, outer at `radius + 4`.
**`box-shadow` derives them for you**: spread grows a shadow's corner radius by exactly the spread
distance, so `0 0 0 2px, 0 0 0 4px` on a 3px control renders rings at 5 and 7 with no `calc()` written
anywhere. That is the reason to prefer it over drawn geometry — and also why the derivation is **not
overridable**. Breaking it means drawing the rings as pseudo-elements and positioning them by hand.
*(An earlier version of this line called for a real `calc()`; that describes work the browser already
does.)*

**The capsule is the one exception: a ring around a capsule is a capsule**, so both rings take
`radius-full` rather than a derived value, and `+2` / `+4` describe only their offset.

> **Check on the real button in phase 3 — a constant offset is not constant curvature.**

At `radius-1` the radii run 3 → 5 → 7, so the outer corner is **2.3× rounder** than the control's.
The offset is uniform and the rings genuinely are concentric, but the eye compares roundness, so a
near-square field inside a visibly rounded ring reads as a mismatch. **The effect is confined to the
1–4px band** — at 0 the rings stay square, at `radius-full` they stay capsules, and both read as
exactly concentric. `radius-1` is the smallest radius in the system and so the worst case in it, and
the button is the component that will show it. Judge it at 1× on the real button, not on a blowup. If
it needs fixing, the fix is a **second exception here beside the capsule**, not a change to the
offsets — those are correct.

**The quote bar sits inside the indent**, so text sits 42px from the bar on desktop and 20 on mobile,
not 48 and 24.

## Components

**Buttons.** The primary button steps `accent` → `accent-hover` → `accent-pressed`.

> **Interaction increases the fill's separation from the page** — 5.42 → 7.77 → 10.15 on light,
> 6.17 → 16.03 → 18.86 on dark. Check the direction against the page, never the previous step.

**The light-ground button has no border.** Only the accent-band ghost takes one, and it takes
`border-on-accent`. On a band the ghost cannot lighten while keeping its label legible, so it inverts:
**outline → solid white → gray**.

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

**The color-mode selector** is a radio group — three exclusive options with one active is what radios
are, where `aria-pressed` would claim all three can be on at once. **"System" is the absence of a
choice**: it removes both the stored value and the attribute, so `prefers-color-scheme` applies
untouched. Selected is a filled pill using the ghost button's `surface`-behind-`accent` inversion;
hover on the unselected two is the ghost's **outline**, not a tint — `control-hover` is `blue-300`, and
white on it measures 2.9 against 5.67 at rest, so a tint would announce itself by making the icon
harder to see.

**The focus ring is stated by relationship, not by fixed colors:**

> **Inner ring contrasts with the control; outer ring contrasts with the surface.**

The same two colors in both contexts, order swapped. In CSS:
`box-shadow: 0 0 0 2px <inner>, 0 0 0 4px <outer>`.

**The page header is one component with an optional lead**, and the boolean is required by the rail
rather than offered as flexibility. **The gap after the header belongs to the parent band**, not the
component, so pages legitimately differ there.

**Its band's padding is deliberately asymmetric — 64 above the title block, 16 below** (read off the
Article board, confirmed intentional 2026-08-26). The title is bound to the prose that follows it the
way a heading is bound to its paragraph, so the space below is `rhythm-heading-close`, not a matching
`rhythm-band`. **This also settles what follows an h1**, which the rhythm ramp never covered:
`heading-close` handles h2–h4 and the h1 was left out. Provisional in the sense every spacing value
here is — judge it against real content, not the board.

**The eyebrow above the title is the `label` role** — Lato **700** at the 16px step with +2% tracking,
in `text-muted`. Not the 400 an earlier specimen used; it reads as a small bold label, which is what
`label` is for.

### The rail

A `<nav>` on detail pages, carrying two groups — "On This Page" and "Topics". It sits at
`10 / span 3`, one skipped column from the prose, which is the **sidebar** relationship in the skip
family: set apart rather than belonging to the paragraph beside it.

**It is a nav with its own link treatment, and it opts out of the wipe-in underline**
(`::after { content: none }`, which Navigation already provides for). Rail links take a **plain
underline on hover** instead. The wipe is a chrome gesture for the masthead and footer; a dense list
of topic links animating one by one under a moving pointer is noise, not affordance.

**Rail headings still have no role** — see [docs/open-questions.md](docs/open-questions.md). They are
headings *and* apparatus, and the system has no role for a heading of apparatus. They currently take
`text-heading`.

#### Sticky, per child rather than per rail

At desktop the rail's navigation **stays pinned to the top of the viewport** while a long article
scrolls, so "On This Page" and "Topics" remain reachable. Three cases, one mechanism:

| Page | Rail contents | Behavior |
|---|---|---|
| Article | the two nav groups | the groups pin |
| Services | an image, then the nav | **the image scrolls away, the nav pins** |
| Note | a source card or book reference | **nothing pins** — scrolls naturally |

**Stickiness is a property of a child of the rail, never of the rail itself.** That is what makes the
Services case free rather than special: anything above the sticky child is ordinary flow and leaves
the viewport normally, and a rail that marks nothing sticky just scrolls.

> **The rail must remain a stretched grid item. `align-self: start` silently breaks this.**

A sticky element can only travel inside its containing block, which is the rail's box. A grid item
stretches to its row's height by default, so the rail is as tall as the prose beside it and the
sticky child has the whole article to travel down. Measured, at a 3000px prose column: stretched, the
rail box is **3000px** and the sticky child pins at `top: 0`; with `align-self: start` the box is its
own content height and the child scrolls out of view like anything else. No `overflow` other than
`visible` may appear on any ancestor between the sticky child and the page, or it stops working with
nothing to indicate why — `<Band>` and `<Grid>` set none, deliberately.

### The logo mark

A 100×100 circular AF monogram, one `evenodd` path — so the letters are **holes**, not shapes. The disc
takes the fill and the counters show whatever is painted behind them, which is why the mark is inlined
rather than an `<img>`: it themes from `currentColor`, and its counters are automatically right on the
page ground, on a card, and in either theme with nothing to keep in sync.

It binds no color of its own; the consumer names the role, and the masthead names `accent`.

**It is the second role that grows as the viewport narrows** — 100px stacked, 80px inline, alongside
`masthead-name` and for the same reason: the identity block has to keep its presence once it is the
only thing in the header. Not a token: one consumer, so it lives in the component, in `rem` so it
tracks a reader's text size rather than the viewport.

### The hero image — one crop, not two designs

Full bleed on article and case-study pages. It reads as two designs and is one:

```css
inline-size: 100%;  aspect-ratio: 16/9;  max-block-size: 20rem;  object-fit: cover;
```

Below about 569px the ratio governs. Above it the height pins at 20rem while the width keeps growing,
so the box widens into 2.5:1 at 800, 4.5:1 at 1440 and 6:1 at 1920. **The panorama is a consequence,
not a declaration** — and the switch point is wherever 16:9 happens to meet 20rem, so it moves if
either constant does. That is why it takes no breakpoint and could not sensibly use one.

**The cap was 24rem until 2026-08-26**, which was a transcription error rather than a decision — the
Figma Article board draws the hero at 320px against a 1440 frame, which is 20rem. Every number in the
paragraph above is derived from it, so all four moved. **Expect this one to keep moving through fit
and finish against real content**; it is a single constant in `SanityHero.astro` plus the `capHeight`
hedge beside it, and nothing else in the build reads it.

**The hotspot works twice**, because the image is cropped twice: Sanity crops to 16/9 using it, and
`object-position` then aims `object-fit: cover` as the box flattens past that. Without the second, a
subject that is not centered slides out of shot on wide screens, silently.

At `lg` the hero swaps places with the page title, sitting directly below the masthead. That is a
reorder of the page stack, not a property of the image.

**Hero sources want ~2880px wide.** The srcset ladder stops at the source's own width, so a smaller
asset is stretched by the browser on a wide screen. That is intended — full bleed is not negotiable,
and stretching the largest real file is strictly better than asking Sanity to upscale it first — but it
means sharpness is an authoring responsibility. 2880 covers a 2560px display at 1× and a 1440px laptop
at 2×.

### Search — specified 2026-08-21, built in phase 4

Recorded ahead of the build so the masthead can leave the right seam. **Phase 3 ships the icon inert**
— it links nowhere and carries no behavior.

- **It expands in place, replacing the nav items.** Search is not a separate page you navigate to; the
  masthead trades its navigation for a field. So the nav and the field occupy the same slot, and that
  slot has to be able to hold either — which is a constraint on the masthead's markup, not a later
  addition to it.
- **Results replace the content of the current page**, adopting the results layout on the Figma board.
  The page is not navigated away from, so the masthead stays put and the URL question (does a search
  push history?) sits with the phase 4 filter work in
  [docs/urls-and-filtering.md](docs/urls-and-filtering.md).
- **Fuse.js**, the same engine the previous version of the site used.
- **`cmd + k` opens it**, moving focus into the field, and the icon is independently clickable and
  focusable. Two entry points to one state.
- **On mobile the icon becomes the word "search"** — the masthead restacks at that breakpoint and the
  nav moves to a full-bleed accent strip, where an icon alone reads as decoration. The Figma file has
  a mobile search-results screen showing the behavior.

**Icons come from Lucide** (the Astro integration), for everything except the footer's social marks,
which are brand assets rather than interface icons and are not ours to restyle.

### Navigation — a global role, not a component one

`nav` was on the list of type roles that live in the component that owns them, and it was **promoted
into the global tier** (2026-08-25) when the masthead and the footer arrived independently at the same
four declarations and the same hover. A second consumer is this project's trigger for promotion. It
stays element-level — `nav`, not a class — so it is a role style like `h1` rather than a global
component layer, which this project does not have.

**Nav links carry no resting underline. Hover wipes one in from the leading edge**, ported from the
live site: a pseudo-element animating `width: 0 → 100%`, because `text-decoration` cannot be animated
from zero width. It takes `link-hover`, which gives both of the live site's treatments from one
declaration — blue on a light ground, white inside an accent band, which re-points that token.

**The label color moves to `link-hover` on a light ground and holds still on an accent band**
(corrected 2026-08-26). The underline is the affordance in both cases; the color is a second signal
that is only available off the band.

On an accent band it is not merely redundant but wrong: `link-hover` is `blue-500`, which is also
`surface-accent`, so a nav label turned exactly the color of the surface behind it and vanished under
the pointer. **A real `<Band tone="accent">` makes this a non-issue by re-pointing `link-hover` to
`text-on-accent-hover`** — so the footer needs no special handling. Only a component that paints an
accent ground *without* `<Band>` has to cancel it, which today is the masthead, and only in the two
states where its band exists.

*Phase 3 read this as a nav-wide rule and cancelled the hover color globally, which also removed it
from the masthead's inline desktop state, where there is no band and the label is meant to go blue.
The scope is the accent ground, not the element.*

**The current page is `aria-current`**, not a data attribute — the fact belongs to the document, so the
attribute that carries it to assistive technology should also draw the indicator.

A nav whose links are not link-shaped — filter chips are the case coming — opts out with
`::after { content: none }`.

## Do's and Don'ts

The build checklist. Each rule stands on its own; the link is the reasoning, for when a rule is being
questioned rather than followed.

**Color** — [record](docs/decisions/color.md)

- **Don't** infer lightness from a color step number — `blue-500` is the accent at L 36%.
- **Do** verify novel pairings against **four combinations**: ground and card, in each theme.
- **Don't** carry a light rule of thumb into dark. *"`blue-500` or darker always passes"* is true on
  light and **false on dark**, where `blue-500` reaches 3.33 on the ground and `neutral-700` is the
  border.
- **Don't** put blue on an accent band in either theme without measuring. On light only `blue-50`
  clears AA; on dark nothing blue does.
- **Don't** use `neutral-600` for text on light — its one sanctioned light job is a control boundary.
  In dark it is `disabled-text`, where low contrast is the point.
- **Do** pick a color role by name, never by value — two pairs render identically on light and have
  already produced wrong bindings.
- **Don't** treat the disabled states' low contrast as a bug. Disabled is exempt (WCAG 1.4.3, 1.4.11)
  and the low contrast *is* the signal — but read the guardrail as being about the *pairing*, not
  which side the color sits on.
- **Do** identify errors in text, never by color alone (WCAG 3.3.1).
- **Don't** add success or warning colors until a state is actually designed.

**Typography** — [record](docs/decisions/typography.md)

- **Do** index leading by measure. **Don't** "fix" the non-monotonic prose ramp, and don't merge
  `body` and `body-compact` because they share a size step.
- **Don't** reach for `body-compact` for running prose — only for a column too narrow for `body`.
- **Do** keep every `clamp()` preferred value `rem`-dominant, ~85% for body. A `vw`-dominant value
  locks the reader's font-size preference.
- **Don't** add a size step below 16px for reading text. The levers for a smaller-feeling role are
  weight, tracking, color and italic.
- **Do** give headings their own `ch` value if capping them at all — `ch` resolves against each
  element's own font.

**Layout** — [record](docs/decisions/layout.md)

- **Do** cap measure with `max-width` on existing left-aligned grid items. **Don't** introduce a
  `.prose` container — it re-centers the measure and moves the left edge of text between page types.
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
  surface. A fixed color pair fails on the accent band.
- **Don't** give tags hover, pressed or focus states. They are markers, not controls.

## Open questions

Tracked in **[docs/open-questions.md](docs/open-questions.md)**. In brief: custom form-validation
messaging blocks the error state; the fixed 222px margin does not survive intermediate widths; mobile
prose leading is still at its desktop value; rail headings have no role; and dark has lost the
heading-softer-than-body relationship. Five smaller taste calls sit alongside them.
