# The Project Graph experiment

A test of whether treating this repo's comments as a knowledge graph makes context cheaper to
retrieve and more trustworthy. It compares three arms on the focus-and-visibility area.

**This folder is the record, and it holds the answer key.** Never copy it into an arm branch: the
inventory lists every contradiction T3 scores, and the protocol carries every rubric.

| File                             | What it holds                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------- |
| [protocol.md](protocol.md)       | Hypotheses, predictions, arms, tasks and rubrics, how runs are done and read  |
| [inventory.md](inventory.md)     | Ground truth at `086dd0f`: claims, where they're stated, contradictions       |
| [id-design.md](id-design.md)     | Namespaces, slugs, comment tags, what counts as a claim                       |

## Where the tooling lives

Decided by Andy, 2026-10-17, at the start of stage 3:

- **`project-graph/` at the repo root** holds the tooling and the graph data: Turtle, SHACL shapes,
  saved queries and the scripts. It covers the whole repo, so it doesn't belong to `web/`. It is
  the only folder an arm branch receives. In every arm, everything outside it must be comment tags
  plus one CLAUDE.md section, which makes the arm-diff check mechanical.
- **A plain folder, not a workspace package,** until a dependency earns one. The root `graph`
  script runs `node project-graph/graph.mjs` directly. The extractor writes Turtle as text, and
  Jena does all the parsing.
- **Jena is one pinned version, checksum-verified, downloaded once into a shared cache outside any
  checkout.** Every run is a fresh worktree, so a copy inside the checkout would make arm C pay for
  a download in the very wall time and tool calls the protocol measures. CI uses the same script.
- **Generated output never lands in the repo.** Extracted code locations go to a temporary
  directory for each run.

## Status

| Stage                      | State                                                    |
| -------------------------- | -------------------------------------------------------- |
| 0. Correct my own error    | Done on `main`, `96c10e5`                                |
| 1. Protocol and inventory  | Done, `39560e2`                                          |
| 2. Id design               | Done, `5ce8534`                                          |
| 3. Vocabulary and checks   | 3a, 3b built: Jena, `pnpm graph check`, 18 concepts; 3c next |
| 4. Claims and extractor    | Not started                                              |
| 5. Arms and runs           | Not started; preconditions are in the protocol           |
| 6. Analysis                | Not started                                              |
