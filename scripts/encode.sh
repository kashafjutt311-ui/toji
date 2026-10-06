#!/usr/bin/env bash
# Re-encodes the source walkthrough for scroll-scrubbing.
#
#   bash scripts/encode.sh            # all outputs
#   bash scripts/encode.sh mp4        # just one: mp4 | webm | mobile | poster
#   INTRA=1 bash scripts/encode.sh    # every frame a keyframe (the brief's original spec)
#
# Why GOP 10 and not all-intra (see DECISIONS.md §Encoding): this footage is grainy CG, so
# all-intra H.264 lands at 100 MB (1280/crf24), 77 MB (crf28) and ~50 MB even at 960/crf28 —
# the brief's 40 MB budget is unreachable that way. A 10-frame GOP with no B-frames gets
# 1280/crf28 to ~30 MB with the same visual quality; a seek decodes at most 9 extra frames
# from memory (the page loads the file into a blob), a few ms on any hardware decoder.
#
# Size budgets: scrub.mp4 < 40MB, scrub-m.mp4 < 15MB. Each output walks a ladder of
# settings until it fits and logs the winner to public/video/ENCODE_LOG.txt.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets/source/CPV14.mp4
OUT=public/video
mkdir -p "$OUT"

GOP=10
[ "${INTRA:-0}" = "1" ] && GOP=1

mb() { echo $(( $(stat -c %s "$1") / 1048576 )); }

# x264. $1=out $2=width $3=crf
x264() {
  ffmpeg -v error -stats -y -i "$SRC" \
    -vf "scale=$2:-2:flags=lanczos" \
    -c:v libx264 -preset slow -crf "$3" \
    -g "$GOP" -keyint_min "$GOP" -sc_threshold 0 -bf 0 \
    -pix_fmt yuv420p -an -movflags +faststart \
    "$1"
}

# $1=file $2=budgetMB, rest = "width crf" ladder
ladder() {
  local file=$1 budget=$2; shift 2
  for cfg in "$@"; do
    set -- $cfg
    echo ">> $(basename "$file")  width=$1 crf=$2 gop=$GOP"
    x264 "$file" "$1" "$2"
    local s; s=$(mb "$file")
    echo "   = ${s}MB"
    if [ "$s" -lt "$budget" ]; then
      echo "$(basename "$file"): width=$1 crf=$2 gop=$GOP bframes=0 (${s}MB)" >> "$OUT/ENCODE_LOG.txt"
      return
    fi
  done
  echo "!! $(basename "$file") still over ${budget}MB at the last rung" | tee -a "$OUT/ENCODE_LOG.txt"
}

encode_mp4()    { ladder "$OUT/scrub.mp4"   40 "1280 27" "1280 28" "960 26" "960 28"; }
encode_mobile() { ladder "$OUT/scrub-m.mp4" 15 "720 28" "720 30" "640 30" "640 32"; }

encode_webm() {
  # VP9, constant quality. Secondary source for browsers without H.264.
  local w=${1:-1280}
  echo ">> scrub.webm  width=$w gop=$GOP"
  ffmpeg -v error -stats -y -i "$SRC" \
    -vf "scale=$w:-2:flags=lanczos" \
    -c:v libvpx-vp9 -b:v 0 -crf 42 -g "$GOP" -keyint_min "$GOP" -auto-alt-ref 0 -lag-in-frames 0 \
    -deadline good -cpu-used 4 -row-mt 1 -tile-columns 2 \
    -pix_fmt yuv420p -an \
    "$OUT/scrub.webm"
  echo "scrub.webm: width=$w crf=42 gop=$GOP ($(mb "$OUT/scrub.webm")MB)" >> "$OUT/ENCODE_LOG.txt"
}

encode_poster() {
  ffmpeg -v error -y -ss 0 -i "$SRC" -frames:v 1 -q:v 3 "$OUT/poster.jpg"
  ffmpeg -v error -y -ss 0 -i "$SRC" -frames:v 1 -vf "scale=720:-2" -q:v 4 "$OUT/poster-m.jpg"
  echo "poster.jpg, poster-m.jpg: frame 0" >> "$OUT/ENCODE_LOG.txt"
}

what=${1:-all}
[ "$what" = all ] && : > "$OUT/ENCODE_LOG.txt"
case "$what" in
  mp4) encode_mp4 ;;
  webm) encode_webm ;;
  mobile) encode_mobile ;;
  poster) encode_poster ;;
  all)
    encode_poster
    encode_mp4
    encode_mobile
    encode_webm "$(ffprobe -v error -select_streams v -show_entries stream=width -of csv=p=0 "$OUT/scrub.mp4")"
    ;;
esac
ls -la "$OUT"
