# Phase 4 — Note detail pages

CLAUDE.md is loaded. Read [docs/urls-and-filtering.md](urls-and-filtering.md) only if URL or
filtering behavior comes up; it is settled. **Read the Figma section below before opening Figma** —
it will save you two wrong conclusions that have already cost two sessions.

**Stay on `page-types`.** Branched from `next`, well ahead, unpushed. Build, `astro check`,
`studio-next` `tsc` and Prettier are green; 44 pages build with the known `[SanityHero] no altText`
warnings and nothing else.

## The work

**Build the note detail page — one route, three variants.** Today `/insights/[slug].astro` matches
`article` and `caseStudy` only, so all three notes 404 and the three note cards on the Insights index
link nowhere.

`note` is ONE Sanity type; **`genre` discriminates the three variants**, which is the vocabulary
doing its job (CLAUDE.md → the five content types):

| genre | extra object | the three live documents |
|---|---|---|
| Note | — | `stability-in-unstable-times` (1 body block, no ref) |
| Clipping | `clipRef` — `clipUrl`, `publisher`, `title`, `img` | `gall's-law-when-complexity-comes-cheap` (3 blocks) |
| Book Note | `bookRef` — `bookUrl`, `title`, `author`, `publisher`, `pubDate`, `img` | `proust-and-the-squid` (7 blocks) |

All three carry exactly one topic, which matters for the related band — see below.

**Validation to stop a Clipping carrying Book Note fields is deferred; assume the types are
consistent** (CLAUDE.md). The data currently is: each document has exactly one of the two refs.

## ⚠️ Figma — read this or repeat two known mistakes

**The file has FIVE pages and `get_metadata` with no `nodeId` reports TWO.** It prints a list headed
"Top-level pages of the document" showing only `💻 Desktop` and `⚒️ Components`, with no hint of
truncation. [docs/figma-notes.md](figma-notes.md) now leads with this; the short version:

```
0:1        💻 Desktop      949:4649  📱 Mobile      949:4650  ⚒️ Components
1472:8168  🖼️ Assets       164:1268  📝 Notes
```

**Never conclude a design does not exist** from that listing, or from searching Desktop — every mock
there is 1440 wide, so finding nothing narrower looks like proof and is not. **Mobile is `949:4649`
and Components is `949:4650`**, one digit apart; misreading a shared link between them is exactly how
the last session got it wrong twice.

To enumerate reliably, warm the pages first with a read-only `use_figma` script:

```js
for (const p of figma.root.children) await p.loadAsync()
return figma.root.children.map((p) => `${p.id} ${p.name}`)
```

`use_figma` is also the fastest way to find nodes by name across pages — far cheaper than
`get_metadata` on `0:1`, which exceeds the token cap and has to be re-read from a saved file.

### The boards you need, with ids

| board | node |
|---|---|
| Note Detail (desktop) | `261:2693` — 1440x1782 |
| Web Clipping Detail (desktop) | `261:2209` — 1440x2086 |
| Book Note Detail (desktop) | `261:2806` — 1440x2524 |
| Web Clipping Detail — Mobile | `875:4225` — 375x3413 |
| Book Note Detail — Mobile | `875:4337` — 375x4639 |
| `source card` component set | `439:717` — variants `Type=Link` / `Type=Book`, Rest + Hover, **231 wide** |
| `note card` component set | `48:930` — Note and Clipping variants, Desktop + Mobile |

**There is no "Note Detail — Mobile" board.** The Mobile page's Detail Pages section holds only
`Insight Detail — Mobile` (`674:5455`), Web Clipping and Book Note. Ask whether the plain Note reuses
the Insight mobile shape rather than inventing one — and note the general rule the RSS band taught:
**a missing board is not proof there is no design.**

**The `source card` is 231 wide, which is `span-3` — the rail column.** Same width as the button,
and for the same reason: `--col-rail` is `10 / span 3`. Expect the source card to live in the rail.

**Never use Figma's design-to-code tooling** (`get_design_context` and friends) — CLAUDE.md forbids
it, and `get_metadata` nags you to call it. Read metadata and screenshots; write the code yourself.

## What has to change in code

- **`web-next/src/pages/insights/[slug].astro`** widens to include `note`. One route that branches on
  `_type`, not a second file. `INSIGHT_SLUGS_QUERY` and `INSIGHT_DETAIL_QUERY` in
  `src/sanity/queries/insights.ts` both filter `_type in ["article", "caseStudy"]`.
- **`INSIGHT_DETAIL_QUERY` needs `clipRef` and `bookRef`** projected. Read its header comment first:
  it explains why caseStudy's body fields are deliberately absent, and the same argument applies to
  how you add these.
- **Do not fold anything large into that query.** See `INSIGHT_RSS_BAND_QUERY` in the same file — a
  fragment pushed it past a TypeScript complexity ceiling and `ClientReturn<Q>` silently resolved to
  `any`, surfacing as four implicit-any errors on unrelated callbacks in the PAGE. The generated key
  matched byte for byte; only bisection found it. If `insight` goes `any` after you add a projection,
  that is this, and the fix is a separate query.

## The related band already handles notes — but nothing has rendered it

`lib/related.ts` is built and unit-tested, and its **Note branch is correct but unexercised** because
no note page exists. When notes render, `branchForType('note')` returns the Note subtree — Note,
Clipping, Book Note — so a note's related list draws only from other notes.

**Expect the fallback to fire, for the first time.** There are three notes, each with exactly one
topic, and those topics are *Systems Thinking*, *Collaborative Design* and *Mental Models* — three
different parents. So a note's related list will likely find **nothing**, `isFallback` flips true, and
the heading becomes **"Recent Notes"**. That path has never rendered; verify it rather than assuming.

The band takes `noun="Notes"` already — `[slug].astro` passes it based on the branch.

## Traps and open items carried in

- **One slug contains an apostrophe.** `gall's-law-when-complexity-comes-cheap` — the repo's own
  `slugify` strips apostrophes (`src/lib/slug.ts`, and `studio-next/schemas/slug.ts` carries the same
  rule), so this document predates that fix. It will build a URL with a literal `'` in it. Re-slug it
  in the Studio rather than working around it, and check the other two while you are there.
- **Notes have no hero image**, so `<SanityHero>` and the article page's hero band do not apply
  unmodified. The three boards differ most at the top; read them before reusing the article header.
- **`h-entry` needs one element containing both the title and the body**, and the article page does
  not have one — the hero sits between them. CLAUDE.md → Branching. If the note layout puts title and
  body together, say so; it may be the easier place to get mf2 right first.
- **Three note cards on the Insights index currently 404.** Fixing the route fixes them.
- **The serializer specimen** is still published and on the index (phase 7 decision deferred).
- **`grid-auto-flow: dense`** on the masonry stands; its measured figures predate the ladder change
  and would need re-measuring if revisited. See [docs/open-questions.md](open-questions.md).

## How to work

CLAUDE.md's table governs. **Layout mechanics, the cascade, component boundaries, URL design and
semantics are Andy's** — explain the platform behavior and let him steer. Query modules, transcription
from the boards and repetitive sweeps are yours.

> **Draft the basic shape, then stop.** Andy reviews, guides and refines, and hands the refinements
> back for critique. Do not build all three variants and present them finished.

Say what you are about to write before writing it. **Measure in the browser rather than looking** —
and measure the built HTML too, not just the live DOM: the last session shipped `45insights` into the
static output because Astro drops whitespace between adjacent expressions once a formatter splits
them across lines, and the browser never showed it because script rewrote that line on load.

**When a comment and the code disagree, the comment is a bug.**
