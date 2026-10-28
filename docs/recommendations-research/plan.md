# Recommendations research: plan

*Living document. Started 2026-10-21; this version 2026-10-28. Branch: `recommendations-research`.*

## What this is

The work began as notes for one article on taxonomy-based related content. Measurement M3 turned it
into a research project. Its question is **what a taxonomy contributes to a project that also has
embeddings**. The project runs over many sessions, and an article (or several) and a Taxonomy
Manager starter prompt come at the end.

| Doc | Holds |
|---|---|
| `plan.md` | This file: phases, decisions, specs, open questions |
| [value-add.md](value-add.md) | The "why": what a taxonomy adds over embeddings, and where it doesn't |
| [how.md](how.md) | The "how": the steps a reader should take, as we discover them, including what failed |
| `report-m1-m2.md`, `report-m3.md` | Measurements from 2026-10-21, before any taxonomy work |
| `fetch-corpus.mjs`, `measure.mjs`, `m3.mjs` | Measurement scripts, read-only. Run `fetch-corpus.mjs` first; it writes `corpus.json` beside itself |
| `lab-api.mjs` | The authenticated client the writing scripts share: token from `sanity exec`, and writes to `production-26` refused |
| `tags-backup.mjs`, `tags-restore.mjs` | Snapshot every document's tag fields, and put them back exactly. Restore is a dry run unless given `--write` |
| `backups/` | Committed tag snapshots: the revert points |
| `score-spike.mjs`, `spike-report.mjs`, `scores/` | The score matrix for every document and concept (spends quota), and its analysis (spends none) |
| `report-spike.md` | How the scores behave, which normalization to use, and threshold tables |
| `baseline.mjs`, `baseline-columns.mjs` | The embeddings-only baseline: raw rankings per page (spends quota), and the two M3 columns derived from them (spends none) |
| `cross-dryrun.mjs` | The cross-category ranker run over `corpus.json`, on the hand tags or a tag set: categories, the effect of the category change, crossing counts by threshold, and the cross cards a rule produces (spends none) |
| `tagger.mjs`, `tagset.mjs` | The tagger, a pure function from a score matrix to tags, and its runner, which writes one simulated tag set (spends none, writes no dataset) |
| `tagsets/` | Committed tag sets, one file per version: `v0.json` and on |

## Ground rules

Andy, 2026-10-28. These hold until he lifts them, and they outrank anything later in this file.

- **Nothing in this project touches the live site or `production-26` until Andy explicitly says
  so.** That covers reads as well as writes:
  - **Scripts use the lab only.** `DATASET=production-26` stays unused, and `lab-api.mjs` keeps
    refusing writes there without `--allow-production`. The reports committed on 2026-10-21 were
    made from `production-26` before this rule existed.
  - **No site builds.** `pnpm --filter web build` reads `production-26`, so the site's checks
    (`links`, `validate`, `a11y`, `budgets`) are out too. So is a push of this branch, which runs
    the same build in `checks.yml`. Pushes were already Andy's call.
  - **No merge to `main`.** A merge touching `web/**` deploys production.
- **No changes to the site's pages or templates until the test is finished and the results are
  being rolled in.** The research runs the ranker in memory against simulated tag sets, and that
  needs no page to change. Page work happens in the Promotion phase.

## Decisions

Newest first.

- **2026-10-28.** **The taxonomy's crossing rule is at least 3 shared tags, a shared ratio of at
  least 0.40, and at most 1 cross card** (Andy). It is calibrated on tag set v0 and held fixed
  through revisions 1–3, so each M3.n column measures the vocabulary, not a moved bar.
  - **Where it lives:** `TAXONOMY_CROSS` in `baseline-columns.mjs`, beside the embeddings rule
    `CROSS`. `CROSS_RULE` in `lib/related.ts` keeps its provisional values (0.5, 2, 1) until
    promotion, when it takes the research's final rule.
  - **Why 3 tags:** it crosses on 15 pages against the embeddings column's 19, and 12 of the 15
    also cross under embeddings. It recovers 5 of the 12 strongest embeddings crossings, most of
    them the same work in two forms; the hand tags recovered none. Requiring 2 tags can't get near
    19 (see Phase 1).

- **2026-10-28.** **v0 keeps "more specific wins," and the overlap it exposed goes to revision
  1** (Andy). The rule drops some broader concepts that are plainly a document's subject: *What
  Is Information Architecture?* loses Information Architecture (0.814, its best match) to
  Navigation Design (0.571). The cause is the vocabulary, not the rule: Navigation Design's
  definition reads like IA in general, so it shadows IA on IA-centric pages. Revision 1 fixes the
  definition, which tests what the taxonomy contributes. Changing the rule would have the tagger
  cover for a weak definition.
  - **Measured, the alternative:** when a pair collides, keep the higher score. That changes 15
    documents and restores IA on the IA-titled pages, putting IA on 15 documents and Navigation
    Design on 8. But it reproduces fewer hand tags: 83 of 207, against v0's 90. Hand tags tend to
    be specific, so they favor the current rule, and they're a weak benchmark.
  - **The cost, accepted:** until revision 1, v0 shows IA missing from IA pages, and M3.0 will
    reflect it.

- **2026-10-28.** **The page wiring moves to promotion, and the two ground rules above were set**
  (Andy). Simulated runs call `rankAcross` from `lib/related.ts` directly, so the pages never
  needed to change for the research.
  - *The wiring was built and verified anyway (73 of 73 built pages matched the ranker). It came
    from following this plan's Phase 1 list without asking whether M3.0 needed it, which is the
    same mistake as the 2026-10-26 "tag resources" one.*
  - It was rolled back and kept as a git stash for promotion; see phase 6.
  - Verifying it read `production-26` twice, with a corpus fetch and a site build. Both were
    reads, and both came before the rule.

- **2026-10-27.** **The taxonomy's crossing rule also needs a minimum count of shared tags,
  `crossMinCount`** (Andy). A ratio alone let one shared tag between two thinly tagged documents
  count as strong. Provisionally, `CROSS_RULE` in `lib/related.ts` is `crossMinShared` 0.5,
  `crossMinCount` 2 and `crossMax` 1. On the hand tags that crosses on 26 of 73 pages. Both
  values are calibrated on tag set v0.

- **2026-10-27.** **"Embeddings, same rules" crosses at `crossMin` 0.70, with at most one cross
  card** (Andy). That's 9 of 44 insight pages and 10 of 29 presentations. At 0.80 only exact
  same-work pairs crossed; the band down to 0.70 was still mostly topical.
- **2026-10-26.** **Evaluation is simulated, and the baseline is made fair** (Andy):
  - **Tag rounds are simulated in memory.** The tagger turns a score matrix into a tag set per
    version, saved as a file, and the site's real ranker runs over it. No tags are written to the
    dataset until the manual audit and promotion. So the `topicScores` schema field waits until
    then. *The plan said "tag resources" from the start, and it was taken to mean "write tags"
    without asking whether evaluation needed it. It doesn't.*
  - **M3.0 has two embeddings columns:** unrestricted, which is what embeddings alone would show,
    and the same category rules as the taxonomy, which isolates what the vocabulary adds.
  - **The embeddings baseline searches with the title, summary and opening of the body**, not the
    title and summary alone. That way the baseline isn't a strawman.
- **2026-10-26.** **The tagger's scale, thresholds and minimum** (Andy), after the score spike:
  - **The anchored 0–1 scale.** Accuracy was the same as raw (AUC 0.765 against 0.767); this one
    is readable.
  - **Round-0 bands:** up to 3 tags at ≥ 0.45, then up to 3 more at ≥ 0.54.
  - **At least one tag per document.** A thin document that clears neither band keeps its best
    concept. Andy's call, over the recommendation to leave it untagged and flagged. The trade is
    some wrong tags, like *Proust and the Squid*'s top match, against no document falling back to
    "Recent". Such a tag stays bumpable, so later rounds can correct it. *That match is
    Discoverability on raw scores, the order report-spike.md lists them in, and Responsive Design
    on the anchored scale the tagger uses: 0.272 against 0.259.*
- **2026-10-26.** **When a concept and its broader both qualify, the more specific one is kept**
  (Andy). This is the indexing rule of specificity, and the ranker's "nearer" tier already infers
  the parent. A **rule of N** stays a configurable variant, **off in round 0**: a document
  qualifying for N or more children of one broader concept gets the broader concept instead.
- **2026-10-26.** Six open questions settled (Andy):
  - **The Best row in M3.n is left blank,** and Andy pastes ✅ into the cell of the version he
    judges best. It is easy to scan, and the extract script can read it.
  - **The embeddings column** is the unrestricted top 3. It is computed once in M3.0 and reused,
    because the experiment changes no content text, only tags and concepts.
  - **The Hand tags column** is in M3.0, as the baseline.
  - **No document carries both a concept and its own broader concept.** The parent can be
    inferred, so carrying both is redundant. The hand tags already nearly follow this rule: 7
    pairs on 5 of 73 documents, measured in the lab on 2026-10-26.
  - **`topicScores` is read-only and collapsed** in Studio.
  - **Quota** is about 55 tagging queries a round, plus refreshes. Embeddings results are cached
    across M3 runs.
- **2026-10-22.** **The lab is set up: `recommendations-lab`**, a faithful copy of `production-26`.
  See "Where the experiments run" for how it was made and checked.
- **2026-10-22.** **The experiments run in a lab dataset** (Andy). The old `production` dataset was
  exported to `~/Archives/afc/2022-production-dataset-2026-10-22/production.tar.gz`, and **Andy
  deleted it** to free the slot.
  - **Contents:** 221 documents (209 published and 12 drafts) and 280 assets, 241 MB. That includes
    the four `service` documents.
  - **Checked against the live dataset before deleting:** every published ID was present.
- **2026-10-22.** The tagger gets a common score scale by **normalizing Sanity's scores, after a spike**
  to see how they are distributed. Sanity's `_score` is not 0–1 and cannot be compared across
  queries, so thresholds wait for real numbers.
- **2026-10-22.** A tag's match score lives in a **parallel field**. `topic` stays an array of
  references, unchanged, and a new `topicScores` holds `{concept, score, round, scoredAt}`. A tag
  in `topic` with no score entry is author-added and is never bumped.
- **2026-10-22.** The first auto-tag round **retags from scratch**, after a backup. Author tags first
  appear at the manual audit.
- **2026-10-22.** There are **two categories, Insights and Presentations.** Insights covers articles,
  case studies and notes.
- **2026-10-21.** Andy reviewed M3: many embedding matches beat the taxonomy's. Others match on *form*
  (conference recaps find conference recaps) and miss *topical* matches deeper in the archive. The
  article is paused for this research.
- **2026-10-21.** Dataset embeddings are on for `production-26`. The projection is per type, with no
  transcripts; it is in `report-m3.md`'s header and in the
  [how.md](how.md#enable-dataset-embeddings-with-a-projection-per-type) step.

## Where the experiments run: a lab dataset

**Decided 2026-10-22.** The Free plan allows two datasets, and the second slot came from the old
`production` dataset.

- **Why.**
  - **Publishing continues.** The live site keeps publishing and deploying, with its webhook on.
  - **Live URLs stay safe.** Taxonomy restructuring cannot break facet URLs (`?topic={slug}`) or
    the `/insights/tag/` redirects partway through.
  - **The preview is unaffected.** It reads drafts per request, so it would otherwise show every
    experimental write at once.
- **How it was made (2026-10-22).**
  1. The old `production` dataset was exported to the archive, and Andy deleted it.
  2. **No cloud copy is available:** `sanity datasets copy` is refused on the Free plan ("advanced
     dataset management"). The lab was made by export and import instead: published documents
     only, **with assets** (1,033 files, 1.1 GB).
  3. **The first import left out the assets, and that was a mistake.** It also stripped the body
     figures, along with their alt text, from 17 documents, and embeddings scores drifted. It was
     re-imported in full; see [how.md](how.md#what-didnt-work).
  4. Embeddings were enabled with the same projection as `production-26`.
- **How it was checked.** Every embedded field, tag and taxonomy relation matches `production-26`
  across 148 documents. The only difference is cosmetic: `broader[0]._weak: false` is omitted on 11
  concepts, which means the same thing. A semantic probe ranks identically, with scores within 0.01.
- **The webhook can't fire for the lab.** The project's only webhook ("Publish Update") is scoped
  to `production-26`.
- **Working in it:**
  - **Studio:** `pnpm --filter studio dev:lab` serves the lab on :3031, titled "AF Consulting · LAB",
    with Presentation left out, since it previews `production-26`. The deployed Studio is
    unchanged; `studio/sanity.config.ts` says why this is an env var and not a second workspace.
  - **Scripts:** `node fetch-corpus.mjs` reads the lab by default, and `DATASET=production-26` reads
    the live dataset, which is not to be used without Andy's go-ahead (see Ground rules).
    `measure.mjs` and `m3.mjs` take the dataset from `corpus.json`. Reports from
    any dataset other than `production-26` are named `report-*.<dataset>.md`, so the committed
    reports are never overwritten.
- **Cost.**
  - **Promotion at the end:** move the concept and scheme documents into `production-26`, then
    re-run the tagger there. It is deterministic, at about 55 queries.
  - **The lab won't hold new pieces.** Anything published live during the experiment is not part
    of it.
- **If we stay on `production-26`** (Andy's first plan):
  - the webhook stays off for the whole experiment
  - no merge to `main` that touches `web/**`, since any deploy ships the experimental tags and
    taxonomy
  - the preview shows every write
  - taxonomy renames need a pass over the redirects

## Phases

Each phase is one or more review stops. **"Retag" means:**
1. re-score whatever concepts changed
2. run the tagger to produce the next tag-set file, *simulated, with nothing written*
3. generate the next M3.n from it

Tags reach the lab dataset only in phase 5. Nothing reaches `production-26` or the site before
phase 6, and phase 6 waits for Andy's go-ahead.

### 0. Setup

- [x] Tracking docs (this folder)
- [x] Decide where the experiments run: a lab dataset (above)
- [x] Set up the lab: copy `production-26` with its assets, enable embeddings, add a local Studio
      switch, and parameterize the scripts by dataset
- [x] **Back up tags** (2026-10-26). The first backup is
      `backups/tags-recommendations-lab-20261026T234921Z.json`: 73 documents, 71 tagged, no drafts.
      - **Checked** against public reads of both the lab and `production-26`, with every `topic`
        identical and array `_key`s kept.
      - **Restore tested on one document:** `proust-and-the-squid`'s tag was swapped and a
        `topicScores` entry added. A dry run flagged that document alone, `--write` put back the
        original tag with its original `_key` and removed the scores, and a full dry run then
        reported 0 differences.
      - **The guard holds:** writes to `production-26` are refused without `--allow-production`.

      Run both from the repo root:

      ```bash
      pnpm --dir studio exec sanity exec ../docs/recommendations-research/tags-backup.mjs --with-user-token
      pnpm --dir studio exec sanity exec ../docs/recommendations-research/tags-restore.mjs --with-user-token -- --id <documentId>
      ```

      **Take a fresh backup before every tagging round.** Restore picks the newest lab backup
      unless given `--file`.
- [x] **Score spike** (2026-10-26). `score-spike.mjs` scored 73 documents against 55 concepts (55 queries) into `scores/spike-recommendations-lab-20261026T235419Z.json`. `spike-report.mjs` reads that matrix, spends no quota, and writes `report-spike.md`. What it found:
      - **Raw scores are nearly comparable across concepts after all.** Every concept's floor sits
        between 5.0 and 6.1, never at zero, but the spread inside a concept (2–3 points) dwarfs the
        spread between concepts (about 1).
      - **No normalization that ignores the corpus beats raw.** Global AUC against the hand tags:
        raw 0.767, a fixed-floor 0–1 scale 0.765, self ratio 0.762. The best number, 0.774, needs
        each concept's lowest document score, so it moves whenever something is published, which
        the incremental tagger can't live with. **So the scale is chosen for readability, not
        accuracy.**
      - **The signal is moderate:** 0.78 AUC within a concept, and 46% of hand tags in a
        document's top 4. The hand tags are incomplete, so that is a floor. M3.0 is the real test.
      - **The matches look sensible in the examples.** *Knowledge Graphs and IA* has no tags, and
        its top three are Knowledge Graphs, Information Architecture and Linked Data.
      - **Thin documents clear nothing.** At a cutoff covering the top 10% of pairs, six get no
        tags: short notes, and presentations whose text is only a description and highlights.
      - **Hubs are broad concepts.** Information Architecture is in 23 documents' top 4 and
        hand-tagged on 6. The specificity rule tames this: in 26 documents, a concept and its
        parent sit together in the top 4.
- [x] **Andy chose the scale, the starting thresholds and the minimum** (2026-10-26): the anchored
      0–1 scale, bands of 3 at ≥ 0.45 and 3 more at ≥ 0.54, and at least one tag per document.
      See Decisions and Tagger.

### 1. Pre-test (Taxonomy v0)

- [x] **The embeddings baseline** (2026-10-27). `baseline.mjs` ran 73 queries, one per page, and
      cached the raw rankings in `scores/baseline-recommendations-lab-20261027T004131Z.json`.
      `baseline-columns.mjs` derives both columns from that file at no cost. What it found:
      - **A query is read up to about 2,000–2,500 characters, and the rest is ignored without an
        error.** Measured on a 30,944-character article: its self-score went flat by about 2,000
        characters, and everything from 2,500 to 31,000 fell within the noise. So the query is
        title, summary and body opening, **capped at 2,500**.
      - **Identical queries vary by up to 0.003.** That's the reason to compute once and cache.
      - **The yardstick works.** 72 of 73 pages match themselves best. The exception, the *Yes,
        And* keynote, matches a related document more closely.
      - **Presentations give thin queries:** median 734 characters, against the cap of 2,500 for
        every article and case study. The baseline is weaker for them, and that comes from the
        content, not the method.
      - **Unrestricted embeddings cross categories all the time:** 24 of 44 insight pages, and 29
        of 29 presentations.
      - **The strongest crossings are the same work in two forms**, with anchored scores of
        0.78–0.98. *Conversations with Robots* appears as an article and a talk, *Boutique
        Knowledge Graphs* as a method and a talk, and *Domain Modeling* and *Deskilling* in two
        versions each.
- [x] **Andy set `crossMin` 0.70** for the same-rules column (2026-10-27). It's recorded as `CROSS`
      in `baseline-columns.mjs`, with at most one cross card. Both columns are now settled, and
      they're derived from the cached rankings whenever M3 needs them.
- [x] **Cross-category ranking: the logic** (2026-10-27). `rankAcross`, `genresByCategory` and
      `categoryForType` are in `web/src/lib/related.ts`, *beside* the old branch rule, so the pages
      still build. The changes:
      - **One genre walk.** `lib/genres.ts`'s `subtree` is exported, since the ranker is its
        second consumer.
      - **One query change.** `RELATED_POOL_QUERY` projects each genre's full `broader`, and
        TypeGen was re-run.
      - **One import with a `.ts` extension,** the first in `src/`, so the research can load the
        ranker under plain Node.
      - **Checked:** `astro check` reports 0 errors, warnings or hints. M1/M2's guard confirms
        the old ranker is unchanged on 73 of 73 pages.

      `cross-dryrun.mjs` ran it on the hand tags:
      - **The categories are right.** Insights is Document and 7 genres; Presentations is
        Presentation and 5. No page sits outside a category or disagrees with its type.
      - **The category change alone changes 12 of 73 lists** (6 notes, 6 articles).
      - **The crossing bar is coarse on hand tags.** Pages crossing go 52, 46, 35, 32 at a bar of
        0.25, 0.33, 0.40, 0.50, then 2 at 0.67. With 2–4 tags per document, the shared ratio
        takes few values, so nothing lands near the embeddings column's 19.
      - **What crosses at 0.50 is mixed.** Many crossings hang on one shared tag. Requiring two
        shared tags trims 32 to 26, but a pair like *UW Medicine* ↔ *Taxonomy Management* still
        crosses.
      - **The hand tags miss the same-work pairs that embeddings rank strongest.** For example,
        the *Conversations With Robots* talk crosses to *Flying Cars*, not to its own article.
- [x] **Tagger** (2026-10-28), as a pure function in this folder (see spec): score matrix, config
      and author tags in; a tag set per document out. It may later move into Taxonomy Manager.
      - `tagger.mjs` holds it, with no I/O. `tagset.mjs` runs it over a cached matrix and writes
        `tagsets/<version>.json`.
      - **Two pieces are not built:** the rule of N, which throws if switched on, and the
        incremental bump. Round 0 retags from scratch, so it needs neither. See Open questions.
      - **"Both qualify" is read as "both earned a slot"**, which Andy should confirm. See the
        Tagger spec.
- [x] **Tag set v0** (2026-10-28), simulated from scratch with the round-0 config, in
      `tagsets/v0.json`. It reuses the spike matrix, which ran the round-0 query, so it spent no
      quota.
      - **231 tags on 73 documents:** 190 in band 1, 37 in band 2, and 4 on the minimum. 39
        documents have three tags, 8 have six, and 9 have one.
      - **On the minimum,** all below 0.45: *Proust and the Squid* (Responsive Design, 0.273),
        *Why Shortcuts Aren't the Road* (Content Analysis, 0.424), *Design for the Human Scale*
        (Interaction Design, 0.433) and *IA, the Current and the Future* (Information
        Architecture, 0.445). The spike predicted 4 documents clearing no bar at 0.456.
      - **The specificity rule changed 22 documents,** dropping 23 broader concepts.
        `tagset.mjs` lists them, widest gap first.
        - **13 outscored the child that replaced them, and 8 were the document's best match.**
          Three were hand tags.
        - **Information Architecture was dropped 10 times, 7 of them for Navigation Design.**
          That includes *What Is Information Architecture?* (0.814 against 0.571) and *When Do
          You Need an Information Architect?* (0.685 against 0.523).
        - **Content Strategy was dropped 6 times,** but in 4 its child scored higher. That's the
          rule working as meant.
        - Andy kept the rule; see Decisions, 2026-10-28.
      - **The hubs moved.** *Content Analysis* is on 21 documents (5 by hand), *Search* on 11 (0
        by hand), *Sanity* on 14 (4), *Navigation Design* on 14 (3). *Information Architecture*
        is on 8 (6 by hand), down from 23 documents' raw top four.
      - **90 of the 207 hand tags were reproduced**, so 141 of v0's 231 tags are new. Whether
        they are better is what M3.0 is for.
      - **Checked:** no tag beside its broader, every tag clears its slot's bar, band 2 fills only
        after band 1, and no document has more than six tags or a duplicate.
- [x] **Calibrate the crossing rule on v0** (2026-10-28). `cross-dryrun.mjs` now ranks on a tag
      set, after checking that the topics it rebuilds from the Topic scheme match the query's
      projection exactly. The target was the embeddings same-rules column: 19 pages crossing.

      | Rule (ratio, shared tags) | Pages crossing | Also cross under embeddings | Same card | Strongest 12 found |
      |---|---|---|---|---|
      | 0.50, 2 (the provisional `CROSS_RULE`) | 28 | 11 | 4 | 4 |
      | 0.52 to 0.60, 2 | 7 | 3 | 0 | 0 |
      | **0.40, 3 (chosen)** | **15** | **12** | **6** | **5** |
      | 0.50, 3 | 11 | 9 | 4 | 4 |

      - **There's a cliff at 2 shared tags.** No v0 pair has a ratio strictly between 0.50 and
        0.60, so crossings fall from 28 to 7, and nothing in between is reachable.
      - **At 3 shared tags the ratio barely matters:** anything from 0.01 to 0.40 gives the same
        15. The 0.40 guards against two heavily tagged documents sharing 3 of 9.
      - **What crosses:**
        - **Same-work pairs:** both *Domain Modeling* pairs, both *Boutique Knowledge Graphs*
          pairs, and *Structured Content Design Workflow 2022* to *Structured Content in Product
          Design*.
        - **The other 10 are topical.** For example, *Deskilling Large Language Models* goes to
          *AI Assisted Content Operations*, and *Taxonomy Management in Sanity Studio* to
          *Purpose-Driven Taxonomy Design*.
        - **Still missed:** the *Conversations With Robots* talk crosses to *Boutique Knowledge
          Graphs*, not to its own article.
      - **"Strongest 12"** are the pages whose best cross-category match scores ≥ 0.78 anchored in
        the embeddings baseline. Most are the same work in two forms. Two are close neighbors
        instead: *AI Assisted Content Operations* → *Self-Hosting Sanity Studio*, and *Ranked
        Lists of Related Content* → *Sanity Studio Taxonomy Migration*.
      - **With crossing off, v0 changes 15 of 73 lists against the old branch rule,** against 12
        on the hand tags.
- [ ] **M3.0** in the new evaluation format: `Embeddings | Embeddings, same rules | Hand tags |
      Taxonomy v0`

*The page wiring was listed here until 2026-10-28. It is in phase 6.*

### 2. Taxonomy revision 1

**Inputs found so far,** from evaluating earlier rounds:

- **Navigation Design overlaps Information Architecture** (v0, 2026-10-28). Its definition
  describes IA in general: "an intuitive, efficient, and user-friendly system for finding
  content", "structuring and arranging" to give "easy access to information". So it scores high
  wherever IA does, and the specificity rule then drops IA for it on 7 documents, including
  *What Is Information Architecture?*. Narrow the definition to the navigation system itself, or
  add a scope note that says what belongs to IA instead.
  - **How to tell it worked:** re-score Navigation Design alone (one query) and re-run
    `tagset.mjs`. IA should stop appearing in the dropped list against Navigation Design on the
    IA-titled pages.

- [ ] Generate candidate single-word terms (NLP / LLM). The existing `web/scripts/phrase-candidates.mjs`
      proposes multiword terms and is a starting point.
- [ ] Andy structures the flat list into the scheme
- [ ] Retag round 1, then **M3.1**, with only the changed resources flagged for evaluation

### 3. Taxonomy revision 2: examples

- [ ] Add text examples to `skos:example`, at the embeddings' chunk size. **Measured 2026-10-27:
      about 5,000 characters a chunk** (from `_embeddings` positions on the longest article). Note
      that a *query* is read only to about 2,500 characters, so an example's length has to work
      for both ends.
- [ ] **Decide the source.** The plan is excerpts from the best-matching resources. Two risks:
  - **unevenness:** concepts with examples are favored over concepts without
  - **circularity:** a resource matches its own excerpt almost perfectly, which guarantees it the
    tag

  Generated examples avoid both. Decide before this phase starts.
- [ ] Retag round 2, then **M3.2**

### 4. Taxonomy revision 3: related terms

- [ ] Add `skos:related` links. None of the 73 concepts uses it today. The process is to be decided;
      it may also need a ranking tier.
- [ ] Retag round 3, then **M3.3**

### 5. Manual audit

- [ ] **Write the chosen tag set into the lab,** with a backup first and a dry run first. This is
      where the tags first reach the dataset, and where the **`topicScores` schema field** lands.
      Its shape is decided; who writes the schema edit is Andy's call.
- [ ] Andy reviews the tags in the lab Studio for ones the tagger missed. Those become author
      tags, which are never bumped.
- [ ] **M3.4**, from the tags in the dataset

### 6. Promotion

**Nothing in this phase starts until Andy explicitly gives the go-ahead** (see Ground rules). It
is where the results are rolled into the live site, and it is the first time this project
touches `production-26` or the site's pages.

- [ ] **Andy's go-ahead**
- [ ] **Move the concept and scheme documents into `production-26`,** then re-run the tagger there
      and write the tags and `topicScores` through `lab-api.mjs --allow-production`, with a backup
      first. See "Where the experiments run" → Cost.
- [ ] **Cross-category ranking: the wiring.** The insight and presentation pages move to
      `rankAcross`. `RelatedBand.astro` gets the new labels and links each card to its own
      collection. The old branch rule and the `parent` projection are then removed.
      - **`CROSS_RULE` takes the research's final rule,** `TAXONOMY_CROSS` from
        `baseline-columns.mjs`, and its comment is rewritten to match.
      - **It is already written:** `git stash list` shows it as "recommendations-research:
        cross-category wiring of pages and RelatedBand, for promotion (2026-10-28)". It changes
        four files: `RelatedBand.astro`, both `[slug].astro` pages, and a comment in
        `lib/related.ts`. On 2026-10-28 it passed `astro check`, the build, `links`, `validate`
        and `a11y`, and all 73 built pages matched the ranker exactly. Re-verify after
        applying it: the corpus and `CROSS_RULE` will have moved.
      - **Removing the old rule breaks three research scripts.** `measure.mjs`, `m3.mjs` and
        `cross-dryrun.mjs` import `branchForType`, `genresForBranch` and `rankRelated`, which are
        the rule the committed M1, M2 and first M3 reports measured. The proposal is a frozen copy
        in this folder: the old rule is `rankAcross` with the eligible genres as the home set
        and crossing off, so the copy reuses the real scorer and the reports stay reproducible.
        Andy's call.
- [ ] **Merge to `main`**, which deploys. Andy's call, as always.

## Specs

### Cross-category ranking

- **Categories.** **Insights** covers `article`, `caseStudy` and `note`; **Presentations** covers
  `presentation`.
- **A behavior change.** Notes and articles now relate to each other; today notes relate only to
  notes. Genre still decides which category a document belongs to.
- **Home category first,** ranked as it is now: tiers, union-normalized, lexicographic.
- **Crossing is a strong match only.** A candidate from the other category enters only if all of
  these hold:
  - it shares at least `crossMinCount` tags, and never fewer than one
  - its shared ratio is at least `crossMinShared`
  - it outranks the weakest home card it would displace, strictly
  - at most `crossMax` cross cards are shown

  All of these are adjustable.
  - **The research uses `TAXONOMY_CROSS`** in `baseline-columns.mjs`: `crossMinShared` 0.40,
    `crossMinCount` 3, `crossMax` 1. It was calibrated on tag set v0 and is held fixed through
    revisions 1–3 (Andy, 2026-10-28).
  - **The pages will read `CROSS_RULE`** in `lib/related.ts`. It keeps its provisional values
    (0.5, 2, 1, from 2026-10-27) until promotion, and its comment there is out of date until
    then too.
- **Labels.**

  | Page | No cross cards | With a cross card | Fallback |
  |---|---|---|---|
  | Insight | "Related Insights" | "Related Insights & Presentations" | "Recent …" |
  | Presentation | "Related Presentations" | "Related Presentations & Insights" | "Recent …" |

- **A card links to its own collection.** That reverses the reasoning recorded on `RelatedBand`'s
  `basePath` prop, which says a link's collection is "a fact about the PAGE". The comment changes
  with the code.
- **The ranking logic is on this branch; the page wiring waits for promotion.** No page uses
  `rankAcross` until phase 6, so the research can run it in memory without changing what any
  page shows.

### Tagger

- **Scope.** The Topic scheme only, in the `topic` field of the four types. Genre is not touched.
  Top concepts are never candidates.
- **Score.** One query per concept, about 55 a round:
  - **query:** the concept's `prefLabel`, `definition` and `scopeNote`, with examples added from r2
  - **result:** every document is scored against it
  - **normalization:** the anchored scale, `(score − 4.9) / (self − 4.9)`, where `self` is the
    concept's own document in the same query. 0 means as unrelated as anything in the corpus; 1
    means the concept's own words. The floor of 4.9 is frozen from the spike, so the scale
    doesn't depend on the corpus. Re-derive it if Sanity updates its model.
  - **cache:** the full concept × document matrix is kept per round as a local file. It is the raw
    material for trend charts, and lets a freed slot be refilled without re-querying.
- **Select per document.** The configuration is adjustable:

  ```js
  {floor: 4.9, bands: [{count: 3, min: 0.45}, {count: 3, min: 0.54}], minimum: 1, ruleOfN: null}
  ```

  The round-0 values were set by Andy on 2026-10-26, from the spike's threshold table:
  ≥ 0.45 is about the top 15% of pairs, and ≥ 0.54 about the top 5%.

  - **Slots run in band order, at most six.** Author tags (in `topic` with no score) take slots
    from the front and are never bumped. Any band-1 slots left take auto tags scoring ≥ 0.45;
    band-2 slots take auto tags scoring ≥ 0.54.
  - **Minimum one tag.** A document that clears no band and has no author tag still gets its
    single best concept, even below 0.45. It is an ordinary auto tag: its stored score shows it was
    below the bar, and a later candidate that clears a band bumps it.
  - **Auto tags** fill the remaining slots by score.
  - **A new candidate** above the threshold takes a free slot, or bumps the lowest auto tag it
    outscores.
  - **No concept beside its own broader.** An auto tag may not be the parent or a child of any
    other tag on the document, author or auto. Author tags are exempt from removal, so a pair
    containing one can survive. When two auto candidates both qualify, **the more specific one
    wins**.
    - **"Both qualify" means both earned a slot on score** (proposed 2026-10-28; Andy to
      confirm). The broader gives its slot up and the next candidate takes it. The other reading
      is that any narrower concept clearing 0.45 evicts its broader, whether or not it would have
      had a slot. That reading changes 12 of 73 documents in v0, and often for the worse: it
      takes *Information Architecture* off *What's It Like to Work with an Information
      Architect?* for *User Interviews*, because a child of IA cleared 0.45 without earning a
      slot.
  - **Rule of N:** a configurable variant, off in round 0. With it on, N or more qualifying
    children of one broader concept give way to the broader concept.
- **Incremental.** When a concept is added or changed, only that concept is re-queried, and the
  bump rule is applied per document.
- **Output: a tag-set file per version,** `tagsets/<version>.json`, holding each document's tags
  with their scores. The ranker and M3.n read it in memory. Rounds 0–3 never write to the dataset.
- **Write, at phase 5 and promotion only.** Through `lab-api.mjs` under
  `sanity exec --with-user-token`, so no token is handled. A backup comes first and a dry run
  before any write.

### M3.n evaluation reports

- **File and order.** One file per run, `m3.n.md`, readable in Obsidian. Resources are grouped by
  category (Article, Case Study, Note, Presentation) and sorted alphabetically within each group.
- **One section per resource,** with a **CHANGED** flag when any column differs from the previous
  run. On a re-run, only flagged resources need evaluating.
- **The table.**
  - **Columns:** `Embeddings | Embeddings, same rules | Hand tags | Taxonomy v0 | v1 | …`.
  - **The two embeddings columns** are the baseline: no taxonomy at all.
    - **Query text:** each page's title, summary and the opening of its body, so the search
      approximates a comparison of whole documents. GROQ has no direct way to compare two
      documents.
    - **Embeddings:** the unrestricted top 3, meaning what embeddings alone would show.
    - **Embeddings, same rules:** the taxonomy ranker's category policy, applied to semantic
      scores. Home-category documents come first, and a document from the other category enters
      only if it is strong. "Strong" is measured as in the spike: the page's own document goes in
      the query as the yardstick, scores are anchored to it, and a crossing document must clear
      `crossMinSemantic` and outscore the weakest home card. This column isolates what the
      vocabulary adds.
    - Both are computed once and cached, since the experiment changes no content text.
  - **Header cells:** each gives that column's agreement with the column before it, as `(agree n/3)`.
  - **Rows:** three for the cards, then a **Best** row left blank, where Andy pastes ✅ under the
    best version, then a **Notes** row.
  - **Unchanged columns:** a column identical to the previous version reads "no change".
- **Carry-forward.** Every run carries the earlier columns forward, with their Best marks and notes.
- **Comparisons that skip a run** go below the table, and only for truly interesting cases.
- **Extract script.** It parses every `m3.*.md` into one table of resource, version, agreement, best
  and note, for charting trends.

## Open questions

Each has a default in place until Andy says otherwise.

- **How a later round retags: from scratch, or by bumping.** Rounds 1–3 re-score only the
  concepts that changed. The tagger can then re-run from scratch over the updated matrix, or
  apply the spec's bump rule to the previous tag set.
  - **They differ when a changed concept's score drops.** From scratch, the tag goes if it no
    longer earns its slot. A bump never removes a tag, so the old one stays until something
    outscores it.
  - *Default:* from scratch. It is deterministic, and it is what promotion does ("re-run the
    tagger there"). The bump rule matters for the live site, where content and concepts change
    one at a time, so it can be built for the Taxonomy Manager prompt rather than for the
    simulation.

- **When to try the rule of N.**
  - **The case for it:** it frees slots, and it says "this is about the area as a whole".
  - **The cost:** a document tagged with the broader concept matches documents tagged with one of
    its children only at the "nearer" tier, not "shared".
  - *Default:* try it only if slot crowding shows up in the M3 evaluations, meaning several
    children of one broader concept filling most of a document's tags.
- **Facets and the broader concepts.** This came up in the 2026-10-26 measurement. It is not
  caused by the rule above.
  - **The problem:** facets filter on direct tags with no roll-up (`docs/urls-and-filtering.md`),
    so a mid-level chip lists only documents tagged with it directly. *Content Strategy* has 0
    such documents, against 26 tagged only with one of its children. *Information Architecture*
    has 6 against 20.
  - **How the rule bears on it:** dropping parents keeps that gap where it is. Only inference at
    the facet would close it.
  - **Status:** out of scope for this experiment unless Andy brings it in. It belongs to the URL
    contract, which is Andy's, and the promotion step is where it would come up.
