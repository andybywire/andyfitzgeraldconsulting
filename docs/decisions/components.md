# Components and shapes — decisions and rationale

Backs the **Components** and **Shapes** sections of [DESIGN.md](../../DESIGN.md).

Read this when a component decision is being **questioned, excepted, or changed** — not as background
for ordinary work.

---

## Buttons

**Interaction increases the fill's separation from the page.** Light satisfies that by darkening
(5.42 → 7.77 → 10.15 against the ground); dark satisfies the same rule by *lightening*
(6.17 → 16.03 → 18.86). **Darkening is the mechanism, not the rule** — check the direction against
the page, never against the previous step.

**Rejected: keeping white text on the dark accent button.** A white label pins the fill to `blue-500`
or darker — `blue-400` is only 4.08 under white — and on a near-black page every legal step from there
moves *toward* the page: 3.33 → 2.32 → 1.78. **A white-text accent fill on a near-black page has no
working interaction ramp at any values.** Structural dead end, not a tuning problem. See
[color.md](color.md) for the theme-wide consequence.

**The light-ground button has no border, and that is a specification rather than an omission.** It
carried a white 1px stroke for a while, invisible against the `#f9fafb` ground at 1.05 — so it went
unnoticed, and would have appeared the moment a dark ground existed. Only the accent-band ghost takes
a border.

**On an accent band the button cannot lighten while keeping white text, so it inverts instead.** The
window is genuinely empty: white text survives only to L 41%, where the fill sits 1.23 against the
band and is invisible against it; separating from the band needs L ≥ 80%, where white text is at 1.53.
So the ghost goes **outline → solid white → gray**, three maximally distinct states rather than a
tonal ramp.

---

## The focus ring is stated by relationship, not by fixed colors

> **Inner ring contrasts with the control; outer ring contrasts with the surface.**

The same two colors in both contexts, order swapped — 5.67 / 5.42 on light, 5.67 / 5.67 on the band.

**Rejected: a fixed inner-white / outer-accent ring.** It **fails on the accent band**, where the
white inner merges with the white ghost button and the accent outer merges with the band. Stating the
rule as a relationship is what makes it survive a context change — and a theme change.

**Radii are derived from the control they wrap** — inner at `radius + 2`, outer at `radius + 4`. The
button's inner ring is 5 *because the button is 3*, not because 5 is a value in the system. In CSS
this is a real `calc()`, so the dependency stays live. In Figma it can't be, so the derivation lives in
the layer name.

**The capsule chip is the one place the derivation collapses.** `border-radius` clamps to half the
shorter side, so a ring around a capsule is a capsule at any size — there is nothing left to derive,
and both rings simply take `radius-full`. The `+2` / `+4` still hold, but as the rings' *offset* rather
than as an addition to a radius, which is why the chip's ring layers are named for the offset alone.
The rings stay **unbound** in Figma even so: binding them to `radius-full` would be correct only while
the chip is a capsule, and a chip that later returned to a numeric radius would silently inherit that
radius instead of `radius + 2` — the exact error leaving them raw prevents.

**Radius tokens are ordinal, and only the terminal value is named** — `radius-1`, `radius-2`,
`radius-full`. Two reasons. `radius` rather than `rounded` because it names what the value *is* rather
than the effect it produces, which is also why `rounded-*` is a utility-class convention while every
token system ships `radius` or `border-radius`. And ordinal rather than t-shirt sizes to match
`space-1`…`space-7` and the type scale, which were already ordinal — t-shirt naming also forces a
rename the moment an intermediate value appears, since today's `md` becomes tomorrow's `lg`.

`full` is named rather than numbered because **it is not a point on the ramp.** 9999 is a sentinel
meaning *clamp to half the shorter side*, so the rendered radius follows the element's height rather
than the token; numbering it would invite interpolation where nothing meaningful sits between 6px and
a capsule. Mixing one named terminal into an ordinal ramp signals exactly that difference, and leaves
`radius-3` onward free.

---

## Chips and tags

**The chip border is its own role, not the card hairline** — a card is not a control, a chip is. Form
inputs take the same token for the same reason.

**Tags are markers, deliberately not controls.** A small neutral pill on a card marking what
accompanies it.

**Rejected: the accent for tags.** It read too pressable. A filled accent pill with white text is
structurally the *selected* filter chip, so on an index a tag and a selected chip would have looked
alike while meaning different things. A tag has no hover, no pressed and no focus, and those variants
were **deleted rather than specified**, because they would document behavior that cannot occur.

If tags ever become links to a topic archive they need hover and focus, and a link needs them at 4.5.

**The tag's pill is 1.21 against a white card, and that is not a failure.** WCAG 1.4.11 governs
interactive components and graphics *required to understand the content*; a tag is neither, and its
label carries the meaning. The pill is decorative reinforcement, the same standing as the quote bar.

It is quiet, though — **if the shape stops earning its keep, muted text with no pill is the honest
simplification.**

---

## Note cards change state, not just size, at mobile

Unboxed at rest on desktop, boxed at rest on mobile, with **no hover state at all on mobile**. The
outdent has nowhere to go at full width, and the box does the separation work hover did on desktop.

Touch devices have no hover, so a permanently-hovered mobile card would encode a state that cannot
occur. **A viewport that removes an interaction needs the state renamed, not reused.**

---

## Blockquote is an element rule, not a component

Portable Text emits `<blockquote>` and the stylesheet styles it. The indent is
`padding-inline-start`, **not margin** — the bar sits at the box edge, so a margin would put the gap
outside it and create nothing. Testimonials coming from review documents rather than Portable Text
take a class while sharing the same custom properties.

**The quote bar sits inside the indent**, so text sits 42px from the bar on desktop and 20 on mobile,
not 48 and 24. That is the number to reason about when the indent looks wrong.

**Why the indent varies by viewport and the bar with it.** 48px is 7% of a 656 column but 15% of a 328
one. This is a *proportion* fix, not a measure fix — every candidate indent lands within three
characters of the others, so tightening buys almost no measure. **24 puts mobile back at exactly 7%**,
matching desktop, which is why that value rather than a taste call. The bar had to follow: at 6px it
was 12.5% of a 48 indent and would have been 25% of a 24 one, doubling in visual weight precisely as
the indent halved.

---

## The page header's optional lead is required by the rail

The boolean is not offered as flexibility. Where a rail image aligns to the top of the *lead* rather
than the h1, pulling the lead up into the header would realign the image to the paragraph below it.

**The gap after the header belongs to the parent band, not the component** — a component cannot carry
the space that follows it, so pages legitimately differ there.
