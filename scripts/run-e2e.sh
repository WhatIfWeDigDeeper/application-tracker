#!/usr/bin/env bash
set -euo pipefail

STACK="${1:-all}"
STACKS=(react-next-ui react-ui vue-ui svelte-ui tanstack-start-ui tanstack-ui angular-ui angular-spring-ui react-apollo-ui lambda-react-ui)
STARTED_PORTS=()
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

load_env_file() {
  local env_file=$1
  if [ -f "$env_file" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

api_port() {
  case "$1" in
    react-next-ui)       echo 3001 ;;
    react-ui)            echo 5010 ;;
    vue-ui)              echo 5040 ;;
    svelte-ui)           echo 5030 ;;
    tanstack-start-ui)   echo 5160 ;;
    tanstack-ui)         echo 5050 ;;
    angular-ui)          echo 5070 ;;
    angular-spring-ui)   echo 8080 ;;
    react-apollo-ui)     echo 5080 ;;
    lambda-react-ui)     echo 5090 ;;
  esac
}

api_script() {
  case "$1" in
    react-next-ui)       echo "dev:express-api" ;;
    react-ui)            echo "dev:koa-api" ;;
    vue-ui)              echo "dev:nuxt-api" ;;
    svelte-ui)           echo "dev:hono-api" ;;
    tanstack-start-ui)   echo "dev:fastapi" ;;
    tanstack-ui)         echo "dev:nest-api" ;;
    angular-ui)          echo "dev:go-api" ;;
    angular-spring-ui)   echo "dev:spring-api" ;;
    react-apollo-ui)     echo "dev:yoga-api" ;;
    lambda-react-ui)     echo "dev:lambda-api" ;;
  esac
}

port_in_use() { lsof -ti :"$1" >/dev/null 2>&1; }

api_timeout() {
  case "$1" in
    angular-spring-ui) echo 90 ;;  # Spring Boot + Gradle compile can take 60-90s cold start
    *)                 echo 20 ;;
  esac
}

wait_for_port() {
  local port=$1 stack=$2 elapsed=0 timeout; timeout=$(api_timeout "$stack")
  printf "  Waiting for :%s" "$port"
  while ! port_in_use "$port"; do
    sleep 1; elapsed=$((elapsed + 1)); printf "."
    if [ "$elapsed" -ge "$timeout" ]; then
      echo " TIMEOUT after ${timeout}s"
      echo "  Last lines of /tmp/e2e-api-${stack}.log:"
      tail -10 "/tmp/e2e-api-${stack}.log" 2>/dev/null | sed 's/^/    /'
      return 1
    fi
  done
  echo " ready (${elapsed}s)"
}

ensure_dynamodb_local() {
  if port_in_use 8000; then
    echo "[lambda-api] DynamoDB Local already running on :8000"
  else
    echo "[lambda-api] Starting DynamoDB Local..."
    docker compose --project-directory "$ROOT_DIR" up -d dynamodb-local
    wait_for_port 8000 "dynamodb-local"
  fi
  echo "[lambda-api] Running DynamoDB table migration..."
  load_env_file "$ROOT_DIR/lambda-api/.env"
  DYNAMODB_ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:${DYNAMODB_PORT:-8000}}" \
  AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local}" \
  AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local}" \
  npm --prefix "$ROOT_DIR" run migrate:lambda-api
}

ensure_api() {
  local stack=$1 port; port=$(api_port "$stack")
  if [ "$stack" = "lambda-react-ui" ]; then
    ensure_dynamodb_local
  fi
  if port_in_use "$port"; then
    echo "[$stack] API already running on :$port"
  else
    echo "[$stack] Starting API on :$port..."
    npm run "$(api_script "$stack")" &>/tmp/e2e-api-"$stack".log &
    STARTED_PORTS+=("$port")
    wait_for_port "$port" "$stack"
    sleep 3  # allow DB pool / runtime to fully initialize after port opens
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
