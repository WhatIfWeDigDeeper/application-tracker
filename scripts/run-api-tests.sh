#!/usr/bin/env bash
set -euo pipefail

STACK="${1:-all}"
# Maps UI stack names to API names for npm scripts; also accepts API names directly
STACKS=(express-api koa-api nuxt-api hono-api fastapi nest-api go-api spring-api yoga-api lambda-api rails-api)
STARTED_PORTS=()
FAILED_STACKS=()
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

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
    express-api)  echo 3001 ;;
    koa-api)      echo 5010 ;;
    nuxt-api)     echo 5040 ;;
    hono-api)     echo 5030 ;;
    fastapi)      echo 5160 ;;
    nest-api)     echo 5050 ;;
    go-api)       echo 5070 ;;
    spring-api)   echo 8080 ;;
    yoga-api)     echo 5080 ;;
    lambda-api)   echo 5090 ;;
    rails-api)    echo 5180 ;;
  esac
}

api_script() {
  case "$1" in
    express-api)  echo "dev:express-api" ;;
    koa-api)      echo "dev:koa-api" ;;
    nuxt-api)     echo "dev:nuxt-api" ;;
    hono-api)     echo "dev:hono-api" ;;
    fastapi)      echo "dev:fastapi" ;;
    nest-api)     echo "dev:nest-api" ;;
    go-api)       echo "dev:go-api" ;;
    spring-api)   echo "dev:spring-api" ;;
    yoga-api)     echo "dev:yoga-api" ;;
    lambda-api)   echo "dev:lambda-api" ;;
    rails-api)    echo "dev:rails-api" ;;
  esac
}

api_base_url() {
  case "$1" in
    nuxt-api)    echo "http://localhost:5040/api" ;;
    yoga-api)    echo "http://localhost:5080/api" ;;
    spring-api)  echo "http://localhost:8080/api" ;;
    *)           echo "http://localhost:$(api_port "$1")" ;;
  esac
}

port_in_use() { lsof -ti :"$1" >/dev/null 2>&1; }

api_timeout() {
  case "$1" in
    spring-api) echo 90 ;;  # Spring Boot + Gradle compile can take 60-90s cold start
    *)          echo 20 ;;
  esac
}

wait_for_port() {
  local port=$1 stack=$2 elapsed=0 timeout; timeout=$(api_timeout "$stack")
  printf "  Waiting for :%s" "$port"
  while ! port_in_use "$port"; do
    sleep 1; elapsed=$((elapsed + 1)); printf "."
    if [ "$elapsed" -ge "$timeout" ]; then
      echo " TIMEOUT after ${timeout}s"
      echo "  Last lines of /tmp/api-test-${stack}.log:"
      tail -10 "/tmp/api-test-${stack}.log" 2>/dev/null | sed 's/^/    /'
      return 1
    fi
  done
  echo " ready (${elapsed}s)"
}

ensure_nest_history_api() {
  if port_in_use 50051; then
    echo "[nest-history-api] gRPC service already running on :50051"
  else
    echo "[nest-history-api] Starting gRPC service on :50051..."
    npm run dev:nest-history-api &>"/tmp/api-test-nest-history-api.log" &
    STARTED_PORTS+=("50051")
    wait_for_port 50051 "nest-history-api"
    sleep 2
  fi
}

ensure_dynamodb_local() {
  load_env_file "$ROOT_DIR/lambda-api/.env"

  if ! docker compose ps dynamodb-local 2>/dev/null | grep -q "running"; then
    echo "[lambda-api] Starting DynamoDB Local..."
    docker compose up -d dynamodb-local
    sleep 3
  fi
  echo "[lambda-api] Running table migration..."
  DYNAMODB_ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:${DYNAMODB_PORT:-8000}}" \
  AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local}" \
  AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local}" \
  npm run migrate:lambda-api
}

ensure_api() {
  local stack=$1 port; port=$(api_port "$stack")
  if [ "$stack" = "lambda-api" ]; then
    ensure_dynamodb_local
  fi
  if [ "$stack" = "nest-api" ]; then
    ensure_nest_history_api
  fi
  if port_in_use "$port"; then
    echo "[$stack] API already running on :$port"
  else
    echo "[$stack] Starting API on :$port..."
    npm run "$(api_script "$stack")" &>"/tmp/api-test-${stack}.log" &
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

run_tests() {
  local stack=$1 url; url=$(api_base_url "$stack")
  echo ""; echo "=== $stack ==="
  API_URL="$url" STACK_NAME="$stack" npx jest --runInBand --config tests/jest.config.js --testPathPatterns=tests/api \
    || FAILED_STACKS+=("$stack")
}

if [ "$STACK" = "all" ]; then
  echo "Starting required APIs..."
  for s in "${STACKS[@]}"; do ensure_api "$s"; done
  for s in "${STACKS[@]}"; do run_tests "$s"; done
  echo ""
  if [ "${#FAILED_STACKS[@]}" -gt 0 ]; then
    echo "FAILED stacks: ${FAILED_STACKS[*]}"; exit 1
  fi
  echo "All stacks passed."
elif valid_stack "$STACK"; then
  ensure_api "$STACK"
  run_tests "$STACK"
  if [ "${#FAILED_STACKS[@]}" -gt 0 ]; then exit 1; fi
else
  echo "Unknown stack: '$STACK'. Valid: ${STACKS[*]}, all"; exit 1
fi
