#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${1:-8000}"
URL="http://127.0.0.1:${PORT}/dashboard.html"

python3 -m http.server "$PORT" --bind 127.0.0.1 &
SERVER_PID=$!

cleanup(){
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
fi

echo "Provoware Dashboard läuft lokal: $URL"
echo "Beenden mit Strg+C."
wait "$SERVER_PID"
