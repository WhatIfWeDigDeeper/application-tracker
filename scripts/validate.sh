#!/usr/bin/env bash
# Usage: validate.sh <stack>
# Runs the full per-stack validation chain: install → audit → lint → build → test
# For UI stacks, also runs the matching e2e suite (test:e2e:<stack> if it exists).
set -euo pipefail

STACK="${1:?Usage: validate.sh <stack-name>}"

npm run "install:$STACK" && \
npm run "audit:ci:$STACK" && \
npm run "lint:$STACK" && \
npm run "build:$STACK" && \
npm run "test:$STACK"

npm run "test:e2e:$STACK" --if-present
