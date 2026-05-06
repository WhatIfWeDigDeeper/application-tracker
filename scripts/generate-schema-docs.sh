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
  # Source .env to resolve variable references (e.g. ${POSTGRES_USER})
  set -a
  source .env
  set +a
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "Error: DATABASE_URL is not defined in .env." >&2
    echo "Add a DATABASE_URL to your .env file. See .env.example for reference." >&2
    exit 1
  fi
fi

# Strip query params, replace docker hostname with localhost, ensure sslmode=disable
BASE_URL="${DATABASE_URL%%\?*}"
BASE_URL="${BASE_URL//@postgres:/@localhost:}"
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
  "react_nestjs:react-nestjs"
  "react_nestjs_history:react-nestjs-history"
  "python_fastapi:python-fastapi"
  "go_gin:go-gin"
  "java_spring:java-spring"
  "graphql_yoga:graphql-yoga"
  "ruby_rails:ruby-rails"
)

for entry in "${SCHEMAS[@]}"; do
  schema="${entry%%:*}"
  dir="${entry##*:}"
  echo "Generating docs for ${schema}..."
  # Clear before tbls writes — otherwise stale .md files (tables dropped from
  # the DB, prior schema renames) survive forever and the Mermaid column-swap
  # toggles their content on every run.
  rm -rf -- "${DOC_DIR:?}/${dir:?}"
  tbls doc "${DB_URL}" "${DOC_DIR}/${dir}" \
    --include "${schema}.*" \
    --er-format mermaid \
    --force
done

# Post-process: swap column order in Mermaid ERDs from "type name" to "name type".
# Scoped to per-schema dirs that tbls regenerates this run — applying the swap to
# .md files outside SCHEMAS (e.g. lambda-api's hand-written DynamoDB docs) would
# corrupt them. The swap regex unconditionally flips column positions, so the
# script must be invoked at most once per `tbls doc` regeneration.
echo "Swapping column order in Mermaid diagrams..."
for entry in "${SCHEMAS[@]}"; do
  dir="${entry##*:}"
  perl -i -0777 -pe '
    s/(```mermaid.*?```)/
      my $block = $1;
      $block =~ s{^(\s+)(\w\S*)\s+(\w\S*)(\s+FK)?$}{$1 . $3 . " " . $2 . ($4 || "")}mge;
      $block;
    /gse
  ' "${DOC_DIR}/${dir}"/*.md
done

# Post-process: strip foreign-schema content that tbls leaks past --include.
# tbls's --include filters tables but not pg_type enums; it also treats the dot
# in "<schema>.*" as a regex (matching any char), so schemas whose names share a
# prefix (react_nestjs vs react_nestjs_history) bleed tables/entities into each
# other's docs. We post-process per-schema READMEs, schema.json files, and
# delete leaked per-table .md files.
echo "Filtering foreign-schema content from per-stack docs..."
for entry in "${SCHEMAS[@]}"; do
  schema="${entry%%:*}"
  dir="${entry##*:}"
  readme="${DOC_DIR}/${dir}/README.md"
  schema_json="${DOC_DIR}/${dir}/schema.json"

  # Collect every other schema's name; used to delete leaked per-table .md files.
  others=()
  for other_entry in "${SCHEMAS[@]}"; do
    other="${other_entry%%:*}"
    [[ "$other" != "$schema" ]] && others+=("$other")
  done

  if [[ -f "$readme" ]]; then
    OWN_SCHEMA="$schema" perl -i -0777 -pe '
      my $own = $ENV{OWN_SCHEMA};
      # Drop markdown table rows whose first cell starts with a foreign schema.
      # Matches both Enums rows ("| schema.Foo |") and Tables rows ("| [schema.foo](link) |").
      s/^(\| \[?(\w+)\.[^\n]*\n)/$2 eq $own ? $1 : ""/gme;
      # Drop Mermaid entity blocks "<schema>.<entity>" { ... } whose schema is foreign.
      s/^("(\w+)\.[^"]+" \{[^}]*\}\n)/$2 eq $own ? $1 : ""/gmse;
      # Drop Mermaid relation lines where either side references a foreign schema.
      s/^("(\w+)\.[^"]+" \}[^"\n]*"(\w+)\.[^"]+"[^\n]*\n)/($2 eq $own && $3 eq $own) ? $1 : ""/gme;
      # Drop ## Enums section if no own-schema rows remain (header + empty table only).
      s/^## Enums\n\n\| Name \| Values \|\n\| ---- \| ------- \|\n\n+(?=## |\z)//gm;
    ' "$readme"
  fi

  if [[ -f "$schema_json" ]] && command -v jq &>/dev/null; then
    tmp_json="$(mktemp)"
    jq --arg own "${schema}." '.tables = (.tables | map(select(.name | startswith($own))))' \
      "$schema_json" > "$tmp_json" && mv "$tmp_json" "$schema_json"
  fi

  for other in "${others[@]}"; do
    # Bash 3 lacks nullglob; rm -f silently no-ops when the glob has no matches.
    rm -f "${DOC_DIR}/${dir}/${other}."*.md
  done
done

echo "Done. Schema docs written to ${DOC_DIR}/"
