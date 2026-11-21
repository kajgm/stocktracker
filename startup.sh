#!/bin/bash
# Launch (or restart) the stocktracker display in kiosk mode on the Raspberry Pi.
#
# The URL comes from, in order:
#   1. STOCKTRACKER_URL, e.g. STOCKTRACKER_URL=https://stocks.example.com/ ./startup.sh
#   2. ~/.config/stocktracker/url (one line), so restarts don't need the variable
#   3. http://localhost:8080/ (containers on the Pi itself)
#
# Running it again closes the current kiosk window and opens a fresh one, which
# loads the latest UI. Works over SSH: it targets the Pi's own display.
set -u

export DISPLAY="${DISPLAY:-:0}"
export XAUTHORITY="${XAUTHORITY:-$HOME/.Xauthority}"

URL_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/stocktracker/url"
URL="${STOCKTRACKER_URL:-}"
if [ -z "$URL" ] && [ -r "$URL_FILE" ]; then
  URL="$(head -n 1 "$URL_FILE" | tr -d '[:space:]')"
fi
URL="${URL:-http://localhost:8080/}"

# Raspberry Pi OS Bookworm ships `chromium`; older releases ship `chromium-browser`.
BROWSER="$(command -v chromium || command -v chromium-browser)"
if [ -z "$BROWSER" ]; then
  echo "Chromium not found; install it with: sudo apt install chromium" >&2
  exit 1
fi

# Close a running kiosk first (only ours, tagged by --class), and wait for it to
# exit: a second Chromium started while the first is alive just opens a window
# in the old process.
KIOSK_TAG="--class=stocktracker-kiosk"
if pkill -f -- "$KIOSK_TAG"; then
  for _ in $(seq 1 20); do
    pgrep -f -- "$KIOSK_TAG" >/dev/null || break
    sleep 0.25
  done
  pkill -9 -f -- "$KIOSK_TAG" 2>/dev/null || true
fi

echo "Opening $URL"
nohup "$BROWSER" "$KIOSK_TAG" --kiosk --app="$URL" --start-fullscreen --incognito \
  --noerrdialogs --disable-infobars --check-for-update-interval=31536000 \
  >/dev/null 2>&1 &
