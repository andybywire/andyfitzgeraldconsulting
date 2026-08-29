/**
 * The masonry partition — how a date-ordered list becomes N balanced columns.
 *
 * ── WHY THIS IS A BUILD-TIME PARTITION AND NOT A LAYOUT ──────────────────────
 *
 * Native CSS masonry (`grid-template-rows: masonry`, now heading for the `item-flow`
 * syntax) does not ship unflagged anywhere. The two things that DO work today each
 * give up something this page cannot give up:
 *
 *   - `columns` / multicol balances exactly, with zero JS, but it fills each column
 *     top-to-bottom BEFORE moving right, so reading across a row jumps backwards
 *     through the dates. Worse for us: multicol REBALANCES THE WHOLE CONTAINER
 *     whenever the item set changes, so every card on screen moves on a "show more"
 *     and on every filter click — the same teleport docs/urls-and-filtering.md rules
 *     against for the chips themselves.
 *   - A client-side masonry library measures real heights, but it re-parents the DOM
 *     on load and on resize, when nothing asked it to.
 *
 * Partitioning here, at build time, keeps reading order, keeps the cards still when
 * the set changes (hiding a card shortens its own column and nothing else), and needs
 * no script at all for the resting page.
 *
 * TWO THINGS IT COSTS. Heights are PREDICTED, not measured — see the height model
 * below, which is calibrated against the browser but cannot be exact. And one DOM
 * serves exactly ONE partition, which is why the column wrappers are erased with
 * `display: contents` below `lg` and the middle rung is a row grid rather than a
 * second masonry.
 *
 * ── GREEDY IS PREFIX-BALANCED, WHICH IS THE WHOLE TRICK ──────────────────────
 *
 * Walking the list in date order and dropping each item into whichever column is
 * currently SHORTEST means the columns are approximately equal after every single
 * placement — not just at the end. So one pass over all 45 items yields a balanced
 * first 20, a balanced first 30 and a balanced full set, and "show more" reveals the
 * hidden tail of each column without disturbing the balance. No separate partition
 * for the initial view, and no special casing.
 *
 * A batch algorithm optimising only the total would beat it on final raggedness and
 * lose this property, which matters more.
 */

/** One column's worth of items, in the order they were placed. */
export type Columns<T> = T[][]

/**
 * Distribute `items` across `columnCount` columns, newest first, shortest-column-wins.
 *
 * Ties keep the LEFTMOST column, which is what makes the first row read 1-2-3: every
 * column starts at zero, so the first `columnCount` items go left to right before any
 * height has accumulated.
 *
 * Generic over the item and its measurement, so this half of the file knows nothing
 * about Sanity, about cards, or about which page is calling it.
 */
export function partitionColumns<T>(
  items: readonly T[],
  columnCount: number,
  estimate: (item: T) => number,
): Columns<T> {
  const columns: Columns<T> = Array.from({length: columnCount}, () => [])
  const heights = new Array<number>(columnCount).fill(0)

  for (const item of items) {
    let target = 0
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[target]) target = i
    }
    columns[target].push(item)
    heights[target] += estimate(item)
  }

  return columns
}

/* ── The height model ──────────────────────────────────────────────────────── */
/*
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  MEASURED IN THE BROWSER, NOT READ OFF THE BOARD. Every constant below    │
 * │  was checked against the six real cards on the specimen page at 1280,     │
 * │  with `document.fonts.ready` awaited. Three of them were wrong when       │
 * │  derived from Figma and the CSS alone.                                    │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * These are the DESKTOP values, because the partition only ever governs the `lg`
 * three-column rung — the other two rungs erase the wrappers and read the cards in
 * source order. So the fluid type steps are taken at their clamp maxima and the
 * column is the board's 316, both of which are exactly what applies there.
 *
 * WHAT MEASURING CORRECTED:
 *
 *   - THE CARD TITLE IS LATO, NOT NOTO SERIF. `--font-heading` resolves to Lato 700
 *     and `--font-prose` to Noto Serif 400, so the title and the body are two
 *     families with two different metrics. Derived from the CSS this looked like one.
 *   - THE BORDER IS 2px OF HEIGHT. `.card` and `.note-card` both declare a hairline
 *     border at rest — the note card only turns it TRANSPARENT at md, it does not
 *     remove it — and `box-sizing: border-box` means it also eats 2px of the text
 *     column. So the text width at a 316 column is 282, not 284, and the media box
 *     measures 158.63 rather than 159.75.
 *   - A NOTE CARD IN AN EQUAL-HEIGHT ROW REPORTS THE ROW'S HEIGHT, not its own. Two
 *     specimen notes both measured 211.3 with different content. Only the natural
 *     height is the thing to model; `align-items: start` on the masonry is what stops
 *     the rendered page doing this.
 *
 * The stacks then fall out of ArticleCard.astro and NoteCard.astro exactly:
 *
 *   with media     2 + 32 + title + 8 + media + 16 + eyebrow + 8 + body
 *   without media  2 + 32 + title + 8         +      eyebrow + 8 + body
 *
 * where 2 is the border, 32 the two paddings, and the media-to-body 16 is
 * `card-media-block` — itself two declarations, the grid's 8 row-gap plus the body's
 * `calc(--card-media-block - --card-gap)`.
 *
 * VERIFIED against getBoundingClientRect on all three shapes at a 316 column:
 *
 *   article, 2-line title, 4-line body    415.13 predicted   415.1 measured
 *   note,    1-line title, 4-line body    211.25 predicted   211.3 measured
 *   clipping, 2-line title, 1-line source 159.50 predicted   159.5 measured
 */

const CARD_BORDER = 1
const CARD_PAD = 16
const CARD_GAP = 8
const CARD_MEDIA_BLOCK = 16

/** The board's masonry column, and so the width every card is measured at. */
const COLUMN_WIDTH = 316
const TEXT_WIDTH = COLUMN_WIDTH - CARD_PAD * 2 - CARD_BORDER * 2

const TITLE_SIZE = 22.5
const TITLE_LINE = TITLE_SIZE * 1.3
const BODY_SIZE = 18
const BODY_LINE = BODY_SIZE * 1.5
const EYEBROW_LINE = 16 * 1.5

/** `.card-media` is 16/9 of the text column. Measured at 158.63. */
const MEDIA_HEIGHT = (TEXT_WIDTH * 9) / 16

/*
 * ── THE TWO TUNABLES, AND WHY THERE ARE TWO ──────────────────────────────────
 *
 * Average glyph advance as a fraction of the font size. Canvas `measureText` over a
 * corpus of real titles and descriptions puts BOTH faces at 0.484 — Lato 700 and Noto
 * Serif 400 are near-identical on average width, which is a coincidence worth not
 * relying on. The numbers below are deliberately not that measurement:
 *
 *   BODY is inflated to 0.53 to absorb RAGGED-RIGHT WASTE. A line never fills to
 *   capacity — the last word wraps — so `length / capacity` systematically
 *   under-counts lines on long runs. Two of six specimen bodies came out a line short
 *   at the true glyph ratio.
 *
 *   TITLE is 0.45 because titles are short, so ragged-right waste is a rounding
 *   error, while the letter mix is not: "Stability in Unstable Times" is 27 narrow
 *   characters that fit one line where 27 average ones would not.
 *
 * ── A SINGLE RATIO CANNOT FIT BOTH, AND THAT IS THE MODEL'S REAL LIMIT ───────
 *
 * Solving for one value across the measured strings gives an EMPTY feasible band:
 * "Stability in Unstable Times" needs <= 0.4642 and a long serif body needs >= 0.5281.
 * Character counting cannot see letter mix, so exactness is not on offer at any
 * constant. Split by role, it fits.
 *
 * ── CALIBRATED AGAINST ALL 45 RENDERED CARDS, 2026-08-28 ─────────────────────
 *
 * A first pass fitted these to twelve strings on the specimen page and got the title
 * wrong: 0.45 scored 40 of 45 line counts with a net bias of MINUS FIVE LINES, so
 * every title-heavy card was predicted short. Swept against the real index at a 282px
 * text column, both are now the optimum of their band:
 *
 *   title  0.470   42/45 exact, net bias +1 line   (band 0.465-0.51)
 *   body   0.525   41/45 exact, net bias  0 lines  (band 0.515-0.545)
 *
 * Both sit inside the twelve-string bands too, so the two calibrations agree rather
 * than one overwriting the other.
 *
 * WHAT SAVES THE REMAINING ERROR is that greedy needs a RANKING, not a measurement: it
 * only has to know which column is currently shorter. A one-line error is 27px against
 * cards of 160-500px, and errors in both directions partly cancel down a column. The
 * rendered index measures 243px ragged on 6689 — 3.6% — where `column-count: 3` on the
 * same content measures 391px and the Figma board's own columns are ragged by 147 on
 * 1099, which is 13%.
 */
const TITLE_CHAR_RATIO = 0.47
const BODY_CHAR_RATIO = 0.525

/**
 * Line count for a string set at `fontSize` in the card's text column.
 *
 * `text-wrap: balance` on the headings changes WHERE the breaks fall but not how many
 * there are, so it does not affect this.
 */
function lineCount(text: string | null | undefined, fontSize: number, ratio: number): number {
  if (!text) return 0
  const charsPerLine = TEXT_WIDTH / (fontSize * ratio)
  return Math.max(1, Math.ceil(text.trim().length / charsPerLine))
}

/**
 * What a card needs in order to be measured.
 *
 * Deliberately the strings the card will RENDER, not the document it came from — so a
 * Clipping passes its source domain as `body` and needs no genre branch here, and this
 * module never learns what a `clipRef` is. Structural, so a query result satisfies it
 * without an import or a cast.
 */
export interface CardShape {
  title?: string | null
  /** `shortDescription`, or a Clipping's source domain — whatever renders in the card. */
  body?: string | null
  /** True for an article card with a hero. Note cards never have one. */
  hasMedia?: boolean
}

/** Predicted rendered height of one card at the masonry column width, in px. */
export function estimateCardHeight(card: CardShape): number {
  const title = lineCount(card.title, TITLE_SIZE, TITLE_CHAR_RATIO) * TITLE_LINE
  const body = lineCount(card.body, BODY_SIZE, BODY_CHAR_RATIO) * BODY_LINE

  /* Eyebrow and body are one block: `card-gap` between them, and the block sits
     `card-gap` below whatever precedes it. */
  const meta = EYEBROW_LINE + (body ? CARD_GAP + body : 0)
  const chrome = CARD_BORDER * 2 + CARD_PAD * 2

  if (!card.hasMedia) {
    return chrome + title + CARD_GAP + meta
  }

  return chrome + title + CARD_GAP + MEDIA_HEIGHT + CARD_MEDIA_BLOCK + meta
}
