/**
 * The two derived values a presentation card needs: the venue line and the tag row.
 *
 * ── EXTRACTED WHEN THE RELATED BAND BECAME THE SECOND CONSUMER ───────────────
 *
 * It lived inline in `presentations/index.astro` while that page was the only thing
 * rendering a <PresentationCard>. The related band on the presentation detail page is the
 * second, which is the trigger for promotion — and the alternative was worse than usual
 * here, because both halves are RULES rather than passthroughs. `+N` counts deliveries
 * minus the one the venue line named; the tag order is board order; `online` is read
 * before any location field. Duplicating those is duplicating three chances to disagree.
 *
 * Beside the component it serves rather than in `lib/`, matching `prose/headingId.ts` and
 * `bands/getInTouch.ts`. `lib/` holds things several unrelated pages reach for —
 * `formatLocation` is one, and this calls it.
 *
 * ── THE INPUT IS STRUCTURAL, AND DELIBERATELY NOT A GENERATED TYPE ───────────
 *
 * Two different queries feed this — PRESENTATIONS_INDEX_QUERY and RELATED_POOL_QUERY —
 * and the second returns a union discriminated on `_type`, where an article's members are
 * all null. Naming either generated type here would bind the helper to one caller. The
 * fields it actually reads are few enough to state, and stating them is what lets both
 * callers pass their own row unchanged.
 */
import {formatLocation, type EventLocation} from '../../lib/location'

/**
 * A derived marker. `label` is what shows; `hint` is the expansion for assistive
 * technology, and only `+N` needs one.
 *
 * Declared here rather than in the component because the thing that BUILDS these now
 * lives here too, and a type is best owned by whatever constructs it.
 */
export interface CardTag {
  label: string
  hint?: string
}

/** The first delivery, as both queries project it. */
export type PresentationVenue = EventLocation & {name?: string | null}

export interface PresentationCardSource {
  venue?: PresentationVenue | null
  eventCount?: number | null
  hasTranscript?: boolean | null
  hasDeck?: boolean | null
  recordingKinds?: (string | null)[] | null
}

/**
 * ── THE VENUE LINE: THE FIRST DELIVERY, NAME AND PLACE ───────────────────────
 *
 * The board draws "Button Events • Online" — the event's name, then its location.
 * `formatLocation` composes the place half and owns the whole display rule, including the
 * one that matters most: `online` is read FIRST, because Sanity's conditional `hidden`
 * stops a field being EDITED rather than stored. Online events still carry a stale
 * `country: "USA"`, so anything inferring "in person" from a present country would print
 * a location for a podcast.
 *
 * Joined here rather than in a template. The separator is then part of a single string,
 * which sidesteps the whitespace-sensitive text node that made <Eyebrow> draw its pipe
 * with generated content — Prettier reformats `{…}` expression blocks on every
 * `pnpm format` and `<!-- prettier-ignore -->` does not apply to them.
 */
export function presentationVenueLine(item: PresentationCardSource): string | null {
  const place = formatLocation(item.venue)
  return [item.venue?.name, place].filter(Boolean).join(' • ') || null
}

/**
 * ── THE TAGS ARE DERIVED, AND ORDERED SMALLEST-CONTEXT FIRST ─────────────────
 *
 * Every one is a fact the query already knows; none is authored, and none is clickable.
 * Board order on the one card that shows three is `+1, transcript, audio`, which this
 * follows, with `video` beside `audio` and `slides` last.
 *
 * `+N` COUNTS THE DELIVERIES THE VENUE LINE DID NOT NAME, so it is `eventCount - 1` rather
 * than the count itself — it modifies the line directly above it. The board also prints an
 * inline "(+1)" after the location; that is leftover sketching, superseded by this chip,
 * and deliberately not reproduced.
 *
 * `recordingKinds` is the flattened `kind` of every recording across every event, so it
 * can hold duplicates — three deliveries of one talk can each carry audio. A Set collapses
 * them to the question the tag actually asks: is there audio at all. The nulls are filtered
 * because the query's `defined()` filter is invisible to TypeGen.
 */
export function presentationTags(item: PresentationCardSource): CardTag[] {
  const kinds = new Set((item.recordingKinds ?? []).filter(Boolean))
  const extra = (item.eventCount ?? 0) - 1

  return [
    ...(extra > 0
      ? [{label: `+${extra}`, hint: `${extra} more ${extra === 1 ? 'venue' : 'venues'}`}]
      : []),
    ...(item.hasTranscript ? [{label: 'transcript'}] : []),
    ...(kinds.has('audio') ? [{label: 'audio'}] : []),
    ...(kinds.has('video') ? [{label: 'video'}] : []),
    ...(item.hasDeck ? [{label: 'slides'}] : []),
  ]
}
