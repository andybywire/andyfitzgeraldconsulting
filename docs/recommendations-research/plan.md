# Recommendations research: plan

*Living document. Started 2026-10-21; this version 2026-10-22. Branch: `recommendations-research`.*

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
| `*.mjs` | Measurement scripts. Run `fetch-corpus.mjs` first; it writes `corpus.json` beside itself |

## Decisions

Newest first.

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
    the live dataset. `measure.mjs` and `m3.mjs` take the dataset from `corpus.json`. Reports from
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

Each phase is one or more review stops. "Retag" always means run the tagger, then run the next M3.n.

### 0. Setup

- [x] Tracking docs (this folder)
- [x] Decide where the experiments run: a lab dataset (above)
- [x] Set up the lab: copy `production-26` with its assets, enable embeddings, add a local Studio
      switch, and parameterize the scripts by dataset
- [ ] **Back up tags**: write `{_id, topic}` for every document to `backups/tags-<date>.json`, and
      write a restore script. Test the restore on one document before any bulk write.
- [ ] **Score spike**: score every document against every Topic concept, look at the distributions,
      choose a normalization, then Andy sets the starting thresholds (see Tagger)

### 1. Pre-test (Taxonomy v0)

- [ ] **Cross-category ranking** in `web/src/lib/related.ts` and `RelatedBand.astro` (see spec)
- [ ] **Tagger**, local, in this folder (see spec). It may later move into Taxonomy Manager.
- [ ] **`topicScores` schema field**. The shape is decided; who writes the schema edit is Andy's call.
- [ ] Tag round 0 (from scratch)
- [ ] **M3.0** in the new evaluation format (see spec)

### 2. Taxonomy revision 1

- [ ] Generate candidate single-word terms (NLP / LLM). The existing `web/scripts/phrase-candidates.mjs`
      proposes multiword terms and is a starting point.
- [ ] Andy structures the flat list into the scheme
- [ ] Retag round 1, then **M3.1**, with only the changed resources flagged for evaluation

### 3. Taxonomy revision 2: examples

- [ ] Add text examples to `skos:example`, at the embeddings' chunk size. Chunk size is measurable
      from the `_embeddings` start and end positions in results.
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

- [ ] Andy reviews the tags for ones the tagger missed. Those become author tags, which are never
      bumped.
- [ ] **M3.4**

## Specs

### Cross-category ranking

- **Categories.** **Insights** covers `article`, `caseStudy` and `note`; **Presentations** covers
  `presentation`.
- **A behavior change.** Notes and articles now relate to each other; today notes relate only to
  notes. Genre still decides which category a document belongs to.
- **Home category first,** ranked as it is now: tiers, union-normalized, lexicographic.
- **Crossing is a strong match only.** A candidate from the other category enters only if all of
  these hold:
  - it shares at least one tag
  - its shared ratio is at least `crossMinShared`
  - it outranks the weakest home card it would displace, strictly
  - at most `crossMax` cross cards are shown

  All of these are adjustable. The starting values are set after a dry run on the corpus.
- **Labels.**

  | Page | No cross cards | With a cross card | Fallback |
  |---|---|---|---|
  | Insight | "Related Insights" | "Related Insights & Presentations" | "Recent …" |
  | Presentation | "Related Presentations" | "Related Presentations & Insights" | "Recent …" |

- **A card links to its own collection.** That reverses the reasoning recorded on `RelatedBand`'s
  `basePath` prop, which says a link's collection is "a fact about the PAGE". The comment changes
  with the code.
- **This is site code, on this branch.** It deploys only when merged.

### Tagger

- **Scope.** The Topic scheme only, in the `topic` field of the four types. Genre is not touched.
  Top concepts are never candidates.
- **Score.** One query per concept, about 55 a round:
  - **query:** the concept's `prefLabel`, `definition` and `scopeNote`, with examples added from r2
  - **result:** every document is scored against it
  - **normalization:** chosen in the spike
  - **cache:** the full concept × document matrix is kept per round as a local file. It is the raw
    material for trend charts, and lets a freed slot be refilled without re-querying.
- **Select per document.** The configuration is adjustable:

  ```js
  {target: 4, bands: [{count: 3, min: 0.7}, {count: 3, min: 0.8}]}
  ```

  - **Author tags** (in `topic` with no score) count toward `target` and are never bumped.
  - **Auto tags** fill the remaining slots by score.
  - **A new candidate** above the threshold takes a free slot, or bumps the lowest auto tag it
    outscores.
- **Incremental.** When a concept is added or changed, only that concept is re-queried, and the
  bump rule is applied per document.
- **Write.** Through `sanity exec --with-user-token`, which uses Andy's CLI login, so no token is
  handled. There is a dry-run mode that prints the diffs first. Writes go to published documents in
  the chosen dataset.

### M3.n evaluation reports

- **File and order.** One file per run, `m3.n.md`, readable in Obsidian. Resources are grouped by
  category (Article, Case Study, Note, Presentation) and sorted alphabetically within each group.
- **One section per resource,** with a **CHANGED** flag when any column differs from the previous
  run. On a re-run, only flagged resources need evaluating.
- **The table.**
  - **Columns:** `Embeddings | Hand tags | Taxonomy v0 | v1 | …`.
  - **Header cells:** each gives that column's agreement with the column before it, as `(agree n/3)`.
  - **Rows:** three for the cards, then a **Best** row with `[ ]` in each column, then a **Notes**
    row.
  - **Unchanged columns:** a column identical to the previous version reads "no change".
- **Carry-forward.** Every run carries the earlier columns forward, with their Best marks and notes.
- **Comparisons that skip a run** go below the table, and only for truly interesting cases.
- **Extract script.** It parses every `m3.*.md` into one table of resource, version, agreement, best
  and note, for charting trends.

## Open questions

Each has a default in place until Andy says otherwise.

- **Checkboxes in Obsidian.** Obsidian makes checkboxes clickable only in list items, not inside
  table cells. *Default:* the Best row in the table holds `[ ]`, which you edit to `[x]`. *The
  alternative* is a clickable task list below each table.
- **The embeddings column.** *Default:* unrestricted top 3, meaning what embeddings alone would show.
  It is computed in M3.0 and reused, since embeddings depend only on content text. It is refreshed
  when content changes.
- **The Hand tags column.** *Default:* included in M3.0 as the baseline, so we can see whether
  auto-tagging alone helped.
- **A concept and its own broader on one document.** *Default:* allowed in round 0. We'll watch
  whether it is redundant.
- **The `topicScores` field in Studio.** *Default:* read-only and collapsed.
- **Quota.** Each round is about 55 tagging queries plus refreshes. Embeddings results are cached
  across M3 runs.
