// Reads a marked M3.n report back into data: every page's columns, cards, Best marks and notes.
//
// m3-report.mjs uses it to carry a marked report forward into the next one, and the extract
// script will use it to chart trends across every m3.*.md (plan.md → M3.n evaluation reports).
// Pure: it takes the report's text and returns plain objects.
//
// ── WHAT IT RELIES ON ────────────────────────────────────────────────────────────────────────
//
// - A page is a `### ` heading with `<!-- id: … -->` on the line under it. The id identifies the
//   page, not the heading, so a title edit or a "— NEW" flag in the heading changes nothing.
// - Its table has a header row of column names, a separator row, three card rows, then a Best row
//   and a Notes row, found by their first cell.
// - Obsidian pads every cell with spaces and rewrites the separator row when it saves. Both are
//   ignored: cells are trimmed, and the separator row is never read.
// - A card cell holds a title, with "⇄ " before a card from the other category and `\|` for a pipe.
//   "—" means the column had no card in that row. "no change", in row 1 only, means the column
//   repeats the column to its left, so it is resolved to that column's cards.
// - A header cell is the column's name, then " (agree n/3)", " · recent" and " · same as …" when
//   present. Only the name and the recent flag are kept: agreement is recomputed, not trusted.

const cellsOf = (row) =>
  row
    .trim()
    .replace(/^\|/, '')
    .replace(/(?<!\\)\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim())

const HEADER = /^(.*?)(?: \(agree \d\/3\))?( · recent)?(?: · same as .*)?$/

/** A card cell's title, or null for "—". */
const cardOf = (text) => {
  if (text === '—' || text === '') return null
  return text.replace(/^⇄ /, '').replaceAll('\\|', '|')
}

/**
 * @returns {{pages: {id: string, heading: string, tagLines: string[],
 *   columns: {name: string, recent: boolean, cards: (string|null)[], best: boolean, note: string}[]
 * }[], marks: number}}
 */
export function parseReport(text) {
  const lines = text.split('\n')
  const starts = lines.flatMap((l, i) => (l.startsWith('### ') ? [i] : []))
  const pages = starts.map((start, k) => {
    const block = lines.slice(start, starts[k + 1] ?? lines.length)
    const where = `"${block[0]}"`
    const id = block[1]?.match(/^<!-- id: (.+) -->$/)?.[1]
    if (!id) throw new Error(`${where} has no id comment on the line under it`)

    const tagLines = block.filter((l) => /^- \*\*.+?:\*\* /.test(l))
    const table = block.filter((l) => l.startsWith('|')).map(cellsOf)
    const best = table.find((r) => r[0] === '**Best**')
    const notes = table.find((r) => r[0] === '**Notes**')
    const cardRows = table.filter((r) => /^[123]$/.test(r[0]))
    if (table.length !== 7 || !best || !notes || cardRows.length !== 3) {
      throw new Error(`${where}: expected a header, a separator, 3 card rows, Best and Notes`)
    }

    const header = table[0].slice(1)
    const columns = []
    header.forEach((cell, i) => {
      const [, name, recent] = cell.match(HEADER)
      let cards = cardRows.map((r) => cardOf(r[i + 1] ?? ''))
      if (cards[0] === 'no change') {
        if (i === 0) throw new Error(`${where}: the first column cannot be "no change"`)
        cards = columns[i - 1].cards
      }
      columns.push({
        name,
        recent: Boolean(recent),
        cards,
        best: (best[i + 1] ?? '').includes('✅'),
        note: (notes[i + 1] ?? '').replaceAll('\\|', '|'),
      })
    })
    return {id, heading: block[0].slice(4).replace(/ — NEW$/, ''), tagLines, columns}
  })

  const marks = pages.reduce((n, p) => n + p.columns.filter((c) => c.best).length, 0)
  return {pages, marks}
}
