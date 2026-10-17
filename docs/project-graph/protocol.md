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
- **The annotations are made blind,** by a fresh session given only concepts.ttl, model.ttl and a
  self-contained annotation guide. It never sees anything in `docs/project-graph/`: this protocol
  and the inventory hold the answers, and even id-design.md and claim-model.md name
  contradictions. The guide restates the rules it needs. Recognizing that
  two comments state the same claim is the judgment the experiment turns on, and whoever makes it
  must not know what the tasks score. *(Decided by Andy, 2026-10-17, before any run.)*
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
- Tokens: input, output, cache read and cache write, kept separate. The primary figure is
  input plus output, because cache reads depend on run order.
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

- **3 runs per task per arm:** 5 tasks × 3 arms × 3 = **45 sessions.** A budget check comes before
  any of them, and T5 can drop to 2 runs if that is too many.
- **Every run is a fresh session,** with fresh context, in its own worktree from the arm's branch.
  The same model and effort throughout, recorded with each run.
- **The order is round-robin across arms,** fixed and written here before the first run, so model
  or time-of-day drift spreads evenly across arms.
- **Recorded for every run:** session id, arm, task, run number, model, the cost figures, and the
  answer text. They go in `docs/project-graph/runs/`.
- **Grading:** rubric items are scored against the ground truth by checking the answer text. Andy
  grades with the arm labels removed. **Blinding is partial:** an arm C answer may mention a query,
  which reveals its arm. The objective scores (T2 recall, T3 recall) carry the most weight for that
  reason.

## Preconditions for stage 5

1. **Auto-memory cannot reach the runs.** This checkout's memory contains T1's answer and a note
   about this experiment. Verify that a session in an arm worktree loads none of it. If it does,
   the runs need another arrangement before they start, because a leak would favor every arm
   alike and hide the effect.
2. **The ground truth is verified.** T2's must-find list and every hard contradiction are read at
   `086dd0f` by hand. The contradictions are done (inventory.md marks each); T2's list is not.
3. **The arm diffs are clean,** checked against the rule above.
4. **Each arm's CLAUDE.md section and the run order are written into this file.**
5. **Nothing in `project-graph/` leaks the test** *(added 2026-10-17, with the annotation guide)*.
   The blind annotator works in a checkout where that whole folder is present, so its comments
   must not name a task, a contradiction or a scored finding. Before the annotation runs, search
   it, tests excluded:

   ```bash
   grep -rniE "\bT[1-5]\b|task|contradict|CardMasonry|ContactForm|09-30|measured wrong|turns on|real browsers drew|inventory|protocol" project-graph --exclude-dir=tests
   ```

   On 2026-10-17 this found, and the guide's commit removed: the 09-30 focus-ring finding in
   `automation-only.rq`; "the rule the experiment turns on" in `shapes.ttl`; tasks T2 and T4 named in
   `queries.mjs` and `settled.rq`; and, in the guide's first draft, the phrase "measured wrong
   first" and templates built on real, scored concepts. What remains is low: mentions that an
   experiment, arms and an annotator exist, which say nothing about the answers. The list above
   lives here, not in `project-graph/`, because the list is itself a hint.

## How the results are read

With 3 runs, an arm **beats** another on a metric only when **all three of its runs are better
than all three of the other's**: the ranges don't overlap. That's deliberately strict, so a small
sample can't produce a win by noise. Medians and ranges are reported either way.

- **The annotation discipline earns its place** if B beats A on at least one trust measure (T1
  point 4, T2 recall, T3 recall) without losing to A on cost.
- **The semantic layer earns its place** if C beats B on at least one trust measure without losing
  to B on cost, or beats it on cost without losing on trust.
- **If C never beats B, the RDF layer has not earned its place** at this scale, whatever its other
  merits. The honest conclusion would then be to keep B's discipline, or drop both.
- **If any arm separates from another on T5,** the other results are suspect, and the write-up
  says so before drawing conclusions from them.
- **Maintenance counts against the gains.** A trust gain that costs more per change than the audit
  agent costs per run is reported as such.

The decision to adopt, trim or drop the graph is Andy's.
