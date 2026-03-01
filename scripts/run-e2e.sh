#!/usr/bin/env bash
set -euo pipefail

STACK="${1:-all}"
STACKS=(express react-koa vue svelte tanstack-start tanstack angular)
STARTED_PORTS=()

api_port() {
  case "$1" in
    express)        echo 3001 ;;
    react-koa)      echo 5010 ;;
    vue)            echo 5040 ;;
    svelte)         echo 5001 ;;
    tanstack-start) echo 5160 ;;
    tanstack)       echo 5050 ;;
    angular)        echo 5070 ;;
  esac
}

api_script() {
  case "$1" in
    express)        echo "dev:express-api" ;;
    react-koa)      echo "dev:koa-api" ;;
    vue)            echo "dev:nuxt-api" ;;
    svelte)         echo "dev:hono-api" ;;
    tanstack-start) echo "dev:fastapi" ;;
    tanstack)       echo "dev:nest-api" ;;
    angular)        echo "dev:go-api" ;;
  esac
}

port_in_use() { lsof -ti :"$1" >/dev/null 2>&1; }

wait_for_port() {
  local port=$1 elapsed=0 timeout=30
  printf "  Waiting for :%s" "$port"
  while ! port_in_use "$port"; do
    sleep 1; elapsed=$((elapsed + 1)); printf "."
    if [ "$elapsed" -ge "$timeout" ]; then
      echo " TIMEOUT after ${timeout}s"; return 1
    fi
  done
  echo " ready (${elapsed}s)"
}

ensure_api() {
  local stack=$1 port; port=$(api_port "$stack")
  if port_in_use "$port"; then
    echo "[$stack] API already running on :$port"
  else
    echo "[$stack] Starting API on :$port..."
    npm run "$(api_script "$stack")" &>/tmp/e2e-api-"$stack".log &
    STARTED_PORTS+=("$port")
    wait_for_port "$port"
  fi
}

cleanup() {
  [ "${#STARTED_PORTS[@]}" -eq 0 ] && return
  echo "Stopping APIs started by this script (ports: ${STARTED_PORTS[*]})..."
  for port in "${STARTED_PORTS[@]}"; do
    lsof -ti :"$port" 2>/dev/null | xargs kill 2>/dev/null || true
  done
}
trap cleanup EXIT

valid_stack() {
  for s in "${STACKS[@]}"; do [ "$s" = "$1" ] && return 0; done; return 1
}

if [ "$STACK" = "all" ]; then
  echo "Starting required APIs..."
  for s in "${STACKS[@]}"; do ensure_api "$s"; done
  for s in "${STACKS[@]}"; do
    echo ""; echo "=== $s ==="; npm run "test:e2e:$s"
  done
elif valid_stack "$STACK"; then
  ensure_api "$STACK"
  echo ""; echo "=== $STACK ==="; npm run "test:e2e:$STACK"
else
  echo "Unknown stack: '$STACK'. Valid: ${STACKS[*]}, all"; exit 1
fi
