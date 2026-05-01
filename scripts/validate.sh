#!/usr/bin/env bash
# Usage: validate.sh <stack>
# Runs the full per-stack validation chain: install → audit → lint → build → migrate → test
# `migrate:<stack>` is optional (--if-present) so UI stacks without a DB skip it.
# For UI stacks, also runs the matching e2e suite (test:e2e:<stack> if it exists).
set -euo pipefail

STACK="${1:?Usage: validate.sh <stack-name>}"

npm run "install:$STACK" && \
npm run "audit:ci:$STACK" && \
npm run "lint:$STACK" && \
npm run "build:$STACK" && \
npm run "migrate:$STACK" --if-present && \
npm run "test:$STACK"

npm run "test:e2e:$STACK" --if-present
