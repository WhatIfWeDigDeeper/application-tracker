#!/usr/bin/env bash
set -euo pipefail

# Generate database schema documentation using tbls
# Requires: tbls (brew install tbls), running PostgreSQL

DB_URL="postgresql://postgres:postgres@localhost:5432/app_tracker?sslmode=disable"
DOC_DIR="docs/schema"

SCHEMAS=(
  "express_prisma:express-prisma"
  "react_koa:react-koa"
  "svelte_hono:svelte-hono"
  "vue_nuxt:vue-nuxt"
)

for entry in "${SCHEMAS[@]}"; do
  schema="${entry%%:*}"
  dir="${entry##*:}"
  echo "Generating docs for ${schema}..."
  tbls doc "${DB_URL}" "${DOC_DIR}/${dir}" \
    --include "${schema}.*" \
    --er-format mermaid \
    --force
done

# Post-process: swap column order in Mermaid ERDs from "type name" to "name type"
echo "Swapping column order in Mermaid diagrams..."
perl -i -0777 -pe '
  s/(```mermaid.*?```)/
    my $block = $1;
    $block =~ s{^(\s+)(\w\S*)\s+(\w\S*)(\s+FK)?$}{$1 . $3 . " " . $2 . ($4 || "")}mge;
    $block;
  /gse
' "${DOC_DIR}"/**/*.md

echo "Done. Schema docs written to ${DOC_DIR}/"
