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
| **Variables** | custom properties in `style/utilities/variables.css` | **values** (`--blue-500`, `--font-size-4`) |
| **Text / colour styles** | CSS rules in `style/base/typography.css` | **uses** (`--color-link`, `h2 { … }`) |

Two consequences that are easy to get wrong:

- **Primitives name values, never uses.** The old `--eyebrow-gray` broke this — it named a role
  while sitting in the primitive layer. It becomes `--color-text-muted` referencing a neutral step.
- **Don't make the semantic layer custom properties where it should be rules.** A Figma text style
  is a *bundle of applied properties*, so its CSS equivalent is a rule (`h2 { … }`), not a variable.
  Semantic *colour* tokens are the exception — a colour style really is a single value.

---

# Typography

Settled 2026-07-27. Comparison specimen: `web/__design-specimens/type-scale-specimen.html`.

## Typefaces

| Token | Family | Duty |
|---|---|---|
| `--font-body` | **Noto Serif** (variable, 100–900) | running prose, lead paragraphs, captions, pull-quotes |
| `--font-display` | **Lato** (400, 700) | h1–h4, plus all metadata and UI: eyebrows, dates, nav, buttons, tags, pagination, sidebar links |

**Open Sans is dropped** — it was the previous body face, and removing it saves ~577 KB.

**Resolved 2026-08-06: `figcaption` is italic serif.** Decided from the Case Study mockup rather than
in the abstract — see the `Caption` style below.

## Scale — 18px base, ratio 1.25 (major third)

Allocation "Option B", chosen over larger headings for a calmer reading surface. **Base revised
from 20px to 18px on 2026-07-28** after reading both at measure: 20px was too large, because Noto
Serif's big x-height makes it read larger than the number suggests.

| Step | Desktop | rem | Role | Leading |
|---|---|---|---|---|
| 1 | 16.00px | `1rem` | small / caption | 1.5 |
| 2 | 18.00px | `1.125rem` | **body**, and h4 | 1.8 body / 1.3 h4 |
| 3 | 22.50px | `1.40625rem` | lead paragraph **and h3** | 1.6 lead / 1.3 h3 |
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

## Leading — three registers, set by measure and size together

```css
/* prose — indexed by MEASURE, not by size. Two roles can share a
   size step and still need different leading; see Body Compact below. */
--leading-prose-1: 1.5;    /* short   ~29–33 chars   Small (16), Body Compact (18) */
--leading-prose-2: 1.8;    /* full    ~67 chars      Body (18)                     */
--leading-prose-3: 1.6;    /* medium  ~54 chars      Lead (22.5)                   */

/* statement — prose-like, but large and short-measure (~50 chars) */
--leading-statement: 1.4;  /* 35.16px Display / hero  */

/* heading */
--leading-head-2: 1.3;     /* 18px     h4 */
--leading-head-3: 1.3;     /* 22.5px   h3 */
--leading-head-4: 1.25;    /* 28.125px h2 */
--leading-head-5: 1.2;     /* 35.16px  — unused; Display uses --leading-statement */
--leading-head-6: 1.1;     /* 43.95px  h1 */
```

**Body revised 1.6 → 1.8 on 2026-08-06**, and `Lead` 1.45 → 1.6 as a consequence. 1.6 read tight in
use, which is not surprising: the outgoing site set `line-height: 1.75` and that is what the eye is
calibrated against. Two things independently justify the top of the range here — Noto Serif's large
x-height (the same property that forced the 20 → 18px base) puts more visual mass on every line, and
67 characters is a long measure, where leading is what keeps the return sweep accurate. **Above about
1.85 at this measure the lines begin to disassociate**, so 1.8 is near the ceiling rather than in the
middle, and there is no headroom left above it.

`Lead` had to move with it. At 22.5px × 1.45 the line box is 32.6px against body's new 32.4px — a
paragraph 25% larger in type with effectively the *same* line box, which reads tight. 1.6 puts it at
36px. The drop from body's 1.8 is justified by measure, not size: at 22.5px the 656px column holds
~54 characters against body's ~67.

**Why a third register exists.** The two original ramps encode two situations: small/UI text, and
running prose at 60–75 characters. A hero statement is neither — it is prose in register but large,
two or three lines, and at roughly 50 characters. Extrapolating the prose ramp to step 5 gives ~1.25,
but that value is derived from 67-character body text; leading tracks measure, and a shorter measure
at a larger size wants less than body's 1.8 and more than a headline's 1.2. **1.35–1.5 is the
defensible zone; 1.4 is the chosen value.** Above ~1.5 the lines stop reading as one sentence.
Re-checked against the 1.8 body on 2026-08-06 and unchanged — the statement register is short-measure,
so loosening body does not pull it up.

For reference, the pre-existing hero had **no `line-height` at all** — `.home .topline p` set family,
size, weight and alignment and inherited body's `1.75`, giving 70px of leading at 40px. That is
outside the zone above, and explains why any principled value will feel tight by comparison.

- **Leading pairs with the measure, not the size step.** *(Corrected 2026-08-06 — this rule
  previously read "leading pairs with the size step, not the role," which is false in this system.
  See Body Compact below.)* The step is only a **proxy** for measure, and it holds exactly as long as
  one step means one column width. The moment the same step appears at two measures, the proxy breaks
  and the step-based rule gives the wrong answer.
- **Prose and headings need separate ramps.** At the same 22.5px, a lead paragraph wants 1.6 and an
  h3 wants 1.30. One ramp cannot serve both.
- **The prose ramp is not monotonic, and that is correct.** 1.5 → 1.8 → 1.6 looks wrong until you read
  it as a measure ramp rather than a size ramp. Short measures need little; body at the full
  67-character column needs the most; the lead is larger type in the same column, so it holds fewer
  characters and needs less again.

## `Body Compact` — the same step at a different measure

Added 2026-08-06. **Noto Serif Regular, `size/2` (18px), 150%, 0% tracking.** The thirteenth text
style, and the one that disproved the old step-based rule.

A card description sits in `316 − 32 = 284px`, which at 18px Noto Serif is about **29 characters**.
`Body`'s 1.8 was derived for **~67**. Running it at less than half its intended measure reads as
conspicuously airy — the lines drift apart because the eye has almost no horizontal distance to
travel between them.

| | Style | Line box | Card height | Chars/line |
|---|---|---|---|---|
| before | `Body` 18 / 180% | 32.4 | 374 | 29 |
| considered | `Small` 16 / 150% | 24 | 318 | 33 |
| **chosen** | **`Body Compact` 18 / 150%** | **27** | **354** | **29** |

`Small` was the zero-cost option and was tried first — it fixes the leading *and* widens the measure
by dropping to 16px. It was rejected by eye: card copy reads as reading matter, not as a caption.
`Body Compact` changes only the thing that was actually wrong.

**The control that confirms the diagnosis:** the *horizontal* card variants are 370px wide — about 41
characters — and their descriptions already fit in three lines. Switching styles moved their height
by **zero**. Only the narrow measure was ever suffering, which is what a measure-driven rule predicts
and a size-driven one does not.

**When to reach for it:** prose in a column too narrow for `Body`. Card descriptions today; the Home
Notes column and anything else at roughly 30 characters. **Never for running prose** — at the full
measure it is too tight, which is the whole reason `Body` sits at 1.8.

## `Caption` — and the italic Figma cannot draw

Added 2026-08-06, resolving the open `figcaption` question. **Noto Serif Italic, `size/1` (16px),
150%, 0% tracking, paired with `color/text-muted`.** The fourteenth text style.

**Italic serif, not Lato.** A caption under a figure reads as part of the reading matter, not as
apparatus around it. The italic and the muted colour do the subordinating that the size step can no
longer do on its own — body:small compresses to 1.125 on this scale, so 16px alone barely reads as
subordinate to 18px body.

**In Figma the style is roman, and that is a tooling limit, not a decision.** Figma's `Noto Serif`
offers **72 styles — every weight, every width, plus the Display optical size — and not one italic**,
and there is no separate `Noto Serif Italic` family. For contrast, Figma's `Noto Sans` carries 144
styles *including* italics, so this is specific to the serif. The site is unaffected:
`NotoSerif-Italic-VariableFont_wdth,wght.woff2` already ships and `style/base/fonts.css` declares it
at `font-style: italic`, so CSS renders the intended face. To close the gap in Figma, install Noto
Serif Italic as a **system font** — the repo's `.woff2` cannot be installed, so it needs the TTF from
Google Fonts — after which the style's `fontName` is a one-line change and every caption follows.

The Figma style's description carries this caveat, so a future reader does not mistake the roman for
an intention.

**A caption is not automatic.** Case Study's screenshots are documentary and earn one; Singleton's
photograph of Andy working is illustrative and does not. The figure structure is the same either way
— see Vertical rhythm → *Figures and captions*.

## `Label` — renamed from `Eyebrow`, 2026-08-07

**Lato Bold, `size/1` (16px), 150%, +2% tracking.** Unchanged in every value; only the name moved.

The rename came from the contact form. Form labels had been set in `H4`, and the question was whether
the system needed a new size for them. It did not — and could not: **step 1 is a clamped floor at 16px**
(see Scale), so there is no smaller step and there will never be one. What was missing was a *role*, and
the role already existed under a name that described where it sat rather than what it was.

**"Eyebrow" named a position; the style's job is a quality.** This is the same correction as
`rhythm/pair` → `rhythm/tight` — that name broke the moment the value was wanted for a list of eight
tags, and this one broke the moment the same treatment was wanted below an input instead of above a
title. One style now serves both: the kicker over a page title, and a form field label.

**Why not `H4`, which the form was using.** `H4` is a *content heading* role that exists only because no
size step remains below h3 (see *h4 — no size step left*), and it already appears in published article
prose. A UI label borrowing it would conflate document structure with chrome, and the two would diverge
the first time h4 is tuned for reading. There is also a plain typographic argument: at 18px the label
competes with the value the reader types into the field. 16 sits it below.

**Why not a second style at the same values.** A `Label` alongside an unchanged `Eyebrow` would be two
styles indistinguishable in the picker — precisely the collision that has already produced one wrong
binding in the spacing roles. Identical values mean one style.

The rename carried 73 existing uses automatically, since renaming a style edits no nodes.

## Tracking — a Lato-only adjustment

Verified against Figma 2026-07-28. The pattern that emerged is worth stating as a rule, because it
is simpler than per-style values:

| Applied to | Tracking | Styles |
|---|---|---|
| Lato at display sizes (28px+) | **−1.5%** | `H1`, `H2` |
| Lato as a small label | **+2%** | `H4`, `Label` |
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

**Fourteen styles total** — ten content roles (the eight above plus `Body Compact` and `Caption`) and
four chrome roles. Deliberately *not* collapsed for tidiness: `Masthead/Role` and `Nav` could merge if
the descriptor dropped to step 2, but 18px under a 28px name reads as too much contrast in a lockup.

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

**The hero statement takes no measure cap at all, and that is deliberate.** It fills the content column
— `grid/margin` on the band, `FILL` on the statement — giving **996px, about 52 characters** at
35.16px, which is already what `--leading-statement: 1.4` was derived for (*"roughly 50 characters"*).
A cap would move it *away* from the point its own leading was designed around. Note also that
`--measure-prose: 66ch` resolves to ~1297px at 35.16px, wider than the page, so applying it would cap
nothing.

**The Hero band uses `rhythm/band` (64), not `rhythm/section`.** Both were tried; 96 read as too much
air above a three-line statement. Worth recording because the Hero is a coloured, self-contained
region like Topics and Connect, which *do* take `section` — so the band/section split is decided by
how the band reads, not by a structural rule alone.

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

On the 996px grid the measure is delivered by the **column span, not the cap**: 8 of 12 columns is
**656px ≈ 67 characters**, inside the target. The `max-width` rule above is therefore a safety net
for any context wider than 8 columns, not the primary mechanism.

---

# Grid

Settled 2026-08-06 and tokenized in Figma the same day.

## Grid owns horizontal, rhythm owns vertical

The rule that decides most spacing questions. A gap between columns is a *grid* relationship, not a
rhythm value, and tokenizing it in both places lets the two drift. Consequences:

- Column gaps, page margins and the one-column skip all come from `grid/*`.
- **Horizontal *extents* are the grid's business; rhythm has none.** The `WIDTH_HEIGHT`-scoped tokens
  are `grid/column`, `grid/span-3`, `grid/span-4` — and, since 2026-08-07, `field/height`. *(An earlier
  version of this line claimed `grid/column` was the only one, which was never true of the span tokens.)*
  The rule is about horizontal extents, not about the `WIDTH_HEIGHT` scope as such: **a component's own
  intrinsic height is a component internal**, like `card/pad`, and has nothing to do with the grid. See
  `field/*` under Vertical rhythm → Roles.
- Every `space/*` and `rhythm/*` variable is scoped `GAP` only, which makes the rule structural —
  Figma will not offer a rhythm token where a width belongs.
- A wrapped column's *row* gap is vertical, so it is rhythm, not grid: use `rhythm/heading-major`,
  because what lands below starts with a heading.

## The grid

**12 columns, 996px content, 222px margins at 1440.** Detail-page prose is **8 columns = 656px**;
the right rail is `col 10 / span 3`, one skipped column away.

| Token | Desktop | Mobile | Scope |
|---|---|---|---|
| `grid/margin` | 222 | 16 | `GAP` |
| `grid/gutter` | 24 | 8 | `GAP` |
| `grid/column` | 61 | 20 | `WIDTH_HEIGHT` |
| `grid/skip-1` | 109 | 36 | `GAP` |
| `grid/skip-2` | 194 | 64 | `GAP` |
| `grid/span-3` | 231 | 328 | `WIDTH_HEIGHT` |
| `grid/span-4` | 316 | 328 | `WIDTH_HEIGHT` |

Both ends close exactly: `2×222 + (12×61 + 11×24) = 1440`, and `2×16 + (12×20 + 11×8) = 360`.
`count` is 12 in both modes and needs no token.

### The skip family — gaps that jump columns

| | Formula | Desktop | Splits it serves |
|---|---|---|---|
| `grid/skip-1` | column + 2 × gutter | 109 | **asymmetric**: 8+3 (Insight Detail), 7+4 (Home, Topics) |
| `grid/skip-2` | 2 × column + 3 × gutter | 194 | **symmetric**: 5+5 (Connect), and 6+4 (Footer) |

**A 12-column grid offers only three symmetric two-column layouts**, because the gap must be a whole
number of columns and gutters:

| Split | Column | Gap | Measure |
|---|---|---|---|
| 6 + 6 | 486 | 24 | ~50 ch — gap too tight, the eye jumps columns |
| **5 + 2 + 5** | **401** | **194** | ~41 ch |
| 4 + 4 + 4 | 244 | 364 | ~25 ch — unusable |

Nothing exists in between. A gap of 60 or 80 puts the columns at 468 or 458, neither of which is a
grid width, so the inner edges float off the grid while the outer edges stay on it. **12 is generous
for asymmetric splits and poor for symmetric ones** — any symmetric gap costs an even number of
columns. Bind the skips rather than retyping; 109 and 194 both look arbitrary enough to get
"corrected".

### Span tokens name the *desktop* span

**Every span token collapses to the full content width (328) on Mobile**, because at 360px nothing
sits in a fraction of 12 columns — it stacks. The arithmetically honest mobile values (188 for 7
columns, 104 for 4, 76 for 3) are never what you want. So a span token is really a *semantic width* —
"how wide is this block at each viewport" — wearing grid clothing. Name it for the desktop span
anyway; that is the only scheme that scales without inventing a role name per use.

**Pin the narrow column and let the wide one `FILL`.** In any two-column split only one side needs a
width: `996 − 316 − 109 = 571`, computed rather than typed. That halves the hand-entered numbers and
gives better behaviour, because the wide column is the one holding prose and should absorb
intermediate widths. Consequence: only the *narrow* widths ever need tokens, which is why `span-3`
and `span-4` exist and `span-7` and `span-8` do not.

**The rule only protects you if the narrow column is actually pinned — a `HUG` rail inverts it.**
Found on Singleton 2026-08-06. Its rail was `HUG`, so its width came from its widest child: a
photograph cropped to **233px**. Two pixels off `grid/span-3`, and because prose `FILL`s, the error
propagated — prose resolved to **654 instead of 656** and the rail sat at 985, two pixels left of
col 10. A photo crop was setting the measure. **If a rail is `HUG`, the grid is downstream of its
contents rather than upstream**, which is exactly backwards. Pin it.

**Typed 656 is accepted, and `grid/span-8` was declined (2026-08-06).** Six places want an 8-column
width the grid cannot derive: the title block on all five detail boards, plus any heading block that
sits above a two-column split. Minting `grid/span-8` was considered and rejected in favour of typing
656, on the grounds that the derived cases — every prose column — already work. The tripwire is the
frame name: these are named `title block — 656 (8 col)` and `heading block — 656 (8 col)` so the
derivation is legible, the same device as `Note list — 348 outdent`.

**In CSS this is one change** — `--max-width: 1200px` → `996px`. The existing
`column-gap: clamp(0.5rem, 1.5vw, 1.5rem)` already tops out at exactly the 24px gutter. It also moves
the header and footer, which reference the same token.

**Typography did not drive this.** Measure is satisfiable at more than one width — 996 with 8-column
prose, or 1200 with 7-column prose — so it constrained the *column span*, not the grid.

## The detail-page skeleton

Proven across all six boards 2026-08-06 — the five detail templates plus the Singleton page shape.
Bands stack at gap 0 and the board **hugs its height**,
which is what stops a page developing the stale-height problem that left three Footers hanging 83px off
the bottom of their own boards.

```
board                    VERTICAL, gap 0, HUG height
├─ Top Bar
├─ Hero                  optional — FIXED height, the one frame that clips
├─ article band          pad rhythm/band + grid/margin, layout grid bound
│  └─ wrapper            FILL → 996, gap rhythm/heading-close
│     ├─ title block     FIXED 656 — eyebrow + H1 at rhythm/tight
│     └─ prose row       HORIZONTAL, gap grid/skip-1
│        ├─ Prose        FILL → 656, gap rhythm/heading-major
│        │  ├─ Body Group    gap rhythm/paragraph — or rhythm/block if a figure interrupts
│        │  └─ Section       gap rhythm/heading-close — H2 over a Body Group
│        └─ rail         FIXED grid/span-3 (231)
├─ Related band          pad rhythm/section + grid/margin, gap rhythm/block
│  ├─ H2
│  └─ card row           HORIZONTAL WRAP, gap grid/gutter, rowGap rhythm/list, cards grid/span-4
└─ Footer
```

**Two rules decide most of it.** *Grid owns horizontal, rhythm owns vertical* — every column gap comes
from `grid/*`, every stack gap from `rhythm/*`. And *pin the narrow column, let the wide one `FILL`* —
the rail carries the only width, so 656 is arithmetic rather than a typed number.

The variations the six boards actually needed all fit inside this shape:

- **No eyebrow** (Singleton) — the H1 sits directly in the wrapper at FIXED 656. A single-child title
  block would be structurally inert.
- **No rail content** (Note Detail) — the rail is *reserved*, not removed, so prose still derives 656.
- **A figure aligned to the body** (Case Study) — the *section* becomes the two-column unit rather than
  the band. See below.
- **A second band** (Case Study) — a full-bleed testimonial band splits the article in two. Each band
  keeps its own padding and they meet at gap 0.
- **A block wider than the prose column** (Case Study's 996 screenshot) — it sits in the wrapper below
  the prose row at `rhythm/block`, not inside Prose.
- **The last band before the Footer** takes `rhythm/section` on its bottom edge. See Vertical rhythm.

## The index-page shape

Settled 2026-08-06 on the Insights board, which was assembled as auto-layout but before most of these
conventions existed.

```
board
├─ Top Bar
├─ index band        pad rhythm/band + grid/margin, gap rhythm/heading-major
│  ├─ Page Header    component instance, FIXED 656 (8 col)
│  ├─ filters        HORIZONTAL, gap grid/skip-1 — 7 + skip-1 + 4
│  │  ├─ Topic Filter   FILL → 571
│  │  └─ Genre Filter   FIXED grid/span-4 (316)
│  └─ Masonry        HORIZONTAL, gap grid/gutter
│     └─ column ×3   FILL → 316, cards at rhythm/list
├─ Topics / Connect
└─ Footer
```

**The three masonry columns `FILL`, so `grid/span-4` is never typed.** Three equal children in a 996 row
at `grid/gutter` resolve to `(996 − 48) ÷ 3 = 316` exactly. The board previously carried FIXED **315**
columns whose right edge missed the margin by a pixel; a derived width cannot make that mistake.

**The filter bar reuses the 7 + `skip-1` + 4 split** already used by the `Topics` component and the Home
Insights band — narrow side pinned, wide side filling.

**Vertical gaps inside a masonry are rhythm; horizontal gaps are grid.** Cards stack at `rhythm/list`
(32) within a column while the columns sit `grid/gutter` (24) apart. Deliberately unequal, following
*grid owns horizontal, rhythm owns vertical*, and matching Insight Detail's related-cards row, which
already gaps 24 across and 32 down.

**The masonry is faked, and stays faked** — three column-major stacks. Doing it properly in Figma is
fussy for no gain, because the front end will do it for real. The consequence — see *What comes next →
More page layouts* — is that the Figma card order is column-major and a row-major DOM will not
reproduce it, so **that order is not a specification**; only the column width, gutter and card rhythm
are.

## `Page Header` — one component, and why the Lead cannot move into it

Built 2026-08-06. A 656 (8 col) block of `H1` over `Lead` at `rhythm/heading-close`, carrying `Title`
and `Lead` text properties plus a **`Show Lead` boolean**. Instanced on Insights with the Lead on and on
Singleton with it off.

**The boolean is required by the rail, not offered as flexibility.** On Singleton the rail image aligns
to the top of the **Lead**, not the H1 — the same rule Case Study settled in *Aligning a figure with the
body*. Pulling the Lead up into the header would realign the image to the paragraph below it and drop it
by the Lead's full height. So on Singleton the Lead stays in the prose column and the header renders as
the H1 alone.

**The gap *after* the header belongs to the parent band, not the component.** A component cannot carry
the space that follows it, so the two pages differ and should: `rhythm/heading-close` (16) on Singleton,
where the prose row comes next, and `rhythm/heading-major` (64) on Insights, where the filter bar does.

## Two rail relationships — the gap is the message

Settled 2026-08-06 across the five detail boards. Both are legal 12-column splits closing on 996;
they differ in what the gap *says*.

| Split | Arithmetic | Gap token | Reads as |
|---|---|---|---|
| 8 + 3 | 656 + **109** + 231 | `grid/skip-1` | a **sidebar** — set apart from the prose |
| 8 + 4 | 656 + **24** + 316 | `grid/gutter` | a **figure belonging to** the paragraph beside it |

**Case Study carries both, deliberately.** The client logo beside the summary sits at span-3 a
skipped column away; the captioned screenshots sit at span-4 one gutter away. A documentary figure
belongs *to* its paragraph and should sit against it; a logo is an identifier and does not. If the
two ever need to agree, it is the logo that should move.

Note this makes `grid/span-4` do double duty — the card width in a three-up row *and* the figure
width in an 8+4 split. That is fine: it is the same number of columns either way, which is what the
token names.

## Aligning a figure with the body, not with the heading

Settled 2026-08-06 on Case Study. **A rail that spans a whole prose column aligns its figure with the
top of that column — which is the heading, not the paragraph.** If the figure should start level with
the body text, the heading has to sit *outside* the horizontal row, which makes the section itself the
two-column unit rather than the band:

```
Section              VERTICAL, gap rhythm/heading-close
├─ heading block     FIXED 656 — eyebrow + H2 at rhythm/tight
└─ body row          HORIZONTAL, gap grid/gutter
   ├─ Body Group     FILL → 656
   └─ rail           FIXED grid/span-4 (316)
```

**A band-level rail cannot do this**, because one frame has one cross-axis alignment and the heading
and body are the same child. Nor can it be faked with a top padding on the rail: that number is the
heading's height, so it breaks the moment the heading wraps to a different number of lines.

**Sections without a figure keep a *reserved* rail.** An empty 316 column looks like dead weight and
is not: it is what makes the body column **derive** 656 from `996 − 316 − 24` rather than type it, and
a later figure drops into a slot that is already correct. This is the same move as Note Detail's
reserved span-3 rail, which exists so that page's prose can `FILL`.

**Distinguish this from a structurally inert wrapper.** A reserved rail is *contingently* empty — a
correctly configured column whose content happens to be nothing today. The single-child wrappers this
conversion deleted were *structurally* inert: they could never hold anything else. The test is whether
the frame would still be correct with a second child in it.

## Layout grids use `STRETCH`, not `CENTER`

A `CENTER` grid fixes the column width and lets the margins float; `STRETCH` fixes the margin and lets
the columns flex. **`STRETCH` is what the CSS does** — `minmax(1rem, …)` gutters against `1fr`
columns — so it is the one that matches. It also makes the margin an explicit, bindable number rather
than a leftover, which removes the need for a second overlay drawn purely to visualise margins.

Layout grid properties **can** take variables, via
`figma.variables.setBoundVariableForLayoutGrid(grid, field, variable)` for `offset` and `gutterSize`.
As of 2026-08-06 all 19 grid-bearing frames and components are bound, so switching a frame's `Grid`
mode moves the overlay with it.

**Bind the frame's padding, not just the overlay.** These are two entirely separate properties, and
binding `offset` moves only the *guide*. Content is positioned by `paddingLeft`/`paddingRight`, so a
frame whose overlay is bound and whose padding is raw will, on a mode switch, move its pink columns
and leave the text where it was. Found the hard way on Insight Detail 2026-08-06.

## Outdenting — when a box must bleed past its column

Settled 2026-08-06 on the Home Notes column. The situation recurs wherever an **unboxed** element
grows a box on hover.

Note cards sit unboxed at rest, so their *text* must align with the "Notes" heading and description
above them. But a card has 16px of padding, so if its box sits on the column line its text is inset
16px and misaligns with everything else in the column. On hover the box appears — and it should bleed
*outward*, past the column, rather than the text sitting inset all the time to make room for it.

### The rule: outdent the card, never the column

**Widening the column looks like the same fix and is not.** The first attempt widened the Notes column
to 346 so the cards could be full-width inside it. Because the band centred its children rather than
using padding, the extra 30px was split across both columns and **the Articles column drifted from 222
to 207** — 15px off col 1, while every other band on the page started at 222. The outdent leaked into
a sibling that had nothing to do with it.

Confine it to the card and nothing else moves.

### CSS — one declaration

```css
@media (min-width: 60rem) {
  .home .notes > .note {
    margin-inline: calc(var(--card-pad) * -1);
  }
}
```

The card keeps its padding at all times, so the hover box has its inset; the negative margin pulls the
*box* outward so the *text* lands on the column line. At rest there is no fill and no stroke, so the
outdent is invisible. The value is **derived from `--card-pad`**, so the two can never drift.

Scope it deliberately. This is a Home-desktop treatment: on mobile the cards go full width with no
room to bleed, and on the Ideas index an unboxed card's hover state should match the boxed cards
beside it, not exceed them. The media query that creates the two-column layout is the same one that
bounds the outdent, so it costs nothing extra.

### Figma — a wider `FIXED` child in a `CENTER`-aligned parent

Auto-layout has no negative margin, but it does overflow symmetrically:

| Node | Setting | Result |
|---|---|---|
| Notes column | `FIXED` → `grid/span-4` | 316, at col 9 — **unmoved** |
| cards frame | `FILL`, `counterAxisAlignItems: CENTER` | 316 |
| note card | **`FIXED` 348** | 886 → 1234, overflowing 16 each side |
| card text | — | **902 → 1218**, exactly the column |

Verified 2026-08-06: the parent stays 316 at 902 and the overflow is symmetric. Every grid-bearing
frame stays on the grid; only the card breaks out, which is exactly what the CSS does.

**348 is the one number Figma cannot derive.** It is `grid/span-4 + 2 × card/pad`, and there is no
`calc()` in a Figma width. Rather than mint a token whose name restates the arithmetic, the frame is
named `Note list — 348 outdent (span-4 + 2x card/pad)`. **If `card/pad` ever changes, the CSS follows
automatically and Figma does not** — that frame name is the tripwire.

**Open: a fixed margin does not survive intermediate widths.** In CSS the margin is
`minmax(1rem, calc(50vw - 498px))` — it *shrinks* as the viewport narrows and floors at 16px. The real
rule is "cap content at 996, let margins absorb the remainder, floor 16," which gives 222 at 1440,
**105 at 1206**, and 16 below about 1028. The Figma token is a fixed 222 in `Desktop` mode, so any
intermediate-width board renders too little content. A 1206-wide Home variant demonstrated this and
was deleted; the problem returns the moment a real tablet frame exists, and that frame will want
either its own mode or hand-set margins.

---

# Vertical rhythm

Settled 2026-08-06 against the Insight Detail template. Home and Ideas are likely to add roles; the
primitives should not need to change.

## The unit — one body line, rounded

Body is 18px at `--leading-prose-2: 1.8`, so one line box is **32.4px**. The scale is built on
**32px = 2rem**, a 1.2% round-down.

**The rounding is deliberate and costs nothing.** Nothing here runs on a baseline grid — impractical
with fluid type, images and mixed leading — so the unit does not need to *equal* the line box, only
to be commensurate with it. Half a pixel is not perceptible. What the rounding buys is a scale whose
every step is a whole number of pixels *and* a clean `rem`, which 32.4 is not:

| Token | × unit | px | rem |
|---|---|---|---|
| `space/1` | ¼ | 8 | `0.5rem` |
| `space/2` | ½ | 16 | `1rem` |
| `space/3` | ¾ | 24 | `1.5rem` |
| `space/4` | 1 | 32 | `2rem` |
| `space/5` | 1½ | 48 | `3rem` |
| `space/6` | 2 | 64 | `4rem` |
| `space/7` | 3 | 96 | `6rem` |

This is an 8px grid, but **derived from the line box rather than imposed on it**. If the type scale
changes, the spacing scale is regenerable from the new line box rather than being an unrelated
convention sitting alongside it.

Note this cuts the opposite way from the font sizes, where ugly values like `1.7578125rem` are kept
exact. There the ugliness is unavoidable if the 1.25 ratio is to hold. Here it is avoidable and buys
nothing.

## Roles

Sixteen, in two registers. `rhythm/*` governs vertical page flow. `card/*` and `chrome/*` govern
component internals, which have a different origin — component compactness rather than the body line
box. Several share a primitive today; they stay separate because they can diverge without renaming
anything.

**Page flow**

| Role | Alias | px | Why |
|---|---|---|---|
| `rhythm/tight` | `space/1` | 8 | ¼ line. The smallest separation that still separates: eyebrow→title, label→value |
| `rhythm/heading-close` | `space/2` | 16 | ½ line. Binds a heading to the text it introduces |
| `rhythm/item` | `space/2` | 16 | Between items in a text list, where an item may wrap |
| `rhythm/paragraph` | `space/3` | 24 | ¾ line. Puts the paragraph break at 1.74× the within-paragraph line distance |
| `rhythm/list` | `space/4` | 32 | Between sibling **cards** in a list |
| `rhythm/block` | `space/5` | 48 | 1½ lines = 2× paragraph. Figures, lists, quotes read as an interruption |
| `rhythm/heading-minor` | `space/5` | 48 | 1½ lines above h3. ~2:1 apparent against `heading-close` |
| `rhythm/heading-major` | `space/6` | 64 | 2 lines above h2. ~2.5:1 apparent. Also the row gap when a wrapped column collapses, since what lands below starts with an h2 |
| `rhythm/band` | `space/6` | 64 | Vertical padding inside a full-width band |
| `rhythm/section` | `space/7` | 96 | Vertical padding for a band that opens a major new page region |

**Component internals**

| Role | Alias | px | Why |
|---|---|---|---|
| `card/gap` | `space/1` | 8 | Between elements inside a card: title, meta, description |
| `card/pad` | `space/2` | 16 | Padding inside a card, both axes |
| `card/media` | `space/3` | 24 | Between a card image and its text. 3× `card/gap` — the difference is deliberate |
| `chrome/pad-header` | `space/4` | 32 | Vertical padding in the Top Bar. Tighter than `rhythm/band` on purpose: at 64 the header would be 208px tall |
| `chrome/pad-footer` | `space/5` | 48 | Vertical padding in the Footer |
| `chrome/inset` | `space/5` | 48 | Horizontal inset for full-width chrome. Mobile 16. The Top Bar deliberately spans wider than the 996 column, so it does **not** use `grid/margin` |
| `field/height` | `space/5` | 48 | Height of a single-line form control. **The one role scoped `WIDTH_HEIGHT` rather than `GAP`** |

**`field/*` is the fourth component-internals prefix**, added 2026-08-07 with the contact form, and the
first to need `WIDTH_HEIGHT`. A control's height is not a gap and not a grid width — it is the component's
own intrinsic size, which is why it takes a prefix of its own rather than borrowing `space/5` directly.
It aliases `space/5` all the same, so it moves with the scale.

The form's textarea is **left raw at 144**. It is exactly `3 × field/height`, but Figma has no `calc()`
and it is a single use — below the bar that earns a name. Revisit when the error state forces real input
design, which it will (see Colour → Error state: the state was never designed, and native validation
bubbles cannot be styled).

**`rhythm/tight` was `rhythm/pair` until 2026-08-06.** "Pair" named a cardinality — two things — and
broke the moment it was wanted for a list of eight tags. The value's job is a quality, not a count.

**`rhythm/item` vs `rhythm/tight` is decided by wrap risk.** At `Nav` 18/150% the line box is 27px, so
`tight` (8) puts item-to-item at only **1.30×** the line-to-line distance and a wrapped item reads as
two items. `item` (16) gives **1.59×**. Use `tight` where the column is wide enough that nothing wraps
(the Topics lists at 274px), `item` where it is tight (the Footer link grid at 146px).

**`band` and `section` are two values of one property, not two properties.** Both are a band's
vertical padding; `section` is the heavier choice for a band opening a new page region. Bands stack at
`gap: 0`, so band-to-band space is simply two paddings — Topics and Connect at `section` give 192px
between them. This replaced an earlier `rhythm/page`, which only looked page-level because Insight
Detail has a single content band. Home has six, and the role is per-band.

**Which of the two a band takes is decided by how it reads, not by a rule.** Two data points now sit on
either side. The **Hero** takes `band` (64) although it is a coloured, self-contained region like Topics
and Connect, which take `section` — 96 read as too much air above a three-line statement. The **RSS CTA**
takes `section` (96) although it is only a 115px strip, which makes it 192px from the Related band that
follows; confirmed as intended 2026-08-07 after being queried. Neither follows from structure. Expect to
try both and look.

**`card/*` and `chrome/*` are separate prefixes on purpose.** "Rhythm" implies vertical page flow, and
component padding is not that. The prefixes are also extensible — `filter/*` will want the same.
Leaving these untokenized is exactly why the two card families drifted to `14/20/16/20` and
`12/16/12/16`, and why the four chrome bands carried 32 / 75 / 75 / 48 for one role.

**A token earns a name only when more than one thing uses it, or the values move as a set.** One-off
component spacing — the masthead lockup at 16, the nav row at 24, the social icons at 48 — binds a
`space/N` primitive directly. A token used once whose name restates its location is indirection
without meaning.

**Optical nudges stay untokenized, deliberately.** Three sub-8 values exist and none is spacing: the
masthead name→role at 2, the card image's 6px top pad, the clipping link's 2px. They are alignment
corrections between a glyph and adjacent text. Giving them a token invites people to reach for it as
a spacing value.

### The hazard of a role-heavy set: value collisions

| Value | Tokens sharing it |
|---|---|
| 8 | `rhythm/tight`, `card/gap` |
| 16 | `rhythm/heading-close`, `rhythm/item`, `card/pad` |
| 48 | `rhythm/block`, `rhythm/heading-minor`, `chrome/pad-footer`, `chrome/inset` |
| 64 | `rhythm/heading-major`, `rhythm/band` |

The collisions are deliberate — roles that agree today and can diverge later. But they are
**indistinguishable by value in Figma's picker**, and that has already produced one wrong binding
(the flattened vertical card variants picked up `rhythm/tight` where `card/gap` belonged). **Pick by
prefix first, then by name; never by value.** If you are inside a card, the answer is under `card/`.

This bit again on Singleton 2026-08-06: the gap above an h3 subsection was bound to `rhythm/block`
where `rhythm/heading-minor` belonged. Both are 48, so nothing looked wrong and nothing would have,
until the day the two roles diverge and only one of them should have moved.

### What the board conversion settled

Four boards were converted to auto-layout on 2026-08-06 and Singleton corrected. Four rhythm questions
came up that the role table alone did not answer.

**The last band before the Footer takes `rhythm/section` on its bottom edge — whatever kind of band it
is.** Every board ending on a Related band already did this, because `rhythm/section` is that band's
padding on both edges. Singleton was the only board whose last band was an *article* band, so it ended
at `rhythm/band` (64) — which is exactly `rhythm/heading-major`, the internal section break. The Footer
read as no more separated than a heading. At 96 it is 1.5× an internal break, and all five boards now
end identically.

Consequence worth naming: that band's padding is then **asymmetric** — 64 at the top against the Top
Bar, 96 at the bottom against the Footer. Correct rather than sloppy. The Top Bar is a light band
carrying its own `chrome/pad-header`, so there is no hard edge above; the Footer is a dark fill whose
top edge lands as a line.

**A Body Group's gap goes to `rhythm/block` when a figure, list or quote interrupts it** — not only
before the interruption but after it too. This mirrors the CSS exactly, where `* + :is(…)` and
`:is(…) + *` both fire. Web Clipping's lead-in / blockquote / paragraph group is the case: 48 above the
quote and 48 below it, out of one `itemSpacing`.

**A blockquote's indent is `space/5` (48), applied as `paddingLeft` on a wrapper frame.** A text node
cannot carry padding, so the quote needs a frame around it; the text then `FILL`s to `656 − 48 = 608`.
The primitive is bound directly rather than a `rhythm/*` role, because this is a horizontal inset and
`rhythm/*` names vertical page flow — the same reasoning that puts `chrome/inset` where it is. It
replaced a hand-set 39.

**A filter bar takes `rhythm/heading-major` (64) above *and* below — and the second use borrows the
name.** Settled on Insights 2026-08-06, after trying 24 and finding it far too tight. Above the bar the
role is exact: the filter columns open with h2s, and `heading-major` *is* "2 lines above h2". Below it,
**nothing in the set fits past 48.** `rhythm/block` (48) is correctly named but reads tight under a
control strip; `rhythm/section` (96) is a band's *padding*, and pressing it into service as an
`itemSpacing` would break the padding-versus-gap distinction the role names exist to encode. Minting a
`rhythm/region` role was considered and rejected: it would have been a **third** token at 64 alongside
`heading-major` and `band`, in a system that already records value collisions as a live source of wrong
bindings.

So `heading-major` now serves three situations — above an h2, the row gap of a collapsed wrapped column,
and either side of a filter bar. **Prefer stretching one name over minting a colliding token, but record
the stretch**, which is what this paragraph is for.

**Figures and captions.** A caption sits `rhythm/tight` (8) below its image inside a `figure` frame:
the caption is a label to the image's value, which is what `tight` is for. Where a figure sits above
another block in a rail — Book Note's cover above its source card, Singleton's photograph above *On
this page* — the gap is `rhythm/block` (48), the same value that figure would earn in running prose.

**Check ratios in apparent space, not in token values.** Every line box contributes half-leading, so
the white above an h2 measures ~81px and below it ~33px — about 2.5:1, not the 4:1 the raw numbers
suggest. The same calculation puts h3 at ~64px above and ~32px below, almost exactly 2:1.

**Why ¾ and not a full line for `rhythm/paragraph`.** The gap has to hold the paragraph break clearly
above the within-paragraph line distance, or the paragraph stops cohering as a unit — and that
requirement gets *stronger* as leading loosens, not weaker. At ¾ the baseline-to-baseline distance
across a break is ~56px against 32.4px within, a 1.74× step that stays unmistakable. A full line
(2.0×) is the other defensible choice. ½ would be marginal at 1.5×.

## Mechanism — the two tools do not match, and cannot

**CSS: sibling margins, no container.** Portable Text emits a flat sequence — `p p h2 p p figure p`
— with no section wrappers, so `gap` cannot express "tighter after a heading."

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
- All six have equal specificity, so **source order decides**. `heading-close` is last, which is what
  makes a heading bind to whatever follows it, including a figure.
- The base rule needs `:not(.sidebar):not(.banner)` — both are explicitly grid-placed, and a
  `margin-top` would push them out of position.
- **No new container.** These are margins on existing grid items, the same "move only one edge" logic
  the measure uses. Nothing re-centres and no `.prose` wrapper is involved — see the rejection note
  in CLAUDE.md.

**Figma: nested auto-layout.** One frame has exactly one gap, and auto-layout has no per-child margin,
so the same system needs three levels:

```
prose stack        gap = rhythm/heading-major   ← between sections
└─ section         gap = rhythm/heading-close   ← heading to its body
   ├─ H2
   └─ paragraphs   gap = rhythm/paragraph
```

**The two structures are not parallel and cannot be made parallel.** They share the scale and the role
names; the mechanics differ by tool. This is not a defect to reconcile.

## Mobile — split by cause, not by size

The useful division is *what creates the space*:

- **Type-derived spacing does not change.** `tight`, `heading-close`, `item`, `paragraph`, `list`,
  `block`, `heading-minor`, `heading-major` and every `card/*` role exist because of the line box or
  the component, and body moves only 18 → 17px between viewports. Identical in both modes.
- **Page-derived spacing does.** `band`, `section` and `chrome/inset` exist because of the viewport,
  and three lines of dead air between regions is wrong on a short screen.

Three of twenty-four spacing variables vary — `rhythm/band`, `rhythm/section` and `chrome/inset`
(48 → 16, since a 48px inset on a 360px screen would eat a quarter of it). The rest hold the same
value in both modes.

| Role | Desktop | Mobile | CSS |
|---|---|---|---|
| `rhythm/band` | 64 (2 lines) | 32 (1 line) | `clamp(2rem, 1.0909rem + 3.8788vw, 4rem)` |
| `rhythm/section` | 96 (3 lines) | 64 (2 lines) | `clamp(4rem, 3.0909rem + 3.8788vw, 6rem)` |

Derived over 375 → 1200 with the same arithmetic as the type clamps, so they re-derive trivially if
the mobile floor moves to 360. CSS carries one interpolating value and needs no breakpoint.

**In Figma these are modes, not separate variables.** Never mint `*-mobile` twins — the viewport is a
mode, and a token whose name encodes a viewport cannot participate in a mode switch.

**One viewport axis across three collections.** `Type Scale`, `Spacing` and `Grid` all use
`Desktop` / `Mobile`, so "set this frame to Mobile" is a single consistent action. A mode in one
collection and a differently-named variable in another is the trap this avoids — it is the kind of
inconsistency that gets applied wrong late at night.

---

# Colour

Rebuilt 2026-08-07 around a new accent. **The previous palette is not recorded here.** It was a clean
break, and the old values would only mislead — every ratio below is measured against what exists now.

**The accent is `#326e85`, and it is `blue/500`.** It began life as the 700 step of a ramp built around
the old brand blue `#4e9dbc`, and was adopted as the accent for one reason: it is the lightest step in
this hue that carries white text at AA (**5.67**), which the old brand blue never could (3.09). Almost
everything below follows from that single choice.

## The blue ramp

**Hue 197° / saturation 45%**, stepped by lightness. Eight steps.

| Token | Hex | HSL L | vs ground | white on it | Role |
|---|---|---|---|---|---|
| `blue/50` | `#e1eff4` | 92% | 1.13 | — | whisper tint; **AA text on the accent band** (4.82) |
| `blue/100` | `#c4dee9` | 84% | 1.34 | — | tint; 4.04 on the accent band |
| `blue/200` | `#aed2e0` | 78% | 1.53 | — | chip hover fill; UI boundary on the accent (3.53) |
| `blue/300` | `#4e9dbc` | 52% | 2.92 | 3.06 | the former brand blue; chip pressed fill |
| `blue/400` | `#3e86a3` | 44% | 3.91 | 4.08 | large text on light only |
| **`blue/500`** | **`#326e85`** | **36%** | **5.42** | **5.67** | **accent** — brand surfaces, buttons, link hover |
| `blue/600` | `#275568` | 28% | 7.77 | 8.12 | hover on accent-filled controls |
| `blue/700` | `#1f4351` | 22% | 10.15 | 10.61 | pressed; CTA background; lead paragraph |

**The step numbers no longer track lightness, and that is the trade.** Most ramps put 500 near L 52%;
this one puts it at 36% so that the *accent* is the 500 step — the number a person reaches for first
should be the primary. Consequence: **do not infer lightness from the step number in this system.**
Renumbering was cheap because Figma binds by variable ID, not by name, and no CSS existed yet.

**The gap between `200` (L 78%) and `300` (L 52%) is deliberate.** Nothing needs a value there. The
ramp is dense at the dark end, where every step is a legal text or surface colour, and sparse in the
middle, where a step would have no use. Same principle as the type scale's clamped step 1: a documented
irregularity beats a value that exists only for symmetry.

**Steps 300 and 400 have almost no legal use on light** — 300 fails even 3:1 on the ground (2.92) so it
is never text, and 400 is large-text-only. Both are kept because they complete the ramp arithmetically
and because **dark mode will want mid-tones**, where their contrast inverts and they become useful.

**Nothing blue works *on* the accent band.** Every step measures ≤ 1.87 against `#326e85`. Content on
the Hero, Topics, Footer and RSS CTA bands is therefore white or a near-white neutral. This constraint
is what shapes the ghost button — see *Interaction states*.

## The neutral ramp

Derived from `#051319`, which sits at **198°** — essentially the brand hue — mixed toward pure white.

| Token | Hex | vs card | vs ground | Body 4.5 both | Role |
|---|---|---|---|---|---|
| `neutral/900` | `#051319` | 18.86 | 17.24 | ✅ | primary text |
| `neutral/800` | `#283439` | 12.80 | 11.71 | ✅ | card titles |
| `neutral/700` | `#505a5e` | 7.08 | 6.48 | ✅ | muted text: captions, labels, metadata |
| `neutral/600` | `#788083` | 4.03 | 3.85 | ❌ | **control borders** (3:1 UI only) |
| `neutral/500` | `#969c9e` | 2.78 | 2.66 | ❌ | disabled foreground |
| `neutral/400` | `#b4b8ba` | 2.00 | 1.91 | ❌ | — |
| `neutral/300` | `#d2d5d6` | 1.48 | 1.41 | ❌ | hairline borders on non-interactive surfaces |
| `neutral/200` | `#e9eaea` | 1.21 | 1.15 | ❌ | disabled fills, pressed-on-dark |
| `neutral/100` | `#f9fafb` | 1.05 | — | ❌ | **page ground** |

**Use 700, not 600, for text at any size.** 600 looks like a reasonable muted grey and fails AA on both
surfaces. It has exactly one sanctioned job: the boundary of an interactive control, where the threshold
is 3:1 rather than 4.5:1.

## Two surfaces

**The page ground is a tinted off-white; raised elements are pure white.** This lets cards and toggles
read as raised *without drop shadows*, which suit a typography-driven page badly, and a tinted ground
is easier on the eye than pure white for long reading.

| Role | Token | Hex | |
|---|---|---|---|
| page ground | `color/bg` → `neutral/100` | `#f9fafb` | |
| raised surface | `color/surface` | `#ffffff` | separation **1.045** |
| hairline border | `color/border` → `neutral/300` | `#d2d5d6` | **1.41** on the ground |

**The border carries the card boundary, not the fill difference.** 1.045 is two lightness points, at
the edge of perceptibility, so a **borderless card would not be distinguishable** — borders are not
optional decoration here. Unboxed notes sit directly on the ground by design and need no boundary.

**Everything must be verified against both surfaces.** A colour can pass on a white card and fail on
the ground; `blue/300` is the standing example (3.06 vs 2.92).

**`color/surface`, not `color/card`.** "Surface" names a position in the layering — the raised plane —
rather than a component, so one token serves cards, toggles, panels and overlays, and it scales to a
second elevation. Naming it for a component would repeat the error that `--eyebrow-gray` made one
layer down: a role name in a slot that should hold a value.

**The ground's hue is nominal.** `#f9fafb` computes to 210°, not 197°, and that distinction is not
representable: at 98% lightness the colour spans 2 units of 255 per channel, so both hues quantize to
the same hex. Practical consequence for anyone tempted to "fix" it — **a perceptibly brand-tinted
ground needs lightness at ~95% or below**, where the channel span widens enough for hue to be encodable.

## Error

Hue **8°**, deliberately far from the brand's 197°.

| Token | Hex | Role |
|---|---|---|
| `error/100` | `#f9e9e7` | panel background |
| `error/500` | `#cc4c38` | border, filled state |
| `error/600` | `#b33f2e` | message text |

| Pair | Ratio | Needs | |
|---|---|---|---|
| `error/600` on `error/100` | 4.86 | 4.5 | ✅ |
| `error/600` on the ground | 5.48 | 4.5 | ✅ |
| `error/500` border on `error/100` | 3.83 | 3.0 | ✅ |
| white on `error/500` | 4.51 | 4.5 | ✅ |
| **`error/500` or `600` on the accent band** | **1.26 / 1.01** | — | ❌ **invisible** |

**The error set does not survive a dark ground.** Both text values disappear against `#326e85`. This is
latent while forms sit on the page ground, and it becomes blocking the moment a form appears on a
coloured band — or when dark mode arrives. A light error variant will be needed then.

**Success and warning tokens are deliberately omitted.** There is no designed use for them, and the
previous palette's alert pair sat declared-but-unused for years. Add them when a state is actually
designed. Per WCAG 3.3.1 errors must be identified in **text**, never by colour alone — and the contact
form still relies on native validation, whose bubbles cannot be styled, so a designed error state needs
custom validation messaging before any of these tokens can be used.

## Semantic tokens

Twenty-four roles, all aliasing primitives. The `Semantic` collection has a **single `Light` mode**,
named in anticipation of a `Dark` sibling.

```css
:root {
  /* surfaces */
  --color-bg:              var(--neutral-100);  /* page ground, tinted */
  --color-surface:         #ffffff;             /* raised: cards, toggles, panels */
  --color-surface-hover:   var(--neutral-100);  /* light control on a dark band, hover */
  --color-surface-pressed: var(--neutral-200);  /* …pressed */

  /* text */
  --color-text:            var(--neutral-900);
  --color-text-muted:      var(--neutral-700);  /* captions, labels, metadata */
  --color-text-inverse:    #ffffff;             /* on accent bands and accent fills */

  /* borders */
  --color-border:          var(--neutral-300);  /* non-interactive: cards, panels */
  --color-border-control:  var(--neutral-600);  /* interactive: chips, inputs — 3:1 */
  --color-border-inverse:  #ffffff;             /* ghost button outline on a band */

  /* brand */
  --color-accent:          var(--blue-500);
  --color-accent-hover:    var(--blue-600);
  --color-accent-pressed:  var(--blue-700);
  --color-link-hover:      var(--blue-500);
  --color-link-strong:     var(--blue-700);     /* lead paragraph, CTA background */

  /* control tints (unselected chips on light) */
  --color-control-hover:   var(--blue-200);
  --color-control-pressed: var(--blue-300);

  /* state */
  --color-focus-ring:      var(--blue-500);
  --color-focus-offset:    #ffffff;
  --color-disabled-surface: var(--neutral-200);
  --color-disabled-text:   var(--neutral-500);

  /* error */
  --color-error-bg:        var(--error-100);
  --color-error-line:      var(--error-500);
  --color-error-text:      var(--error-600);
}
```

**`color/accent` and `color/link-hover` hold the same value.** That is legitimate — two roles that agree
today and can diverge later — and it is why link hover is now a legal text colour (5.42) where the
previous palette's was not (2.92).

**`color/accent` is not scoped to `TEXT_FILL` in Figma.** The scope survives from when the accent could
not legally be text. It now can, so the guarantee comes from the value rather than the scope; the
restriction is kept because it preserves the role distinction — reach for `link-hover` or `text` when
you want text, and `accent` when you want a surface.

## Guardrails

Every contrast failure measured in this project reduces to one of these:

1. **Nothing blue goes on the accent band.** Every step is ≤ 1.87 against it. Use white, `neutral/100`
   or `neutral/200`, all of which clear 4.5.
2. **`blue/300` and `blue/400` are not text on light.** 2.92 and 3.91. 300 fails even the large-text
   threshold.
3. **Never `neutral/600` for text.** 3.85 on the ground. It is a *border* colour.
4. **Anything at `blue/500` or darker, and `neutral/700` or darker, passes on both surfaces** — no
   checking needed.
5. **Disabled is exempt** (WCAG 1.4.3, 1.4.11) and its low contrast is the signal. `disabled-text` is
   `neutral/500` rather than 600 specifically so the exemption never becomes a precedent for body text.

A novel pairing is the only case that warrants measuring. An in-canvas contrast plugin (Stark, Able) is
the convenient way while designing.

## Interaction states

Specified and built 2026-08-07. Both control sets carry `State = Rest | Hover | Pressed | Focused |
Disabled`.

### Primary button — light ground

| State | Fill | Label | Label/fill |
|---|---|---|---|
| rest | `accent` | `text-inverse` | 5.67 |
| hover | `accent-hover` | `text-inverse` | 8.12 |
| pressed | `accent-pressed` | `text-inverse` | 10.61 |
| disabled | `disabled-surface` | `disabled-text` | 2.31 † |

### Primary button — accent bands: a ghost, and why it must be

On a coloured band the button **cannot lighten while keeping white text**. The window is empty: white
text survives only to L 41%, where the fill sits 1.23 against the band and is invisible against it;
separating from the band needs L ≥ 80%, where white text is at 1.53. So hover **inverts** instead.

| State | Fill | Border | Label |
|---|---|---|---|
| rest | `accent` (reads as the band) | `border-inverse` | `text-inverse` |
| hover | `surface` — solid white | — | `accent` |
| pressed | `surface-pressed` | — | `accent-hover` |
| disabled | `accent` | `disabled-text` | `disabled-text` |

Outline → solid white → grey. The three states are maximally distinct, which the earlier
white/`#f9fafb`/`#e9eaea` sequence was not.

### Filter chip — light ground

| State | Fill | Label | Border |
|---|---|---|---|
| rest | `surface` | `text` | **`border-control`** |
| hover | `control-hover` `blue/200` | `text` | `border-control` |
| pressed | `control-pressed` `blue/300` | `text` | `border-control` |
| **selected** | `accent` | `text-inverse` | `accent` |
| selected + hover | `accent-hover` | `text-inverse` | `accent-hover` |
| disabled | `disabled-surface` | `disabled-text` | `border` |

**The chip border is `neutral/600`, not the card hairline.** A card is not a control; a chip is, so its
boundary falls under 1.4.11's 3:1 requirement — 3.85 rather than 1.41. Form inputs take the same token
for the same reason.

**Pressed stops at `blue/300`.** That is the firmest tint before an unselected chip starts reading as
selected (1.86 against the accent), and it is acceptable only because pressed is transient.

### Focus ring — a double ring, stated by relationship

> **Inner ring contrasts with the control; outer ring contrasts with the surface.**

The same two colours in both contexts, order swapped — 5.67 / 5.42 on light, 5.67 / 5.67 on the band.
A fixed inner-white / outer-accent ring **fails on the accent band**, where the white inner merges with
the white button and the accent outer merges with the band.

In CSS this is `box-shadow: 0 0 0 2px <inner>, 0 0 0 4px <outer>`. **In Figma it has to be drawn as two
absolutely-positioned rectangles** with stretch constraints — see Figma authoring conventions, where
spread shadows are documented as unrenderable.

† Ratios marked † are deliberately low; see guardrail 5.

## Links

**Inline links in prose:** body text colour with a persistent underline, `color/link-hover` on hover.
Because the *underline* rather than colour carries the affordance, this satisfies WCAG 1.4.1 (Use of
Colour), which a coloured-text link does not. Both states pass on both surfaces: 18.86 / 17.24 at rest,
5.67 / 5.42 on hover.

**Block-level link titles — card titles, list headings — take `neutral/800`, no underline.** 1.4.1
governs links being distinguishable *from surrounding text*, which is an inline problem; a title in its
own block at heading size is identified as a link by position and context. Dark titles also quiet the
page down, and they pass on both surfaces at any size, which coloured titles did not.

## Dark mode — what is already true

Not designed yet, but three things are in place and one is known to be missing:

- **The `Semantic` collection has a single mode named `Light`**, so adding `Dark` is a sibling rather
  than a restructure. Every component binds semantic roles, not primitives, so a mode switch reaches
  them all.
- **The light end of the blue ramp exists** — `blue/50`–`200` were added partly for this. Against a dark
  ground their contrast inverts and they become the text and accent colours.
- **`blue/300` and `blue/400`, near-useless on light, are the mid-tones dark mode will want.** This is
  why they were kept rather than dropped.
- **The error set has no light variant and will need one.** `error/500` and `600` measure 1.26 and 1.01
  against the accent — they vanish on any dark surface.

The mode axis is deliberately separate from the `Desktop`/`Mobile` axis carried by `Type Scale`,
`Spacing` and `Grid`, so a frame can be Mobile without being Dark.

---

# Figma authoring conventions

Andy upgraded to **Professional** on 2026-07-28, unlocking variable **modes** (up to 4 per
collection). The mobile/desktop duplication that the Starter plan forced has been collapsed.

**Five collections, and the mode axes are kept deliberately separate:**

| Collection | Contents | Modes |
|---|---|---|
| `Primitives` | **21** raw colours — `blue/50`–`700`, `neutral/100`–`900`, `error/*`, `white` | single (`Value`) |
| `Semantic` | **24** colours that **alias** primitives — `color/bg`, `color/text`, … | single (**`Light`**) |
| `Type Scale` | 6 font sizes `size/1`–`size/6` | **`Desktop` / `Mobile`** |
| `Spacing` | **24** — 7 primitives `space/1`–`space/7` + 10 `rhythm/*` + 3 `card/*` + 3 `chrome/*` + 1 `field/*` | **`Desktop` / `Mobile`** |
| `Grid` | **7** — `margin`, `gutter`, `column`, `skip-1`, `skip-2`, `span-3`, `span-4` | **`Desktop` / `Mobile`** |

**Two mode axes are in play and they are not the same axis.** `Type Scale`, `Spacing` and `Grid` carry
**viewport**; `Semantic` will carry **theme** once `Dark` joins `Light`. Keeping them on separate
collections is what lets a frame be Mobile without also being Dark. Do not merge them.

**Spacing keeps both layers in one collection, distinguished by prefix.** Colour splits its two
layers across `Primitives` and `Semantic`; spacing does not, because 19 variables do not justify two
more collections and the `space/` ÷ `rhythm/` ÷ `card/` prefixes already make the layer legible in the
picker. If that inconsistency grates, splitting later is a rename, not a rebuild.

**Scope `space/*` and `rhythm/*` to `GAP` only** — never `WIDTH_HEIGHT`. That is "grid owns
horizontal" made structural: Figma will not offer a rhythm token where a width belongs. The scoping
earned its keep on 2026-08-07 — the contact form's 48px input height *is* `space/5`, and because Figma
refused to offer it as a height, the gap surfaced as **a missing role** (`field/height`) instead of being
quietly bound to a spacing token that means something else.

**Sizes live in their own collection on purpose.** Modes are per-collection, so putting a Mobile
mode on `Primitives` would give all 18 colours a meaningless second mode. More importantly viewport
and *theme* are orthogonal axes — if light/dark is ever wanted, it belongs on the colour collections
independently, and Professional allows both.

**How the mode is used:** select a frame and set its `Type Scale` mode to `Mobile`; every text style
inside resizes, because the styles bind to `size/N` rather than to a fixed number. `Desktop` is the
default mode, so a new frame gets desktop sizes unless told otherwise — worth remembering when
starting a 375px artboard.

**One set of text styles, viewport-agnostic:** `Display`, `H1`–`H4`, `Lead`, `Body`, `Body Compact`,
`Small`, `Label`, plus the three `Masthead/*` and `Nav` chrome roles. No `Desktop/` or `Mobile/`
prefix — the viewport is a mode, not a style. Each binds `fontSize` to its `size/N` variable.

**`Body` and `Body Compact` share `size/2` and differ only in leading.** That is legitimate and
deliberate: leading is a function of measure, and one size step can appear at two column widths. Do
not "tidy" them into one style.

**Leading and tracking are percentages in Figma, not px.** CSS unitless `line-height` is exactly a
percentage of font size, so `1.8` → `180%`, `1.6` → `160%`, `1.3` → `130%`, `1.25` → `125%`,
`1.1` → `110%`; tracking `-0.015em` → `-1.5%` and `0.02em` → `2%`. Because they are size-relative
they need no per-mode values at all — which is why only the six sizes are mode-aware.

**Spacing is the exception: auto-layout gap is absolute px, with no size-relative form.** That is why
the rhythm scale is rounded to whole pixels (see Vertical rhythm) — a `rem`-only scale would have to
be re-resolved by hand every time it is typed into Figma.

**On a `GRID` auto-layout frame, bind `gridRowGap` and `gridColumnGap`.** `itemSpacing` and
`counterAxisSpacing` still exist on the node, **still accept bindings, and render nothing** — a
binding that silently succeeds while doing nothing. Cost us a false positive on the Footer link grid
2026-08-06: both pairs read back correctly and the grid kept rendering at its old values. The
measured child positions are the only reliable check.

**A stale fixed height eats padding before it fails visibly.** When a frame is `FIXED` at a height its
content has outgrown, auto-layout cannot shrink padding — the content simply overflows the padding box
and the gap at the bottom disappears. It reads as "the padding collapsed," which sends you looking at
the wrong property. The Insight Detail cards did exactly this after the leading sync: `FIXED` at 391
against content needing 403, showing 4px of bottom padding where 16 was set. **The fix is always
sizing, never padding** — set the frame to `HUG` or `FILL`. Any board still carrying hand-set heights
will show this symptom after a type change.

**The same trap runs horizontally, and there it is invisible.** Hit twice more on 2026-08-06. Ten
Insights card instances were `FIXED` vertically and 11–23px short of their content — the familiar
collapsed-padding symptom, and the one that was actually noticed. But the note card's *Clipping* variant
also held a domain text node `FIXED` at **287px inside a 284px row** that already carried a 25px icon
and a 2px gap, needing 314. A fixed *height* announces itself as collapsed padding; a fixed *width*
announces nothing at all until the string is long enough, and this one had been shipping on four boards.
**`FIXED` on either axis is where overflow hides.**

**So sweep for it rather than looking for it.** For every auto-layout frame, compare the extent the
content requires against the box it has:

```js
const kids = n.children.filter(c => c.visible !== false && c.layoutPositioning !== 'ABSOLUTE')
const vertical = n.layoutMode === 'VERTICAL'
const need = kids.reduce((a, c) => a + (vertical ? c.height : c.width), 0)
           + n.itemSpacing * (kids.length - 1)
           + (vertical ? n.paddingTop + n.paddingBottom : n.paddingLeft + n.paddingRight)
// need > (vertical ? n.height : n.width)  →  the content does not fit
```

Skip `WRAP` and `GRID` frames, whose extent is not a simple sum. Run it after any type change, component
edit or column-width change — it is cheap and it catches both axes. Across all eight boards it now
returns exactly one hit: Insight Detail's `Hero`, "overflowing" by 400px because it deliberately clips a
720px image into a 320px band. **A clipping frame is the one legitimate overflow**, so check
`clipsContent` before treating a hit as a defect.

**Fix overflow on the component, not the instance.** The clipping-card text was one edit in two variants
and it corrected eight instances across four boards.

**`counterAxisAlignItems` has no `STRETCH` value** — the enum is `MIN | MAX | CENTER | BASELINE`.
Stretch is not a property of the row; it is what happens when a *child* is set to `FILL` on the cross
axis. So to make a row of cards equal-height, set the children to Fill, not the parent to Stretch.
The parent's alignment control is the one people reach for and it is the wrong one.

**`figma.createAutoLayout()` inherits `createFrame()`'s `clipsContent: true`.** Every frame created
programmatically clips unless told otherwise, and clipping is invisible until something needs to
overflow. It produced a false bug report on 2026-08-06: the `source card` hover adds a drop shadow at
offset 2/2 with zero radius and zero spread, so the only visible part of it is 2px on the right and
bottom — exactly the 2px the rail clipped. The interaction was firing correctly the whole time and
read as doing nothing. For scale, the hand-built Insight Detail has **1 clipping frame out of 23**
(`Hero`, correctly); the converted boards had 8 of 11 and 9 of 12 before the sweep. **Set
`clipsContent = false` on creation and keep it true only where a frame genuinely crops** — a hero band
holding an oversized image, or a masked photograph.

**Verify an effect by render bounds rather than by reading the effect back** — `absoluteRenderBounds`
minus `absoluteBoundingBox` is the overflow an effect claims. But see the next entry: **render bounds
are not proof of rendering either.** The only conclusive check is sampling exported pixels.

**Drop-shadow `spread` is stored, counted, and never rendered.** Found 2026-08-07 while building the
focus ring, and it cost the most time of anything in this project. Figma accepts `spread`, reports it
back from `node.effects`, and *grows `absoluteRenderBounds` by it* — then draws nothing. A controlled
test isolated it: a shadow with `offset` rendered at exactly the node's own width with no expansion; a
spread-only shadow rendered nothing at all, because with spread ignored it is the node's own silhouette
hidden directly behind an opaque node. A blurred shadow shows only its blur bleeding out. **Anything
needing a ring or halo must be drawn as real geometry** — the focus rings are two absolutely-positioned
rectangles with `STRETCH` constraints so they track a control's width. CSS `box-shadow` handles spread
correctly, so this is a Figma drawing limitation and not a design constraint.

**`setBoundVariableForPaint` does not always bake the resolved colour into the paint.** It returns a
correctly *bound* paint whose `color` field is still whatever you passed in — and Figma renders the
baked field, so a paint bound to `color/accent` can render black. Build the paint with the variable's
resolved RGB **first**, then bind:

```js
const c = resolveRGB(v)                                    // walk the alias chain to a real value
let p = { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b } }
p = figma.variables.setBoundVariableForPaint(p, 'color', v)
```

Reading `fills[0].boundVariables` back will look perfect either way; only the rendered pixels differ.

**A variant "Change to" interaction defaults to no transition.** `transition: null` swaps instantly.
Clone an existing transition object rather than hand-writing one — the same trick keeps the hover
*effect* identical across all three card sets.

**`addComponentProperty` with `INSTANCE_SWAP` takes a node id as its default and component *keys* in
`preferredValues`.** Passing a key as the default fails with *"Property value is incompatible with
component property type."* The file's own `article card` shows the answer: `defaultValue: "43:843"`
with a key in `preferredValues`. Setting `preferredValues` is worth the line — it restricts the picker
to the five `card images/*` components instead of every component in the file.

**`componentPropertyDefinitions` throws on a variant** — *"Can only get component property definitions
of a component set or non-variant component."* Guard any sweep with
`n.parent.type !== 'COMPONENT_SET'`.

**Binding a layer to a component property overwrites that layer's text with the property default.**
Not a merge; the default wins. On 2026-08-06 this silently destroyed a hand-edited layer and flattened
one variant's placeholders into another's. **Consequence for variant sets: a property shared across two
shapes forces one default onto both**, so where the shapes differ semantically the property must be
split. `source card` ended with a shared `Title` and separate `Source` / `Author` / `Publisher` for
exactly this reason. **Bind on rest *and* hover variants alike** — bind only rest and every text
override snaps back to the placeholder the moment the user hovers.

**A mask GROUP cannot participate in auto-layout.** Its bounds are the union of its children, it cannot
be set to `FILL`, and it lands as `FIXED/FIXED`. Convert it to a frame with `clipsContent = true` and
the image repositioned at the old offset — Case Study's hero (−31) and Singleton's photograph
(−301, −2) were both converted this way with the crop preserved to the pixel.

**An emptied frame keeps a stale height.** Delete a `HUG` frame's only child and Figma cannot hug
nothing, so the old number stays — Note Detail's rail held 201px after its contents were removed. Same
species as the stale-fixed-height trap above, and just as invisible. Set the frame to `FILL` on that
axis so its size is derived.

**Figma cannot express `clamp()`.** Its two modes hold the endpoints; the interpolation lives in CSS.
`size/N` in `Desktop` mode is the 1200px end, in `Mobile` mode the 375px floor, and one fluid
`--font-size-N` token spans them.

## Figma build state

Figma file `pPZPGT6EpSaLkoUDK8HMMp`. **This is an inventory of what exists, not a changelog** — the
history of how it got here has been removed as it stopped being useful.

| | |
|---|---|
| **Collections** | `Primitives` (21 colours), `Semantic` (24, single `Light` mode), `Type Scale` (6, Desktop/Mobile), `Spacing` (24, Desktop/Mobile), `Grid` (7, Desktop/Mobile). Every variable carries a `--css-name` and a description. |
| **Text styles** | 14, viewport-agnostic. Each binds `fontSize` to `size/N`, so a base change propagates without editing any style. |
| **Boards** | Home, Insights, and six page templates — Insight Detail, Note Detail, Web Clipping Detail, Book Note Detail, Case Study, Singleton. All auto-layout, `VERTICAL` gap 0, hugging height, verified by measured geometry against the grid and rhythm values. All 1440 wide; no mobile artboards exist. |
| **Components** | `Top Bar`, `Global Nav`, `Masthead`, `Footer`, `Topics`, `Connect`, `RSS CTA`, `Contact Section` / `Contact Insert`, `Page Header`; card sets `article card`, `note card`, `source card`, five `card images/*`; controls `button` (Surface × State, 10 variants) and `filter` (Selected × State, 10 variants). |
| **Prototype** | Hover and press chains on both control sets at `SMART_ANIMATE` 0.15; click toggles `Selected` on chips. `Focused` cannot be prototyped — Figma has no focus trigger, so those variants are documentation only. |
| **Specimens** | `button — states specimen` and `filter — states specimen` show every state on its intended ground. The Accent button variants are invisible against the component set's white backing, so review them there. |
| **No remote dependencies** | The file was once subscribed to a remote library; a full sweep now finds zero remote components, variables or styles. If unfamiliar tokens reappear, check library subscriptions first — remote nodes are read-only and fail with *"Cannot write to internal and read-only node."* |

---

# Open questions

Small decisions, none blocking.

- **Noto Serif Italic is not installed in Figma**, so the `Caption` style is roman there while the site
  renders italic. Installing the TTF and repointing the style's `fontName` closes it.
- **Case Study's testimonial columns are 6 + 6 at a 24px gutter** — on-grid, and the faithful conversion
  of a hand-built layout, but the Grid section's own table calls 6 + 6 *"gap too tight, the eye jumps
  columns."* `grid/skip-2` (401 / 194 / 401) is one binding away.
- **128px separates Case Study's testimonial band from the article bands either side** — the
  band-stacking rule working as specified, but the first place two bands of *different* kinds meet.
- **`rhythm/list` (32) between unboxed note cards may be too tight.** Their hover boxes bleed 16px each
  side, so two adjacent hover targets sit 32 apart with 16px of box between them. The first thing to
  look at if the Home Notes column reads as crowded on hover.
- **Hover transition conventions have not converged.** Controls are `SMART_ANIMATE` 0.15; `article card`
  and `source card` are `SMART_ANIMATE` 0.3; `note card` is `DISSOLVE` 0.15. The defensible rule is
  **0.15 for controls, 0.3 for cards** — a control should feel immediate, a card can be languid — which
  leaves only the note card out of step.
- **Whether card titles get an underline.** Not required; see Links.
- **Custom form-validation messaging.** Native validation bubbles cannot be styled, so the error tokens
  cannot actually be used until this is designed. It is the real blocker on the error state, not the
  colours.
- **Insight Detail is the least current board.** It was the exemplar everything else was matched to and
  has since been overtaken: its title block is still `FIXED` vertically so a three-line H1 would clip,
  and its rail is `span-3` + `skip-1` where a captioned figure would now want `span-4` + `gutter`.

# Cleanup backlog

Known, bounded, and safe to leave until the relevant surface is worked.

- **~320 raw colour paints remain unbound** — `#ffffff` ×137, `#000000` ×100, `#646464` ×51, `#2b383d`
  ×27, plus a scatter of one-offs. Mostly body text and headings on the boards, predating the semantic
  layer. Binding them to `color/text`, `color/text-muted` and `color/text-inverse` is mechanical.
- **23 text nodes carry no text style**, mostly note-card descriptions and the `AF` monogram — the
  monogram deliberately, since it is a glyph in a fixed circle rather than type.
- **Structurally inert gaps** on components that will only ever hold one child: the five `card images/*`
  (10) and all ten `filter` variants (10), plus the archived `Card Alt` set. *Contingently* inert gaps —
  a `Body Group` holding one paragraph today, a reserved rail — are correct and should be left alone.
- **Multi-paragraph body copy sits in single text nodes** on Case Study and Singleton, so paragraphs run
  together with no `rhythm/paragraph` between them. A mockup artefact: Portable Text emits separate
  `<p>` elements and the CSS puts 24px between them.

---

# What comes next

## More page layouts

The six detail templates are settled and share one skeleton — see Grid → *The detail-page skeleton*.
**Home and the Insights index are the open ones**, and layout decisions are discussed against the whole
page inventory rather than derived from a single page.

Two patterns are available and worth reaching for before inventing a third: the **index-page shape**
(header, filters, masonry) and the **per-section two-column unit** that lets a figure align with body
text rather than with a heading.

**The masonry is faked in Figma and gets built for real on the front end.** The three column frames are
column-major stacks; a row-major DOM will not reproduce that order, so **the card order on the board is
not a specification** — only the column width, gutter and card rhythm are.

## Responsive

The plumbing is complete and unused. `Type Scale`, `Spacing` and `Grid` all carry `Desktop`/`Mobile`, so
one switch drives type, spacing and grid together — but **every board is 1440 and no narrow layout has
been drawn**, so no collapse decision has actually been made.

- **The floor should be 360, not the 375 the clamps are derived over.** Below 375 each `clamp()` returns
  its minimum, so the type system is already correct at 360 without re-derivation.
- **Span tokens collapse to full width on Mobile** — a span token is really a semantic width wearing
  grid clothing. See Grid → *Span tokens name the desktop span*.
- **The margin does not survive intermediate widths.** `grid/margin` is a fixed 222 in `Desktop` mode,
  but the CSS rule is "cap content at 996, margins absorb the remainder, floor 16." Those agree at 1440
  and at 360 and disagree everywhere between — 105 at 1206. The first real tablet frame will need either
  its own mode or hand-set margins. This is the one known hole in the responsive plan.

## Dark mode

See Colour → *Dark mode — what is already true*. In short: the mode axis is ready, the light end of the
blue ramp exists for it, the mid-tones were kept for it, and the error set will need a light variant.

## CSS

**Nothing in this file is in the stylesheet yet.** `web/style/` is still the old 20px / Open Sans
system, so every value here is a specification rather than a description. Three things port
mechanically when that work starts — the `:root` custom properties, the semantic role rules, and the
`clamp()` declarations — and two do not: Figma's nested-auto-layout rhythm becomes sibling margins (see
Vertical rhythm → *Mechanism*), and the focus ring becomes a real `box-shadow` with working spread.
