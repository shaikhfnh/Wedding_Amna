#!/usr/bin/env bash
# compress-media.sh — shrink the site's videos WITHOUT touching the originals.
# Run from the project root:   bash scripts/compress-media.sh
# Needs ffmpeg:                brew install ffmpeg
# Writes lighter copies to public/media/_compressed/ and prints before/after sizes.
# When you are happy, move them over:  mv public/media/_compressed/* public/media/
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=public/media; OUT=$SRC/_compressed
command -v ffmpeg >/dev/null || { echo "ffmpeg not found. Install it with: brew install ffmpeg"; exit 1; }
mkdir -p "$OUT"

mp4() { # in out height crf
  [ -f "$SRC/$1" ] || return 0
  ffmpeg -y -v error -i "$SRC/$1" -an -vf "scale=-2:$3:flags=lanczos" \
    -c:v libx264 -preset slow -crf "$4" -pix_fmt yuv420p -profile:v high -movflags +faststart "$OUT/$2"
}
webm() { # in out height crf
  [ -f "$SRC/$1" ] || return 0
  ffmpeg -y -v error -i "$SRC/$1" -an -vf "scale=-2:$3:flags=lanczos" \
    -c:v libvpx-vp9 -b:v 0 -crf "$4" -row-mt 1 -cpu-used 2 -pix_fmt yuv420p "$OUT/$2"
}

# phones (what most guests use): 720p
mp4  couple-m.mp4      couple-m.mp4      1280 27
mp4  loop-m.mp4        loop-m.mp4        1280 27
# desktop: 1080p instead of 1440p (the page shows it in a phone-width column, so no visible loss)
mp4  couple-1440.mp4   couple-1440.mp4   1920 26
mp4  loop-1440.mp4     loop-1440.mp4     1920 26
webm couple-1440.webm  couple-1440.webm  1920 36
webm loop-1440.webm    loop-1440.webm    1920 36
# the envelope intro plays first, so it must be small
mp4  envelope.mp4      envelope.mp4      1280 27
webm envelope.webm     envelope.webm     1280 36

echo; printf "%-22s %10s %10s\n" file before after
for f in "$OUT"/*; do b=$(basename "$f"); o=$(stat -f%z "$SRC/$b" 2>/dev/null || stat -c%s "$SRC/$b"); n=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
  printf "%-22s %8s KB %8s KB\n" "$b" $((o/1024)) $((n/1024)); done
echo; echo "Watch each one in _compressed/ first. If good:  mv public/media/_compressed/* public/media/ && rmdir public/media/_compressed"
