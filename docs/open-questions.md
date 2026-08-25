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

*And a measured consequence.* Opening the 8+3 split at 48rem takes the prose from 66 characters at 767
to **49 at 768**, recovering around 1028, with the rail at 166px. Accepted for now (2026-08-24) on the
grounds that a short measure is the cheaper failure and the rail is likelier to force the change —
see DESIGN.md → Two breakpoints. Judge it against real content pages, not the specimen.

**A grid-placed sibling breaks the rhythm bond above it.** The vertical rhythm ramp excludes
`.sidebar` and `.banner` from *taking* a flow margin, but it cannot stop them *giving* one —
`.sidebar + p` still matches the base rule. So an `h2` → `.sidebar` → `p` sequence gives the paragraph
`rhythm-paragraph` (24) where `heading-close` would give 16, and the paragraph loses its bond to its
heading. Sibling margins have no way to express "skip the out-of-flow element."

Whether it ever bites depends on **grid placement, not on the ramp.** If the rail is explicitly
`grid-row`-placed so it consumes no row in the prose column, the paragraphs either side are visually
adjacent and the 24 is already right. If it does consume a row, the result is a vertical hole. **Not
addressable until the grid and the rail component exist — phase 4** — and the fix belongs in the grid
rules rather than in the ramp. See DESIGN.md → The CSS mechanism.

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

**Rail headings have no role.** "On this page", "Topics", "Work I Did" — h3-styled headings in a
sidebar or rail. They are *headings*, which points at `text-heading`, and simultaneously navigational
**apparatus**, which is exactly `text-muted`'s job. The system has no role for a heading of apparatus.
They currently take `text-heading`. The choice matters more in dark than light — 15.64 against 6.78,
where light is 12.25 against 6.78.

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
- **Hover transition conventions have not converged**, though phase 3 built to the rule rather than
  against it: 0.15s on the mode selector and the search button, 0.3s on the nav underline wipe and the
  social marks' draw. That is controls-immediate, decoration-languid, which leaves only the note card
  to check when it lands.
- **`rhythm-list` (32) between unboxed note cards may be too tight.** Their hover boxes bleed 16px
  each side, so two adjacent hover targets sit 32 apart with 16px of box between them.
