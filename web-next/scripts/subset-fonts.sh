#!/usr/bin/env bash
#
# Build web-next/src/assets/fonts/ from the upstream font files.
#
# Run by hand, not by the build. The outputs are committed, so this only needs
# re-running if the range changes or an upstream font is replaced. Astro's Fonts
# API consumes these files through the `local` provider and hashes them into
# _astro/fonts/, which is why they live in src/ rather than public/ — a file in
# public/ would be copied verbatim AND emitted hashed, shipping both.
#
#   ./web-next/scripts/subset-fonts.sh [SRC_DIR]
#
# Requires fonttools (brew install fonttools). The formula bundles brotli and
# zopfli, which is what lets pyftsubset read and write .woff2 directly.
#
# ── What this does, and why ───────────────────────────────────────────────────
#
# Two steps, and only the second is "subsetting":
#
#  1. varLib.instancer pins the `wdth` axis at 100. A variable font stores one
#     set of outlines plus deltas describing how each point moves as an axis
#     changes. Noto Serif carries wght 100-900 and wdth 62.5-100; DESIGN.md
#     never uses a narrow width, and the old CSS pinned `font-stretch: 100%`
#     anyway, so every wdth delta was paid for and unusable. Pinning bakes 100
#     into the outlines and deletes the deltas and the axis record. wght
#     survives in full, which is what `font-weight: 100 900` needs.
#
#  2. pyftsubset drops unreferenced glyphs, rewrites cmap, and prunes GSUB/GPOS
#     to rules touching surviving glyphs. This is the lever: 3,783 glyphs -> 362.
#     Greek, Cyrillic, Vietnamese and phonetics all go.
#
# ── Latin only, deliberately — there is no Extended-A tier ────────────────────
#
# An earlier version shipped a second `latin-ext` tier on a disjoint
# unicode-range, so a Central/Eastern European name (Capek, Erdos, Lukasiewicz)
# got real Noto Serif rather than a system serif. It was dropped, and the reason
# is worth keeping: it only ever covered PROSE. Lato had no ext tier, because
# Google's Lato carries just 24 of the 128 Extended-A codepoints -- so the same
# name rendered in real Noto Serif in a paragraph and in Helvetica in a heading.
#
# Astro's `optimizedFallbacks` closed the gap from the other side. It reads each
# face's real metrics and emits a metric-matched fallback @font-face, so those
# characters now fall back consistently in BOTH families, scaled to match the
# webfont's x-height. Uniform behavior beats a tier that fixed half the problem
# for 40 KB. See CLAUDE.md, Fonts.
#
# Lato is copied through unchanged. Both files are already latin-subset from
# Google Fonts at 28 KB each, so there is nothing to win.
#
set -euo pipefail

# Reproducibility. fontTools stamps `head.modified` with the current time, and
# that 4-byte change perturbs woff2 compression enough to move the output by tens
# of bytes: two runs of this script produced 48016 and 48052 bytes for the same
# input before this was pinned, which made "the committed files are reproducible"
# false. SOURCE_DATE_EPOCH is fontTools' own hook for it. The value is arbitrary
# but must not change, or every output moves. Verified: two consecutive runs now
# produce byte-identical files.
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1136073600}"

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="${1:-$REPO/web/assets/fonts}"
OUT="$REPO/web-next/src/assets/fonts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ASCII + Latin-1 Supplement (all Spanish and French accents),
# OE ligature, Y diaeresis, General Punctuation, and a few marks and symbols.
LATIN='U+0000-00FF,U+0131,U+0152-0153,U+0178,U+02BB-02BC,U+02C6,U+02DA,U+02DC'
LATIN+=',U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193'
LATIN+=',U+2212,U+2215,U+FEFF,U+FFFD'

mkdir -p "$OUT"

subset() {
  local src=$1 style=$2
  echo "  ${style}: pinning wdth=100"
  fonttools varLib.instancer -q -o "$TMP/$style.ttf" "$src" wdth=100
  pyftsubset "$TMP/$style.ttf" \
    --unicodes="$LATIN" \
    --flavor=woff2 \
    --output-file="$OUT/$style-latin.woff2"
}

echo "Subsetting Noto Serif from $SRC"
subset "$SRC/NotoSerif-VariableFont_wdth,wght.woff2" noto-serif
subset "$SRC/NotoSerif-Italic-VariableFont_wdth,wght.woff2" noto-serif-italic

echo "Copying Lato through unchanged"
cp "$SRC/Lato-Regular.woff2" "$OUT/lato-regular.woff2"
cp "$SRC/Lato-Bold.woff2" "$OUT/lato-bold.woff2"

echo
echo "$OUT:"
ls -l "$OUT"/*.woff2 | awk '{printf "  %-34s %7.1f KB\n", substr($9, match($9, /[^\/]*$/)), $5/1024}'
