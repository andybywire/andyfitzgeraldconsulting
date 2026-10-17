# Focus and visibility: the knowledge inventory

The ground truth for the Project Graph experiment ([protocol.md](protocol.md)): every claim this
repo makes about focus and visibility, where each one is stated, and where they disagree. Stage 5's
tasks are scored against it.

**Every location is at `086dd0f`**, the commit all three arms start from. The inventory was taken
on 2026-10-17 by one read-only agent pass at `034bec5`. The two commits differ only in
`web/src/components/ContactForm.astro`, so its line numbers were re-derived from
`git show 086dd0f:…`, and every other reference carries over unchanged. Three things in
`034bec5`'s ContactForm do not exist at the base: the `.contact-state:focus` rule, its comment,
and the corrected Back-button reset. Claims that only those state are left out.

**Verification is marked per item, because this list scores the runs.** "Verified" means read at
`086dd0f` by hand. "Reported" means the agent pass found it and nobody has checked it. Every item a
stage 5 task scores must be verified before that stage runs; see the protocol's preconditions.

## 1. Contradictions: the scored set for T3

Each "hard" item is a real disagreement: two places that cannot both be right, or a comment that
the code beside it contradicts. "Soft" items are tensions or loose wording. They are listed, but
they don't count toward recall.

| #   | What disagrees                                                                                                                                                                                                         | Where (at `086dd0f`)                                                                                                     | Kind | Status   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---- | -------- |
| 1   | A `tabindex="-1"` element "does not take a visible ring from a scripted `.focus()`" vs. real browsers draw one                                                                                                         | `ContactForm.astro:529-533` vs `cards/CardMasonry.astro:189-200`, `DESIGN.md:1120-1123`                                  | hard | verified |
| 2   | `.field-error`: any `display` declared here "would out-specify" the browser's `[hidden]` vs. base.css's `!important`, which nothing can out-specify, and which the same file cites 30 lines later                     | `ContactForm.astro:503-505` vs `styles/base.css:77-99`, `ContactForm.astro:535-550`                                      | hard | verified |
| 3   | Ring radii are "a real `calc()`" vs. `box-shadow` spread derives them, with no `calc()`                                                                                                                                | `docs/decisions/components.md:46-48` vs `DESIGN.md:918-925`, `styles/base.css:697-701`                                   | hard | verified |
| 4   | Focusing a just-revealed element needs a forced reflow (`void el.offsetWidth`) first vs. card-index un-hides `fewer` and focuses it with no reflow in between (`fitRow()` measures before it un-hides)              | `ContactForm.astro:727-737`, `scripts/search.ts:823-833` vs `scripts/card-index.ts:105-110, 160-168`                     | hard | verified |
| 5   | A scroll region without `tabindex="0"` is unreachable by keyboard "at all" vs. Chrome and Firefox make scroll regions focusable themselves, and only Safari does not                                                     | `prose/Code.astro:50-56`, `DESIGN.md:1482-1485` vs `SlideDeck.astro:89-93`                                               | hard | verified |
| 6   | The search toggle "ships `hidden` … revealed by the script" vs. it is gated in CSS on `html.js` and does not carry `hidden`                                                                                             | `docs/astro-migration/search-kickoff.md:172-176` vs `Masthead.astro:300-305, 953-969`                                    | hard | verified |
| 7   | The grid gets its tabindex from script "because only script ever focuses it" vs. a click in the gutters focuses the grid                                                                                                | `scripts/card-index.ts:706-711` vs `cards/CardMasonry.astro:199-200`                                                     | hard | verified |
| 8   | "open-questions.md records the alternative" (the group heading as reset focus target) vs. it is recorded in urls-and-filtering.md and was never in open-questions.md                                                    | `scripts/search.ts:923-928` vs `docs/urls-and-filtering.md:390-395`                                                      | hard | verified |
| 9   | `tabindex="-1"` on "all ten `<main>` elements" vs. nine pages carry one, since `specimen.astro` was removed                                                                                                            | `CLAUDE.md:585` vs the nine `<main id="main" tabindex="-1">` in `web/src/pages/`                                         | hard | verified |
| 10  | The `js` class is set at `BaseLayout.astro:72` vs. it is set at line 356                                                                                                                                                | `SlideDeck.astro:26-30` vs `layouts/BaseLayout.astro:356`                                                                | hard | verified |
| 11  | The Back-button reset sets `sent.hidden = true` vs. the same file explains that `[hidden]`'s `!important` means a class, not the attribute, must hide these blocks. A second send after coming Back shows nothing. | `ContactForm.astro:827` vs `ContactForm.astro:535-550, 727-731`                                                          | hard | verified |
| 12  | Masthead describes the rejected alternative two ways: "`[hidden]` is applied by a script" vs. "`hidden` plus a script that removes it"                                                                                 | `Masthead.astro:302-303` vs `Masthead.astro:956`                                                                         | soft | verified |
| 13  | Clear both `box-shadow` and `outline` "because both can draw a ring" vs. clearing `outline` "would suppress nothing". Each is right for the selector it targets (`:focus` vs `:focus-visible`).                       | `cards/CardMasonry.astro:202-203` vs `Recording.astro:372-373`                                                           | soft | verified |
| 14  | Content neither drawn nor announced "wants `aria-hidden` and `display: none`", citing the honeypot, which avoids `display: none` on purpose                                                                             | `VisuallyHidden.astro:8-14` vs `ContactForm.astro:267-286`                                                               | soft | verified |
| 15  | Revisit the reset focus target "with the live region" vs. card-index calls it "still open". The condition the decision waits on may already be met.                                                                   | `docs/urls-and-filtering.md:390-395` vs `scripts/card-index.ts:624-628`                                                  | soft | verified |

**Item 4 was misjudged once already.** The plan for this experiment called it "probably not real"
on the assumption that `fitRow()` forces a layout between the un-hide and the focus. Reading
`fitRow()` showed it measures first and un-hides afterward. The disagreement stands. Which side is
right is untested: browsers may update style inside `focus()` itself, which would make the forced
reflows unnecessary rather than card-index broken.

**A gap, not a contradiction, and not scored:** ring suppression covers the card grid only. At
the base, nothing suppresses the ring on the nine `<main tabindex="-1">` skip-link targets or on
`#result-count` (`ResultsFooter.astro:93`, focused by `scripts/card-index.ts:650`). Whether those
rings actually show in a real browser is unchecked.

## 2. Claims, and every place each is stated

The ground truth for T2's site recall. **Status: reported**, apart from the locations the
contradiction checks above read directly. T2's own list, in the protocol, is the subset that
must be verified before stage 5.

Basis: **bare** means no method, browser, date or person is given; otherwise the basis is quoted.
**DUP ×n** marks a claim restated in n places.

### Focus ring

| ID  | Claim                                                                                                          | Stated or relied on at                                                                                                                                                                | Basis                                            | Flags                     |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------- |
| FR1 | One global `:focus-visible` ring, `outline: none` plus a two-ring `box-shadow`; components don't redeclare it | `styles/base.css:690-709`; `ContactForm.astro:474-479`; `Recording.astro:364-366`; `Masthead.astro:1094-1101`; `Chip.astro:63-65`; `docs/urls-and-filtering.md:383`; `DESIGN.md:885` | bare                                             | DUP ×7                    |
| FR2 | Ring radii come from the `box-shadow` spread, with no `calc()`                                                | `styles/base.css:697-701`; `styles/tokens.css:262`; `DESIGN.md:918-925`; `docs/figma-notes.md:177-183`                                                                                | DESIGN.md records its own correction, 2026-08-21 | contradiction 3           |
| FR3 | The ring is a relationship: on an accent band each control swaps the pair itself; `<Band>` does not            | `styles/base.css:692-695`; `Band.astro:146-155`; `Button.astro:153-170`; `ThemeToggle.astro:167-184`; `pages/index.astro:545-549, 567-570`; `DESIGN.md:417-421, 971-974, 1184-1189` | ThemeToggle "computed from the token values"     | DUP ×10+                  |
| FR4 | To remove a ring, clear both `box-shadow` and `outline`; a scoped (0,3,0) rule beats base.css's (0,1,0)       | `cards/CardMasonry.astro:202-209`                                                                                                                                                     | bare                                             | soft contradiction 13     |

### Script-moved focus and landing points

| ID  | Claim                                                                                                                          | Stated or relied on at                                                                                                                                         | Basis                                                     | Flags                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------- |
| PF1 | Script or fragment focus on a `tabindex="-1"` element draws the ring in real browsers; "visible" is a per-engine heuristic     | `cards/CardMasonry.astro:189-200`; `DESIGN.md:1120-1123`                                                                                                        | "(Andy, 2026-09-30) … seen in Chrome, Safari and Vivaldi" | contradiction 1           |
| PF2 | Suppress with `:focus`, not `:focus-visible`, so the rule holds whatever the heuristic decides                                 | `cards/CardMasonry.astro:197-209`                                                                                                                               | bare                                                      |                           |
| PF4 | Landing points are focused only by script                                                                                       | `scripts/card-index.ts:706-711`                                                                                                                                 | bare                                                      | contradiction 7           |
| LP1 | `tabindex="-1"` makes an element focusable by script only, not a tab stop                                                     | `layouts/BaseLayout.astro:728-730`; `ResultsFooter.astro:78-81`; `scripts/card-index.ts:713-714`; `cards/CardMasonry.astro:192-193`; `ContactForm.astro:143`; `DESIGN.md:1121`; `CLAUDE.md:585` | bare                                                      | DUP ×7                    |
| LP2 | Following a `#fragment` moves the scroll position but not focus unless the target is focusable                                  | `layouts/BaseLayout.astro:720-726`; `CLAUDE.md:585-587`                                                                                                         | bare                                                      | contradiction 9 (count)   |
| LP3 | The next Tab from a landing point reaches a control that draws its own ring                                                     | `cards/CardMasonry.astro:193`; `DESIGN.md:1122-1123`                                                                                                            | bare                                                      |                           |
| LP4 | Moving focus to a named element is the announcement; prefer it to `aria-live` for replaced content, since doing both double-announces | `ContactForm.astro:143-147`; `scripts/card-index.ts:700-706, 831-833`; `ResultsFooter.astro:83-88`; `CardResults.astro:31-36`; `DESIGN.md:1120, 1134` | bare; no screen reader named                              | DUP ×6                    |
| LP5 | `aria-labelledby` reads the referenced text even when that element is hidden                                                    | `CardResults.astro:35-36`; `scripts/card-index.ts:533-536`                                                                                                      | bare                                                      | DUP ×2                    |
| LP6 | Scroll into view first, then `focus({preventScroll: true})`                                                                     | `scripts/card-index.ts:825-829`                                                                                                                                 | bare                                                      |                           |

### Losing focus

| ID  | Claim                                                                                          | Stated or relied on at                                                                                                                                                                                          | Basis | Flags                              |
| --- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------- |
| FL1 | A control that hides or removes itself drops focus to `<body>`, and the next Tab starts over   | `scripts/card-index.ts:166-167, 623-624, 638-642`; `scripts/search.ts:888-891, 923-926`; `ResultsFooter.astro:79-81`; `Recording.astro:454-456`; `docs/urls-and-filtering.md:390-392`; `docs/astro-migration/insights-filtering-kickoff.md:71` | bare  | DUP ×9                             |
| FL2 | After a reset, focus goes to the first visible chip; the group heading is the deferred option | `docs/urls-and-filtering.md:390-395`; `scripts/card-index.ts:625-627`; `scripts/search.ts:924-928`                                                                                                                | bare  | contradiction 8, soft 15           |
| FT1 | `focus()` does nothing on a `display: none` element; force a reflow after un-hiding           | `ContactForm.astro:727-737`; `scripts/search.ts:823-833`; `docs/astro-migration/contact-page-kickoff.md:233`; `docs/astro-migration/page-template-kickoff.md:182`                                                 | bare  | DUP ×4; contradiction 4            |

### Hiding

| ID  | Claim                                                                                                                        | Stated or relied on at                                                                                                                                                                                                                        | Basis                                                     | Flags                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------- |
| HD1 | The browser's own `[hidden]` loses to any author `display` rule, so base.css adds `!important`; `[hidden]` means "not applicable", a class means "styled away" | `styles/base.css:77-99`; `docs/astro-migration/insights-filtering-kickoff.md:102-105`; `docs/astro-migration/page-template-kickoff.md:161-166`; `ContactForm.astro:535-550`                                          | "Caught by the Insights filter chips (2026-08-31)"        | DUP ×4; contradiction 2 |
| HD2 | So CSS cannot reveal a `[hidden]` element; the contact state blocks use `.is-shown` and `:target`                          | `ContactForm.astro:535-578, 727-742`; `docs/astro-migration/page-template-kickoff.md:161-166`                                                                                                                                                | "Caught by reading `display`"                             | DUP; contradiction 11   |
| HD4 | `hidden` / `display: none` takes no grid cell or gap and measures 0, so reveal before measuring                             | `ContactForm.astro:322`; `CardResults.astro:60-63, 84-86`; `scripts/card-index.ts:78-80, 819-822`; `cards/CardMasonry.astro:426-428`; `scripts/search.ts:568-576`; `docs/astro-migration/search-index-kickoff.md:154-156`                     | search.ts "measured at 375"                               | DUP ×6                  |
| HD5 | Controls that need JavaScript ship `hidden` and the script reveals them                                                      | `SlideDeck.astro:32-35, 123-126, 603-608`; `Recording.astro:147-150`; `FacetFilters.astro:122-123`; `ResultsFooter.astro:97-100`; `pages/presentations/index.astro:247`; `Masthead.astro:293-296`; `docs/astro-migration/search-kickoff.md:173-176` | Andy, 2026-09-12                                          | DUP ×7; contradiction 6 |
| HD6 | Hide before first paint with the synchronous head script (`html.js`)                                                         | `Masthead.astro:953-969`; `SlideDeck.astro:27-30`; `layouts/BaseLayout.astro:365-378`; `pages/search.astro:308-326`; `scripts/card-index.ts:46-49`                                                                                           | Andy, 2026-09-12                                          | contradiction 10        |

### Visually hidden, `aria-hidden`, keyboard reach

| ID  | Claim                                                                                                         | Stated or relied on at                                                                                                                                      | Basis                                                 | Flags           |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------- |
| VH1 | `visibility: hidden` leaves the accessibility tree like `display: none`; use the 1px clip for text that must stay a name | `Masthead.astro:924-935`; `VisuallyHidden.astro:30-45`; `docs/astro-migration/phase-4-kickoff.md:61-62`; `ThemeToggle.astro:88-96`; `layouts/BaseLayout.astro:804-805` | Masthead measured "scrollWidth 1206 against 1200", 2026-08-24 | DUP ×5          |
| VH2 | Visually hidden means "announced but not drawn"                                                               | `VisuallyHidden.astro:3-14`; `ContactForm.astro:284-286`; `layouts/BaseLayout.astro:740-743`; `Masthead.astro:910-922`                                      | bare                                                  | soft 14         |
| VH3 | `aria-hidden` around a focusable element is normally an ARIA violation; `tabindex="-1"` resolves it           | `ContactForm.astro:272-283`; `web/server/contact.php:248-250`                                                                                               | "standard honeypot treatment"                         | DUP ×2          |
| VH4 | Lucide icons get `aria-hidden` by default, so the name goes on the button                                     | `styles/base.css:672-674`; `Masthead.astro:306-310, 907-908`; `SlideDeck.astro:131-132`; `cards/NoteCard.astro:82`; `cards/SourceCard.astro:70`             | bare                                                  | DUP ×6          |
| KB1 | A scroll region needs `tabindex="0"` to be reachable by keyboard                                             | `prose/Code.astro:50-56`; `DESIGN.md:1482-1485`; `SlideDeck.astro:89-93`                                                                                     | bare                                                  | contradiction 5 |

### What automated browsers get wrong

| ID  | Claim                                                                                                        | Stated at                                                                                                                                                                         | Flags                                                   |
| --- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| AB1 | Headless Chrome and the Browser pane report `:focus-visible` false after script focus; real browsers draw a ring | `cards/CardMasonry.astro:195-197`                                                                                                                                                 | In no gotcha list; also in auto-memory, outside the repo |
| AB2 | The pane runs with `document.hidden`, so `requestAnimationFrame` never fires                                | seven kickoffs in `docs/astro-migration/`; `SlideDeck.astro:756-757`; `scripts/search.ts:829-830`                                                                                  | DUP ×9                                                  |
| AB3 | No `scroll` / `scrollend` events; smooth `scrollTo` does nothing                                             | four kickoffs in `docs/astro-migration/`                                                                                                                                          | DUP ×4                                                  |
| AB4 | Transitions never advance, so computed styles lag                                                            | three kickoffs in `docs/astro-migration/`; `CLAUDE.md:928-930`                                                                                                                    | DUP ×4                                                  |

## 3. Vocabulary drift

Counts are case-insensitive lines over `web/src`, `docs`, `CLAUDE.md` and `DESIGN.md`. They were
measured at `034bec5`, except "landing point", which was recounted at the base. This is the input
for stage 3's SKOS scheme: which preferred label each concept gets, and which homonyms need
scope notes.

| Concept                                    | Terms in use                                                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A non-control element that receives focus  | "landing point" (3 at the base, and `scripts/card-index.ts:688` uses it for a scroll destination, a different meaning); "focus target" (2, both about a real control); "somewhere to land"; "the target"; "region" / "landmark" |
| Focus moved by script                      | "programmatic focus" / "focusable programmatically" (4); "scripted `.focus()`"; "move(s) / moving focus" (7); "focus follows" (2)                                                     |
| Focus lost                                 | "drops focus to the body", "falls to `<body>`" (3), "focus lands on `<body>`", "falls back to the document"; consequences phrased six ways ("lose their place", "starting the page again", …) |
| The ring                                   | "focus ring" (55 lines, 20 files); "two-ring"; "focus pair" (4); "ring pair"; "offset-then-ring" (3)                                                                                  |
| What `hidden` means                        | "not applicable" (5) vs "styled away" (3); "ships `hidden`" (9 lines, 6 files), also called "the contract" (5)                                                                     |
| The automated browser                      | "Browser pane" (8); "the pane" (6); "headless Chrome" (5, naming two different tools: the pane's checks and the a11y harness)                                                       |
| "inert"                                    | 56 lines, three senses: a rule with no effect; a control that does nothing; the HTML `inert` behavior of `<template>` and `<dialog>`                                               |

## 4. When the main claims arrived

Three times, a lesson was learned in one file while an older, contradicting claim stood in another.
That's the pattern the "correction" tasks test.

| Date       | Commit    | Event                                                                                                     |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | `f66480d` | components.md: ring radii use "a real `calc()`"                                                           |
| 2026-08-21 | `55cc55e` | DESIGN.md corrects it to the `box-shadow` derivation; components.md is never updated                      |
| 2026-08-31 | `8e6c67e` | base.css adds `[hidden] { … !important }`; card-index focuses `fewer` with no reflow                      |
| 2026-08-31 | `d091932` | `#result-count` becomes a `tabindex="-1"` focus fallback, with no ring suppression                        |
| 2026-09-05 | `a6c870d` | ContactForm: "does not take a visible ring" (wrong); `.field-error`'s reasoning (stale since 08-31); `.is-shown` / `:target`; reflow before focus |
| 2026-09-12 | `f5809f9` | Search kickoff: the toggle "ships `hidden`"                                                                |
| 2026-09-13 | `be1f23a` | Masthead gates the toggle on `html.js` instead; search.ts repeats reflow-before-focus and cites the wrong file |
| 2026-09-17 | `60b583c` | Skip link, `<main tabindex="-1">`, and CLAUDE.md's "ten `<main>`"                                         |
| 2026-09-23 | `e46c540` | `specimen.astro` removed, leaving nine                                                                    |
| 2026-09-30 | `4138182` | CardMasonry: real browsers draw the ring, and headless Chrome misreports it, while ContactForm's opposite claim already stands |
| 2026-10-16 | `034bec5` | ContactForm reconciled (after the base). `96c10e5` corrects that commit's dating of the history.           |
