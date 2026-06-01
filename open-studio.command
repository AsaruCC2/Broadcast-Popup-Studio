#!/bin/zsh
cd "$(dirname "$0")"

PORT="${PORT:-4173}"
URL="http://127.0.0.1:${PORT}/?v=20260531-3"

if curl -fsS "http://127.0.0.1:${PORT}" >/dev/null 2>&1; then
  open "$URL"
  exit 0
fi

npm run preview &
SERVER_PID=$!

for _ in {1..30}; do
  if curl -fsS "http://127.0.0.1:${PORT}" >/dev/null 2>&1; then
    open "$URL"
    wait "$SERVER_PID"
    exit $?
  fi
  sleep 0.2
done

open "$URL"
wait "$SERVER_PID"
