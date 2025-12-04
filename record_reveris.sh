#!/usr/bin/env bash
set -euo pipefail

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
need xdotool
need xwininfo
need ffmpeg

TITLE="${1:-AetherFrame API — Zen Browser}"
DISPLAY="${DISPLAY:-:0}"
DELAY="${DELAY:-5}"
DURATION="${DURATION:-20}"
FPS="${FPS:-30}"
OUT="${OUT:-capture.mp4}"

try_titles=(
  "$TITLE"
  "AetherFrame API — Zen Browser"
  "AetherFrame API - Zen Browser"
  "AetherFrame API"
  "AetherFrame"
  "Zen Browser"
  "Reveris Noctis"
)
WIN_ID=""
for t in "${try_titles[@]}"; do
  WIN_ID=$(DISPLAY="$DISPLAY" xdotool search --name "$t" | head -n1 || true)
  [[ -n "$WIN_ID" ]] && { TITLE="$t"; break; }
done

if [[ -z "$WIN_ID" ]]; then
  echo "Window not found. Tried: ${try_titles[*]}" >&2
  exit 1
fi

eval "$(xwininfo -id "$WIN_ID" | awk '/Absolute upper-left X/{print "X="$4};/Absolute upper-left Y/{print "Y="$4};/Width/{print "W="$2};/Height/{print "H="$2}')"

echo "Capturing \"$TITLE\" at ${W}x${H}+${X},${Y} in ${DELAY}s for ${DURATION}s -> ${OUT}"
sleep "$DELAY"
ffmpeg -y -f x11grab -framerate "$FPS" -video_size "${W}x${H}" -i "$DISPLAY+${X},${Y}" -t "$DURATION" "$OUT"
echo "Done: ${OUT}"
