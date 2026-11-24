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

   **DONE 2026-11-21** (`106ffe0`). Node's `node:test`, with two guards a test gate needs:
   `web/scripts/require-tests.mjs` fails a run that ran no tests, and the step's
   `timeout-minutes` stops a hang, which `--test-timeout` cannot. Proven red locally; green on
   the runner, and not proven red there (Andy: skipped, on the strength of the local proof).
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

   **DONE 2026-11-21.** `related.ts` is the research branch's file unchanged, so
   `git diff recommendations-research -- web/src/lib/related.ts` is empty; its stale comments
   wait for piece 4. `related.test.ts` holds 33 tests, and each test that expects nothing to
   cross re-runs with that rule loosened, to show the card crossing then. **The tests were
   checked by breaking the module:** ten rules removed one at a time, each turning at least one
   test red. The first pass caught two misses. One was a real gap, an assertion on ids alone,
   which a fallback to the same card satisfies, now fixed. The other was a badly made break.
3. **The golden test.** A committed fixture of the lab's 73 documents: ids, types, genres,
   pubDates and topic shapes, with no text. The test checks two sets of lists:
   - **with v5's scores,** every list must equal M3.5's v5 column, which proves the port is
     faithful to what Andy judged
   - **without scores,** the lists that will ship. Snapshot them once, and have Andy look at the
     pages that differ from v5, the small variation he accepted.

   **DONE 2026-11-21. Andy reviewed the differences below and accepted the no-scores lists**,
   all 12 swaps included, so the snapshot is the reviewed record of what stream 2 ships on the
   judged corpus. Rewriting it is a new decision, to be made the same way.
   `golden-fixture.mjs` writes `web/src/lib/related.golden.json` from `corpus.json`,
   `tagsets/v5.json` and `m3.5.md`, reusing `topicShaper` and `withTagSet` so the pool is the one
   M3.5 ranked. `related.golden.test.ts` holds the two checks, the second as a node:test snapshot
   beside it. Slugs key the lists, so a failure reads.
   - **The port is faithful:** the ported module reproduces M3.5's v5 column on all 73 pages.
   - **The two halves guard different things,** shown by breaking the module: ignoring tag
     strength fails only the v5 check, and ignoring genre fails both.
   - **Without scores, 19 of 73 lists differ from v5.** 7 only reorder the same three cards
     (`content-review-approval-workflow-integration`, `yes-and-…-artificial-intelligence`,
     `taxonomy-boot-camp-2022-themes-takeaways`, `choosing-card-sorting-topics`, `delivering-ia`,
     `desiring-ecologies`, `information-design`). 12 swap one card.
   - **Measured against Andy's latest picks in M3.5, the cost is one page.** v5 shows the pick on
     40 of 73, matching "Where things stand" in plan.md, and the no-scores lists on 39. Of the 12
     swaps, 4 gain the pick, 5 lose it and 3 change neither:

     | Page | Drops | Adds | Pick |
     |---|---|---|---|
     | `ai-taxonomy-term-generation` | `deskilling-large-language-models` | `ai-supported-auto-categorization` | gains |
     | `deskilling-large-language-models` | `keyword-extraction-nlp` | `ai-supported-auto-categorization` | gains |
     | `keyword-extraction-nlp` | `deskilling-large-language-models` | `ai-taxonomy-term-generation` | gains |
     | `structured-content-design` | `structured-content-design-22` | `domain-modeling` | gains |
     | `sanity-studio-taxonomy-migration` | `taxonomy-management-and-use-in-sanity-studio` | `ranked-lists-of-related-content-in-sanity-studio` | loses |
     | `beyond-the-page-with-structured-content` | `information-architecture-for-digital-content` | `browsability-with-dan-brown` | loses |
     | `taxonomy-and-the-headless-cms` | `taxonomy-boot-camp-2022-themes-takeaways` | `designing-content-authoring-experiences` | loses |
     | `site-maps-connected-content` | `structured-content-headless-cms` | `site-updates-structure-semantics-standards` | loses |
     | `responsive-information-architectures` | `the-trouble-with-systems` | `seattle-childrens` | loses |
     | `knowledge-graphs-and-ia` | `boutique-knowledge-graphs-building-smart-content-at-any-scale` | `ai-assisted-content-operations-in-practice` | neither |
     | `boutique-knowledge-graphs-building-smart-content-at-any-scale` | `knowledge-graphs-and-ia` | `beyond-the-page-with-structured-content` | neither |
     | `conversations-with-robots` | `structured-content-headless-cms` | `site-updates-structure-semantics-standards` | neither |

   - **Of the six pages on "Recent" since stream 1's A9,** five are in the fixture, and only *The
     Calm Before the Storm* still falls back, as it does under v5. *Ontology Pipeline* is not
     among the 73; the build in piece 4 shows its list.
4. **The wiring.** Apply the stash onto `related-ranker`, resolve the conflict, and add
   `genreId` and the tie-break. `RelatedBand` gets the new labels and links each card to its own
   collection. Rewrite `CROSS_RULE`'s comment, since its values (0.5, 2, 1) are already the
   relaxed rule. Develop against the lab with `PUBLIC_SANITY_DATASET=recommendations-lab`
   (decision 5). The stash is `stash@{0}` in the stack every checkout shares, so apply it by its
   SHA, `7923b1c6`, and never pop it.

   **BUILT 2026-11-23 against the lab, and eyeballed by Andy the same day:** the headings, the
   cross cards linking into their own collection, and the fallback. The stash applied
   with no conflict: the 3-way merge absorbed `main`'s later changes to the insight page. It is
   still in the stash stack, since `apply` leaves it there. Beside it:
   - **`RANK_RULE`** in `related.ts`, `CROSS_RULE` plus the genre tie-break, is what both pages
     pass and what the golden test ranks under. One value for its two consumers, the project's
     promotion rule. `CROSS_RULE` keeps its name, so the docs that cite it stay right.
   - **The page's `genreId`**, from its own pool row, and the research's `broader` projection on
     genre concepts, with TypeGen re-run. `parent` stays until piece 5.
   - **Comments rewritten** where they were stale: `CROSS_RULE`'s "PROVISIONAL", the tie-break's
     "M3.4 is the test", and both pages' 2026-10-28 counts.

   **Verified against a production build of the lab** (76 documents, 2026-11-23):
   - **The band check passes on all 76 pages:** every built band's heading and card links equal
     `rankAcross` under `RANK_RULE` over the lab's pool, fetched with the site's own query.
     Re-run expecting `CROSS_RULE` without the tie-break, it flags 9 pages, so it can fail. Its
     first run reported 33 false mismatches, all from its own parser stopping at a card's
     nested `<ul class="card-tags">`.
   - **Headings:** 28 "Related Insights", 18 "Related Insights & Presentations", 12 "Related
     Presentations", 17 "Related Presentations & Insights", 1 "Recent Insights".
   - **Of the six pages on "Recent" since stream 1's A9, five now have a related list.** Only
     *The Calm Before the Storm* falls back, as it does under v5.
   - The tests, `astro check`, Prettier, and the site gates over that build: links, HTML
     validation, budgets and accessibility.

   Not yet checked against `production-26`, which may have moved since the switch: that build,
   the first push and the preview rehearsal wait for Andy's go-ahead (decision 5).
5. **Remove the old rule:** `rankRelated`, `branchForType`, `genresForBranch` and the `parent`
   projection the branch rule used, with the scripts handled as decided above.

   **DONE 2026-11-23.** Gone from `related.ts`: the three functions, the `Branch` type, and
   `RankedRelated`, folded into `RankedAcross` as its only user. Gone from the query and
   `GenreConcept`: the genre concepts' first `parent`. The topics' `parent` stays, since the
   tiers relate through it; the query's comment now says why the two differ. The one argument
   `genresByCategory` had borrowed from `genresForBranch`, why a top concept's label is
   load-bearing, moved into its own comment.
   - **Nothing a visitor sees changed:** a lab build after the removal is byte-identical to
     piece 4's, all 89 pages and every asset, and the band check still matches on all 76.
   - **The scripts (decision 3):** `measure.mjs`, `m3.mjs` and `cross-dryrun.mjs` each open
     with a header naming `b4e85bd`, the last commit with the old rule, and fail as it says, on
     the missing `branchForType` export. plan.md's script table says the same, as does the
     Phase 6 note that proposed a frozen copy.
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
