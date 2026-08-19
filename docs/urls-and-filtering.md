# URLs and filtering

The URL contract and the behaviour of the Insights facet browse. Companion to
[decisions/](decisions/), which covers the design system; this covers addressing and browse
behaviour, which are content-model concerns rather than design ones.

**This file exists because the decisions in it are separated by months.** Permalinks and redirects
land in phase 1; the filtering they were designed around lands in phase 4. Anything settled in one
and needed in the other goes here rather than into a commit message.

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
  URL — some handle a 301 poorly and simply go quiet. When per-taxonomy feeds arrive in phase 7 they
  are additions, not a reorganisation.

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
  at one of the results is an editorial judgement, not a mechanical alias. That case needs a decision,
  not an entry.

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
- **No pagination.** Cards render server-side; "show more" then "show all" is the intended growth
  path, not scoped for the initial release.
- **Facet controls sort by hit count, descending**, and re-sort as the selection changes, so the
  next-broadest cut is always nearest the front.

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
`@sanity/client`. Even then, exact behaviour in preview is not a target.

## Open

**Hide versus disable unavailable facets — probably neither, given count-descending sort.** The
reflow objection to hiding is moot once controls re-sort by hit count on every selection, since they
move regardless. But the two mechanisms then combine for free: **sort by count descending and a
zero-hit facet sinks to the bottom on its own**, below the truncation point, without being removed
from the model. It disappears from view but is still there, dimmed and reading zero, for anyone who
opens "See more topics" — so the map of the collection survives without costing anything above the
fold.

**Two costs of re-sorting that are worth designing against.** Sorting by count optimises the *first*
click, since the broadest next cut sits at the front; it works against *re-finding* a term seen a
moment ago, which is what alphabetical is good at. A possible split: count-descending in the truncated
visible set, alphabetical inside the expanded "See more" panel, so each list does the job its context
implies.

The sharper one: **the chip you just clicked will move.** Clicking something and having it teleport is
the specific interaction that reads as broken. Pinning selected facets to a stable position — a
leading group, in selection order — while unselected ones re-sort beneath is the usual fix.

### Resetting a facet group — settled

"Select all 32" is **removed**. It read as parallel to "Knowledge graphs 8" — name plus count — so its
count scanned as a number of topics rather than of resources, and it appeared in both groups with the
same number, leaving its scope unclear.

Replaced by a **labelled text control per group — "reset topics" / "reset genres" — on the group's
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
  prevented — stays focusable and discoverable, generally the better choice — or omit `href`, which
  drops it out of tab order entirely. Count-descending sort means this only surfaces for whatever
  "See all topics" reveals, but the state exists in the system and needs a decision.
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

**Which focus target on reset.** "First facet" is the plan. The alternative is the group heading with
`tabindex="-1"`, which announces "Topics" and orients a screen-reader user, where landing on
"Knowledge graphs 8" is contextless. Either works *provided* the live region announces the count
change — the two decisions pair.

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

**Parameter syntax.** `?topic=a,b` against repeated `?topic=a&topic=b`. Whether values are normalised
to a stable order, so one filter state is one URL rather than several.

**History behaviour.** `pushState` per toggle means Back walks the filter history and can trap someone
behind a dozen presses; `replaceState` loses the ability to undo a selection with Back.

**Announcing result changes.** A filter that silently changes content is invisible to a screen reader.
An `aria-live="polite"` region reporting "12 of 42 shown" is the minimum.

**The empty and unknown states.** `?topic=` values will rot — a link shared before a vocabulary change,
or a typo. Distinguish "no results for this combination" from "this topic does not exist," and do not
render a filter chip for a slug that resolves to nothing.
