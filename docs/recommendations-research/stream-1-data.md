# Stream 1: the lab becomes production

*Planned 2026-11-19, from the decisions in [plan.md](plan.md) → Where things stand. The first of
three streams; the ranker (stream 2) merges after this one, and the plugin (stream 3) after that.
Written to be picked up cold.*

## The goal

`production-26` ends up holding exactly what `recommendations-lab` holds once the lab has caught
up with production: the revised Topic scheme and its concepts, v5's tags on the 73 judged
documents, Andy's hand tags on the few documents published since the split, and every other
change made in production since 2026-10-22.

**Why the lab becomes production, and not the other way round** (Andy): what is unique to the lab
(a rebuilt scheme, 68 concepts with definitions and examples, the Human Factors branch, and v5's
tags) is the harder half to move. What is unique to production is a small delta of ordinary
content.

**Why the name stays `production-26`:** datasets can't be renamed, and on the Free plan
`datasets copy` is refused ("advanced dataset management") and two datasets is the limit. So the
lab is exported and imported into a fresh dataset under the old name, after the old one is
backed up and deleted. Keeping the name means the site's `PUBLIC_SANITY_DATASET`, the preview's
environment, the deployed Studio and the webhook's dataset scope all keep working unchanged.

## Decided, and not to be revisited here

- **No tag scores.** No `topicScores` is written, and the field never reaches production's schema.
  Scores arrive with the plugin (stream 3).
- **v5's tags for the 73 judged documents;** Andy tags the new ones by hand.
- **The old branch rule keeps ranking** the live site's related lists, over the new tags, until
  stream 2 merges.
- **The ground rules hold:** every step that reads or writes `production-26` waits for Andy's
  go-ahead, given for that step.

## Before starting

- **Branch from `main`**, and carry two things over from `recommendations-research`:
  - the lab Studio switch: `isLab` and `DATASETS` in `studio/sanity.config.ts`, and the `dev:lab`
    script in `studio/package.json`. It exists only on the research branch.
  - the research docs, `docs/recommendations-research/`, which merge to `main` alone, deploying
    nothing.
  Not `topicScores`, `studio/tagger/` or `TopicsInput`: they stay on the research branch as
  stream 3's prototypes.
- **Check the API request quota.** The Free plan caps API requests with no overage, and an export
  and import of about 1.1 GB of assets is the biggest batch of requests this project has made.

## Phase A: bring the lab up to date (production is only read)

1. **Measure the delta** (reads `production-26`: go-ahead). Compare every document in both
   datasets by `_id` and `_rev`, drafts included:
   - new in production since 2026-10-22
   - edited in production since then (a different `_rev`)
   - deleted from production since then
   - drafts in progress in production

   Every type counts, not only the four tagged ones: events, clients, reviews, pages, singletons,
   settings. Concepts and schemes are the exception: the lab's versions win, always.
2. **Start the content freeze.** No publishing in production until Phase B ends. Every edit
   after the delta is measured would have to be carried over again.
3. **Back up production** (go-ahead): `sanity dataset export production-26`, drafts and assets
   included, into `~/Archives/afc/`. It is the restore point for everything after, and the
   source of the delta.
4. **Check the delta's references before importing.** The Content Lake refuses a document with a
   strong reference to a document that doesn't exist. A new production document tagged with a
   concept the lab has since removed would fail to import. Strip those topic references first:
   Andy re-tags those documents by hand anyway.
5. **Import the delta into the lab.** Filter the export's NDJSON to the new and edited documents
   and their drafts, and import it into `recommendations-lab` with `--replace`, **assets
   included**. The lab's first import left assets out and lost 17 documents' figures, with their
   alt text. Apply deletions as mutations.
   - **Schema drift:** `main` has added fields since 10-22, such as the share-card choice on
     notes, so edited documents arrive with fields the lab's copies lacked. That is expected;
     the Studio on `main` describes them.
6. **Back up the lab's tags** (`tags-backup.mjs`), then **write v5's tags.** The write step isn't
   built: a script that sets each of the 73 documents' `topic` from `tagsets/v5.json`, with a dry
   run that lists every change, then one transaction. `topic` only, no `topicScores`.
7. **Andy tags the new documents** by hand in the lab Studio (`pnpm --filter studio dev:lab`).
8. **Clean the lab.** These would otherwise become production content:
   - drafts from the research: the three Taxonomy child drafts, and the test drafts from trying
     "Suggest topics" on *A Cognitive Sciences Reading List for Designers*
   - concepts outside the Topic scheme, once no document references them. Delete or keep: Andy's
     call.
   - any `topicScores` data written while testing the stopgap tagger
9. **Validate against the lab**, before anything in production changes:
   - **Build the site against the lab:** `PUBLIC_SANITY_DATASET=recommendations-lab`. Then
     `pnpm parity`, `pnpm links`, `pnpm validate`, `pnpm a11y` and `pnpm budgets`.
   - **Facets and redirects (the URL contract, Andy's):** facet slugs are `slugify(prefLabel)`,
     so diff the Topic labels between the two datasets. A renamed or removed concept leaves old
     `?topic=` links on a silently unfiltered index, and some `/insights/tag/` redirect targets
     in `nginx/redirects.conf` may no longer exist. Prepare the redirects now, deploy them at
     the switch.
   - **Search:** `bodyTerms` matches body text against the scheme's labels, so spot-check the
     multiword terms that changed.
   - **Related lists:** the old branch rule over the new tags. Check that no page falls back to
     Recent where it didn't before.
   - **Media Library references:** imported images carry a weak `media` reference beside the
     asset. Check that they survive an import.

## Phase B: the switch (production is replaced)

Every step here needs Andy's go-ahead, and **the site must not deploy while `production-26` is
missing or partly imported.** A build against an empty dataset can succeed and publish an empty
site. The site gates run beside the deploy and never hold it.

1. **Disable both deploys:** `gh workflow disable deploy-astro.yml` and `deploy-preview.yml`.
   This also mutes the webhook's `repository_dispatch`, and nothing merges to `main` meanwhile.
2. **Back up production once more**, catching anything since step A3, and check the archive:
   document and asset counts, and every published `_id` present, as was done before the old
   `production` dataset was deleted on 2026-10-22.
3. **Export the lab**, drafts and assets included: the import source.
4. **Delete `production-26`** (Andy, in Manage or with the CLI: irreversible).
5. **Create `production-26` again,** with the same visibility as before, and **enable embeddings
   with the lab's projection** (read it from the lab's embeddings settings). Embeddings are free
   to generate, and they'll be needed again by stream 3.
6. **Import the lab's export,** assets included.
7. **Verify the copy against the lab:** document and asset counts, every `_id` present,
   references resolving, embeddings status `ready`, and the Studio opening on the new dataset.
8. **Re-enable both deploys, deploy, and check the live site:**
   - run `deploy-astro.yml` by hand
   - deploy the prepared redirects with `nginx/deploy.sh`
   - check facets, the related bands, search and a sample of pages
   - run the deploy's own smoke checks
9. **Prove the webhook:** publish a small edit and watch a production deploy start. The webhook is
   scoped to the dataset by name, so it should survive the recreation, but "should" is not
   accepted here.
10. **End the freeze.**

## Phase C: afterwards

- **The lab stays**, as stream 3's test dataset. The plan's two datasets are then the new
  `production-26` and the lab. Delete it only if the slot is needed.
- **Update the guards and the record:** `lab-api.mjs` still refuses writes to `production-26`,
  which is still right; plan.md, CLAUDE.md and this file record what moved and when.
- **Stream 2 starts,** building the ranker against the new production data.

## What could go wrong, and the guard for each

| Risk | Guard |
|---|---|
| An empty or partial site deploys during the switch | Both deploy workflows disabled until step B7 passes |
| A delta document fails to import on a dead reference | Step A4 strips references to removed concepts first |
| Figures and alt text lost in an import | Assets included in every export and import |
| Content published during the switch is lost | The freeze, and a second backup at B2 |
| Old facet and tag URLs land on an unfiltered index | The label diff and prepared redirects (A9), deployed at B8 |
| The webhook stops dispatching | Proved by a publish at B9 |
| The delete can't be undone | Two verified backups, and the lab itself, until B7 passes |
