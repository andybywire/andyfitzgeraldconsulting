# Open design questions

Things that are **not settled**. Companion to [DESIGN.md](../DESIGN.md), which links here rather than
carrying these inline — they are worth tracking, but they are not build inputs and don't belong in
context for every design interaction.

Settled decisions live in [decisions/](decisions/). Figma mechanics live in
[figma-notes.md](figma-notes.md).

---

## Blocking something

**Custom form-validation messaging.** Native validation bubbles cannot be styled, so the error tokens
cannot actually be used until this is designed. **This is the real blocker on the error state, not the
colors** — `error-bg`, `error-line` and `error-text` are specified in both themes and have nowhere to
go.

---

## Known holes

**The margin does not survive intermediate widths.** The CSS rule is *cap content at 996, let margins
absorb the remainder, floor 16*, which gives 222 at 1440, **105 at 1206**, and 16 below about 1028.
The token is a fixed 222, so the two agree at 1440 and at 360 and disagree everywhere between. The
first real tablet frame will need either its own mode or hand-set margins. **Still the one known
hole.**

*Phase 3 gave it a second face.* The formula's own switch at ~1028 means **the content width has three
regimes while the CSS has two breakpoints**, so anything that has to mirror the layout outside the
cascade needs a condition at a width that appears nowhere in tokens.css. That surfaced while writing
`sizes` attributes and was avoided by using `sizes="auto"` — the browser measures the box instead of
being told about it — but the underlying mismatch is unchanged and the next thing that cannot read the
cascade will meet it again.

*The measure consequence is CLOSED — see Settled in phase 4.* The 8+3 split's 49-character measure at
768 was judged on the real article page and accepted (2026-08-26).

*One measurement worth keeping.* At 1023 the prose is 653 and the rail 230, not 656/231, because
`--grid-margin` has already hit its 16px floor below ~1028 and the content band is 991 rather than 996.
That is the fixed-222 hole above behaving exactly as recorded, not a second fault.

**Mobile prose leading.** Every prose measure roughly halves at 360 while the type barely moves — the
hero statement runs 43 characters on desktop and 19 on mobile, descriptions 50 → 33, paragraphs
46 → 31. `body`'s 1.8 was derived for **~67 characters**; at 31–33 it is squarely in the 1.5 register.
That is precisely the `body-compact` diagnosis, now applying to ordinary body text across the whole
mobile page.

The hero has been corrected and body has not, because the correction is **free in CSS and expensive in
Figma** — a media query on a custom property costs nothing, while Figma cannot hold leading as a ratio
in a variable, and overriding it on a node severs the text style along with its size binding. The
likely answer is to leave Figma at 1.8 and express the correction only in CSS. **But that breaks the
diffability the two systems are built for, so it deserves a decision rather than a drift.**

---

## Settled in phase 4

All of these were closed against the **real article detail page**, which is what several of them had
been waiting for. Kept here rather than deleted, because each was open long enough to be worth a
pointer.

- **The 8+3 split's short measure at 48rem.** 66 characters at 767 → **49 at 768** → 58 at 900 → 66
  again by 1023, re-measured in the browser rather than estimated. Judged fine in practice, so 48rem
  stays and stops being "the breakpoint to move first". DESIGN.md → Two breakpoints.
- **The sticky rail's `top` offset.** `var(--rhythm-band)`, so the pinned nav keeps the same breathing
  room the bands have rather than sitting flush against the viewport edge. The masthead does not stick,
  so `top: 0` was the alternative. A value no board could show.
- **Rail headings.** They keep `text-heading`, and it is now a decision rather than a default: **dark is
  where the choice mattered and dark is where `text-heading` is clearly right**, 15.64 against
  `text-muted`'s 6.78. No role for "a heading of apparatus" needs inventing after all.
- **The hero caption's alignment**, which was not on this list because it did not exist until the
  caption was built: right-hung against the viewport edge from md, **left-aligned below it**, where the
  page has one column and everything else in it starts at the same edge.

**A grid-placed sibling breaks the rhythm bond above it — RESOLVED BY CONSTRUCTION** (2026-08-26).

The question was whether the rhythm ramp's `.sidebar` / `.banner` exclusion would leave a vertical hole:
the ramp stops those two *taking* a flow margin but cannot stop them *giving* one, so an
`h2` → `.sidebar` → `p` sequence would hand the paragraph `rhythm-paragraph` (24) where `heading-close`
would give 16. It was deferred to phase 4 on the grounds that the answer depended on grid placement.

**It depended on something simpler: whether either class appears inside `article.detail` at all, and
neither does.** Both are residue of the 11ty structure, where `<article class="detail grid">` *was* the
grid and contained the hero figure and the rail as children. In the Astro build the hero is a band in
the page stack and the rail is a **sibling** of `article.detail` inside `<Grid>`, so neither can ever
land in the `article.detail > *` sequence the ramp matches.

Verified rather than assumed, three ways: `.banner` has no consumer anywhere in `web-next`;
`index.astro` already writes its specimen rail as a sibling of `</article>`; and the built article page
reports **zero** matches for `article.detail .sidebar`, `article.detail .banner`, `.sidebar` and
`.banner`, with `article.detail`'s children a flat `p / h2 / h3 / ul / figure / pre` sequence.

**The exclusion is therefore inert, and it is left in place.** Removing it is a separate call: it costs
nothing, `:where()` contributes no specificity, and the day a grid-placed element does land inside a
detail body it is the rule that stops the bug. What is retired is the *open question*, not the code.

---

## Settled in phase 3

Kept here rather than deleted, because each was an open question long enough to be worth a pointer.

- **`masthead-name`'s inverted endpoints** — a step at the masthead's own breakpoint, not an inverted
  clamp, and static at both ends. DESIGN.md → Typography.
- **The focus ring at `radius-1`** now has a real control to judge on: the mode selector. DESIGN.md
  asked for that check in phase 3 and it is on screen, unresolved by eye.
- **Whether an accent band's focus ring needs the swapped pair** — yes, and the mode selector is the
  first component that proves it: `focus-offset` is white and its selected pill is white, so the
  default order would put an invisible ring on the one control that most needs it.
- **The masthead's tablet state**, which the Figma boards never drew. It needed no design: six items in
  equal columns produce it on the way from two rows to one.

## Roles that may be missing

~~**Rail headings have no role.**~~ **Closed 2026-08-26 — see Settled in phase 4.** They keep
`text-heading`. The tension was real: a rail heading is a *heading*, which points at `text-heading`,
and simultaneously navigational **apparatus**, which is exactly `text-muted`'s job. The prediction that
"the choice matters more in dark than light" held — 15.64 against 6.78, where light is 12.25 against
6.78 — and dark is where `text-heading` turned out to be clearly right. **No role for a heading of
apparatus needs inventing.**

**Headings no longer sit softer than body in dark.** `text`, `text-heading` and `text-title` all
resolve to `neutral-200`. Recovering the softening needs a neutral step between `200` and `300`, which
the ramp does not have. See [decisions/color.md](decisions/color.md).

---

## Taste calls, none blocking

- **Whether the pale end of the blue ramp is wanted on an accent band.** `blue-50` clears AA on the
  light band at 4.82. The contrast question is settled and does not forbid it; whether it *reads*
  right is untested.
- **The chip pressed tint reads closer to selected than the original rationale allowed.** Pressed is
  `blue-400`, **1.39** against the accent, where the rationale was written for `blue-300` at 1.86.
  Both label pairings pass (4.62 and 6.17), so this is a legibility-of-state question, not a contrast
  one.
- **Whether card titles get an underline.** Not required — see Links in DESIGN.md.
- ~~**Hover transition conventions have not converged.**~~ **Converged 2026-08-28** — see DESIGN.md →
  Transitions. Controls-immediate at 0.15s, decoration-languid at 0.3s, and now applied to the things
  that had been binary: link colour, the rail's hover underline and both card hover states. The note
  card, which this entry was waiting on, landed inside the convention rather than outside it. One
  mechanism worth remembering: `text-decoration-line` is a discrete keyword and cannot be
  transitioned, so the rail animates `text-decoration-color` from `transparent`.
- **`rhythm-list` (32) between unboxed note cards may be too tight.** Their hover boxes bleed 16px
  each side, so two adjacent hover targets sit 32 apart with 16px of box between them.
- ~~**The masonry's `grid-auto-flow`: sparse or `dense`.**~~ **Decided `dense` 2026-08-28, judged on
  screen with a deliberately oversized card in the set.** Visually the better of the two, and for
  anyone not navigating by keyboard it is strictly better. What is left open is not the choice but
  whether its cost ever bites — see below.

  Sparse packing moves the placement cursor forward only, which is what guarantees a card never
  appears above an earlier one; the price is that a card can be held down by a taller card in a
  *previous* column, leaving gaps well over the design's 32. **Measured against a corpus carrying one
  unusually tall card — the case that settled it, since an even set of heights understates sparse
  badly:**

  | | worst gap | gaps > 33 | total excess | ragged bottom |
  |---|---|---|---|---|
  | sparse | **287.75px** | 3 | 511px | 365px |
  | `dense` | 32.88px | 0 | 0px | **168px** |

  So this was not a trade of balance for order — dense is better on **both** counts here, and a 288px
  hole in a column is not a rounding error.

  **The accepted cost: 21 of 45 positions differ from tab order — but no card moves more than two
  slots.** That second number is the one to keep: it is a chain of small local shifts, not the
  wholesale column-major jumbling that ruled `column-count` out, and the count is inflated by
  construction, since one card rising past another displaces both. **DOM order is untouched**, so
  screen-reader traversal and a future `h-feed` stay chronological; only the visual-to-focus
  correspondence gives, and only locally. Judged minor, explicitly as a call about a real experience
  rather than a measurement — so worth re-checking if the corpus grows several very tall cards.

  **Reversible in one word.** Nothing structural depends on it — not the DOM order, the `nth-child`
  column placement, the spans, or the filter scripts, which act on *which* column a card is in rather
  than where it sits within one. The console snippet that produced the 6-of-45 figure badges every card
  with its tab position against its visual position; it is in the phase 4 session notes and worth
  keeping to hand for the re-check.
