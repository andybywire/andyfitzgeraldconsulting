# The Project Graph experiment: results and recommendation

**Stage 6, written 2026-10-20,** once Andy had checked the 15 deciding grades and found them
sound. The figures come from [grading/results.md](grading/results.md), which
`harness/results.mjs` rebuilds from the record. The rules they are read against are
[protocol.md](protocol.md) → "How the results are read", fixed before any run.

## In short

- **Ids and a glossary (arm B) beat the comments as they are (arm A), on the one task that told
  the arms apart.** B found 8 of 11 known contradictions to A's 6, and cost less doing it. By the
  protocol's rule, the annotation discipline earns its place.
- **The RDF layer (arm C) did not beat B.** It found 9 to B's 8, short of the margin of two, and
  cost 1.65 times as much. By the protocol's rule, it has not earned its place at this scale.
- **The evidence is thin.** Only one of five tasks separated the arms, at one run each, and both
  verdicts sit one grade from flipping.
- **Recommendation: drop the RDF layer, and keep B's discipline only if the upkeep proves cheap.**
  Measure that with the maintenance probe the protocol deferred. Carry the one thing the graph did
  that mattered, flagging a comment that relies on an overturned claim, into B as a small lint.

## What was tested

Andy's hypothesis: treating this repo's comments as a knowledge graph, with a SKOS vocabulary,
SHACL shapes and a small PROV-O subset, makes the context a change needs **cheaper to retrieve**
(H1) and **more trustworthy** (H2) than grep over prose. Three arms, all from `086dd0f`, on the
focus-and-visibility area:

- **A:** the comments as they are.
- **B:** the same comments tagged with concept and claim ids, plus a plain-text glossary.
- **C:** B's tags, plus the vocabulary and claims in Turtle, saved SPARQL queries and a SHACL check.

B and C carry identical tags from one blind annotation, so the difference between them is the
semantic layer alone. Each arm answered five questions in a fresh headless session: 15 runs, one
per task per arm. A blind headless grader scored the answers against the rubrics, and Andy checked
every grade that could change a verdict.

## Results

| | A | B | C |
| --- | --- | --- | --- |
| T1, find the precedent (of 5) | 5 | 5 | 5 |
| T2, every place a rule change touches (rows of 7) | 7 | 7 | 7 |
| **T3, hard contradictions found (of 11)** | **6** | **8** | **9** |
| T3, other claims judged not real | 0 | 2 | 5 |
| T4, a settled decision kept (of 5) | 5 | 5 | 5 |
| T5, the control question (of 3) | 3 | 3 | 3 |
| Cost, T1 to T4, at list price | $7.28 | $6.73 | $11.09 |

**Read by the rules:**

- **B beats A on T3, by exactly the margin,** and doesn't cost more. B found three contradictions
  that A missed: a forced reflow one script does and another skips (#4), a kickoff doc saying the
  search toggle ships `hidden` (#6), and the contact form's Back-button reset using the very
  attribute its own comment rules out (#11). A found one B missed: ring radii said to be a
  `calc()` that doesn't exist (#3). Each of B's three gains joins statements in different places
  that are about the same concept, which is the mechanism the tags exist for.
- **C does not beat B.** C found everything B did plus #3: a gap of one. Its cost was 1.65 times
  B's, under the 2× at which cost counts, so it neither loses nor wins there.
- **No arm separates on T5,** the question outside the tagged area, so by the protocol's rule the
  other results aren't suspect. T5 was at a ceiling too, though, so it could only have caught a
  large effect of the CLAUDE.md sections, not a small one.
- **On the hypothesis:** H2, trust, is supported for ids and a glossary over plain comments, on one
  task. It is not supported for the semantic layer over ids. H1, cost, is not supported at all: C
  cost the most, A and B were close, and B was the cheapest.

## How much weight it can bear

- **Only T3 discriminated.** Every arm scored perfectly on T1, T2, T4 and T5. That is a ceiling,
  not a tie: those questions were answerable from well-written comments with grep alone, which says
  as much about this repo's comments as about any arm. The verdicts rest on three answers.
- **One run per cell, and both verdicts at the edge.** One wrong grade among B's eight credits or
  A's five misses would undo B's win; one wrong grade the other way would hand C a win over B. Andy
  checked all of them and they stand, but checking catches grading errors, not run-to-run noise.
  A second run of T3 could move a count by one or two. The protocol ruled out later rounds before
  any run, so that no result could prompt one, and that holds.
- **The 11 contradictions are not all there are.** The grader judged a further 26, 16 and 34
  disagreements real in A's, B's and C's answers. Recall is scored against the 11 the inventory
  verified, so this is reported, not scored. It does say the audit task has more in it than the
  answer key does.
- **C claimed the most disagreements that weren't real:** 5, to B's 2 and A's 0.
- **No arm found #5 or #7.** #7 is a grid said to be focused only by script, while a click in its
  gutters focuses it too. The annotation recorded both sides as separate claims about the same
  concept, so B's glossary lists them and C's `about landing-point` query returns them together.
  Neither arm put them side by side in its answer.
- **Tool counts are incomplete for two runs.** C and A started subagents on T3, which the tool list
  didn't refuse. Their costs include the subagents; their tool counts don't. And C's T2 run had five
  graph commands refused for using an absolute path or a shell loop: friction only C pays.

## What the graph did that the tasks didn't measure

The tasks asked an agent a question and scored its answer. Asked directly, every arm caught the
wrong ContactForm comment that started this experiment: T1's point 4 went to all three.

**Where the graph earned something was before any question was asked.** When the blind annotation
merged ContactForm's "no ring" comment with the belief CardMasonry records as measured wrong, the
SHACL check flagged `ContactForm.astro:549` as relying on an overturned claim. That is the
2026-10-16 incident, caught by a standing check for the $11.28 the annotation cost. The guide's
trial did the same on other material, surfacing a DESIGN.md paragraph a correction never reached.

That is a maintenance-time benefit, and the protocol's maintenance probe was deferred until an arm
earned its place. **It needs ids and a record of what overturned what. It doesn't need RDF:** B's
glossary already records each overturning as an "Overturns" line beside the claim that does it.

## Against my predictions

Recorded before any run:

- **Right:** B captured most of C's gain, and T5 didn't separate the arms.
- **Wrong:** A did far better than predicted, at 6 of 11 on T3 where I said at most 4, and 7 of 7 on
  T2 where I said 0.6 at most. And C cost more, not less: 37% more than A on T1, and more tool calls
  than A on T2, where I predicted 30% fewer.

Grep over dense, deliberate comments is a stronger baseline than I gave it credit for.

## Recommendation

Cuts first, then what to keep.

1. **Drop the RDF layer as a way to retrieve context.** Its one extra find over B fell short of the
   margin, and it cost 1.65 times as much, made the most false claims, and was the only arm to hit
   tool friction. Leave `pg-arm-c` and the `project-graph/` tooling unmerged.
2. **Keep B's discipline only if the upkeep is cheap, and measure that before committing.** The
   protocol's rule is that maintenance counts against the gains, and B has now earned its place, so
   the deferred probe is due: add one new script-focused element to B, and record what it takes to
   keep its tags and glossary valid. If that costs more per change than an audit pass, **drop
   both**, and run an audit agent now and then instead. Arm A's T3 run is that audit pass: $5.34,
   for 6 of 11, with no upkeep at all. If the upkeep costs less, adopt B.
3. **If B is adopted, give it one check: a comment that cites an overturned claim fails.** A lint
   over the ids and the glossary's "Overturns" lines does what the SHACL check did at annotation
   time, for the failure the experiment started from. Prove it by failing on `pg-arm-b`, where
   `ContactForm.astro` cites the claim CardMasonry overturned. Nothing else from arm C is needed.

The decision to adopt, trim or drop is Andy's.

## What it cost

**$46.93 at list price for stage 5 and grading,** against a $200 ceiling:

- canaries, a probe and the guide trial's rerun, $5.51;
- the blind annotation, $11.28;
- the 15 runs, $26.47;
- the grader, $3.67.

The 15 runs took about 26 minutes and the grader 8. Every record is under [runs/](runs/) and
[grading/](grading/), with transcripts kept out of git.
