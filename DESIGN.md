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

**Resolved 2026-08-06: the hero needs no measure token, and `--measure-statement` is retired.**

An earlier version of this file proposed `--measure-statement: 43ch` (~845px) to reproduce "the
current ~44 characters per line." Measurement killed it. The hero statement now fills the content
column — `grid/margin` on the band, `FILL` on the statement — which gives **996px, about 52
characters** at 35.16px. `--leading-statement: 1.4` was derived for *"roughly 50 characters."*
**They already agree.** Capping at 43ch would pull the measure to ~44, moving it *away* from the point
its own leading was designed around, and would likely add a fourth line.

The 43ch figure came from an older mock constrained to 959px and was never re-derived against the
settled grid. **In CSS the statement takes no cap at all** — the grid supplies its measure. Note also
that `--measure-prose: 66ch` resolves to ~1297px at 35.16px, wider than the page, so applying it
would cap nothing. The absence of a cap here is a decision, not an oversight.

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

*(A second set of reference widths — 738px / 699px — lived here until 2026-08-06. Those were the
20px-base numbers and contradicted the 664px figure above. Removed.)*

---

# Grid

Settled 2026-08-06 and tokenized in Figma the same day.

## Grid owns horizontal, rhythm owns vertical

The rule that decides most spacing questions. A gap between columns is a *grid* relationship, not a
rhythm value, and tokenizing it in both places lets the two drift. Consequences:

- Column gaps, page margins and the one-column skip all come from `grid/*`.
- `grid/column` is the **only** `WIDTH_HEIGHT` token in the system. Widths are the grid's business;
  rhythm has none.
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

**Figures and captions.** A caption sits `rhythm/tight` (8) below its image inside a `figure` frame:
the caption is a label to the image's value, which is what `tight` is for. Where a figure sits above
another block in a rail — Book Note's cover above its source card, Singleton's photograph above *On
this page* — the gap is `rhythm/block` (48), the same value that figure would earn in running prose.

**`band` and `section` are two values of one property, not two properties.** Both are a band's
vertical padding; `section` is the heavier choice for a band opening a new page region. Bands stack at
`gap: 0`, so band-to-band space is simply two paddings. This replaced an earlier `rhythm/page`, which
only looked page-level because Insight Detail has a single content band. Home has six, and the role is
per-band.

**`card/*` is a separate prefix on purpose.** "Rhythm" implies vertical page flow, and card padding is
not that. The prefix is also extensible — `filter/*` and `nav/*` will want the same treatment. Leaving
these untokenized is exactly why the two card families drifted to `14/20/16/20` and `12/16/12/16`.

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

Three of twenty-three spacing variables vary — `rhythm/band`, `rhythm/section` and `chrome/inset`
(48 → 16, since a 48px inset on a 360px screen would eat a quarter of it). The rest hold the same
value in both modes.

| Role | Desktop | Mobile | CSS |
|---|---|---|---|
| `rhythm/band` | 64 (2 lines) | 32 (1 line) | `clamp(2rem, 1.0909rem + 3.8788vw, 4rem)` |
| `rhythm/section` | 96 (3 lines) | 64 (2 lines) | `clamp(4rem, 3.0909rem + 3.8788vw, 6rem)` |

Derived over 375 → 1200 with the same arithmetic as the type clamps, so they re-derive trivially if
the mobile floor moves to 360. CSS carries one interpolating value and needs no breakpoint.

**In Figma these are modes, not separate variables.** An earlier version of this file specified
`rhythm/band-mobile` / `rhythm/section-mobile` twins, on the belief that the file was on a single-mode
plan. It is not — `Type Scale` has had `Desktop`/`Mobile` since 2026-07-28. The twins were built on
2026-08-06 and deleted the same day once the mistake surfaced.

**One viewport axis across three collections.** `Type Scale`, `Spacing` and `Grid` all use
`Desktop` / `Mobile`, so "set this frame to Mobile" is a single consistent action. A mode in one
collection and a differently-named variable in another is the trap this avoids — it is the kind of
inconsistency that gets applied wrong late at night.

---

# Colour

Settled 2026-07-28. Specimen with live contrast computation: `web/__design-specimens/color-specimen.html`.

> ## ⚠ TODO — colour is being deferred to a holistic pass
>
> **A full palette audit is pending**, flagged 2026-08-06 and deliberately held back to be done as one
> piece rather than patched incrementally. The **primitives are sound** — every blue, neutral and error
> hex verified against Figma 2026-08-06, so the ramps below are accurate. The **semantic layer has
> moved and this section has not caught up**, so treat any `color/*` claim below as unverified.
>
> ### The agenda, as found so far
>
> 1. **`Dark Accent` is the `Semantic` collection's *default* mode**, so a new frame inherits it and
>    `color/accent` resolves to `blue-700`, not the brand blue. Documented below. **Decide whether
>    `Value` should be the default** — a mode named for a variant, set as the default, is confusing.
> 2. **In `Dark Accent`, `color/link-hover` resolves to `blue-500`, which fails 3:1 on the tinted
>    ground (2.82).** That mode offers a link-hover colour that cannot legally be used on a link.
> 3. **The `button` component's hover variant is `blue-500` with white text — 3.09, fails AA.** This is
>    the exact failure the list at the end of this section records against the *live site* ("button
>    hover, white on `--blue`, 3.03"), carried forward into the mockup rather than fixed. `blue-700` at
>    rest with `blue-600` or `blue-800` on hover would resolve it.
> 4. **There is no `color/text-inverse`.** White text now sits on three coloured bands — Hero, Topics
>    and Footer — every one bound to the raw `white` primitive. Three uses earns a semantic name.
> 5. **The "Known colour problems" list at the end of this section measures the live site, not the
>    mockups.** Three of its items are already resolved in Figma by moving those surfaces to
>    `blue-700`. Confirm and strike them rather than re-solving them.
>
> Nothing here is urgent — none of it blocks layout work — but all of it should be settled together,
> because items 1–4 are the same decision seen from four directions.

## `Semantic` has two modes, and the non-obvious one is the default

Added in Figma outside this file's record; documented here 2026-08-06.

| Token | `Value` mode | **`Dark Accent` mode (default)** |
|---|---|---|
| `color/accent` | `blue-500` `#4e9dbc` | **`blue-700` `#326e85`** |
| `color/link-hover` | `blue-700` `#326e85` | **`blue-500` `#4e9dbc`** |
| all nine others | unchanged | unchanged |

**`Dark Accent` is the collection's default mode**, so a new frame inherits it and `color/accent`
resolves to **`blue-700`**, not the brand blue. The two modes swap `accent` and `link-hover` between
the 500 and 700 steps; nothing else differs.

**This is the change that resolves the nav and footer contrast problem.** White on `blue-500` is
**3.09** and fails; white on `blue-700` is **5.67** and passes AA for body text. The mockups' hero,
Topics band and Footer all measure `#326e85` for exactly this reason. What was listed below as an
unresolved failure has in practice been fixed by moving those surfaces off 500.

Two things to settle in the palette audit: whether `Value` should be the default instead (a mode named
for a variant, set as the default, is confusing), and whether `link-hover` at `blue-500` in that mode
is safe — **it is not, as text**: `blue-500` fails 3:1 on the tinted ground (2.82), so a
`Dark Accent` frame offers a link-hover colour that cannot legally be used on a link.

## Guardrails — the four rules that prevent every failure found so far

Every contrast failure measured in this project reduces to one of these. Hold these and the
detailed tables below become reference rather than something to check:

1. **The brand blue is never text.** `blue-500` is for rules, fills and brand surfaces only. It fails
   even 3:1 on the tinted ground (2.82). Enforced structurally in Figma: `color/accent` is not scoped
   to `TEXT_FILL`. Note this is a rule about the **primitive** — `color/accent` resolves to `blue-700`
   in the default `Dark Accent` mode, which *is* a legal text colour.
2. **White text never sits on `blue-500`.** 3.09 against a 4.5 requirement. White text is safe on
   `blue-700` (5.67), `blue-800` and `blue-900`. Every white-on-blue surface in the mockups uses
   `blue-700`.
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
  --color-accent:      var(--blue-500);      /* ⚠ Figma default mode resolves this to blue-700 */
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

**Measured against the *live site*, not the mockups.** The first three are effectively solved in
Figma, where those surfaces now use `blue-700` (white on it = 5.67, passes AA). They remain listed
because `web/style/` still ships the failing values. Confirm and strike them in the palette audit.

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

**Five collections, and the mode axes are kept deliberately separate:**

| Collection | Contents | Modes |
|---|---|---|
| `Primitives` | 18 raw colours — `blue/*`, `neutral/*`, `error/*`, `white` | single (`Value`) |
| `Semantic` | 11 colours that **alias** primitives — `color/bg`, `color/text`, … | **`Dark Accent` / `Value`** |
| `Type Scale` | 6 font sizes `size/1`–`size/6` | **`Desktop` / `Mobile`** |
| `Spacing` | **23** — 7 primitives `space/1`–`space/7` + 10 `rhythm/*` + 3 `card/*` + 3 `chrome/*` | **`Desktop` / `Mobile`** |
| `Grid` | **7** — `margin`, `gutter`, `column`, `skip-1`, `skip-2`, `span-3`, `span-4` | **`Desktop` / `Mobile`** |

**Two different mode axes are in play, and they are not the same axis.** `Type Scale`, `Spacing` and
`Grid` carry **viewport** (`Desktop`/`Mobile`). `Semantic` carries a **theme** variant
(`Dark Accent`/`Value`). Keeping them on separate collections is what lets a frame be Mobile without
also being Dark Accent. Do not merge them.

**Spacing keeps both layers in one collection, distinguished by prefix.** Colour splits its two
layers across `Primitives` and `Semantic`; spacing does not, because 19 variables do not justify two
more collections and the `space/` ÷ `rhythm/` ÷ `card/` prefixes already make the layer legible in the
picker. If that inconsistency grates, splitting later is a rename, not a rebuild.

**Scope `space/*` and `rhythm/*` to `GAP` only** — never `WIDTH_HEIGHT`. That is "grid owns
horizontal" made structural: Figma will not offer a rhythm token where a width belongs. `grid/column`
is the single `WIDTH_HEIGHT` token in the system.

**Sizes live in their own collection on purpose.** Modes are per-collection, so putting a Mobile
mode on `Primitives` would give all 18 colours a meaningless second mode. More importantly viewport
and *theme* are orthogonal axes — if light/dark is ever wanted, it belongs on the colour collections
independently, and Professional allows both.

**How the mode is used:** select a frame and set its `Type Scale` mode to `Mobile`; every text style
inside resizes, because the styles bind to `size/N` rather than to a fixed number. `Desktop` is the
default mode, so a new frame gets desktop sizes unless told otherwise — worth remembering when
starting a 375px artboard.

**One set of text styles, viewport-agnostic:** `Display`, `H1`–`H4`, `Lead`, `Body`, `Body Compact`,
`Small`, `Eyebrow`, plus the three `Masthead/*` and `Nav` chrome roles. No `Desktop/` or `Mobile/`
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

**Verify an effect by render bounds, never by reading the effect back.** `absoluteRenderBounds` minus
`absoluteBoundingBox` is the overflow an effect actually paints: the hover variant measures +2 right
and +2 bottom, the rest variant 0. That distinguishes *the shadow exists* from *the shadow is visible*,
which reading `node.effects` cannot.

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

The tokens in this file were written into Figma over the MCP on 2026-07-28 (file
`pPZPGT6EpSaLkoUDK8HMMp`). What exists now:

| Built | Detail |
|---|---|
| `Primitives` collection | 18 colour variables (`blue/500–900`, `neutral/100–900`, `error/100·500·600`, `white`), scoped `ALL_FILLS` + `STROKE_COLOR`, each carrying its CSS name via `setVariableCodeSyntax('WEB', …)` |
| `Semantic` collection | 11 colour variables **aliased** to primitives, scoped per role |
| `Type Scale` collection | 6 `FLOAT` variables `size/1–6`, scoped `FONT_SIZE`, modes `Desktop` (default) / `Mobile`. Holds the **18px base** as settled: desktop 16 / 18 / 22.5 / 28.125 / 35.15625 / 43.9453125, mobile 16 / 17 / 21 / 25 / 30 / 32. Exact fractional values preserved. |
| Text styles | **14**, viewport-agnostic — 10 content roles (`H1`, `H2`, `H3`, `H4`, `Lead`, `Body`, `Body Compact`, `Small`, `Caption`, `Eyebrow`) plus 4 chrome roles (`Display`, `Masthead/Name`, `Masthead/Role`, `Nav`). Leading and tracking as percentages; `fontSize` bound to `size/N`, so a base change propagates to every style without editing any of them |
| Leading synced | 2026-08-06. `Body` 160% → **180%**, `Lead` 145% → **160%**, closing the gap that made Figma internally inconsistent — the `Spacing` collection's 32px unit is `18 × 1.8` rounded, and had been sitting against a 28.8px line box. Converted boards reflowed: Insight Detail +174, Singleton +132, Ideas +63, Home +39. The four absolutely-positioned boards reported **zero** change, which means their text grew inside fixed-height frames — see Outstanding. |
| `Body Compact` | Created 2026-08-06. 18px / 150%, bound to `size/2`. Applied to the description text in both card component sets — 8 nodes, propagating to all 36 instances. |
| `note card` wired | 2026-08-06. Padding 12/16 → `card/pad`, inner stack gap 4 → `card/gap` (8) across all four variants, descriptions onto `Body Compact`, inert outer gap zeroed. Card 139 → 155. The **only** remaining raw value is the clipping variant's 2px link-row nudge, kept as a documented optical exception. Choosing 8 for the inner stack settled the 4px question — see *Still open*. |
| Home Insights wired | 2026-08-06. Band off `primaryAxisAlignItems: CENTER` onto `grid/margin` + `MIN` — it had **no horizontal padding** and centred its children, so with a 346 Notes column the content summed to 1026 and both columns sat 15px off-grid. Now 7 + `skip-1` + 4 = 996 exactly, Articles `FILL` at 222→793, Notes pinned to `grid/span-4` at 902→1218. All six gaps bound; the Notes heading→description gap was **5**. Note card padding 12/16 → `card/pad`. Cards outdented to 348 — see Grid → Outdenting. Band 902 → 960. |
| Home Hero wired | 2026-08-06. `rhythm/band` + `grid/margin` (it had **no horizontal padding** — its 996 came from a `FIXED` child, the third distinct mechanism found for establishing the content column). Stack and statement to `FILL`, statement gap to `space/4`, statement fill to `white`. The `button` component set: padding 8/12 → `space/1`/`space/2`, inert gap zeroed, label off an unstyled 20px onto `Nav`. Band 339 → 350. The stack's `counterAxisAlignItems: MAX` — which right-aligns the button — is deliberate. |
| Audit 2026-07-28 | All 12 styles verified against this file: fonts, bound variables, resolved sizes, leading and tracking all match. Only divergence found was `Display` tracking, which Andy relaxed −0.5% → 0%; this file now records 0% as correct. |
| Migrations completed | 23 nodes off the remote `font-size/body`; 33 nodes off remote `blue-500` / remote `white-100` / legacy `bg/primary` / `card/hover border`; 4 nodes off the remote `Heading/1` and `Heading/2` styles onto local `H2`/`H3`; 17 style-less nodes onto mode-aware `size/2`. Every pass verified at zero remaining references. |
| `Spacing` collection | Built 2026-08-06. **23** `FLOAT` variables — 7 `space/1–7` primitives plus 10 `rhythm/*`, 3 `card/*` and 3 `chrome/*` roles **aliased** to them. All scoped `GAP`, all carrying a `--css-name` and a description. Modes `Desktop` (default) / `Mobile`; only `rhythm/band` (64/32), `rhythm/section` (96/64) and `chrome/inset` (48/16) differ. |
| `Grid` collection | Built 2026-08-06. **7** `FLOAT` variables, modes `Desktop` / `Mobile`: `margin` 222/16, `gutter` 24/8, `column` 61/20, `skip-1` 109/36, `skip-2` 194/64, `span-3` 231/328, `span-4` 316/328. `column`, `span-3` and `span-4` are `WIDTH_HEIGHT`; the rest `GAP`. |
| Layout grids bound | 2026-08-06. All 19 grid-bearing frames and components converted to `STRETCH` and bound — `offset` → `grid/margin`, `gutterSize` → `grid/gutter`. Four detail boards (Web Clipping, Book Note, Note, Case Study) were still `CENTER section=61`; converting them produced no visual change, since both resolve to 996 content and 222 margins at 1440. |
| Components wired | 2026-08-06. **`article card`** — all four variants on `card/pad` (squared the drifted 14/20/16/20 to 16), `card/gap`, `card/media`; the eyebrow→body gap was `0` and is now 8. **`Top Bar`** — `chrome/pad-header` + `chrome/inset`, masthead lockup on `space/2`, nav row on `space/3`. **`Topics`** — `rhythm/section`, `grid/margin` (fixing a 223 drift), 7 + `skip-1` + 4 with Genres pinned to `grid/span-4`, lists restyled from an unstyled 20/175% to `Nav` and split into per-item text nodes. **`Connect`** — `rhythm/section`, `grid/margin`, 5 + `skip-2` + 5. **`Footer`** — `chrome/pad-footer`, `grid/margin` (it had none; width came from a hardcoded 996 child), `rhythm/block`, social icons on `space/5`, link grid on `gridRowGap`/`gridColumnGap`. |
| Remote library cut loose | 2026-08-06. The nav row (`Property 1=Frame 89`, from remote set `Component 1`) and two nested `search` components were **read-only remotes used in every Top Bar** — 30 instances across 9 boards. Detaching them inside the local `Global Nav` fixed all 9 at once. **A full sweep of 1216 nodes now finds zero remote components, variables or text styles**, so the library can be unsubscribed. |
| Audit 2026-08-06 | Full inventory verified against this file: 5 collections, all modes, every variable's resolved value in every mode, all 12 text styles. Colour primitives match hex-for-hex. Two divergences found — see Outstanding 1 and 2. |
| Five detail boards converted | 2026-08-06. **Note Detail**, **Web Clipping Detail**, **Book Note Detail** and **Case Study** taken off `layoutMode: NONE`; **Singleton** corrected. All five now `VERTICAL` gap 0 hugging height, so a footer can no longer hang off the board bottom — three of them were overflowing by exactly 83px. Every board verified by measured geometry against the grid and rhythm values: 19 / 24 / 30 / 48 / 23 checks. Heights 1331→1394, 1581→1703, 2089→2136, 4931→4951, 2669→2689. |
| Board fixes worth naming | The `Frame 427318204` (83) → `Frame 427318199` (20) double wrapper around every Top Bar, deleted on all four. A stale `COLUMNS 1 / 1024 / gutter 30 / CENTER` grid alongside the bound 12-col one, deleted from three boards. Related rows off 1027 / gap 32 / cards 321 onto 996 / `grid/gutter` / `grid/span-4`. Left edges drifting 222 / 223 / 225 / 226 and widths 647 / 648 / 655 / 656 / 659, all resolved by `FILL`. Book Note's summary was `textAutoResize: NONE` — a fixed box that clipped silently. Case Study's testimonial columns 471.5 / 48 / 471.5 → 486 / `grid/gutter` / 486, its attribution gap **−3 → 0**, and its hero mask group → a clipping `Hero` frame. |
| `source card` | Built 2026-08-06. One set, two shapes × rest/hover, matching how `article card` and the note card set are built: `Type = Link \| Book`, `State = Rest \| Hover`. **Link** = title ↗ / thumbnail / source; **Book** = author / title ↗ / publisher + year. Properties `Title`, `Source`, `Publisher`, `Thumbnail` (`INSTANCE_SWAP`, `preferredValues` restricted to `card images/*`), plus `Author`. Bound to `card/pad`, `card/gap`, `color/surface`, `color/border`, `color/text-muted`. Hover effect and transition cloned from the existing sets. Replaced the two detached "article card" frames on Web Clipping and Book Note. |
| `card images/Arango` | Created 2026-08-06. The Web Clipping thumbnail existed only as an image fill layered on top of the WHO placeholder, so it was not swappable. Promoted to a real component alongside Garmin / WHO / Map / SC. |
| `Caption` | Created 2026-08-06. `size/1`, 150%, paired with `color/text-muted`. **Roman in Figma, italic on the site** — see Typography → `Caption`. |
| Clipping swept | 2026-08-06. 17 programmatically-created frames had inherited `clipsContent: true` and were cleared. `Hero` on Case Study and the cropped photograph on Singleton are the only frames across the five boards that clip, both correctly. |
| Removed | legacy `Variable collection` and its 4 orphans; `body/default`; the 8 `Mobile/*` text styles (verified unused); the 12 `size/desktop/*` + `size/mobile/*` variables superseded by modes; the `rhythm/*-mobile` twins (built and deleted 2026-08-06 — see Vertical rhythm) |

**`color/accent` is deliberately NOT scoped to `TEXT_FILL`.** That makes the "never text" contrast
constraint structural — Figma will not offer the brand blue in a text-colour picker.

### Outstanding

1. ~~**The four absolutely-positioned boards have text overflowing their frames.**~~ **Resolved
   2026-08-06** — all four converted, plus Singleton. Worth recording what the damage actually was,
   because the prediction was half right. There was **no hard overlap**: the failure was crowding to
   the edge of collision. Book Note's Key Concepts list ended **3px** above the `Impressions` heading
   where 64 belongs; Web Clipping's blockquote ran **6px** into the paragraph below where 48 belongs;
   Case Study's approach body sat **15px** from `Project Outcome`. Each body block had grown 4px per
   line (28 → 32px line box) and eaten the air beneath it. The prediction missed a second failure
   entirely: **three of the four boards had their Footer hanging 83px off the bottom of the board**,
   because the board frames were stale heights from before the Footer component was wired.
2. **`Semantic`'s `Dark Accent` mode is the collection default.** Now documented in the Colour section,
   but the decision stands: should `Value` be the default instead, and is a `link-hover` of `blue-500`
   safe in a mode where it is offered as a text colour? Folds into the palette audit.
3. **The full palette audit** — requested 2026-08-06, to run as its own pass. The Colour section
   carries a TODO banner; primitives are verified but the semantic layer and the contrast tables have
   not been re-checked since `Dark Accent` appeared.
4. **The filter-toggle labels and note-card descriptions** (17 nodes) carry a direct `size/2` binding
   with no text style applied, so they keep their own font and leading. Applying `Body` would change
   their appearance — the toggles in particular are Lato UI labels, not prose. Leave them until the
   design phase decides what those roles are.
5. **`rhythm/list` (32) between unboxed note cards may be too tight.** Their hover boxes bleed 16px
   each side, so two adjacent hover targets sit only 32 apart with 16px of box between them. Not
   wrong, and not worth changing on argument alone — but the first thing to look at if the Notes
   column reads as crowded on hover. *(The note card set is otherwise fully bound as of 2026-08-06;
   the only raw value left is the clipping link row's 2px optical nudge, which is deliberate.)*
6. ~~**Two *detached* frames named "article card"**~~ **Resolved 2026-08-06**, but not as planned. They
   were not article cards and could not become instances of that set: Web Clipping's carried title /
   thumbnail / **author**, Book Note's carried **author / title / publisher + year**, and the
   `article card` set offers title / image / **date** / description. They were a *citation of the
   source work* — a component that did not exist. Hence the new `source card` set. The lesson
   generalises: **a detached frame that resists re-instancing is usually evidence of a missing
   component, not of a lazy copy.**
7. **Insight Detail's title block (`Frame 427318263`) is `FIXED` vertically**, so a three-line H1 will
   clip. The prose column itself was flipped to `FILL` with the rail pinned to `grid/span-3`
   2026-08-06, so this is the last sizing problem on that board.
8. **Remaining structurally inert gaps.** The four detail boards' `427318204` (83) / `427318199` (20)
   and Singleton's are **resolved 2026-08-06** — those wrappers are deleted, not just zeroed. Still
   outstanding: Insight Detail's `Frame 427318268` (96) and `Hero` (10); Ideas' `427318258` (7); and
   inside components, the four `card images/*` (10), `filter` (10) and `button` (4).
   **Distinguish two kinds.** *Structurally* inert — a wrapper that will only ever hold one child —
   is noise and should be zeroed. *Contingently* inert — a correctly configured container whose
   content happens to be one item today — is right and should be left alone. The conversion added a
   third case worth naming: a **reserved rail** is an empty frame that is nonetheless load-bearing,
   because the prose column derives its width from it. See Grid → *Aligning a figure with the body*.

9. **Insight Detail is now the least current of the six boards.** It was the exemplar every other board
   was matched to, and the others have since overtaken it: its title block is still `FIXED` vertically
   (item 7), it still carries the inert 96 and 10 gaps (item 8), and its rail is `span-3` + `skip-1`
   where a captioned figure would now want `span-4` + `gutter`. Nothing is broken; it is simply no
   longer the reference.

10. **Two hover transition conventions coexist.** The note card set dissolves at 0.15s; `article card`
    and `source card` smart-animate at 0.3s. Defensible — the note card is unboxed at rest and gains a
    whole box, while the other two only gain a shadow — but if one hover feel is wanted across all
    cards it is a two-line change.

11. **Card titles are `neutral/800` in Figma and `--neutral-900` in this file.** All three card sets
    use 800. The new `source card` matches them rather than this document, deliberately, so that one
    set is not the odd one out. Fold into the palette audit and settle it in one direction.

12. **Raw colour values found during the conversion**, all left alone because colour is deferred:
    `#646464` for meta text in the note card set (where `color/text-muted` belongs), `#f3f3f3` on Case
    Study's testimonial band, raw `#000000` on several body text fills, and the hover variants binding
    their fill to the `white` primitive where rest uses `color/surface`. Add to the palette audit.

13. **Multi-paragraph body copy sits in single Figma text nodes.** Visible on Case Study and Singleton,
    where paragraphs run together with no `rhythm/paragraph` between them. This is a mockup artefact
    rather than a design decision — Portable Text emits separate `<p>` elements and the CSS rules put
    24px between them — but it makes those blocks read tighter in Figma than they will on the site.

### The remote library — resolved 2026-08-06

The file was subscribed to a remote library ("Collection 1"). Three variables came from it —
`font-size/body`, `blue-500`, and a *second* `white-100` distinct from the local one — plus, which
went unnoticed until 2026-08-06, **the nav row and search icon in every Top Bar**.

**Remote things cannot be edited from this file.** That is a hard wall, not an inconvenience: the nav
row's 24px gap could not be bound to a token while it was remote, and the attempt failed with
*"Cannot write to internal and read-only node."* That error is the reliable way to discover a remote
dependency you did not know about.

**Remote things also only disappear once nothing references them**, which is why every migration
re-pointed bindings rather than overwriting values. The last references were the three components,
detached inside the local `Global Nav` so that one operation covered all nine boards. **A 1216-node
sweep now finds zero remote references of any kind**, so the subscription can be dropped.

If new remote tokens ever reappear, check the file's library subscriptions first.

For the record: with Figma's previous `#479fd5`, `blue-500` failed even the 3:1 large-text threshold
(2.80), so headings designed in that blue could not have shipped.

The Figma file is currently named "AndyFitzgerald.net"; the domain change is off, so the name is
misleading and worth changing.

# Still open

- **The full palette audit** — the largest open item. See the TODO banner in Colour.
- ~~Whether `figcaption` stays italic serif or moves to Lato.~~ **Resolved 2026-08-06 — italic serif**,
  as the `Caption` style. What remains is not a decision but a tooling gap: **Noto Serif Italic needs
  installing as a system font before Figma can draw it.** Until then the Figma style is roman while the
  site renders italic.
- **Case Study's testimonial columns are 6 + 6 at a 24px gutter.** The split is the faithful conversion
  of a hand-built 471.5 / 48 / 471.5, and it is on-grid — but the Grid section's own table calls 6 + 6
  *"gap too tight, the eye jumps columns."* The alternative is `grid/skip-2` (401 / 194 / 401), which is
  one binding away. Left as-is pending an eyeball, since the content is two authored paragraphs rather
  than one run of prose.
- **128px now separates Case Study's testimonial band from the article bands either side** — 64 from
  each band's padding, meeting at gap 0. That is the band-stacking rule working exactly as specified,
  but it is the first place on the site where two bands of *different* kinds meet, so it is worth
  looking at rather than assuming.
- ~~Nav and footer treatments on the blue background~~ — **effectively resolved.** Those surfaces moved
  to `blue-700`, where white text measures 5.67 and passes AA. Confirm formally in the palette audit.
- Whether card titles get an underline. Andy is experimenting; not required (see Links).
- Custom form-validation messaging, needed before the error state can actually be used, since native
  validation bubbles can't be styled.
- Page templates and layout — **the five detail templates are now settled** (Insight, Note, Web
  Clipping, Book Note, Case Study, plus the Singleton page shape), all on the same skeleton and all
  verified against the grid. Home and the Ideas index are still open, and still discussed against the
  whole page inventory. The **grid** itself is settled and has its own section above.
- **The margin at intermediate widths.** `grid/margin` is a fixed 222 in `Desktop` mode, but the CSS
  rule is "cap content at 996, margins absorb the remainder, floor 16." Those agree at 1440 and at 360
  and disagree everywhere between — see the Grid section. Currently latent: the 1206-wide Home variant
  that demonstrated it has been deleted. It returns with the first real tablet frame.
- **Mobile artboards do not exist yet.** Every board is 1440. The mode plumbing is complete — one
  `Desktop`/`Mobile` switch drives type, spacing and grid together — but nothing has been laid out at
  a narrow width, so no collapse decision has actually been made. The floor should be **360**, not the
  375 the clamps are derived over; below 375 each `clamp()` simply returns its minimum, so the type
  system is already correct at 360 without re-derivation.
- **Masonry on the Ideas index** — deferred 2026-08-06. Andy is evaluating a plugin and a CSS
  approach; the three Figma column frames are column-major stacks, which is not what a row-major DOM
  order would produce.
- ~~**The 4px question.**~~ **Resolved 2026-08-06 — the scale stays at seven steps, no ⅛ rung.** The
  only genuine sub-8 candidate was the note card's title / meta / description stack at 4. Bound to
  `card/gap` (8) and judged by eye: the card grows ~8px and reads better for it, which is unsurprising
  given the stack was tightened to compensate for the old 1.6 leading. The three remaining sub-8
  values in the file are optical nudges — the masthead name→role at 2, the card image's 6px top pad,
  the clipping link row at 2 — and stay deliberately untokenized. **`space/1`–`space/7` is final**
  unless a second genuine spacing case appears below 8.
- **Nothing is in the CSS yet.** The whole system — type, colour, rhythm, grid — exists in DESIGN.md
  and Figma only. `web/style/` is still the old 20px/Open Sans system, so every value in this file is
  currently a specification rather than a description.
