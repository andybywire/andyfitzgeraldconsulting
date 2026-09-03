# URLs and filtering

The URL contract and the behavior of the Insights facet browse. Companion to
[decisions/](decisions/), which covers the design system; this covers addressing and browse
behavior, which are content-model concerns rather than design ones.

**This file exists because the decisions in it are separated by months, and by phase.** The URL
design was settled in phase 1; the filtering it was designed around is built in phase 4; the
redirects are written in phase 6 with the nginx config, since they are inert until there is a server
to serve them. Anything settled in one phase and needed in another goes here rather than into a
commit message.

Decided 2026-08-18 unless noted.

## The URL surface today

Read from `web/_src/` before it is replaced, so the redirect inventory is grounded rather than
remembered.

| Pattern | Count | Fate |
|---|---|---|
| `/insights/{slug}/` | 42 | **unchanged** |
| `/insights/` | 1 | unchanged |
| `/insights/page-N/` | 4 (paginated at 10) | gone — no pagination in the new design |
| `/insights/tag/{prefLabel⇒slug}/` | one per taxonomy term (~70) | gone — becomes a filter param |
| `/talks/` | 1 | → `/presentations/` |
| `/feed.xml` | 1 | **must not move** |
| `/insight-search.json` | 1 | superseded by the facet index; nothing links to it |

## Redirects live in nginx, not in Astro

Astro's `redirects` config emits `<meta http-equiv="refresh">` HTML pages under `output: "static"`,
not real 301s. Status codes need the server.

- **Keep the map in the repo** and have the deploy copy it. This is the one part of the URL contract
  that cannot be verified locally, so it is the last part that should live only on the droplet.
- **Include it into both server blocks.** Production and the SSR preview sit behind the same nginx.
- **`/feed.xml` stays exactly where it is.** Feed readers are the least forgiving consumers of a moved
  URL — some handle a 301 poorly and simply go quiet. When per-taxonomy feeds arrive in phase 8 they
  are additions, not a reorganization.

**Tag URLs redirect to a filter param, not to a bare index**, because the visitor's intent was the
topic and the new design can honour it:

```
rewrite ^/insights/tag/(.+?)/?$ /insights?topic=$1 permanent;
```

**One rule covers all ~70** because the old permalink was `prefLabel | slug` and the new param uses
the same slugification. Anything renamed since is caught by altLabel resolution below, not by a
second rule.

## Readable slugs, with altLabel as the alias mechanism

**Filter params carry slugified prefLabels, not opaque identifiers.** The alternative — stable
non-semantic IDs — was considered and rejected: a readable URL is a permanent benefit paid on every
link, and an opaque one is a permanent cost paid the same way.

The usual objection is that a label is not an identifier, so renaming a concept breaks every link
silently. **SKOS already answers this.** `altLabel` means "another lexical label for this concept," so
a deprecated label becomes an altLabel and old URLs keep resolving. This is the vocabulary working as
designed rather than slug-history plumbing bolted alongside it. It holds because the vocabulary has a
single owner, which is the condition that usually fails.

**Two things this requires:**

- **Resolution must be wired from the start.** If the filter matches only prefLabel slugs, altLabels
  sit in Sanity attached to nothing. The facet index carries, per concept, *every* slug that resolves
  to it — prefLabel plus altLabels — so an old link works the day the label changes rather than the
  day someone remembers it.
- **altLabel covers relabels, not restructures.** If a concept splits or merges, pointing the old slug
  at one of the results is an editorial judgment, not a mechanical alias. That case needs a decision,
  not an entry.

### altLabel resolution is NOT wired — decided 2026-08-31

**Reversing the first bullet above, deliberately.** The filter matches prefLabel slugs only.

The chips are generated from the tally, so a resolvable-slugs list would have to be either a second
data structure alongside them or a second chip per altLabel — and **rendering an altLabel as its own
chip puts two controls with identical behavior side by side**, which is worse than the problem it
solves. altLabels stay in the vocabulary for eventual **search** support, which is the surface where a
synonym helps rather than duplicates.

**One consequence, parked rather than solved.** Phase 6's rewrite
`/insights/tag/{slug}/ → ?topic={slug}` was designed assuming altLabel matching would catch concepts
renamed since those URLs were minted. Without it, a renamed concept's old tag URL lands on a param
that no longer resolves and — per *the empty and unknown states* below — silently shows the unfiltered
index. Graceful, and now a **known consequence rather than a phase 6 surprise.**

## The filter model

**Query parameters driving client-side JS.** Not static tag pages, not SSR. Filter state is
reflected in the URL so a particular configuration can be linked to, including from elsewhere on the
site and from syndicated copies.

- **AND across everything.** Multiple selections intersect, whether they are topics, genres, or a
  mix.
- **Controls update live.** Selecting a facet updates the remaining facets' counts to reflect the
  intersection, and options that would return nothing become unavailable.
- **"Select all" resets** — all resources shown, all selections cleared.
- **Direct tags only.** A resource is matched by the topics assigned to it, not by their ancestors.
  No transitive closures, so the hierarchy does not need shipping to the client.
- **No pagination.** Cards render server-side; "Show more" then "Show all" reveal them. **Built
  2026-08-31** — this line previously said "not scoped for the initial release."
- **Facet controls sort by hit count, descending — once, at build time.** They do **not** re-sort as
  the selection changes; see below.

### The reveal is a second axis, and it is deliberately not in the URL

**Decided 2026-08-31, built the same day.** How many cards are on screen is two independent things:

| | lives in | shareable | survives navigation away |
|---|---|---|---|
| **filter** | the URL | yes — that is the point | yes |
| **reveal** | session memory | no | no, resets to 24 |

A link should carry *what* you were looking at, not *how far* through it you had scrolled. So Back
after "Show all" leaves the page rather than re-collapsing it, which is the accepted cost.

**The two never overlap.** A filtered view shows every match and offers no controls at all: the
largest topic holds 15 of 45, so filtering is already a reduction, and truncating a reduction to 24
would be a second cut nobody asked for. **The reveal is remembered across it** — expand, filter,
clear, and you are back where you were rather than back at 24.

That non-overlap is load-bearing beyond the UX: it makes truncation always a **DOM suffix**, which is
what stops it disturbing the masonry ladder's `:nth-child(… of :not([hidden]))` count. If the two axes
are ever combined, that guarantee needs re-checking.

**24 initially, +24 per press**, and the two controls appear on different conditions:

- **"Show all"** whenever anything is held back.
- **"Show more"** only when a further step would leave a remainder — otherwise it is a second button
  doing exactly what the first does. At 45 with a step of 24 that means "Show all" alone; at 50 it
  means both, until the first press.

**The chips still count the whole collection, never the revealed subset.** That is why the count line
sits *below* the grid: the number on a chip and the number of cards on screen are answering different
questions, and putting them adjacent would invite reading one as the other.

**With no JavaScript every card renders and neither control exists.** Truncation is applied by a
single rule gated on `html.js`, set by BaseLayout's synchronous head script, so it is in force at the
first paint rather than applied as a visible collapse — and it never applies to someone who could not
undo it. Verified: 24 cards render with the class, 45 without.

### Chip order is fixed at build time — decided 2026-08-31, on the built page

**This reverses "and re-sort as the selection changes."** The chips were built, filtered by hand, and
the re-sort judged on screen: **everything moving on every click is obnoxious**, and it costs more than
the ordering buys.

The two costs this file had already predicted both landed, and a third was not predicted:

- **The chip you just clicked teleports.** Anticipated here as "the specific interaction that reads as
  broken", with pinning selected facets to a leading group offered as the fix. Pinning is a second
  mechanism to maintain, and it only rescues the selected chips — every *unselected* chip still moves.
- **Re-finding a term seen a moment ago gets harder**, which is the thing alphabetical is good at and
  count-descending is not. A stable order is not alphabetical, but it is at least *learnable*.
- **Not predicted: a fixed order is what makes the zero-hit chips useful.** They stay where they were,
  dimmed and reading zero, so the row keeps showing *what else is in the collection* rather than
  quietly deleting it. The count-descending sort was supposed to sink them out of sight; leaving them
  in place turns them into a map of what the current selection excludes, which is strictly more
  informative than an empty space.

**So the sort still runs — it just runs once.** The build tallies unfiltered counts, sorts
count-descending with an alphabetical tiebreak, and that is the order for the life of the page. Live
counts still update in place on every selection; only the *positions* are frozen.

**This retires "hide versus disable unavailable facets" as well.** That question was resolved by
appeal to the re-sort — "sort by count descending and a zero-hit facet sinks to the bottom on its own."
Without the re-sort it does not sink, so `filter-chip-disabled` stops being a state that only surfaces
inside "See all" and becomes **the ordinary appearance of an excluded facet**, visible in the truncated
row. That is the intent, not a side effect. The state was already specified and styled —
`aria-disabled="true"` with the click prevented, since anchors have no `disabled`.

### The axis is called "genre", not "insight type"

**Decided against `insightType`** because the same facet pattern appears on the Presentations page,
where "insight type" would be inaccurate. `genre` describes the axis on both, and the vocabulary can
be shared between them — which also means `?genre=` carries the same slugs wherever it appears.

The name sits in three places, and only one of them costs anything to change:

| | Cost |
|---|---|
| New genre concepts (Note, Clipping, …) | none — new documents, already part of the phase 1 work |
| The concept scheme's own label | none — a label edit |
| The Sanity **field** `insightType` → `genre` | **42 documents hold data under the old key** |

Renaming a schema field does not move stored data, so the third one needs a patch — set `genre` from
`insightType`, unset `insightType`, across 42 documents. That is a few minutes of scripted patching,
and it is **not** the migration suite CLAUDE.md declined: that decision was about keeping two datasets
in sync, not about a one-off field rename on the dataset that exists to be iterated.

Worth doing properly rather than projecting `"genre": insightType->…` in GROQ, which would defer the
rename indefinitely at the cost of a schema that disagrees with every layer above it.

### AND and live counts cannot ship separately

With ~32 resources and topics carrying 4–8 each, a topic∩topic intersection is frequently 0–2. AND on
its own would strand a visitor in empty results routinely. It is safe **only** because unavailable
options are removed, which makes an empty result unreachable by clicking. Shipping the intersection
semantics without the live counts would be a worse experience than either half suggests.

The cost is not a concern: 32 items against 70 facets is roughly 2,000 operations, and 2,000 items
against 200 facets is a few milliseconds.

### The facet index ships in the initial release

**Consequence of live counts, and the one thing that moved earlier than planned.** Rendering
"Strategy 3" after *Knowledge graphs* is selected requires the topic set of *every* resource, not
just those in the DOM. Co-occurrence cannot be computed from a rendered subset, and cannot be
precomputed at build time either, because arbitrary multi-select AND means 2ⁿ combinations.

Two indexes, shipped separately:

| Index | Carries | Needed for |
|---|---|---|
| **Facet** | slug, topics[], genre, pubDate, resolvable slugs per concept | AND filtering and live counts — **initial release** |
| **Card** | title, description, image | rendering "show more" / "show all" — later |

The facet index is small: ~6 KB at 42 items, roughly 15 KB gzipped at 500.
`web/_src/insight-search.json.njk` is most of the shape already, but its `tags` field is a
comma-joined string of prefLabels and needs to become an array of slugs.

### Filtering does not work in the preview environment

**Accepted, not a bug to fix.** Preview mode encodes stega metadata into content strings for
click-to-edit, so anything comparing rendered text stops matching — in preview only. Filters should
match on `data-` attributes carrying clean slugs, or run values through `stegaClean` from
`@sanity/client`. Even then, exact behavior in preview is not a target.

## Open

~~**Hide versus disable unavailable facets.**~~ ~~**The two costs of re-sorting.**~~ **Both closed
2026-08-31 by fixing chip order at build time** — see *Chip order is fixed at build time* above. The
first was resolved by appeal to the re-sort and had to be re-answered without it: an excluded facet is
**disabled in place**, in the truncated row, and that visibility is the point. The second described
costs that the re-sort no longer imposes.

### Resetting a facet group — settled

"Select all 32" is **removed**. It read as parallel to "Knowledge graphs 8" — name plus count — so its
count scanned as a number of topics rather than of resources, and it appeared in both groups with the
same number, leaving its scope unclear.

Replaced by a **labeled text control per group — "reset topics" / "reset genres" — on the group's
heading row, right-aligned, appearing only once that group has a selection.** Clicking it clears that
group, restores the facets to their unselected order, and moves focus to the first facet.

**An icon-only control in the chip row was considered and rejected.** It would have sat left of the
selected chips, which means inserting a leading item into the row and shifting everything after it —
including the chip just clicked, the teleport that pinning selected facets exists to prevent. Putting
the control on the heading row instead removes that problem rather than working around it: nothing is
inserted among the chips, so the chips cannot move. The label also states its own scope, which no icon
can do — a circular arrow reads as reload, an X as close, and the pair is not a settled convention.

**A global "reset all" is deliberately absent.** Two scoped controls are unambiguous where one global
control would not be, and clearing both groups is two clicks. Worth revisiting only if a third facet
group appears, since the cost scales linearly.

### Facet controls are links, not buttons

Filter state lives in the URL by design, so every facet control has a natural `href`: the URL
representing the state *after* that click. "reset topics" is the current URL minus its topic
parameters.

Rendering them as real `<a href>` elements, with JS intercepting the click and updating via the
history API, buys three things a button cannot:

- **Middle-click, open-in-new-tab and copy-link-address work on every facet.** That matters
  specifically because a filtered view is meant to be a shareable artifact.
- **The URL contract becomes inspectable in the markup** rather than implied by script.
- **It makes the link styling correct rather than a mismatch.** A control styled as an underlined link
  but implemented as a button is the usual accessibility smell; here the link semantics are the honest
  ones.

The cost is bookkeeping: each control's `href` has to be computed from the current selection plus its
own toggle, rather than held in JS state alone.

**Styling an anchor as a pill needs no new design rule.** DESIGN.md's Links section already carves out
block-level link titles as un-underlined, on the grounds that position identifies them; a filter chip
is identified by its border, fill and shape, which satisfies the same WCAG 1.4.1 requirement the
underline exists to meet. Worth extending that clause to name controls explicitly so it is not
re-derived.

Three consequences that do follow from the element choice:

- **`filter-chip-disabled` cannot be expressed natively.** DESIGN.md defines the state, but `disabled`
  is a button attribute and anchors have no equivalent. Either `aria-disabled="true"` with the click
  prevented — stays focusable and discoverable, generally the better choice — and that is what
  shipped. This was written expecting the state to surface only inside "See all topics"; with chip
  order fixed at build time it is the **ordinary** appearance of an excluded facet, in the visible
  row, which makes "stays focusable and discoverable" load-bearing rather than merely tidier.
- **The selected state cannot use `aria-pressed`**, which is button-only. `aria-current="true"` is the
  link equivalent.
- **The accessible name has to differ by state**, and this is an improvement rather than a workaround.
  A selected chip's `href` *removes* its filter while an unselected chip's *adds* it — the same control
  meaning opposite things. Sighted users read the fill; a screen-reader user needs it said. "Knowledge
  graphs, 8 results, selected, remove filter" against "Knowledge graphs, 8 results, add filter" carries
  more than `aria-pressed` would have.

Also mechanical: an anchor is inline by default, so it needs `inline-flex` or `inline-block` for the
pill to have a box and for the focus ring not to split into two fragments when it wraps a line.

**Where the reset control goes at narrow widths.** A heading with a right-aligned link is comfortable
at 1440 and tight at 360, and "reset genres" is the longer of the two. Whether it wraps beneath the
heading or stays inline needs deciding, and it lands in the same intermediate-width territory
[open-questions.md](open-questions.md) already flags for the margin.

**Which focus target on reset.** "First facet" is the plan and is what shipped — the first *visible*
chip in the group that was cleared, since the reset control itself has just gone `hidden` and focus
would otherwise fall to the body. The alternative is the group heading with `tabindex="-1"`, which
announces "Topics" and orients a screen-reader user, where landing on "Knowledge graphs 8" is
contextless. **Revisit it with the live region**, not before: the two decisions pair, and a heading
that announces its own name is less useful than a chip if the count change is announced anyway.

**"Insights" cannot be a genre inside Insights.** A mock shows a genre chip reading "Insights 6"; no
such value exists in the data, where the four in use are Perspective (20), Method (12), Case Study (7)
and Interview (3). It would also make the container one of its own members, and it contradicts the
page's own lede — "Perspectives, methods, case studies, and notes" *names* the genres. `Perspectives`
is the value that fits.

**Four concept schemes, two facet groups.** The dataset carries `Category`, `Insight Type`, `Topic` and
`Topic Taxonomy`, while the design has exactly two axes and CLAUDE.md's phase 4 plan calls for two
vocabularies. `Topic` and `Topic Taxonomy` look like one live and one legacy. **The `category` field is
defined on 0 of 42 documents** — dead, along with the 11ty build's `service` and `categoryTag`
projections that read it. Resolve with the schema in phase 1.

~~**Parameter syntax.**~~ **Comma-joined, decided 2026-08-31** — `?topic=a,b&genre=method`. Values are
**normalized alphabetically**, so one filter state is one URL: alphabetical rather than chip order
because chip order is count-descending and therefore moves as content is published, and a shared link
should not depend on the corpus. A repeated `?topic=a&topic=b` is still *understood* on the way in —
one word of parsing — but it is never *emitted*, and the canonical form is written back with
`replaceState` on load.

~~**History behavior.**~~ **Push once, then replace, decided 2026-08-31.** The first filter pushes and
every refinement replaces, so **one Back returns to the unfiltered index and a second leaves the
page** — neither trapping someone behind a dozen presses nor losing the undo. One wrinkle worth
knowing: a Back or Forward re-arms the push, so the next change after a history navigation appends a
fresh entry rather than overwriting the one the visitor just returned to.

~~**Announcing result changes.**~~ **Built 2026-08-31.** A visible count line *below* the grid, grouped
with the reveal controls, plus a visually-hidden `role="status"` region that speaks the same sentence.

- **Below, not above** — the chips report on the whole collection by design, so the number on screen is
  not something you need before you start; it is what you want at the point you notice the grid ended.
  **Position is irrelevant to the announcement**: a live region is heard wherever it sits, so moving it
  cost nothing for a screen-reader user.
- **Two elements, and the second is not a duplicate.** The visible line carries no live role; the region
  ships empty and is written only on a user-initiated change. This replaces a plan to promote the
  visible line to `role="status"` after first render, which does not cover someone **arriving on a
  shared `?topic=` link** — the line is server-rendered for the no-JS truth, so JS rewrites it during
  load and a region that was live by then would read its own count out over the page. Starting empty
  makes that impossible by construction rather than by timing.
- **It clears itself three seconds after speaking**, because its text duplicates the visible line word
  for word and a linear reader would otherwise meet the same sentence twice. Announcing is a mutation,
  not a state.
- **Wording:** "Displaying 24 of 45 insights" / "Displaying all 45 insights" / "Displaying 14 matching
  insights" / "No matching insights", with the singular handled. **"insights", not "resources"** — the
  latter is the content model's word and appears nowhere a visitor can see it.
- **It does not name the active filters**, and that is deliberate: the chip just clicked is the focused
  element and its own accessible name already changed to "Method, 14 results, selected, remove filter".
  Naming the filter in the region would say it twice.

~~**The empty and unknown states.**~~ **Decided 2026-08-31.** Unknown `?topic=` values are **dropped
silently** and the cleaned URL is written back with `replaceState`, so a stale shared link heals
itself; no chip is rendered for a slug that resolves to nothing, because chips are generated from the
tally rather than from the URL. The two states are therefore not distinguished, and do not need to be:
an unknown value leaves no trace by the time the page settles.

**The empty state needs no guard** — accepted 2026-08-31 on the built page. It is **unreachable from
the UI**, since a zero-hit facet is disabled before it can be clicked, and the only route to it is a
hand-built URL naming two genres (`?genre=method,perspective`), which AND cannot satisfy because
`genre` is single-valued. An empty grid is exactly what that query resolves to.
