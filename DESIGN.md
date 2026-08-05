# Design system — andyfitzgeraldconsulting.com

The repo-side source of truth for design tokens. This file is the counterpart to Andy's Figma
library: it should be diffable against the Figma variables, and the two are kept in sync
deliberately rather than by memory.

**Working rules live in [CLAUDE.md](CLAUDE.md), not here.** This file is reference material —
values and their rationale.

## The two-layer principle

The structure mirrors Figma exactly:

| Figma | CSS | Names |
|---|---|---|
| **Variables** | custom properties in `style/utilities/variables.css` | **values** (`--blue-700`, `--font-size-4`) |
| **Text / colour styles** | CSS rules in `style/base/typography.css` | **uses** (`--color-link`, `h2 { … }`) |

Two consequences that are easy to get wrong:

- **Primitives name values, never uses.** The old `--eyebrow-gray` broke this — it named a role
  while sitting in the primitive layer. It becomes `--color-text-muted` referencing a neutral step.
- **Don't make the semantic layer custom properties where it should be rules.** A Figma text style
  is a *bundle of applied properties*, so its CSS equivalent is a rule (`h2 { … }`), not a variable.
  Semantic *colour* tokens are the exception — a colour style really is a single value.

---

# Typography

Settled 2026-07-27. Comparison specimen: `scratchpad/type-scale-specimen.html`.

## Typefaces

| Token | Family | Duty |
|---|---|---|
| `--font-body` | **Noto Serif** (variable, 100–900) | running prose, lead paragraphs, captions, pull-quotes |
| `--font-display` | **Lato** (400, 700) | h1–h4, plus all metadata and UI: eyebrows, dates, nav, buttons, tags, pagination, sidebar links |

**Open Sans is dropped** — it was the previous body face, and removing it saves ~577 KB.

Undecided: whether `figcaption` stays italic serif (prose-adjacent) or moves to Lato (reads as
apparatus). Decide in the page mockups, not by default.

## Scale — 18px base, ratio 1.25 (major third)

Allocation "Option B", chosen over larger headings for a calmer reading surface. **Base revised
from 20px to 18px on 2026-07-28** after reading both at measure: 20px was too large, because Noto
Serif's big x-height makes it read larger than the number suggests.

| Step | Desktop | rem | Role | Leading |
|---|---|---|---|---|
| 1 | 16.00px | `1rem` | small / caption | 1.5 |
| 2 | 18.00px | `1.125rem` | **body**, and h4 | 1.6 body / 1.3 h4 |
| 3 | 22.50px | `1.40625rem` | lead paragraph **and h3** | 1.45 lead / 1.3 h3 |
| 4 | 28.125px | `1.7578125rem` | h2 | 1.25 |
| 5 | 35.16px | `2.197265625rem` | *(spare — see below)* | 1.2 |
| 6 | 43.95px | `2.7465820313rem` | h1 | 1.1 |

**Step 1 is a clamped floor, not on the ratio.** 18 ÷ 1.25 is 14.4px, below the 16px legibility
minimum for captions. And the ratio can't be lowered to fix it: keeping step 1 ≥ 16 from an 18 base
caps the ratio at 1.125, which would put step 6 at 28.8px and leave no display size at all. So steps
2–6 follow the ratio and step 1 is held at 16 deliberately.

Consequence: body:small compresses from 1.25 to **1.125**, so captions read as slightly-smaller body
rather than clearly subordinate. They lean on the muted colour and italic instead.

Ratios above body are unchanged: h1:h2 = 1.5625, h2:h3 = 1.25, h3:body = 1.25. (The old hand-picked
h2:h3 was **1.14** — too close to read as a hierarchy at all.)

Ugly values like `1.7578125rem` are correct and intentional. They're referenced by name and never
retyped, and keeping them exact means the scale stays regenerable if the base or ratio changes.

**Step 5 is genuinely spare and has an obvious first claimant:** a `Display` role for hero
statements that are not document titles — the home-page topline is exactly that. It was named
`Display` in Figma initially and renamed to `H1`, because a `Display` style cannot exist without an
`H1` when there is only one style at the top of the scale. If a distinct hero treatment is wanted
later, step 5 is where it belongs.

## Leading — three registers, each tightening as size grows

```css
/* prose — running copy at 60–75 characters */
--leading-prose-1: 1.5;    /* 16px    small / caption */
--leading-prose-2: 1.6;    /* 18px    body            */
--leading-prose-3: 1.45;   /* 22.5px  lead            */

/* statement — prose-like, but large and short-measure (~50 chars) */
--leading-statement: 1.4;  /* 35.16px Display / hero  */

/* heading */
--leading-head-2: 1.3;     /* 18px     h4 */
--leading-head-3: 1.3;     /* 22.5px   h3 */
--leading-head-4: 1.25;    /* 28.125px h2 */
--leading-head-5: 1.2;     /* 35.16px  — unused; Display uses --leading-statement */
--leading-head-6: 1.1;     /* 43.95px  h1 */
```

**Why a third register exists.** The two original ramps encode two situations: small/UI text, and
running prose at 60–75 characters. A hero statement is neither — it is prose in register but large,
two or three lines, and at roughly 50 characters. Extrapolating the prose ramp to step 5 gives ~1.25,
but that value is derived from 67-character body text; leading tracks measure, and a shorter measure
at a larger size wants less than body's 1.6 and more than a headline's 1.2. **1.35–1.5 is the
defensible zone; 1.4 is the chosen value.** Above ~1.5 the lines stop reading as one sentence.

For reference, the pre-existing hero had **no `line-height` at all** — `.home .topline p` set family,
size, weight and alignment and inherited body's `1.75`, giving 70px of leading at 40px. That is
outside the zone above, and explains why any principled value will feel tight by comparison.

- **Leading pairs with the size step, not the role.** Move a role to a different step and its
  correct leading moves with it. Never hard-code leading per role.
- **Prose and headings need separate ramps.** At the same 25px, a lead paragraph wants 1.45 and an
  h3 wants 1.30. One ramp cannot serve both.

## Tracking — a Lato-only adjustment

Verified against Figma 2026-07-28. The pattern that emerged is worth stating as a rule, because it
is simpler than per-style values:

| Applied to | Tracking | Styles |
|---|---|---|
| Lato at display sizes (28px+) | **−1.5%** | `H1`, `H2` |
| Lato as a small label | **+2%** | `H4`, `Eyebrow` |
| Lato, everything else | 0% | `H3`, `Masthead/Role`, `Nav` |
| **Noto Serif, every size** | **0%** | `Display`, `Lead`, `Body`, `Small`, `Masthead/Name` |

**The serif is never tracked.** `Display` was originally specified at −0.5%, scaled down from Lato's
−1.5% on the reasoning that "a serif needs less." That was directionally right but not a value derived
for Noto Serif at 35px, and it read as tight in use. Corrected to 0% on 2026-07-28. Three reasons it
is the better answer:

- Negative tracking compensates for spacing optimised for *reading* sizes, and only starts earning its
  keep above roughly 50–60px. At 35px a face is barely into display territory.
- Noto Serif descends from Droid Serif — built for screen legibility with deliberately generous
  spacing and open apertures. Tightening works against the face's own design and closes the counters.
- Serifs already create horizontal connection between letters, so they need less negative tracking
  than a geometric sans at the same size.

Positive tracking on `H4` is not decoration: it is one of the three signals (family + weight +
tracking) doing the work of the size step h4 doesn't have. See below.

## h4 — no size step left

h4 sits at body size (step 2) and differentiates by **family + weight + tracking**: Lato 700 with
`letter-spacing: 0.02em`. Below h3, size stops being a usable signal — any step small enough to sit
between h3 and body is too close to body to read as a heading.

If it reads as bold body text rather than a heading, the levers are uppercase, small caps, colour,
or a hairline rule — **not** a smaller size step.

## Roles beyond the content set

Added 2026-07-28 to bring the hero and the global chrome inside the system — they had been
hard-coded and were unaffected by any scale or mode change.

**The principle: sizes always come from the scale; styles may be component-specific.** A masthead is
wordmark-adjacent, so a dedicated style is legitimate. What is not legitimate is sitting outside the
*scale*, which is where it was.

| Style | Step | Desktop / Mobile | Font | Leading | Use |
|---|---|---|---|---|---|
| `Display` | 5 | 35.16 / 30 | Noto Serif **Medium** | 140% | hero statement |
| `Masthead/Name` | 4 | 28.125 / 25 | Noto Serif Regular | 110% | "Andy Fitzgerald" |
| `Masthead/Role` | 3 | 22.5 / 21 | **Lato** Regular | 130% | "Information Architect" |
| `Nav` | 2 | 18 / 17 | Lato Regular | 150% | nav, buttons, UI labels |

Twelve styles total — eight content roles plus four chrome roles. Deliberately *not* collapsed for
tidiness: `Masthead/Role` and `Nav` could merge if the descriptor dropped to step 2, but 18px under a
28px name reads as too much contrast in a lockup.

- **`Display` is the only place the serif carries display duty.** Confined to one hero statement it
  works without disturbing the Lato headings.
- **`Masthead/Role` is Lato, not the serif.** It was Open Sans before, so Lato preserves the sans feel
  and matches the nav beside it — letting it inherit the new serif body would have been a larger change.
- **`Nav` is Lato *Regular*** — distinct from `H4`, which is Lato Bold at the same step.
- **Proportions survived the base change:** the masthead name is 80% of `Display`, exactly the old
  32/40 relationship, and hero and name both moved −12% against H1's −10%.
- **The "AF" monogram (44px) is deliberately excluded.** It sits almost exactly on step 6, which is
  tempting, but it is a glyph inside a fixed-size circle — bind it to a fluid step and it resizes while
  its container does not. That is a graphic asset, not type.
- **Page titles take `H1`.** Nav labels are lowercase, page titles Title Case. A case-insensitive
  match wrongly gave "Ideas" and "Insights" the `Nav` style; corrected the same day. If applying styles
  by text content again, match case-sensitively.

**Outstanding for the CSS: the hero needs its own measure.** `--measure-prose: 66ch` resolves to
~1297px at 35.16px — wider than the page, so it would not cap anything. In Figma the hero is
container-constrained to 959px, which is fine for a mock but not a rule. To reproduce the current
~44 characters per line, `--measure-statement: 43ch` (≈843px at 35.16px). Decide by eye once it's in
CSS; the point is that it must be capped by something deliberate.

## Fluid sizing — per-step `clamp()`, 375px → 1200px

```
slope    = (S₂ − S₁) / (V₂ − V₁)
vw part  = slope × 100
rem part = (S₁ − slope × V₁) / 16
```

| Step | Mobile | Desktop | Declaration | rem share @1200 |
|---|---|---|---|---|
| 1 | 16 | 16 | `1rem` — static; 16px is the legibility floor | — |
| 2 | **17** | 18 | `clamp(1.0625rem, 1.0341rem + 0.1212vw, 1.125rem)` | 92% |
| 3 | 21 | 22.5 | `clamp(1.3125rem, 1.2699rem + 0.1818vw, 1.40625rem)` | 90% |
| 4 | 25 | 28.125 | `clamp(1.5625rem, 1.4737rem + 0.3788vw, 1.7578125rem)` | 84% |
| 5 | 30 | 35.15625 | `clamp(1.875rem, 1.7285rem + 0.625vw, 2.197265625rem)` | 79% |
| 6 | 32 | 43.9453125 | `clamp(2rem, 1.6606rem + 1.4479vw, 2.746582031rem)` | 60% |

**Reading sizes are now nearly flat, and that is the system.** Step 2 spans 1px (17→18) and step 3
spans 1.5px. So body and lead are effectively constant across viewports, and only display type is
meaningfully fluid. This is a deliberate position rather than drift — it followed from the 18px base,
since the mobile body floor was already 18 and had to drop to 17 to retain any range at all. They are
still written as `clamp()` so every step is uniform, and so the `rem`-dominance property holds.

Side benefit of the shallower ranges: the clamps are **more** `rem`-dominant than the 20px base was
(body 92% vs 85%), so a reader who raises their default font size gets closer to proportional growth.

**The preferred value must stay `rem`-dominant.** A purely `vw` preferred value does not respond to
a reader's browser font-size preference (text-only zoom, as distinct from page zoom), so their text
is locked. Measured at a simulated 24px default: `1.4vw` and `clamp(16px, 1.4vw, 20px)` both stayed
at **67%** of proportional — no growth at all. `clamp(1.125rem, 1.4vw, 1.25rem)` reached 90%, but
lumpily, via its bounds rather than its preferred value. The rem-dominant form reached **97%**.

Keep body ~85% rem-weighted. Display sizes scale harder and are therefore more `vw`-weighted, which
is acceptable for an h1 but never for reading text.

**Per-step clamps, not one fluid base × the ratio** — base 18px × 1.25⁴ would put a 44px h1 in a
343px column. Consequence: the ratio deliberately *compresses* on small screens (≈1.17–1.28 at
800px against a clean 1.25 at desktop). Intended, not drift.

## Measure

Target **60–75 characters**. `--measure-prose: 66ch` measures ~67 characters; 1ch ≈ 1.03 average
lowercase characters in Noto Serif. Noto Serif runs ~5% wider per lowercase character than the
outgoing Open Sans.

Because `ch` is font-relative, the 18px base changed the measure's *pixel* width but not its
character count: **~664px at 18px** where it was 738px at 20px, still ~67 characters either way. The
reading experience in characters is identical; the column is physically narrower and the page reads
airier. Reference widths for mockups: **664px at ≥1200px**, ~627px at the 375px mobile floor
(viewport-limited well before that in practice).

**Implement as `max-width` on the existing left-aligned grid items — not via a new container.**
`max-width` on a left-aligned grid item moves only its *right* edge, so measure can be capped with
zero layout disruption and no template change.

```css
article.detail :where(p, ul, ol, blockquote, figure) { max-width: var(--measure-prose); }
```

- Apply to prose elements **and** `figure` — both inherit the body font, so `ch` resolves
  identically and their edges align.
- **Not** on `figcaption`: its 16px font makes `ch` resolve narrower than its own image.
- Headings need a **separate** token if capped at all. `ch` resolves against each element's own
  font, so `66ch` on an h2 means 66 characters of Lato at 31px — far wider than intended.

Reference widths for mockups: **738px at ≥1200px**, **~699px at 768px**, viewport-minus-gutters
below ~700px.

---

# Colour

Settled 2026-07-28. Specimen with live contrast computation: `scratchpad/color-specimen.html`.

## Guardrails — the four rules that prevent every failure found so far

Every contrast failure measured in this project reduces to one of these. Hold these and the
detailed tables below become reference rather than something to check:

1. **The brand blue is never text.** `blue-500` / `color/accent` is for rules, fills and brand
   surfaces only. It fails even 3:1 on the tinted ground (2.82). Enforced structurally in Figma:
   `color/accent` is not scoped to `TEXT_FILL`.
2. **White text never sits on the brand blue.** 3.09 against a 4.5 requirement. White text is safe
   on `blue-900` (`color/link-strong`) and on `blue-700`.
3. **Never `neutral-600` for text.** It looks like a reasonable muted grey and fails AA on both
   surfaces (4.03 / 3.68). Muted text is always `neutral-700` (`color/text-muted`).
4. **Anything at 700 or darker passes on both surfaces.** `blue-700/800/900` and
   `neutral-700/800/900` all clear 4.5:1 on white cards *and* on the tinted ground, so they need no
   checking.

A novel pairing — one not in the tables below — is the only case that warrants actually measuring.
An in-canvas contrast plugin (Stark, Able) is the convenient way to do that while designing.

## Brand ramp — one hue, stepped by lightness

**Hue 197° / saturation 45%.** `#4e9dbc` is retained as the base: Andy has tuned it over years, and
any change to it is a separate future project.

The ramp formalises a relationship the palette already had — the existing `--dark-blue` `#1f4351`
is *generated exactly* by this hue at 22% lightness.

| Token | Hex | Lightness | vs card | vs ground | Role |
|---|---|---|---|---|---|
| `--blue-500` | `#4e9dbc` | 52% | 3.09 large | **2.82 fail** | brand accent: rules, fills, brand surfaces |
| `--blue-600` | `#3e86a3` | 44% | 4.08 large | 3.73 large | — |
| `--blue-700` | `#326e85` | 36% | 5.67 AA | 5.18 AA | **link hover**, selected toggle fill |
| `--blue-800` | `#275568` | 28% | 8.12 AA | 7.43 AA | strong text |
| `--blue-900` | `#1f4351` | 22% | 10.61 AA | 9.70 AA | CTA background, lead paragraph |

**Hard constraint, tightened 2026-07-28: on the tinted ground, `--blue-500` is not a text colour at
all.** It fails even the 3:1 large-text threshold there (2.82). It scrapes past on a white card
(3.09), but since article pages have no cards, treat it as **never text** — rules, fills and brand
surfaces only. White text can never sit on it either (3.09 against 4.5).

This is why card titles are `--neutral-900`, not blue, and why a selected filter toggle uses
`--blue-700` as its fill (white on it = 5.67) rather than `--blue-500` (3.09).

`#479FD5` was evaluated as an alternative base and rejected — at 2.89 on white it fails *even* the
3:1 large-text threshold, so it could never be coloured text at any size. Its darker steps are
marginally better than hue A's (700 = 5.90 vs 5.62), so it remains a viable hue if revisited, but it
would also require replacing `--dark-blue`.

## Two surfaces

Decided 2026-07-28. **The page ground is a tinted off-white; raised elements are pure white.** This
lets cards and toggles read as raised *without drop shadows*, which suit a typography-driven page
badly, and a tinted ground is easier on the eye than pure white for long reading.

| Role | Token | Hex | |
|---|---|---|---|
| page ground | `--color-bg` → `--neutral-100` | `#f9fafb` | |
| raised surface — cards, toggles, panels | `--color-surface` | `#ffffff` | separation **1.045** |
| hairline border | `--color-border` → `--neutral-300` | `#d2d5d6` | **1.41** on bg, 1.48 on card |

**The border carries the card boundary, not the fill difference.** Revised 2026-07-28. The ground
moved from `#f3f5f6` to `#f9fafb`, halving the card/ground separation from 1.094 to **1.045** — two
lightness points, at the edge of perceptibility. That is acceptable *because cards have borders*, and
`--color-border` measures 1.41 against the ground, slightly better than before. An earlier version of
this file argued the fill separation was load-bearing; it isn't, given the borders. The caveat: a
**borderless** card would not be distinguishable on its own, so borders are not optional decoration.
Unboxed notes sit directly on the ground by design and need no boundary.

All text contrast improved slightly with the lighter ground: text 18.04, muted 6.78, link-hover 5.42,
error-text 5.48 — all pass. `--blue-500` went 2.79 → 2.92, still failing 3:1, so the never-text rule
is unchanged.

### Why the ground's hue is nominal

`#f9fafb` measures 210°, not the brand's 197°, and **that distinction is not representable.** At 98%
lightness the colour spans 2 units of 255 per channel (249/250/251); 197° and 210° quantize to the
identical hex. Verified 2026-07-28.

Consequence for anyone tempted to "fix" it: **a perceptibly brand-tinted ground needs lightness at
~95% or below**, where the channel span widens to 4–5 units and hue becomes encodable. At 92% you get
8 units. Above ~97% the hue label is aspirational.

This also corrects an earlier claim in this file: the neutral ramp's apparent hue "drift to 180° at
the light end" was **quantization noise, not construction drift** — at 2–3 units of span the computed
hue is meaningless. The ramp's light end was never faulty, and `off-white` never needed to exist as a
separately hue-locked primitive. It has been folded back into `neutral/100` and deleted.

This **inverts** the earlier arrangement, where white was the ground and `neutral-100` was a panel
fill. The inversion is the more useful one and is what Andy's Figma explorations arrived at.

**Everything must now be verified against both surfaces.** A colour can pass on a white card and
fail on the ground — see the blue ramp above, where `blue-500` passes large text on a card (3.09)
and fails it on the ground (2.82).

**`--neutral-100` is set directly rather than taken from the mix**, but the reason is narrower than
an earlier version of this file claimed. Mixing `#051319` toward white does desaturate as it
lightens — that part is real. What is *not* real is the "hue drift": see "Why the ground's hue is
nominal" above. At these lightnesses hue is not measurable, so the light end of the ramp was never
broken. `--neutral-100` is simply the value Andy chose by eye (`#f9fafb`), recorded as the ground.

**Semantic naming: `--color-surface`, not `--color-card`.** "Surface" names a *position in the
layering* — the raised plane — rather than a component. One token then legitimately serves cards,
filter toggles, panels and overlays, and it scales to `surface-raised` for a second elevation.
`--color-card` would repeat the `--eyebrow-gray` error one layer up: naming a component where a role
belongs. The filter toggles are the proof — raised, but not cards. (`--color-bg-raised` is the
alternative if "surface" reads as jargon; it pairs more obviously with `--color-bg`.)

## Neutral ramp — steps 200–900 derived from `--black`

Replaces three unrelated hand-picked greys (`#777676`, `#646464`, `#2b2b2b`) and an orphan
`rgba(43,40,40,.1)`. `--black` `#051319` sits at **198°** — essentially the brand hue already — which
is why it was kept over Figma's `#121923` (215°). Mix target is pure `#ffffff`.

| Token | Hex | vs card | vs ground | Body 4.5 both | Role |
|---|---|---|---|---|---|
| `--neutral-900` | `#051319` | 18.86 | 17.24 | ✅ | primary text, card titles |
| `--neutral-800` | `#283439` | 12.80 | 11.71 | ✅ | — |
| `--neutral-700` | `#505a5e` | 7.08 | 6.48 | ✅ | muted text: captions, eyebrow, metadata |
| `--neutral-600` | `#788083` | 4.03 | 3.68 | ❌ | large text only |
| `--neutral-500` | `#969c9e` | 2.78 | 2.54 | ❌ | non-text only |
| `--neutral-400` | `#b4b8ba` | 2.00 | 1.83 | ❌ | — |
| `--neutral-300` | `#d2d5d6` | 1.48 | 1.35 | ❌ | borders |
| `--neutral-200` | `#e9eaea` | 1.21 | 1.10 | ❌ | subtle fills |
| `--neutral-100` | `#f9fafb` | 1.05 | — | ❌ | **page ground** (hue nominal — see above) |

**Use 700, not 600, for anything at body size or smaller.** 600 looks like a reasonable "muted text"
value and fails AA on both surfaces — exactly the trap documented thresholds exist to catch.

## Error state

Added 2026-07-28. Derived from the existing `--alert-text` `#cc4b37`, which sits at **hue 8°**.

Worth knowing: the old `--alert-bg` / `--alert-text` pair is **declared in `variables.css` and used
nowhere** — not in any stylesheet or template. So this is not a colour being corrected; it is a state
that was never designed. The contact form relies on native browser validation (`required`
attributes) plus a `recaptchaError` callback, and native validation bubbles cannot be styled — so a
designed error state also needs custom validation messaging, which is a design and JS decision, not
just a token.

| Token | Hex | Role |
|---|---|---|
| `--error-100` | `#f9e9e7` | panel background |
| `--error-500` | `#cc4c38` | border, filled state |
| `--error-600` | `#b33f2e` | message text |

| Pair | Ratio | Needs | |
|---|---|---|---|
| `error-600` text on `error-100` panel | 4.86 | 4.5 | ✅ |
| `error-600` text on white card | 5.73 | 4.5 | ✅ |
| `error-600` text on ground | 5.24 | 4.5 | ✅ |
| `error-500` border on `error-100` | 3.83 | 3.0 | ✅ |
| white on `error-500` | 4.51 | 4.5 | ✅ |

Note `error-500` itself is **not** a text colour on the ground (4.16) — use `error-600` for text.
The old pair measured 3.70 and failed.

**Success and warning tokens are deliberately omitted.** There is no designed use for them: the
contact-success page is typographic (`.success` uses the serif at 2rem, no colour), and nothing
warns. The old alert tokens sat unused for years — don't repeat that. Add them when a state is
actually designed. Per WCAG 3.3.1, errors must be identified in **text**, never by colour alone.

## Semantic roles

```css
:root {
  /* surfaces */
  --color-bg:          var(--neutral-100);   /* page ground, tinted */
  --color-surface:     #ffffff;              /* raised: cards, toggles */
  --color-border:      var(--neutral-300);

  /* text */
  --color-text:        var(--neutral-900);   /* body, card titles */
  --color-text-muted:  var(--neutral-700);   /* captions, eyebrow, dates */

  /* brand */
  --color-accent:      var(--blue-500);      /* rules and fills ONLY — never text */
  --color-link-hover:  var(--blue-700);
  --color-link-strong: var(--blue-900);      /* lead paragraph, CTA background */

  /* error */
  --color-error-bg:    var(--error-100);
  --color-error-line:  var(--error-500);
  --color-error-text:  var(--error-600);
}
```

`--eyebrow-gray` dissolves into `--color-text-muted`, which is what it was always trying to be.
The old `--white` `#fefefe` is retired in favour of pure `#ffffff` for the raised surface.

## Links

**Inline links in prose:** body text colour with a persistent underline; `--blue-700` on hover. The
existing approach, deliberately kept — because the underline rather than colour carries the
affordance, it satisfies WCAG 1.4.1 (Use of Colour), which a coloured-text link does not. Both states
pass on both surfaces: 18.86 / 17.24 at rest, 5.67 / 5.18 on hover.

**Block-level link titles (card titles, list headings): `--neutral-900`, no underline required.**
Decided 2026-07-28. WCAG 1.4.1 governs links being distinguishable *from surrounding text*, which is
an inline problem; a title in its own block at heading size is identified as a link by position and
context. So "underline in prose, none on card titles" is principled rather than a compromise. Andy's
read was also that dark titles quiet the page down, which they do.

This replaced blue card titles, which had a subtler problem than they appeared to: the same blue
title **passes on a white card and fails on the ground**, so unboxed note titles failed while boxed
article titles scraped by. Dark titles pass everywhere at any size.

## Known colour problems to resolve in the design phase

- **Footer is white-on-`--blue` at every viewport** — 3.06 against a 4.5 requirement. The 16px
  `.copyright` and its links are the clearest failure; `.description` (20px/500) and `.menu`
  (20px/600) also fail. Social icons pass as non-text UI at 3.06 vs 3.0, barely.
- **Mobile nav is white-on-`--blue`** below 60rem — same 3.06. Above 60rem the header is white with
  dark text and is fine, so this one is mobile-only.
- Dark text on `--blue-500` does pass (6.11), but Andy doesn't like the look. Alternatives to be
  explored in Figma for both nav and footer.
- ~~`--alert-text` on `--alert-bg` is 3.70~~ — **resolved** by the error set above. Both old tokens
  were dead anyway (declared, never referenced), so they should be deleted rather than fixed.
- `.social a:hover` sets `fill: var(--blue)` on a `var(--blue)` footer background, so the icon fill
  goes to exactly background colour and only the white stroke remains. Confirm this outline effect
  is intentional.

---

# Figma authoring conventions

Andy upgraded to **Professional** on 2026-07-28, unlocking variable **modes** (up to 4 per
collection). The mobile/desktop duplication that the Starter plan forced has been collapsed.

**Three collections, and the mode axes are kept deliberately separate:**

| Collection | Contents | Modes |
|---|---|---|
| `Primitives` | 18 raw colours — `blue/*`, `neutral/*`, `error/*`, `white` | single (`Value`) |
| `Semantic` | 11 colours that **alias** primitives — `color/bg`, `color/text`, … | single (`Value`) |
| `Type Scale` | 6 font sizes `size/1`–`size/6` | **`Desktop` / `Mobile`** |

**Sizes live in their own collection on purpose.** Modes are per-collection, so putting a Mobile
mode on `Primitives` would give all 18 colours a meaningless second mode. More importantly viewport
and *theme* are orthogonal axes — if light/dark is ever wanted, it belongs on the colour collections
independently, and Professional allows both.

**How the mode is used:** select a frame and set its `Type Scale` mode to `Mobile`; every text style
inside resizes, because the styles bind to `size/N` rather than to a fixed number. `Desktop` is the
default mode, so a new frame gets desktop sizes unless told otherwise — worth remembering when
starting a 375px artboard.

**One set of text styles, viewport-agnostic:** `Display`, `H2`, `H3`, `H4`, `Lead`, `Body`, `Small`,
`Eyebrow`. No `Desktop/` or `Mobile/` prefix — the viewport is a mode, not a style. Each binds
`fontSize` to its `size/N` variable.

**Leading and tracking are percentages in Figma, not px.** CSS unitless `line-height` is exactly a
percentage of font size, so `1.6` → `160%`, `1.45` → `145%`, `1.3` → `130%`, `1.25` → `125%`,
`1.1` → `110%`; tracking `-0.015em` → `-1.5%` and `0.02em` → `2%`. Because they are size-relative
they need no per-mode values at all — which is why only the six sizes are mode-aware.

**Figma cannot express `clamp()`.** Its two modes hold the endpoints; the interpolation lives in CSS.
`size/N` in `Desktop` mode is the 1200px end, in `Mobile` mode the 375px floor, and one fluid
`--font-size-N` token spans them.

## Figma build state

The tokens in this file were written into Figma over the MCP on 2026-07-28 (file
`pPZPGT6EpSaLkoUDK8HMMp`). What exists now:

| Built | Detail |
|---|---|
| `Primitives` collection | 18 colour variables (`blue/500–900`, `neutral/100–900`, `error/100·500·600`, `white`), scoped `ALL_FILLS` + `STROKE_COLOR`, each carrying its CSS name via `setVariableCodeSyntax('WEB', …)` |
| `Semantic` collection | 11 colour variables **aliased** to primitives, scoped per role |
| `Type Scale` collection | 6 `FLOAT` variables `size/1–6`, scoped `FONT_SIZE`, modes `Desktop` (default) / `Mobile`. Holds the **18px base** as settled: desktop 16 / 18 / 22.5 / 28.125 / 35.15625 / 43.9453125, mobile 16 / 17 / 21 / 25 / 30 / 32. Exact fractional values preserved. |
| Text styles | **12**, viewport-agnostic — 8 content roles (`H1`, `H2`, `H3`, `H4`, `Lead`, `Body`, `Small`, `Eyebrow`) plus 4 chrome roles (`Display`, `Masthead/Name`, `Masthead/Role`, `Nav`). Leading and tracking as percentages; `fontSize` bound to `size/N`, so a base change propagates to every style without editing any of them |
| Audit 2026-07-28 | All 12 styles verified against this file: fonts, bound variables, resolved sizes, leading and tracking all match. Only divergence found was `Display` tracking, which Andy relaxed −0.5% → 0%; this file now records 0% as correct. |
| Migrations completed | 23 nodes off the remote `font-size/body`; 33 nodes off remote `blue-500` / remote `white-100` / legacy `bg/primary` / `card/hover border`; 4 nodes off the remote `Heading/1` and `Heading/2` styles onto local `H2`/`H3`; 17 style-less nodes onto mode-aware `size/2`. Every pass verified at zero remaining references. |
| Removed | legacy `Variable collection` and its 4 orphans; `body/default`; the 8 `Mobile/*` text styles (verified unused); the 12 `size/desktop/*` + `size/mobile/*` variables superseded by modes |

**`color/accent` is deliberately NOT scoped to `TEXT_FILL`.** That makes the "never text" contrast
constraint structural — Figma will not offer the brand blue in a text-colour picker.

### Outstanding

1. **Unsubscribe the remote library.** As of 2026-07-28 there are **no remaining references** to any
   remote variable or text style — `Heading/1` and `Heading/2` were the last two, and their 4 nodes
   now use local `H2`/`H3`. Removing the library should now be clean. Verify no remote *components*
   are in use first (the audit script pattern is in the session history).
2. **The filter-toggle labels and note-card descriptions** (17 nodes) carry a direct `size/2` binding
   with no text style applied, so they keep their own font and leading. Applying `Body` would change
   their appearance — the toggles in particular are Lato UI labels, not prose. Leave them until the
   design phase decides what those roles are.

### Remote library variables — the thing to know

The file was subscribed to a remote library ("Collection 1"), and three variables came from it:
`font-size/body`, `blue-500`, and a *second* `white-100` distinct from the local one. **Remote
variables cannot be edited or deleted from this file** — they only disappear once nothing references
them. That is why the migration re-pointed bindings rather than overwriting values. Same for
`Heading/2`. If new remote tokens reappear, check the file's library subscriptions.

For the record: with Figma's previous `#479fd5`, `blue-500` failed even the 3:1 large-text threshold
(2.80), so headings designed in that blue could not have shipped.

The Figma file is currently named "AndyFitzgerald.net"; the domain change is off, so the name is
misleading and worth changing.

# Still open

- Whether `figcaption` stays italic serif or moves to Lato.
- Nav and footer treatments on the blue background.
- Whether card titles get an underline. Andy is experimenting; not required (see Links).
- Custom form-validation messaging, needed before the error state can actually be used, since native
  validation bubbles can't be styled.
- Grid, page templates, and layout — deliberately **not** decided here. See CLAUDE.md: typography
  must not drive grid decisions, and layout gets discussed against the whole page inventory.
