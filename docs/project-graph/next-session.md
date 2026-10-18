# Picking up the Project Graph experiment in a fresh session

Written 2026-10-18, at the end of the session that built stages 0 to 4. **Start a new session with
this one line:**

> Read `docs/project-graph/next-session.md` and pick up the Project Graph experiment from there.
> Start with step 1, and stop for my review after each step.

## What this is

A test of Andy's hypothesis that treating this repo's comments as a **knowledge graph**, backed by
a SKOS vocabulary, SHACL shapes and a small PROV-O subset, makes context **cheaper to retrieve and
more trustworthy** than grep over prose. Three arms (A, the comments as they are; B, ids and grep;
C, the full graph) on the **focus-and-visibility** area, all starting from `086dd0f`. Andy
advocates the graph and has asked for pushback, so the design gives it room to lose: C has to beat
B, not just A.

**Read in this order:**

1. [README.md](README.md): the index, and a status line per stage.
2. [protocol.md](protocol.md): the hypotheses, tasks, rubrics and decision rules. Then **The
   headless harness** and **Preconditions for stage 5**, which are where the work is now.
3. [guide-trial.md](guide-trial.md): the annotation guide's trial, its criteria and its results.
4. [claim-model.md](claim-model.md) and [id-design.md](id-design.md), only when a step touches
   claims or ids.
5. The headers of `harness/harness.mjs` and `harness/canary.mjs`, before running either.

**`docs/project-graph/` is the answer key.** Nothing in it may reach an arm branch or the blind
annotator: the inventory lists every contradiction the tasks score.

## Where things stand

- **Branch `project-graph`,** local and unpushed, holds everything: `project-graph/` (the tooling)
  and `docs/project-graph/` (the record). The harness and this handoff were committed in `1afeb3d`.
  `main` has `96c10e5`, a one-comment fix, also unpushed. Pushing is Andy's call, and a push to
  `main` deploys production.
- **Built and proven:** a pinned Jena 6.2.0, the 18-concept pilot vocabulary, SKOS integrity and
  claim shapes, the tag extractor, six saved queries, and the annotation guide.
  `node project-graph/graph.mjs test` runs 47 shape cases, 14 query cases and 18 extractor tests,
  in about 30 seconds.
- **The headless harness** (`docs/project-graph/harness/`) is **built and verified offline, never
  launched.** It's committed. See protocol.md → "Built 2026-10-18" for what is and isn't proven.
- **`pg-guide-trial`** (`4f0eb92`) is the trial branch: `086dd0f` plus the tooling with a
  six-concept vertical-spacing vocabulary in place of the pilot's. **Keep it:** the canary and the
  trial rerun start from it.
- **The first guide trial ran from the desktop app** and is reviewed. The guide's core judgments
  passed (B1, B3, B5), and every failure traced to the app: auto-memory, a shared side-session
  notes folder, and a wrapped prompt. That is why the harness exists.

## The next steps, in order, each a stop for Andy's review

1. **Housekeeping, only on Andy's yes:**
   - delete the trial's note,
     `~/Library/Application Support/Claude/side-session-notes/local_02438999-3db6-4739-bb5f-147835f37d44/annotate-7777a5-claims.md`
     (it's already copied to `guide-trial/side-session-note.md`);
   - remove the trial's worktree, `.claude/worktrees/annotate-7777a5`, and its branch
     `claude/annotate-7777a5`. **Not** `pg-guide-trial`.
2. **Run the canary, on Andy's go-ahead** (two runs, capped at $1 each):
   `node docs/project-graph/harness/canary.mjs`. **Exit 0** means both leaks are closed and the
   check is proven: record it under precondition 1. **Exit 1** means the canary leaked: nothing
   runs until it's fixed. **Exit 3, inconclusive,** means the control didn't leak either, probably
   because it was launched from inside a Claude session. Andy then runs it from a plain terminal.
3. **One wording change to the guide:** in `project-graph/annotation-guide.md`, `pnpm graph check`
   becomes `node project-graph/graph.mjs check`, which the harness settled on to avoid a hidden
   `pnpm install`. Carry it to `pg-guide-trial` too, as a commit there, since the rerun uses that
   branch's copy.
4. **Andy's open decisions,** each one a recommendation, then his answer:
   - **B4:** when one decision replaces another, keep two unlinked decisions, or add a way to say so
     (such as `prov:wasRevisionOf`, plus a shape like the overturned-claim rule).
   - **The grain:** the trial produced 79 claims from 47 comments. Keep the literal splitting rule,
     or record only the claims a comment makes a point of.
   - **For the runs:** the model and effort (they need only match across arms), the per-run cap,
     and a total budget.
5. **Rerun the guide trial through the harness:** annotator Opus 5.5 at high effort,
   `permissionMode: 'acceptEdits'`, the prompt verbatim from guide-trial.md. It needs a few lines
   calling `runOne()`. Review it against the same criteria. **D is now the harness's isolation
   check.**
6. **Stage 5,** per the protocol: verify T2's must-find list by hand (precondition 2); build arms A,
   B and C from `086dd0f`; annotate blind through the harness; write each arm's CLAUDE.md section
   and the run order into the protocol; run the leak search (precondition 5); build the schedule
   runner on `runOne()`; check the budget; then the 45 runs.

## How to work with Andy here

The root CLAUDE.md has the full rules. The ones that matter most for this work:

- **One coherent piece, then stop for review.** Say what you're about to build in a sentence before
  building it.
- **Seams are his:** the content model, ids and URLs, what counts as a claim, where a value lives,
  and anything about the experiment's design. Bring each as a decision with a recommendation.
  Surfaces (code, tests, docs) you draft.
- **Commit only when asked; push only when asked.** American spelling.
- **Every check is proven by making it fail:** a planted case or a weakened copy, recorded in the
  file's header.

## Traps already found, so you don't find them again

- **The experiment's isolation.** Auto-memory is one folder per repository, shared by every
  worktree. Sessions started from the desktop app (`start_session`) get a shared notes folder and a
  wrapped prompt. **Launch every annotation and run through the harness, never as an app session.**
- **zsh, the Bash tool's shell:** `git show $B:web/…` silently eats `:w` as a modifier, so write
  `${B}`. An unquoted glob that matches nothing aborts the command, so quote `--include='*.ts'`. A
  `cd` changes the session's working directory, so prefer absolute paths and `git -C`.
- **Jena** (all handled in `project-graph/jena.mjs` and `graph.mjs`): `shacl validate` exits 0 on a
  violation; `riot --validate` exits 0 on a warning; and without Jena's log config, logs go to
  stdout.
- **SHACL:**
  - a node shape's `sh:message` covers every constraint declared on it, so give constraints with
    different messages their own shapes;
  - in SHACL-SPARQL, `?path` is reserved for the result path, so bind a file as `?file`.
- **Proving by weakening:**
  - run the copy's own entry point (`node <copy>/graph.mjs test <copy>`), or the real modules are
    imported and the weakened code never runs;
  - a test that reads the list it tests can't notice an entry removed from that list.
- **Prettier ignores `*.md`** (markdown is hand-wrapped at 100) but does format `.json` and `.mjs`
  under `docs/`. Run `pnpm exec prettier --check .` before every commit: a Python-written JSON file
  once got through.
- **The first `pnpm` in a fresh worktree** runs a full install. Call `node project-graph/graph.mjs`
  directly.
- **Leaks into `project-graph/`:** the folder an arm and the annotator receive. Before annotating,
  run protocol precondition 5's search over all of it, `tests/` included.
