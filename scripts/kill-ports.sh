#!/bin/bash
# Kill processes on specified ports
# Usage: ./scripts/kill-ports.sh 5160 3040

if [ $# -eq 0 ]; then
  echo "Usage: $0 <port> [port ...]" >&2
  exit 1
fi

for port in "$@"; do
  pids=$(lsof -ti:"$port" 2>/dev/null)

  if [ -n "$pids" ]; then
    kill -- $pids 2>/dev/null || true
    sleep 1

    remaining_pids=""
    for pid in $pids; do
      if kill -0 "$pid" 2>/dev/null; then
        remaining_pids="$remaining_pids $pid"
      fi
    done

    if [ -n "$remaining_pids" ]; then
      kill -9 -- $remaining_pids 2>/dev/null || true
    fi
  fi
done
