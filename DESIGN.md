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
  error-500: "#cc4c38"
  error-600: "#b33f2e"

  white: "#ffffff"

  # ── Semantic roles (28) ───────────────────────────────────────────────────
  # Each emits a CSS custom property named --color-<key>.
  primary: "{colors.blue-500}"

  bg: "{colors.neutral-100}"
  surface: "{colors.white}"
  surface-hover: "{colors.neutral-100}"
  surface-pressed: "{colors.neutral-200}"
  surface-muted: "{colors.neutral-200}"

  text: "{colors.neutral-900}"
  text-muted: "{colors.neutral-700}"
  text-lead: "{colors.neutral-700}"
  text-title: "{colors.neutral-800}"
  text-heading: "{colors.neutral-800}"
  text-inverse: "{colors.white}"
  text-inverse-hover: "{colors.white}"

  icon: "{colors.neutral-900}"
  icon-inverse: "{colors.white}"

  border: "{colors.neutral-300}"
  border-control: "{colors.neutral-400}"
  border-control-hover: "{colors.blue-500}"
  border-inverse: "{colors.white}"
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
  # These are a flat-file artifact: this format has no mode concept, so a
  # viewport-varying token needs a twin key. In Figma the viewport is a MODE and
  # `*-mobile` twins are forbidden — a token whose name encodes a viewport
  # cannot participate in a mode switch. Only these thirteen vary; every other
  # token above holds one value at both viewports.
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
    textColor: "{colors.text-inverse}"
    typography: "{typography.nav}"
    rounded: "{rounded.sm}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.text-inverse}"
  button-primary-pressed:
    backgroundColor: "{colors.accent-pressed}"
    textColor: "{colors.text-inverse}"
  button-primary-disabled:
    backgroundColor: "{colors.disabled-surface}"
    textColor: "{colors.disabled-text}"

  # ── Primary button, accent band — a ghost that inverts on hover ───────────
  button-ghost:
    backgroundColor: "{colors.accent}"
    borderColor: "{colors.border-inverse}"
    textColor: "{colors.text-inverse}"
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
    rounded: "{rounded.md}"
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
    textColor: "{colors.text-inverse}"
    borderColor: "{colors.accent}"
  filter-chip-selected-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.text-inverse}"
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

The site is Andy Fitzgerald's professional home, being re-envisioned as a **digital garden** —
still publishing substantial articles and describing consulting services, but reframed from
"consultancy website" toward "engaged professional's digital home."

The surface is **typography-driven and lightly styled**. Long-form reading is the primary job and
everything else is chrome around it. There is one accent colour, no shadows and no illustration;
hierarchy is carried by type, space and a hairline border. When two options are equally
defensible, the quieter one wins.

Everything is **hand-authored CSS and HTML** — native nesting, no preprocessor, no utility
framework, no component library. That is a project goal rather than an implementation detail.

**Two layers, mirroring the Figma library.** Primitives name *values* (`blue-500`, `space-4`);
semantic roles name *uses* (`accent`, `rhythm-paragraph`). A semantic colour or size is genuinely
one value, so it stays a token. A semantic *text* role is a bundle of applied properties, so in
CSS it becomes a rule — `h2 { … }` — not a variable. Do not collapse that distinction.

**Where authority sits.** The Figma library `pPZPGT6EpSaLkoUDK8HMMp` is the source of truth for
**colour roles**; this file reflects it. For everything else this file is authoritative, and
`CLAUDE.md` defers here rather than restating values. Figma-specific mechanics and the
constraints they impose live in [docs/figma-notes.md](docs/figma-notes.md).

## Colors

The palette was rebuilt in full around a new accent; the previous one is not recorded, because
every ratio below is measured against what exists now.

- **Accent (`#326e85`, `blue-500`):** brand surfaces, buttons, link hover. It began as the 700
  step of a ramp built around the old brand blue `#4e9dbc`, and was promoted for one reason —
  **it is the lightest step in this hue that carries white text at AA (5.67)**, which the old
  brand blue never could (3.09). Almost everything else follows from that single choice.
- **Neutral (`#051319` → `#f9fafb`):** derived from a near-black sitting at 198°, essentially the
  brand hue, mixed toward white. Text, borders and both surfaces.
- **Error (hue 8°):** deliberately far from the brand's 197° so it cannot be mistaken for accent.

**The step numbers do not track lightness, and that is the trade.** Most ramps put 500 near L 52%;
this one puts it at L 36% so the *accent* is the 500 step — the number a person reaches for first
should be the primary. **Do not infer lightness from the step number in this system.**

**The gap between `blue-200` (L 78%) and `blue-300` (L 52%) is deliberate.** Nothing needs a value
there. The ramp is dense at the dark end where every step is a legal text or surface colour, and
sparse in the middle where a step would have no use.

**`blue-300` and `blue-400` have almost no legal use on light** — 2.92 and 3.91 on the ground, so
300 fails even the 3:1 large-text threshold. Both are kept because they complete the ramp and
because **dark mode will want mid-tones**, where their contrast inverts.

### The ratios that constrain things

| Pairing | Ratio | Consequence |
|---|---|---|
| `text` on ground / on card | 17.24 / 18.86 | — |
| `text-muted` on ground / on card | 6.48 / 7.08 | passes at any size |
| `neutral-600` on ground | 3.85 | **borders only, never text** |
| white on `accent` | 5.67 | what made `blue-500` the accent |
| any blue on the accent band | ≤ 1.87 | **nothing blue goes on the accent band** |
| `error-500` / `error-600` on the accent | 1.26 / 1.01 | the error set vanishes on a dark ground |

**Everything must be verified against both surfaces.** A colour can pass on a white card and fail
on the tinted ground; `blue-300` is the standing example (3.06 vs 2.92).

**`surface`, not `card`.** "Surface" names a position in the layering — the raised plane — so one
token serves cards, toggles, panels and overlays and it scales to a second elevation. Naming it
for a component would put a role name in a slot that should hold a value.

**Success and warning tokens are deliberately omitted.** There is no designed use for them, and
the previous palette's alert pair sat declared-but-unused for years. Per WCAG 3.3.1 errors must be
identified in **text**, never by colour alone.

### Links

**Inline links in prose take body text colour with a persistent underline**, moving to `link-hover`
on hover. Because the *underline* rather than the colour carries the affordance, this satisfies
WCAG 1.4.1 (Use of Colour), which a coloured-text link does not.

**Block-level link titles — card titles, list headings — take `text-title` with no underline.**
1.4.1 governs links being distinguishable *from surrounding text*, which is an inline problem; a
title in its own block at heading size is identified as a link by position. Dark titles also quiet
the page down and pass on both surfaces at any size, which coloured titles did not.

`text-title` is a role rather than a raw step for a specific reason: **it is one lightness step off
`text`, and that difference has to survive a theme change.** Hard-coding `neutral-800` would freeze
titles at a light-mode value while everything around them moved. It aliases `neutral-800` today, so
it costs nothing to have named it.

### Six text roles, three of which share a value

| Role | Alias | Use |
|---|---|---|
| `text` | `neutral-900` | body prose, and anything with no reason to differ |
| `text-heading` | `neutral-800` | **document headings, h1–h3** |
| `text-title` | `neutral-800` | **block-level link titles** — card titles, list headings |
| `text-muted` | `neutral-700` | captions, labels, metadata — apparatus around the content |
| `text-lead` | `neutral-700` | **the lead paragraph** |
| `text-inverse` | `white` | on accent bands and accent fills |

**Two pairs share a value, and both are deliberate.** `text-heading` and `text-title` are both
`neutral-800`; `text-muted` and `text-lead` are both `neutral-700`. They are separate roles because
they answer to different things and will diverge: lighten captions and the lead should not follow;
restyle card links and page headings should not follow. This is the same collision hazard the
spacing roles carry, and it takes the same rule — **pick by name, never by value.**

**Headings sit one step softer than body, not darker.** Hierarchy is already carried four ways in
the type system — family, size, weight and tracking — so colour is not asked to differentiate as
well. The lighter step keeps a page of headings from hammering.

**`text-lead` is content, not apparatus, which is why it is not `text-muted`.** The lead is the most
prominent prose on the page; a caption is furniture around it. They agree on a value today and must
be free to stop agreeing. The trade worth knowing: the lead ends up **larger but lighter** than
body, so size and colour point in opposite directions. Size wins, and this is a common editorial
pattern, but it is a deliberate choice rather than a neutral one.

**Naming names the quality, not the position.** `text-heading` was very nearly `text-page-title` —
which would have been wrong the moment it landed on an h2, since 45 of its 68 nodes are section and
subsection headings. This is the third time in this system a token has been named for where it sits
rather than what it does; see `Eyebrow` → `Label` and `rhythm/pair` → `rhythm/tight`.

### Icons take roles of their own

`icon` aliases `neutral-900` and `icon-inverse` aliases `white`, mirroring `text` and `text-inverse`
— so an icon beside a label reads as part of it. They are separate roles rather than reuses of the
text ones because **an icon is a graphic, not type**, and the two can need different answers: optical
weight at small sizes, and a value in dark mode that a glyph needs but a paragraph does not.

**Third-party brand marks are deliberately not bound.** A client logo is not ours to theme, and a
dark mode wants a *different asset* rather than a recoloured one. The same goes for placeholder
greys and imported vector geometry — see the exclusion list in
[docs/figma-notes.md](docs/figma-notes.md).

### Accent bands carry white text, and the whole band has to move together

Five bands sit on the accent: Hero, Topics, Connect, RSS CTA and Footer, plus the Case Study
testimonial. **Changing a band's fill is never a one-property change** — the text on it has to move
in the same breath, because the guardrail *nothing blue goes on the accent band* cuts both ways and
dark text on a dark fill fails just as surely as blue on blue.

The testimonial band is the worked example. It sat on `blue/400` with `text` body copy and a
`link-strong` attribution: **4.62 and 2.60**, one marginal pass and one outright failure. Moving the
band to `accent` alone would have made both worse (3.33 and 1.87). Moving the band *and* the text
puts every line at **5.67**.

Consequence worth stating: on an accent band there is currently **no tonal hierarchy available** —
everything legible is white or near-white, so an attribution is distinguished from its quote by size
alone. `neutral-200` is the only muted option that clears 4.5, and only just, at about 4.6.

### Dark mode — what is already true

Not designed yet, but three things are in place: the semantic layer has a single `Light` mode so
`Dark` is a sibling rather than a restructure; every component binds semantic roles rather than
primitives, so one switch reaches them all; and the light end of the blue ramp (`blue-50`–`200`)
plus the unused mid-tones exist for it. **The error set has no light variant and will need one.**

## Typography

Two faces, each with a clear duty:

- **Noto Serif** (`body`) — running prose, lead paragraphs, captions, pull-quotes, and the one
  hero `display` statement. Chosen for screen legibility; it descends from Droid Serif and has
  deliberately generous spacing and open apertures.
- **Lato** (`display`) — h1–h4 plus all metadata and UI: labels, dates, nav, buttons, chips,
  tags, pagination.

Open Sans, the previous body face, is dropped — it saves ~577 KB.

### The scale — 18px base, ratio 1.25 (major third)

**The base is 18, not 20.** Read at measure, 20px was too large: Noto Serif's big x-height makes it
read larger than the number suggests.

**Step 1 is a clamped floor at 16px, not on the ratio.** 18 ÷ 1.25 is 14.4px, below the legibility
minimum for captions — and the ratio cannot be lowered to fix it, because keeping step 1 ≥ 16 from
an 18 base caps the ratio at 1.125, which would put step 6 at 28.8px and leave no display size at
all. Consequence: body:small compresses from 1.25 to **1.125**, so captions read as
slightly-smaller body rather than clearly subordinate, and they lean on italic and muted colour
instead. `size/0` (14px, chip and tag labels) sits below the floor deliberately — that floor is
about *reading* text, and chrome is not reading text.

The odd values (`2.746582031rem`) are correct and intentional. They are referenced by name and
never retyped, and keeping them exact means the scale regenerates cleanly if the base or ratio moves.

### Fluid sizing — per-step `clamp()`, 375px → 1200px

```
slope    = (S₂ − S₁) / (V₂ − V₁)
vw part  = slope × 100
rem part = (S₁ − slope × V₁) / 16
```

| Step | Mobile | Desktop | Declaration | rem share @1200 |
|---|---|---|---|---|
| 0 | 14 | 14 | `0.875rem` — static, chrome only | — |
| 1 | 16 | 16 | `1rem` — static; the legibility floor | — |
| 2 | 17 | 18 | `clamp(1.0625rem, 1.0341rem + 0.1212vw, 1.125rem)` | 92% |
| 3 | 21 | 22.5 | `clamp(1.3125rem, 1.2699rem + 0.1818vw, 1.40625rem)` | 90% |
| 4 | 25 | 28.125 | `clamp(1.5625rem, 1.4737rem + 0.3788vw, 1.7578125rem)` | 84% |
| 5 | 30 | 35.15625 | `clamp(1.875rem, 1.7285rem + 0.625vw, 2.197265625rem)` | 79% |
| 6 | 32 | 43.9453125 | `clamp(2rem, 1.6606rem + 1.4479vw, 2.746582031rem)` | 60% |

**Reading sizes are nearly flat, and that is the system.** Step 2 spans 1px and step 3 spans 1.5px,
so body and lead are effectively constant across viewports and only display type is meaningfully
fluid. This followed from the 18px base rather than from drift.

**The preferred value must stay `rem`-dominant.** A purely `vw` preferred value does not respond to
a reader's browser font-size preference, so their text is locked. Measured at a simulated 24px
default: `1.4vw` and `clamp(16px, 1.4vw, 20px)` both stayed at **67%** of proportional — no growth
at all — while the rem-dominant form reached **97%**. Keep body around 85% rem-weighted; display
sizes may lean harder on `vw`.

**Per-step clamps, not one fluid base × the ratio** — base 18 × 1.25⁴ would put a 44px h1 in a
343px column. The ratio therefore *compresses* on small screens (≈1.17–1.28 at 800px against a
clean 1.25 at desktop). Intended, not drift.

### Leading — indexed by measure, not by size

This is the least obvious rule in the system and the one most likely to be "corrected" back to
something worse.

> **Leading pairs with the measure, not the size step.** The step is only a *proxy* for measure,
> and it holds exactly as long as one step means one column width. The moment the same step
> appears at two measures, the proxy breaks and the step-based rule gives the wrong answer.

| Register | Value | Measure | Roles |
|---|---|---|---|
| prose, short | **1.5** | ~29–33 chars | `small`, `body-compact` |
| prose, medium | **1.6** | ~54 chars | `lead` |
| prose, full | **1.8** | ~67 chars | `body` |
| statement | **1.4** | ~43 chars at 35px | `display` |
| heading | 1.3 / 1.25 / 1.1 | — | h4 and h3 / h2 / h1 |

**The prose ramp is not monotonic, and that is correct.** 1.5 → 1.8 → 1.6 looks wrong until you
read it as a measure ramp rather than a size ramp: short measures need little, body at the full
67-character column needs the most, and the lead is larger type in the same column so it holds
fewer characters and needs less again.

**Body sits near a ceiling, not in the middle.** Two things independently justify 1.8 — Noto
Serif's large x-height puts more visual mass on every line, and 67 characters is a long measure
where leading is what keeps the return sweep accurate. **Above about 1.85 the lines begin to
disassociate**, so there is no headroom above it.

**`body` and `body-compact` share one size step and differ only in leading. Do not tidy them into
one style.** A card description sits in 284px — about **29 characters**, against the ~67 that 1.8
was derived for — and at less than half its intended measure `body` reads conspicuously airy. The
control that confirms the diagnosis: the *horizontal* card variants are 370px (~41 characters) and
their descriptions already fit in three lines, so switching styles moved their height by **zero**.
Only the narrow measure was ever suffering, which is what a measure-driven rule predicts and a
size-driven one does not. Reach for `body-compact` in any prose column too narrow for `body`;
**never for running prose**.

**Prose and headings need separate ramps.** At the same 22.5px a lead paragraph wants 1.6 and an h3
wants 1.3. One ramp cannot serve both — which is also why the hero statement does not borrow the
heading ramp's 1.2 however short it gets.

### Tracking — a Lato-only adjustment

| Applied to | Tracking | Roles |
|---|---|---|
| Lato at display sizes (28px+) | **−1.5%** | h1, h2 |
| Lato as a small label | **+2%** | h4, `label` |
| Lato, everything else | 0% | h3, `nav`, `masthead-role`, `chip`, `tag` |
| **Noto Serif, every size** | **0%** | `display`, `lead`, `body`, `small`, `caption` |

**The serif is never tracked.** `display` was originally specified at −0.5%, scaled down from
Lato's −1.5% on the reasoning that "a serif needs less." Three reasons 0% is the better answer:
negative tracking compensates for spacing optimised for *reading* sizes and only earns its keep
above roughly 50–60px, so at 35px a face is barely into display territory; Noto Serif's spacing is
deliberately generous and tightening closes its counters; and serifs already create horizontal
connection between letters.

### h4 — no size step left

h4 sits at body size and differentiates by **family + weight + tracking**: Lato 700 at +2%. Below
h3, size stops being a usable signal — any step small enough to sit between h3 and body is too
close to body to read as a heading. If it reads as bold body text, the levers are uppercase, small
caps, colour or a hairline rule — **not** a smaller size step.

### Measure

Target **60–75 characters**. `66ch` measures ~67 characters, since 1ch ≈ 1.03 average lowercase
characters in Noto Serif. Because `ch` is font-relative, the 18px base changed the measure's pixel
width but not its character count: **~664px at 18px** where it was 738px at 20px.

**On the 996px grid the measure is delivered by the column span, not by a cap** — 8 of 12 columns
is **656px ≈ 67 characters**. The `max-width` below is a safety net for any context wider than 8
columns, not the primary mechanism.

```css
article.detail :where(p, ul, ol, blockquote, figure) { max-width: 66ch; }
```

- Apply to prose elements **and** `figure` — both inherit the body font, so `ch` resolves
  identically and their edges align.
- **Not** on `figcaption`: its 16px font makes `ch` resolve narrower than its own image.
- Headings need a **separate** value if capped at all. `ch` resolves against each element's own
  font, so `66ch` on an h2 means 66 characters of Lato at 28px — far wider than intended.

**Cap measure with `max-width` on the existing left-aligned grid items, never with a new
container.** `max-width` on a left-aligned grid item moves only its *right* edge, so measure is
capped with no layout disruption and no template change.

**A `.prose` grid container was prototyped and rejected.** It worked — pixel-exact alignment,
measure/wide/full tiers, `subgrid` full-bleed panels — but it re-centred the measure, which *moved
the left edge of text between page types*. That is a whole-site layout decision, and it was being
driven by one page's measure requirement. It also assumed detail pages had no right-column content,
which is false: case studies carry both rail relationships described under Layout. Don't revive it
outside an explicit layout discussion.

### Two smaller rules

**`caption` is italic serif.** A caption reads as part of the reading matter, not as apparatus
around it, and the italic plus the muted colour do the subordinating the size step can no longer do
(body:small is only 1.125 on this scale). Figma renders it roman purely because Noto Serif Italic
is not installed there; the site ships the italic face and CSS renders the intended one.

**A role may occupy a different step per viewport, but only where the layout jumps.** `masthead-name`
is the one case — step 4 on desktop, step 5 on mobile — and it is acceptable only because the
element's *job* changes at that breakpoint, from a left lockup beside the nav to a centred
standalone wordmark. It would never be acceptable for body text, which does the same job at every
width. In CSS this is one reassignment; `var()` indirection *is* aliasing.

## Layout & Spacing

### The grid

**12 columns, 996px content, 222px margins at 1440.** Detail-page prose is **8 columns = 656px**;
the right rail is one skipped column away. Both ends close exactly: `2×222 + (12×61 + 11×24) = 1440`,
and at the 375 mobile floor `2×16 + (12×20 + 11×8) = 360`.

**The grid must stay simple and flexible.** It should not become intricate or highly constrained —
layout ideas need room to keep being explored. A corollary: **typography decisions must not drive
grid decisions.** Measure is satisfiable at more than one width — 996 with 8-column prose, or 1200
with 7-column prose — so it constrained the *column span*, not the grid.

**Layout grids stretch rather than centre.** A centred grid fixes the column width and lets the
margins float; stretching fixes the margin and lets the columns flex, which is what the CSS does —
`minmax(1rem, …)` gutters against `1fr` columns.

### Grid owns horizontal, rhythm owns vertical

The rule that decides most spacing questions. A gap between columns is a *grid* relationship, not a
rhythm value, and tokenizing it in both places lets the two drift.

- Column gaps, page margins and the one-column skip all come from `grid-*`.
- A wrapped column's *row* gap is vertical, so it is rhythm: `rhythm-heading-major`, because what
  lands below always starts with a heading.
- A component's own intrinsic height — `field-height` — is a component internal, like `card-pad`,
  and has nothing to do with the grid.
- **The rule is not self-enforcing for gaps.** A horizontal gap *is* a gap, so nothing stops a
  rhythm token being used for one. Keep it by hand.

**`grid-gutter-content` is the gutter that isn't the grid's gutter**, and the only token whose
mobile value exceeds its desktop one. `grid-gutter` exists to make the column arithmetic close; its
mobile value of 8 is a consequence of that arithmetic, and **8 is never a gap you actually want
between two columns of content** — two 160px lists of links 8px apart do not read as two lists.
`grid-gutter` stays the pure grid-definition value; `grid-gutter-content` carries the real gap.

### The skip family, and why 12 columns is poor for symmetric splits

| | Formula | Desktop | Splits it serves |
|---|---|---|---|
| `grid-skip-1` | column + 2 × gutter | 109 | **asymmetric**: 8+3, 7+4 |
| `grid-skip-2` | 2 × column + 3 × gutter | 194 | **6+4** |

A 12-column grid offers only three symmetric two-column layouts, because the gap must be a whole
number of columns and gutters: 6+6 (gap too tight, the eye jumps columns), 5+2+5, and 4+4+4
(unusable). **Nothing exists in between** — a gap of 60 or 80 puts the columns at 468 or 458,
neither of which is a grid width, so the inner edges float off the grid while the outer edges stay
on it. 12 is generous for asymmetric splits and poor for symmetric ones. Bind the skips rather than
retyping; 109 and 194 both look arbitrary enough to get "corrected."

**Two rail relationships, and the gap is the message.** 8 + `skip-1` + 3 reads as a **sidebar**, set
apart from the prose; 8 + `gutter` + 4 reads as a **figure belonging to** the paragraph beside it. A
documentary figure belongs *to* its paragraph and should sit against it; an identifier like a client
logo does not.

### Span tokens name the desktop span

**Every span token collapses to the full content width on mobile**, because at 375px nothing sits in
a fraction of 12 columns — it stacks. The arithmetically honest mobile values are never what you
want, so a span token is really a *semantic width* wearing grid clothing. Name it for the desktop
span anyway; that is the only scheme that scales without inventing a role name per use.

**Pin the narrow column and let the wide one fill.** In any two-column split only one side needs a
width: `996 − 316 − 109 = 571`, computed rather than typed. That halves the hand-entered numbers and
puts the prose column — the one that should absorb intermediate widths — on the filling side. This
is why `span-3` and `span-4` exist and `span-7` and `span-8` do not. **The rule only protects you if
the narrow column is actually pinned:** a hug-sized rail inverts it, and a photograph cropped two
pixels off `span-3` once propagated into prose resolving to 654 instead of 656. A photo crop was
setting the measure.

### Vertical rhythm — the unit is one body line, rounded

Body is 18px at 1.8, so one line box is **32.4px**. The scale is built on **32px = 2rem**, a 1.2%
round-down: `space-1` … `space-7` are ¼, ½, ¾, 1, 1½, 2 and 3 units.

**The rounding is deliberate and costs nothing.** Nothing here runs on a baseline grid —
impractical with fluid type, images and mixed leading — so the unit does not need to *equal* the
line box, only to be commensurate with it. What the rounding buys is a scale whose every step is a
whole number of pixels *and* a clean `rem`, which 32.4 is not. This is an 8px grid **derived from
the line box rather than imposed on it**, so if the type scale changes the spacing scale regenerates
from the new line box. Note this cuts the opposite way from the font sizes, where ugly values are
kept exact — there the ugliness is unavoidable if the ratio is to hold; here it is avoidable and
buys nothing.

**Why `rhythm-paragraph` is ¾ of a line and not a full one.** The gap has to hold the paragraph
break clearly above the within-paragraph line distance, or the paragraph stops cohering as a unit —
and that requirement gets *stronger* as leading loosens. At ¾ the baseline-to-baseline distance
across a break is ~56px against 32.4px within, a **1.74×** step that stays unmistakable. A full line
(2.0×) is the other defensible choice; ½ would be marginal at 1.5×.

**Check ratios in apparent space, not in token values.** Every line box contributes half-leading, so
the white above an h2 measures ~81px and below it ~33px — about 2.5:1, not the 4:1 the raw numbers
suggest.

**`rhythm-band` and `rhythm-section` are two values of one property**, not two properties: both are a
band's vertical padding, and `section` is the heavier choice for a band opening a new page region.
Bands stack at gap 0, so band-to-band space is simply two paddings. **Which of the two a band takes
is decided by how it reads, not by a rule** — the Hero takes `band` despite being a coloured
self-contained region, because 96 read as too much air above a three-line statement. Expect to try
both and look.

**A token earns a name only when more than one thing uses it, or the values move as a set.** One-off
component spacing binds a `space-N` primitive directly. Optical nudges — a 2px alignment correction
between a glyph and adjacent text — stay untokenized deliberately, because giving them a token
invites people to reach for them as spacing values.

**Value collisions are the live hazard.** Four values are shared by two or more roles (8, 16, 48,
64). The collisions are deliberate — roles that agree today and can diverge later — but they are
indistinguishable by value in a picker, and that has already produced wrong bindings twice. **Pick
by prefix first, then by name; never by value.** If you are inside a card, the answer is under
`card-`.

### The CSS mechanism — sibling margins, no container

Portable Text emits a flat sequence — `p p h2 p p figure p` — with no section wrappers, so `gap`
cannot express "tighter after a heading."

```css
article.detail > * + *                                    { margin-top: var(--rhythm-paragraph); }
article.detail > * + :is(ul, ol, blockquote, figure, pre) { margin-top: var(--rhythm-block); }
article.detail > :is(ul, ol, blockquote, figure, pre) + * { margin-top: var(--rhythm-block); }
article.detail > * + h3                                   { margin-top: var(--rhythm-heading-minor); }
article.detail > * + h2                                   { margin-top: var(--rhythm-heading-major); }
article.detail > :is(h2, h3, h4) + *                      { margin-top: var(--rhythm-heading-close); }
```

- Every selector is `* + X`, so a **first child never picks up a margin** — no `:first-child` reset.
- Nothing sets `margin-bottom`, so there is **no margin collapsing** to reason about.
- All six have equal specificity, so **source order decides**. `heading-close` is last, which is
  what makes a heading bind to whatever follows it, including a figure.
- The base rule needs `:not(.sidebar):not(.banner)` — both are explicitly grid-placed and a
  `margin-top` would push them out of position.
- **No new container.** These are margins on existing grid items, the same move-only-one-edge logic
  the measure uses.

Figma expresses the same system as nested auto-layout, because one frame has one gap. **The two
structures are not parallel and cannot be made parallel.** They share the scale and the role names;
the mechanics differ by tool. That is not a defect to reconcile.

### Responsive — split by cause, not by size

The useful division is *what creates the space*:

- **Type-derived spacing does not change.** `tight`, `heading-close`, `item`, `paragraph`, `list`,
  `block`, both heading roles and every `card-*` role exist because of the line box or the
  component, and body moves only 18 → 17px between viewports.
- **Page-derived spacing does.** `band`, `section` and `chrome-inset` exist because of the viewport,
  and three lines of dead air between regions is wrong on a short screen.

Only three of the twenty-four spacing roles vary. Both band roles interpolate with no breakpoint,
derived over 375 → 1200 with the same arithmetic as the type clamps:

```css
--rhythm-band:    clamp(2rem, 1.0909rem + 3.8788vw, 4rem);
--rhythm-section: clamp(4rem, 3.0909rem + 3.8788vw, 6rem);
```

**Figma boards are 375; the CSS floor stays 360.** At 375 every `clamp()` sits exactly at its
minimum, which is what the mobile values *are*, so a 375 board shows precisely what the CSS produces
at the floor — and below 375 the clamps keep returning those same minimums, so the type system is
already correct at 360 with no re-derivation.

**What the collapse settles on its own:** content goes 996 → 343, every span token collapses to the
full width so all four two-column splits stack, both band paddings drop a step, and the Home notes
outdent disappears. **What it does not:** the masthead stacks and the nav moves to a full-bleed
accent strip; the hero moves onto the page ground at 1.25 leading; article cards swap to their
vertical variant rather than merely narrowing (the horizontal variant at 328 leaves its description
about 15 characters wide); and the footer restacks.

**Author the footer DOM in the mobile order** — blurb, links, social, copyright — and produce the
desktop arrangement with grid placement. Source order then equals reading order at both sizes, with
no `order` property fighting the accessibility tree.

**One shipped contrast failure closes here.** The live site's mobile nav is white on the old
`--blue` at **3.03**. White on `accent` is **5.67**.

### Outdenting — when a box must bleed past its column

Note cards sit unboxed at rest, so their *text* must align with the heading above them. But a card
has 16px of padding, so if its box sits on the column line its text is inset and misaligns. On
hover the box appears and should bleed *outward*.

```css
@media (min-width: 60rem) {
  .home .notes > .note { margin-inline: calc(var(--card-pad) * -1); }
}
```

**Outdent the card, never the column.** Widening the column looks like the same fix and is not — the
first attempt widened the notes column by 30px, the band split that across both columns, and **the
sibling articles column drifted 15px off the grid** while every other band on the page stayed put.
The outdent leaked into something that had nothing to do with it. Confine it to the card and nothing
else moves. The value is derived from `card-pad`, so the two cannot drift.

Scope it deliberately: on mobile the cards go full width with no room to bleed, and on an index an
unboxed card's hover state should match the boxed cards beside it, not exceed them.

## Elevation & Depth

**There are no shadows.** Depth is tonal layering plus a hairline border, which suits a
typography-driven page where drop shadows would read as imported furniture.

| Layer | Token | Value |
|---|---|---|
| page ground | `bg` | `#f9fafb` — a tinted off-white |
| raised surface | `surface` | `#ffffff` |
| boundary | `border` | `#d2d5d6`, 1.41 on the ground |

**The border carries the card boundary, not the fill difference.** Ground to surface is **1.045** —
two lightness points, at the edge of perceptibility — so a **borderless card would not be
distinguishable**. Borders are not optional decoration here. Unboxed notes sit directly on the
ground by design and need no boundary.

A tinted ground is also easier on the eye than pure white for long reading, which is the primary
job.

**A full-width band can be a surface.** `surface` names a position in the layering, not a component,
so a band that sits pure white across the full viewport against the tinted ground is a raised plane
in exactly the sense the token means — the `Connect` band is the standing case. It carries no radius
and no border because at full bleed the viewport edges do the containing; the border rule above is
about boxes that need an edge drawn, not about every use of `surface`.

**The ground's hue is nominal.** `#f9fafb` computes to 210°, not the brand's 197°, and that
distinction is not representable: at 98% lightness the colour spans 2 units of 255 per channel, so
both hues quantize to the same hex. For anyone tempted to "fix" it — **a perceptibly brand-tinted
ground needs lightness at ~95% or below**, where the channel span widens enough for hue to be
encodable.

## Shapes

The shape language is quiet: small radii, hairline strokes, no ornament.

- **`rounded.sm` (3px)** — the button, and content images taking the tighter corner.
- **`rounded.md` (6px)** — exactly 2 × `sm`. Every card surface, the filter chip, card images and
  photographs.
- **`border-hairline` (1px)** — cards, panels, chips, inputs; every boundary that is a *line*.
- **`border-quote` (6px desktop / 4px mobile)** — the blockquote bar, a *mark* rather than a
  boundary, and the one stroke that varies by viewport.

**Focus rings are derived from the control they wrap** — inner at `radius + 2`, outer at
`radius + 4`. The button's inner ring is 5 *because the button is 3*, not because 5 is a value in
the system. In CSS this is a real `calc(var(--radius-1) + 2px)`, so the dependency stays live.

**The quote bar sits inside the indent**, so the text sits 42px from the bar on desktop and 20 on
mobile, not 48 and 24. That is the number to reason about when the indent looks wrong.

**Why the quote indent varies by mode and the bar with it.** 48px is 7% of a 656 column but 15% of a
328 one. This is a *proportion* fix, not a measure fix — every candidate indent lands within three
characters of the others, so tightening buys almost no measure. **24 puts mobile back at exactly
7%**, matching desktop, which is why that value rather than a taste call. The bar had to follow: at
6px it was 12.5% of a 48 indent and would have been 25% of a 24 one, doubling in visual weight
precisely as the indent halved.

## Components

**Buttons.** On a light ground the primary button darkens through `accent` → `accent-hover` →
`accent-pressed`, all carrying white text and all passing comfortably.

**The light-ground button has no border**, and that is a specification rather than an omission. It
carried a white 1px stroke for a while, which was invisible against the `#f9fafb` ground (1.05) and
so went unnoticed — but a white outline on every primary button would have appeared the moment a
dark ground existed. Only the accent-band ghost takes a border, and it takes `border-inverse`.

**On an accent band the button cannot lighten while keeping white text, so it inverts instead.** The
window is empty: white text survives only to L 41%, where the fill sits 1.23 against the band and is
invisible against it, while separating from the band needs L ≥ 80%, where white text is at 1.53. So
the ghost goes **outline → solid white → grey**, three maximally distinct states.

**Filter chips.** Rest is a white surface with a control border; hover and pressed tint toward the
accent; selected is a filled accent pill with white text. **The chip border is its own role, not the
card hairline** — a card is not a control, a chip is, and form inputs take the same token for the
same reason.

**Tags are markers, deliberately not controls.** A small neutral pill on a card marking what
accompanies it. **The accent was tried first and rejected for reading too pressable** — a filled
accent pill with white text is structurally the *selected* filter chip, so on an index a tag and a
selected chip would have looked alike while meaning different things. A tag has no hover, no pressed
and no focus, and those variants were deleted rather than specified, because they would document
behaviour that cannot occur. If tags ever become links to a topic archive they need hover and focus,
and a link needs them at 4.5.

**The tag's pill is 1.21 against a white card, and that is not a failure.** WCAG 1.4.11 governs
interactive components and graphics *required to understand the content*; a tag is neither, and its
label carries the meaning. The pill is decorative reinforcement, the same standing as the quote bar.
It is quiet, though — if the shape stops earning its keep, muted text with no pill is the honest
simplification.

**Note cards are unboxed at rest on desktop and boxed at rest on mobile, with no hover state at all
on mobile.** The outdent has nowhere to go at full width, and the box does the separation work that
hover did on desktop. Touch devices have no hover, so a permanently-hovered mobile card would encode
a state that cannot occur — **a viewport that removes an interaction needs the state renamed, not
reused.**

**Blockquote is an element rule in CSS, not a component.** Portable Text emits `<blockquote>` and
the stylesheet styles it. The indent is `padding-inline-start`, **not margin** — the bar sits at the
box edge, so a margin would put the gap outside it and create nothing. Testimonials that come from
review documents rather than Portable Text take a class while sharing the same custom properties.

**The focus ring is stated by relationship, not by fixed colours:**

> **Inner ring contrasts with the control; outer ring contrasts with the surface.**

The same two colours in both contexts, order swapped — 5.67 / 5.42 on light, 5.67 / 5.67 on the
band. A fixed inner-white / outer-accent ring **fails on the accent band**, where the white inner
merges with the white button and the accent outer merges with the band. In CSS this is
`box-shadow: 0 0 0 2px <inner>, 0 0 0 4px <outer>`.

**The page header is one component with an optional lead.** The boolean is required by the rail
rather than offered as flexibility: where a rail image aligns to the top of the *lead* rather than
the h1, pulling the lead up into the header would realign the image to the paragraph below it. **The
gap after the header belongs to the parent band, not the component** — a component cannot carry the
space that follows it, so pages legitimately differ there.

## Do's and Don'ts

- **Do** cap measure with `max-width` on existing left-aligned grid items. **Don't** introduce a
  `.prose` container — it re-centres the measure and moves the left edge of text between page types.
- **Do** index leading by measure. **Don't** "fix" the non-monotonic prose ramp, and don't merge
  `body` and `body-compact` because they share a size step.
- **Don't** infer lightness from a colour step number — `blue-500` is the accent at L 36%, not a
  mid-tone.
- **Don't** put anything blue on the accent band. Every step measures ≤ 1.87 against it; use white
  or a near-white neutral.
- **Don't** use `neutral-600` for text at any size. It fails AA on both surfaces and has exactly one
  sanctioned job: the boundary of an interactive control.
- **Do** trust that anything at `blue-500` or darker, and `neutral-700` or darker, passes on both
  surfaces. Only novel pairings need measuring.
- **Do** verify against **both** surfaces — a colour can pass on a white card and fail on the ground.
- **Don't** treat the disabled states' low contrast as a bug. Disabled is exempt (WCAG 1.4.3,
  1.4.11) and the low contrast *is* the signal — but read the guardrails as being about the
  *pairing*, not about which side the colour sits on. A resting control wearing the disabled colour
  is exactly the precedent this exists to prevent.
- **Do** pick a spacing token by prefix first, then by name. **Never** pick by value — four values
  are shared by two or more roles.
- **Do** let the wide column fill and pin only the narrow one. **Don't** let a rail size itself from
  its contents, or the grid ends up downstream of a photo crop.
- **Don't** add a size step below 16px for reading text. There isn't one and there never will be;
  the levers for a smaller-feeling role are weight, tracking, colour and italic.
- **Do** identify errors in text, never by colour alone (WCAG 3.3.1).
- **Don't** add success or warning colours until a state is actually designed.

## Open questions

**Mobile prose leading is the one that is not small.** Every prose measure roughly halves at 360
while the type barely moves — the hero statement runs 43 characters on desktop and 19 on mobile,
descriptions 50 → 33, paragraphs 46 → 31. `body`'s 1.8 was derived for **~67 characters**. At 31–33
it is squarely in the 1.5 register, which is precisely the `body-compact` diagnosis now applying to
ordinary body text across the whole mobile page.

The hero has been corrected and body has not, because the correction is expensive in Figma but free
in CSS — a media query on a custom property costs nothing, while Figma cannot hold leading as a
ratio in a variable and overriding it on a node severs the text style along with its size binding.
The likely answer is to leave Figma at 1.8 and express the correction only in CSS. **But that breaks
the diffability the two systems are built for, so it deserves a decision rather than a drift.**

**`border-control` sits at 1.91 where 1.4.11 wants 3:1 on a control boundary.** It was originally
specified at `neutral-600` (3.85) precisely to meet that threshold, and now resolves to
`neutral-400`, chosen for how the chips read. The Figma file is the source of truth for colour
roles, so that is the value; this records the consequence rather than disputing it. Two places
surface it in the build: the unselected chip at rest, and every form input. **`neutral-600` is the
lightest step that would clear 3:1** if it is revisited.

**The margin does not survive intermediate widths.** The CSS rule is "cap content at 996, let
margins absorb the remainder, floor 16," which gives 222 at 1440, **105 at 1206**, and 16 below about
1028. The token is a fixed 222, so the two agree at 1440 and at 360 and disagree everywhere between.
The first real tablet frame will need either its own mode or hand-set margins. Still the one known
hole.

**Smaller, none blocking:**

- **Custom form-validation messaging.** Native validation bubbles cannot be styled, so the error
  tokens cannot actually be used until this is designed. This is the real blocker on the error
  state, not the colours.
- **The chip pressed tint reads closer to selected than the original rationale allowed.** Pressed is
  `blue-400`, which is **1.39** against the accent where the rationale was written for `blue-300` at
  1.86. Both label pairings pass (4.62 and 6.17), so this is a legibility-of-state question, not a
  contrast one.
- **Whether card titles get an underline.** Not required; see Links.
- **Hover transition conventions have not converged.** The defensible rule is 0.15s for controls and
  0.3s for cards — a control should feel immediate, a card can be languid — which leaves only the
  note card out of step.
- **`rhythm-list` (32) between unboxed note cards may be too tight.** Their hover boxes bleed 16px
  each side, so two adjacent hover targets sit 32 apart with 16px of box between them.
