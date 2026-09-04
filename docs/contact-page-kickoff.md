# Phase 4 — Contact: the first `page`, and the Get in Touch band

CLAUDE.md is loaded. **Re-read the schema, re-query the dataset, and re-walk the Figma
boards before trusting anything below.** Andy changes content and design between sessions,
and the last kickoff's most expensive lines were the ones quoting counts that had moved.
Every number here was true on **2026-09-04** and is a starting point, not a fact.

**Start on `next`, tree clean.** Build, `astro check` and Prettier are green: 46 pages, 0
errors, with the known `[SanityHero] no altText` warnings on some articles and nothing else.
Branch from `next` once the discussion below has settled enough to write code.

## Do not start by writing code

Andy asked for **a discussion first**, on six things:

> the form submit function, JS form controls, CAPTCHA validation, form fields, error
> handling, and form field input durability

He wrote "search submit" — almost certainly the *form* submit, since the other five are all
form concerns, but Search is also unbuilt and separately specified in DESIGN.md → Components
→ Search, so **ask rather than assume.**

Surface the trade-offs, let him steer, then build in reviewable pieces. Everything below
exists to make that conversation concrete, not to pre-empt it.

## What changed just before this session

Andy made three changes on 2026-09-04, **which he will commit to `next` before starting**.
If `git status` is dirty with these, they are his:

1. **A `page` type now exists** — `studio-next/schemas/documents/page.ts`, registered in
   `schemas/index.ts`. **Contact is a `page`, not a singleton**, and the Contact singleton
   has been removed. This is the type CLAUDE.md describes as "website-generic scaffolding
   on one repeatable template."
2. **`bandGetInTouch` gained a `bandCopy` boolean** (`initialValue: true`) that suppresses
   the band's own heading and message, so a host page can carry that copy itself. Its
   `message` validation is conditional: required only when `bandCopy` is true.
3. **A Contact board** — Desktop → Top Level Pages → `2562:2663`, 1440×1379.

**Contact is therefore the first consumer of `page`**, and About, Colophon, Apologia and
Projects follow it. Build it as the template it will become, not as a one-off.

## The board settles the structure — it is the Reviews frame

```
BodyBand                     pad 64/222/96/222      ← asymmetric, like Reviews
  Frame 427318265  996  gap 16
    Page Header    656x48                            "Contact" — title only
    Frame 427318262  996  HORIZONTAL gap 109
      Prose        656   gap 64
        Body Group 656x72                            the lede, 2 lines at the lead role
        Contact    656x451                           the band, header suppressed
      rail         231x158                           empty, and RESERVED — see below
```

### The rail is reserved even when empty — decided 2026-09-04

**On desktop a `page` always leaves the rail column standing, with or without content in
it.** Andy's reasons, and they apply to every `page` rather than to Contact:

- **It keeps the body measure reasonable.** The prose column is `--col-main` (656), which
  lands near DESIGN.md's 66ch target. Letting content span `--col-full` (996) when the rail
  is empty would push the measure well past it — the opposite of what the Insights index
  does, and for the opposite reason: that page spans full width precisely *because* cards
  have no measure to protect.
- **It holds the column for future use.** Rail content is expected on some pages later.

**Do not render an empty `<aside>` to reserve it.** A grid column is reserved by nothing
being placed there — putting content at `--col-main` leaves 9–12 empty by definition. An
empty `<aside>` would be an unnamed `complementary` landmark wrapping nothing, which is
worse than no element, and `.rail` on Reviews only exists because it has a nav inside it.

So the `page` template places its content at `--col-main` and stops. Below md that token
collapses to `1 / -1` and there is nothing to reserve, which falls out for free.

Nearly all of this is already built and directly reusable:

- **The two-column frame is `reviews.astro`'s.** Page Header above, Prose + rail below, with
  the rail aligning to the **lede** rather than the h1. That needed `display: contents` on
  `.page-header` so the h1 and `.page-intro` become separate grid rows, plus `row-gap: 0` on
  the Grid. `<PageHeader>` ships `.page-intro` and `--page-header-span` for exactly this.
- **64/96 band padding** is the same asymmetry Reviews hit. `<Band>` already has `spaceEnd`
  for it — `space="band" spaceEnd="section"`. Do not re-derive it or override padding from
  the page; a page rule loses to `.band[data-space='…']` on specificity.
- **996 = 656 + 109 + 231** is `--col-main`, skip-1, `--col-rail`.

**There is no Contact mobile board.** The mobile treatment comes from the component's
`Viewport=Mobile` variant (`757:1746`, 343 wide) plus the Reviews page's mobile behavior for
the frame. That last part is an inference — Reviews drops its rail entirely below md.

## The band, and how the two models line up

The Figma component set `757:1745` "Contact" now carries a **`Band Copy` BOOLEAN property,
default `true`**, bound to the header frame's visibility. Its two variants:

| variant | with header | header block | form block |
| --- | --- | --- | --- |
| `Viewport=Desktop` `506:4478` | 656×646 | 656×147 | 656×451 |
| `Viewport=Mobile` `757:1746` | 343×918 | 343×211 | 343×659 |

The Contact board's instance sets `Band Copy: false`, which is why it renders 451 tall with
no heading. **The Sanity field models this exactly**: the Contact page document carries its
own `bandGetInTouch` with `bandCopy: false` and no message.

So the band is one component with two modes:

- **`bandCopy: true`** — h2 "Get In Touch" + message, then the form. What every *other* page
  gets from the Settings default.
- **`bandCopy: false`** — the form alone. The host page's own title and lede do that work.

Form layout (desktop 656 / mobile 343), identical in both modes:

- Name | Organization — two 316 columns, gap 24 (**stacked on mobile**)
- Email | Subject — two 316 columns, gap 24 (**stacked on mobile**)
- Message — full width, 144 tall
- Send — 231 wide and right-aligned on desktop (`counterAxisAlignItems: MAX`), full width mobile
- header gap 16, header → form 48, form rows 24, label → input 8
- input height **48** = `--field-height` (`space-5`); 316 + 24 + 316 = 656 exactly

**Two things the board does not draw, and both are on Andy's list:** no CAPTCHA widget
anywhere, and no error or success states. Do not infer them from the board's silence.

**DESIGN.md already specifies the field**, which the board does not: `input-field`,
`input-field-hover` and **`input-field-error`** (error-bg, error-line, error-text), around
line 396. The error treatment is a decision that has already been made — check whether it
still holds rather than designing a new one.

## Current state of the wiring

| | |
| --- | --- |
| `BAND_GET_IN_TOUCH` in `sanity/fragments.ts` | exists, **zero consumers**, and projects `{message}` only — **needs `bandCopy`** |
| `components/bands/GetInTouchBand.astro` | **does not exist** |
| any query for `page` | **does not exist** |
| form styles anywhere in `web-next/` | **none** — this is the first `<input>` |

Only `bandRss` and `bandWorkWithMe` are wired. `Chip.astro` and `ThemeToggle.astro` are the
closest things to interactive controls; read them for the house pattern on focus rings and
state, not for form idiom.

## The data

`page` with `slug: "contact"`:

| field | |
| --- | --- |
| `title` | "Contact" |
| `lede` | 1 block — "Looking for guidance on how to get the most of your approach to content operations? I'd love to hear from you." |
| `bodyText` | **null** |
| `heroImg` | absent |
| `bands` | one `bandGetInTouch`, `bandCopy: false`, no message |

It is the **only** `page` document. Singletons are now home, services, reviews, insights,
speaking, about.

> **⚠️ `bandCopy` is `null` on the Settings default band.** `initialValue` only applies to
> objects created after the field existed, and that band predates it. If the front end reads
> `bandCopy` as a boolean, **every page falling through to the site default gets a heading-
> less, message-less band** — the inverse of the intent, and silent. Andy was asked to toggle
> it on in the Studio; **re-query before building** and, if it is still null, raise it rather
> than working around it with `!== false`. A front-end guard would make the stored value a lie.

**`page` and `singleton` name the same role differently** — `singleton.heroCopy` versus
`page.lede`. `<PageHeader>`'s prop is `lede`, so `page` maps straight through and `singleton`
needs mapping in its query. Not a defect; noted so nobody "fixes" one to match the other.

`page.bands` offers `bandWorkWithMe` and `bandGetInTouch` but **not** `bandRss`, which is
right: a `page` carries no Topic or Genre and never appears in listings. `bandOverrides`
in Settings offers only note/article/caseStudy, so `page` has no page-type override tier —
the same arrangement `fragments.ts` documents for singletons.

## The backend, and the constraint that makes this page different

`web/mailhandler.php` is 219 lines and **works today**: Gmail API over OAuth
(`google/apiclient` + `vlucas/phpdotenv`), reCAPTCHA **v2 checkbox** verified server-side,
fields `name` / `org` / `email` / `subject` / `message`. `org` is a real Organization field,
**not a honeypot**. On success it `header('Location: …/contact-success/')`; on failure it
`echo`es raw HTML and exits. The current form ships its submit button `disabled`, presumably
enabled by the reCAPTCHA callback.

**CLAUDE.md phase 6 already decided the shape:** mailhandler.php survives, but becomes
*"a backend endpoint called from JS rather than a form target with its own display pages,
since mail forms now appear on several pages."* Treat that as settled unless Andy reopens it.

> **Production is a static Astro build. There is no server in front of it.** The form must
> POST to the PHP endpoint on the droplet, which means **none of the submit path can be
> verified locally or on `next`** — nginx and PHP exist only there. This is the gap CLAUDE.md
> names under Branching. Plan for a staging deploy to prove it, and be precise in the
> meantime about what has and has not actually been tested. A green build is not a working
> form.

Adjacent and still unfixed: **the deploy writes `.env` as `chmod 644`** on the droplet,
holding the Google OAuth client secret and refresh token. CLAUDE.md calls it a live security
issue, not just a migration note. Phase 6 work, but worth raising while the mail path is in
view.

## Open decisions to settle before building

1. **Andy's six form topics**, above. This is the substance of the session.
2. **Where the band component lives** — `components/bands/GetInTouchBand.astro` alongside the
   other three, with the form inside it? Or a `ContactForm` the band composes? The band and
   the form are the same Figma component, but a form is a lot of behavior to put in a band,
   and the band is the thing that will appear on many pages.

The rail is settled — see above. `page.ts` still has no rail field, which is consistent:
reserving the column is a template decision, not content.

## What is already built — don't rebuild it

| | |
| --- | --- |
| Page header: title + optional lede + optional body | `components/PageHeader.astro` |
| Band, tone, vertical space, `spaceEnd` | `components/Band.astro` |
| 12-column grid | `components/Grid.astro` |
| Button, `primary` and `ghost` | `components/Button.astro` |
| Portable Text | `components/prose/Prose.astro` |
| The three-tier band ladder in GROQ | `sanity/fragments.ts` — `LADDER()` |
| The exact page frame Contact wants | `pages/reviews.astro` |

## Lessons from the last stretch, each of which cost real time

### The browser pane lies about anything animated

It runs with `document.hidden: true`, so **animations and transitions never advance.**

- A transitioned property (`border-color` on `.button`) **freezes at its previous value**, so
  `getComputedStyle` readings lag one interaction behind — in both directions. This was
  misdiagnosed as stale dev CSS before the real cause was found. **Inject
  `* { transition: none !important }` before measuring anything that transitions.** Form
  controls are full of transitions; this will matter here.
- `window.scrollTo(0, y)` silently does nothing, because `scroll-behavior: smooth` is now
  global. Use `{behavior: 'instant'}`.
- `requestAnimationFrame` never fires — it hangs the tool call until it times out. Force a
  synchronous reflow with `void el.offsetWidth` instead.
- **Screenshots are unreliable**, especially after a programmatic scroll; blank captures are
  common. Measure with `getBoundingClientRect` / `getComputedStyle` and hand Andy the eyeball
  steps. Do not chase a screenshot more than twice.
- Images below the fold report `complete: false` because they are lazy. Not a broken image.

### Astro scoping — this bit three times in one session

**A scoped style reaches the component's own elements and its child components' ROOTS. It
never reaches a child's descendants.** A rule that tries compiles, ships, and matches nothing.

- **That only works if the component spreads `{...rest}` onto its root.** Astro passes the
  parent's scope attribute as an ordinary *prop*; a component that does not forward it cannot
  be styled by its parent at all. Thirteen components do this — copy the pattern.
- Custom properties cross that boundary where selectors cannot. `<PageHeader>`'s
  `--page-header-span` is the worked example: the page decides, the component applies.
- **A component's own attribute rules usually out-specify a page.** `.band[data-space='band']`
  compiles with the component's scope attribute to (0,3,0); a page reaching the root gets
  (0,2,0) and loses *wherever it sits in the source*. This is why `<Band>` grew `spaceEnd`,
  and why the Home hero's button override needs
  `.button.hero-cta[data-variant='primary']`. **Expect it with form controls.**
- `:global()` nested inside `:has()` is emitted verbatim and the browser discards the whole
  rule, silently. Wrap the entire selector.

### Read Figma properties, not just structure

A structural walk reports layout and sizes and **not `fills`, `textAlignHorizontal`, or
`componentPropertyDefinitions`.** All three mattered this session: a right-aligned byline read
as left-aligned, the Topics band's accent fill was missed entirely, and the Contact
component's `Band Copy` boolean is only visible by asking for it. **Ask for the properties you
are about to implement.** Frame names also lie; find things by position and contents.

### Verification habits that paid

- **Rebuild before comparing** — `dist/` goes stale, and the dev server can disagree with it.
- **Verify a refactor by enumerating every changed selector/declaration pair** across the
  built CSS, not by reading a diff.
- **Check the data, not the code** — run an independent query and compare it to the rendered
  output.
- **Measure from the content edge**, and sweep a range rather than one width: a horizontal
  overflow at 768 survived three checks at other widths.

### Container queries vs media queries

tokens.css prefers a **size container query** for a minor breakpoint, and the Topics band is
the build's first. It cannot answer every question: `.grid`'s inline size is **capped at 996**,
so a size query on it reads identically at 1028 and 1440 — the quantity that varies is the
margin *outside* the grid. Where the condition is genuinely viewport-derived, a media query is
honest; say why in the comment rather than looking like the rule was ignored.

### Small ones

- `zsh` eats `$ref:web-next/...` as a parameter modifier. Brace it: `"${ref}:path"`.
- GROQ accepts a variable in a slice (`[0...$n]`) and `field._ref in $array`. `^._id` inside a
  nested projection steps out one level.
- `<link>` in `<body>` is only conforming with `itemprop` or a body-ok `rel`. For invisible
  mf2 values use `<data value>`, which is in the u-* parsing chain and validates anywhere.
- **When a comment and the code disagree, the comment is a bug.** Two were found in
  `Footer.astro` alone.

## Open items carried in — none blocking

- **CLAUDE.md needs updating**: it still lists Contact under **Singletons** and describes
  `page` as not existing. Worth correcting once Contact ships, along with the `page` list.
- **`u-syndication`, `p-summary`, `dt-updated`, `rel=webmention`, `h-feed`** — the phase 8
  microformats remainder. The representative `h-card` shipped with Home and is done.
- **Presentations remains blocked** on a `presentation` type — 38 `event` documents to invert.
  **Projects is now unblocked** by `page`, as are About, Colophon and Apologia.
- **Consulting is a `page` and may become a singleton** — an index drawing together positions,
  methods and case studies. The 4 orphan `service` documents are its likely content.
- **A lone "Next" chip sits at the right edge** in `GenreNav` — an inference, not the board's,
  affecting 10 of 41 navs.
- **`grid-auto-flow: dense` on the Insights masonry stands.** See
  [docs/open-questions.md](open-questions.md).
- **`adjBright`** is a live `heroImage` field with no renderer anywhere. Legacy.
- The serializer specimen is **unpublished** as of 2026-09-04, so phase 7's "delete or
  exclude" call is resolved in practice.

## How to work

CLAUDE.md's table governs. **Layout mechanics, the cascade, component boundaries, content
model, URL design and semantics are Andy's** — explain the platform behavior and let him
steer. Query modules, transcription from the boards and repetitive sweeps are yours.

> **Reviewable pieces at a reviewable cadence.** One coherent piece, then stop and let him
> look. **Say what you are about to write before writing it**, so a wrong direction costs a
> message rather than a file.

Commit only when asked. Report honestly — name wrong turns and roll them back rather than
papering over them. American spellings in all prose, comments and commit messages; never
rewrite an identifier to match.
