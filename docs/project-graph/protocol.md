# The Project Graph experiment: protocol

**Written before anything is built, so the results can't reshape the questions.** Changing
anything below after stage 5's first run means saying so in the write-up, with the reason.

## The question

This repo keeps most of its working knowledge in dense, deliberate comments. They are found by
grep and trusted because they read with authority. The focus-ring incident of 2026-10-16 showed
three ways that goes wrong, and none of them is about volume:

1. **An untested claim was written as fact.** ContactForm said script-moved focus draws no ring.
2. **A correction didn't spread.** CardMasonry disproved that claim on 2026-09-30, and nothing
   pointed back to ContactForm, which kept it until Andy saw the ring.
3. **A claim about history was wrong when written.** The fix's own comment dated the mistake
   backwards (`96c10e5` corrects it).

[inventory.md](inventory.md) shows this is a pattern, not one incident. In the focus-and-visibility
area alone there are 34 claims, about two-thirds of them restated in more than one place, and 11
hard contradictions.

## The hypothesis

Andy's, and he advocates it: **treat in-code comments as a knowledge graph backed by a consistent,
machine-readable vocabulary**, starting with SKOS and adding an ontology only if a query earns it.
That should:

- **H1, cost:** lower the time and tokens it takes to retrieve the context a change needs.
- **H2, trust:** make what is retrieved more consistent and more reliable.

## My predictions, recorded before any run

These are guesses, written down so the data can prove them wrong:

- **H1 will be modest.** On T1, C's median total tokens will land within 25% of A's. On T2 and T3,
  C will use at least 30% fewer tool calls than A.
- **H2 is where any real effect shows.** On T2, C's median site recall will be at least 0.85 and
  A's at most 0.6. On T3, C will find at least 6 of the 11 hard contradictions and A at most 4.
- **B will capture most of C's retrieval gain.** On T1 and T2, B's cost will be within 15% of C's.
  If C is distinctly better anywhere, it will be on T3, where grouping claims by concept helps
  and grep doesn't.
- **On T5, the placebo, no arm will separate from another.**

## The three arms

Every arm is a branch from **`086dd0f`**, the commit before the ring fix. The arm branches stay
local and are never merged or pushed. At that commit, the lesson about scripted focus existed in
CardMasonry while ContactForm contradicted it. That's the real situation the graph is supposed
to help with.

| Arm                   | Branch      | What it adds to `086dd0f`                                                                                                                                       |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A, control**        | `pg-arm-a`  | Nothing                                                                                                                                                        |
| **B, ids and grep**   | `pg-arm-b`  | Stable concept and claim ids in the pilot comments, a plain-text glossary, and a small Node lint that fails when an id doesn't resolve                        |
| **C, Project Graph**  | `pg-arm-c`  | B's annotations, plus SKOS, SHACL and a small PROV-O subset in Turtle, an extractor that reads the annotations, and saved SPARQL queries, run with the Jena command-line tools |

**B and C carry identical annotations,** so the difference between them measures the semantic
layer and nothing else. **The arms differ only in how knowledge is retrieved, never in how
correct it is.** That rules out the most likely way for C to win unfairly:

- **Claims are encoded exactly as the comments state them,** contradictions included. No comment
  is fixed, reworded or removed.
- **The annotator marks nothing as contradicting anything,** and tags nothing "stale" or "wrong".
  Two claims that disagree get two ids, each attached to the concept it is about. **One case
  follows from "exactly as stated" and is not an exception to it:** where a comment itself records
  that a belief was disproved, as CardMasonry does with "measured wrong first", that invalidation
  is encoded, because the comment says it. It is never inferred. *(Clarified 2026-10-17, before
  any run, when the claim model was decided; see [claim-model.md](claim-model.md).)*
- **The annotations are made blind,** by a fresh headless process (see the harness) given only
  concepts.ttl, model.ttl and a self-contained annotation guide. It never sees anything in
  `docs/project-graph/`: this protocol and the inventory hold the answers, and even id-design.md
  and claim-model.md name contradictions. The guide restates the rules it needs. Recognizing that
  two comments state the same claim is the judgment the experiment turns on, and whoever makes it
  must not know what the tasks score. *(Decided by Andy, 2026-10-17, before any run.)* The
  annotator is **Opus 5.5 (`claude-opus-5-5`) at high effort** (Andy, 2026-10-17), and the guide's
  trial uses the same, so the trial tests what the real annotation will do. That choice is
  separate from the model the runs use, which only has to be the same across arms.
- **The only text added is annotation:** ids, plus whatever the vocabulary and graph files hold.
  A diff of B or C against `086dd0f` must show comment annotations, graph and glossary files,
  the lint or the extractor, and the CLAUDE.md section below. Nothing else.

**Each arm's CLAUDE.md differs by one short section, at most 15 lines,** fixed here before the
runs. A gets none. B's explains the ids, where the glossary is and how to run the lint. C's
explains how to run the saved queries. The text is written in stage 5 and recorded here before
the first run. **T5 exists to catch this section's own effect:** if the arms separate on a task
the annotations don't touch, the instructions are doing the work.

## The tasks

Each prompt is given verbatim, as the first and only message, in a fresh session. **Every task asks
for an answer only,** with no edits. The hypothesis is about retrieval, and answer-only runs keep
editing skill out of the scores. Prompts never mention the graph, ids or the experiment.

### T1: find the precedent

> After a message is sent on the contact page, a blue focus ring appears around the "Thanks for
> reaching out!" message and the sentences after it. How would I suppress it? Explain where it
> comes from and what you'd change, but don't edit any files.

This is Andy's question from 2026-10-16, at the commit where it was asked. Scored 0–5, one point
each:

1. Names base.css's global `:focus-visible` `box-shadow` as the source.
2. Names the script's `.focus()` on the success block, or `:target` focus, as what puts focus
   there, and keeps that focus move rather than removing it.
3. Finds CardMasonry's existing suppression as the precedent.
4. Flags ContactForm's own comment, which says no ring would appear, as wrong.
5. Proposes clearing both `outline` and `box-shadow` on `:focus`. `:focus-visible`, or one
   property only, scores half.

### T2: spread a change

> We're considering a rule that elements which only ever receive focus from script, never from the
> Tab key, should not draw a focus ring anywhere on the site. Before anything changes: list every
> place in the repository, code and docs, that would need to change, or that currently says
> something about how these elements look or behave when focused. One line each on why. Don't edit
> any files.

**Scored by recall** against the must-find list below, which must be verified before stage 5.
Precision is reported too, counting locations listed that have nothing to do with this.

| Must-find, at `086dd0f`                                                                                  | Why it counts                                                   |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `styles/base.css:690-709`                                                                                | the ring itself                                                 |
| `cards/CardMasonry.astro:185-209`                                                                        | the one existing suppression, and its reasoning                 |
| `ContactForm.astro:143-147, 529-533`                                                                     | script-focused state blocks; the comment that says no ring      |
| `layouts/BaseLayout.astro:720-731` and the nine `<main tabindex="-1">`                                   | the skip-link landing point                                     |
| `ResultsFooter.astro:78-93`, with `scripts/card-index.ts:650`                                            | `#result-count`, a script-focused fallback                      |
| `scripts/card-index.ts:706-725`                                                                          | where the grid gets `tabIndex = -1`, and why                    |
| `DESIGN.md:1120-1123`                                                                                    | the design rule that names landing points and ring suppression  |

**Should-find,** reported but not scored: `docs/urls-and-filtering.md:390-395` and
`scripts/search.ts:923-928`, the deferred option of focusing a heading with `tabindex="-1"`; and
`CLAUDE.md:585`.

### T3: find the claims that disagree

> Audit what this repository's code comments and docs say about keyboard focus and about hiding and
> showing elements. List every place where two statements disagree, or where a statement no longer
> matches the code it describes. Give the locations and one line on each. Don't edit any files.

**Scored by recall over inventory.md's 11 hard contradictions.** Soft items found are reported, not
scored. False positives, meaning claimed disagreements that aren't real, are counted, and each
must be checked by hand before it's counted. Arm A on T3 is also the **audit agent** the graph has
to beat: re-running an agent pass now and then is the cheapest rival to standing checks.

### T4: find a settled decision instead of reopening it

> Elements with the `hidden` attribute can't be revealed with a CSS class in this project, because
> base.css makes `[hidden]` `display: none !important`. Should we drop the `!important`? Answer and
> explain; don't edit any files.

Scored 0–5, one point each:

1. Recommends keeping it: the decision is not reopened.
2. Gives the reason: an author `display` rule silently beats the browser's own `[hidden]`
   (`styles/base.css:77-99`).
3. Cites the incident that caused it: the Insights filter chips, 2026-08-31.
4. Names the established alternative: a class for "styled away", as ContactForm's `.is-shown` does.
5. Notes what would break: the controls that ship `hidden` and rely on it staying hidden.

### T5: the placebo, outside the annotated area

> DESIGN.md's search spec names Fuse.js as the search engine. Should we switch site search to Fuse.js
> so the code matches the spec? Answer and explain; don't edit any files.

Not about focus or visibility, so B and C annotate nothing relevant to it. Scored 0–3: recommends
against (1); gives the reason, that Fuse matches substrings and multi-word queries returned
nothing (1); finds the record, in CLAUDE.md or `docs/search-ranking.md`, and treats the DESIGN.md
line as out of date (1). **Expected: every arm scores alike, and costs alike.**

## What is measured

**Cost, per run:**
- **The primary figure is the list-price cost,** `total_cost_usd`. It was input plus output until
  2026-10-19, which leaves out reading: almost all of a run's input arrives through the cache, so
  the trial's rerun had 58 input tokens beside 174K written to cache. Run order can shift a run's
  fixed context, about $0.40, between cache written and cache read, which is far below a 2× gap.
- Tokens: input, output, cache read and cache write, kept separate.
- Tool calls.
- Distinct files read, by any tool.
- Wall time.

**Outcome, per run:** the task's score, as defined above.

**Maintenance, measured in stage 6, never in stage 5:**
- What it costs to build B's and C's annotations, in tokens and time.
- One maintenance probe on B and C: add a new script-focused element, and measure what it takes
  to keep the annotations valid, and whether the checks catch it when it isn't annotated.
- Seconds per run of the lint (B) and the graph checks (C).

## How the runs are done

**Narrowed to one round, by Andy, 2026-10-19, before any run.** One run per task per arm makes
**15 sessions**, not 45. The experiment answers Andy's own question, whether the graph helps him,
and is not headed for publication, and he judges it already overbuilt for that.

**Why one run is enough here.** Three runs per cell buy the power to tell a small difference from
run-to-run noise, and that matters mostly for cost. The guide trial's two runs of the same
annotation, under different conditions, differed by two-thirds in tool calls (46 and 77) at the
same cost. A difference large enough to change what Andy does should show in one run per cell, on
the trust measures above all.

**Accepted with it:**

- **Cost comparisons are directional.** A small cost difference between arms can't be read.
- **One unusual run can decide a cell.** The write-up says which results rest on a run that looked
  unusual.
- **There are no later rounds, whatever this one shows.** That also removes the risk of deciding to
  run more after seeing the results.

**"How the results are read" was written for three runs,** and was restated for one on
2026-10-19, before any run.

- **1 run per task per arm:** 5 tasks × 3 arms = **15 sessions** *(3 runs, and 45 sessions, until
  2026-10-19)*. A budget check comes before any of them. The model, effort, cap and budget are
  under "The runs' settings", below.
- **Every run is a fresh headless process,** launched by the harness below, in its own worktree
  from the arm's branch: never a session started from the desktop app. The same model and effort
  throughout, recorded with each run.
- **The order is round-robin across arms,** fixed and written here before the first run, so model
  or time-of-day drift spreads evenly across arms.
- **Recorded for every run:** the harness's JSON for it (session id, answer text, tokens, turns,
  time, cost), plus arm, task, run number, model and effort, and the session's transcript for
  the tool calls and files read. They go in `docs/project-graph/runs/`.
- **Grading:** rubric items are scored against the ground truth by checking the answer text. Andy
  grades with the arm labels removed. **Blinding is partial:** an arm C answer may mention a query,
  which reveals its arm. The objective scores (T2 recall, T3 recall) carry the most weight for that
  reason.

## The headless harness *(decided by Andy, 2026-10-18)*

**Why not sessions started from the desktop app.** The guide's trial, run that way on 2026-10-17,
showed three leaks the protocol's design never accounted for:

1. **Auto-memory reached it.** Memory is documented as one folder per repository, shared by every
   worktree, and the trial session was handed this checkout's index, which describes this
   experiment, and even told to write to it.
2. **The app gives sessions started by another session a shared notes folder,** keyed to the
   session that started them, and tells them to "read siblings' notes there". It is undocumented
   and has no switch, and the trial annotator left a note in it.
3. **The app wraps the prompt** in text of its own ("Background (from the session that started
   this one) … Task: …") and appends the notes line, so no prompt reached a session verbatim.

A headless CLI process avoids all three by construction: no app, so no notes folder and no
wrapper; and memory off for that launch. It also gives the measurements directly.

**What it is:** `docs/project-graph/harness/`. It lives in `docs/project-graph/` because it will
list the tasks and arms, and nothing in that folder reaches an arm. For each run, in the fixed
order:

1. **A fresh worktree,** `git worktree add --detach <runs-root>/<run-id> <arm-branch>`, outside this
   checkout, so no app ever lists or touches it.
2. **The launch,** with the worktree as the working directory and nothing on stdin:

   ```bash
   CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 claude -p "<the task's prompt, verbatim>" \
     --model <model> --effort <effort> --output-format json --max-budget-usd <cap> \
     --allowedTools "<the same list for every arm>" --disallowedTools "Edit Write NotebookEdit"
   ```

   `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` is documented as "does not create or load auto memory
   files". `--bare` would also turn memory off, but it drops CLAUDE.md, where each arm's section
   lives, so it is not used. **The allowed tools are identical for every arm**: reading, searching,
   and `node project-graph/*`, which simply does not exist in arm A. Arm C calls
   `node project-graph/graph.mjs` directly, never `pnpm graph`, which settles precondition 6.
3. **Capture:** the JSON goes to `runs/<run-id>.json` as it is. The session's transcript, which
   headless runs still save, is copied beside it for the tool calls and files read.
4. **An isolation check on every transcript,** automated: none of "MEMORY.md", "persistent
   file-based memory", "side-session-notes", "Shared notes folder" or "Background (from the
   session that started this one)", and the first user message equal to the prompt. **A run that
   fails is invalid, and the schedule stops.**
5. **The worktree is removed,** and the next run starts only after this one finishes. Sequential,
   not parallel, so runs can't contend or order themselves.

**The annotation is launched the same way,** with `--permission-mode acceptEdits` in place of the
disallowed edit tools, since it must write tags and `claims.ttl`. A trial rerun of the guide uses
it too.

**Built 2026-10-18, verified offline, then run the same day by the canary, which passed** (see
"The canary's result" below). `harness.mjs` is the per-run machinery:
`runOne()`, plus a `dry-run` command that creates and removes a worktree and prints the launch.
`canary.mjs` is the canary and its control, and `harness.test.mjs` holds 13 tests that need no
launch. Two additions to the launch above, found in the CLI's help: `--permission-mode dontAsk`,
so a tool not on the list is refused rather than waited on, and `--strict-mcp-config`, so none of
Andy's MCP connections (Sanity, Figma, ClickUp) attach to a run. Verified without launching:

- **The isolation check, on the guide trial's real transcript,** flags all seven problems: the three
  memory fingerprints, the two notes fingerprints, the wrapper, and the prompt not arriving
  verbatim. So it sees the leaks that actually happened.
- **The tests fail when the harness is weakened:** removing one fingerprint from the banned list
  fails exactly the two fingerprint tests, and never switching memory off fails exactly the launch
  test. The first version of the fingerprint test read the banned list itself, so a removed
  fingerprint went unnoticed. The weakening caught that, and the test now states the trial's
  fingerprints independently.
- **The dry run** creates a worktree of `pg-guide-trial` under `~/.cache/project-graph/runs/`,
  prints the launch, and removes it.
- **The scrub, widened before anything launched** (2026-10-18). It first removed only `CLAUDECODE`
  and `CLAUDE_CODE_*`. The desktop app's environment turned out to hold `CLAUDE_EFFORT=xhigh` among
  the variables that pattern lets through, beside `CLAUDE_PID` and `CLAUDE_AGENT_SDK_VERSION`. The
  launch passes `--effort`, and which of the two wins was never tested, so a run started from inside
  the app might have run at the app's effort rather than the arm's, and no result would show it. It
  now removes every variable beginning `CLAUDE`. A test planting `CLAUDE_EFFORT` failed against the
  old filter and passes against the new one, and against this session's real environment a launch
  keeps none of its 30 `CLAUDE*` variables but the memory switch.

**What only the canary can prove:** that `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` works on the Claude
Code the harness launches, that the JSON carries the fields runs need, and that a headless run's
transcript is found and is clean. One known uncertainty: a session launched from inside
another Claude Code session may have memory off whatever the harness does. The harness removes
every inherited `CLAUDE*` variable for that reason. If the control still doesn't leak,
`canary.mjs` reports "inconclusive" (exit 3), and it must be run from a plain terminal.

**The runs' settings, decided by Andy, 2026-10-18.** Every dollar figure here is a list-price
equivalent: the `total_cost_usd` Claude Code reports, which `--max-budget-usd` enforces. Prices at
the time were $4 input, $20 output, $0.20 cache read and $8 one-hour cache write per million
tokens. These rebuild the canary's reported cost to the cent.

- **Model: Opus 5.5 (`claude-opus-5-5`)** for every run and annotation. The question is whether
  the graph helps the agent actually used on this repo, and the annotator uses it too. Sonnet 5.5
  was passed over. It would have saved about a third, not half, because cache reads cost the same
  on both. A weaker model might gain more from the graph, but that is a different experiment.
- **Effort: `high`, set explicitly,** since Opus 5.5's API default is `medium`. It matches the
  annotation and the guide's trial, the only cost measurements so far. Low effort was passed over
  because it consolidates tool calls and stops sooner, which would cut arm A's searching short and
  inflate C's advantage on outcome. `xhigh`, Claude Code's default, would be more realistic, but
  costs more and the hypothesis doesn't need it. Each run's effort is read back from its
  transcript's `output_config`.
- **Cap: $10 a run and $25 an annotation run.** The cap guards against a runaway run; it is not a
  measurement. It sits about three times above the heaviest run measured, the trial's annotation
  at $3.46, because a cap that truncates runs would penalize whichever arm searches more, which is
  what's being measured. **A run that hits the cap is kept and scored as it stands,** with its cost
  recorded as the cap. If a second run hits it, the schedule stops and the cap is revisited.
- **Budget: $200 for all of stage 5,** covering the 45 runs (estimated at $1.50 to $4 each, about
  $110 in all), the annotations, the trial's rerun and any canaries. The schedule stops when the
  running total reaches it. **It runs in rounds of 15,** one run per task per arm, and pauses after
  the first round so the estimate can be redone from real figures before more runs. Later rounds
  are spread over days, with usage checked between them. If the budget gets tight, T5 drops to
  2 runs, as allowed above.

  **Since 2026-10-19 there is one round**, so the runs are estimated at about $40. The $200
  ceiling stands for stage 5 as a whole, and the schedule still stops if it is reached. The second
  and third rounds, and dropping T5 to 2 runs, no longer apply.
- **Andy's user-level `~/.claude/CLAUDE.md` stays loaded** (Andy, 2026-10-19). It is the same in
  every arm, both runs of the guide's trial loaded it, and the agent used on this repo loads it. It
  asks for work in small pieces with a pause for review, so a run could stop short and ask whether
  to continue. The trial's rerun, a far longer task, did not. Grading notes any answer that does.
- **Before the schedule starts,** Andy confirms the spend is covered. That isn't a rule this file
  can check, so it is listed here, where the schedule runner is built.

The canary measured the floor: loading the context alone costs about $0.40 a run (see below).

### The canary: proving both leaks closed before anything real runs

Two cheap, throwaway runs through the harness, each in a worktree of `pg-guide-trial`, with a
neutral prompt: *"List the files in project-graph/ and say in one sentence what concepts.ttl
holds. Don't change anything."*

- **The canary,** exactly as the harness launches. **Passes** only if every one of these holds:
  - its JSON parses and carries tokens, turns, time and cost;
  - its transcript passes step 4's isolation check;
  - this checkout's memory folder is byte-identical before and after;
  - the side-session notes folder gains nothing;
  - the reported cost is within the cap.
- **The control,** identical but **without** `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. It must **fail**
  the isolation check, with memory text in its transcript. That proves the check can see a leak, by
  the rule every gate in this repo is held to: a check isn't known to work until it has failed.

**Why both, on this machine:** some of what the docs describe is documented for later versions
than the one installed, so nothing about the environment variable is assumed until the canary and
its control agree.

*Corrected 2026-10-18.* This read "Claude Code here is 2.1.150". That was the version of the
standalone CLI at `~/.local/bin/claude`, which nothing had run on yet. The desktop app runs its
own copy, 2.1.299 that day, and the guide's trial ran on it. The harness launches the standalone
CLI, updated to 2.1.302 for the canary.

**The canary's result** (2026-10-18). It passed, recorded under precondition 1. What it found
besides:

- **Two attempts failed first, neither a leak, both at $0.** The standalone CLI had never been
  logged in: the app authenticates its own sessions in a way a child process cannot use, under any
  environment filter. Andy logged it in with `claude auth login`, as a claude.ai account rather
  than an API key. The CLI, at 2.1.150, was then too old for Opus 5.5, which needs 2.1.280 or
  newer, and `claude update` took it to 2.1.302. Both attempts' output was deleted.
- **A transcript at 2.1.302 holds the system prompt and the request's parameters,** about 500 KB a
  run. So the isolation check now covers the system prompt as well, and each run's effort can be
  read back afterward from `output_config`. Both runs showed `low`, as launched. A search of both
  transcripts for credentials found none.
- **Context costs about $0.40 a run before any work:** some 47K tokens of system prompt,
  CLAUDE.md and the listing of Andy's user-level skills, at Opus 5.5. The canary cost $0.40 and the
  control $0.42, at list price. A run cannot invoke those skills, since `dontAsk` refuses any
  unlisted tool, and the listing is the same in every arm.
- **Four things for the harness, before any real run:**
  1. `runOne()` marked both failed attempts `isolated: true`. Only the canary's own check of the
     exit code stopped them. A run's validity must also require exit 0 and no `is_error`.
  2. The CLI updates itself, so its version could change partway through a schedule. Turn
     auto-update off for runs, and record the version in every run's record.
  3. `claude` is found on the PATH, and a login shell finds a leftover npm install first,
     `/opt/homebrew/bin/claude` at 2.1.63. Launch by absolute path.
  4. Claude Code keeps its own copy of each run's transcript, in a new folder per run under
     `~/.claude/projects/`. The harness copies it and leaves the original.

  **All four were addressed on 2026-10-18**, test-first, and the harness's header records each:

  1. A record now has `completed` and `valid`, and `valid` needs both completion and isolation.
     The canary checks `valid`. A control that didn't complete is reported as inconclusive rather
     than as a check that saw nothing.
  2. Every run's environment has `DISABLE_AUTOUPDATER=1`, which the 2.1.302 binary was checked to
     read. Every record carries the CLI's real path and its `--version`.
  3. The CLI is launched at `~/.local/bin/claude`, or `PROJECT_GRAPH_CLAUDE`.
  4. The originals are left, and each record names its copy in `sourceTranscript` (confirmed by
     Andy, 2026-10-18).

  Three new tests were run first against stand-ins with the old behavior, and failed exactly
  those three. They pass now, 13 of 13. Against real records, all four of the canary's failed
  attempts now come out invalid, where each had been marked isolated, and the passing canary comes
  out valid. A dry run started from a login shell, whose PATH finds the npm copy first, launches
  the native 2.1.302.

  **The canary passed again on the changed harness,** 2026-10-18, exit 0. Its record is
  `runs/canary-2026-10-18T23-53-43-758Z/`. It ran from `pg-guide-trial` at `6e707c5`, with the
  replaced-decision rule and the `node` wording in place, on 2.1.302, at $0.39 and $0.41. The
  canary run was completed, isolated and valid. The control completed and was flagged for the
  same three memory fingerprints. Every new field came back filled: `cli`, `completed`, `valid`
  and `sourceTranscript`. Checked beyond the script's own verdict: the memory folder was
  byte-identical, no memory file is named in the canary's transcript, and both transcripts show
  effort `low`, as launched.

  **A fifth gap, found by the guide trial's rerun: an allowed list does not confine the shell.**
  Claude Code lets a command it judges read-only through without asking. The rerun ran `cat`,
  `git status` and `pnpm exec prettier --check`, which installed node_modules, though its list named
  none of them. Two of those matter. **`git` reaches the answer key:** a worktree shares the
  repository's objects, so `git show project-graph:docs/project-graph/inventory.md` works from
  inside any arm. **An install** breaks precondition 6. The harness now puts a deny rule on every
  launch, `Bash(git *)`, `Bash(pnpm *)`, `Bash(npm *)` and `Bash(npx *)`, with a test written to
  fail first. A probe run then proved it (`runs/probe-2026-10-19T00-29-07-149Z/`, $0.41): all six
  attempts were refused, including the chain `ls && git status`.

  **A sixth gap: a run can read outside its worktree.** The same probe read a file outside it with
  both `cat` and the Read tool, and `cat .git` prints the main checkout's path, under which this
  folder sits. No run has gone there unprompted. **Closed by detection** (Andy, 2026-10-18, over
  prevention by deny rules, which can't confine Bash by path). The checkout's last two path
  segments, `Repos/af-consulting` here and taken from `REPO` so a moved checkout keeps them right,
  are now a banned string. A run that reaches the checkout by an absolute, `~/` or relative path is
  invalid, and the schedule stops. Before the change, the probe's transcript passed the isolation
  check, and the new test failed. After it, the probe's transcript is flagged, while both canary
  runs and the trial's rerun stay clean and both controls are flagged for memory alone. So the
  string adds no false positive, even with memory on. The probe's own record still says
  `isolated: true`, because it was judged by the check as it stood when it ran.

## Preconditions for stage 5

1. **Auto-memory cannot reach the runs.** This checkout's memory contains T1's answer and a note
   about this experiment. **Tested on 2026-10-17 and it FAILED:** the guide's trial, started from
   the desktop app in a worktree, was handed this checkout's memory index (guide-trial.md,
   criterion D). The precondition is now **the canary and its control** above, and the harness
   checks every run's transcript besides.
   **MET 2026-10-18.** The canary ran from inside a desktop-app session, from `pg-guide-trial`
   (`4f0eb92`), on Claude Code 2.1.302 with Opus 5.5 at low effort, and exited 0. Its record is
   `runs/canary-2026-10-18T20-16-24-649Z/`. The canary was isolated: its memory folder was
   byte-identical, and none of the 14 memory files is named anywhere in its transcript, a wider
   search than the banned list. The control loaded this checkout's memory index as an `AutoMem`
   attachment, from a worktree outside the checkout, and was flagged for it. That shows the check
   can see a leak, and that memory follows the repository rather than the worktree's path. The
   inconclusive case did not arise: with every `CLAUDE*` variable removed, a launch from inside a
   session still loads memory when it is allowed to.
2. **The ground truth is verified.** T2's must-find list and every hard contradiction are read at
   `086dd0f` by hand. The contradictions are done (inventory.md marks each); T2's list is not.
3. **The arm diffs are clean,** checked against the rule above.
4. **Each arm's CLAUDE.md section and the run order are written into this file.**
5. **Nothing in `project-graph/` leaks the test** *(added 2026-10-17, with the annotation guide)*.
   The blind annotator works in a checkout where that whole folder is present, so its comments
   must not name a task, a contradiction or a scored finding. Before the annotation runs, search
   all of it, tests included:

   ```bash
   grep -rniE "\bT[1-5]\b|task|contradict|CardMasonry|ContactForm|09-30|measured wrong|turns on|real browsers drew|inventory|protocol" project-graph
   ```

   On 2026-10-17 this found, and the guide's commit removed: the 09-30 focus-ring finding in
   `automation-only.rq`; "the rule the experiment turns on" in `shapes.ttl`; tasks T2 and T4 named
   in `queries.mjs` and `settled.rq`; and, in the guide's first draft, the phrase "measured wrong
   first" and templates built on real, scored concepts. Preparing the guide trial then found "the
   rule the experiment turns on" again, in a test fixture's header. The first version of this
   search excluded `tests/` on the unchecked assumption that fixtures are generic, so it now
   searches everything. What remains is low: mentions that an experiment, arms and an annotator
   exist, which say nothing about the answers. The list above lives here, not in `project-graph/`,
   because the list is itself a hint.

6. **No arm pays for an install the others don't** *(added 2026-10-17, found while setting up the
   guide's trial)*. In a fresh worktree with no `node_modules`, the first `pnpm graph …` runs a full
   `pnpm install`, about 6 seconds and some 30 lines of output, before the command itself. Only arm
   C calls the graph's tools, so that cost would land in its wall time and context alone. Before
   the runs, settle one: arm C's CLAUDE.md section calls `node project-graph/graph.mjs` directly,
   which needs no install, or every arm's worktree is installed before its session starts.
   **Settled 2026-10-18 by the harness:** the direct `node` call, which also needs no install for
   the annotator.
7. **No session can read another's notes** *(added 2026-10-18)*. The desktop app's side-session
   notes folder is closed by launching nothing from the app: annotation, trial reruns and runs all
   go through the harness. The canary checks it, and so does every run's isolation check.

## How the results are read

*Restated for one run per cell (Andy, 2026-10-19), before any run. The rule for three runs, under
which an arm won only when all three of its runs beat all three of the other's, is in git history.*

With one run per cell, a difference counts only when it is larger than one lucky or unlucky read
could make:

- **On trust, an arm beats another by two or more:** two more must-find rows on T2, or two more of
  the 11 hard contradictions on T3. A difference of one is reported, not counted. T1 point 4 is a
  single yes or no, so it is reported and decides nothing.
- **On cost, an arm loses to another at twice the cost or more,** in list-price cost summed over
  T1 to T4. Each task's cost, the tokens by kind and the tool calls are reported. The guide trial's
  two runs of one annotation differed by two-thirds in tool calls at the same cost, so a smaller
  gap can't be read.
- **On T5, arms separate** at a gap of two points out of its three, or at twice the cost.

Then:

- **The annotation discipline earns its place** if B beats A on at least one trust measure (T2
  recall, T3 recall) without losing to A on cost.
- **The semantic layer earns its place** if C beats B on at least one trust measure without losing
  to B on cost, or beats it on cost without losing on trust.
- **If C never beats B, the RDF layer has not earned its place** at this scale, whatever its other
  merits. The honest conclusion would then be to keep B's discipline, or drop both.
- **If any arm separates from another on T5,** the other results are suspect, and the write-up
  says so before drawing conclusions from them.
- **Maintenance counts against the gains.** A trust gain that costs more per change than the audit
  agent costs per run is reported as such.

The decision to adopt, trim or drop the graph is Andy's.
