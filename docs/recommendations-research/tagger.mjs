// The tagger: a concept × document score matrix in, a tag set per document out.
//
// Pure, with no I/O and nothing run on import, so the simulated rounds (tagset.mjs) and the
// phase 5 write can share it. plan.md → Tagger is the spec; in brief:
//
//   - Scores go on the anchored scale, (raw − floor) / (self − floor), where `self` is the
//     concept's own document scored in the same query. 0 is as unrelated as anything in the
//     corpus, 1 is the concept's own words.
//   - Slots run in band order. Round 0 has three at ≥ 0.45, then three more at ≥ 0.54.
//   - Author tags take slots from the front and are never bumped. Round 0 has none: it retags
//     from scratch, and author tags first appear at the manual audit.
//   - A document that earns no tag still gets its single best concept.
//   - No tag sits beside its own broader concept, and the more specific one wins.
//
// ── WHAT "BOTH QUALIFY" MEANS ───────────────────────────────────────────────────────────────
//
// The spec says that when a concept and its broader both qualify, the more specific one wins.
// Here, qualifying means EARNING A SLOT on score, not merely clearing 0.45. Slots fill in score
// order; if a concept and its broader both earned one, the broader gives its slot up and the
// next candidate in line takes it, under the same rules. So a narrow concept that would not
// have made the cut on its own score cannot push out a broader one that did.
//
// The other reading, where any narrower concept clearing 0.45 displaces its broader, lets a
// weak child evict a strong parent from a document that was full anyway.
//
// ── NOT BUILT YET, ON PURPOSE ───────────────────────────────────────────────────────────────
//
//   - The RULE OF N (`ruleOfN`), off in round 0. A non-null value throws rather than being
//     silently ignored.
//   - The INCREMENTAL BUMP: "a new candidate takes a free slot, or bumps the lowest auto tag it
//     outscores." Round 0 retags from scratch, which is all this does. Whether later rounds
//     re-run from scratch over the updated matrix or bump against the previous tag set is
//     worth deciding when round 1 starts: the two differ when a changed concept's score DROPS,
//     which a bump never removes.

/** The round-0 configuration (Andy, 2026-10-26). The floor is frozen from the score spike. */
export const ROUND_0 = Object.freeze({
  floor: 4.9,
  bands: [
    {count: 3, min: 0.45},
    {count: 3, min: 0.54},
  ],
  minimum: 1,
  ruleOfN: null,
})

/** A raw `_score` on the anchored scale. */
export const anchored = (raw, self, floor) => (raw - floor) / (self - floor)

/**
 * Tag one document.
 *
 * @param {{concept: string, score: number}[]} candidates  every candidate concept's anchored
 *   score for this document. Top concepts are never candidates, so they are not in the list.
 * @param {string[]} authorTags  concept ids the author set. They take slots first.
 * @param {Map<string, string | null>} broaderOf  each concept's broader concept
 * @param {typeof ROUND_0} config
 * @returns {{concept: string, score: number | null, slot: string}[]} in slot order. `slot` is
 *   'author', 'band 1', 'band 2' or 'minimum'.
 */
export function tagDocument(candidates, authorTags, broaderOf, config) {
  if (config.ruleOfN != null) {
    throw new Error(
      '[tagger] the rule of N is not built yet; see the note at the top of tagger.mjs',
    )
  }

  /* One threshold per slot, in band order: [0.45, 0.45, 0.45, 0.54, 0.54, 0.54] in round 0.
     They never fall from one slot to the next, which is what lets the fill stop early. */
  const slots = config.bands.flatMap((band, i) =>
    Array.from({length: band.count}, () => ({min: band.min, name: `band ${i + 1}`})),
  )
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].min < slots[i - 1].min) throw new Error('[tagger] band minimums must not fall')
  }

  const beside = (a, b) => broaderOf.get(a) === b || broaderOf.get(b) === a
  const score = new Map(candidates.map((c) => [c.concept, c.score]))
  const authors = authorTags.map((concept) => ({
    concept,
    score: score.get(concept) ?? null,
    slot: 'author',
  }))

  /* An auto tag may not sit beside an author tag, and author tags are never removed, so any
     candidate beside one is out before the fill starts. */
  const ranked = candidates
    .filter((c) => !authorTags.includes(c.concept))
    .filter((c) => !authorTags.some((a) => beside(a, c.concept)))
    .sort((a, b) => b.score - a.score)

  /* Fill by score; if a concept and its broader both earned a slot, drop the broader and fill
     again. Each pass excludes at least one more concept, so this ends. */
  const lost = new Set()
  let auto
  for (;;) {
    auto = []
    for (const c of ranked) {
      if (lost.has(c.concept)) continue
      const slot = slots[authors.length + auto.length]
      /* Scores fall and thresholds never do, so the first miss ends the fill. */
      if (!slot || c.score < slot.min) break
      auto.push({...c, slot: slot.name})
    }
    const broader = auto.filter((t) => auto.some((u) => broaderOf.get(u.concept) === t.concept))
    if (!broader.length) break
    for (const t of broader) lost.add(t.concept)
  }

  const tags = [...authors, ...auto]

  /* The minimum: top up from the best of what is left, still never beside another tag. With
     round 0's minimum of one, this only ever gives an untagged document its best concept. */
  for (const c of ranked) {
    if (tags.length >= config.minimum) break
    if (tags.some((t) => t.concept === c.concept || beside(t.concept, c.concept))) continue
    tags.push({...c, slot: 'minimum'})
  }

  return tags
}

/**
 * Tag every document in a score matrix (score-spike.mjs's format).
 *
 * @param {{docs: {_id: string}[], concepts: {_id: string, parent: string | null, self: number,
 *   scores: Record<string, number>}[]}} matrix
 * @param {typeof ROUND_0} config
 * @param {Map<string, string[]>} [authorTags]  by document id; none in round 0
 * @returns {Map<string, ReturnType<typeof tagDocument>>} by document id
 */
export function tagCorpus(matrix, config, authorTags = new Map()) {
  const broaderOf = new Map(matrix.concepts.map((c) => [c._id, c.parent]))
  return new Map(
    matrix.docs.map((d) => {
      const candidates = matrix.concepts.map((c) => {
        const raw = c.scores[d._id]
        if (typeof raw !== 'number') {
          throw new Error(`[tagger] the matrix has no score for ${d._id} against ${c._id}`)
        }
        return {concept: c._id, score: anchored(raw, c.self, config.floor)}
      })
      return [d._id, tagDocument(candidates, authorTags.get(d._id) ?? [], broaderOf, config)]
    }),
  )
}
