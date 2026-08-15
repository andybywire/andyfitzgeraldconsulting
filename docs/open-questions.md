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
colours** — `error-bg`, `error-line` and `error-text` are specified in both themes and have nowhere to
go.

---

## Known holes

**The margin does not survive intermediate widths.** The CSS rule is *cap content at 996, let margins
absorb the remainder, floor 16*, which gives 222 at 1440, **105 at 1206**, and 16 below about 1028.
The token is a fixed 222, so the two agree at 1440 and at 360 and disagree everywhere between. The
first real tablet frame will need either its own mode or hand-set margins. **Still the one known
hole.**

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

## Roles that may be missing

**Rail headings have no role.** "On this page", "Topics", "Work I Did" — h3-styled headings in a
sidebar or rail. They are *headings*, which points at `text-heading`, and simultaneously navigational
**apparatus**, which is exactly `text-muted`'s job. The system has no role for a heading of apparatus.
They currently take `text-heading`. The choice matters more in dark than light — 15.64 against 6.78,
where light is 12.25 against 6.78.

**Headings no longer sit softer than body in dark.** `text`, `text-heading` and `text-title` all
resolve to `neutral-200`. Recovering the softening needs a neutral step between `200` and `300`, which
the ramp does not have. See [decisions/colour.md](decisions/colour.md).

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
- **Hover transition conventions have not converged.** The defensible rule is 0.15s for controls and
  0.3s for cards — a control should feel immediate, a card can be languid — which leaves only the note
  card out of step.
- **`rhythm-list` (32) between unboxed note cards may be too tight.** Their hover boxes bleed 16px
  each side, so two adjacent hover targets sit 32 apart with 16px of box between them.
