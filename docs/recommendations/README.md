# The recommendations work

The record of rebuilding how the site relates content, from the research that asked what a
taxonomy adds to related content when embeddings are also available (2026-10-21 to 2026-11-06)
through the two streams that brought its results to the live site (2026-11-19 to 2026-11-24).
[related-content.md](../related-content.md) explains the ranker as it now runs; these are the
working documents behind it.

**Read them as records, not instructions.** Each stream document was written to start a session,
so parts are in the imperative, and each gathered its results as it went. What is current is
`related-content.md`, CLAUDE.md, and the code.

## The streams

- [stream-1-data.md](stream-1-data.md) — the lab becomes production: `production-26` recreated
  from `recommendations-lab`, with the revised Topic scheme and the research's tags (2026-11-19
  to 2026-11-21)
- [stream-2-ranker.md](stream-2-ranker.md) — the ranker goes to production: the cross-category
  ranker as a tested module, the golden test, the page wiring, and the old branch rule removed
  (2026-11-21 to 2026-11-24)
- **Stream 3, assisted tagging in the Taxonomy Manager plugin,** is not here. It is the
  plugin's work, in `andybywire/sanity-plugin-taxonomy-manager` →
  `docs/development/embeddings-tagging/`, moved there on 2026-11-24 so the two projects stop
  depending on each other. Its experiments and tests run in the plugin's own dev Studio, not in
  this site's lab (Andy, 2026-11-24).

## Where the research lives

The research folder, `docs/recommendations-research/`, left this repository on 2026-11-24: 68
files, mostly generated, of scripts, score matrices, tag sets, evaluation reports and backups.

- **In git history at `ae73f98`,** the last commit that has all of it. Read a file there with
  `git show ae73f98:docs/recommendations-research/<file>`.
- **The research scripts that ran the site's old branch rule last run at `b4e85bd`,** the last
  commit that has the rule; each script's header says so.
- **In the plugin repository,** `docs/development/embeddings-tagging/` holds what the next work
  needs: `research/` has `plan.md`, `report-spike.md`, `how.md`, `value-add.md`,
  `what-goes-where.md` and `related-algorithm.md`, copied unchanged from `ae73f98`, beside the
  prototype tagger and the v5 tag set with the score matrix it came from.

`plan.md` is the research's own record: its decisions, phases, specs, the six evaluation rounds,
and "Where things stand". Where a stream document cites it, read it at either place above.
