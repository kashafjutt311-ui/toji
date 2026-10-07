#!/usr/bin/env bash
# Extracts assets derived from individual frames:
#   1. the WebP sequence for the canvas fallback (USE_CANVAS_SEQUENCE / iOS)
#   2. service-page stills (hero + gallery strip) at the timestamps in lib/choreography.ts
#
#   bash scripts/frames.sh sequence
#   bash scripts/frames.sh stills
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/source/CPV14.mp4

# Must match SEQUENCE in lib/choreography.ts
SEQ_FPS=24
SEQ_W=960
SEQ_CHUNK=96   # frames per lazy-load chunk (4s of footage)

sequence() {
  local out=public/frames/seq
  rm -rf "$out"; mkdir -p "$out"
  ffmpeg -v error -stats -y -i "$SRC" \
    -vf "fps=$SEQ_FPS,scale=$SEQ_W:-2:flags=lanczos" \
    -c:v libwebp -quality 62 -compression_level 4 \
    -start_number 0 "$out/%05d.webp"
  local n; n=$(ls "$out" | wc -l)
  printf '{"fps":%d,"width":%d,"count":%d,"chunk":%d}\n' "$SEQ_FPS" "$SEQ_W" "$n" "$SEQ_CHUNK" > "$out/manifest.json"
  echo "sequence: $n frames, $(du -sh "$out" | cut -f1)"
}

# slug:seconds pairs; hero first, then the gallery strip. Keep in sync with data/services.ts.
STILLS=(
  "development:54 development-1:49 development-2:52 development-3:56"
  "sales-marketing:61 sales-marketing-1:58 sales-marketing-2:60 sales-marketing-3:63"
  "real-estate:70 real-estate-1:66 real-estate-2:68 real-estate-3:73"
  "hospitality:82 hospitality-1:77 hospitality-2:80 hospitality-3:86"
  "art:93 art-1:91 art-2:96 art-3:99"
  "academy:112 academy-1:104 academy-2:108 academy-3:110"
  # reduced-motion section stills (STILLS in lib/choreography.ts)
  "about:16 process:130 contact:144"
)

stills() {
  mkdir -p public/frames
  for group in "${STILLS[@]}"; do
    for pair in $group; do
      local name=${pair%%:*} t=${pair##*:}
      # native 1280w (upscaling a 720p master to 1920 adds bytes, not detail)
      ffmpeg -v error -y -ss "$t" -i "$SRC" -frames:v 1 -q:v 3 "public/frames/$name.jpg"
    done
  done
  ls public/frames/*.jpg | wc -l
}

case "${1:-all}" in
  sequence) sequence ;;
  stills) stills ;;
  all) stills; sequence ;;
esac
