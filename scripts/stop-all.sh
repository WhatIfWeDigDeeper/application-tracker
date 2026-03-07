#!/usr/bin/env bash
# Stop all dev servers by killing processes on known ports

PORTS=(
  3000  # Next.js UI
  3001  # Express API
  3010  # React-Koa UI
  3020  # Vue UI
  3030  # Svelte UI
  3040  # TanStack Start UI
  3050  # TanStack UI
  3060  # Angular UI
  3070  # Angular Spring UI
  5010  # Koa API
  5030  # Hono API
  5040  # Nuxt API
  5050  # Nest API
  5070  # Go API
  5160  # FastAPI
  8080  # Spring Boot API
)


stopped=0
for port in "${PORTS[@]}"; do
  pids=$(lsof -ti :"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Stopping port $port (PIDs: $(echo $pids | tr '\n' ' '))"
    echo "$pids" | xargs kill 2>/dev/null
    stopped=$((stopped + 1))
  fi
done

if [ "$stopped" -eq 0 ]; then
  echo "No dev servers running."
else
  echo "Stopped processes on $stopped port(s)."
fi
