# Spec 029 — Codebase Knowledge Graphs

**Status:** Complete (20 of 21 stacks; `angular-spring-ui` deferred to a follow-up)
**Branch:** feat/understand-codebase-graphs

## Goal

Produce a navigable knowledge graph for each implementation stack analyzed in this iteration, using the `understand-anything` plugin. Each analyzed stack gets its own `.understand-anything/knowledge-graph.json` (per-directory working unit). `angular-spring-ui` is intentionally deferred to a follow-up — see the Stacks table below.

## Strategy

- **Per-directory graphs** are the primary working unit — each stack directory is self-contained and viewable independently via the dashboard.
- **No paired or unified merges** — the PoC showed merged graphs are too overwhelming to navigate and don't clearly identify API vs UI stacks in the dashboard.

## Stacks

| Stack directory | Type | Status |
|---|---|---|
| `lambda-api` | API (DynamoDB/Hono/Lambda) | ✅ Done |
| `lambda-react-ui` | UI (React 19/Vite/Zustand) | ✅ Done |
| `api` | API (Express/Prisma/PostgreSQL) | ✅ Done |
| `koa-api` | API (Koa/PostgreSQL) | ✅ Done |
| `react-ui` | UI (React/Vite) | ✅ Done |
| `vue-ui` | UI (Vue 3) | ✅ Done |
| `nuxt-api` | Full-stack (Nuxt/Drizzle) | ✅ Done |
| `hono-api` | API (Hono/Drizzle) | ✅ Done |
| `svelte-ui` | UI (SvelteKit) | ✅ Done |
| `nest-api` | API (NestJS/Drizzle) | ✅ Done |
| `tanstack-ui` | UI (TanStack Router/Query) | ✅ Done |
| `tanstack-start-ui` | UI (TanStack Start SSR) | ✅ Done |
| `fastapi` | API (Python/FastAPI/asyncpg) | ✅ Done |
| `angular-ui` | UI (Angular 21) | ✅ Done |
| `angular-spring-ui` | UI (Angular 21/Spring Boot) | ⬜ Not analyzed |
| `go-api` | API (Go/Gin/sqlc) | ✅ Done |
| `spring-api` | API (Java/Spring Boot/Flyway) | ✅ Done |
| `yoga-api` | API (GraphQL Yoga/Prisma) | ✅ Done |
| `react-apollo-ui` | UI (React/Apollo Client) | ✅ Done |
| `nest-history-api` | API (NestJS gRPC microservice) | ✅ Done |
| `rails-api` | API (Ruby on Rails) | ✅ Done |
| Monorepo root (unified merge) | All 20 stacks merged | ❌ Removed — too overwhelming, dashboard doesn't distinguish API vs UI |

## Deliverables

1. `.understand-anything/knowledge-graph.json` in each stack directory listed above.
2. A `## Codebase Knowledge Graphs` section in the root `README.md` explaining what the graphs are, how to view them (dashboard command), and listing all stacks.

## Dashboard Usage

To view any stack's graph:

```bash
cd <plugin-root>/packages/dashboard
GRAPH_DIR=/path/to/application-tracker/<stack-dir> npx vite --host 127.0.0.1
```

The Vite server prints a tokenized URL — use the full URL including `?token=<TOKEN>`.

## Notes

- Plugin root: `~/.claude/plugins/cache/understand-anything/understand-anything/<version>`
- `python` → use `python3` on this system
- Dashboard requires `dangerouslyDisableSandbox: true` to kill with `kill <pid>`
- After each stack, update the Status column in this spec to ✅ Done
