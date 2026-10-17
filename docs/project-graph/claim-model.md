# Project Graph: the claim and provenance model

**Decided by Andy, 2026-10-17** (the start of stage 4 of [protocol.md](protocol.md)). Stage 4
builds to this, on top of [id-design.md](id-design.md), which settled what a claim is and its three
kinds.

## The rule that admits a term

**Every term in the model is read by a shape or a saved query.** That's the same warrant-first test
the vocabulary passed: a term that nothing reads is decoration, and it goes.

## The model

- **Three classes, each a kind of `prov:Entity`:** `model:Observation`, `model:Decision` and
  `model:RepoFact`. They live in `project-graph/model.ttl`, namespace
  `https://andyfitzgeraldconsulting.com/ns/project-graph/model#`, following the
  one-namespace-per-file rule.
- **Standard terms for everything else:** PROV-O for how a claim came to be and for what overturned
  it; `dcterms:subject` for the concepts a claim is about; `dcterms:description` for its text;
  `dcterms:date` for when.
- **Andy is the site's existing Person IRI,** `https://andyfitzgeraldconsulting.com/#person`, which
  `nodeId()` in `web/src/lib/linked-data.ts` mints. That ties the Project Graph to the site's own
  identity graph rather than minting a second Andy.
- **`dcterms:date`, not `prov:endedAtTime`.** PROV's time properties take a full date and time, and
  every date in these comments is a day. Writing midnight UTC would claim a precision nobody has.

```turtle
# CardMasonry, 2026-09-30: measured in real browsers, by Andy.
claim:scripted-focus-draws-ring a model:Observation ;
  dcterms:subject concept:programmatic-focus, concept:focus-ring ;
  dcterms:description "Script or fragment focus on a tabindex=-1 element draws the focus ring in real browsers."@en ;
  prov:wasGeneratedBy _:seen-in-real-browsers .

_:seen-in-real-browsers a model:Measurement ;
  model:method "Seen by Andy in Chrome, Safari and Vivaldi."@en ;
  dcterms:date "2026-09-30"^^xsd:date ;
  prov:wasAssociatedWith <https://andyfitzgeraldconsulting.com/#person> ;
  prov:invalidated claim:scripted-focus-draws-no-ring .

# The belief CardMasonry says it "measured wrong first".
claim:scripted-focus-draws-no-ring a model:Observation ;
  dcterms:subject concept:programmatic-focus, concept:focus-ring ;
  dcterms:description "A tabindex=-1 element does not draw a visible ring from a scripted .focus()."@en ;
  prov:wasGeneratedBy [ a model:Measurement ;
    prov:used concept:headless-chrome, concept:browser-pane ;
    model:method "Read :focus-visible after a scripted focus."@en ] .

# base.css, 2026-08-31: a decision, attributed.
claim:hidden-means-not-applicable a model:Decision ;
  dcterms:subject concept:not-applicable, concept:styled-away ;
  dcterms:description "Use [hidden] for 'not applicable' and a class for 'styled away'."@en ;
  prov:wasAttributedTo <https://andyfitzgeraldconsulting.com/#person> ;
  dcterms:date "2026-08-31"^^xsd:date .

# ContactForm and search.ts: stated bare, so the claim says so.
claim:focus-needs-forced-reflow a model:Observation ;
  dcterms:subject concept:forced-reflow, concept:programmatic-focus ;
  dcterms:description "focus() does nothing on an element un-hidden in the same task unless layout is forced first."@en ;
  model:basis model:assumed .
```

**An overturned claim is plain PROV.** The activity that produced the new claim also
`prov:invalidated` the old one, so the two are joined through the evidence. No custom "superseded
by" link is needed.

**Code locations are the extractor's output, never authored:** a file path, a line, the concepts its
`@concept` tag names, and the claims its `@claim` tag names. They are regenerated on every run.

## What reads each term

| Term                                                   | Read by                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| The three classes                                      | Shapes: each kind needs different backing                                                    |
| `model:basis model:assumed` / `model:unattributed`     | Shape: a claim says how it's known. Query: what is only assumed, or unattributed?            |
| `prov:wasGeneratedBy`, `model:method`, `dcterms:date`  | Query: how was this claim established?                                                       |
| `prov:used` an automated-browser concept               | Query: what was only ever measured by automation? That's the lesson of 2026-09-30.           |
| `prov:wasAttributedTo` + `dcterms:date` on a decision  | Shape: a decision says who and when. Query: is this settled? (task T4)                       |
| `prov:invalidated`                                     | Shape: no code location's tag points at an overturned claim                                  |
| `dcterms:subject`                                      | Query: what is claimed about this concept?                                                   |
| `dcterms:description`                                  | Every query answer, so it can be read without opening files                                  |

## The four decisions

1. **Three classes on PROV,** rather than `schema:Claim` or nanopublications. `schema:Claim` is
   built for fact-checking factual claims, so decisions fit it poorly. Nanopublications' named
   graphs are the most rigorous model, and nothing here needs them yet.
2. **A gap is an explicit state, not a violation.** An unmeasured observation must say
   `model:basis model:assumed`, and an unattributed decision `model:basis model:unattributed`. The
   check enforces that every claim declares its basis, and a query lists the weak ones. **The
   check fails on what is known to be wrong, never on what is merely unknown:** a tag pointing at
   an overturned claim is a violation; a claim nobody measured is not. Otherwise the arms, which
   encode the comments as they are, would start out red for honest reasons, and red would stop
   meaning that something is wrong.
3. **One canonical sentence per claim,** in `dcterms:description`. It's short and neutral, in the
   claim's own polarity, matching its slug. The comments keep their own wording and reasoning. This
   is a single, deliberate extra copy: the claim's definition, not another restatement. "No text"
   would make every query answer a trip into the files, and a verbatim quote of the earliest
   statement would drift silently whenever that comment was edited.
4. **The arms are annotated blind, by a fresh session** given only concepts.ttl, model.ttl and a
   self-contained annotation guide that stage 4 writes. It never sees anything in this folder,
   and that includes this file, which names the match below, and id-design.md, which names
   contradictions. The guide restates the rules it needs and nothing about the tasks.
   Recognizing that two comments state the same claim is the judgment the whole experiment turns on.
   In particular, it's ContactForm's sentence matched to the belief CardMasonry says was "measured
   wrong first", which would make arm C's own check flag contradiction 1. Whoever makes that match
   must not know it's the test.

## What stage 4 builds, in order

Each piece stops for review, and every shape gets planted cases in `tests/`:

1. **`model.ttl` and the claim shapes:** the classes, plus the shapes for each kind's backing and
   for "no tag points at an overturned claim".
2. **The extractor:** comment tags to Turtle, written to a temporary directory, never the repo.
3. **The saved queries,** one per row of the table above that names a query.
4. **The annotation guide** for the blind annotator. It lives in `project-graph/`, not here, because
   the annotator may read that folder and never this one. It restates id-design.md's rules (slugs,
   tags, the three kinds, how finely to split) and this file's basis states, and says nothing
   about tasks or contradictions. It's tried on a sample before stage 5 uses it.
