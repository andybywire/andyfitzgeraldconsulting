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
- **Topic comes from the lab, Genre from production** (2026-11-20). See Phase A, step 1.
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

**Done 2026-11-20**, on branch `lab-to-production`:

- **Carried over:** the docs folder whole, and the lab switch by hand, since `main`'s Studio had
  moved to 6.23. The switch was run in Node with a bad name (throws), the lab and the default.
- **Prettier would have failed the first push.** 13 of the folder's JSON files, all script
  output, are unformatted, and `reverse-blocks.json` was already on `main`, unnoticed because
  `checks.yml` skips docs-only pushes. `.prettierignore` now covers the output folders.
- **The quota has ample room.** Free plan: 250k API requests and 100 GB bandwidth a month, 100 GB
  of assets, 10k documents. November to the 20th: 25.6k requests (10%), 2.4 GB (2%), 1.45 GB of
  assets across both datasets, 541 documents. The lab's own creation cost about 15k requests and
  1.7 GB (10-22 and 10-23). Stream 1 makes three full exports and one full import, so expect
  roughly 15–20k requests and 4–5 GB: well inside even September's 113k or October's 16.8 GB.

## Phase A: bring the lab up to date (production is only read)

1. **Measure the delta** (reads `production-26`: go-ahead). Compare every document in both
   datasets by `_id` and `_rev`, drafts included:
   - new in production since 2026-10-22
   - edited in production since then (a different `_rev`)
   - deleted from production since then
   - drafts in progress in production

   Every type counts, not only the four tagged ones: events, clients, reviews, pages, singletons,
   settings. **Topic's concepts and scheme are the exception: the lab's versions win, always.
   Genre's come from production** (Andy, 2026-11-20, after the measurement below). This read
   "concepts and schemes", which would have dropped Genre's new Project Note.

   **Measured 2026-11-20** (scratch scripts, reads only). **`_rev` can't be compared:** the import
   rewrote every revision (0 of 1,285 shared documents match) and stamped every `_updatedAt` with
   the import time. So the cutoff is the lab's import, **2026-10-22T22:47:42Z**; production has no
   edits on 10-22 at all, so nothing falls between the export and the import. The export the lab
   was made from wasn't kept, which makes A3's backup the first archive of `production-26`.

   - **New in production: 8.** Three notes (*Taxonomy Manager Tree View Improvements*, *Ontology
     Pipeline*, *Stats View for Taxonomy Manager Concept Scheme*), four image assets, and one
     concept: **Project Note, in the Genre scheme.**
   - **Edited in production: 10.** Mostly fields `main` added: `bookRef` on four notes (the
     share card choice) and `tile` on three clients. Then `bodyText` on *Language + Meaning + User
     Experience Architecture* and on Consulting, and the Genre scheme's `concepts` (Project Note
     added). None of the ten was changed in the lab, so replacing them loses nothing. (*Proust and
     the Squid* has a lab write on 10-26, but it changed no field.)
   - **Deleted from production: 0.**
   - **Drafts in production: 23, and the lab has none of them**, since it imported published
     documents only. 15 predate the split, including `drafts.settings` (09-23), a review (09-03),
     six untitled events and four notes (10-08 to 10-15). 12 have never been published. One is a
     draft of the Genre scheme (11-15).
   - **System documents only in production:** five `system.release` documents and the deployed
     schema, `_.schemas.default` (11-12). Not content. But a recreated `production-26` has no
     deployed schema until the Studio or schema is deployed again: a B7 check.
   - **Only in the lab:** the 32 new concepts, drafts of the three Taxonomy children, and the
     *Cognitive Sciences Reading List* test draft. Step 8's list, confirmed.

   **What it means for the next steps:**
   - **"The lab's versions win" held for Topic but would have broken Genre,** so the rule now
     names Topic only (Andy). The lab never touched Genre (the scheme is at its import timestamp,
     with 12 concepts), and production never touched a Topic concept after the split. Applied to
     Genre, the rule would have dropped Project Note and left the new notes' `genre` pointing at a
     missing concept. So the delta carries the Genre scheme, its draft and Project Note, and needs
     no merging. If A3's export shows a Topic concept changed in production, that rule decides it.
   - **Step 4 should find nothing to strip.** The lab deleted no concept documents. Every
     production concept exists there, apart from Project Note, which comes over with the delta.
   - **Re-derive the delta from A3's export, not from this measurement.** Anything published
     between now and the freeze is then caught automatically.
2. **Start the content freeze.** No publishing in production until Phase B ends. Every edit
   after the delta is measured would have to be carried over again.
3. **Back up production** (go-ahead): `sanity dataset export production-26`, drafts and assets
   included, into `~/Archives/afc/`. It is the restore point for everything after, and the
   source of the delta.

   **Done 2026-11-20, under the freeze:**
   `~/Archives/afc/production-26-2026-11-20/production-26.tar.gz`, 1.05 GB, exported in 1m 28s.
   - **It is complete.** All 267 content documents are there at their live `_rev`, the 23 drafts
     among them. So are all 1,037 assets, each with a file and an `assets.json` entry; 700 carry
     their Media Library reference. Production was re-read after the export, so the archive
     matches the live dataset under the freeze. The export also holds the five
     `system.release` documents. They are not content, and A5 leaves them out.
   - **The delta, re-derived from the archive, matches step 1 exactly:** 4 new documents and 4 new
     images, 10 edited, 23 drafts (all of them carried, Andy: working notes kept on purpose). The
     only concept production changed is Project Note, so the Topic rule has nothing to decide.
   - **Feed dates can't move at the switch.** Every Atom entry takes its `<id>` from its permalink
     and both timestamps from `pubDate`, "Date Published" (`feed-entries.ts`, Andy, 2026-09-13).
     No feed reads `_createdAt` or `_updatedAt`, and nothing in the site reads `_createdAt` at all.
     Checked against the live output, not only the code: *Designing and Implementing Semantic
     Data Layers* shows 10-19, its Date Published, though its last edit was 10-23. The five live
     feeds are saved beside the archive, in `feeds/`, as B8's baseline.
   - **What the switch DOES move is `_updatedAt`.** An import stamps every document with its own
     time, as the lab's 10-22 timestamps show. Three things read it: JSON-LD `dateModified` on
     insight and presentation pages, the sitemap's `<lastmod>`, and the date search shows for a
     `page`. After the switch they all read the switch date, once.
4. **Check the delta's references before importing.** The Content Lake refuses a document with a
   strong reference to a document that doesn't exist. A new production document tagged with a
   concept the lab has since removed would fail to import. Strip those topic references first:
   Andy re-tags those documents by hand anyway.

   **Done 2026-11-20: nothing to strip.** The 37 delta documents carry 112 strong references, and
   every target is in the lab or in the delta itself. They carry no weak references and 13 Media
   Library (global) references, which the import doesn't check. All 33 asset pointers have their
   file in the archive. Read from the archive and the lab, so production wasn't touched.

   **12 tags on 11 delta documents point outside the lab's Topic scheme:** Governance, AI
   Integration, Data Management, Digital Communication and Digital Presence. Those concepts still
   exist in the lab, so the import is unaffected, but two later steps meet them:
   - **Step 6: five judged documents have drafts.** They are *Beyond the Page with Structured
     Content*, *Designing and Implementing Semantic Data Layers*, *Sanity Everything\*[NYC]*,
     *Shoreline Community College* and *Site Updates*. A write to the published copies leaves the
     drafts holding production's tags. Publishing one of those drafts later would put the old tags
     back over v5's. So the write must decide whether to set `topic` on a judged document's draft
     too.
   - **Step 8: deleting an off-scheme concept is refused while anything references it.** That
     includes three never-published working notes: *Sidestepping the Stingy Web*, *On
     Accountability* and *Content Operations Strategy and Design*. It also includes two of the new
     notes until step 7 retags them.
5. **Import the delta into the lab.** Filter the export's NDJSON to the new and edited documents
   and their drafts, and import it into `recommendations-lab` with `--replace`, **assets
   included**. The lab's first import left assets out and lost 17 documents' figures, with their
   alt text. Apply deletions as mutations.
   - **Schema drift:** `main` has added fields since 10-22, such as the share-card choice on
     notes, so edited documents arrive with fields the lab's copies lacked. That is expected;
     the Studio on `main` describes them.

   **Done 2026-11-20, in 7 seconds.** The import was a tarball built from the A3 archive, shaped
   like an export so `assets.json` came along: the 37 delta documents (14 published, 23 drafts)
   and the 29 images they point to, 38.6 MB. Imported with `--replace` and assets reused by
   default. No deletions were needed.
   - **All 37 match the archive.** Each was compared field by field, with exported asset pointers
     mapped to the references they became. Project Note's `broader` lost `_weak: false`, the same
     cosmetic omission as the lab's first import: a reference without `_weak` is strong.
   - **The 29 images:** 26 were already in the lab, with metadata identical to production's, so
     reusing them changed nothing. 3 are new, and all three kept their Media Library reference.
   - **Nothing else moved.** The 33 lab documents written since the import began are exactly
     the delta and its assets, and the lab went from 1,321 documents to 1,351 as expected.
   - **One production image did not come across:** `image-f02618c7…-4502x2362-png`. It was
     uploaded on 11-05, five minutes before the image *Taxonomy Manager Tree View Improvements*
     uses, and no document references it. An import carries only assets that documents point
     to. It stays in the Media Library and in the A3 archive.
6. **Back up the lab's tags** (`tags-backup.mjs`), then **write v5's tags.** The write step isn't
   built: a script that sets each of the 73 documents' `topic` from `tagsets/v5.json`, with a dry
   run that lists every change, then one transaction. `topic` only, no `topicScores`.

   **Written 2026-11-20, 17:05 UTC: 77 documents in one transaction**, after the three commits
   that hold the scripts and the backup (Andy: commit first).
   - **Proved three ways.** The script re-read and confirmed its own write. A second dry run finds
     79 already matching (73 published and 6 drafts) and nothing to change. And the only lab
     documents written since are the 77: 71 published and 6 drafts.
   - **The way back is intact.** A restore dry run against the backup sees exactly those 77, every
     one on `topic` alone, so no `topicScores` was touched and nothing is missing:
     `tags-restore.mjs --file backups/tags-recommendations-lab-20261120T165610Z.json --write`
     would undo it.

   How it was built:
   - **Drafts too** (Andy): a judged document's draft gets the same `topic`, so publishing it
     later can't put old tags back. So `tags-backup.mjs` now saves drafts, and
     `tags-restore.mjs` reads `raw`, so it finds them. Proved by a restore dry run straight after
     the backup: 89 entries considered, 0 differ, none missing.
   - **The backup:** `backups/tags-recommendations-lab-20261120T165610Z.json`. It holds 76
     published documents (the 73 judged and 3 new notes) and 13 drafts.
   - **`tags-write.mjs`** takes its dataset from the tag set, as restore takes it from the backup.
     It refuses to run unless every document and concept checks out and that backup can undo the
     write. Its header says why each guard exists.
   - **The dry run:** 71 published documents and 6 drafts change, 2 already match; 166 tags are
     added and 153 removed. No v5 tag sits on a top concept, so the facets' rule holds. One of the
     six drafts is the *Cognitive Sciences Reading List* test draft that step 8 deletes, so
     writing it is harmless.
7. **Andy tags the new documents** by hand in the lab Studio (`pnpm --filter studio dev:lab`).
8. **Clean the lab.** These would otherwise become production content:
   - drafts from the research: the three Taxonomy child drafts, and the test drafts from trying
     "Suggest topics" on *A Cognitive Sciences Reading List for Designers*
   - concepts outside the Topic scheme, once no document references them. Delete or keep: Andy's
     call.
   - any `topicScores` data written while testing the stopgap tagger

   **Step 7 checked, and step 8 inventoried 2026-11-20 (reads only).**
   - **Step 7:** all three new notes are tagged inside the Topic scheme, none at a top concept.
   - **Andy published 10 drafts in the lab during step 7:** every carried draft that had a
     published copy (Settings and the Genre scheme aside), and the *Cognitive Sciences* test
     draft. The 12 never-published working notes stay drafts. Compared against the archive, nine
     of them held no edits of their own: each published copy differs from production's in v5's
     `topic` or not at all. *Taxonomy Manager Tree View Improvements* carried one real edit, its
     `shortDescription`, which goes live at the switch. All 73 judged documents still match v5.
   - **The research drafts:** the test draft is gone with the rest. The three Taxonomy children
     remain, as concept drafts holding the 11-04 genus–differentia definitions, never published.
     Those concepts left the scheme when Andy subsumed them back into Taxonomy.
   - **`topicScores`: none anywhere in the lab.** Nothing to clean.
   - **16 published concepts sit outside every scheme.** 15 have no references at all: AI
     Integration, Content Analysis, Content Auditing, Data Management, Development, Digital
     Communication, Digital Presence, GitHub Actions, Personas, Responsive Design, Strategy, User
     Flows, and the three Taxonomy children. **Governance** has one, from the never-published
     working note *Content Operations Strategy and Design*.
   - **Four of them exist nowhere but the lab:** GitHub Actions and the three Taxonomy children
     were created there, so the A3 archive can't restore them. An export of the lab before any
     delete is what makes the cleanup reversible.

   **Cleaned 2026-11-20 (Andy: export, then delete; Governance too, once he retagged the working
   note that used it).**
   - **The restore point:**
     `~/Archives/afc/recommendations-lab-2026-11-20/recommendations-lab.tar.gz`, with 293
     documents and 1,036 assets, 1.05 GB, exported in 1m 16s. It holds every deleted document,
     the Taxonomy children's drafted definitions in full.
   - **19 documents deleted in one transaction:** the 16 off-scheme concepts and the three
     Taxonomy children's drafts. Every guard was rerun on the live lab right before the delete:
     each concept still outside every scheme, referenced by nothing (drafts included), and present
     in the export. The lab went from 1,341 documents to 1,322.
   - **Afterwards:** the 14 drafts left are all production's, and no concept sits outside a
     scheme. Topic (75 members) and Genre (15) are unchanged, and no `topicScores` exist. All 73
     judged documents still match v5. All 504 concept references (`topic`, `genre`, `broader`,
     `related` and the schemes' own) resolve.
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

   **Run 2026-11-20.** "Before" is the live site, read with public GETs; production is frozen, so
   it matches the A3 archive. "After" is the lab build.
   - **The override reaches everything.** The dataset is read in three places: Vite's `loadEnv`
     (the `sanity()` integration), Node's `loadEnvFile` (parity) and `astro:env` (image URLs). The
     command line beat `.env` in the first two. The build's 11,426 Sanity image URLs all name
     `recommendations-lab`, `production-26` appears nowhere in `dist/`, and *Ontology Pipeline*
     shows the lab's tags. Parity read 258 documents, which is the lab's published count.
   - **All five gates are green.** The build took 51s. Parity: 0 fails (1 warning, the known
     unattached event). Links: 89 pages, 3,059 links. Validate: every page valid. Accessibility:
     89 pages in 5 configurations, no violations. Budgets: all within, the search index at 20.6
     of 25 KB.
   - **Media Library:** all 1,036 lab assets carry exactly production's `media` reference. The one
     production asset missing is A5's orphan image.
   - **Search:** the headline multiword terms match exactly as many documents as before: tree
     testing 7, card sorting 5, information architecture 24, structured content 19, content
     modeling 3, knowledge graphs 11. Body terms go from 71 to 109. The ten dropped are mostly old
     top-concept labels: design (51 documents), development (26), strategy (15), engineering (7).
     Then content management (8, but "content management system" arrives with 6), personas,
     user flows, data management, content analysis and digital communication. Some new terms are
     generic words: goals (25), outcomes (15), semantic (19), graph (15).
     - **These counts are of body TEXT, not tags.** `bodyTerms` takes every label in the Genre
       and Topic schemes, walked from the scheme so top concepts are included, and matches them
       against each document's prose. Goals and Outcomes tag nothing. "goals (25)" means 25
       documents use the word. So a label chosen to organize the hierarchy becomes a search term
       too, as the old top concept Design did (51 documents).
   - **Facets: chips vanish, and none of them is a rename.** Insights goes from 36 topic chips to
     51, Presentations from 30 to 33, and genre is unchanged. All six named `/insights/tag/`
     targets in `nginx/redirects.conf` survive.
     - **On Insights, 12 chips go:** nine retired concepts deleted at A8 (AI Integration, Content
       Analysis, Development, Digital Communication, Governance, Data Management, User Flows), four
       that tag nothing now (Interoperability, Stakeholder Engagement, Contextual Inquiry, Process
       Mapping), and Project Management, now a top concept.
     - **All 12 were 11ty tag pages.** The 2022 dataset has exactly 70 concepts, the ~70 tag pages
       urls-and-filtering.md lists. So `/insights/tag/<slug>/` for each of them works today
       through the catch-all and **lands on an unfiltered index after the switch.** **No
       redirects (Andy, 2026-11-20):** all twelve default to the Insights index through the
       existing catch-all, so `nginx/redirects.conf` doesn't change.
     - **On Presentations, 15 go:** seven of them still tag insights but no presentation now, such
       as Navigation Design and Linked Data. A `?topic=` link only reaches them on Presentations,
       and those URLs only date from 09-28.
   - **Related: six pages fall back to "Recent"** (two gain "Related"): *Cognitive Science for
     Designers*, *Ontology Pipeline*, *Proust and the Squid*, *The Calm Before the Storm*, *Why
     Shortcuts Aren't the Road* and *Language Arts for the Lizard Brain*. The cause is the old
     branch rule meeting the new vocabulary.
     - **The old rule matches only within a page's own genre branch,** and ignores siblings under
       a top concept.
     - **Cognition sits directly under Human Factors, a top concept.** Its three documents are an
       article, a talk and a note, so no two of them share a branch.
     - **The clippings each carry one tag that no other note shares.**
     - **Stream 2's cross-category ranker** is what reaches these pages. **Falling back to Recent
       is fine for the interval** (Andy, 2026-11-20).

   **Phase A is complete.**

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
   - no redirects to deploy: A9's twelve retired tag URLs keep the catch-all (Andy)
   - check facets, the related bands, search and a sample of pages
   - **check Presentation end to end in the deployed Studio** (Andy's eyeball step). It was
     never removed from production: the lab switch drops it only under `dev:lab`. It needs no
     change at the switch, because the name stays `production-26`. But the dataset under it is
     new, so check that the preview loads, overlays appear, and a click reaches the right
     document
   - **diff the five feeds against `~/Archives/afc/production-26-2026-11-20/feeds/`**: every
     entry's `<id>`, `<published>` and `<updated>` should be unchanged. The only differences
     allowed are content changes (new topic labels in `<category>`)
   - **check the deployed schema exists** (`_.schemas.default`): it lives in the dataset, so the
     new `production-26` has none until the Studio or schema is deployed again
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
| Old facet and tag URLs land on an unfiltered index | Measured at A9: twelve retired tag URLs do, and Andy accepted it; no redirects |
| The webhook stops dispatching | Proved by a publish at B9 |
| The delete can't be undone | Two verified backups, and the lab itself, until B7 passes |
