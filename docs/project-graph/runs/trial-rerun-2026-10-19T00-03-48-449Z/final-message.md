I've tagged 47 comments across the six files and recorded 92 claims in a new file, `project-graph/claims.ttl`. Nothing is committed. No existing text changed; the only additions are tag lines and that new file. Prettier passes on all six files. Running it through `pnpm exec` also installed `node_modules` in this worktree, which wasn't there before.

`node project-graph/graph.mjs check` reports one violation, and per the guide I left it in place. `DESIGN.md:1417` (the paragraph saying "switching from a bare `image` block to `figure` fixed the top alignment for free") cites `figure-gets-block-gap-so-thumbnail-aligns-for-free`. base.css's thumbnail comment says it measured that this stopped being true once the `rhythm-block` pair was removed, so it is recorded as overturned. The check reports nothing about form.

**Comments I wasn't sure were in scope**
- **Included:** base.css's `hidden` note. It says an author `display` rule "beats it on source order", which is a statement about source order, but the comment is mainly about the `hidden` attribute.
- **Included:** base.css's quotation-caption note, the PageHeader note on the lead's single paragraph, and layout.md's sections on band padding and token naming. They are about vertical space, but not always the ramp itself.
- **Left out, as only passing mentions:**
  - the "rhythm mechanism" mentions in base.css's header, PageHeader's header, and CLAUDE.md lines 193, 251 and 385;
  - the floated-thumbnail section header in base.css;
  - DESIGN.md's front-matter YAML comments;
  - DESIGN.md:1127, the arrival label's `rhythm-heading-close` (16) above the cards. This is the closest call.
- **Left out, because "source order" there means DOM order, not the cascade:** DESIGN.md 663 and 773, and layout.md's footer paragraph.

**Claims I nearly merged or split**
- **Merged:** three wordings of "adjacent paragraphs the `.detail` ramp doesn't reach butt together" (the quote "slab", PageHeader, GetInTouch) into `unramped-adjacent-paragraphs-have-no-space-between`.
- **Kept separate:**
  - The ramp "reaches only `.detail`'s direct children" (base.css) versus "never reaches outside `.detail`" (PageHeader, GetInTouch). The first is a stronger statement than the second.
  - The comments disagree about the spacing two adjacent blocks take. Most say `rhythm-paragraph`; GetInTouch says `rhythm-block`. Each is its own claim.
  - base.css's Prose comment says the ramp "still puts `--rhythm-block` (48) above and below a list". I recorded that as its own repo fact, not linked to the removed-pair decision.
  - "Every override shares (0,1,1)" plus "four overrides" (base.css, DESIGN.md) versus layout.md's "all six have equal specificity" and "six-selector rule". Separate claims. I didn't tag base.css's passing "five overrides" (line 744) as a claim.
- **Recorded as one decision replacing another, from the comments' own wording:**
  - `li + li` margin → lists separated by leading alone (Andy, 2026-09-02)
  - the `rhythm-block` pair → `rhythm-paragraph` (Andy, 2026-09-02)
  - `article.detail` → `.detail` (2026-08-26, no one named)
  - the lead's `p + p` → no spacing (Andy, 2026-08-28)
- **The overturned figure belief:** base.css doesn't literally say "turned out not to be true". It quotes the earlier "fixed the top alignment for free" and then reports a measurement showing otherwise. I judged that explicit enough.

**Concepts that weren't in `concepts.ttl`**
- **Specificity**, which many claims rely on (`:where()`, the bare `:not()`, (0,1,1)). I tagged those `sibling-margin`, or `source-order` where order was the point.
- **Floats**, tagged `sibling-margin` or `vertical-rhythm`.
- **The spacing scale's `space-N` primitives and spacing tokens in general**, tagged `vertical-rhythm` or `rhythm-token`.
- **Band padding**, tagged `rhythm-token` and `vertical-rhythm`.

**Unclear in the guide**
- What a "comment" is in Markdown: a paragraph, a list, a bullet. I tagged after whole lists, and indented the tag under single bullets in CLAUDE.md and DESIGN.md.
- How to tell a decision from a repo fact for statements like "the base rule uses `rhythm-paragraph`". I chose decision.
- Whether an Andy attribution on one aspect of a rule (promoting it to base.css) can carry the whole spacing decision. I let it.
- Whether a Figma board read counts as a measurement. I treated it as one.
