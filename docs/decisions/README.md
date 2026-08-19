# Design decision records

Why the design system is the way it is. [DESIGN.md](../../DESIGN.md) carries the values and the rules
that govern a build; these carry the reasoning behind them, so settled ground does not get re-argued.

**Read a record only when a decision it covers is being questioned, excepted, or changed** — not as
background for ordinary work. If you find yourself re-deriving a value that has a record, read the
record instead.

| Record | Backs | Covers |
|---|---|---|
| [colour.md](colour.md) | Colors, Elevation & Depth | the accent, text roles, role naming, links, the dark theme, accent bands, the deliberate WCAG 1.4.11 miss, tonal depth |
| [typography.md](typography.md) | Typography | the 18px base and 1.25 ratio, fluid clamps and rem-dominance, leading by measure, tracking, h4, measure |
| [layout.md](layout.md) | Layout & Spacing | the grid, the skip family, span tokens, vertical rhythm, the sibling-margin mechanism, responsive, outdenting |
| [components.md](components.md) | Components, Shapes | buttons, the focus-ring relationship, chips and tags, note cards, blockquote, the page header |

Alongside these:

- **[../figma-notes.md](../figma-notes.md)** — Figma mechanics and the constraints they impose. Tooling,
  not design decisions.
- **[../urls-and-filtering.md](../urls-and-filtering.md)** — the URL contract, redirects, and the
  Insights facet browse. Addressing and browse behaviour, not design.
- **[../open-questions.md](../open-questions.md)** — what is *not* settled.

## Conventions

**Rejected options are recorded only when they are attractive enough to be re-proposed.** A record is
not a history of every path tried; it is a set of signposts at the turnings someone will otherwise take
again. Pure history — which sweep found what, what a value used to be — is left out deliberately.

**When a decision changes, supersede the record.** Mark the old reasoning `Superseded:` and say what
replaced it. Do not edit rationale back into DESIGN.md; that is the growth this structure exists to
prevent.
