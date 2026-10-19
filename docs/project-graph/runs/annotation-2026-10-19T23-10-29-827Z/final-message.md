I've annotated the repository. There are 168 tagged comments across 63 files, and `project-graph/claims.ttl` records about 175 claims. Nothing is committed.

**Check result:** `node project-graph/graph.mjs check` reports one violation, and it is the kind the guide says to leave. `ContactForm.astro:549` relies on "a script-focused `tabindex="-1"` element draws no focus ring." `CardMasonry.astro` records that headless Chrome and the Browser pane reported exactly that, and that real Chrome, Safari and Vivaldi then showed the opposite. So the claim is marked overturned and the ContactForm comment is flagged.

**Superseded claims recorded:**
- The chip Label in Name failure was first blamed on the comma; the real cause was the missing space between spans (`FacetFilters`, `CLAUDE.md`, the eleventy comparison).
- The close-search button's old name, "Close search", was replaced by "Close search, esc".
- The "promote the count line to `role=status`" plan was replaced by a separate region that ships empty.

**One departure from "only add tag lines":** 24 comments closed on their last text line (`… text. */`). For those I moved the `*/` onto the new final tag line, because there was nowhere else to put tags inside the comment. The wording of every comment is unchanged.

**Comments I wasn't sure were in scope:**
- **Left out:**
  - The `card-index.ts` note that facet chips "ship disabled" without JavaScript. It handles a JS-dependent control but contradicts the "must not appear" scope note.
  - Comments that mention focus only in passing (Masthead's `width: 100%` note, the card hover rules).
  - Uses of "inert" that mean "has no effect".
- **Tagged, though the fit is loose:**
  - `card-index.ts:688`, which uses "landing point" for the scroll target. I tagged it because the concept file names that line.
  - The `data-search-query` flag, tagged as styled-away.
  - Feed alt-text and iframe-title notes, tagged as screen reader announcement.
  - Open "focus ring at radius-1" items, which got a concept tag only.

**Near-merges and near-splits:**
- **Merged:**
  - "Up to 31 layout flushes" (card-index) and "dozens" (search.ts), as one claim.
  - "A minority" and "roughly a third" of WCAG failures, as one claim.
- **Kept apart, unlinked, because they disagree:**
  - `search-toggle-ships-hidden` (Andy, 2026-09-12) and `search-toggle-gated-on-html-js` (Masthead).
  - ThemeToggle's "a never-visible name uses `aria-label`" and Masthead's never-visible search label, which uses a clipped `<label>` instead.
  - The general `fixed-focus-pair-fails-on-accent-band` and Masthead's measured "the band needs no override".
- **Split:** "Chrome and Firefox make scroll regions focusable" from "Safari does not", and the title tooltip on keyboard focus from on touch.
- **Attribution:** `card-truncation-keyed-on-html-js` is attributed to Andy because one kickoff says "Andy approved", though other comments name nobody.

**Concepts the vocabulary lacks:**
- Tab order and the focusability of disabled controls (`aria-disabled` vs `disabled`). Left untagged.
- Automated accessibility checks such as axe and Lighthouse. Tagged with automated browser or headless Chrome.
- Heading and landmark navigation. Left untagged.
- Claims about fonts, scroll anchoring and implicit form submission, inside comments that are otherwise in scope. Not recorded, since no concept fits.

**Unclear in the guide:**
- There is no rule for a comment whose only closing delimiter sits on its last text line.
- Nothing says whether unattributed decisions may carry a date. I gave the skip-link decision 2026-09-17 because `CLAUDE.md` states it.
- Nothing says whether to record every claim a long in-scope comment makes, or only those about the vocabulary. I did the latter.
- It doesn't say whether YAML `#` comments in `DESIGN.md`'s front matter count as comments. I skipped them.

Diff review was blocked here, so I checked coverage by walking the claim list against the tags. `git diff` is the quickest way to confirm the edits are tag lines plus those 24 moved closers.
