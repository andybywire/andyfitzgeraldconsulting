# Project Graph: id design

**Decided by Andy, 2026-10-17** (stage 2 of [protocol.md](protocol.md)). Stages 3 and 4 build to
this. Arms B and C both use it, so the only difference between them stays the semantic layer.

## Where the ids live

**Under the site's domain, at a reserved path, with one hash namespace per authored file:**

| What     | Namespace                                                  | Turtle prefix | Example                                      |
| -------- | ---------------------------------------------------------- | ------------- | -------------------------------------------- |
| Concepts | `https://andyfitzgeraldconsulting.com/ns/project-graph/concepts#` | `concept:`    | `concept:landing-point`                      |
| Claims   | `https://andyfitzgeraldconsulting.com/ns/project-graph/claims#`   | `claim:`      | `claim:scripted-focus-draws-ring`            |

- **The same authority as the repo's two existing vocabularies.** The site's JSON-LD mints hash
  IRIs on the domain (`…/#organization`, `nodeId()` in `web/src/lib/linked-data.ts`). The Studio's
  SKOS concepts use it as their base URI (`taxonomyManager` in `studio/sanity.config.ts`), even
  though concepts are not addressable pages.
- **`/ns/` keeps the two vocabularies apart.** A development concept can't collide with a content
  concept at the domain root, so any later link between them (a `skos:closeMatch` to the Topic
  scheme's Accessibility, say) would be made on purpose. `docs/urls-and-filtering.md` reserves the
  path so no page route takes it.
- **Nothing resolves today, by design,** just as the content concepts don't. If serving the files
  ever earns its place, nginx can serve the two Turtle files at these paths as static files, and
  no id changes. Hash IRIs fit that: requesting the namespace returns the whole file.

## What the ids look like

**Readable slugs, never renamed.** Lowercase, hyphenated: `[a-z0-9]+(-[a-z0-9]+)*`.

- **A slug is an identifier, not a label.** When wording changes, the concept's `skos:prefLabel`
  or the claim's text changes, and the slug stays. A retired slug is never reused for something
  else.
- **A concept's slug is its preferred label when it is created.** Nothing ties them together
  after that.
- **A claim's slug states the claim in its own polarity.** Two statements that disagree get two
  slugs, such as `scripted-focus-draws-ring` and `scripted-focus-draws-no-ring`, and neither is
  marked as wrong. Arms encode what the comments say.
- **Why not opaque ids:** arm B finds everything with grep, and people read these slugs in
  comments. An opaque id would serve neither.

## Code locations get no ids

**The extractor regenerates them on every run, as blank nodes carrying a repository-relative path
and a line number.** They're derived data and are never committed, so no stored line number can
drift. Nothing outside a single extraction refers to a code location.

## How a comment carries annotations

**Tags on their own lines, at the end of a comment:**

```css
/*
 * …the comment, exactly as it was…
 *
 * @concept landing-point focus-ring
 * @claim scripted-focus-draws-ring
 */
```

- **A tag is a line that starts with `@concept` or `@claim` once any comment markers are
  removed** (`*`, `//`, `{/*`, `<!--`), followed by one or more slugs separated by spaces.
- **A tag covers the whole comment it ends.** That is the unit both the lint and the extractor
  report.
- **Markdown** carries the same tags inside an HTML comment on its own line, so nothing shows when
  rendered: `<!-- @concept landing-point -->`. **Astro templates** carry them inside the existing
  `{/* … */}` comment.
- **Tags only add lines.** No existing word moves, so a diff of an arm against `086dd0f` is
  additions only. That's how the protocol checks that nothing was reworded, and it's why inline
  `[[links]]` were passed over.
- **One relation, for now:** a `@claim` tag means "this comment states or relies on this claim."
  Separating "states" from "relies on" waits until a query needs it.
- **No collisions:** neither tag appears anywhere in the repo at `086dd0f`. Neither is a JSDoc
  tag, and TypeScript ignores tags it doesn't know.

## What counts as a claim

**A statement that could turn out false, and that something in the repo depends on.** It comes in
three kinds, because each needs different backing. In arm C, stage 4's SHACL shapes enforce the
backing. Arm B's glossary records the same fields as plain text.

| Kind            | About                                                                         | Must carry                                                    |
| --------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Observation** | How a browser, the cascade, a tool or a platform behaves                      | How it was established (method, where, when), or an explicit "assumed" |
| **Decision**    | A choice that settles a question                                               | Who decided, and when                                         |
| **Repo fact**   | The repository itself: a file, a line, a count, where something is recorded, its history | Nothing; a script can check it                     |

**Not claims:**
- Descriptions of what the adjacent code does. The code is the authority there.
- Judgments that can't be false: "reads as a bug rather than a focus position."

**How finely to split:** one claim is one statement that can be true or false on its own.
**Kept as written by Andy, 2026-10-18,** after the guide's trial produced 79 claims from 47
comments, half of them cited once and 17 in one header (guide-trial.md). The alternative was
recording only the claims a comment makes a point of. It was turned down for three reasons:

- The trial's one real disagreement sat in an incidental clause, which that rule would likely have
  dropped.
- "Makes a point of" is a judgment, where this rule is close to mechanical, and the experiment rests
  on one blind annotation per arm.
- What the literal rule costs is part of what the protocol measures.

Accepted with it: long tag lines on long comments, whose line number points at the comment's end.

- **Split** a statement whose parts can fail separately. "Real browsers draw the ring" and
  "automation misreports it" are two claims.
- **Merge** restatements of the same statement across files into one id. That's where the
  duplication becomes visible: one claim, several locations.
- **Never merge two statements that disagree.**
- **Start from [inventory.md](inventory.md)'s 34 rows,** and adjust as these rules require.

**Repo facts are not checked during the experiment, in either arm.** Three of the 11 hard
contradictions (#8, #9, #10) are repo facts, and a plain script could catch them with no RDF.
Checking them in one arm would credit that arm with something that has nothing to do with the
graph. A script that checks repo facts belongs to the repo whatever the experiment concludes. It's
a separate piece of work, to propose afterward.
