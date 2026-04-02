#!/bin/bash
# Kill processes on specified ports
# Usage: ./scripts/kill-ports.sh 5160 3040

for port in "$@"; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
