/**
 * Choosing which topics the Home page's "Selected Topics" list shows.
 *
 * The vocabulary has 33 topics carrying content and the band has room for a fraction of
 * them, so "selected" is a real selection with a rule behind it rather than a slice.
 */

export interface TopicCount {
  prefLabel: string | null
  count: number
}

export interface SelectedTopic {
  label: string
  count: number
}

/**
 * The `limit` most-used topics, returned in alphabetical order.
 *
 * ── TWO SORTS, BECAUSE CHOOSING AND SHOWING ARE DIFFERENT QUESTIONS ────────
 *
 * The list is CHOSEN by how much content carries each topic — the band is meant to point
 * at where the writing actually is — and then SHOWN alphabetically, because a reader
 * scanning for a subject wants to find it, not to infer a frequency ranking. Sorting once
 * would have to pick one of those and lose the other.
 *
 * ── THE TIE-BREAK RUNS BACKWARDS ON PURPOSE ────────────────────────────────
 *
 * The cut rarely lands cleanly: today twelve topics are unambiguous and five are tied on
 * four documents each for the last two places. Andy's rule (2026-09-03) is to prefer the
 * one LOWEST in the alphabet, and the reasoning is about the second sort — whichever ties
 * get in are displayed a-z, so preferring alphabetically-early ones would stack the
 * least-used topics at the TOP of the visible list, where they read as the most
 * important. Preferring late ones sinks them.
 *
 * So the selection sort is `count` descending, then label DESCENDING. That reversal looks
 * like a slip and is the whole point; it exists only inside the selection and is undone
 * by the display sort.
 *
 * Today it picks Mental Models and Digital Communication over Automation, Content
 * Analysis and Development.
 *
 * ── `localeCompare`, AND A NULL LABEL IS DROPPED ───────────────────────────
 *
 * `localeCompare` rather than `<` so accented and hyphenated labels land where a reader
 * expects. TypeGen types a projected `prefLabel` as nullable because it cannot know the
 * field is always set; a concept with no label has nothing to render or link, so it is
 * filtered out rather than rendered as an empty list item.
 */
export function selectTopics(topics: TopicCount[], limit: number): SelectedTopic[] {
  return topics
    .flatMap((topic) => (topic.prefLabel ? [{label: topic.prefLabel, count: topic.count}] : []))
    .sort((a, b) => b.count - a.count || b.label.localeCompare(a.label))
    .slice(0, limit)
    .sort((a, b) => a.label.localeCompare(b.label))
}
