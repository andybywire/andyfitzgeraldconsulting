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

**The session, started 2026-10-17:**
[Annotate vertical-spacing comments](#local_8c860b82-f8a5-422b-bab0-266c10ca3525),
Opus 5.5 at high effort, in its own worktree cut from `pg-guide-trial`, with the prompt above
exactly. **One addition it also saw:** the app requires a second field of at least 80 characters
for a fresh session, so this sentence went with the prompt, chosen to say nothing about a trial
or tasks: *"The guide named in the prompt, project-graph/annotation-guide.md, is self-contained: it
and the files it points to are all the instruction there is for this work."*

**Found while checking, and it matters for stage 5:** in a worktree with no `node_modules`, the
first `pnpm graph …` silently ran a full `pnpm install` (1,515 packages from the local store,
about 6 seconds and some 30 lines of output) before the command. The trial keeps it, since the
guide says `pnpm graph check` and the trial tests the guide as written. Its cost goes under C. In
the experiment's runs it would be a confound, landing in arm C's time and context and in no other
arm's. The protocol now carries that as a precondition.

## Criteria

### A. Mechanical: checked by command, pass or fail

- **A1. Only tag lines added.** `git diff 4f0eb92 -- . ':!project-graph'` deletes no lines, and
  every line it adds is a tag line by the extractor's rule, or the blank comment line the guide's
  own example puts before the tags. *(That allowance was added after the trial; see "A criterion
  changed after the trial" below.)* *(The baseline was `086dd0f` until the
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
  Andy's call after the trial, not before. *(Restated for the rerun, once the guide gained a rule
  for replaced decisions; see "A criterion changed after the trial" below.)*
- **B5. Attribution only where stated.** "(Andy, on screen)" with 2026-09-02, and
  "(Andy, 2026-09-22, on screen)" for the attributed-quote rule, are attributed and dated.
  PageHeader's "Settled on the article page" names nobody, so it is unattributed. **Fails** on
  any invented person or date.
- **B6. The two homonyms.** DESIGN.md's leading ramp (line height, indexed by measure) is not
  tagged with a rhythm concept. Grid column gaps ("Grid owns horizontal, rhythm owns vertical") are
  not tagged as a container gap, except where a comment is about the vertical case.
- **B7. The report.** The final message lists the annotator's doubts. B4 is expected among them,
  and none of them is written into a file. *(For the rerun, B4 is no longer expected among them;
  see "A criterion changed after the trial" below.)*

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

## Results, reviewed 2026-10-18

The session ran on 2026-10-17, started from the desktop app before the headless harness existed:
[Annotate vertical-spacing comments](#local_8c860b82-f8a5-422b-bab0-266c10ca3525), on branch
`claude/annotate-7777a5`. Its output is copied to [guide-trial/](guide-trial/): the tag diff, its
`claims.ttl`, the check output, its last words, the usage figures, and the note it left in the
app's folder. D was settled on 2026-10-17; A to C are reviewed here.

| Criterion | Verdict | What it showed |
| --- | --- | --- |
| **A1** tag lines only | **Pass**, with a wording fix | 0 lines deleted. 94 tag lines and 16 blank comment lines added, nothing else. The blank lines are the ` *` separator in the guide's own example, so the criterion was too strict for the guide it tests. |
| **A2** nothing else written | **Fail**, app cause | Inside the repository, only `claims.ttl`, and `concepts.ttl` is unchanged. But it wrote a note to the app's side-session folder, which the app tells side sessions to do. |
| **A3** the check | **Pass** | Conforms: 79 claims, 47 tagged comments, no violations. |
| **B1** restatement merged | **Pass** | `portable-text-emits-flat-sequence` is cited from 5 of the 6 places. GetInTouchBand cites `sibling-margin-ramp-is-only-for-flat-sequences` instead, which relies on it. |
| **B2** kind and backing | **Pass** | The split reading, an assumed observation plus an unattributed decision, applied consistently. |
| **B3** agreement merged, disagreement apart | **Pass** | "Equal specificity, so source order decides, `heading-close` last" is one claim across all three files. layout.md's stale "all six" is `all-rhythm-selectors-share-one-specificity`, cited only there and linked to nothing. It also kept "six selectors" apart from base.css's "four overrides". No word in `claims.ttl` marks anything wrong. |
| **B4** the reversal | **Fail**, on "silently" | The encoding is acceptable reading (a): `rhythm-block-pair-removed` is a decision by Andy, 2026-09-02, with nothing invalidated, and the old 48px pair survives only as separate statements of what the code did. But the gap was raised nowhere, because there was no report (B7). |
| **B5** attribution as stated | **Pass** | 6 decisions are attributed to Andy, and each traces to a cited comment that names him and gives the date. 25 are unattributed, including PageHeader's "Settled on the article page". |
| **B6** the homonyms | **Pass** | Nothing near DESIGN.md's leading ramp is tagged. Container-gap tags sit only on comments about vertical gaps; the one in "grid owns horizontal" comes from its sentence about a wrapped column's row gap. |
| **B7** the report | **Fail**, app cause | No doubts appear in its final message or its wrap-up, only counts and a pointer to the note. The app told it to "leave hand-over notes or large findings there instead of pasting them into messages", the opposite of the guide's step 7. |

### C. Cost and conduct, recorded

**7.9 minutes and 46 tool calls:** 17 edits, 15 shell commands, 9 file reads, 2 file writes, and 3
calls to the app's own tools. **Tokens:** 51.6k output, 4.79M cache reads and 183k cache writes,
with 56 uncached input tokens. It ran the check once, through `pnpm graph check`, and never ran a
query: it found claims to reuse by reading its own `claims.ttl`. Its first command listed the
notes folder, as the app told it to, which was empty then. It read the tooling (`extract.mjs`,
`shapes.ttl`) to learn the tag syntax, and used a scratch script to help insert tags.

**The grain is fine:** 79 claims from 47 comments, and base.css's rhythm header alone cites 17. That
is the guide's splitting rule applied literally ("one claim is one statement that can be true or
false on its own"). It's not a criterion, but it bears on what annotating the pilot will cost and on
how long query answers get. It is raised for Andy below.

### What it changes

- **Every failure traces to the desktop app, not the guide:** A2 and B7 to the notes folder and the
  app's instruction to use it, D to auto-memory, and B4's "silently" to B7. The headless harness
  removes all three causes. That claim is only true once a run shows it, so **the trial is rerun
  through the harness after the canary passes**, with these criteria. The rerun doubles as the
  harness's first real test.
- **The guide's "one claim, one id" section works on this material.** B1, B3 and B5 all passed,
  and they are the judgments the real annotation turns on most.
- **One guide change before the rerun:** `pnpm graph check` becomes `node project-graph/graph.mjs
  check`, which the harness decided on for every run. It is wording only.
- **B4 goes to Andy as the model decision it was set up to inform:** keep reading (a), two
  unlinked decisions, or give the model a way to say that one decision replaced another (such as
  `prov:wasRevisionOf`), so that a comment relying on a replaced decision can be found the way one
  citing an overturned observation is. **Decided 2026-10-18:** neither of those. A replacing
  decision's activity `prov:invalidated` the old one, with no new term. See claim-model.md, which
  lists what must be built before the rerun. B4's criterion for the rerun was restated to match
  (Andy, 2026-10-18); see "A criterion changed after the trial" below.
- **Also for Andy: the grain.** Keep the literal splitting rule, or have the guide tell annotators
  to record only claims a comment makes a point of, not every clause. **Decided 2026-10-18: the
  literal rule stays,** and the guide is unchanged. id-design.md records why.

### A criterion changed after the trial

**A1** originally required every added line to be a tag line. The guide's own worked example puts
a blank comment line (` *`) before the tags, and the annotator followed it 16 times. The criterion
now allows that line. The change is wording to match the guide, not a relaxation: every other kind
of added line still fails.

**B4 and B7, restated for the rerun** (Andy, 2026-10-18). The first trial was judged against
them as written above. The reason for the change: the guide now covers one decision replacing
another (claim-model.md), so B4 no longer tests a gap in the guide. It tests whether the new rule
is applied where the comments support it, and only there.

**What the material says.** base.css: two rules gave lists, quotes, figures and code 48px above
and below; "Removed 2026-09-02: too much vertical space in running text … (Andy, on screen)"; and
`--rhythm-block`'s use there "was an inference": DESIGN.md names the token and never says these
elements consume it. DESIGN.md agrees. The removal is plainly a decision. **The old pair is
described as code that existed, not as a decision anyone made,** and the guide's rule applies only
when a comment says one decision replaced another in so many words. The material sits on that
boundary, so the criterion accepts either honest reading.

- **B4, for the rerun.** The removal is a decision attributed to Andy and dated 2026-09-02 in every
  reading. **Either passes:**
  - **(a)** the old pair recorded only as statements of what the code did, or not at all, with
    nothing invalidated, since the comments call it an inference rather than a decision; or
  - **(b)** the old pair recorded as an unattributed decision, worded as the comments describe it,
    that the removal's activity `prov:invalidated`, as the guide shows.

  **Fails:**
  - recording the on-screen look as a measurement. That was acceptable reading (b) of the original
    criterion, but the guide now gives a decision its own path, so it is a misclassification;
  - invalidating anything no comment says was replaced, including layout.md's stale "all six",
    which B3 also guards against;
  - editing a comment, or inventing a property.
- **B7, for the rerun.** The final message lists the annotator's doubts, and none is written into a
  file. B4 is no longer expected among them, because the guide now covers the case and requiring a
  mention would penalize a correct annotation. A mention is still welcome.

**What the rerun cannot show.** No comment in this material still relies on the old pair, so the
rerun can show that the new rule doesn't misfire: no false links, and B3's disagreement still kept
apart. It cannot show the rule catching anything. That would take material where a comment still
cites a replaced decision. The pilot was deliberately not searched for one, so whether the real
annotation exercises the rule is unknown.


## The rerun, through the harness, reviewed 2026-10-18

**Run on 2026-10-18** (local time; its folder is named in UTC) by
`docs/project-graph/harness/trial-rerun.mjs`. The record, with everything below, is
[runs/trial-rerun-2026-10-19T00-03-48-449Z/](runs/trial-rerun-2026-10-19T00-03-48-449Z/), and the
transcript is kept out of git.

**Set up as the first trial, with the app's three causes removed:**
- `pg-guide-trial` at `6e707c5`, which has the guide's rule for replaced decisions and the
  `node project-graph/graph.mjs` wording;
- Opus 5.5 at high effort, on the standalone CLI at 2.1.302;
- the prompt read word for word from "Setup" above, without the sentence the app required;
- auto-memory off;
- tools listed, with `dontAsk` refusing the rest. The protocol said `acceptEdits`, which leaves
  other tools on an ask path that a headless run can't answer;
- a $25 cap;
- Andy's user-level `~/.claude/CLAUDE.md` still loaded, as it was in the app, so it adds no
  difference.

Before launch, the leak search over the branch's `project-graph/` found only the three known low
mentions.

**Judged against the criteria as restated for the rerun** (B4 and B7; see "A criterion changed
after the trial"):

| Criterion | First trial | Rerun | What the rerun showed |
| --- | --- | --- | --- |
| **A1** tag lines only | Pass | **Pass** | 0 lines deleted. 94 tag lines, 15 ` *` separators and 1 empty line, which is the same separator inside an Astro comment, where there is no marker. |
| **A2** nothing else written | Fail, app cause | **Pass, with a note** | Only `claims.ttl` is new, `concepts.ttl` is unchanged, and there is no notes file. But `pnpm exec prettier --check`, run on its own initiative, installed `node_modules`. That is finding 1 below. |
| **A3** the check | Pass | **Pass** | One violation: DESIGN.md cites `figure-gets-block-gap-so-thumbnail-aligns-for-free`, which base.css says a measurement overturned ("measured, not inferred"). The guide says to leave it. The statement really was stale (finding 2). |
| **B1** restatement merged | Pass, 5 of 6 | **Pass, 6 of 6** | `portable-text-emits-flat-sequence` is cited from all six places. |
| **B2** kind and backing | Pass | **Pass** | An assumed observation, the same everywhere. The one measurement is base.css's own, so none is invented. |
| **B3** disagreement apart | Pass | **Pass** | layout.md's "all six" is its own repo fact, cited only there and invalidated by nothing. "Six selectors" is kept apart from "four overrides". |
| **B4** the reversal | Fail, on "silently" | **Pass, reading (b)** | The old pair is an unattributed decision, worded as the comments describe it, which Andy's 2026-09-02 decision invalidated. |
| **B5** attribution as stated | Pass | **Pass** | 6 decisions are attributed to Andy, each traced to a comment that names him and gives the date. 33 are unattributed. One stretch, flagged by the annotator itself: "quote blocks are spaced by an element rule *in base.css*", from "Promoted on its third consumer (Andy, 2026-09-22)". It holds, because the claim is about the rule living in base.css. |
| **B6** the homonyms | Pass | **Pass** | Nothing near the leading ramp is tagged. The `container-gap` tag on "Grid owns horizontal" comes from its row-gap sentence, as before. |
| **B7** the report | Fail, app cause | **Pass** | A full list of doubts in the final message, and none in a file. |
| **D** auto-memory | Fail, app cause | **Pass** | The harness's isolation check, and the memory folder was byte-identical. |

**Every failure of the first trial is gone, and nothing new failed.** That confirms the first
trial's failures were the app's, not the guide's.

**The rule for replaced decisions** was used four times, each stated in so many words:
- the 48px pair;
- `li + li` ("lived here until 2026-09-02. Removed…");
- `article.detail` → `.detail` ("WAS … UNTIL 2026-08-26. It became…"), left unattributed because
  nobody is named;
- the lead's `p + p` ("REMOVED DELIBERATELY (Andy, 2026-08-28)").

It did not misfire on B3's material. As predicted, no comment still relies on a replaced decision,
so it caught nothing.

### C. Cost and conduct, recorded

| | First trial | Rerun |
| --- | --- | --- |
| Wall time | 7.9 minutes | 9.6 minutes |
| Tool calls | 46 | 77: 46 edits, 15 reads, 12 shell commands, 3 searches, 1 write |
| Output tokens | 51.6k | 65.8k, 32.8k of them thinking |
| Cache reads / writes | 4.79M / 183k | 3.79M / 174k |
| List-price cost | $3.46 | $3.47 |
| Claims from 47 comments | 79 | 92: 39 decisions, 33 observations, 20 repo facts |

It ran the check several times and a query. It read `extract.mjs` to learn the tag syntax.
Two shell commands were refused: a three-stage pipe, and a chain ending in `git diff --stat`.

### Findings beyond the criteria

1. **An allowed list does not confine a run's shell.** Claude Code let `cat`, `ls`, `wc`, `sed -n`,
   `git status` and `pnpm exec prettier --check` through as read-only. **Fixed:** every launch now
   denies `git`, `pnpm`, `npm` and `npx`, proven by a probe. A run reaching the main checkout is now
   detected. See protocol.md, the fifth and sixth gaps.
2. **The annotation found a stale statement in the live repo.** DESIGN.md said switching to
   `figure` "fixed the top alignment for free", which stopped being true on 2026-09-02. Figure.astro
   had been corrected and base.css records the measurement, but DESIGN.md never got the correction.
   That is the experiment's "a correction didn't spread", found on trial material. **Corrected** on
   the branch `design-md-figure-alignment` (`1f27216`), off `main`, and not yet merged.
3. **The guide's unclear points, from the report.** What one "comment" is in Markdown: a paragraph,
   a list or a bullet. A decision versus a repo fact, for "the base rule uses `rhythm-paragraph`".
   How far an attribution reaches. Whether reading a Figma board is a measurement. Any fix beyond
   wording would mean another rerun, so these are Andy's call before the real annotation.
4. **The trial vocabulary lacked concepts:** specificity, floats, the `space-N` scale and band
   padding. It is a throwaway vocabulary, so there is nothing to fix.
