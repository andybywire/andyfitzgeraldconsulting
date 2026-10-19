# Glossary

Every id a `@concept` or `@claim` tag can name, in alphabetical order. A concept is a term the
comments use; a claim is one statement the comments make, recorded once however many comments
make it. Search the repository for an id to find the comments tagged with it.

## Concepts

### `automated-browser`: automated browser

Broader: none.

A browser driven by a tool rather than a person. It reports some states differently from real browsers.

### `browser-pane`: Browser pane

Also: the pane, in-app browser.
Broader: `automated-browser`.

The browser built into the Claude app.

### `focus-loss`: focus loss

Also: dropped focus, focus falls to the body.
Broader: none.

Focus falling back to <body> when the focused element is hidden or removed, so the next Tab starts from the top of the page.

### `focus-ring`: focus ring

Also: focus indicator, two-ring, offset-then-ring, focus pair, ring pair.
Broader: none.

The visible indicator drawn around the focused element. Here, base.css's two-ring box-shadow.

### `focus-target`: focus target

Broader: none.

Wherever programmatic focus is sent: a control, such as the reset chip, or a landing point.

### `forced-reflow`: forced reflow

Also: layout flush, void el.offsetWidth.
Broader: none.

Making the browser compute layout right away, such as before focusing or measuring something just un-hidden.

### `headless-chrome`: headless Chrome

Broader: `automated-browser`.

Chrome driven over the DevTools protocol, by the accessibility check or by one-off probes.

### `hidden-from-assistive-technology`: hidden from assistive technology

Also: aria-hidden, drawn but not announced.
Broader: `hiding`.

Drawn, but left out of what assistive technology announces.

### `hiding`: hiding

Broader: none.

Any way an element is kept from being drawn, announced, or both.

### `inert-content`: inert content

Also: inert subtree.
Broader: `hiding`.

HTML inertness: not focusable, not clickable, not announced. <template> content, the page behind an open <dialog>, and the inert attribute, which is used nowhere.

### `javascript-only-control`: JavaScript-only control

Also: ships hidden, the contract, html.js gating.
Broader: none.

A control that does nothing without JavaScript, so it must not appear without it. Two mechanisms are in use: hidden in the markup, removed by script, or CSS keyed on html.js, set before first paint. A control shown without JavaScript that does nothing is the failure this prevents.

### `landing-point`: landing point

Also: somewhere to land, focus fallback.
Broader: `focus-target`.

A non-control element given tabindex="-1", so programmatic focus has somewhere to land without it becoming a Tab stop.

### `not-applicable`: not applicable

Also: hidden attribute, [hidden].
Broader: `hiding`.

The hidden attribute: the element does not apply right now.

### `programmatic-focus`: programmatic focus

Also: scripted focus, script-moved focus, moving focus, focus follows.
Broader: none.

Focus moved without a Tab press or a click: by script (.focus()), or by following a fragment link to a focusable target.

### `screen-reader-announcement`: screen reader announcement

Also: announcement.
Broader: none.

What assistive technology speaks: on focus, from a live region, or from a name. A live region is covered by this note rather than being a concept of its own.

### `scroll-region`: scroll region

Also: scrollable region, scroll container.
Broader: none.

An element whose content scrolls. Reachable by keyboard only if focusable.

### `styled-away`: styled away

Also: hidden by a class, class-based hiding.
Broader: `hiding`.

Hidden by a class or :target because it still applies but is not shown in this state.

### `visually-hidden`: visually hidden

Also: clip technique, 1px clipped box, announced but not drawn.
Broader: `hiding`.

Kept off screen but still announced.

## Claims

### `a11y-check-does-not-test-announcements`

Repo fact, about `headless-chrome`, `screen-reader-announcement`.

The accessibility check does not test keyboard use, focus order, what a screen reader announces, alt-text quality, or interactive states such as search open.

### `a11y-check-runs-axe-in-headless-chrome`

Repo fact, about `headless-chrome`.

The accessibility check, pnpm a11y, loads every page in headless Chrome over the DevTools protocol and runs axe-core.

### `a11y-harness-caught-links-mid-transition`

Observation, about `headless-chrome`.

Without reduced motion and a wait for animations, the accessibility check caught links partway through base.css's 0.15s color transition and reported contrast failures in colors that were no token.

Measured: 1 run in 10 of the accessibility check, which loads pages in headless Chrome, using `headless-chrome`.

### `accent-band-components-swap-focus-colors`

Decision, about `focus-ring`.

A control that can appear on an accent band swaps the focus-ring pair itself, putting focus-ring inside and focus-offset outside.

Unattributed: nobody is named.

### `announcement-does-not-name-the-filter`

Decision, about `screen-reader-announcement`.

The result announcement does not name the filter that caused the change, because the chip just clicked is focused and its own accessible name already says it.

Unattributed: nobody is named.

### `announcement-region-ships-empty`

Decision, about `screen-reader-announcement`, `visually-hidden`.

Result changes are announced by a separate visually hidden role="status" region that ships empty and is written only on a user-initiated change; the visible count line carries no live role.

Overturns `promote-count-line-to-status-after-first-render`. Unattributed: nobody is named.

### `aria-current-page-and-true-announce-differently`

Observation, about `screen-reader-announcement`.

aria-current="page" and aria-current="true" both match [aria-current], so the indicator is identical and only what is announced differs.

Assumed: no basis is stated.

### `aria-hidden-on-focusable-is-an-aria-violation`

Observation, about `hidden-from-assistive-technology`.

aria-hidden around a focusable element is normally an ARIA violation; tabindex="-1" on the element resolves it.

Assumed: no basis is stated.

### `aria-hidden-removes-from-accessibility-tree`

Observation, about `hidden-from-assistive-technology`.

aria-hidden takes an element out of the accessibility tree, so a screen reader user never meets it.

Assumed: no basis is stated.

### `aria-labelledby-name-follows-referenced-text`

Observation, about `screen-reader-announcement`.

An accessible name computed through aria-labelledby follows the referenced text, so rewriting that text renames the element.

Assumed: no basis is stated.

### `aria-labelledby-reads-hidden-text`

Observation, about `screen-reader-announcement`, `not-applicable`.

aria-labelledby reads the referenced text even while that element is hidden.

Assumed: no basis is stated.

### `aria-pressed-is-button-only`

Observation, about `screen-reader-announcement`.

aria-pressed is valid only on buttons, so an anchor chip carries its selected state with aria-current.

Assumed: no basis is stated.

### `author-display-rule-overrides-ua-hidden`

Observation, about `not-applicable`.

The user agent implements the hidden attribute as an ordinary [hidden] { display: none } at (0,1,0), so any author rule that sets display on the same element overrides it and the element stays visible.

Measured: Caught by the Insights filter chips: .chip { display: inline-flex } left a hidden "See all genres" button rendering while el.hidden was true (2026-08-31).

### `automated-checks-find-a-minority-of-accessibility-failures`

Observation, about `automated-browser`.

Automated accessibility checks find only a minority of real accessibility failures, roughly a third of WCAG failures, so a pass is a floor.

Assumed: no basis is stated.

### `axe-label-in-name-matches-whole-words`

Observation, about `screen-reader-announcement`.

axe's Label in Name check matches whole words: "Close search, esc" and "Esc, close search" pass, while "Close search (Esc)" and "Close search, Escape" do not.

Measured: Measured against axe inside the real /search/ page.

### `axe-passes-close-search-name-in-isolation`

Observation, about `screen-reader-announcement`.

axe passes the close-search button's failing old name in isolation and fails it inside the real /search/ page, with the page's own CSS applied.

Measured: Measured against axe inside the real /search/ page and in isolation.

### `band-does-not-repoint-focus-ring`

Decision, about `focus-ring`.

<Band tone="accent"> does not re-point the focus-ring tokens, because which color contrasts the control depends on the control, not on the band.

Unattributed: nobody is named.

### `bare-media-control-announces-only-as-player`

Observation, about `screen-reader-announcement`.

An <audio> control with no aria-label announces only as a media player; the heading beside it is not its accessible name.

Assumed: no basis is stated.

### `base-focus-ring-is-box-shadow-with-outline-cleared`

Repo fact, about `focus-ring`.

base.css draws the focus ring with box-shadow on :focus-visible and sets outline: none.

### `box-shadow-ring-follows-border-radius`

Observation, about `focus-ring`.

A box-shadow spread grows the shadow's corner radius along with the element's, so the box-shadow focus rings stay concentric with whatever radius the control has.

Measured: On the masthead search input at border-radius 0, the ring came out square-cornered inside a field rounded to radius-1; giving the input radius-1 is what rounded it.

### `browser-pane-fires-no-scroll-events`

Observation, about `browser-pane`.

No scroll events fire in the Browser pane, neither scroll nor scrollend, even for an instant programmatic scroll.

Measured: Encountered while verifying in the Browser pane, using `browser-pane`.

### `browser-pane-never-advances-transitions`

Observation, about `browser-pane`.

In the Browser pane animations and transitions never advance, so a transitioned property freezes at its previous value and getComputedStyle readings lag one interaction behind.

Measured: Encountered on .button's transitioned border-color in the Browser pane, first misdiagnosed as stale dev CSS, using `browser-pane`.

### `browser-pane-never-fires-raf`

Observation, about `browser-pane`.

requestAnimationFrame never fires in the Browser pane, so any rAF-deferred work never runs.

Measured: Encountered while verifying in the Browser pane: rAF never fired and hung the tool call until it timed out, and twice stale-looking layout turned out to be a deferred rAF rather than a bug, using `browser-pane`.

### `browser-pane-opens-with-zero-layout-width`

Observation, about `browser-pane`.

The Browser pane opens with zero layout width until the window is resized explicitly.

Measured: Encountered while measuring the presentations work in the Browser pane, using `browser-pane`.

### `browser-pane-runs-with-document-hidden`

Observation, about `browser-pane`.

The Browser pane runs with document.hidden true.

Measured: Encountered while verifying in the Browser pane, where each behavior it suppresses looked like a bug in the code first, using `browser-pane`.

### `browser-pane-screenshots-unreliable`

Observation, about `browser-pane`.

Browser pane screenshots are unreliable, especially after a programmatic scroll, where blank captures are common.

Measured: Encountered while measuring in the Browser pane, using `browser-pane`.

### `browser-pane-smooth-scroll-is-a-no-op`

Observation, about `browser-pane`.

In the Browser pane a smooth scrollTo, including window.scrollTo under the global scroll-behavior: smooth, silently does nothing.

Measured: Encountered while verifying in the Browser pane, using `browser-pane`.

### `browser-pane-suppresses-lazy-loading`

Observation, about `browser-pane`.

The Browser pane suppresses lazy loading entirely: advancing a carousel loads nothing.

Measured: Encountered while verifying the slide deck in the Browser pane, using `browser-pane`.

### `browser-pane-synthetic-return-does-not-submit`

Observation, about `browser-pane`.

In the Browser pane a synthetic Return does not submit a form, while requestSubmit() and a real submit-button click both do.

Measured: Encountered while verifying search in the Browser pane, using `browser-pane`.

### `caption-as-alt-is-read-twice`

Observation, about `screen-reader-announcement`.

An image whose alt repeats its figcaption makes a screen reader read the same sentence twice.

Assumed: no basis is stated.

### `card-anchor-on-title-with-stretched-pseudo-element`

Decision, about `screen-reader-announcement`.

A card's anchor stays on its title and a stretched pseudo-element makes the whole card the click target, so the accessible name stays the title.

Unattributed: nobody is named.

### `card-grid-named-by-count-line`

Decision, about `landing-point`, `screen-reader-announcement`.

The card grid is role="region", named by aria-labelledby pointing at the result-count line, so focus landing on it announces the count.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-09-30.

### `card-truncation-applies-only-with-html-js`

Observation, about `javascript-only-control`.

The Insights index renders 24 cards with the html.js class and all 45 without it.

Measured: Verified: 24 cards render with the class, 45 without.

### `card-truncation-keyed-on-html-js`

Decision, about `javascript-only-control`.

The index's pre-paint truncation to the first cards is keyed on html.js, so without JavaScript every card renders.

Decided by <https://andyfitzgeraldconsulting.com/#person>.

### `card-wrapping-anchor-announces-all-content-as-one-link`

Observation, about `screen-reader-announcement`.

An anchor wrapped around a whole card announces all of the card's text as one link.

Assumed: no basis is stated.

### `chip-accessible-name-changes-by-state`

Decision, about `screen-reader-announcement`.

A facet chip's accessible name changes by state (", add filter", ", selected, remove filter", ", no results, unavailable"), because the same control means opposite things and only its fill says so visually.

Unattributed: nobody is named.

### `chip-label-wording-caused-label-in-name-failure`

Observation, about `screen-reader-announcement`.

The facet chips' Label in Name failure was caused by the punctuation of their accessible name, the comma breaking axe's contiguous match, as the comments describe the earlier belief.

Assumed: no basis is stated.

### `chip-width-independent-of-visible-siblings`

Observation, about `forced-reflow`.

A facet chip's width does not depend on how many of its siblings are visible.

Assumed: no basis is stated.

### `chrome-and-firefox-make-scroll-regions-focusable`

Observation, about `scroll-region`.

Chrome and Firefox make scrollable regions focusable on their own.

Assumed: no basis is stated.

### `click-in-grid-gutter-focuses-the-grid`

Observation, about `landing-point`.

Once the card grid is focusable, a click in the gutters between cards focuses the grid.

Assumed: no basis is stated.

### `clipped-box-is-the-only-way-to-be-invisible-and-in-the-tree`

Observation, about `visually-hidden`.

The 1px clipped box is the only way to make content invisible while keeping it in the accessibility tree.

Assumed: no basis is stated.

### `close-search-named-close-search`

Decision, about `screen-reader-announcement`.

The close-search button's accessible name is "Close search" alone, on the grounds that no screen-reader user needs to be told the glyph says E-S-C, as the comment describes the earlier choice.

Unattributed: nobody is named.

### `close-search-named-close-search-esc`

Decision, about `screen-reader-announcement`.

The close-search button is named "Close search, esc": the action first, then the visible key name, for voice-control users who say what they see (WCAG 2.5.3, Label in Name).

Overturns `close-search-named-close-search`. Unattributed: nobody is named. Dated 2026-10-08.

### `cmd-k-opens-search-and-focuses-field`

Decision, about `programmatic-focus`.

cmd + k opens site search and moves focus into the field.

Unattributed: nobody is named.

### `code-blocks-get-no-region-role`

Decision, about `scroll-region`.

Focusable code blocks carry no role="region" or aria-label, so that many code blocks in one article do not bury the page's real landmarks.

Unattributed: nobody is named.

### `contact-state-announced-by-focus-not-live-region`

Decision, about `programmatic-focus`, `screen-reader-announcement`.

The contact form's sent and failed blocks are announced by moving focus to them, not by aria-live.

Unattributed: nobody is named.

### `contact-state-focus-visible-not-suppressed`

Decision, about `focus-ring`, `landing-point`.

The contact form's sent and failed blocks keep base.css's :focus-visible ring, though they are focusable only programmatically.

Unattributed: nobody is named.

### `contact-states-hidden-by-class`

Decision, about `styled-away`.

The contact form's sent and failed blocks are hidden by a class, not by the hidden attribute, so that :target and the script's .is-shown can reveal them.

Unattributed: nobody is named.

### `count-line-reads-total-on-focus`

Observation, about `screen-reader-announcement`, `landing-point`.

Focus landing on the result-count line reads out the new total.

Assumed: no basis is stated.

### `custom-property-substitution-is-not-sequential`

Observation, about `focus-ring`.

Custom property substitution is not sequential: pointing --color-focus-ring at --color-focus-offset while declaring --color-focus-offset in the same block resolves both against the element's own cascaded value, so the two collapse to one color.

Assumed: no basis is stated.

### `deck-arrow-keys-scoped-to-track`

Decision, about `scroll-region`.

The slide deck's arrow keys are bound to the focusable track, not to the document.

Unattributed: nobody is named.

### `deck-download-link-not-hidden`

Decision, about `javascript-only-control`.

The slide deck's download link does not ship hidden, because it is a plain anchor that works with no script.

Unattributed: nobody is named.

### `deck-fullscreen-focuses-track`

Decision, about `programmatic-focus`, `focus-target`.

Opening the slide deck full screen moves focus to the track, so the arrow keys work at once.

Unattributed: nobody is named.

### `deck-pager-disabled-not-hidden-at-ends`

Decision, about `hiding`.

The slide deck's previous and next buttons are disabled rather than hidden at the ends of the deck, so the control row does not reflow as you page.

Unattributed: nobody is named.

### `deck-restore-runs-from-both-paths`

Decision, about `browser-pane`.

The slide deck's exit from full screen is idempotent and runs from both the close button and the dialog's close event, so it does not depend on whether close fires.

Unattributed: nobody is named.

### `deck-track-needs-no-javascript`

Observation, about `scroll-region`, `javascript-only-control`.

The slide deck track's scroll-snap, native swipe, scrollbar and keyboard scrolling all work from CSS and the platform, with no script.

Assumed: no basis is stated.

### `default-focus-order-vanishes-into-selected-theme-pill`

Observation, about `focus-ring`.

On the color-mode selector, the default order's white inner focus-offset ring would vanish into the white selected pill.

Assumed: no basis is stated.

### `dialog-brings-focus-trap-and-inert-background`

Observation, about `inert-content`.

A modal <dialog> brings a top layer, a focus trap, Esc-to-close, inert background content and ::backdrop.

Assumed: no basis is stated.

### `dialog-close-fired-no-close-event-in-the-pane`

Observation, about `browser-pane`.

dialog.close() set open to false and fired no close event, with a listener added in the same call counting zero; whether this is platform behavior or an artifact of the Browser pane was not established.

Measured: Measured in the browser, the automated pane, while building the slide deck's full-screen view, using `browser-pane`.

### `disclosure-focus-moves-to-replacing-control`

Decision, about `programmatic-focus`, `focus-target`.

When a facet group's See all or See fewer control is pressed, focus moves to the control that replaced it.

Unattributed: nobody is named.

### `display-none-or-visibility-hidden-makes-a-control-unfocusable`

Observation, about `hiding`.

display: none or visibility: hidden makes a form control unfocusable and unreachable.

Assumed: no basis is stated.

### `display-none-removes-from-accessibility-tree`

Observation, about `hiding`, `screen-reader-announcement`.

display: none takes an element out of the accessibility tree, so its text is not announced and contributes nothing to an accessible name.

Assumed: no basis is stated.

### `div-has-no-role-and-no-name`

Observation, about `screen-reader-announcement`, `landing-point`.

A <div> has no role and so no accessible name: focus landing on one leaves a screen reader to describe it by reading into it.

Assumed: no basis is stated.

### `error-state-styled-from-aria-invalid`

Decision, about `screen-reader-announcement`.

A contact-form field's error state is styled from aria-invalid rather than a class, so the visible state and the announced state cannot drift apart.

Unattributed: nobody is named.

### `facet-reset-hidden-until-selection`

Decision, about `not-applicable`.

A facet group's reset control is hidden until the group has a selection.

Unattributed: nobody is named.

### `facet-rows-packed-in-arithmetic`

Decision, about `forced-reflow`.

Facet chip rows are packed by revealing every chip once, reading every width in one pass and simulating the wrap in arithmetic, not by trying layouts.

Unattributed: nobody is named.

### `figma-drop-shadow-spread-draws-nothing`

Observation, about `focus-ring`.

Figma accepts a drop-shadow spread and reports it back but draws nothing, so Figma's focus rings are drawn as two rectangles rather than a shadow.

Assumed: no basis is stated.

### `figma-focus-ring-radii-raw-with-derivation-in-layer-name`

Decision, about `focus-ring`.

In Figma, focus-ring radii are raw values with their derivation written in the layer name, because Figma has no calc().

Unattributed: nobody is named.

### `filtered-arrival-focuses-the-grid`

Decision, about `programmatic-focus`, `landing-point`.

A fresh navigation to a filtered index URL moves focus to the card grid.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-09-30.

### `filtered-arrival-opens-both-facet-groups`

Decision, about `landing-point`.

Arriving on a filtered URL opens both facet groups, which then sit above the landing point the arrival scrolls to.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-08-31.

### `filtered-arrival-scrolls-to-the-cards`

Decision, about `landing-point`.

A fresh navigation to a filtered index URL scrolls the results to the top of the viewport; a reload, Back or Forward, a chip click and a reader who has already scrolled are left alone.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-09-30.

### `fixed-focus-pair-fails-on-accent-band`

Observation, about `focus-ring`.

A fixed focus-ring color pair fails on an accent band: base.css's default offset-then-ring order paints a blue-500 ring onto a blue-500 ground.

Assumed: no basis is stated.

### `focus-and-live-region-together-double-announce`

Observation, about `screen-reader-announcement`.

Moving focus to content and also announcing it from a live region announces it twice.

Assumed: no basis is stated.

### `focus-is-a-no-op-on-display-none-element`

Observation, about `programmatic-focus`, `forced-reflow`.

Calling focus() on an element that is display: none does nothing.

Assumed: no basis is stated.

### `focus-ring-is-global-not-per-control`

Decision, about `focus-ring`.

The focus ring is drawn by base.css's global :focus-visible rule on every focusable element; a control does not declare a ring of its own unless its context requires it.

Unattributed: nobody is named.

### `focus-ring-radii-derived-from-control`

Decision, about `focus-ring`.

Focus-ring radii derive from the control they wrap: the inner ring at radius + 2 and the outer at radius + 4.

Unattributed: nobody is named.

### `focus-ring-stated-as-relationship`

Decision, about `focus-ring`.

The focus ring is stated as a relationship: the inner ring contrasts with the control and the outer ring with the surface, so the same two colors serve both contexts with their order swapped.

Unattributed: nobody is named.

### `focus-scrolls-with-nearest-alignment`

Observation, about `programmatic-focus`.

Focusing an element scrolls it with its own "nearest" alignment, which ignores a block: 'start' just requested by scrollIntoView.

Assumed: no basis is stated.

### `focus-visible-heuristics-vary-for-programmatic-focus`

Observation, about `focus-ring`, `programmatic-focus`.

Whether programmatic focus matches :focus-visible varies by engine and by how the page was reached.

Assumed: no basis is stated.

### `focusable-pre-announces-its-contents`

Observation, about `scroll-region`, `screen-reader-announcement`.

A focusable <pre> announces its own contents.

Assumed: no basis is stated.

### `force-reflow-before-focusing-just-shown-element`

Decision, about `forced-reflow`, `programmatic-focus`.

Before focusing an element that a style change in the same task has just revealed, the script forces a reflow with void el.offsetWidth.

Unattributed: nobody is named.

### `fragment-navigation-moves-focus-only-to-a-focusable-target`

Observation, about `programmatic-focus`, `landing-point`.

Following a fragment link moves the scroll position, but moves keyboard focus only if the target can hold focus.

Assumed: no basis is stated.

### `grid-region-set-by-script`

Decision, about `landing-point`.

The card grid's role and tabindex are set by script on every enhanced load rather than in <CardMasonry>'s markup, because only script ever focuses it.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-09-30.

### `hidden-attribute-forced-with-important`

Decision, about `not-applicable`.

base.css declares [hidden] { display: none !important }, so no component rule can override the hidden attribute.

Unattributed: nobody is named.

### `hidden-attribute-removes-from-accessibility-tree`

Observation, about `not-applicable`.

An element with the hidden attribute is out of the accessibility tree.

Assumed: no basis is stated.

### `hidden-attribute-rule-is-at-base-css-line-97`

Repo fact, about `not-applicable`.

The [hidden] { display: none !important } rule is at base.css:97.

### `hidden-attribute-set-by-script-arrives-after-first-paint`

Observation, about `javascript-only-control`, `not-applicable`.

A hidden attribute changed by a script arrives after the first paint, so showing or hiding a control that way is a visible shift.

Assumed: no basis is stated.

### `hidden-element-reports-no-size`

Observation, about `not-applicable`.

An element with the hidden attribute is display: none: it has no layout box, so it reports no size and takes up no space.

Assumed: no basis is stated.

### `hidden-for-not-applicable-class-for-styled-away`

Decision, about `not-applicable`, `styled-away`.

The hidden attribute is used for an element that does not apply, and a class for one that applies but is styled away in this state.

Unattributed: nobody is named.

### `hidden-live-region-is-silent`

Observation, about `screen-reader-announcement`, `visually-hidden`.

A live region hidden with visibility: hidden or display: none is never announced.

Assumed: no basis is stated.

### `hidden-or-display-none-honeypot-is-skipped-by-bots`

Observation, about `hiding`.

A hidden or display: none honeypot input is trivially skipped by bots.

Assumed: no basis is stated.

### `hiding-the-focused-element-drops-focus-to-body`

Observation, about `focus-loss`.

When the focused element is hidden or removed, focus falls to <body>, so a keyboard user's next Tab starts again from the top of the page.

Assumed: no basis is stated.

### `honeypot-off-screen-aria-hidden-and-untabbable`

Decision, about `hidden-from-assistive-technology`.

The contact form's honeypot is positioned off screen rather than display: none, and carries aria-hidden, tabindex="-1" and autocomplete="off".

Unattributed: nobody is named.

### `hover-outline-avoids-focus-ring-collision`

Decision, about `focus-ring`.

The color-mode selector draws its hover state with outline rather than box-shadow, so the box-shadow focus ring cannot replace it.

Unattributed: nobody is named.

### `html-js-flag-is-global`

Decision, about `javascript-only-control`.

The html.js flag is set globally in BaseLayout, not per page, because it is about the document rather than a feature.

Unattributed: nobody is named.

### `html-js-set-at-baselayout-line-72`

Repo fact, about `javascript-only-control`.

The html.js class is set by BaseLayout's synchronous head script at BaseLayout.astro:72.

### `iframe-without-title-announced-unlabelled`

Observation, about `screen-reader-announcement`.

An iframe without a title is announced as an unlabelled frame.

Assumed: no basis is stated.

### `image-link-announces-only-its-alt`

Observation, about `screen-reader-announcement`.

An image link gives a screen reader nothing but the image's alt text to announce as its name.

Assumed: no basis is stated.

### `important-hidden-outranks-target-rule`

Observation, about `not-applicable`, `styled-away`.

With the hidden attribute on the contact form's confirmation block, base.css's !important outranked the :target rule meant to reveal it, so a no-JS visitor arriving on #contact-sent saw neither the form nor the confirmation.

Measured: Caught by reading computed display rather than trusting that author styles beat the UA sheet.

### `inline-anchor-focus-ring-splits-across-lines`

Observation, about `focus-ring`.

An inline anchor that wraps a line has its focus ring split into two fragments; inline-flex or inline-block gives it one box.

Assumed: no basis is stated.

### `interleaved-layout-reads-and-writes-force-a-reflow-each`

Observation, about `forced-reflow`.

Interleaving layout reads with style writes invalidates layout on each write and forces a reflow per element.

Assumed: no basis is stated.

### `javascript-only-control-must-not-appear-without-javascript`

Decision, about `javascript-only-control`.

A control that needs JavaScript does not appear without it, because a control that does nothing is worse than no control.

Unattributed: nobody is named.

### `later-sibling-fill-paints-over-box-shadow-ring`

Observation, about `focus-ring`.

A box-shadow paints outside its box but stays in flow order, so a later sibling's fill paints over the focus ring of the item before it unless the focused item is lifted.

Assumed: no basis is stated.

### `live-region-announces-wherever-it-sits`

Observation, about `screen-reader-announcement`.

A live region is announced wherever it sits on the page; position governs who sees it, not who hears it.

Assumed: no basis is stated.

### `live-region-cleared-after-speaking`

Decision, about `screen-reader-announcement`.

The result live region is cleared three seconds after it speaks, one timer reset on each call.

Unattributed: nobody is named.

### `live-region-heard-without-context`

Observation, about `screen-reader-announcement`.

A live region's message is heard with no surrounding context, so it has to be self-sufficient.

Assumed: no basis is stated.

### `live-region-silent-on-initial-render`

Decision, about `screen-reader-announcement`.

The result live region does not speak on the initial render, so a shared filter link's count is not read out over the page load; Back and Forward do announce.

Unattributed: nobody is named.

### `logo-is-decorative-aria-hidden`

Decision, about `hidden-from-assistive-technology`.

The logo SVG is decorative by default, with aria-hidden and focusable="false"; an accessible name belongs on the enclosing link.

Unattributed: nobody is named.

### `lucide-marks-its-svg-aria-hidden`

Observation, about `hidden-from-assistive-technology`.

Lucide adds aria-hidden="true" to its SVG unless it is given an a11y prop.

Assumed: no basis is stated.

### `main-cannot-hold-focus-by-default`

Observation, about `landing-point`.

A <main> element cannot hold focus by default.

Assumed: no basis is stated.

### `masthead-band-needs-no-focus-ring-override`

Observation, about `focus-ring`.

On the masthead's accent band, base.css's default offset-then-ring order gives a tight, legible ring in both themes with no override: the inner focus-offset ring reads against the fill and the outer ring blends into it.

Measured: Verified against both dark values, not assumed.

### `measuring-hidden-more-control-overpacks-by-a-row`

Observation, about `not-applicable`, `forced-reflow`.

Measuring the search facets' See all control while it is hidden counts it as zero width, so one chip too many is packed and the group overruns its row budget by one.

Measured: Measured at 375: four rows against a budget of three, and three against two.

### `missing-space-between-chip-spans-caused-label-in-name-failure`

Observation, about `screen-reader-announcement`.

The facet chips failed Label in Name because Astro's HTML compression dropped the whitespace between the label and count spans, so the visible text read "Structured Content11".

Measured: Five variants tested against axe showed it sets punctuation aside; the phase 8 accessibility gate found the missing space (2026-10-08). Overturns `chip-label-wording-caused-label-in-name-failure`.

### `native-title-does-not-appear-on-keyboard-focus`

Observation, about `screen-reader-announcement`.

A native title tooltip does not appear on keyboard focus.

Assumed: no basis is stated.

### `native-title-does-not-appear-on-touch`

Observation, about `screen-reader-announcement`.

A native title tooltip does not appear on touch.

Assumed: no basis is stated.

### `neither-drawn-nor-announced-uses-aria-hidden-and-display-none`

Decision, about `hidden-from-assistive-technology`, `visually-hidden`.

Content that should be neither drawn nor announced takes aria-hidden and display: none, not <VisuallyHidden>.

Unattributed: nobody is named.

### `never-visible-name-uses-aria-label`

Decision, about `visually-hidden`, `screen-reader-announcement`.

A name that is never visible at any width is given with aria-label rather than as real text hidden with a clip.

Unattributed: nobody is named.

### `never-visible-search-input-label-is-a-clipped-label`

Decision, about `visually-hidden`.

The masthead search input's label, never visible at any width, is a real associated <label> hidden with a clip, so it survives autofill and translation.

Unattributed: nobody is named.

### `no-focus-ring-on-landing-grid`

Decision, about `focus-ring`, `landing-point`.

The card grid draws no focus ring when focused: it is a landing point, not a control, and the next Tab lands on the first card, which draws its own.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-09-30.

### `per-chip-fitting-forces-a-layout-flush-per-step`

Observation, about `forced-reflow`.

Fitting chips by revealing one, measuring the row count and repeating forces a layout flush per step: dozens per group, up to 31, on every resize.

Assumed: no basis is stated.

### `plain-nth-child-counts-hidden-siblings`

Observation, about `not-applicable`.

Plain :nth-child counts every sibling, hidden ones included; :nth-child(… of :not([hidden])) counts only the visible ones.

Measured: Measured on Insights before of :not([hidden]) was added: a 1789px ragged bottom against 478 once the count is taken over the visible set alone.

### `populated-live-region-repeats-for-linear-readers`

Observation, about `screen-reader-announcement`.

A live region left populated with the visible line's text puts the same sentence twice in a row for anyone reading the page linearly.

Assumed: no basis is stated.

### `prevent-scroll-focus-does-not-cancel-smooth-scroll`

Observation, about `programmatic-focus`.

focus({preventScroll: true}) performs no scroll action, so it does not cancel a smooth scroll already under way.

Assumed: no basis is stated.

### `promote-count-line-to-status-after-first-render`

Decision, about `screen-reader-announcement`.

The visible result-count line would be promoted to role="status" after the first render, as the earlier plan described it.

Unattributed: nobody is named.

### `raf-does-not-fire-in-hidden-document`

Observation, about `forced-reflow`, `browser-pane`.

requestAnimationFrame does not fire in a hidden document or a background tab.

Assumed: no basis is stated.

### `reading-layout-property-flushes-style`

Observation, about `forced-reflow`.

Reading a layout property such as offsetWidth forces the browser to flush pending style recalculation and layout synchronously.

Assumed: no basis is stated.

### `real-page-load-starts-no-transition`

Observation, about `headless-chrome`.

A real page load starts no color transition, so a contrast failure caught mid-transition is a harness artifact.

Assumed: no basis is stated.

### `reset-focuses-first-facet-in-group`

Decision, about `programmatic-focus`, `focus-target`.

A facet group's reset control moves focus to the first visible chip in the group it cleared.

Unattributed: nobody is named.

### `result-count-wording-is-andys`

Decision, about `screen-reader-announcement`.

The result-count sentence, shown and announced, reads "Displaying 24 of 45 insights", "Displaying all 45 insights", "Displaying 14 matching insights" or "No matching insights".

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-08-31.

### `results-footer-sits-below-grid`

Decision, about `screen-reader-announcement`.

The result count, its live region and the reveal controls sit below the card grid, not above it.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-08-31.

### `results-label-is-a-p-not-a-heading`

Decision, about `screen-reader-announcement`.

The single-tag results label is a <p>, not a heading; it reaches assistive technology by joining the grid's accessible name while it is visible.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-09-30.

### `results-label-ships-hidden`

Decision, about `not-applicable`.

The single-tag results label ships hidden and empty, because without JavaScript there is no filter to name.

Unattributed: nobody is named.

### `reveal-controls-ship-hidden`

Decision, about `not-applicable`, `javascript-only-control`.

Show more and Show all ship hidden, because the static page already shows every card; the script reveals them when it truncates.

Unattributed: nobody is named.

### `reveal-focus-fallback-ladder`

Decision, about `focus-target`, `landing-point`.

When Show more or Show all disappears on being pressed, focus goes to the other control if it survived, otherwise to the result-count line.

Unattributed: nobody is named.

### `ring-around-capsule-is-a-capsule`

Observation, about `focus-ring`.

A focus ring around a capsule is itself a capsule, because border-radius clamps to half the shorter side.

Assumed: no basis is stated.

### `role-status-better-supported-than-aria-live-polite`

Observation, about `screen-reader-announcement`.

role="status" is better supported than a bare aria-live="polite".

Assumed: no basis is stated.

### `role-status-implies-polite-and-atomic`

Observation, about `screen-reader-announcement`.

role="status" carries implicit aria-live="polite" and aria-atomic.

Assumed: no basis is stated.

### `safari-does-not-make-scroll-regions-focusable`

Observation, about `scroll-region`.

Safari does not make scrollable regions focusable on its own, so without tabindex arrow-key scrolling is unavailable there.

Assumed: no basis is stated.

### `scripted-focus-on-tabindex-minus-one-can-draw-focus-visible-ring`

Observation, about `focus-ring`, `programmatic-focus`, `landing-point`.

An element with tabindex="-1" that is focused by script can match :focus-visible: base.css's ring drew around the programmatically focused card grid.

Measured: Seen in Chrome, Safari and Vivaldi after scripts/card-index.ts focused the card grid on a filtered arrival; real browsers disagreed with headless Chrome and the Browser pane (2026-09-30). Overturns `scripted-focus-on-tabindex-minus-one-draws-no-focus-visible-ring`.

### `scripted-focus-on-tabindex-minus-one-draws-no-focus-visible-ring`

Observation, about `focus-ring`, `programmatic-focus`, `landing-point`.

An element with tabindex="-1" that is focused by script does not match :focus-visible, so it draws no focus ring.

Measured: Headless Chrome and the Browser pane both reported :focus-visible false after scripts/card-index.ts programmatically focused the card grid, using `headless-chrome`, `browser-pane`.

### `search-hides-page-content-rather-than-removing`

Decision, about `not-applicable`.

Search results take over <main> by hiding the host page's children rather than removing them, so the host page's scripts keep their listeners and state.

Unattributed: nobody is named.

### `search-input-carries-radius-for-focus-ring`

Decision, about `focus-ring`.

The masthead search input carries radius-1, though it has no visible box, so its focus ring is rounded to match the field.

Unattributed: nobody is named.

### `search-item-hidden-as-whole-li`

Decision, about `javascript-only-control`.

Without JavaScript the masthead's whole search <li> goes, not just the button, so the stacked nav grid has no empty cell.

Unattributed: nobody is named.

### `search-label-does-not-use-visually-hidden-component`

Decision, about `visually-hidden`.

The masthead's search label carries its own copy of the clip declarations rather than using <VisuallyHidden>, because it is hidden only conditionally, from lg.

Unattributed: nobody is named.

### `search-label-visually-hidden-not-removed`

Decision, about `visually-hidden`.

The masthead search button's label stays real text at both widths and is visually hidden, not removed, in the icon-only state, so the button keeps an accessible name without aria-label.

Unattributed: nobody is named.

### `search-query-flag-hides-resting-search-body-before-paint`

Decision, about `styled-away`.

When a ?q= is present, BaseLayout's head script sets data-search-query before first paint so a rule hides /search/'s resting body, and the search script clears the flag when it restores.

Unattributed: nobody is named.

### `search-restores-only-what-it-hid`

Decision, about `not-applicable`.

Closing search un-hides only the elements the search script hid, not every child of <main>.

Unattributed: nobody is named.

### `search-reveal-focuses-first-chip`

Decision, about `programmatic-focus`, `focus-target`.

When a search facet group's See all or See fewer control is pressed, focus moves to the group's first chip.

Unattributed: nobody is named.

### `search-shortcut-hint-is-a-native-title`

Decision, about `screen-reader-announcement`, `javascript-only-control`.

The search toggle's shortcut hint is a native title set by script, which can be correct per platform because the control does not exist without JavaScript.

Unattributed: nobody is named.

### `search-submit-visually-hidden-in-tab-order`

Decision, about `visually-hidden`.

The masthead search form has a real submit button that is visually hidden but left in the Tab order.

Unattributed: nobody is named.

### `search-swap-gated-on-html-js`

Decision, about `javascript-only-control`.

The masthead's swap from the nav to the search field is CSS gated on html.js, so a visitor without JavaScript keeps the nav.

Unattributed: nobody is named.

### `search-toggle-gated-on-html-js`

Decision, about `javascript-only-control`.

The masthead's search item is removed by CSS keyed on html.js (html:not(.js) .search-item), not by a hidden attribute that a script removes.

Unattributed: nobody is named.

### `search-toggle-ships-hidden`

Decision, about `javascript-only-control`.

The search toggle ships hidden at all sizes and is revealed by the script.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-09-12.

### `search-view-h1-replaces-host-h1`

Decision, about `not-applicable`.

The search view's h1 replaces the host page's h1, which the controller hides, so exactly one h1 is in the accessibility tree.

Unattributed: nobody is named.

### `skip-link-does-not-use-visually-hidden-component`

Decision, about `visually-hidden`.

The skip link borrows <VisuallyHidden>'s declarations but not the component, because it is drawn the moment it is focused.

Unattributed: nobody is named.

### `skip-link-target-is-main-with-tabindex-minus-one`

Decision, about `landing-point`, `programmatic-focus`.

The skip link targets <main id="main">, which carries tabindex="-1" on every page so that following the link moves keyboard focus as well as the scroll position.

Unattributed: nobody is named. Dated 2026-09-17.

### `slide-deck-no-script-state-is-a-grid`

Decision, about `javascript-only-control`.

Without script the slide deck is a grid with every slide visible and no controls that cannot work.

Decided by <https://andyfitzgeraldconsulting.com/#person> on 2026-09-10.

### `stale-search-query-flag-blanked-search-page`

Observation, about `styled-away`.

Leaving data-search-query set blanked /search/ for a query under two characters: the page kept its h1 and lost everything below it.

Measured: Found on /search/?q= and /search/?q=a (2026-09-12).

### `submit-focuses-first-invalid-control`

Decision, about `programmatic-focus`, `focus-target`.

On a failed contact-form submit, focus moves to the first invalid control.

Unattributed: nobody is named.

### `svg-role-img-with-title-names-its-link`

Observation, about `screen-reader-announcement`.

An SVG with role="img" and a <title> gives the link around it an accessible name, with no aria-label and no visually hidden text.

Assumed: no basis is stated.

### `synchronous-head-script-runs-before-first-paint`

Observation, about `javascript-only-control`.

A synchronous inline script in <head> runs while <head> is still parsing, so a class or attribute it sets on the root element is in place before <body> exists, and a rule keyed on it holds from the first paint.

Assumed: no basis is stated.

### `tabindex-minus-one-focusable-not-tab-stop`

Observation, about `landing-point`.

tabindex="-1" makes an element focusable programmatically while keeping it out of the Tab order.

Assumed: no basis is stated.

### `tabindex-zero-makes-scroll-region-keyboard-reachable`

Observation, about `scroll-region`.

Giving a scroll region tabindex="0" makes it reachable by keyboard, so arrow keys can scroll it.

Assumed: no basis is stated.

### `template-content-is-inert`

Observation, about `inert-content`.

<template> content is inert: not rendered, not in the accessibility tree, and it makes no requests.

Assumed: no basis is stated.

### `theme-radio-hidden-with-opacity-not-clip`

Decision, about `visually-hidden`.

The color-mode selector's radio inputs are made invisible with opacity: 0 and position: absolute, not the full clip technique, because a 1px transparent form control has no text to spill.

Unattributed: nobody is named.

### `title-becomes-accessible-description`

Observation, about `screen-reader-announcement`.

A title attribute on a button that already has an accessible name becomes its description, read after the name rather than replacing it.

Assumed: no basis is stated.

### `titled-logo-in-home-link-announces-name-twice`

Observation, about `screen-reader-announcement`.

A title on the logo inside a home link that also carries the wordmark as text would make the link announce its name twice.

Assumed: no basis is stated.

### `truncation-hands-over-to-hidden-in-one-pass`

Decision, about `styled-away`, `not-applicable`.

card-index.ts sets data-hydrated in the same synchronous pass in which it starts managing hidden, so exactly one mechanism truncates the cards at any moment.

Unattributed: nobody is named.

### `ua-stylesheet-draws-focus-with-outline`

Observation, about `focus-ring`.

The user-agent stylesheet draws its focus indicator with outline.

Assumed: no basis is stated.

### `unreachable-scroll-region-fails-wcag-2-1-1`

Observation, about `scroll-region`.

A scroll region that a pointer can drag but a keyboard cannot reach fails WCAG 2.1.1.

Assumed: no basis is stated.

### `video-facade-focus-follows-iframe`

Decision, about `programmatic-focus`, `focus-target`.

When the video play button is replaced by the YouTube iframe, focus moves to the iframe.

Unattributed: nobody is named.

### `video-play-focus-ring-moved-to-badge`

Decision, about `focus-ring`.

The video play button's focus ring is moved onto its round badge rather than tracing the whole poster, using the same two rings and tokens.

Unattributed: nobody is named.

### `visibility-hidden-removes-from-accessibility-tree`

Observation, about `hiding`, `screen-reader-announcement`.

visibility: hidden takes an element out of the accessibility tree as surely as display: none does.

Assumed: no basis is stated.

### `visually-hidden-is-a-component-not-a-utility-class`

Decision, about `visually-hidden`.

The visually-hidden treatment is the <VisuallyHidden> component, not a utility class in base.css.

Unattributed: nobody is named.

### `visually-hidden-is-for-announced-but-not-drawn`

Decision, about `visually-hidden`.

<VisuallyHidden> is for content that should be announced but not drawn, and not for content that is drawn when it matters or announced nowhere.

Unattributed: nobody is named.

### `width-zero-does-not-remove-text-from-layout`

Observation, about `visually-hidden`.

width: 0 does not remove text from layout; the text spills out of the box instead.

Measured: On the masthead's search label at the nav's right edge, "Search" overflowed 54px past it and 6px past the viewport: scrollWidth 1206 against 1200.
