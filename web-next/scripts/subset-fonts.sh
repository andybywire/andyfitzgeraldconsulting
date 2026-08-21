#!/usr/bin/env bash
#
# Build web-next/public/fonts/ from the upstream font files.
#
# Run by hand, not by the build. The outputs are committed, so this only needs
# re-running if the range changes or an upstream font is replaced.
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
#     to rules touching surviving glyphs. This is the lever: 3,783 glyphs -> 362
#     for the latin tier. Greek, Cyrillic, Vietnamese and phonetics all go.
#
# ── Why two tiers ─────────────────────────────────────────────────────────────
#
# `latin` is always fetched. `latin-ext` is Latin Extended-A only, and exists so
# Central/Eastern European author names (Čapek, Erdős, Łukasiewicz) don't fall
# back to a system serif mid-word. Because the @font-face carries a
# `unicode-range`, a reader who never encounters one of those letters downloads
# zero bytes of it.
#
# The two ranges MUST NOT overlap. Where they do, font matching between equal
# faces is decided by declaration order rather than by range, which is
# ambiguous by construction. So the ext range is carved around the four
# Extended-A codepoints the latin tier already claims: U+0131 (Turkish dotless
# i), U+0152-0153 (OE ligature) and U+0178 (Y diaeresis).
#
# Lato is copied through unchanged. Both files are already latin-subset from
# Google Fonts at 28 KB each, so there is nothing to win.
#
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="${1:-$REPO/web/assets/fonts}"
OUT="$REPO/web-next/public/fonts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Always fetched: ASCII + Latin-1 Supplement (all Spanish and French accents),
# OE ligature, Y diaeresis, General Punctuation, and a few marks and symbols.
LATIN='U+0000-00FF,U+0131,U+0152-0153,U+0178,U+02BB-02BC,U+02C6,U+02DA,U+02DC'
LATIN+=',U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193'
LATIN+=',U+2212,U+2215,U+FEFF,U+FFFD'

# Fetched only on demand: Latin Extended-A, carved around the four codepoints
# above so the two ranges are disjoint.
EXTA='U+0100-0130,U+0132-0151,U+0154-0177,U+0179-017F'

mkdir -p "$OUT"

subset() {
  local src=$1 style=$2
  echo "  ${style}: pinning wdth=100"
  fonttools varLib.instancer -q -o "$TMP/$style.ttf" "$src" wdth=100
  for tier in latin latin-ext; do
    [ "$tier" = latin ] && local range="$LATIN" || local range="$EXTA"
    pyftsubset "$TMP/$style.ttf" \
      --unicodes="$range" \
      --flavor=woff2 \
      --output-file="$OUT/$style-$tier.woff2"
  done
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
