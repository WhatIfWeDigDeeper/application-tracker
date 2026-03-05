#!/usr/bin/env bash
# Usage: validate.sh <stack>
# Runs the full per-stack validation chain: audit → build → lint → test
set -euo pipefail

STACK="${1:?Usage: validate.sh <stack-name>}"

npm run "audit:ci:$STACK" && \
npm run "build:$STACK" && \
npm run "lint:$STACK" && \
npm run "test:$STACK"
