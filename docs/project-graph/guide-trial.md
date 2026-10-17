# Trying the annotation guide: criteria written before the trial runs

**Written 2026-10-17, before any trial session exists**, so the review is held to what a correct
annotation had to do rather than to whatever the annotator happened to do. Changing a criterion
after the trial means saying so here, with the reason.

## What the trial is for

To find where [project-graph/annotation-guide.md](../../project-graph/annotation-guide.md) is
unclear, or produces annotations that break its rules, **before** the real, blind annotation of
the focus-and-visibility area depends on it. It tests the guide, not the annotator. A failure
below is a fault in the guide, or in the model, until shown otherwise.

It also tests **stage 5's first precondition** ([protocol.md](protocol.md)): whether a fresh
worktree session loads this checkout's auto-memory, which now describes this experiment.

## Why vertical rhythm

It has the three features the real annotation has to handle, and none of the material the real
annotation is scored on:

- **One claim restated across six places:** that Portable Text emits a flat sequence with no
  section wrappers, which is why body text is spaced with sibling margins rather than `gap`.
- **A stated reversal:** the 48px rules around lists, quotes, figures and code, "removed
  2026-09-02 … (Andy, on screen)".
- **Decisions,** some attributed and some not, and **two words used in two senses:** "ramp" (the
  rhythm ramp and DESIGN.md's leading ramp) and "gap" (vertical spacing and the gap between grid
  columns).

It's outside the pilot area, and it isn't T5's area (search). Nothing learned here is about the
focus-and-visibility material, so tuning the guide on it can't tune it toward those answers.

## Setup

- **A throwaway branch, `pg-guide-trial`, at `086dd0f`,** the commit every arm starts from.
- **`project-graph/` copied from the `project-graph` branch** at the commit this file lands in,
  with `concepts.ttl` replaced by [guide-trial-concepts.ttl](guide-trial-concepts.ttl), a
  six-concept vocabulary for vertical spacing. Nothing from `docs/project-graph/` is copied.
- **Before the session starts:** the protocol's leak search over `project-graph/` on that branch
  comes back with nothing above "low", and `pnpm graph check` conforms.
- **One fresh session,** in its own worktree from that branch, on **Opus 5.5 (`claude-opus-5-5`)
  at high effort**, the model and effort the real annotation will use (Andy, 2026-10-17). Its whole
  prompt:

  > Annotate the comments in these files by following `project-graph/annotation-guide.md`:
  > `web/src/styles/base.css`, `DESIGN.md`, `docs/decisions/layout.md`, `CLAUDE.md`,
  > `web/src/components/PageHeader.astro` and `web/src/components/bands/GetInTouchBand.astro`.
  > Work only in those files, and only on comments about the concepts in
  > `project-graph/concepts.ttl`.

- **Afterward:** the diff, `claims.ttl`, the check output, the final message and the session's
  usage are copied into `docs/project-graph/guide-trial/`. They hold vertical-rhythm material
  only, so they are safe to keep as the record. Then the branch and worktree are deleted.

## As set up, 2026-10-17

`pg-guide-trial` was created at `086dd0f` and its setup committed as **`4f0eb92`**, with
`project-graph/` taken from `project-graph` at `8624354` by `git archive`, so nothing untracked
came with it. The commit message names no trial, because the annotator can read `git log`.

**Three departures from the setup above, each decided while setting it up:**

- **`package.json` gains one line,** the `graph` script, because `086dd0f` predates it and the
  guide tells the annotator to run `pnpm graph check`. That is why A1's baseline is now the setup
  commit rather than `086dd0f`.
- **`project-graph/tests/` is left out.** Its planted cases use the pilot's concepts, so against
  this vocabulary `pnpm graph test` would fail. An annotator who ran it might start "fixing"
  files. The extractor's unit tests don't depend on the vocabulary, and they stay.
- **None of `docs/project-graph/` is present,** as intended. The branch has never contained it.

**Checked before any session:** the protocol's leak search over `project-graph/` finds only the
three known low mentions (that an experiment, a protocol and an arm exist), and its "annotat"
matches outside the folder are about Figma annotations and annotated git tags. `pnpm graph check`
conforms, with 0 tagged comments in 144 files, and the extractor's 18 tests pass.

**Found while checking, and it matters for stage 5:** in a worktree with no `node_modules`, the
first `pnpm graph …` silently ran a full `pnpm install` (1,515 packages from the local store,
about 6 seconds and some 30 lines of output) before the command. The trial keeps it, since the
guide says `pnpm graph check` and the trial tests the guide as written. Its cost goes under C. In
the experiment's runs it would be a confound, landing in arm C's time and context and in no other
arm's. The protocol now carries that as a precondition.

## Criteria

### A. Mechanical: checked by command, pass or fail

- **A1. Only tag lines added.** `git diff 4f0eb92 -- . ':!project-graph'` deletes no lines, and
  every line it adds is a tag line by the extractor's rule. *(The baseline was `086dd0f` until the
  branch was set up. It is the setup commit now, because setup added one line to `package.json`;
  see "As set up".)*
- **A2. Nothing else written.** No new file outside `project-graph/` and, inside it, only
  `claims.ttl`. No notes file anywhere. `concepts.ttl` is unchanged.
- **A3. The check.** `pnpm graph check` conforms, or every violation it reports is a comment
  citing an overturned claim, which the guide says to leave.

### B. Checkpoints: judged by reading, against these expectations

- **B1. The restatement is one claim.** The flat-sequence claim is cited with the same slug from
  at least five of its six places: base.css's vertical rhythm header, DESIGN.md's "CSS mechanism"
  section, `docs/decisions/layout.md`'s "Why the rhythm mechanism is sibling margins",
  CLAUDE.md's Known debt bullet, PageHeader.astro's spacing note and GetInTouchBand.astro's style
  note. **Fails** if each file mints its own slug.
- **B2. Its kind and backing.** Either one observation (what Portable Text emits) with
  `model:assumed`, since none of the six says how it was established, or that observation plus a
  decision that rhythm is therefore sibling margins. Either passes **if it's the same choice
  everywhere**. Inventing a measurement fails.
- **B3. Agreement merged, disagreement kept apart.** "The overrides have equal specificity, so
  source order decides, with `heading-close` last" is one claim across base.css, DESIGN.md and
  layout.md. But layout.md ALSO says "All six have equal specificity", from before the 09-02
  removal, while base.css and DESIGN.md say the base rule sits one notch lower, below four
  overrides. That disagreement must stay **two claims, not merged and not linked**, and nothing
  may mark either one stale. **Fails** if layout.md's "all six" is merged into the shared claim, or
  if anything in the files records the disagreement. The final report may mention it, which is
  where it belongs. (Found while writing these criteria, by checking B3's
  sources against each other. The trial has a real contradiction to handle.)
- **B4. The reversal.** The guide says nothing about one decision replacing another; it only
  covers a measurement disproving a belief. **There is no single correct answer, and that's the
  point of including it.** Acceptable: (a) two decisions, the new one attributed to Andy and dated
  2026-09-02, nothing linking them, and the gap raised in the final report; or (b) Andy's on-screen
  look recorded as a measurement that `prov:invalidated` the old rule, with the stretch noted in
  the report. **Fails:** editing a comment, inventing a property, or making either choice silently.
  **What it decides:** whether the model needs a way to say one decision replaced another. That is
  Andy's call after the trial, not before.
- **B5. Attribution only where stated.** "(Andy, on screen)" with 2026-09-02, and
  "(Andy, 2026-09-22, on screen)" for the attributed-quote rule, are attributed and dated.
  PageHeader's "Settled on the article page" names nobody, so it is unattributed. **Fails** on
  any invented person or date.
- **B6. The two homonyms.** DESIGN.md's leading ramp (line height, indexed by measure) is not
  tagged with a rhythm concept. Grid column gaps ("Grid owns horizontal, rhythm owns vertical") are
  not tagged as a container gap, except where a comment is about the vertical case.
- **B7. The report.** The final message lists the annotator's doubts. B4 is expected among them,
  and none of them is written into a file.

### C. Recorded, not judged

Tokens, tool calls and wall time; whether the annotator ran `pnpm graph check` and
`pnpm graph query`; which parts of the guide it asked about or misread. This is the first
measurement of what annotation costs, which the protocol's maintenance figures will need.

### D. Auto-memory

From the session's transcript: **does any of this checkout's auto-memory appear in its context?**
**Passes** if none does. If it does, stage 5's first precondition fails, and the real annotation
cannot start until runs are arranged so that memory can't reach them.

## What a result changes

- **An A failure** is a fault in the guide or the tooling, and it's fixed before anything else.
- **B1 or B3 failing** means the guide's "one claim, one id" section isn't working. That's the
  section the real annotation turns on most.
- **B4** goes to Andy as a model decision, with the trial's own handling as evidence.
- **B5 or B6 failing** means the guidance on attribution or on homonyms needs a sharper rule.
- **A rerun is needed** if the guide changes by more than wording. A second trial uses a fresh
  session and the same criteria.
