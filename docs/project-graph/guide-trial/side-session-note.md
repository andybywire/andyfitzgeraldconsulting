# annotate-7777a5: claims minted (worktree .claude/worktrees/annotate-7777a5, uncommitted)

Files annotated: web/src/styles/base.css, DESIGN.md, docs/decisions/layout.md, CLAUDE.md,
web/src/components/PageHeader.astro, web/src/components/bands/GetInTouchBand.astro.
47 tagged comments, 79 claims, `pnpm graph check` conforms.

This worktree CREATED project-graph/claims.ttl. If another session also created one, the two
will conflict on merge: union the claim blocks, and where two sessions minted different slugs
for the same statement, that is a merge decision for whoever combines them.

Slugs most likely to recur elsewhere (reuse rather than re-mint):

- rhythm-uses-sibling-margins-not-gap (Decision, unattributed)
- portable-text-emits-flat-sequence (Observation, assumed)
- prose-component-emits-no-container (RepoFact)
- gap-cannot-express-tighter-after-a-heading (Observation, assumed)
- sibling-margin-ramp-is-only-for-flat-sequences (Decision, unattributed): components with real
  wrappers space their own children (PageHeader, GetInTouchBand; reviews.astro said to draw the
  same division)
- prose-paragraphs-outside-detail-butt-together (Observation, assumed): the `:global(p + p)` rules
  in RssBand and similar likely cite this
- rhythm-paragraph-is-the-default-between-adjacent-blocks (Decision, unattributed)
- rhythm-block-is-what-adjacent-blocks-take (Decision, unattributed): GetInTouchBand's wording;
  kept separate because it disagrees with the one above
- heading-close-spaces-a-heading-from-its-copy (Decision, unattributed)
- equal-specificity-later-rule-wins (Observation, assumed)
- rhythm-block-pair-removed (Decision, Andy, 2026-09-02)
- li-li-margin-removed (Decision, Andy, 2026-09-02): the eight `li + li { margin-top: 0 }`
  components it names may carry comments citing it
- quote-blocks-take-rhythm-paragraph (Decision, Andy, 2026-09-22): Quotation.astro, reviews,
  case-study testimonial
- rhythm-block-after-attributed-quote / attribution-sits-rhythm-paragraph-below-its-quote
  (Decisions, Andy, 2026-09-22)
- float-sits-where-it-would-have-sat-in-flow (Observation, assumed): Figure.astro's header
- wrapped-column-row-gap-uses-rhythm-heading-major (Decision, unattributed): Grid.astro
- display-contents-leaves-no-box-for-gap (Observation, assumed): reviews.astro

Full list and sentences: project-graph/claims.ttl in that worktree.
