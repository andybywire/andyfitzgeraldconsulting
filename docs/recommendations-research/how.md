# How: steps for building taxonomy-based recommendations

*Living document. It records the steps a reader should take, written down as we discover them. It
keeps what worked, and notes what didn't once we find out. It feeds the "How" section of the
article(s) and the Taxonomy Manager starter prompt.*

Each step is marked **working**, **didn't work** or **untested**.

## The steps so far

### Audit the vocabulary before anything else

**Working.** Before ranking anything, find out what the vocabulary and the tagging can support. Each
check is a GROQ query, and each failure says something about the vocabulary, not the code:

- documents tagged at a top concept (here: 0)
- concepts with more than one parent (here: 0; the ranker reads only the first `broader`)
- untagged documents (here: 2 presentations)
- concepts with a definition, scope note or example (here: 73 of 73, 51 and 45). These become the
  tagger's input.
- tags per document by year (here: 2.0–2.8 for 2013–2022, against 3.1–4.0 from 2023). A decline
  for older years points to under-tagged older content.
- use of `skos:related` (here: none)

### Measure what you have before changing it

**Working.**

- Fetch a fresh corpus every time, because content moves between sessions.
- Compute the current lists with the site's *own* ranker, not a reimplementation. The scripts here
  import `web/src/lib/related.ts` directly.
- When a script copies logic, add a guard that checks the copy reproduces the real ranker on every
  page before reporting anything.

### Don't worry about Dice versus Jaccard

**Measured.** They produced the same ranking on 73 of 73 pages. With lexicographic tiers they always
will: Dice is a monotone transform of Jaccard, and among tied candidates the two denominators differ
by the same factor. The choice matters only if you add weights or nudges, which is a reason not to.

### Enable dataset embeddings with a projection per type

**Working, after a correction.**

- Write the projection from the *schema*, type by type.
- Probe one query and read `_embeddings[].fields` to confirm the body text was embedded, before
  spending a query on every page.
- Include `skosConcept` if you want the plugin's tag recommendations.
- Leave out long, uneven fields such as transcripts. They dominate the embedding, and Sanity drops
  everything past 10 chunks.

The projection used here:

```groq
{
  _type == "article" => {title, shortDescription, bodyText},
  _type == "note" => {title, shortDescription, bodyText},
  _type == "caseStudy" => {title, shortDescription, atGlance, whatDid, projectGoal, projectApproach, projectOutcome},
  _type == "presentation" => {title, description, bodyText, highlights},
  _type == "skosConcept" => {prefLabel, definition, scopeNote, example}
}
```

### Compare against embeddings honestly

**Working, with one caveat.**

- **There is no document-to-document similarity in GROQ.** `text::semanticSimilarity()` scores a
  query *string*, so "related to X" means "similar to X's title and summary."
- **The caveat:** a document with no summary queries on its title alone.
- **Never compare `_score` across queries.**
- **Cache the embeddings results.** They depend only on content text, so they don't change between
  taxonomy revisions.

### Experiment in a lab dataset, not the live one

**Working.** Retagging and restructuring a taxonomy rewrite exactly the fields a live site builds
from: related lists, topic chips, facet URLs, feeds and search. A copy of the dataset keeps the live
site publishing while the experiments run.

- **Check the webhooks first.** Sanity's `sanity hook list` shows which dataset each one fires on.
  Here the only webhook is scoped to `production-26`, so writes to the lab trigger no deploy.
- **The Free plan has no cloud copy.** `sanity datasets copy` fails with "advanced dataset
  management". Export and import does the same job.
- **Copy the assets too,** even though the experiment never shows an image (see What didn't work).
- **Point a local Studio at the lab without changing the deployed one.** Here that's an env var
  that only a `dev:lab` script sets, plus a "LAB" title, so the two are never confused.

### Still to work out

Each is **untested**:

- Back up the tags, with a restore that is tested on one document.
- Normalize semantic scores into a scale a tagging threshold can use (the score spike).
- Auto-tag with match scores and a bump rule that never removes author tags.
- Rank across categories with a strong-match bar.
- Revise the taxonomy: new terms, structure, examples, `related`.
- Run the evaluation loop (M3.n) and read the trends.

## What didn't work

- **An asset-free copy of the dataset** (2026-10-22). The lab was first made with `--no-assets`, to
  avoid uploading 1.1 GB of images an experiment about text would never show.
  - **What it did:** it also removed every image **figure** from the body text of 17 of 73
    documents, and figures carry alt text and captions.
  - **What that broke:** embeddings read that text, so scores drifted between the copy and the
    original. *Purpose-Driven Taxonomy Design* went from 7.865 to 7.631, which reordered ranks 2–4
    of a probe query.
  - **Why the checks missed it:** M1/M2 matched exactly, because they read only tags, and a text
    diff over `pt::text()` passed, because that function skips figures.
  - **What caught it:** a probe run against both datasets, which *should* have matched.
  - *Lesson:* compare a copy the way the experiment will use it, on embeddings as well as tags.
- **A generic embeddings projection** (2026-10-21). The projection `{title, shortDescription, body}`
  was proposed from assumed field names.
  - **The mismatch:** no type here has `body`, and presentations have no `shortDescription`.
  - **What it would have done:** embedded titles and short descriptions only, which makes any
    comparison unfair.
  - **What caught it:** checking the schema before enabling.
  - *Lesson:* an LLM's draft configuration has to be checked against the real schema.

## Where an LLM speeds things up, and where people decide

| An LLM speeds up | A person decides |
|---|---|
| Reading the schema and queries to find the fields involved, then verifying them | Which list of recommendations is *better*: the benchmark |
| Writing measurement scripts, comparisons and evaluation docs | What the domain cares about: which concepts exist at all |
| Proposing candidate terms from the corpus (NLP) | Structuring a flat list of terms into a hierarchy |
| Drafting definitions, scope notes and examples | Accepting or editing those drafts |
| Scoring every document against every concept with embeddings | Setting thresholds, after seeing real score distributions |
| Flagging what changed between evaluation runs | Content-model choices: where scores live, what a category is |
| Re-tagging incrementally when a concept changes | Author tags, which are never overridden |
