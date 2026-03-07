#!/usr/bin/env bash
# Remove orphaned postgres:18-alpine containers (and their anonymous volumes)
# left behind by Testcontainers runs with TESTCONTAINERS_RYUK_DISABLED=true.
# The named app_tracker_postgres container (managed by docker-compose) is preserved.

set -euo pipefail

KEEP="app_tracker_postgres"

orphans=$(docker ps -a --filter "ancestor=postgres:18-alpine" --format "{{.Names}}" \
  | grep -v "^${KEEP}$" || true)

if [ -z "$orphans" ]; then
  echo "No orphaned postgres containers found."
else
  echo "Removing orphaned containers:"
  echo "$orphans"
  echo "$orphans" | xargs docker rm -f
  echo "Done removing containers."
fi

echo ""
echo "Pruning anonymous volumes..."
docker volume prune -f
echo "Docker cleanup complete."
