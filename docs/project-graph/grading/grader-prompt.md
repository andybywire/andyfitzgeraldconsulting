You are grading answers to five questions about the code and docs in this repository. Each
question was put to three separate sessions working in a checkout of this same commit, and each
answer below is one session's reply, exactly as it came back. The answers within a question are
in a random order and carry no names.

Score every answer against its question's rubric. Judge from the answer's own text. Use this
checkout's files only where a rubric tells you to check something against the code, and don't
edit any files. Line numbers in an answer may not match this checkout exactly: identify a place by
what the answer describes, not by its line numbers alone.

For each answer, score every item its rubric lists, using only the scores the rubric allows. Give
each item a score, a quote and a note:
- a score above 0 needs a short quote from the answer that earns it, copied exactly;
- a score of 0 has an empty quote, and the note may say what came close;
- the note is one short line, or empty.

Also report "stoppedShort": true when the answer stops partway to ask whether to continue, rather
than finishing, and false otherwise.

Reply with JSON only, in one ```json block, as an array with one object per answer, in the
order the answers appear:

[
  {
    "label": "T1 · answer 1",
    "items": {"1": {"score": 1, "quote": "…", "note": ""}, "2": {"score": 0, "quote": "", "note": "…"}},
    "extra": [],
    "stoppedShort": false
  }
]

"extra" is used only where a rubric says so, and is otherwise an empty array.

========== T1 ==========

The question, as each session received it:

After a message is sent on the contact page, a blue focus ring appears around the "Thanks for reaching out!" message and the sentences after it. How would I suppress it? Explain where it comes from and what you'd change, but don't edit any files.

The rubric for T1:

Five items, each 0 or 1, except item 5:
1. Names base.css's global `:focus-visible` `box-shadow` as the source of the ring.
2. Names the script's `.focus()` on the success block, or `:target` focus, as what puts focus
   there, and keeps that focus move rather than removing it.
3. Finds the existing ring suppression in `web/src/components/cards/CardMasonry.astro` as the
   precedent.
4. Flags ContactForm's own comment, which says no ring would appear, as wrong.
5. Proposes clearing both `outline` and `box-shadow` on `:focus`: 1. On `:focus-visible`
   instead, or clearing one property only: 0.5. Neither: 0.

---------- T1 · answer 1 ----------

The ring is base.css's site-wide focus ring. It draws because the script moves focus onto the success message, and the comment that says this wouldn't happen relies on a claim the project has already recorded as wrong. No files were changed.

## Where it comes from

Three pieces work together:

1. **The script moves focus to the message.** On a successful send, `showState(sent)` at `web/src/components/ContactForm.astro:762` adds `.is-shown` and calls `block.focus()`. That works because the wrapper at `ContactForm.astro:152` has `tabindex="-1"`. This is on purpose: it's how a screen reader learns the form was replaced (`contact-state-announced-by-focus-not-live-region`).
2. **Every focused element gets the ring.** The global rule at `web/src/styles/base.css:716` applies to anything matching `:focus-visible`. It draws two rings with `box-shadow`, and the outer one is `--color-focus-ring`, which is the blue you're seeing. The ring goes around the whole `.contact-sent` div, so it encloses the heading and the paragraph.
3. **The comment that says it can't happen is wrong.** `ContactForm.astro:544–550` deliberately leaves the ring in place, on the grounds that "a `tabindex="-1"` element does not take a visible ring from a scripted `.focus()` anyway." That sentence cites `scripted-focus-on-tabindex-minus-one-draws-no-focus-visible-ring`, and the project graph lists that claim as **overturned**:

   > overturnedBy `scripted-focus-on-tabindex-minus-one-can-draw-focus-visible-ring` — Seen in Chrome, Safari and Vivaldi after scripts/card-index.ts focused the card grid … real browsers disagreed with headless Chrome and the Browser pane.

   The card grid ran into this on 2026-09-30, but the contact form's comment was never updated. Browsers use their own rules to decide whether focus set by a script counts as `:focus-visible`. A likely factor here is that the Send button is disabled while the message sends, so nothing has focus when `.focus()` runs after the `await`. I haven't measured that. The precedent already found that headless checks don't reliably show this, so test it in a real browser.

## What I'd change

Use the same fix as the card grid (`web/src/components/cards/CardMasonry.astro:209`), which DESIGN.md:1126 records as a decision. In the component's `<style>`:

```css
.contact-state:focus {
  outline: none;
  box-shadow: none;
}
```

- **`:focus`, not `:focus-visible`**, so it holds however each browser decides. It also covers a click on the message, which would focus it now that it's focusable.
- **Both properties**, because base.css draws the ring with `box-shadow`, while the browser's own default would draw it with `outline`.
- **No `!important` needed.** With Astro's scoping attribute it's (0,3,0) against base.css's (0,1,0).
- **It covers the error message too.** That gets the same scripted focus and would show the same ring. It's a place focus is moved to, not a control, so the reasoning that applies to the grid applies here as well.

Screen readers aren't affected: focus still moves, so the message is still announced. You only lose a visible ring on something you can't operate.

Along with the CSS:
- Rewrite the paragraph at `ContactForm.astro:544–550` to give the actual reason, pointing to the card grid's history.
- Update the tags: drop `contact-state-focus-visible-not-suppressed` and the overturned claim, and cite `scripted-focus-on-tabindex-minus-one-can-draw-focus-visible-ring` and `focus-visible-heuristics-vary-for-programmatic-focus`. Also add a new decision claim to `claims.ttl`, something like `no-focus-ring-on-contact-state`. `node project-graph/graph.mjs check` should currently be flagging this comment for relying on an overturned claim.

## A decision for you: local or shared

This would be the **second** place that hides the ring on an element focus is moved to, which by your own rule is when a shared rule should be considered. There's also a third candidate: all ten `<main id="main" tabindex="-1">` elements that the skip link focuses, plus `#result-count` in `ResultsFooter.astro`.

**My recommendation is to keep it local.** A global `[tabindex="-1"]:focus` rule would also catch the honeypot input and anything added later. And whether a ring around `<main>` after using the skip link is a fault or useful feedback is a separate question I don't think is settled. You decide whether this gets promoted.

## Unrelated bug nearby

`ContactForm.astro:858`, in the back-button restore handler, sets `sent.hidden = true`. The file's own comment warns against this: base.css's `[hidden] { display: none !important }` beats `.is-shown`. So after a visitor goes back to the page and sends a second message, the success message never appears, and `.focus()` on it silently does nothing. It should be `hideState(sent)`, matching the line below it.

## What you'd check after the change

Send a message in Chrome, Safari and Vivaldi, once by clicking Send and once by pressing Enter on it. Each time, the thank-you message should show with no ring, and the next Tab should land on the first focusable element after the form. Then force a failure (go offline in DevTools) and confirm the error message shows no ring either.

---------- T1 · answer 2 ----------

## Where the ring comes from

It's the site-wide focus ring, and it's showing because the comment that says it won't is out of date.

1. **The success block is focusable, on purpose.** `.contact-sent` has `tabindex="-1"` (`web/src/components/ContactForm.astro:152`). After a successful send, `showState(sent)` calls `block.focus()` (`:765`) so a screen reader announces the confirmation. Without that, the Send button would just disappear with no signal.
2. **base.css draws the ring on anything that matches `:focus-visible`.** That's the two-ring `box-shadow` at `web/src/styles/base.css:716`. The ring surrounds the heading and paragraph because it's drawn around the whole block.
3. **The component deliberately leaves that ring in place.** The comment at `ContactForm.astro:544-550` says "a `tabindex="-1"` element does not take a visible ring from a scripted `.focus()` anyway," tagged with the claim `scripted-focus-on-tabindex-minus-one-draws-no-focus-visible-ring`.

That claim was disproved on 2026-09-30. `project-graph/glossary.md:1227` records it being overturned by `scripted-focus-on-tabindex-minus-one-can-draw-focus-visible-ring`: headless Chrome said no ring, but real Chrome, Safari and Vivaldi drew one around the card grid. The card grid was fixed; this comment still relies on the disproved version. Whether a browser shows the ring after a scripted focus depends on its own rules and on how the user got there, such as keyboard or mouse. That's why you see it and the earlier test didn't.

The no-JavaScript path can do the same thing. Landing on `#contact-sent` focuses the block, because it's focusable.

## What I'd change

There's already a fix for this exact case in `web/src/components/cards/CardMasonry.astro:209`. I'd copy it into the `.contact-state` section of the component's `<style>`, right after the `.contact-state` rule:

```css
.contact-state:focus {
  outline: none;
  box-shadow: none;
}
```

Why it's written this way (the same reasons the card grid gives):

- **`:focus`, not `:focus-visible`**, so it works however each browser decides. A `:focus-visible` rule would depend on the same browser behavior that just proved unreliable.
- **Both properties.** base.css draws its ring with `box-shadow` and clears `outline`, but a browser's default styles draw with `outline`. Clearing only one leaves the other.
- **No `!important`.** The component's scoped selector is (0,3,0) against base.css's (0,1,0), so it already wins.
- **On `.contact-state`, not just `.contact-sent`.** The error block is focused the same way and would get the same ring.

The surrounding notes would also need updating, since they carry the reasoning:

- **The comment at `:544-550`:** rewrite it to say the ring is suppressed and why. The block is a landing point, not a control: it's never in the tab order, and screen readers announce it either way. Swap the overturned claim id for `scripted-focus-on-tabindex-minus-one-can-draw-focus-visible-ring`.
- **The glossary:** `contact-state-focus-visible-not-suppressed` is a recorded decision, so it should be replaced, not deleted. That means a new decision id (something like `no-focus-ring-on-contact-state`) that overturns it, mirroring `no-focus-ring-on-landing-grid`.

## The part that's your call

This reverses a recorded accessibility decision, so I'd count it as one of your decisions rather than mine. I recommend making it:

- The precedent is yours: you made the same call for the card grid.
- The ring around a whole message looks like a bug, not a focus position.
- Hiding it costs very little. A sighted keyboard user loses the visual marker on a block they can't interact with. Their next Tab still moves on from that point and lands on something with its own ring.

Screen readers aren't affected: the focus move, which is what makes the confirmation get announced, stays exactly as it is.

I haven't edited anything, as you asked.

---------- T1 · answer 3 ----------

The ring comes from the global focus style, and the comment that says it can't happen here is wrong. Browsers *can* draw a visible ring when a script moves focus. This is the same thing that happened with the card grid in September.

## Where it comes from

Three pieces work together:

1. **The global ring.** `web/src/styles/base.css:704` draws the two-ring `box-shadow` on every element that matches `:focus-visible`.
2. **The block can take focus.** The success block is marked up with `tabindex="-1"` (`web/src/components/ContactForm.astro:149`). That lets the script move focus to it, so a screen reader announces the confirmation in place of the button that just disappeared.
3. **The script moves focus there.** `showState()` calls `block.focus()` after revealing the block (`ContactForm.astro:736`).

The component meant for this to show no ring. The note at `ContactForm.astro:529–532` says:

> a `tabindex="-1"` element does not take a visible ring from a scripted `.focus()` anyway

That isn't reliably true. Browsers use their own rules to decide whether a script-moved focus "should" look visible, and those rules differ by browser and by how you got there. Chrome, for example, carries a visible ring over to the new target if the last thing you did was use the keyboard, such as typing in the message box or pressing Enter to submit. `CardMasonry.astro:195–200` records the same mistake: headless Chrome said `:focus-visible` was false, and real browsers drew the ring anyway.

The no-JavaScript path probably does it too. When the endpoint redirects to `#contact-sent`, the browser jumps to that fragment and focuses the target, which can draw the ring as well.

## What I'd change

Add one rule to `ContactForm.astro`'s style block, next to the `.contact-state` rules (around line 556), copying the grid fix:

```css
.contact-state:focus {
  outline: none;
  box-shadow: none;
}
```

- **`:focus`, not `:focus-visible`,** so it holds whatever each browser's rules decide. That's the lesson `CardMasonry` already learned.
- **Both properties,** because `base.css` draws the ring with `box-shadow`, while a browser's default stylesheet draws it with `outline`.
- **No `!important` needed.** With Astro's scope attribute, the rule's specificity is (0,3,0) against `base.css`'s (0,1,0).
- **It covers both success paths and the error block,** since `.contact-sent:target` and `.is-shown` both style the same `.contact-state` elements.

I'd also rewrite the comment at lines 529–532. Right now it asserts the false claim. It should say the ring is suppressed, why, and point to `CardMasonry`.

**Accessibility:** focus still moves, so the screen reader announcement, the reason for the `tabindex`, is unaffected. The block is a place focus lands, not a control: it isn't in the Tab order, and the next Tab goes to whatever follows it. WCAG's focus-visible requirement (2.4.7) is about controls you operate with the keyboard, which this isn't. For a sighted keyboard user, the form being replaced by the confirmation already shows where they are.

## A design decision for you

This would be the **second** component suppressing the ring on a focus landing point. CLAUDE.md treats a second consumer as the trigger for promoting something to the global tier. There are two more candidates with no suppression yet: `<main id="main" tabindex="-1">` (the skip link's target, on every page) and `#result-count` in `ResultsFooter.astro`.

So: does "a focus landing point draws no ring" belong in `base.css` as a role, or stay local in each component?

**I'd keep it local for now.** No one has reported a ring on `main` or the result count. A global selector like `[tabindex="-1"]:focus` is a broad match that could quietly catch a future element that *should* show a ring. Two hand-written rules with comments pointing at each other is cheap.

If you'd rather promote it, a global rule needs a deliberate opt-in hook, not a match on the `tabindex` value. Your call.

I haven't edited anything. If you want the change, the check is to submit the form once by clicking Send and once by pressing Enter in a field, in Chrome and Safari. Then load `/contact/#contact-sent` directly to test the no-JS path.

========== T2 ==========

The question, as each session received it:

We're considering a rule that elements which only ever receive focus from script, never from the Tab key, should not draw a focus ring anywhere on the site. Before anything changes: list every place in the repository, code and docs, that would need to change, or that currently says something about how these elements look or behave when focused. One line each on why. Don't edit any files.

The rubric for T2:

Each item below is a place in the repository, scored 1 when the answer lists it and 0 when it
doesn't. The answer lists a place when it names the file and the rule, element or comment the
item describes, by line numbers or by describing it unambiguously. Paths are under `web/src/`
unless they start at the repository root.

- 1: `styles/base.css` around lines 690-709: the global focus ring.
- 2: `components/cards/CardMasonry.astro` around lines 185-209: the one existing ring
  suppression, and its reasoning.
- 3a: `components/ContactForm.astro` around lines 143-147: the success and failure state blocks,
  focused by script.
- 3b: `components/ContactForm.astro` around lines 529-533: the comment saying no ring appears.
- 4a: `layouts/BaseLayout.astro` around lines 720-731: the skip link's target, `<main>` with
  `tabindex="-1"`.
- 4b: the nine `<main id="main" tabindex="-1">` elements in `pages/`. Naming them as a group
  counts.
- 5a: `components/ResultsFooter.astro` around lines 78-93: `#result-count`, focusable by script.
- 5b: `scripts/card-index.ts` around line 650: where `#result-count` is focused as a fallback.
- 6: `scripts/card-index.ts` around lines 706-725: where the card grid gets `tabIndex = -1`, and
  why.
- 7: `DESIGN.md` around lines 1120-1123: the design rule naming the grid a landing point whose
  ring is suppressed.
- s1: `docs/urls-and-filtering.md` around lines 390-395: the deferred option of focusing a
  heading with `tabindex="-1"`.
- s2: `scripts/search.ts` around lines 923-928: the same deferred option, as search records it.
- s3: `CLAUDE.md` around line 585: the skip link, and `tabindex="-1"` on the `<main>` elements.

"extra": every place the answer lists that has nothing to do with the rule in the question: it
would not need to change, and it says nothing about how elements focused only by script look or
behave when focused. For each, {"location": "…", "why": "…"}. Don't list related places just
because they aren't items above.

---------- T2 · answer 1 ----------

I made no edits. Here's the inventory. The glossary tags did most of the finding, and I filled in the rest with searches for `tabindex`, `.focus()`, `:focus` and `focus-visible` across the code and docs.

## Elements the rule would cover today

There are four, all with `tabindex="-1"`:

| Element | How focus reaches it |
|---|---|
| `<main id="main">` on 9 pages | the skip link, which is a fragment link, not script |
| The card grid | `card-index.ts` on a filtered arrival, or a click in the gutters |
| `#result-count` | `card-index.ts`, when a Show more or Show all button disappears |
| The contact form's sent and failed blocks | `ContactForm.astro`'s script, or for no-JS visitors, `:target` on `#contact-sent` |

Only the grid suppresses its ring today. The other three get base.css's ring whenever a browser decides they match `:focus-visible`.

## Code

- `web/src/styles/base.css:699-721`: the global `:focus-visible` ring. A site-wide exception would go here, and the comment would need to name it.
- `web/src/components/cards/CardMasonry.astro:186-212`: the grid's local `:focus { outline: none; box-shadow: none }`. A global rule would make it redundant, but its comment holds the measurement the rule depends on.
- `web/src/components/ContactForm.astro:544-551`: **directly contradicts the proposal.** It keeps the ring on the state blocks on purpose. It also argues from `scripted-focus-on-tabindex-minus-one-draws-no-focus-visible-ring`, a claim the glossary already marks as overturned, so this comment is wrong today whatever you decide.
- `web/src/components/ContactForm.astro:143-150, 152, 172`: the comment on the state blocks' markup says why they are focusable. It would need a sentence on how they look when focused.
- `web/src/components/ContactForm.astro:757-765`: the script's `block.focus()` after the swap, which is the moment the ring would appear.
- `web/src/components/ResultsFooter.astro:80-99`: `#result-count` has no focus style. Under the rule it needs suppressing (or the global rule covers it), and its comment says nothing about appearance.
- `web/src/scripts/card-index.ts:662-677`: the fallback that focuses the count line. The comment describes what that focus does.
- `web/src/scripts/card-index.ts:730-759`: sets the grid's `role` and `tabIndex = -1` from script. This is what makes the grid a landing point.
- `web/src/scripts/card-index.ts:872-881`: `grid.focus({preventScroll: true})`, the call that drew the ring the grid's rule now suppresses.
- `web/src/layouts/BaseLayout.astro:726-752`: the skip link's note on why `<main>` needs `tabindex="-1"`. It describes focus behavior but not appearance, and it would need a line on that.
- `web/src/pages/{index,[slug],404,reviews,search}.astro`, `insights/{index,[slug]}.astro`, `presentations/{index,[slug]}.astro`: the nine `<main id="main" tabindex="-1">` elements. They only change if the rule is applied per element rather than globally.
- `web/src/components/ContactForm.astro:297` and `web/server/contact.php:257`: the honeypot has `tabindex="-1"` but is never focused. It needs no change, but a global `[tabindex="-1"]` selector would match it, harmlessly.

## Docs

- `DESIGN.md:1126-1131`: "The grid … is never ringed" is the current one-off rule. It would become an example of the site-wide rule.
- `DESIGN.md:1194-1201` and `1640-1643`: the focus-ring section and the do's and don'ts. DESIGN.md is the authority on rules, so the new rule belongs here.
- `docs/decisions/components.md:36-63`: the record of the focus-ring decision. The new rule would be a new decision record, or it would supersede part of this one.
- `CLAUDE.md:597-603`: the skip-link entry describes focus moving to `<main>`. It also says "all ten `<main>` elements", but I count nine.
- `docs/urls-and-filtering.md:400-405`, `web/src/scripts/search.ts:948-957`, `docs/astro-migration/insights-filtering-kickoff.md:71`: these record a *proposed* landing point, a facet group heading with `tabindex="-1"`. The rule would apply to it if that's ever built.

## Glossary (`project-graph/glossary.md`)

- `no-focus-ring-on-landing-grid`: overturned, or widened into a new site-wide claim. The new rule needs its own id.
- `contact-state-focus-visible-not-suppressed`: overturned outright.
- `focus-ring-is-global-not-per-control`: "on every focusable element" stops being true, so the sentence needs a carve-out.
- `landing-point`: the concept's scope note would gain "and draws no focus ring".
- `scripted-focus-on-tabindex-minus-one-draws-no-focus-visible-ring`: already overturned. Its only live citation is the ContactForm comment above.

## Excluded

These get focus from script but can also be reached with Tab, so they keep their rings: the search input and toggle, the facet chips, the slide deck's track (`tabindex="0"`), the YouTube iframe, and invalid form fields.

## Questions to settle before building

- **Scope.** "From script" doesn't match the cases exactly. `<main>` and `#contact-sent` also get focus from fragment links, and any `tabindex="-1"` element takes focus on a click. The glossary's `programmatic-focus` already includes fragment navigation, so I'd write the rule as "landing points draw no ring" and mean the `landing-point` concept, not "script-focused".
- **Where the rule lives.** You already have four consumers, which passes the project's second-consumer test for promotion. My recommendation is one global rule in base.css, keyed on `:focus` rather than `:focus-visible` and clearing both `outline` and `box-shadow`, for the reasons CardMasonry measured. A `[tabindex="-1"]` selector is a stand-in for the concept, though. It would also catch a real control given `-1`, such as a roving-tabindex widget. None exists today.
- **Not yet measured.** Nobody has checked whether `<main>`, the count line or the contact blocks currently draw a ring in real browsers. The grid's history suggests they can, and headless Chrome is the wrong tool to check it with.

---------- T2 · answer 2 ----------

I found four elements that only script focuses, plus `<main>`, which gets focus a different way and needs a scope decision. Two comments in the code disagree with each other about whether these elements draw a ring at all. Nothing was edited.

## The elements in question

| Element | How it gets focus |
|---|---|
| Card grid `.card-masonry` (Insights, Presentations) | Script, on arrival at a filtered URL; also a click in the gaps between cards |
| Results count line `#result-count` | Script, when "Show more" or "Show all" removes itself |
| Contact form's sent message `.contact-sent` | Script, after a JS send. **Also** by URL fragment (`#contact-sent`) when JS is off, so it's not script-only |
| Contact form's error message `.contact-failed` | Script only |
| `<main id="main" tabindex="-1">` on all ten pages | Not script: following the skip link (a URL fragment) moves focus there. Literally outside the rule, but it's the most common `tabindex="-1"` element on the site |

## Code that would change

- `web/src/styles/base.css:690–709`: the global `:focus-visible` ring lives here, so a site-wide exemption would go here too. Its comment would need to say so.
- `web/src/components/cards/CardMasonry.astro:186–209`: the only place the rule already exists, as a local `.card-masonry:focus { outline: none; box-shadow: none }`. A site-wide rule would make this redundant: it would either move up into base.css or be deleted.
- `web/src/components/ContactForm.astro:529–533`: **says the opposite.** It leaves the ring on deliberately, and claims a scripted `.focus()` on a `tabindex="-1"` element doesn't show one anyway. CardMasonry's comment records that same claim as "measured wrong first": real Chrome, Safari and Vivaldi did draw the ring. This comment would need rewriting, and it's also stale today.
- `web/src/components/ContactForm.astro:143–146`: explains why both message blocks have `tabindex="-1"` (so script can focus them). It says nothing about how they look, but it's where the change would land.
- `web/src/components/ResultsFooter.astro:76–93` (comment and markup) plus `.result-count` at `:134`: the count line is a script-only target with no rule about its focus look today, so it currently gets the global ring.

## Code that describes how these elements behave when focused

- `web/src/scripts/card-index.ts:700–726`: makes the grid focusable from script and names it. It points to BaseLayout's skip link for the same reasoning.
- `web/src/scripts/card-index.ts:638–650`: when a reveal button disappears, focus falls back to the count line.
- `web/src/scripts/card-index.ts:845`: the `grid.focus()` call on a filtered arrival.
- `web/src/components/ContactForm.astro:726–737`: `showState()` and the reflow it forces before `.focus()`.
- `web/src/layouts/BaseLayout.astro:720–730`: why `<main>` has `tabindex="-1"`. It matters only if the rule is read as covering `<main>`.
- `web/src/pages/{index,[slug],404,reviews,search}.astro`, `insights/{index,[slug]}.astro`, `presentations/{index,[slug]}.astro`: the ten `<main id="main" tabindex="-1">` lines. They're affected if the rule is written as a `[tabindex="-1"]` selector.
- `web/src/scripts/search.ts:923–928`: names a possible future script-only target (a facet group heading with `tabindex="-1"`). The rule would decide how it looks.
- `web/src/components/ContactForm.astro:273–291`: the honeypot field. It has `tabindex="-1"` and is never focused at all, but a `[tabindex="-1"]` selector would match it. Harmless, but worth knowing.

## Docs

- `DESIGN.md:1120–1123`: "The grid … is never ringed. Its focus ring is suppressed…" This is the only rule of this kind in DESIGN.md today. It would become one case of a general rule.
- `DESIGN.md:1184–1189`: the focus-ring rule (inner and outer rings) says nothing about exemptions. A general exemption belongs here.
- `DESIGN.md:1624–1626`: the standing do's and don'ts list the focus ring and tags. A new rule would likely add a line here.
- `docs/decisions/components.md:36–57`: the decision record for the focus ring. Under CLAUDE.md's process, the reasoning for a new rule goes here (or in a record that replaces it), not into DESIGN.md.
- `docs/decisions/README.md:15`: the index row for components.md lists "the focus-ring relationship". Update it if the record's scope grows.
- `docs/urls-and-filtering.md:390–395` and `docs/astro-migration/insights-filtering-kickoff.md:71–72`: both describe the "group heading with `tabindex="-1"`" alternative, a future target this rule would cover.
- `CLAUDE.md:585–586`: the skip-link entry, describing `<main>`'s `tabindex="-1"` and how focus moves. It matters only if `<main>` is in scope.
- `web/scripts/check-a11y.mjs:35`: no change needed. It records that keyboard and focus behavior aren't tested, so nothing automated would check the new rule.

## Checked and left out (all reachable by Tab)

- The `<pre>` code blocks and the slide-deck track (both `tabindex="0"`).
- The recording iframe.
- The search field and its toggle.
- The facet chips that get focus after a reset.
- The ring overrides on the buttons, chips, cards and footer.

## Two questions to settle before writing the rule

1. **Is it a rule about how focus arrives, or about `tabindex="-1"`?** `<main>` and the no-JS `#contact-sent` both get focus from a URL fragment. A `[tabindex="-1"]` selector would include them; "script-only" as worded would not. **My recommendation: decide by `tabindex="-1"`.** In both cases the next Tab press goes somewhere that draws its own ring, which is the reasoning CardMasonry gives for the grid.
2. **Where does it live?** Moving the rule into base.css is a call about where a value lives, so it's yours to make. The project's "second consumer" test supports moving it up: the contact messages and the count line would make three consumers. The new rule should keep CardMasonry's two hard-won details: match `:focus` rather than `:focus-visible`, because browsers decide differently when focus comes from script, and clear both `outline` and `box-shadow`.

---------- T2 · answer 3 ----------

Nothing was edited. I couldn't run `project-graph/graph.mjs` in this session (Bash was denied), so I built the list by searching the `@concept`/`@claim` tags and the code directly.

## The elements the rule would cover

There are four kinds today. Three are focused by script; `<main>` is the odd one out (see question 1 below).

| Element | How it gets focus | Ring today |
|---|---|---|
| Card grid (`.card-masonry`) | `grid.focus()` on a filtered arrival, or a click in the gaps between cards | **Already hidden** |
| Count line (`#result-count`) | Catches focus when "Show all" or "Show more" removes itself | Draws base.css's ring |
| Contact form's sent and failed blocks | `block.focus()` after the form is replaced | Draws the ring, **on purpose** |
| `<main id="main">` on all 9 pages | Following the skip link (a fragment link, not script) | Draws the ring |

## Code

- `web/src/styles/base.css:699-721`: the global `:focus-visible` ring. A site-wide rule would make its exception here, or right next to it.
- `web/src/components/cards/CardMasonry.astro:186-212`: the only place the ring is hidden now, scoped to the grid. If the rule is promoted, this goes away or points to base.css.
- `web/src/components/ContactForm.astro:544-551`: says outright that these blocks keep the ring, and cites a claim the graph has since overturned. It would flip.
- `web/src/components/ContactForm.astro:143-149`: explains why the two blocks have `tabindex="-1"` (focus is how they're announced). The behavior doesn't change, but it's where the rule's reason would go.
- `web/src/components/ContactForm.astro:752-765`: the forced reflow, then `block.focus()`. This is the trigger. No change unless the comment should say no ring follows.
- `web/src/components/ResultsFooter.astro:80-99`: the count line's `tabindex="-1"` and why it's there. Nothing hides its ring yet, so it would change.
- `web/src/components/ResultsFooter.astro:143-150`: `.result-count` styles. This is where a local rule would go if the rule isn't promoted.
- `web/src/scripts/card-index.ts:662-678`: the fallback that sends focus to the count line. It says what's announced there, but nothing about how it looks.
- `web/src/scripts/card-index.ts:729-759`: script sets `grid.tabIndex = -1`. That matters if the rule uses a `[tabindex="-1"]` selector, because the attribute only exists after the script runs.
- `web/src/scripts/card-index.ts:861-881`: the arrival code that focuses the grid. The behavior stays the same.
- `web/src/layouts/BaseLayout.astro:726-736`: why `<main>` has `tabindex="-1"`. This changes only if `<main>` is in scope.
- The 9 page files' `<main id="main" tabindex="-1">` (`404`, `[slug]`, `index`, `reviews`, `search`, `insights/index`, `insights/[slug]`, `presentations/index`, `presentations/[slug]`): these change only if the rule is written per element rather than as one global selector.
- `web/src/components/ContactForm.astro:297`: the honeypot has `tabindex="-1"` but nothing ever focuses it. A selector-based rule would match it harmlessly, and it needs no change.

## Docs

- `DESIGN.md:1126-1131`: "The grid is a named region, and is never ringed." A decision about the grid alone, which would become a general rule.
- `DESIGN.md:1194-1201`: the focus-ring rule says nothing about which elements it covers. The exception belongs here.
- `DESIGN.md:1637-1644`: the Components do's and don'ts are the natural home for a "don't ring a landing point" line.
- `docs/decisions/components.md:36-63`: the focus-ring record. Per CLAUDE.md, the new reasoning goes here as a new record that replaces the old one, not into DESIGN.md.
- `CLAUDE.md:598-606`: the skip-link entry describes how `<main>` takes focus. It also says "all ten `<main>` elements", but there are nine now that `specimen.astro` is gone.
- `docs/urls-and-filtering.md:400-407`: the rejected option of a group heading with `tabindex="-1"` as the focus target on reset. That would be a landing point under the rule if it's ever revisited.
- `docs/astro-migration/insights-filtering-kickoff.md:71-73`: the same rejected option, in a historical kickoff. Leave it as a record.

## Project graph

- `claims.ttl:96-100`, `no-focus-ring-on-landing-grid`: covers the grid only. It would be broadened, or replaced by a general decision claim.
- `claims.ttl:127-130`, `contact-state-focus-visible-not-suppressed`: an unattributed decision the rule would overturn.
- `claims.ttl:102-115`: `…draws-no-focus-visible-ring` is already overturned by `…can-draw-focus-visible-ring`, but `ContactForm.astro:550` still relies on it. `graph.mjs check` should already be reporting that.
- `claims.ttl:117-120`, `focus-visible-heuristics-vary-for-programmatic-focus`: only assumed, yet it's the reason the grid rule uses `:focus` rather than `:focus-visible`. A site-wide selector would rest on it.
- `concepts.ttl:66-71`: the `landing-point` scope note defines the term without a rule. It only changes if the rule should become part of the definition.

**Ruled out:** controls that script focuses but that are also in the Tab order keep their ring. These are the search field and toggle, the facet chips and reset, the Recording iframe, the SlideDeck track (`tabindex="0"`), and the contact form's invalid fields. No automated check tests focus styling (`check-a11y.mjs:35` says so).

## Decisions before anything changes

1. **Is `<main>` in scope?** Your wording ("from script") leaves it out, but the graph's `programmatic-focus` concept counts fragment links. I'd include it: a ring around the whole page is the same problem the grid rule fixed.
2. **Promote it or keep it local?** The count line and the contact blocks would be the second and third users, which by CLAUDE.md's own rule means it moves to base.css. The selector choice matters too: `[tabindex="-1"]:focus` matches anything with that attribute, including future elements, while a marker attribute or class matches only what you opt in.
3. **Pushback on the count line and the contact blocks.** In both cases a keyboard user pressed something and focus moved to a different place. A ring there is the only visual sign of where the next Tab starts. The grid's case for no ring was that the very next Tab lands on a card that draws its own, and that's less clearly true for these two. It may be worth judging them one by one rather than through one rule.

========== T3 ==========

The question, as each session received it:

Audit what this repository's code comments and docs say about keyboard focus and about hiding and showing elements. List every place where two statements disagree, or where a statement no longer matches the code it describes. Give the locations and one line on each. Don't edit any files.

The rubric for T3:

Fifteen known disagreements, each scored 1 when the answer identifies it and 0 when it doesn't.
The answer identifies one when it points to at least one of the places listed and says what is
wrong there in a way that matches the item.

1. A `tabindex="-1"` element "does not take a visible ring from a scripted `.focus()`" vs. real browsers draw one
    At: `ContactForm.astro:529-533` vs `cards/CardMasonry.astro:189-200`, `DESIGN.md:1120-1123`
2. `.field-error`: any `display` declared here "would out-specify" the browser's `[hidden]` vs. base.css's `!important`, which nothing can out-specify, and which the same file cites 30 lines later
    At: `ContactForm.astro:503-505` vs `styles/base.css:77-99`, `ContactForm.astro:535-550`
3. Ring radii are "a real `calc()`" vs. `box-shadow` spread derives them, with no `calc()`
    At: `docs/decisions/components.md:46-48` vs `DESIGN.md:918-925`, `styles/base.css:697-701`
4. Focusing a just-revealed element needs a forced reflow (`void el.offsetWidth`) first vs. card-index un-hides `fewer` and focuses it with no reflow in between (`fitRow()` measures before it un-hides)
    At: `ContactForm.astro:727-737`, `scripts/search.ts:823-833` vs `scripts/card-index.ts:105-110, 160-168`
5. A scroll region without `tabindex="0"` is unreachable by keyboard "at all" vs. Chrome and Firefox make scroll regions focusable themselves, and only Safari does not
    At: `prose/Code.astro:50-56`, `DESIGN.md:1482-1485` vs `SlideDeck.astro:89-93`
6. The search toggle "ships `hidden` … revealed by the script" vs. it is gated in CSS on `html.js` and does not carry `hidden`
    At: `docs/astro-migration/search-kickoff.md:172-176` vs `Masthead.astro:300-305, 953-969`
7. The grid gets its tabindex from script "because only script ever focuses it" vs. a click in the gutters focuses the grid
    At: `scripts/card-index.ts:706-711` vs `cards/CardMasonry.astro:199-200`
8. "open-questions.md records the alternative" (the group heading as reset focus target) vs. it is recorded in urls-and-filtering.md and was never in open-questions.md
    At: `scripts/search.ts:923-928` vs `docs/urls-and-filtering.md:390-395`
9. `tabindex="-1"` on "all ten `<main>` elements" vs. nine pages carry one, since `specimen.astro` was removed
    At: `CLAUDE.md:585` vs the nine `<main id="main" tabindex="-1">` in `web/src/pages/`
10. The `js` class is set at `BaseLayout.astro:72` vs. it is set at line 356
    At: `SlideDeck.astro:26-30` vs `layouts/BaseLayout.astro:356`
11. The Back-button reset sets `sent.hidden = true` vs. the same file explains that `[hidden]`'s `!important` means a class, not the attribute, must hide these blocks. A second send after coming Back shows nothing.
    At: `ContactForm.astro:827` vs `ContactForm.astro:535-550, 727-731`
12. Masthead describes the rejected alternative two ways: "`[hidden]` is applied by a script" vs. "`hidden` plus a script that removes it"
    At: `Masthead.astro:302-303` vs `Masthead.astro:956`
13. Clear both `box-shadow` and `outline` "because both can draw a ring" vs. clearing `outline` "would suppress nothing". Each is right for the selector it targets (`:focus` vs `:focus-visible`).
    At: `cards/CardMasonry.astro:202-203` vs `Recording.astro:372-373`
14. Content neither drawn nor announced "wants `aria-hidden` and `display: none`", citing the honeypot, which avoids `display: none` on purpose
    At: `VisuallyHidden.astro:8-14` vs `ContactForm.astro:267-286`
15. Revisit the reset focus target "with the live region" vs. card-index calls it "still open". The condition the decision waits on may already be met.
    At: `docs/urls-and-filtering.md:390-395` vs `scripts/card-index.ts:624-628`

"extra": every disagreement the answer claims that is not one of the fifteen. Check each against
the code and docs in this checkout, and judge it real or not real. For each, {"claim": "…",
"verdict": "real" or "not real", "why": "…"}, where "why" names what you read.

---------- T3 · answer 1 ----------

I found 33 places where comments or docs disagree with each other or with the code. Nothing was edited. I read both sides of every item myself, except the docs rows I mark "(helper)", which a helper agent checked. Three are marked "plausible": I couldn't confirm those without a live count or a browser.

## Keyboard focus

**Statements that disagree**
- `web/src/components/ContactForm.astro:529-532` says a scripted `.focus()` on a `tabindex="-1"` element draws no visible ring. `CardMasonry.astro:186-200` says that's exactly what Chrome, Safari and Vivaldi did on the grid.
- `web/src/components/ThemeToggle.astro:177-179` says the unselected segments get "a white ring set 2px off the icon… what the masthead's nav links already do." `Masthead.astro:517-522` says the nav links get a tight ring with no gap.
- `Masthead.astro:517-522` keeps the default ring order on the accent band ("needs NO override"). `base.css:694-695`, `Band.astro:152-156`, `DESIGN.md:1184-1189` and `docs/open-questions.md:207-209` all say a control on an accent band swaps the two rings. (helper)
- `docs/decisions/components.md:48` says the ring radii are "a real `calc()`". `DESIGN.md:918-924` and `base.css:699` say no `calc()` is involved because `box-shadow` derives them. (helper)
- `card-index.ts:166-168` sends focus after "See all" to the control that replaced it, so the user isn't "dropped at the top of a list". `search.ts:888-897` sends it to the group's first chip, which is the top of the list, for the same control.
- `docs/open-questions.md:301` says "6-of-45"; `:291` and `DESIGN.md:1101` say 21 of 45 cards are out of tab order. All three describe `dense` packing, which `CardMasonry.astro:306-316` says was removed. (helper)
- `SearchResults.astro:240-247` uses `order` to move the facet chip buttons ahead of the results on mobile. That breaks the rule in `DESIGN.md:665-667` and `insights/[slug].astro:357-358` against reordering anything focusable. (helper)

**Statements that no longer match the code**
- `web/src/pages/insights/[slug].astro:326-327` says there is no skip link yet. `BaseLayout.astro:746` ships one on every page.
- `CLAUDE.md:585-588` says there are ten `<main id="main" tabindex="-1">` elements, including one in `specimen.astro`. There are nine, and there is no specimen page. (helper)
- `BaseLayout.astro:709` says the masthead puts "roughly a dozen links" before the content. It has seven focus stops: the identity link, five nav links and the search toggle.
- `search.ts:926-928` credits the "group heading with `tabindex=-1`" idea to `open-questions.md`. It actually lives in `docs/urls-and-filtering.md:390-395`.
- `docs/urls-and-filtering.md:390-395` and `card-index.ts:625-627` both defer the reset focus target until the live region exists. It does exist, at `card-index.ts:391-399`. (helper)
- `SlideDeck.astro:159-160` implies the arrow-key shortcut is shown on the buttons. Their `title`s don't include it, and `:685-686` says that's deliberate.
- Plausible: `SlideDeck.astro:90-93` says the `tabindex="0"` track "really is an interactive scroll region". Without JavaScript it's a plain grid that doesn't scroll, so it's a tab stop that does nothing.

## Hiding and showing

**Statements that disagree**
- The "a control that needs JavaScript ships hidden" rule:
  - **Says hidden:** `Masthead.astro:294-296`, `search.astro:14-15` and `BaseLayout.astro:338` state the rule, and two of them cite `<FacetFilters>` as following it.
  - **Says visible but disabled:** `card-index.ts:56-57` says the opposite ("a control that cannot work should say so"), and `FacetFilters` ships its chips visible with `aria-disabled`.
- `ContactForm.astro:503-505` says any `display` declaration would override `hidden`. `base.css:97` makes `[hidden]` `!important`, and the same file's `:537-547` says so.
- `search.ts:582` and `SearchResults.astro:113-114` say the "see all / see fewer" controls go away "from `lg` up". The code (`search.ts:547-548`) and its own note at `:529-546` use `md`.
- Plausible: several places say Presentations has fewer than 24 cards, so nothing is truncated and no reveal buttons show:
  - **Fewer than 24:** `ResultsFooter.astro:97-100`, `card-index.ts:449-450`, `CardMasonry.astro:353-356`, and `presentations/index.astro:211-214` and `:246-249` ("four cards").
  - **Over 24:** `CLAUDE.md` counts 29, and `CardMasonry.astro:94-96` measures at 24 and 25.
  - **Consequence:** at 29, "Show all" would show.
- `VisuallyHidden.astro:49` and `Masthead.astro:912` both say "the same seven declarations". There are eight. The heading at `VisuallyHidden.astro:30` also promises three points and gives two.
- `docs/urls-and-filtering.md:176` describes a "Select all" reset. The same file's `:318-335` says it was removed in favor of per-group resets. (helper)
- `docs/urls-and-filtering.md:324` says reset restores the chips' "unselected order". The same file's `:221-242` says chip order is fixed at build time and never changes. (helper)
- `FacetFilters.astro:246-247` says disabled chips mostly appear only inside "See all". `docs/urls-and-filtering.md:244-249` says they're now the normal look in the visible row. (helper)

**Statements that no longer match the code**
- `CardMasonry.astro` still describes the time before Insights adopted it:
  - `:12-17` says Insights hasn't adopted the component, quotes a `.masonry` selector, and names an `onRelayout` that doesn't exist.
  - `:520-531` says nothing sends the relayout event, but `card-index.ts:231` does.
  - `:536-538` mentions a `.masonry` "that Insights still owns".
  - `FacetFilters.astro:8` still describes CardMasonry as transitional.
- `SlideDeck.astro:118-121` says the Full Screen button isn't built yet. It is, along with its dialog, at `:136-145` and `:206`.
- `SlideDeck.astro:34` says the script adds "the counter". The same file at `:202` says there is no counter.
- `SlideDeck.astro:28` points to `BaseLayout.astro:72` for the script that sets `html.js` before first paint. That script is now at `:356`.
- `Masthead.astro:51-52` and `DESIGN.md:1390-1391` say the search toggle is inert. It opens the field.
- `Masthead.astro:330-333` says search intercepts the form submit to swap in results. `search.ts:22-27` deliberately doesn't. `DESIGN.md:1397-1400` ("not navigated away from") also misses that pressing Return loads `/search/?q=`.
- `BaseLayout.astro:754` and `SearchResults.astro:3` say "two inert `<template>`s". There are three: the view, the chip and the result row.
- `CLAUDE.md:940` and `web/scripts/check-a11y.mjs:37` mention a "mobile menu expanded" state. There's no mobile menu; the only `aria-expanded` is on the search toggle. (helper)
- `docs/urls-and-filtering.md:283-299` plans a JSON facet index and a later card index for show more/show all. The page's own HTML is the index (`card-index.ts:29-37`), and the reveal un-hides cards the server already rendered. (helper)
- `PresentationCard.astro:70` points to "the note on `.visually-hidden` below" for what `hint` is for. That note (`:374`) doesn't explain it; the explanation is at `:150-159`.

Two stale statements fall outside your scope: `search.astro:9` and `DESIGN.md:1401` still name Fuse as the search engine, but it's MiniSearch. I left out the `docs/astro-migration/` kickoff notes, where the differences read as history rather than as current claims.

---------- T3 · answer 2 ----------

I found 24 problems. One is a live bug; the rest are comments or docs that contradict each other or no longer match the code. I didn't edit anything. I checked every place a tagged id appears, plus the untagged comments near them.

**Worth acting on first**

1. **Live bug.** `web/src/components/ContactForm.astro:858`: the back-button (bfcache) reset runs `sent.hidden = true`, but `:553-563` says these blocks must never use `hidden`. After a restore, the next successful send leaves the form hidden and the confirmation forced hidden too, which is the empty region that comment describes. `hideState(sent)` is the fix.
2. `web/src/components/bands/WorkWithMeBand.astro:416-421`: from `md` up, the `:focus-visible` box-shadow replaces base.css's focus ring rather than adding to it. That contradicts the "one global ring" rule (`ContactForm.astro:481-487`), and ThemeToggle used `outline` (`ThemeToggle.astro:167-169`) to avoid exactly this kind of collision.
3. `ContactForm.astro:544-547` says a `tabindex="-1"` element never gets a visible ring from scripted `.focus()`. That is the overturned claim; `CardMasonry.astro:189-200` records real browsers drawing that ring.

**Statements that disagree**

4. The masthead search label:
   - `Masthead.astro:344-347` says the input gets a `<label>` because its name *isn't* never-visible, citing ThemeToggle.
   - `Masthead.astro:1067-1069` says the label *is* never visible, and that ThemeToggle's rule sends that case to a clip.
   - ThemeToggle's actual rule (`ThemeToggle.astro:23-27`) sends never-visible names to `aria-label`.
5. Focus colors on the accent band:
   - `base.css:703-704`, `Band.astro:155-156` and `open-questions.md:208-210` say a control on the accent band swaps the ring pair.
   - `Masthead.astro:532-537` says it needs no swap, and the Footer's nav links (on a real accent Band) don't swap either.
6. `ThemeToggle.astro:189-191` describes the masthead links as "a white ring set 2px off". `Masthead.astro:532-537` says they get a tight ring, "rather than an offset one".
7. `Button.astro:161-163`, `pages/index.astro:545-549` and `DESIGN.md:971-974` say the default order is invisible on the band. `Masthead.astro:532-537` says the same default is legible there, "verified against both dark values".
8. The search toggle:
   - `docs/astro-migration/search-kickoff.md:175-181` says it ships `hidden` and the script reveals it.
   - The same doc at `:239-241` says to use `html.js` instead.
   - The code does use `html.js` and explicitly rejects `hidden` (`Masthead.astro:308-310`, `:976-990`).
9. "See all / See fewer" focus goes opposite ways. `card-index.ts:171-175` moves focus to the replacing control "so a keyboard user is not dropped at the top". `search.ts:910-913` moves it to the first chip, "the top of the run either way".
10. Forced reflow before focus:
    - `ContactForm.astro:752-765` and `search.ts:839-852` say `focus()` on a just-revealed element is a no-op unless layout is flushed first.
    - `search.ts:830` (open, including cmd+K) and `card-index.ts:175,181` focus just-revealed elements with no flush.
    - Either the claim overstates or those three sites are latent bugs.
11. The claim `display-none-removes-from-accessibility-tree` (text "contributes nothing to an accessible name", e.g. `VisuallyHidden.astro:35-38`) contradicts `card-index.ts:552-558` and `CardResults.astro:35-36`, which say `aria-labelledby` reads hidden text.
12. `VisuallyHidden.astro:44-45` says the 1px clipped box is "the only way to be invisible and still in the tree". `ThemeToggle.astro:91-110` keeps its radios in the tree with `opacity: 0`.
13. `VisuallyHidden.astro:7-12` quotes the honeypot as "drawn nowhere, announced nowhere", then says such content wants `display: none`. `ContactForm.astro:270-273` says `display: none` would defeat the honeypot.
14. Within FacetFilters itself: `FacetFilters.astro:255-256` says a disabled chip "mostly only surfaces inside See all". `:276-278` and `urls-and-filtering.md:371-373` say it is the ordinary state in the visible row.
15. `open-questions.md:205-206` lists the radius-1 focus ring under "Settled in phase 3" but calls it "unresolved by eye".

**Statements that no longer match the code**

16. The Presentations corpus is described as smaller than one reveal step of 24 in `card-index.ts:466-467`, `ResultsFooter.astro:103-106`, `CardMasonry.astro:359-362` and `presentations/index.astro:211-214` ("four cards"). CLAUDE.md measured 29 on 2026-10-10, so truncation and the reveal buttons should now be active there. I didn't query Sanity to confirm.
17. `CardMasonry.astro:12-17` says Insights hasn't adopted the component, the truncation rule lives elsewhere (as `.masonry`), and there is an `onRelayout` function. All three are now wrong. `FacetFilters.astro:8` repeats the "transitional period".
18. `SlideDeck.astro:124-127` says the Full Screen button "is NOT here yet". It is at `:147-156`.
19. `Masthead.astro:51-52` says the toggle is left inert. `:299` and `search.ts` say otherwise.
20. `ContactForm.astro:515-517` says an author `display` rule would beat `hidden`. base.css's `!important` now prevents that.
21. Two stale line references:
    - `html.js` is set at `BaseLayout.astro:360`, not `:72` (cited in `SlideDeck.astro:28` and `glossary.md:889`).
    - `[hidden]` is at `base.css:100`, not `:97` (cited in `page-template-kickoff.md:161` and `glossary.md:811`).
22. `Masthead.astro:929` and `VisuallyHidden.astro:49` both say "seven declarations". There are eight.
23. CLAUDE.md (skip-link entry) says ten `<main>` elements. There are nine, because `specimen.astro` is gone.
24. `search.ts:951-953` says `open-questions.md` records the heading-focus alternative. It's in `urls-and-filtering.md:400-405`. That doc's trigger, "revisit with the live region", has already fired for the indexes, yet `card-index.ts:647-649` still calls the question open.

**One tension, not a contradiction:** `SlideDeck.astro:171-173` calls disabling the pager at the ends "honest". But disabling a focused Next button drops focus to `<body>`, which every other control here deliberately prevents.

Two problems fall outside focus and hiding, so I left them out of the list:
- `highlighter.ts:114-115` and `Code.astro:71-78` still describe the old code-block styling: the old background color and syntax highlighting as "not here yet".
- `base.css:740` and `:756` say "four" and "five" overrides for the same rhythm ramp.

---------- T3 · answer 3 ----------

# Focus and hiding: where the comments and docs disagree

I found about 50 places where two statements disagree or a statement no longer matches its code. No files were edited. Four parallel read-only passes found them, each cross-checked against `project-graph/claims.ttl`. I re-checked the most consequential ones myself: the contact-form bug, the search toggle, the ThemeToggle label rule, submit interception, the `open()`/`close()` reflow and the moved line numbers.

The graph's own `check` caught only one of these, because it only sees comments that cite an overturned claim. Most of what's below is prose that drifted, or claims that contradict each other without either being marked as overturning the other.

## The two that are more than stale prose

- **`web/src/components/ContactForm.astro:858` — this is a bug.** The back-button (`pageshow`) reset sets `sent.hidden = true` instead of calling `hideState(sent)`, which line 859 does use for `failed`. After a Back restore, `.is-shown` stays on the sent block, so the next successful send adds the class again with no effect. `[hidden] !important` keeps the block hidden and line 810 hides the form, leaving the empty region that lines 559–565 warn about. It also contradicts lines 555 and 752–755.
- **`web/src/components/Button.astro:161-165` — the reasoning for the ghost button's swapped focus ring may be wrong.** (I didn't check the tokens myself.) The ghost's resting fill is `--color-surface-accent`, which by the token values is the same color as `--color-focus-ring` in both themes. With the swap, the inner ring is the button's own color and can't be seen. The same sentence appears at `DESIGN.md:971-974` and `web/src/pages/index.astro:545-549`.

## Focus ring on accent bands

- **`base.css:703-704`, `Button.astro:161-163`, `index.astro:546-547`, `DESIGN.md:972-973`, `DESIGN.md:1641` vs `Masthead.astro:532-536`:** the first group says the default order is invisible on an accent band, while Masthead says it was verified legible on the same band. The claims `fixed-focus-pair-fails-on-accent-band` and `masthead-band-needs-no-focus-ring-override` contradict each other the same way.
- **`base.css:703-704`, `Band.astro:155-156`:** both say a control on an accent band swaps the ring pair. The footer and masthead links sit on accent bands and don't swap; only the ghost button, ThemeToggle and the home hero CTA do.
- **`docs/decisions/components.md:42-44`:** rejects a fixed inner-white/outer-accent ring, which is exactly the default `base.css:718-720` ships. It also calls the ghost button white, which it isn't at rest.
- **`docs/decisions/components.md:49-50`:** says the ring radii are "a real `calc()`". There is none (radii come from box-shadow spread), and `DESIGN.md:918-924` retracts that wording.
- **`ThemeToggle.astro:189-191`:** says the masthead links use "a white ring set 2px off"; `Masthead.astro:536` describes a tight ring, not an offset one.
- **`ContactForm.astro:544-550`:** relies on the overturned claim that a script-focused `tabindex="-1"` element draws no ring. Nothing in the code depends on it, but the sent/failed blocks can now draw the whole-block ring that `CardMasonry.astro:209-212` suppresses on the card grid, and nothing records why the two differ.
- **`base.css:387-390`:** says box-shadow eases are turned off under reduced motion, but nothing in base.css transitions box-shadow.

## Programmatic focus

- **`web/src/scripts/search.ts:839-852` vs `:827-832`:** `close()` says `focus()` fails on a just-revealed element without a forced reflow. `open()` does the same reveal and focuses with no reflow, and evidently works, so the premise in `close()`'s comment is the more doubtful one.
- **`search.ts:951-953`:** cites `open-questions.md` for the alternative focus target; it's actually recorded at `docs/urls-and-filtering.md:400-405`.
- **`docs/urls-and-filtering.md:404-405`, `card-index.ts:647-649`:** both defer the reset-focus question until the live-region wording is settled, which happened 2026-08-31.
- **`ResultsFooter.astro:88-91`, `card-index.ts:732-736`, `claims.ttl:195`:** say focus on the grid announces just the count. On a single-tag arrival, `aria-labelledby` puts the results label first (`card-index.ts:559-563`).
- **`project-graph/concepts.ttl:63-64`:** the `card-index.ts:688` and `:825-829` references point at unrelated code (now about `:715` and `:874-883`). The scroll target (`<CardResults>`) and the focus target (the grid) are also now two elements, not one.

## Search toggle and masthead

- **`docs/astro-migration/search-kickoff.md:175-181`:** says the toggle ships `hidden` and a script reveals it. The code gates it with `html:not(.js) .search-item` (`Masthead.astro:990`), and the same doc's lines 239–241 say so.
- **`claims.ttl:540-549`:** `search-toggle-ships-hidden` and `search-toggle-gated-on-html-js` are both live and contradict each other; the code matches the second.
- **`docs/astro-migration/search-index-kickoff.md:45`:** calls the change a "ships-hidden fix"; it was CSS gating.
- **`Masthead.astro:308-310`:** says `[hidden]` "is applied by a script"; in that design the script removes it (line 976 has it right).
- **`Masthead.astro:1067-1069`:** inverts ThemeToggle's rule. `ThemeToggle.astro:23-24` sends never-visible names to `aria-label`, not to a clip.
- **`Masthead.astro:344-347`:** says the input label isn't a never-visible name, but it is clipped at every width. Correspondingly, `never-visible-name-uses-aria-label` and `never-visible-search-input-label-is-a-clipped-label` contradict each other in `claims.ttl:407-415`.
- **`Masthead.astro:340-342`:** says the controller intercepts the submit; `search.ts:22` says it deliberately doesn't.
- **`Masthead.astro:49-52`:** still says the toggle is inert.
- **`search.ts:597`, `SearchResults.astro:119-120`:** say the reveal controls disappear from `lg` up; the code tests `--breakpoint-md`.
- **`search.ts:305-307`:** illustrates "restore only what it hid" with truncated cards. Those cards are deep descendants, and the code only touches `main.children`.
- **`SearchResults.astro:39-41`:** describes h1 texts the code never sets; it always uses `Search results for "…"`.
- **`web/src/pages/search.astro:261`, `:320-322`:** describe the page h1 being rewritten; it's actually hidden and replaced by the template's h1.
- **`BaseLayout.astro:763`, `SearchResults.astro:3`:** say two inert `<template>`s; there are three.

## Hiding

- **`ContactForm.astro:515-517`:** warns a `display` rule could beat `[hidden]`, which `!important` now prevents. It also calls the mechanism specificity; it's cascade origin. The claim `author-display-rule-overrides-ua-hidden` frames it the same way.
- **`web/server/contact.php:388-389`:** says the confirmation block doesn't exist yet; it does (`ContactForm.astro:152`).
- **`VisuallyHidden.astro:49`, `Masthead.astro:929`:** say "seven declarations"; there are eight. `VisuallyHidden.astro:30` promises three redundant-looking declarations and names two.
- **`SlideDeck.astro:33-35`:** says a counter ships hidden; there is no counter (the same file says so at 215–216).
- **`SlideDeck.astro:124-127`:** says the Full Screen button isn't built; it is (147–156, dialog at 222).
- **`SlideDeck.astro:93-96`:** justifies `tabindex="0"` on the track as a real scroll region, which is only true with `html.js`. Without JS, a grid that doesn't scroll gets a Tab stop.
- **`Recording.astro:59`:** says the video facade "lands later"; it's built (171–175, 444–474).
- **`PresentationCard.astro:69-70`:** points at a `.visually-hidden` note "below" that doesn't exist.
- **Presentations reveal controls — `ResultsFooter.astro:103-106`, `card-index.ts:466-467`, `CardMasonry.astro:359-362`, `presentations/index.astro:211-214` and `:246-249`:** all say Show more/Show all never appear there because there are only four cards. The repo's own counts (24–29 presentations, `STEP = 24`) mean they now do. This rests on in-repo counts, not the live dataset.
- **`CardMasonry.astro:12-17`, `:545`, `:550-552`:** say Insights hasn't adopted the component (it has), quote an old truncation selector, and say nothing dispatches `card-masonry:relayout` (`card-index.ts:238` does).

## Accessible names

- **`FacetFilters.astro:85-89` vs `card-index.ts:157-160`:** disagree about whether enabling a chip appends ", add filter". The code rewrites the whole label in `applySelection`.
- **`Chip.astro:14-16`, `:28-32`:** say selection and count logic stayed in the Insights index; it lives in `FacetFilters.astro`.
- **`docs/urls-and-filtering.md:326`:** says reset restores chips to their unselected order; the same doc's 223–244 says chip order never changes.
- **`Masthead.astro:372-373` vs `FacetFilters.astro:101-102`:** one says axe is defeated by parentheses, the other that axe sets punctuation aside. Both are measured, on different inputs, but as written they conflict.

## Wrong line numbers and counts

- **`claims.ttl:320-322`, `docs/astro-migration/page-template-kickoff.md:161`:** say the `[hidden]` rule is at `base.css:97`; it's at line 100.
- **`claims.ttl:531-533`, `SlideDeck.astro:28`, `:38`:** say `html.js` is set at `BaseLayout.astro:72`; it's at line 360.
- **`CLAUDE.md`:** says "all ten `<main>` elements" and that `specimen.astro` gained one. There are nine, all correct, and `specimen.astro` no longer exists. `BaseLayout.astro:768` says eight page files.
- **`web/scripts/check-a11y.mjs:30-31`:** says four configurations and one failure. The same file has five configurations and records two failures (76–77), as does CLAUDE.md.
- **`BaseLayout.astro:715`:** says about a dozen links come before the content; there are about seven Tab stops.

## Archived docs (historical, but nothing marks them superseded)

- **`docs/astro-migration/eleventy-astro-comparison.md:261-265`:** still states the overturned "comma" explanation; the correction was appended at 267–272. Its headings and loose end #4 (311) still list the chips and rail as open, and line 273 calls the rail heading "Contents" instead of "On This Page".
- **`docs/astro-migration/insights-filtering-kickoff.md:71-74`, `:82-89`, `:134`:** open questions since settled, a sorting rule since reversed, and "21 initially" against a `STEP` of 24.
- **`docs/astro-migration/audio-player-kickoff.md:94`:** says audio uses the placeholder; it's now video only.

## Design tension, not drift

`FacetFilters.astro:79`: chips past the initial count ship `hidden` with no `html.js` gate, and "See all" is hidden too. A visitor without JavaScript can never reach them, which cuts against `BaseLayout.astro:338-339` ("neither should content nobody can reach"). Whether that's acceptable is your call.

The fix to make first is the one-line `hideState(sent)` in `ContactForm.astro:858`. The `claims.ttl` contradictions (search toggle, never-visible names, ring order on accent bands) need your decision on which claim stands before any comments are rewritten.

========== T4 ==========

The question, as each session received it:

Elements with the `hidden` attribute can't be revealed with a CSS class in this project, because base.css makes `[hidden]` `display: none !important`. Should we drop the `!important`? Answer and explain; don't edit any files.

The rubric for T4:

Five items, each 0 or 1:
1. Recommends keeping the `!important`: the decision is not reopened.
2. Gives the reason: an author `display` rule silently beats the browser's own `[hidden]`
   (`web/src/styles/base.css` around lines 77-99).
3. Cites the incident that caused it: the Insights filter chips, 2026-08-31.
4. Names the established alternative: a class for "styled away", as ContactForm's `.is-shown`
   does.
5. Notes what would break: the controls that ship `hidden` and rely on it staying hidden.

---------- T4 · answer 1 ----------

**No, keep the `!important`.** That `[hidden]` can't be revealed with a class is deliberate. If you drop it, a known bug that fails silently comes back.

**What it fixes.** The browser's own rule is just `[hidden] { display: none }`, and any author rule that sets `display` beats it. That happened on 2026-08-31: `.chip { display: inline-flex }` kept a `hidden` "See all genres" button on screen. `el.hidden` was `true`, the attribute was in the markup, and nothing reported a problem. The comment at `web/src/styles/base.css:77` records this. Without the `!important`, every component that sets `display` on something it also hides would need its own `&[hidden] { display: none }`. The first one that forgets brings the bug back, and nothing would catch it: the validator doesn't check CSS, and axe only sees what's on screen.

**What it costs: one thing, with a known fix.** CSS can no longer reveal an element that carries `hidden`, whether through `:target`, `:has()`, a media query or an `html.js` gate. The codebase already handles this:

- **`ContactForm.astro:535`** first used `hidden` on the success and error blocks. With no JavaScript, `:target` couldn't reveal the confirmation, so the visitor saw an empty region. The fix was a class (`.contact-state { display: none }`, shown by `.is-shown` or `:target`), not a change to the reset. It loses nothing for accessibility, because `display: none` also removes the element from the accessibility tree.
- **`Masthead.astro:302`** uses an `html.js` CSS gate instead of `hidden` for a related reason: a script adds `hidden` only after the first paint, which causes a visible reflow.

Both follow the rule at the end of the base.css comment:

> Use `[hidden]` for "not applicable" and a class for "styled away".

The difference is about meaning. `hidden` says the element doesn't apply in the current state, and scripts own that (`card-index.ts` sets it on chips, cards and reset buttons). A class says the element is styled out of view, and CSS owns that. The `!important` makes sure the first always wins, and anything CSS needs to reveal belongs in the second.

**Other options, and why they don't work:**

- **Moving the rule into a cascade `@layer`.** Unlayered author rules beat layered ones, so `.chip`'s `display` would win again. An `!important` inside a low layer is the strongest declaration there is, which makes things worse, not better.
- **Adding `&[hidden] { display: none }` in each component.** This is the opt-in approach the reset replaced.

**One refinement worth knowing about now.** `[hidden]` also matches `hidden="until-found"`. That form keeps content in the layout and hides it with `content-visibility: hidden`, so the browser's find-in-page can locate and open it. Your rule would force it to `display: none` and stop that from working. Nothing uses `until-found` today. If you ever want it, for example for collapsed transcripts, the narrower selector is `[hidden]:not([hidden='until-found' i])`. That matches how the HTML spec writes its own rule, and it keeps the `!important`.

**Where the decision sits.** Whether `hidden` means "not applicable" or "currently not shown" is a question of meaning, so it's your call. My recommendation is to keep the current meaning and the `!important`. When something needs CSS to reveal it, give it a class, the way ContactForm does, rather than loosening the global rule.

---------- T4 · answer 2 ----------

**No, keep it.** The fact that a class can't reveal a `hidden` element is what the rule is for. The trouble only shows up when `hidden` gets used for a job it wasn't meant for.

### What the `!important` protects against

Browsers implement `hidden` as `[hidden] { display: none }`, an ordinary low-specificity rule in their default stylesheet. Any rule of yours that sets `display` on the same element beats it. The element then stays on screen even though the markup says `hidden` and `el.hidden` is `true`, and nothing reports a problem.

This has already happened here. On 2026-08-31, `.chip { display: inline-flex }` kept a `hidden` "See all genres" button visible (`web/src/styles/base.css:86`). The fix went into base.css rather than the chip because any component that sets `display` on something it also toggles has the same latent bug. Drop the `!important` and that whole class of bug comes back: quiet, in components that don't exist yet, and found by eye if at all.

`:where()` or cascade layers won't make the `!important` unnecessary. The problem is that the attribute has to beat any `display` rule, and no specificity trick guarantees that.

### Use `hidden` and classes for different things

base.css already states the rule (`base.css:95`):

- **`hidden` means "not applicable":** the element doesn't apply right now, and script decides that. The script reveals it by removing the attribute (`el.hidden = false`), not by adding a class.
- **A class means "styled away":** the element still applies but isn't shown in this state. CSS can toggle it, including through `:target`, `:has()` or a state class.

If you want CSS to be able to reveal something, it's in the second group, so give it a class from the start. `display: none` from a class takes the element out of the accessibility tree exactly as `hidden` does, so nothing is lost.

### The contact form is the worked example

`ContactForm.astro:553–601` shows the conflict you're describing and how it was settled. The confirmation blocks were first built with `hidden`. The no-JavaScript path reveals them with `.contact-sent:target { display: grid }`, and the `!important` beat that rule. So a visitor without JavaScript who landed on `#contact-sent` saw an empty region: the form hidden correctly, and the confirmation hidden too. The fix was to switch the confirmation blocks to `.contact-state { display: none }` plus `.is-shown`/`:target`, not to weaken base.css. The form itself still uses `form.hidden = true` from script, which wins outright because of that same `!important`. The two mechanisms never meet.

So if a component wants CSS to reveal an element that has `hidden`, that component has the wrong element. The global rule is fine.

### Two things worth knowing

1. **One case the current rule would break: `hidden="until-found"`.** With that value, the browser uses `content-visibility: hidden` instead of `display: none`, so find-in-page and fragment links can open the content. That suits collapsed sections such as a transcript or FAQ answers. The current rule would force those to `display: none` and quietly break find-in-page. Nothing uses `until-found` today (I checked `web/src`), so this isn't urgent. If you ever adopt it, I'd change the selector to `[hidden]:not([hidden='until-found' i])` rather than dropping the `!important`.
2. **A stale claim in the glossary.** `hidden-attribute-rule-is-at-base-css-line-97` and `docs/astro-migration/page-template-kickoff.md:161` say the rule is at `base.css:97`. It's now at line 100, because the comment above it grew. Line-number claims go stale exactly like this. It might be better to restate that claim as "the rule lives in base.css's reset section" than to keep updating the number. That's your call, since the glossary's ids are yours.

---------- T4 · answer 3 ----------

**No, keep the `!important`.** It isn't standing in the way of something you need. The rule exists to stop CSS from revealing a `hidden` element. If you want something CSS can reveal, don't give it `hidden`; use a class.

**Why it's there** (`web/src/styles/base.css:77–102`). The browser's built-in rule for `hidden` is just `[hidden] { display: none }`, and that is weak. Any of your own rules that sets `display` on the same element beats it. Then the element shows on screen even though the DOM says it's hidden, and nothing reports a problem. The Insights chips hit exactly this on 2026-08-31: `.chip { display: inline-flex }` made a `hidden` "See all genres" button render. Drop the `!important` and that whole class of bug comes back, silently, for every component that both sets `display` and toggles `hidden`.

**Other code now depends on it:**

- **`CardMasonry.astro:246–292`** uses `:nth-child(… of :not([hidden]))` to lay out cards before the script runs. That only works if every `hidden` card really takes up no space. If some component rule could reveal a hidden card, the column math would be wrong.
- **`ContactForm.astro:594`**: the script hides the form with `form.hidden = true` and needs no CSS rule, because the `!important` guarantees it wins.
- **`search.ts`** takes over `<main>` by hiding the page's own content, and assumes `hidden` really hides it.

**The convention already handles your case.** The rule's comment says: use `hidden` for "not applicable" and a class for "styled away." The contact form is the example to copy. Its states are hidden by a class (`.contact-state { display: none }`) and shown by `.is-shown` or `:target`. It started out using `hidden`, and then a visitor without JavaScript landing on `#contact-sent` saw an empty region. Switching to a class fixed it, and you lose nothing for screen readers: `display: none` takes an element out of the accessibility tree just as `hidden` does.

So when an element needs to be revealed by CSS, the question to ask is whether it's actually not applicable, or just styled away right now. If CSS can bring it back, it's the second, and it shouldn't carry `hidden`.

**My one pushback is aimed at the selector, not the `!important`.** `[hidden]` also matches `hidden="until-found"`, which lets the browser's find-in-page search reveal collapsed content. Forcing `display: none` on it breaks that. Nothing uses `until-found` today; I checked. If you ever want it (say, for collapsed transcripts that find-in-page should reach), narrow the rule to `[hidden]:not([hidden='until-found'])` and keep the `!important`.

**One thing for you to settle:** the project graph lists both decisions behind this rule (`hidden-attribute-forced-with-important` and `hidden-for-not-applicable-class-for-styled-away`) as "unattributed": nobody is recorded as having made them. If you're happy to keep the rule, that's worth recording as your decision.

========== T5 ==========

The question, as each session received it:

DESIGN.md's search spec names Fuse.js as the search engine. Should we switch site search to Fuse.js so the code matches the spec? Answer and explain; don't edit any files.

The rubric for T5:

Three items, each 0 or 1:
1. Recommends against switching.
2. Gives the reason: Fuse matches substrings, and multi-word queries returned nothing.
3. Finds the record of that decision, in `CLAUDE.md` or `docs/search-ranking.md`, and treats the
   `DESIGN.md` line as out of date.

---------- T5 · answer 1 ----------

**No. Keep MiniSearch and fix the spec instead.** Here the code is right and DESIGN.md is out of date.

**Why Fuse.js was replaced**

The spec line at `DESIGN.md:1413` ("Fuse.js, the same engine the previous version of the site used") was written on 2026-08-21, before search existed. When it was built on 2026-09-13, Fuse.js was the first engine used (`fuse.js@7.5.0`), and it failed in a way no setting could fix:

- **It matches substrings, not words.** Fuse treats each query as one continuous run of characters within each field. So `design system` returned **0 results**. Going the other way, "rien" returned 7 results even with matching at its strictest (threshold 0.0), because the letters appear inside "expe*rien*ce." The Figma board used "rien" as its no-results example, which Fuse couldn't produce. `docs/astro-migration/search-index-kickoff.md:91` records this and concludes the fix had to be a different engine, not tuning.
- **MiniSearch splits text into words** and ranks with BM25 (a standard relevance formula). That fixes both problems.
- **Later search work depends on word splitting.** The `bodyTerms` field matches prose against the Topic and Genre vocabularies. That's what took `tree testing` from 0 to 5 results and `information architecture` from 10 to 23. Going back to Fuse would undo that work and bring back the multi-word bug.

**Why the spec doesn't win here**

The spec named Fuse.js for continuity ("the same engine the previous version used"), not because of any requirement about how search should match. The rules that matter in that section all still hold in the built version: search expands in place, results replace the page content, `cmd + k` opens it, and mobile shows the word "search." Only the engine choice changed. Under the project's rules, code is the truth for what was built, and a decision that has changed gets updated in the docs, not rebuilt to match old text.

**What I'd suggest instead (no files edited):**

1. **Update `DESIGN.md:1413`** to name MiniSearch and link to `docs/search-ranking.md`. That doc already explains the reasoning, so DESIGN.md doesn't need to repeat it.
2. **Fix the stale comment at `web/src/pages/search.astro:9`**, which still says "Fuse ranks in the browser."

`docs/astro-migration/search-kickoff.md` also mentions Fuse, but it's a historical record of the build and should stay as it is. Want me to draft the two edits?

---------- T5 · answer 2 ----------

No, I wouldn't switch. The spec is out of date, and the code is right. The Fuse.js line in DESIGN.md (`DESIGN.md:1413`) was written on 2026-08-21, before search was built. When search was built on 2026-09-13, Fuse.js was tried and replaced with MiniSearch for a specific, measured reason. DESIGN.md just never got updated.

**Why Fuse.js was dropped.** Fuse matches substrings, not words. It treats a whole query as one unbroken pattern to find inside each field. That broke ordinary searches, not just odd ones. The comparison recorded in `web/src/scripts/search.ts:110`, run against the live index (results per query):

| query | Fuse | MiniSearch | |
|---|---|---|---|
| `design system` | **0** | 8 | "design" in a title and "Systems" in a topic could never match together |
| `tent` | 34 | 0 | Fuse treated it the same as "content" |
| `onomy` | 13 | 0 | the same as "taxonomy" |
| `ia` | 14 | 7 | Fuse's results included "Apolog**ia**" |

No Fuse setting fixes this, because substring matching is how it works. Switching back would bring all of it back, including zero results for the site's own core subject.

**What else depends on MiniSearch.** A lot of later work assumes an engine that splits text into words:

- The `bodyTerms` field matches multi-word terms from the Topic and Genre vocabularies.
- The `ALLOW` list in `keywords.ts` lets `ai`, `ia`, `ui` and `ux` past the two-character minimum.
- The field weights were rescaled for MiniSearch's boosts.

`docs/search-ranking.md` explains all of this. Going back to Fuse would undo that work.

**What I'd do instead: correct the documents, not the code.** I haven't edited anything. Here's what's stale:

1. **`DESIGN.md:1413`** still names Fuse.js. Under your rule, a changed decision gets a superseding record rather than rationale written into DESIGN.md. So I'd make the bullet say MiniSearch and link to the record, and put the reasoning in `docs/decisions/` (components) or point to `docs/search-ranking.md`. Which of those two is the home is your call, since it's a question of where the record lives.
2. **`web/src/pages/search.astro:9`** has a comment that still says "Fuse ranks in the browser." It's a small sweep, but it's exactly the kind of stale line that leads to questions like this one.

The search kickoff docs and the comparison doc also mention Fuse, but those are historical records of the old site, so they're accurate as they are.

Want me to draft the DESIGN.md correction and the comment fix as one small change?

---------- T5 · answer 3 ----------

**No. The code is right and the spec is out of date, so the fix is to DESIGN.md, not to search.**

**Why it moved off Fuse.js.** Search was built on Fuse.js on 2026-09-13, as specified, and replaced with MiniSearch the same day. Fuse matches substrings, not words, and treats a whole query as one continuous pattern within each field. That broke ordinary searches, and no threshold setting fixes it. The measurements are recorded in `web/src/scripts/search.ts:100-124`:

| Query | Fuse | MiniSearch | What went wrong under Fuse |
|---|---|---|---|
| `design system` | 0 | 8 | "design" in a title and "Systems" in a topic could never match together |
| `tent` | 34 | 0 | Same results as "content" |
| `onomy` | 13 | 0 | Same results as "taxonomy" |
| `ia` | 14 | 7 | Included "Apologia" |

Switching back would bring all of that back. It would also throw away what was built on top of word matching since then. The `bodyTerms` field matches article text against the Topic and Genre vocabularies, which took `tree testing` from 0 results to 5 and `information architecture` from 10 to 23 (see `docs/search-ranking.md`). That depends on an engine that splits text into words.

**Why the spec says Fuse anyway.** The bullet at `DESIGN.md:1401` was written on 2026-08-21, before the build. Its only reason is "the same engine the previous version of the site used", which was continuity, not a judgment about how it matches. Nothing in it argues for substring matching. The other bullets in that section (expand in place, results replace the page, `cmd + k`, the mobile label) are still accurate.

**I'd push back a little on the framing too.** The engine is an implementation detail. The design rule worth recording is the behavior: queries match whole words, multi-word queries work, and multiword terms come from the vocabularies. If DESIGN.md states that and names MiniSearch as how it's done, the bullet can't go stale the same way again.

**What I'd change (nothing edited, as asked):**

- **`DESIGN.md:1401`:** replace the Fuse.js bullet with the behavioral requirement, name MiniSearch, and link `docs/search-ranking.md`. Under the project's rule for changed decisions, the reasoning goes in a record that supersedes the old one, probably in `docs/decisions/` under components. It shouldn't be written back into DESIGN.md.
- **`web/src/pages/search.astro:9`:** its comment still says "Fuse ranks in the browser". That's a one-word fix.
- **CLAUDE.md line 425** still lists Fuse.js among what the spec covers. The paragraph right after it corrects that, so it's lower priority, but it will read correctly once DESIGN.md is fixed.

Whether the engine name belongs in DESIGN.md at all, or only in `docs/search-ranking.md`, is your call. I can draft the DESIGN.md wording and the decision record if you want them.
