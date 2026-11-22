/**
 * The cross-category ranker, `rankAcross`, and the two helpers that sort pages and genres
 * into its categories.
 *
 * Each test pins ONE rule from docs/recommendations-research/plan.md → Specs → Cross-category
 * ranking, or from the comments in related.ts, so a failure names the rule that broke. The
 * golden test (stream 2, piece 3) is the other half: it pins whole lists over the real corpus.
 * These pin the mechanics on a taxonomy small enough to work out by hand.
 *
 * ── THE MADE-UP TOPIC TREE ───────────────────────────────────────────────────
 *
 *   eng (top)                         des (top)
 *     ├─ arch                           └─ ux
 *     │    ├─ arch-1, arch-2, arch-3         └─ ux-1, ux-2, ux-3, ux-4
 *     │    └─ bridge   (also under ux: see "two parents")
 *     └─ data
 *          └─ data-1
 *
 * A topic reaches the ranker as the pool query projects it: its id, its FIRST parent, and
 * whether that parent is a top concept. Nothing else about the tree is visible to the module.
 *
 * ── THE MADE-UP GENRES ───────────────────────────────────────────────────────
 *
 *   Document → Perspective, Method, Note → Clipping        Presentation → Talk, Keynote
 *
 * ── THE POOL IS NEWEST FIRST, AND THE MODULE NEVER READS A DATE ──────────────
 *
 * GROQ returns the pool ordered by date, and every sort in the ranker is stable, so "newest"
 * means "earlier in the pool". The pools below are written in that order. A test that says
 * "older" means "later in the array".
 *
 * ── A CONTROL BESIDE EVERY "IT DOES NOT CROSS" ───────────────────────────────
 *
 * A test that expects nothing to cross would also pass if the candidate were never strong
 * enough for an unrelated reason. So each one re-runs with the rule it tests loosened, and
 * shows the card crossing then.
 */
import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {
  categoryForType,
  genresByCategory,
  rankAcross,
  type GenreConcept,
  type GenreTops,
  type RankRule,
  type RankedAcross,
  type RelatedCandidate,
  type RelatedTopic,
} from './related.ts'

/* ── Fixtures ──────────────────────────────────────────────────────────────── */

const TOPS = new Set(['eng', 'des'])

/** Each topic's first parent: what `"parent": broader[0]._ref` projects. */
const PARENT: Record<string, string> = {
  arch: 'eng',
  data: 'eng',
  ux: 'des',
  'arch-1': 'arch',
  'arch-2': 'arch',
  'arch-3': 'arch',
  'data-1': 'data',
  'ux-1': 'ux',
  'ux-2': 'ux',
  'ux-3': 'ux',
  'ux-4': 'ux',
  /* `bridge` sits under arch AND ux. The query keeps the first, so ux is never seen. */
  bridge: 'arch',
}

const topic = (_id: string, score?: number): RelatedTopic => ({
  _id,
  parent: PARENT[_id] ?? null,
  parentIsTop: TOPS.has(PARENT[_id]),
  ...(score === undefined ? {} : {score}),
})

/** A tag is a topic id, or `[id, score]` where the test needs the tagger's score. */
type Tag = string | [string, number]
const topics = (tags: Tag[]) => tags.map((t) => (typeof t === 'string' ? topic(t) : topic(...t)))

const doc = (_id: string, genreId: string | null, tags: Tag[]): RelatedCandidate => ({
  _id,
  genreId,
  topics: topics(tags),
})

const page = (tags: Tag[], genreId = 'perspective', type = 'article') => ({
  _id: 'page',
  type,
  genreId,
  topics: topics(tags),
})

const GENRE_TOPS: GenreTops[] = [
  {_id: 'document', prefLabel: 'Document'},
  {_id: 'presentation', prefLabel: 'Presentation'},
]
const GENRE_CONCEPTS: GenreConcept[] = [
  {_id: 'perspective', prefLabel: 'Perspective', broader: ['document']},
  {_id: 'method', prefLabel: 'Method', broader: ['document']},
  {_id: 'note', prefLabel: 'Note', broader: ['document']},
  {_id: 'clipping', prefLabel: 'Clipping', broader: ['note']},
  {_id: 'talk', prefLabel: 'Talk', broader: ['presentation']},
  {_id: 'keynote', prefLabel: 'Keynote', broader: ['presentation']},
]
const GENRES = genresByCategory(GENRE_TOPS, GENRE_CONCEPTS)

/**
 * The crossing rule's mechanics, with CROSS_RULE's values today written out rather than
 * imported, so tuning CROSS_RULE never breaks these tests. The golden test reads CROSS_RULE.
 */
const RULE: RankRule = {crossMinShared: 0.5, crossMinCount: 2, crossMax: 1}
const TIES: RankRule = {...RULE, tieBreak: 'genre-strength'}

const rank = (current: ReturnType<typeof page>, pool: RelatedCandidate[], rule = RULE) =>
  rankAcross(current, pool, GENRES, rule)

/** The whole outcome in one value, so each assertion reads as the result it expects. */
const outcome = ({items, isFallback, crossed}: RankedAcross<RelatedCandidate>) => ({
  ids: items.map((item) => item._id),
  isFallback,
  crossed,
})

/* ── Categories ────────────────────────────────────────────────────────────── */

describe('categoryForType', () => {
  test('a presentation page is in Presentations, and every other type in Insights', () => {
    assert.equal(categoryForType('presentation'), 'presentations')
    for (const type of ['article', 'caseStudy', 'note']) {
      assert.equal(categoryForType(type), 'insights')
    }
  })
})

describe('genresByCategory', () => {
  /* The behavior change from the old branch rule: Note's subtree is inside Insights, so
     notes and articles now relate. The walk is lib/genres.ts's `subtree`, to any depth. */
  test('each category is its top concept’s whole subtree, notes and their children included', () => {
    assert.deepEqual(
      GENRES.insights,
      new Set(['document', 'perspective', 'method', 'note', 'clipping']),
    )
    assert.deepEqual(GENRES.presentations, new Set(['presentation', 'talk', 'keynote']))
  })

  /* The top concepts are found by prefLabel. A rename in the Studio would otherwise empty a
     category, and every page in it would fall back to Recent while looking plausible. */
  test('throws, naming the top concept, when one is renamed', () => {
    const renamed = [{_id: 'document', prefLabel: 'Documents'}, GENRE_TOPS[1]]
    assert.throws(() => genresByCategory(renamed, GENRE_CONCEPTS), /"Document"/)
  })
})

/* ── The tiers ─────────────────────────────────────────────────────────────── */

describe('rankAcross: the tiers', () => {
  test('a shared tag relates', () => {
    assert.deepEqual(outcome(rank(page(['arch-1']), [doc('a', 'perspective', ['arch-1'])])), {
      ids: ['a'],
      isFallback: false,
      crossed: 0,
    })
  })

  /* Symmetric on purpose: my leaf finds your mid exactly as your mid finds my leaf.

     Asserted on `isFallback`, not on the ids alone. A one-candidate pool falls back to that
     same candidate, so `['a']` would pass with the relation broken: a check that the second
     direction was removed went green until this read the whole outcome (2026-11-21). */
  test('"nearer", one tag the other’s parent, relates in either direction', () => {
    const related = {ids: ['a'], isFallback: false, crossed: 0}
    assert.deepEqual(outcome(rank(page(['arch-1']), [doc('a', 'perspective', ['arch'])])), related)
    assert.deepEqual(outcome(rank(page(['arch']), [doc('a', 'perspective', ['arch-1'])])), related)
  })

  test('"sibling", two tags with one parent, relates', () => {
    const result = rank(page(['arch-1']), [doc('a', 'perspective', ['arch-2'])])
    assert.equal(result.isFallback, false)
  })

  /* The exclusion the whole rule exists for: "both are somewhere under Engineering" is not
     relatedness. arch and data share only the top concept eng. */
  test('siblings under a top concept count for nothing', () => {
    const result = rank(page(['arch']), [doc('a', 'perspective', ['data'])])
    assert.equal(result.isFallback, true)
  })

  /* Lexicographic, which is what "more weight" means: no volume of weaker matches adds up to
     one shared tag, so no weights have to be invented. */
  test('a shared tag outranks any amount of "nearer" and "sibling"', () => {
    const pool = [
      doc('weak', 'perspective', ['arch', 'arch-3']), // newer: nearer 2/4, sibling 2/4
      doc('shared', 'perspective', ['arch-1', 'data-1', 'ux-1', 'ux-2']), // shared 1/5
    ]
    assert.deepEqual(outcome(rank(page(['arch-1', 'arch-2']), pool)).ids, ['shared', 'weak'])
  })

  /* One hop against two: a piece INSIDE my topic before one merely BESIDE it. */
  test('"nearer" outranks "sibling"', () => {
    const pool = [
      doc('sibling', 'perspective', ['arch-2']), // newer
      doc('nearer', 'perspective', ['arch']),
    ]
    assert.deepEqual(outcome(rank(page(['arch-1']), pool)).ids, ['nearer', 'sibling'])
  })

  /* Andy's formulation: two pieces of two tags sharing both are more related than two of
     ten sharing two. Every count is divided by the size of the two tag sets' union. */
  test('every count is relative to the union of the two tag sets', () => {
    const pool = [
      doc('broad', 'perspective', ['arch-1', 'ux-1', 'data-1', 'ux-2', 'ux-3', 'ux-4']), // 2/6
      doc('tight', 'perspective', ['arch-1', 'ux-1']), // 2/2
    ]
    assert.deepEqual(outcome(rank(page(['arch-1', 'ux-1']), pool)).ids, ['tight', 'broad'])
  })
})

/* ── Crossing ──────────────────────────────────────────────────────────────── */

describe('rankAcross: crossing into the other category', () => {
  /* The page has two tags, so a home card's ratio is easy to read off. */
  const PAGE = page(['arch-1', 'arch-2'])
  const H1 = doc('h1', 'perspective', ['arch-1', 'arch-2']) // shared 2/2
  const H2 = doc('h2', 'method', ['arch-1', 'data-1']) // shared 1/3
  const H3 = doc('h3', 'perspective', ['arch-1', 'ux-1', 'ux-2']) // shared 1/4

  test('a strong match displaces the weakest home card, and takes its rank', () => {
    const cross = doc('talk', 'talk', ['arch-1', 'arch-2', 'ux-1']) // shared 2/3
    assert.deepEqual(outcome(rank(PAGE, [H1, H2, H3, cross])), {
      ids: ['h1', 'talk', 'h2'],
      isFallback: false,
      crossed: 1,
    })
  })

  test('it fills a gap below every home card, without displacing one', () => {
    const h2 = doc('h2', 'method', ['arch-1', 'arch-2', 'data-1']) // shared 2/3
    const cross = doc('talk', 'talk', ['arch-1', 'arch-2', 'ux-1', 'ux-2']) // shared 2/4
    assert.deepEqual(outcome(rank(PAGE, [H1, h2, cross])), {
      ids: ['h1', 'h2', 'talk'],
      isFallback: false,
      crossed: 1,
    })
  })

  /* `crossMinCount` exists because the ratio alone let ONE shared tag between two thinly
     tagged pieces count as strong. Here the ratio is a perfect 1. */
  test('one shared tag does not cross under crossMinCount 2, even at a ratio of 1', () => {
    const pool = [doc('h', 'perspective', ['arch-2']), doc('talk', 'talk', ['arch-1'])]
    assert.deepEqual(outcome(rank(page(['arch-1']), pool)).ids, ['h'])
    // Control: allow one shared tag, and the same card crosses.
    const loose = rank(page(['arch-1']), pool, {...RULE, crossMinCount: 1})
    assert.deepEqual(outcome(loose), {ids: ['talk', 'h'], isFallback: false, crossed: 1})
  })

  test('a shared ratio under crossMinShared does not cross', () => {
    const cross = doc('talk', 'talk', ['arch-1', 'arch-2', 'ux-1', 'ux-2', 'ux-3']) // 2/5
    assert.deepEqual(outcome(rank(PAGE, [H1, H2, H3, cross])).ids, ['h1', 'h2', 'h3'])
    // Control: lower the bar to 0.4, and it displaces h3.
    assert.equal(rank(PAGE, [H1, H2, H3, cross], {...RULE, crossMinShared: 0.4}).crossed, 1)
  })

  /* "Prefer the page's own category": a cross card has to be BETTER, not as good. */
  test('a tie with the weakest home card keeps the home card', () => {
    const h2 = doc('h2', 'method', ['arch-1', 'arch-2', 'data-1']) // shared 2/3
    const h3 = doc('h3', 'perspective', ['arch-1', 'arch-2', 'ux-3', 'ux-4']) // shared 2/4
    const cross = doc('talk', 'talk', ['arch-1', 'arch-2', 'ux-1', 'ux-2']) // shared 2/4
    assert.deepEqual(outcome(rank(PAGE, [H1, h2, h3, cross])).ids, ['h1', 'h2', 'h3'])
    // Control: without h3 there is a gap, and the same card fills it.
    assert.equal(rank(PAGE, [H1, h2, cross]).crossed, 1)
  })

  /* Stable sort: when a cross card ties a home card on every tier, home comes first, even
     though the cross card is newer. */
  test('a cross card that ties a home card sorts after it', () => {
    const home = doc('home', 'perspective', ['arch-1', 'arch-2', 'ux-3', 'ux-4']) // 2/4
    const cross = doc('talk', 'talk', ['arch-1', 'arch-2', 'ux-1', 'ux-2']) // 2/4, newer
    assert.deepEqual(outcome(rank(PAGE, [cross, home])).ids, ['home', 'talk'])
  })

  test('no more than crossMax cards cross, the strongest first', () => {
    const c1 = doc('c1', 'talk', ['arch-1', 'arch-2', 'ux-1']) // 2/3
    const c2 = doc('c2', 'keynote', ['arch-1', 'arch-2', 'ux-1', 'ux-2']) // 2/4, newer
    const pool = [c2, H1, c1]
    assert.deepEqual(outcome(rank(PAGE, pool)), {
      ids: ['h1', 'c1'],
      isFallback: false,
      crossed: 1,
    })
    // Control: crossMax is adjustable, and at 2 both cross.
    assert.equal(rank(PAGE, pool, {...RULE, crossMax: 2}).crossed, 2)
  })

  /* Crossing is for pieces about the same thing. The floor of one shared tag holds whatever
     the rule says, so this zeroes both thresholds to show it is not they that stop it. */
  test('"nearer" and "sibling" never cross, however strong', () => {
    const cross = doc('talk', 'talk', ['arch', 'arch-3']) // nearer 2/4, sibling 2/4
    const unrelated = doc('u', 'perspective', ['ux-1'])
    const open = {crossMinShared: 0, crossMinCount: 0, crossMax: 1}
    assert.deepEqual(outcome(rank(PAGE, [cross, unrelated], open)), {
      ids: ['u'],
      isFallback: true,
      crossed: 0,
    })
  })

  test('a presentation page crosses into Insights by the same rule', () => {
    const talkPage = page(['arch-1', 'arch-2'], 'talk', 'presentation')
    const keynote = doc('keynote', 'keynote', ['arch-1', 'ux-1']) // home, shared 1/3
    const article = doc('article', 'perspective', ['arch-1', 'arch-2']) // cross, shared 2/2
    assert.deepEqual(outcome(rank(talkPage, [keynote, article])), {
      ids: ['article', 'keynote'],
      isFallback: false,
      crossed: 1,
    })
  })
})

/* ── The fallback ──────────────────────────────────────────────────────────── */

describe('rankAcross: the fallback, "Recent"', () => {
  /* Nothing on the page relates to anything: ux tags share no specific parent with arch. */
  test('with nothing related, the newest from the page’s own category, never the other', () => {
    const pool = [
      doc('talk', 'talk', ['ux-1']), // newest, but a Presentation
      doc('n1', 'perspective', ['ux-1']),
      doc('n2', 'method', ['ux-2']),
      doc('n3', 'clipping', ['ux-3']),
      doc('n4', 'perspective', ['ux-4']),
    ]
    assert.deepEqual(outcome(rank(page(['arch-1']), pool)), {
      ids: ['n1', 'n2', 'n3'],
      isFallback: true,
      crossed: 0,
    })
  })

  test('under the tie-break, the page’s own genre comes first, then newest', () => {
    const pool = [
      doc('p1', 'perspective', ['ux-1']),
      doc('m1', 'method', ['ux-2']),
      doc('p2', 'perspective', ['ux-3']),
      doc('m2', 'method', ['ux-4']),
    ]
    const methodPage = page(['arch-1'], 'method')
    assert.deepEqual(outcome(rank(methodPage, pool, TIES)).ids, ['m1', 'm2', 'p1'])
    // Control: without the tie-break, the fallback is newest first whatever the genre.
    assert.deepEqual(outcome(rank(methodPage, pool, RULE)).ids, ['p1', 'm1', 'p2'])
  })

  test('a page with no tags falls back', () => {
    const result = rank(page([]), [doc('a', 'perspective', ['arch-1'])])
    assert.deepEqual(outcome(result), {ids: ['a'], isFallback: true, crossed: 0})
  })
})

/* ── What is eligible ──────────────────────────────────────────────────────── */

describe('rankAcross: what can be listed', () => {
  test('never the page itself, though it shares every tag', () => {
    const pool = [doc('page', 'perspective', ['arch-1']), doc('a', 'perspective', ['arch-2'])]
    assert.deepEqual(outcome(rank(page(['arch-1']), pool)).ids, ['a'])
  })

  /* Genre decides the category, so a piece without one, or with one outside both top
     concepts' subtrees, belongs nowhere: not in the ranking and not in the fallback. */
  test('never a document whose genre is missing or in neither category', () => {
    const pool = [
      doc('none', null, ['arch-1']),
      doc('alien', 'unknown-genre', ['arch-1']),
      doc('a', 'perspective', ['arch-2']),
    ]
    assert.deepEqual(outcome(rank(page(['arch-1']), pool)).ids, ['a'])
    assert.deepEqual(outcome(rank(page(['ux-1']), pool)).ids, ['a'])
  })

  /* The old branch rule kept notes and articles apart. Here a clipping is home to an
     article's page, and does not count as crossing. */
  test('an article and a note relate inside Insights, without crossing', () => {
    const result = rank(page(['arch-1']), [doc('clip', 'clipping', ['arch-1'])])
    assert.deepEqual(outcome(result), {ids: ['clip'], isFallback: false, crossed: 0})
  })

  /* SKOS leaves `broader` unordered; taking the first is a Sanity habit, not a SKOS rule.
     The QUERY makes the choice; this pins what the module does with what it is given. */
  test('a concept with two parents relates through its first parent only', () => {
    const bridge = doc('b', 'perspective', ['bridge'])
    assert.equal(rank(page(['arch-1']), [bridge]).isFallback, false) // first parent: arch
    assert.equal(rank(page(['ux-1']), [bridge]).isFallback, true) // second parent: ux
  })
})

/* ── Ties ──────────────────────────────────────────────────────────────────── */

describe('rankAcross: ties', () => {
  /* Two candidates that tie on every tier: shared 1/2, nothing else. */
  const NEWER_METHOD = doc('newer-method', 'method', ['arch-1', 'ux-1'])
  const OLDER_PERSPECTIVE = doc('older-perspective', 'perspective', ['arch-1', 'ux-2'])
  const POOL = [NEWER_METHOD, OLDER_PERSPECTIVE]

  test('without a tie-break, a tie keeps the pool’s order: newest first', () => {
    assert.deepEqual(outcome(rank(page(['arch-1']), POOL)).ids, [
      'newer-method',
      'older-perspective',
    ])
  })

  test('under the tie-break, the page’s own genre wins a tie', () => {
    assert.deepEqual(outcome(rank(page(['arch-1']), POOL, TIES)).ids, [
      'older-perspective',
      'newer-method',
    ])
  })

  /* What stream 2 ships: no scores yet, so the tie-break is genre, then date. */
  test('without scores, strength adds nothing: a same-genre tie keeps the pool’s order', () => {
    const pool = [
      doc('newer', 'perspective', ['arch-1', 'ux-1']),
      doc('older', 'perspective', ['arch-1', 'ux-2']),
    ]
    assert.deepEqual(outcome(rank(page(['arch-1']), pool, TIES)).ids, ['newer', 'older'])
  })

  /* Stream 3, when the tagger's scores arrive: for each shared concept, the weaker of the
     two scores, summed. Two pieces strongly about what they share come first. */
  test('with scores, tag strength breaks a same-genre tie', () => {
    const pool = [
      doc('newer-weak', 'perspective', [['arch-1', 0.5], 'ux-1']), // min(0.9, 0.5)
      doc('older-strong', 'perspective', [['arch-1', 0.8], 'ux-2']), // min(0.9, 0.8)
    ]
    assert.deepEqual(outcome(rank(page([['arch-1', 0.9]]), pool, TIES)).ids, [
      'older-strong',
      'newer-weak',
    ])
  })

  test('strength needs a score on both sides: the candidates’ alone count for nothing', () => {
    const pool = [
      doc('newer-weak', 'perspective', [['arch-1', 0.1], 'ux-1']),
      doc('older-strong', 'perspective', [['arch-1', 0.9], 'ux-2']),
    ]
    assert.deepEqual(outcome(rank(page(['arch-1']), pool, TIES)).ids, [
      'newer-weak',
      'older-strong',
    ])
  })

  test('genre outranks strength', () => {
    const pool = [
      doc('strong-method', 'method', [['arch-1', 0.9], 'ux-1']),
      doc('weak-perspective', 'perspective', [['arch-1', 0.2], 'ux-2']),
    ]
    assert.deepEqual(outcome(rank(page([['arch-1', 0.9]]), pool, TIES)).ids, [
      'weak-perspective',
      'strong-method',
    ])
  })

  /* A tie-break only separates what the tiers could not. */
  test('a tie-break never overrides a tier', () => {
    const pool = [
      doc('method-closer', 'method', ['arch-1']), // shared 1/1
      doc('perspective-further', 'perspective', ['arch-1', 'ux-1']), // shared 1/2
    ]
    assert.deepEqual(outcome(rank(page(['arch-1']), pool, TIES)).ids, [
      'method-closer',
      'perspective-further',
    ])
  })
})
