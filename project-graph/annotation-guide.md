# Annotating comments for the Project Graph

This guide is everything you need to annotate this repository's comments. It is meant to be read
on its own, together with two files beside it: `concepts.ttl`, the vocabulary, and `model.ttl`,
what a claim is made of.

## What you are doing

This repository keeps much of its working knowledge in comments: why a rule exists, what a browser
does, what was decided and by whom. You are making that knowledge findable by tool. You'll do two
things:

1. **Tag comments** with the concepts they are about and the claims they make or rely on, by
   adding a line or two at the end of each comment.
2. **Record each claim once,** in `project-graph/claims.ttl`: one sentence saying what it claims,
   what it's about, and how it's known.

You are describing what the comments say. You are not judging whether it's right, improving it,
or reconciling one comment with another.

## Rules that are never broken

- **Never change existing text.** No comment is fixed, reworded, moved or removed, and no code
  changes at all. The only thing you add to a source file is tag lines.
- **Never add a concept.** `concepts.ttl` is fixed for this work. If a comment needs a concept
  that isn't there, tag it with the nearest broader one that is, and say so in your final report.
- **Never mark a claim as wrong, stale or in conflict with another.** If two comments disagree,
  each statement becomes its own claim, recorded as stated, and nothing links them.
- **Never supply what a comment doesn't say.** Don't invent a date, a person, a browser or a
  method. If a comment gives no way it was established, the claim says it is assumed. If a
  decision names nobody, it says it is unattributed.

## 1. Find the comments

Work through the files the extractor reads: everything under `web/src` and `web/server`, plus
`docs`, `CLAUDE.md` and `DESIGN.md`, in the file types `.astro`, `.ts`, `.mjs`, `.js`, `.css`,
`.md` and `.php`.

For each concept in `concepts.ttl`, search those files for its preferred label and each of its
alternate labels, case-insensitively. Read its scope note too. **Some words are deliberately
nobody's label,** because each means several different things in this repository, and the header
of `concepts.ttl` names them. When a comment uses one, the scope notes tell you which concept, if
any, it means.

**A comment is in scope when it says something about one of the concepts:** what it is, how it
behaves, why the code handles it this way, or what was decided about it. A label that appears only
in passing, in a sentence about something else, does not put the comment in scope.

## 2. Tag a comment

Add the tags as the comment's last lines, one line for concepts and one for claims, each followed
by slugs separated by single spaces:

```css
/*
 * …the comment, exactly as it was…
 *
 * @concept landing-point focus-ring
 * @claim some-claim-slug
 */
```

The same form works in every language this repository uses. Match the comment's own marker:

| Where                        | A tag line looks like                    |
| ---------------------------- | ---------------------------------------- |
| CSS, JS or TS block comment  | ` * @concept landing-point`              |
| JS or TS line comment        | `// @concept landing-point`              |
| Astro template comment       | `@concept landing-point` (no marker), inside the existing `{/* … */}` |
| Markdown                     | `<!-- @concept landing-point -->`, on its own line after the paragraph |
| PHP                          | `// @concept landing-point`              |

- **A tag covers the whole comment it ends.** Put tags only at the end, never in the middle.
- **Keep the tag lines together.** Consecutive tag lines count as one tagged comment, so a blank
  line between them would split it in two.
- **Use the most specific concept that fits:** a narrower concept rather than its broader one,
  when the comment is about the narrower thing. Use several concepts when the comment really is
  about several things.
- **Only `@concept` and `@claim`,** singular, in lowercase. A slug is lowercase words joined by
  hyphens.

## 3. Find the claims

**A claim is a statement that could turn out false, and that something in the repository depends
on.** Each claim is exactly one of three kinds:

| Kind            | It is about                                                                  | Ask                                                       |
| --------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Observation** | How a browser, the cascade, a tool or a platform behaves                     | Could a test in a browser show this is false?             |
| **Decision**    | A choice that settles a question: "we do X, not Y"                           | Is this a choice someone made, rather than a fact about the world? |
| **Repo fact**   | The repository itself: a file, a line, a count, where something is recorded, its history | Could reading the repository or its git history show this is false? |

**Not claims:**
- A description of what the code beside the comment does. The code says that itself.
- A judgment that can't be false, such as "reads more clearly".

**One claim is one statement that can be true or false on its own.** Split a sentence whose parts
could fail separately. A comment can make several claims, and a claim can be made by several
comments.

## 4. One claim, one id

This is the step that matters most, so take it slowly.

- **Before minting a new claim, look for an existing one.** Read `claims.ttl`, and run
  `pnpm graph query about <concept>` for the concepts involved. If another comment states the
  same thing, **reuse its slug**, even when the wording is quite different. One claim stated in
  five places is one claim with five tagged comments.
- **Two statements that disagree are never the same claim,** however close their wording. Each
  gets its own slug, and nothing links them.
- **A slug states the claim in its own polarity:** `sticky-works-inside-overflow-hidden` and
  `sticky-fails-inside-overflow-hidden` are two claims. It's lowercase words joined by hyphens,
  short but unambiguous.
- **A slug is never renamed once used.** If you find you have worded a claim badly, change its
  description, not its slug.
- **Tag a comment with a claim only if the comment states it as true, or relies on it.** A comment
  that describes a belief in order to say it was disproved does neither for that belief. It is
  tagged with what replaced it, and the link to the old belief is recorded in `claims.ttl`, as
  step 5 shows, not in a tag.

## 5. Record each claim in `claims.ttl`

Create `project-graph/claims.ttl` if it doesn't exist, starting with these prefixes:

```turtle
@prefix concept: <https://andyfitzgeraldconsulting.com/ns/project-graph/concepts#> .
@prefix claim: <https://andyfitzgeraldconsulting.com/ns/project-graph/claims#> .
@prefix model: <https://andyfitzgeraldconsulting.com/ns/project-graph/model#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
```

Every claim has **one canonical sentence** (`dcterms:description`, in English, tagged `@en`). It's
short and neutral, says only what the comments say, and is worded in the claim's own polarity. It
has **at least one concept** (`dcterms:subject`). Then its backing, by kind:

**An observation that a comment says how it was established.** Use the comment's own words for the
method. Add a date only if the comment gives one. Add `prov:used` only when the comment says an
automated tool did the looking, and only with that tool's concept from `concepts.ttl`, if it has
one. Name real browsers, and anything else, in the method text.

```turtle
claim:some-observation a model:Observation ;
  dcterms:subject concept:some-concept ;
  dcterms:description "One neutral sentence saying what the comments say."@en ;
  prov:wasGeneratedBy [ a model:Measurement ;
    model:method "As the comment describes it: what was looked at, where."@en ;
    dcterms:date "2026-01-31"^^xsd:date ] .
```

**An observation with no stated basis:**

```turtle
claim:some-assumption a model:Observation ;
  dcterms:subject concept:some-concept ;
  dcterms:description "…"@en ;
  model:basis model:assumed .
```

**A decision.** Attribute it to Andy only when a comment names him, as in "(Andy, 2026-01-31)",
"Andy's call" or "decided with Andy". His IRI is the site's own,
`<https://andyfitzgeraldconsulting.com/#person>`. Otherwise it is unattributed.

```turtle
claim:some-decision a model:Decision ;
  dcterms:subject concept:some-concept ;
  dcterms:description "…"@en ;
  prov:wasAttributedTo <https://andyfitzgeraldconsulting.com/#person> ;
  dcterms:date "2026-01-31"^^xsd:date .

claim:some-unattributed-decision a model:Decision ;
  dcterms:subject concept:some-concept ;
  dcterms:description "…"@en ;
  model:basis model:unattributed .
```

**A repo fact** carries nothing beyond its sentence and subjects:

```turtle
claim:some-repo-fact a model:RepoFact ;
  dcterms:subject concept:some-concept ;
  dcterms:description "…"@en .
```

**When a comment says that an earlier belief was disproved,** record both: the belief, as its own
claim, worded as the comment describes it, and what replaced it. The measurement that established
the replacement also `prov:invalidated` the belief. Record this **only** when a comment says it in
so many words, such as "we thought X, then found Y" or "this turned out not to be true". Never
infer it from two comments that happen to disagree.

```turtle
claim:the-old-belief a model:Observation ;
  dcterms:subject concept:some-concept ;
  dcterms:description "…, as the comment describes the earlier belief."@en ;
  model:basis model:assumed .

claim:what-replaced-it a model:Observation ;
  dcterms:subject concept:some-concept ;
  dcterms:description "…"@en ;
  prov:wasGeneratedBy [ a model:Measurement ;
    model:method "…, as the comment describes the test."@en ;
    prov:invalidated claim:the-old-belief ] .
```

If the earlier belief was itself established some way that the comment describes, record that
basis instead of `model:assumed`.

## 6. Check your work

Run `pnpm graph check` as you go, and at the end.

- **Fix what it reports about form:** a malformed tag, a mistyped slug, a missing sentence or
  subject, a claim that doesn't say how it's known, a date that isn't a date.
- **Never change a tag, a slug or a link to make the check pass.** The check can also report that a
  comment cites a claim a measurement overturned. That describes what the comments say, not a
  mistake in your annotation. Leave it exactly as it is.

`pnpm graph query` lists the saved queries. `about <concept>` and `claim <slug>` are the most
useful while annotating, for finding claims you have already recorded.

## 7. Report, in your final message

When you're done, say in your final message, **not in any file**:

- comments you weren't sure were in scope;
- claims you nearly merged, or nearly split, and what you decided;
- concepts a comment needed that `concepts.ttl` doesn't have;
- anything in this guide that was unclear.

Nothing judgmental goes into the repository itself. The tags and `claims.ttl` record what the
comments say, and your doubts belong in the report.

## A worked example, on an invented topic

`position: sticky` is not part of this vocabulary, so the concept and claims below are invented
for illustration only. Suppose three comments in three files:

> **`a.css`**: "Sticky positioning fails inside an ancestor with `overflow: hidden`, so the header
> sits outside the card."
>
> **`b.css`**: "Same reason as the header: a sticky element inside an `overflow: hidden` ancestor
> never sticks."
>
> **`c.css`**: "We assumed sticky could not work inside the clipped card. Testing in Safari and
> Chrome showed it does, as long as the card itself scrolls."

- **`a.css` and `b.css` state the same claim** in different words: one slug,
  `sticky-fails-inside-overflow-hidden`, tagged in both. Neither gives a basis, so it is assumed.
- **`c.css` states that the earlier belief was disproved,** and how. It establishes a new claim,
  `sticky-works-when-the-clipped-ancestor-scrolls`, measured "in Safari and Chrome", and that
  measurement `prov:invalidated` the belief. The belief is the same claim `a.css` and `b.css`
  state, so the same slug is reused rather than a new one minted. **`c.css` is tagged only with
  the new claim.** It describes the old belief in order to reject it, so it neither states nor
  relies on it, and the invalidation already records the link.
- **Nothing in `a.css` or `b.css` changes.** If `pnpm graph check` then reports that they cite an
  overturned claim, that's the comments as they are, and it stays.
