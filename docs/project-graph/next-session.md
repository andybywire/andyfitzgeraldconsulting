# Picking up the Project Graph experiment in a fresh session

**Refreshed 2026-10-18, at the end of the session that proved the harness and reran the guide's
trial, updated 2026-10-19 when Andy narrowed the experiment to one round, and again that day once
steps 1 to 3 and stage 5's first pieces were settled.** The first version, written the morning of
2026-10-18 at the end of stages 0 to 4, is in git history. Start a new session with this prompt:

> Read `docs/project-graph/next-session.md` and pick up the Project Graph experiment from there.
> It's now a single round of 15 runs, and I think it's already overbuilt for what I want to find
> out, so take the lightest path to a result and propose cuts before additions. Start with the
> next open piece of step 4, and stop for my review after each step.

## What this is

A test of Andy's hypothesis that treating this repo's comments as a **knowledge graph**, backed by
a SKOS vocabulary, SHACL shapes and a small PROV-O subset, makes context **cheaper to retrieve and
more trustworthy** than grep over prose. It has three arms, all starting from `086dd0f`, on the
**focus-and-visibility** area:

- **A:** the comments as they are;
- **B:** ids and grep;
- **C:** the full graph.

Andy advocates the graph and has asked for pushback, so the design gives it room to lose: C has to
beat B, not just A.

**Narrowed to one round of 15 runs** (Andy, 2026-10-19), one per task per arm, with no later
rounds. It answers his own question, not a journal's, and **he judges the experiment already
overbuilt for that.** So take the lightest path to a result: keep only what the 15 runs need, and
propose a cut before proposing anything new. protocol.md → "How the runs are done" records the
narrowing and what it gives up.

**Read in this order:**

1. [README.md](README.md): the index, and a status line per stage.
2. [protocol.md](protocol.md): the hypotheses, tasks, rubrics and decision rules. Then **The
   headless harness**, **The runs' settings**, **The canary's result** and **Preconditions for
   stage 5**.
3. [guide-trial.md](guide-trial.md): the annotation guide's trial, its criteria, the first run's
   results and the rerun's.
4. [claim-model.md](claim-model.md) and [id-design.md](id-design.md), only when a step touches
   claims or ids.
5. The headers of `harness/harness.mjs`, `harness/canary.mjs` and `harness/trial-rerun.mjs`,
   before running any of them.

**`docs/project-graph/` is the answer key.** Nothing in it may reach an arm branch or the blind
annotator: the inventory lists every contradiction the tasks score.

## Where things stand

**Branches, all local and unpushed.** Pushing is Andy's call, and a push to `main` that touches
`web/` deploys production.

| Branch | At | What it holds |
| --- | --- | --- |
| `project-graph` | its tip | Everything: `project-graph/` (the tooling) and `docs/project-graph/` (the record) |
| `pg-guide-trial` | `6e707c5` | `086dd0f` plus the tooling, with a vertical-spacing vocabulary. **Keep it** |
| `main` | `96c10e5` | One commit ahead of `origin/main`: a one-comment fix |
| `design-md-figure-alignment` | `1f27216` | Off `main`, not merged: a stale DESIGN.md paragraph the rerun found. Its worktree is `.claude/worktrees/design-md-figure-alignment` |

**Built and proven:**

- **The tooling:** `node project-graph/graph.mjs test` runs 50 shape cases, 16 query cases and
  18 extractor tests.
- **The harness:** 15 tests.
  - **Launch:** the standalone CLI by absolute path, auto-memory and auto-update off, every
    inherited `CLAUDE*` variable removed, and `git`, `pnpm`, `npm` and `npx` blocked.
  - **Validity:** a run is valid only if it completed *and* was isolated. A run that reaches the
    main checkout is flagged.
- **The canary has passed twice.** The guide trial's **rerun passed every criterion**, where the
  first trial had failed four (A2, B4, B7, D), all for app causes.

**Decided on 2026-10-18,** each recorded where it lives:

- **B4:** a replaced decision is overturned through `prov:invalidated`, as a disproved belief is.
  No term is added (claim-model.md).
- **The grain:** the literal splitting rule stays (id-design.md).
- **The runs** (protocol.md → "The runs' settings"):
  - Opus 5.5 at high effort;
  - a $10 cap a run and $25 an annotation run;
  - **one round of 15 runs, about $40 at list price**, within a $200 ceiling for stage 5;
  - Andy confirms the spend is covered before the schedule starts.
- **Reading outside the worktree** is detected, not prevented. Claude Code's per-run transcript
  folders are left where they are.

**Decided on 2026-10-19,** steps 1 to 3 below, each recorded where it lives:

- **The guide's four unclear points:** one sentence on what a Markdown comment is, since a tag
  records the line it sits on, and nothing for the other three, none of which can change a scored
  result (guide-trial.md, finding 3). No third run of the trial.
- **Andy's user-level `~/.claude/CLAUDE.md` stays loaded** in the runs, with a recorded caveat that
  a run might stop short to ask whether to continue (protocol.md → "The runs' settings").
- **How the results are read, restated for one run per cell** (protocol.md):
  - T2 and T3 recall decide, by a margin of two;
  - cost counts at a gap of 2× or more, summed over T1 to T4;
  - T1 point 4 is reported and decides nothing;
  - **the primary cost figure is list-price cost,** because input plus output left out reading.

## The next steps, in order, each a stop for Andy's review

Steps 1 to 3 were decisions, settled on 2026-10-19 and listed above.

4. **Stage 5, as narrowly as the 15 runs allow.** **Done on 2026-10-19,** each Andy's call and
   recorded in protocol.md:
   - **three cuts:** one annotation run feeds both B and C, with B's glossary generated from its
     `claims.ttl`; the maintenance probe, and B's lint with it, deferred until B or C earns its
     place; "distinct files read" dropped from the measures;
   - **T2's must-find list verified as listed** (precondition 2), from a packet of each location's
     text at `086dd0f`;
   - **the leak search** (precondition 5). Its six hits were all low. Read against the rubrics,
     four of `concepts.ttl`'s scope notes carried answers the search can't see, and they were
     trimmed with its two mentions of the inventory. **Any later vocabulary change needs the same
     reading.**

   **Still open, in this order:**
   - build arms A, B and C from `086dd0f`;
   - annotate once, blind, through the harness. `trial-rerun.mjs` is the pattern: `keepWorktree`,
     then collect the output. About $3.50, so Andy is asked first;
   - write each arm's CLAUDE.md section and the run order into the protocol (precondition 4);
   - check the arm diffs (precondition 3);
   - a **minimal** schedule runner on `runOne()`. It runs the 15 in the recorded order, stops on any
     invalid run, a changed CLI version or the budget, and applies the capped-run rule. No rounds;
   - Andy confirms the spend;
   - then the 15 runs.
5. **Stage 6:** Andy grades the 15 answers blind, then the write-up. The maintenance probe runs
   first only if B or C has earned its place.
6. **Not part of the experiment:** Andy merges `design-md-figure-alignment` when he's ready, and
   removes its worktree after.

## How to work with Andy here

The root CLAUDE.md has the full rules. The ones that matter most for this work:

- **The lightest thing that answers the question** (2026-10-19). Andy judges this experiment
  overbuilt for its purpose. Before building, ask whether the 15 runs need it. Offer a cut before
  an addition. Prefer a recorded caveat to new machinery.
- **One coherent piece, then stop for review.** Say what you're about to build in a sentence before
  building it.
- **Seams are his:** the content model, ids and URLs, what counts as a claim, where a value lives,
  and anything about the experiment's design, criteria included. Bring each as a decision with a
  recommendation. Surfaces (code, tests, docs) you draft. **Never attribute a decision to him that
  he hasn't made**, not even in a comment.
- **Commit only when asked; push only when asked.** American spelling.
- **Every check is proven by making it fail:** a planted case, a weakened copy or a stand-in with
  the old behavior, recorded in the file's header. A check that needs a launch is proven by a cheap
  probe run.
- **He asks before money is spent.** Say what a launch costs at list price before running it.

## Traps already found, so you don't find them again

- **Isolation.** Auto-memory is one folder per repository, shared by every worktree. Sessions the
  desktop app starts get a shared notes folder and a wrapped prompt. **Launch every annotation and
  run through the harness, never as an app session.**
- **The harness runs the standalone CLI,** `~/.local/bin/claude`, not the app's own copy. It needs
  its own `claude auth login`, with a claude.ai account, not an API key. It also has to be new
  enough for the model: Opus 5.5 needs 2.1.280 or newer. A login shell's PATH finds a leftover npm
  install first, `/opt/homebrew/bin/claude` at 2.1.63. That's why the harness launches by path.
- **An allowed list does not confine a run's shell.** Claude Code lets a command it judges read-only
  through. Only a deny rule stops one. A run can read files outside its worktree, and `cat .git`
  names the main checkout.
- **Transcripts carry the account's email and org id,** and the memory index when memory is on.
  They are ignored by git, and only the run's JSON is committed. **The repo is public:** keep
  account and plan names out of the record.
- **Commit messages on `pg-guide-trial`** and on any arm branch must be leak-safe. Check each one
  against the protocol's leak search, plus "trial", "experiment", "arm" and "rerun".
- **zsh, the Bash tool's shell:**
  - `git show $B:web/…` silently eats `:w` as a modifier, so write `${B}`;
  - an unquoted glob that matches nothing aborts the command, so quote `--include='*.ts'`;
  - **an unquoted `$FILES` holding several paths is one word**, so use an array and `"${FILES[@]}"`.
    It once produced an empty patch and a "Conforms" that meant nothing;
  - a `cd` changes the session's working directory, so prefer absolute paths and `git -C`.
- **`git stash` leaves untracked files alone**, so a before-and-after comparison through it misses
  new files.
- **Working on another branch without moving this checkout:** `git worktree add` into
  `.claude/worktrees/` (excluded locally, and inside the folder Andy can open) or into the
  scratchpad. Another session may share this checkout.
- **Jena** (all handled in `project-graph/jena.mjs` and `graph.mjs`): `shacl validate` exits 0 on a
  violation, `riot --validate` exits 0 on a warning, and without Jena's log config, logs go to
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
  under `docs/`, including JSON a script writes with `JSON.stringify`. Run
  `pnpm exec prettier --check .` before every commit.
- **The first `pnpm` in a fresh worktree** runs a full install. Call `node project-graph/graph.mjs`
  directly. The tools' own text now says so too.
- **Leaks into `project-graph/`,** the folder an arm and the annotator receive. Before annotating,
  run protocol precondition 5's search over all of it, `tests/` included.
