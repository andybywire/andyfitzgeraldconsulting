# Typography — decisions and rationale

Backs the **Typography** section of [DESIGN.md](../../DESIGN.md).

Read this when a type decision is being **questioned, excepted, or changed** — not as background for
ordinary work. DESIGN.md carries the scale, the clamps and the rules; this carries why.

---

## Two faces

**Noto Serif** for running prose, lead paragraphs, captions, pull-quotes and the one hero `display`
statement — chosen for screen legibility. It descends from Droid Serif and has deliberately generous
spacing and open apertures, which matters below for tracking.

**Lato** for h1–h4 and all metadata and UI.

**Open Sans, the previous body face, was dropped** — it saves ~577 KB.

---

## The scale: 18px base, ratio 1.25

**The base is 18, not 20.** Read at measure, 20px was too large: Noto Serif's big x-height makes it
read larger than the number suggests.

**Step 1 is a clamped floor at 16px, off the ratio.** 18 ÷ 1.25 is 14.4px, below the legibility
minimum for captions — and **the ratio cannot be lowered to fix it.** Keeping step 1 ≥ 16 from an 18
base caps the ratio at 1.125, which would put step 6 at 28.8px and leave no display size at all.

The consequence is paid at the small end: body:small compresses from 1.25 to **1.125**, so captions
read as slightly-smaller body rather than clearly subordinate. They lean on italic and muted color
instead, which is why `caption` is italic rather than merely smaller.

`size/0` (14px, chip and tag labels) sits below the floor deliberately — the floor is about *reading*
text, and chrome is not reading text.

**The odd values (`2.746582031rem`) are correct and intentional.** They are referenced by name and
never retyped, and keeping them exact means the scale regenerates cleanly if the base or ratio moves.
This cuts the opposite way from the spacing scale, where ugly values were rounded away — there the
ugliness was avoidable and bought nothing; here it is unavoidable if the ratio is to hold.

---

## Fluid sizing

```
slope    = (S₂ − S₁) / (V₂ − V₁)
vw part  = slope × 100
rem part = (S₁ − slope × V₁) / 16
```

**Reading sizes are nearly flat, and that is the system.** Step 2 spans 1px and step 3 spans 1.5px, so
body and lead are effectively constant across viewports and only display type is meaningfully fluid.
This followed from the 18px base rather than from drift.

**The preferred value must stay `rem`-dominant, and this was measured.** A purely `vw` preferred value
does not respond to a reader's browser font-size preference, so their text is locked. At a simulated
24px default, `1.4vw` and `clamp(16px, 1.4vw, 20px)` both stayed at **67%** of proportional — no
growth at all — while the rem-dominant form reached **97%**. Keep body around 85% rem-weighted;
display sizes may lean harder on `vw`.

**Rejected: one fluid base multiplied by the ratio.** Base 18 × 1.25⁴ would put a 44px h1 in a 343px
column. Per-step clamps mean the ratio *compresses* on small screens — ≈1.17–1.28 at 800px against a
clean 1.25 at desktop. Intended, not drift.

---

## Leading is indexed by measure, not by size step

**The least obvious rule in the system, and the one most likely to be "corrected" back to something
worse.**

> Leading pairs with the **measure**, not the size step. The step is only a *proxy* for measure, and
> it holds exactly as long as one step means one column width. The moment the same step appears at two
> measures, the proxy breaks and the step-based rule gives the wrong answer.

**The prose ramp is not monotonic, and that is correct.** 1.5 → 1.8 → 1.6 looks wrong until you read
it as a measure ramp: short measures need little, body at the full 67-character column needs the most,
and the lead is larger type in the same column so it holds fewer characters and needs less again.

**Body sits near a ceiling, not in the middle.** Two things independently justify 1.8 — Noto Serif's
large x-height puts more visual mass on every line, and 67 characters is a long measure where leading
keeps the return sweep accurate. **Above about 1.85 the lines begin to disassociate**, so there is no
headroom above it.

**`body` and `body-compact` share one size step and differ only in leading. Do not merge them.** A
card description sits in 284px — about **29 characters**, against the ~67 that 1.8 was derived for —
and at less than half its intended measure `body` reads conspicuously airy.

The control that confirms the diagnosis: the *horizontal* card variants are 370px (~41 characters) and
their descriptions already fit in three lines, so switching styles moved their height by **zero**.
Only the narrow measure was ever suffering — which is what a measure-driven rule predicts and a
size-driven one does not.

**Prose and headings need separate ramps.** At the same 22.5px a lead paragraph wants 1.6 and an h3
wants 1.3. One ramp cannot serve both, which is also why the hero statement does not borrow the
heading ramp's 1.2 however short it gets.

---

## Tracking is a Lato-only adjustment

**The serif is never tracked.** `display` was originally specified at −0.5%, scaled down from Lato's
−1.5% on the reasoning that "a serif needs less." Three reasons 0% is the better answer:

- Negative tracking compensates for spacing optimized for *reading* sizes and only earns its keep
  above roughly 50–60px. At 35px a face is barely into display territory.
- Noto Serif's spacing is deliberately generous, and tightening closes its counters.
- Serifs already create horizontal connection between letters.

---

## h4 has no size step left

h4 sits at body size and differentiates by **family + weight + tracking** — Lato 700 at +2%. Below h3,
size stops being a usable signal: any step small enough to sit between h3 and body is too close to
body to read as a heading.

**If it reads as bold body text, the levers are uppercase, small caps, color or a hairline rule —
not a smaller size step.**

---

## Measure

Target **60–75 characters**. `66ch` measures ~67, since 1ch ≈ 1.03 average lowercase characters in
Noto Serif. Because `ch` is font-relative, the 18px base changed the measure's pixel width but not its
character count: **~664px at 18px** where it was 738px at 20px.

**On the 996px grid the measure is delivered by the column span, not by a cap** — 8 of 12 columns is
656px ≈ 67 characters. The `max-width` is a safety net for any context wider than 8 columns, not the
primary mechanism.

**Rejected: a `.prose` grid container.** It was prototyped and it worked — pixel-exact alignment,
measure/wide/full tiers, `subgrid` full-bleed panels — but it **re-centered the measure, which moved
the left edge of text between page types.** That is a whole-site layout decision, and it was being
driven by one page's measure requirement. It also assumed detail pages had no right-column content,
which is false: case studies carry both rail relationships. **Don't revive it outside an explicit
layout discussion.**

Capping with `max-width` on an existing left-aligned grid item moves only its *right* edge, so measure
is capped with no layout disruption and no template change.

---

## Two smaller rules

**`caption` is italic serif.** A caption reads as part of the reading matter, not apparatus around it,
and the italic plus muted color do the subordinating the size step can no longer do — body:small is
only 1.125 on this scale. Figma renders it roman purely because Noto Serif Italic is not installed
there; the site ships the italic face.

**A role may occupy a different step per viewport, but only where the layout jumps.**
`masthead-name` is the one case — step 4 desktop, step 5 mobile — acceptable only because the
element's *job* changes at that breakpoint, from a left lockup beside the nav to a centered standalone
wordmark. **It would never be acceptable for body text**, which does the same job at every width.
