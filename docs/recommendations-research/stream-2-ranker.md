# Stream 2: the ranker goes to production

*Planned 2026-11-19, from the decisions in [plan.md](plan.md) → Where things stand. The second of
three streams. Built on a branch while stream 1 runs, and merged after stream 1's dataset swap.
Written to be picked up cold.*

## The goal

Replace the live site's related-content rule, the old branch rule, with the one the research
settled on: cross-category ranking from Topic tags, as drawn in
[related-algorithm.md](related-algorithm.md). It ships as **a shared, pure TypeScript module with
tests** (Andy, 2026-11-19), so the same code can rank for the site's build and, later, count for a
Studio governance tool. The research's code becomes something tested, robust and iterable.

## Decided, and not to be revisited here

- **Shared TypeScript, not GROQ.** GROQ can count shared tags and order the results, but it has
  no recursion for genre subtrees, the crossing step is clumsy in it, and the governance count
  is an aggregation over every page's list that GROQ can't group. One pure module serves the
  site and the Studio alike, over one GROQ pool query.
- **No tag scores.** Ties break on genre, then date. **The module needs no change for this:**
  with `tieBreak: 'genre-strength'` on and no scores, strength adds nothing (`compare` only
  counts it when both tags carry a number). When the plugin supplies scores (stream 3), strength
  switches itself on.
- **A test runner arrives now**, at the first code that needs one, since more shared code is
  expected.
- **Merged after stream 1.** Until then the live site keeps the old rule, over the new tags.

## Decided at the start (Andy, 2026-11-21)

Each was put to Andy with a recommendation, and he took all five. The branch is
**`related-ranker`**.

0. **The branch is cut from `lab-to-production`**, which had not merged into `main` when stream 2
   started. Stream 1 was finished on it, and this file and plan.md, which stream 2 updates as it
   goes, existed only there. If `lab-to-production` is squash-merged, `related-ranker` is rebased
   onto `main` afterwards.
1. **The module starts in `web/src/lib/related.ts`**, and moves to a workspace package when the
   Studio tool arrives as its second consumer. Two things that move will touch:
   - **The research scripts import it by a fixed path,** `../../web/src/lib/related.ts`. That
     includes `taxonomy-columns.mjs` and `m3-report.mjs`, which use the NEW rule, so promotion
     breaks them as well as the old rule's three.
   - **`genresByCategory` imports `stegaClean`** from `@sanity/client` to match genre labels.
     A package would want the site to clean the labels it passes in, so the package depends on
     nothing.
2. **The test runner is Node's own `node:test`.** Checked on Node 24.19 before deciding:
   `node --test` runs `*.test.ts` directly under type stripping, its snapshots work unflagged, and
   `--watch` exists, so Vitest's watch-mode advantage is smaller than it looked. Tests under
   `web/src` are also type-checked by `astro check`, whose tsconfig includes everything, with
   `@types/node` already a dependency. No dependency and no lockfile change.
3. **The old rule's research scripts stop running,** and each one's header, and plan.md, records
   the last commit at which they still run. That is how the 11ty build is kept, at `06cd8e5`.
   `measure.mjs`, `m3.mjs` and `cross-dryrun.mjs` import `rankRelated`, `branchForType` and
   `genresForBranch`, which removing the old rule deletes. A frozen copy of the old rule was the
   alternative, and it would have bought less than it looked:
   - **`corpus.json` is the lab's, fetched 2026-11-06,** while the M1/M2 report was made from
     `production-26` on 2026-10-21. `measure.mjs` already cannot regenerate those numbers; run
     today, it writes a `report-m1-m2.recommendations-lab.md` beside them.
   - **`m3.mjs` queries the lab's embeddings live,** so it was never reproducible from the
     repository alone.

   A checkout of the recorded commit recovers everything still recoverable.
4. **The Studio tool is a stream of its own,** after this one merges. The merge is what reaches
   the six pages falling back to "Recent", and the tool should not hold it. The tool is a new
   Studio surface with its own seams — what it counts, where it sits, a pane or a document view —
   that want their own kickoff, and it is where the module is promoted. Until then the module
   stays ready to share: pure functions, no Astro imports.
5. **Development runs against the lab throughout,** not only "until stream 1's swap", which has
   happened. The lab was identical to production at the switch, and the golden test's fixture
   comes from it. **Andy's go-ahead is asked for at verification only:** the site build against
   `production-26`, the first push (which runs `checks.yml`'s build), and the preview rehearsal.

## The sources

| What | Where |
|---|---|
| The ranker: `rankAcross`, `CROSS_RULE`, `RankRule` and its tie-break, the genre-first fallback | `web/src/lib/related.ts` on `recommendations-research` (`main` has only the old rule) |
| Genre subtrees | `web/src/lib/genres.ts` → `subtree` |
| The pool query: each topic's first parent and `parentIsTop` | `web/src/sanity/queries/related.ts` |
| The page wiring, labels, and cards linking to their own collection | `git stash list`: "cross-category wiring of pages and RelatedBand, for promotion (2026-10-28)" |
| The rules and labels, specified | [plan.md](plan.md) → Specs → Cross-category ranking |
| What each rule is for, and what was tried | the comments in `related.ts`, and plan.md's Phases 1, 3b and 3c |

The stash predates the tie-break (2026-11-06), so the wiring needs the page's `genreId` and the
rule's `tieBreak` added. It touches `insights/[slug].astro`, which `main` has changed since, so
expect a conflict.

## The work, in reviewable pieces

1. **The test runner and its gate.** A root `pnpm test` that runs every package's tests, and a
   step in `checks.yml` beside the four code gates. Prove the gate the project's way: a run with
   one deliberate failure must turn red ("it is not known to work until it fails").
2. **The module, ported, with unit tests.** Port `rankAcross` and its helpers from the research
   branch, with their comments. Test them on small, made-up taxonomies and pools, one rule per
   test:
   - **the tiers:** shared, nearer (either direction), sibling, and a sibling under a top concept
     counting for nothing
   - **union normalization,** and the lexicographic order
   - **crossing:** at least 2 shared tags and a ratio of 0.5, at most one card, strictly
     outranking the third or filling a gap, and nearer or sibling never crossing
   - **the fallback:** the page's own genre first, then newest
   - **self-exclusion,** a document with no genre, and a concept with two parents, where only the
     first counts
   - **the tie-break,** with scores and without
3. **The golden test.** A committed fixture of the lab's 73 documents: ids, types, genres,
   pubDates and topic shapes, with no text. The test checks two sets of lists:
   - **with v5's scores,** every list must equal M3.5's v5 column, which proves the port is
     faithful to what Andy judged
   - **without scores,** the lists that will ship. Snapshot them once, and have Andy look at the
     pages that differ from v5, the small variation he accepted.
4. **The wiring.** Apply the stash onto `related-ranker`, resolve the conflict, and add
   `genreId` and the tie-break. `RelatedBand` gets the new labels and links each card to its own
   collection. Rewrite `CROSS_RULE`'s comment, since its values (0.5, 2, 1) are already the
   relaxed rule. Develop against the lab with `PUBLIC_SANITY_DATASET=recommendations-lab`
   (decision 5). The stash is `stash@{0}` in the stack every checkout shares, so apply it by its
   SHA, `7923b1c6`, and never pop it.
5. **Remove the old rule:** `rankRelated`, `branchForType`, `genresForBranch` and the `parent`
   projection the branch rule used, with the scripts handled as decided above.
6. ~~**The Studio tool, if it's in this stream**~~ **A stream of its own** (decision 4): a pane
   listing every tagged piece, with how many other pieces' lists it appears in, and which. It
   runs the shared module over one GROQ pool query in the Studio. This is where the module moves
   to a package, as its second consumer.
7. **Merge.** Stream 1's swap is done (2026-11-21), so nothing waits on it. Verify, then hand
   Andy the eyeball steps.

## Verification

- `pnpm test`, `astro check`, the Studio typecheck and Prettier, as code gates.
- **Every built page's related band equals the module's output** for that page. On 2026-10-28
  the same check passed on all 73 pages; the corpus and the rule have moved since, so re-run it.
- The site gates: `pnpm links`, `validate`, `a11y` and `budgets`.
- **Rehearse on the preview host** with `workflow_dispatch` on the branch before merging.
- **Andy's eyeball steps:** the band's heading changing when a card crosses; a cross card
  linking into its own collection; a page that falls back to Recent; and the pages the golden
  test flagged as different from v5.

## What could go wrong, and the guard for each

| Risk | Guard |
|---|---|
| The port drifts from what Andy judged | The golden test against M3.5's v5 column, with scores |
| The live lists change more than accepted | The no-scores snapshot, reviewed page by page before merging |
| The stash no longer fits `main` | Applied onto a fresh branch, and the page-by-page band check |
| A test gate that never fails | Proved red with a deliberate failure |
| Scores arrive later and break the ranker | The module treats a score as optional, and a test covers both cases |
