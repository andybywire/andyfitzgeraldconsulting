# Layout and spacing — decisions and rationale

Backs the **Layout & Spacing** section of [DESIGN.md](../../DESIGN.md).

Read this when a layout or spacing decision is being **questioned, excepted, or changed** — not as
background for ordinary work.

---

## The grid: 12 columns, 996px content, 222px margins at 1440

**Both ends close exactly.** `2×222 + (12×61 + 11×24) = 1440`, and at the 375 mobile floor
`2×16 + (12×20 + 11×8) = 360`. Those numbers are not approximate and shouldn't be nudged.

**The grid must stay simple and flexible.** It should not become intricate or highly constrained —
layout ideas need room to keep being explored.

**Typography must not drive grid decisions.** Measure is satisfiable at more than one width — 996
with 8-column prose, or 1200 with 7-column prose — so it constrained the *column span*, not the grid.
This is the corollary that keeps one page's reading requirement from setting the whole site's
geometry.

**Layout grids stretch rather than center.** A centered grid fixes the column width and lets the
margins float; stretching fixes the margin and lets the columns flex, which is what
`minmax(1rem, …)` gutters against `1fr` columns produce.

---

## Grid owns horizontal, rhythm owns vertical

The rule that decides most spacing questions. A gap between columns is a *grid* relationship, not a
rhythm value, and tokenizing it in both places lets the two drift.

**The rule is not self-enforcing for gaps.** In Figma, `space/*` and `rhythm/*` are scoped `GAP` only
and never `WIDTH_HEIGHT`, which makes it structural for *widths* — Figma will refuse to offer a rhythm
token where a width belongs. That is how the contact form's 48px input height surfaced as a missing
role (`field-height`) rather than being quietly bound to a spacing token meaning something else. But a
horizontal gap *is* a gap, so nothing stops a rhythm token being used for one. **Keep it by hand.**

**`grid-gutter-content` is the gutter that isn't the grid's gutter**, and the only token whose mobile
value exceeds its desktop one. `grid-gutter` exists to make the column arithmetic close; its mobile
value of 8 is a consequence of that arithmetic, and **8 is never a gap you actually want between two
columns of content** — two 160px lists of links 8px apart do not read as two lists. `grid-gutter`
stays the pure grid-definition value; `grid-gutter-content` carries the real gap.

---

## Why 12 columns is poor for symmetric splits

A 12-column grid offers only three symmetric two-column layouts, because the gap must be a whole
number of columns and gutters: **6+6** (gap too tight, the eye jumps columns), **5+2+5**, and
**4+4+4** (unusable).

**Nothing exists in between.** A gap of 60 or 80 puts the columns at 468 or 458, neither of which is a
grid width, so the inner edges float off the grid while the outer edges stay on it. 12 is generous for
asymmetric splits and poor for symmetric ones.

**Bind the skips rather than retyping them** — 109 and 194 both look arbitrary enough to get
"corrected."

---

## Span tokens, and pinning the narrow column

**Every span token collapses to the full content width on mobile**, because at 375px nothing sits in
a fraction of 12 columns — it stacks. The arithmetically honest mobile values are never what you want,
so a span token is really a *semantic width* wearing grid clothing. Name it for the desktop span
anyway; that is the only scheme that scales without inventing a role name per use.

**Pin the narrow column and let the wide one fill.** In any two-column split only one side needs a
width: `996 − 316 − 109 = 571`, computed rather than typed. That halves the hand-entered numbers and
puts the prose column — the one that should absorb intermediate widths — on the filling side. This is
why `span-3` and `span-4` exist and `span-7` and `span-8` do not.

**The rule only protects you if the narrow column is actually pinned.** A hug-sized rail inverts it,
and a photograph cropped two pixels off `span-3` once propagated into prose resolving to 654 instead
of 656. **A photo crop was setting the measure.**

---

## Vertical rhythm derives from the line box, rounded

Body is 18px at 1.8, so one line box is **32.4px**. The scale is built on **32px = 2rem**, a 1.2%
round-down; `space-1` … `space-7` are ¼, ½, ¾, 1, 1½, 2 and 3 units.

**The rounding is deliberate and costs nothing.** Nothing here runs on a baseline grid — impractical
with fluid type, images and mixed leading — so the unit does not need to *equal* the line box, only to
be commensurate with it. What the rounding buys is a scale whose every step is a whole number of
pixels *and* a clean `rem`, which 32.4 is not. This is an 8px grid **derived from the line box rather
than imposed on it**, so if the type scale changes the spacing scale regenerates from the new line box.

Note this cuts the opposite way from the font sizes, where ugly values are kept exact — there the
ugliness is unavoidable if the ratio is to hold; here it is avoidable and buys nothing.

**Why `rhythm-paragraph` is ¾ of a line and not a full one.** The gap has to hold the paragraph break
clearly above the within-paragraph line distance, or the paragraph stops cohering as a unit — and that
requirement gets *stronger* as leading loosens. At ¾ the baseline-to-baseline distance across a break
is ~56px against 32.4px within, a **1.74×** step that stays unmistakable. A full line (2.0×) is the
other defensible choice; ½ would be marginal at 1.5×.

**Check ratios in apparent space, not in token values.** Every line box contributes half-leading, so
the white above an h2 measures ~81px and below it ~33px — about 2.5:1, not the 4:1 the raw numbers
suggest.

**`rhythm-band` and `rhythm-section` are two values of one property**, not two properties: both are a
band's vertical padding, and `section` is the heavier choice for a band opening a new page region.
Bands stack at gap 0, so band-to-band space is simply two paddings. **Which of the two a band takes is
decided by how it reads, not by a rule** — the Hero takes `band` despite being a colored
self-contained region, because 96 read as too much air above a three-line statement. Expect to try
both and look.

**A token earns a name only when more than one thing uses it, or the values move as a set.** One-off
component spacing binds a `space-N` primitive directly. Optical nudges — a 2px alignment correction
between a glyph and adjacent text — stay untokenized deliberately, because giving them a token invites
people to reach for them as spacing values.

**Value collisions are the live hazard.** Four values are shared by two or more roles (8, 16, 48, 64).
The collisions are deliberate — roles that agree today and can diverge later — but they are
indistinguishable by value in a picker, and that has already produced wrong bindings twice.

---

## Why the rhythm mechanism is sibling margins

Portable Text emits a flat sequence — `p p h2 p p figure p` — with **no section wrappers**, so `gap`
cannot express "tighter after a heading." That constraint, not preference, produced the six-selector
rule in DESIGN.md.

- Every selector is `* + X`, so a **first child never picks up a margin** — no `:first-child` reset.
- Nothing sets `margin-bottom`, so there is **no margin collapsing** to reason about.
- All six have equal specificity, so **source order decides**. `heading-close` is last, which is what
  makes a heading bind to whatever follows it, including a figure.
- **No new container** — these are margins on existing grid items, the same move-only-one-edge logic
  the measure cap uses.

**Figma expresses the same system as nested auto-layout, because one frame has one gap. The two
structures are not parallel and cannot be made parallel.** They share the scale and the role names;
the mechanics differ by tool. That is not a defect to reconcile.

---

## Responsive is split by cause, not by size

The useful division is *what creates the space*:

- **Type-derived spacing does not change.** `tight`, `heading-close`, `item`, `paragraph`, `list`,
  `block`, both heading roles and every `card-*` role exist because of the line box or the component,
  and body moves only 18 → 17px between viewports.
- **Page-derived spacing does.** `band`, `section` and `chrome-inset` exist because of the viewport,
  and three lines of dead air between regions is wrong on a short screen.

Only three of the twenty-four spacing roles vary.

**Figma boards are 375; the CSS floor stays 360.** At 375 every `clamp()` sits exactly at its minimum,
which is what the mobile values *are*, so a 375 board shows precisely what the CSS produces at the
floor — and below 375 the clamps keep returning those same minimums, so the type system is already
correct at 360 with no re-derivation.

**Author the footer DOM in the mobile order** — blurb, links, social, copyright — and produce the
desktop arrangement with grid placement. Source order then equals reading order at both sizes, with no
`order` property fighting the accessibility tree.

**One shipped contrast failure closes at this breakpoint.** The live site's mobile nav is white on the
old `--blue` at 3.03. White on `accent` is 5.67.

---

## Outdent the card, never the column

Note cards sit unboxed at rest, so their *text* must align with the heading above them. A card has
16px of padding, so if its box sits on the column line its text is inset and misaligns. On hover the
box appears and should bleed outward.

**Rejected: widening the column.** It looks like the same fix and is not. The first attempt widened the
notes column by 30px, the band split that across both columns, and **the sibling articles column
drifted 15px off the grid** while every other band on the page stayed put. The outdent leaked into
something that had nothing to do with it.

Confine it to the card and nothing else moves. The value derives from `card-pad`, so the two cannot
drift.
