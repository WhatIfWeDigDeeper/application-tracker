#!/usr/bin/env bash
set -euo pipefail

# Generate database schema documentation using tbls
# Requires: tbls, running PostgreSQL, valid DATABASE_URL

# Check tbls is installed
if ! command -v tbls &>/dev/null; then
  echo "Error: tbls is not installed." >&2
  echo "Install it with: brew install tbls" >&2
  echo "See: https://github.com/k1LoW/tbls" >&2
  exit 1
fi

# Load DATABASE_URL from .env if not already set
if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ ! -f .env ]]; then
    echo "Error: DATABASE_URL is not set and .env file not found." >&2
    echo "Copy .env.example to .env and configure DATABASE_URL." >&2
    exit 1
  fi
  DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | cut -d'=' -f2-)
  if [[ -z "${DATABASE_URL}" ]] || [[ "${DATABASE_URL}" == *'${'* ]]; then
    echo "Error: DATABASE_URL is missing or contains unresolved variables in .env." >&2
    echo "Set a valid DATABASE_URL in .env. See .env.example for reference." >&2
    exit 1
  fi
fi

# Strip any ?schema= or &schema= params and ensure sslmode=disable
BASE_URL="${DATABASE_URL%%\?*}"
DB_URL="${BASE_URL}?sslmode=disable"
DOC_DIR="docs/schema"

# Verify database is reachable
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TBLS_TMP="${SCRIPT_DIR}/.tmp"
if ! tbls doc "${DB_URL}" "${TBLS_TMP}" --include "NONE" --force &>/dev/null 2>&1; then
  echo "Error: Cannot connect to the database." >&2
  echo "Make sure PostgreSQL is running: docker compose up -d postgres" >&2
  echo "See: https://github.com/WhatIfWeDigDeeper/application-tracker/blob/main/README.md#getting-started" >&2
  exit 1
fi
rm -rf "${TBLS_TMP}"

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
