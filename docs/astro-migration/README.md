# The Astro migration

The planning record of the rebuild in Astro, from phase 4 through phase 8 (2026-08-26 to
2026-10-10). Moved here from `docs/` on 2026-10-10, once every phase was closed. CLAUDE.md's
*Phase sequence* is the summary; these are the working documents behind it.

**Read them as records, not instructions.** Each kickoff was written as the prompt that started a
session, so most are in the imperative: read this first, do not write code yet, decide that. They
record what was planned, what was measured and what was found on the way. What is current is
CLAUDE.md, DESIGN.md, and the code.

Phases 0–3 and 7 had no kickoff documents. CLAUDE.md is their record.

## Phase 4 — page types

- [phase-4-kickoff.md](phase-4-kickoff.md) — the phase plan: page types in order of structural
  leverage (2026-08-26)
- [article-composition-kickoff.md](article-composition-kickoff.md) — article page composition
  (2026-08-27)
- [index-pages-kickoff.md](index-pages-kickoff.md) — index pages: cards, chips, pagination
  (2026-08-28)
- [insights-filtering-kickoff.md](insights-filtering-kickoff.md) — Insights facet filtering
  (2026-08-31)
- [note-pages-kickoff.md](note-pages-kickoff.md) — note detail pages (2026-09-01)
- [reviews-page-kickoff.md](reviews-page-kickoff.md) — the Reviews page (2026-09-03)
- [contact-page-kickoff.md](contact-page-kickoff.md) — Contact, the first `page`, and the Get in
  Touch band (2026-09-04)
- [page-template-kickoff.md](page-template-kickoff.md) — the `page` template against the Consulting
  boards (2026-09-07)
- [presentations-kickoff.md](presentations-kickoff.md) — Presentations: index, decks, players,
  related, JSON-LD (2026-09-09)
- [audio-player-kickoff.md](audio-player-kickoff.md) — recording players, then Related
  Presentations (2026-09-10)
- [search-kickoff.md](search-kickoff.md) — search, and the last of the JSON-LD (2026-09-12)
- [search-index-kickoff.md](search-index-kickoff.md) — the search index, and `SearchAction`
  (2026-09-13)

## Phase 5 — content parity

- [parity-check-kickoff.md](parity-check-kickoff.md) — a repeatable render-every-document check,
  not a one-off sweep (2026-09-13)

## Phase 6 — cutover

- [staging-and-cutover-kickoff.md](staging-and-cutover-kickoff.md) — staging and cutover,
  resequenced (2026-09-18)
- [cutover-kickoff.md](cutover-kickoff.md) — the cutover itself, with the SSR preview folded in
  (2026-09-21)
- [ssr-preview-kickoff.md](ssr-preview-kickoff.md) — the SSR preview, the last of phase 6
  (2026-09-29)

## Phase 8 — quality gates and feeds

- [feeds-kickoff.md](feeds-kickoff.md) — five Atom feeds with full content, built ahead of the
  phase (2026-09-13)
- [phase-8-kickoff.md](phase-8-kickoff.md) — the phase plan: quality gates, per-taxonomy feeds,
  POSSE (2026-10-09)
- [external-link-check-kickoff.md](external-link-check-kickoff.md) — the external link check, the
  phase's last item (2026-10-09)

## After the cutover

- [eleventy-astro-comparison.md](eleventy-astro-comparison.md) — the 11ty site against the Astro
  one: code, page weight, droplet resources, accessibility, and how to measure them again
  (2026-10-06)
