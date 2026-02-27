# Job Application Tracker

A full-stack job application tracking system with multiple technology stack implementations.

- [Overview](#overview)
  - [Sample Editing screen](#sample-editing-screen)
- [Implementations](#implementations)
  - [1. Vue + Nuxt + Drizzle](#1-vue--nuxt--drizzle)
  - [2. Next.js + Express + Prisma](#2-nextjs--express--prisma)
  - [3. React + Koa + PostgreSQL](#3-react--koa--postgresql)
  - [4. Svelte + Hono + Drizzle](#4-svelte--hono--drizzle)
  - [5. React + TanStack + NestJS + Drizzle](#5-react--tanstack--nestjs--drizzle)
  - [6. React SSR + TanStack Start + FastAPI](#6-react-ssr--tanstack-start--fastapi)
  - [7. Angular + Go Gin + pgx/sqlc](#7-angular--go-gin--pgxsqlc)
- [Core Features](#core-features)
- [Database Architecture](#database-architecture)
- [Type Diagrams](#type-diagrams)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Applications](#running-applications)
  - [Schema Documentation](#schema-documentation)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [End-to-End Tests](#end-to-end-tests)
  - [Build Verification](#build-verification)
- [Development Tools](#development-tools)
- [License](#license)


## Overview

This repository contains a complete job application tracker built with multiple full-stack implementations. Each provides the same core functionality and user experience, allowing you to compare technology stacks side by side.

### Sample Editing screen

![Sample Edit Job Application with history](docs/imgs/vue-app-details.png)

## Implementations

### 1. Vue + Nuxt + Drizzle
**Directories**: `vue-ui/` + `nuxt-api/`
**Stack**:
- Frontend: Vue 3 + Pinia + TypeScript + Vite + Tailwind CSS
- Backend: Nuxt server routes
- Database: Drizzle ORM + PostgreSQL
- Event sourcing with Immer patches, undo/redo, history panel with diff view, patch-based restores, and checkpoint snapshots — see [sequence diagram](docs/vue-nuxt-history.mermaid)

### 2. Next.js + Express + Prisma
**Directories**: `ui/` + `api/`
**Stack**:
- Frontend: Next.js + React 19 + TypeScript + Tailwind CSS
- Backend: Express.js + Prisma ORM
- Database: PostgreSQL

### 3. React + Koa + PostgreSQL
**Directories**: `react-ui/` + `koa-api/`
**Stack**:
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: Koa.js + raw PostgreSQL (no ORM)
- Database: PostgreSQL with SQL migrations

### 4. Svelte + Hono + Drizzle
**Directories**: `svelte-ui/` + `hono-api/`
**Stack**:
- Frontend: Svelte 5 + SvelteKit + Tailwind CSS
- Backend: Hono (lightweight framework)
- Database: Drizzle ORM + PostgreSQL

### 5. React + TanStack + NestJS + Drizzle
**Directories**: `tanstack-ui/` + `nest-api/`
**Stack**:
- Frontend: React 19 + TanStack Query v5 + TanStack Router + TypeScript + Vite + Tailwind CSS
- Backend: NestJS with Fastify adapter
- Database: Drizzle ORM + PostgreSQL
- Snapshot-based history with field diffs and restore

### 6. React SSR + TanStack Start + FastAPI
**Directories**: `tanstack-start-ui/` + `fastapi/`
**Stack**:
- Frontend: React 19 + TanStack Start (SSR) + TanStack Query v5 + TanStack Router + Tailwind CSS
- Backend: Python 3.14 + FastAPI + Pydantic v2
- Database: asyncpg (raw SQL, no ORM) via `python_fastapi` schema
- Server-side rendering with route loaders and `createServerFn` server functions
- Snapshot-based history with field diffs and restore

### 7. Angular + Go Gin + pgx/sqlc
**Directories**: `angular-ui/` + `go-api/`
**Stack**:
- Frontend: Angular 19 + standalone components + Angular Signals + Tailwind CSS 4.x — port 3060
- Backend: Go 1.23 + Gin framework + pgx v5 + sqlc for type-safe SQL — port 5070
- Database: PostgreSQL via `go_gin` schema (raw SQL, no ORM)
- Angular Signals for reactive state, CanDeactivate guard for unsaved changes
- Snapshot-based history with field diffs and restore
- testcontainers-go integration tests

## Core Features

All implementations provide:
- Full CRUD operations for job applications
- Interview stage tracking
- Filtering by status, category, source, skills rating
- Sorting and pagination
- Archive/restore functionality
- Dark mode support
- Responsive design (desktop + mobile)
- Input validation and error handling

## Database Architecture

All implementations share a single PostgreSQL database (`app_tracker`) with separate schemas for isolation:

| Schema | Apps | ERD |
|--------|------|-----|
| `vue_nuxt` | Vue + Nuxt + Drizzle | [schema docs](docs/schema/vue-nuxt/README.md) |
| `express_prisma` | Next.js + Express + Prisma | [schema docs](docs/schema/express-prisma/README.md) |
| `react_koa` | React + Koa + PostgreSQL | [schema docs](docs/schema/react-koa/README.md) |
| `svelte_hono` | Svelte + Hono + Drizzle | [schema docs](docs/schema/svelte-hono/README.md) |
| `react_nestjs` | React + TanStack + NestJS + Drizzle | [schema docs](docs/schema/react-nestjs/README.md) |
| `python_fastapi` | React SSR + TanStack Start + FastAPI | [schema docs](docs/schema/python-fastapi/README.md) |
| `go_gin` | Angular + Go Gin API | [schema docs](docs/schema/go-gin/README.md) |

See [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) for ORM setup and connection string patterns.

## Type Diagrams

Mermaid class diagrams generated from TypeScript type definitions:
- [nuxt-api](docs/types/nuxt-api/types.mermaid) - Vue + Nuxt (includes event sourcing types)
- [ui](docs/types/ui/application.mermaid) - Next.js + Express
- [react-ui](docs/types/react-ui/application.mermaid) - React + Koa
- [koa-api](docs/types/koa-api/index.mermaid) - Koa API (partial - Zod-inferred types unresolved)
- [svelte-ui](docs/types/svelte-ui/index.mermaid) - Svelte + Hono
- [tanstack-ui](docs/types/tanstack-ui/application.mermaid) - React + TanStack + NestJS
- [nest-api](docs/types/nest-api/api.mermaid) - NestJS API
- [tanstack-start-ui](docs/types/tanstack-start-ui/application.mermaid) - React SSR + TanStack Start
- [angular-ui](docs/types/angular-ui/application.model.mermaid) - Angular + Go Gin

Regenerate with `npm run docs:types`.

## Repository Structure

```
/
├── ui/                           # Next.js + React UI
├── api/                          # Express + Prisma API
├── react-ui/                     # React + Vite UI
├── koa-api/                      # Koa + PostgreSQL API
├── svelte-ui/                    # SvelteKit UI
├── hono-api/                     # Hono API
├── vue-ui/                       # Vue + Vite UI
├── tanstack-ui/                  # React + TanStack Query/Router UI
├── tanstack-start-ui/            # React SSR + TanStack Start UI
├── angular-ui/                   # Angular 19 UI
├── nest-api/                     # NestJS + Fastify API
├── nuxt-api/                     # Nuxt server API
├── fastapi/                      # Python FastAPI API
├── go-api/                       # Go Gin API
├── specs/                        # Feature specifications
├── docs/                         # Documentation
├── .claude/                      # Claude Code skills and commands
├── CLAUDE.md                     # Repository instructions for Claude Code
└── docker-compose.yml            # Docker + PostgreSQL setup
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python 3.12+ and [uv](https://docs.astral.sh/uv/) (for the FastAPI implementation)
- Go 1.23+ (for the Go Gin API implementation)
- Docker and Docker Compose (for PostgreSQL)
- [tbls](https://github.com/k1LoW/tbls) (optional, for regenerating schema docs): `brew install tbls`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/WhatIfWeDigDeeper/application-tracker.git
   cd application-tracker
   ```

2. Install dependencies for all implementations:
   ```bash
   npm run ci:all
   ```

3. Start PostgreSQL:
   ```bash
   docker-compose up -d postgres
   ```

4. Run database migrations for each implementation you intend to use:
   ```bash
   npm run migrate:express        # Express + Prisma
   npm run migrate:koa-api        # Koa (raw SQL)
   npm run migrate:hono-api       # Hono + Drizzle
   npm run migrate:nuxt-api       # Nuxt + Drizzle
   npm run migrate:nest-api       # NestJS + Drizzle
   npm run migrate:fastapi        # FastAPI (asyncpg)
   npm run migrate:go             # Go Gin API (raw SQL)

   # or all at once:
   npm run migrate:all
   ```

### Running Applications

Each implementation can be run independently:

```bash
# Next.js + Express (UI 3000 + API 3001)
npm run dev:react-next
npm run dev:express-api

# React + Koa (UI 3010 + API 5010)
npm run dev:react-ui
npm run dev:koa-api

# Vue + Nuxt (UI 3020 + API 5040)
npm run dev:vue-ui
npm run dev:nuxt-api

# Svelte + Hono (UI 3030 + API 5030)
npm run dev:svelte-ui
npm run dev:hono-api

# React + TanStack + NestJS (UI 3050 + API 5050)
npm run dev:tanstack-ui
npm run dev:nest-api

# React SSR + TanStack Start + FastAPI (UI 3040 + API 5160)
npm run dev:tanstack-start-ui
npm run dev:fastapi

# Angular + Go Gin (UI 3060 + API 5070)
npm run dev:go-api
npm run dev:angular-ui
```

### Schema Documentation

Regenerate database ERD docs after schema changes (requires [tbls](https://github.com/k1LoW/tbls) and a running PostgreSQL instance):

```bash
npm run docs:schema
```

This generates Mermaid ERDs and per-table documentation under `docs/schema/` for each implementation schema.

## Testing

### Unit Tests

Run tests for individual implementations:

```bash
npm run test:express-api  # Express + Prisma API tests
npm run test:react-next   # Next.js UI tests
npm run test:koa-api      # Koa API tests
npm run test:react-ui     # React UI tests
npm run test:svelte-ui    # Svelte UI tests
npm run test:vue-ui       # Vue UI tests
npm run test:nest-api     # NestJS API tests
npm run test:tanstack-ui  # TanStack UI tests
npm run test:tanstack-start-ui  # TanStack Start UI tests
npm run test:fastapi      # FastAPI pytest unit tests
npm run test:go-api       # Go Gin API integration tests (testcontainers-go)
npm run test:angular-ui   # Angular UI tests (Jest + @testing-library/angular)
```

Run all unit tests:

```bash
npm run test:all          # Run all implementation tests
```

### End-to-End Tests

E2E tests use Playwright and run against each implementation:

```bash
npm run test:e2e:express  # Next.js + Express (port 3000)
npm run test:e2e:vue      # Vue + Vite (port 3020)
npm run test:e2e:svelte   # Svelte + Hono (port 3030)
npm run test:e2e:react-koa # React + Koa (port 3010)
npm run test:e2e:tanstack  # React + TanStack + NestJS (port 3050)
npm run test:e2e:tanstack-start  # React SSR + TanStack Start + FastAPI (port 3040)
npm run test:e2e:angular  # Angular + Go Gin (port 3060)
npm run test:e2e:all      # Run all e2e tests
```

To clean up leftover test data from interrupted runs, see [Test Data Cleanup](docs/TESTING_REFERENCE.md#test-data-cleanup).

### Build Verification

Build all implementations:

```bash
npm run build:all         # Build all implementations
```

## Development Tools

This repository includes Claude Code commands and skills for common development tasks:

- `/commit` - Generate commit messages
- `/pr` - Create pull requests
- `/fix-build` - Fix build errors

Skills installed from [WhatIfWeDigDeeper/agent-skills](https://github.com/WhatIfWeDigDeeper/agent-skills?tab=readme-ov-file#installation):

| Skill | Description |
|-------|-------------|
| `learn` | Extract lessons from conversations |
| `js-deps` | Update npm dependencies and/or fix audit errors |
| `uv-deps` | Audit and update Python dependencies |
| `ship-it` | Branch, commit, push, and open a PR |

Since `npx skills check` and `npx skills update` apparently do not work with the above repo at this time, you may force update all skills:

```bash
npx skills add -y whatifwedigdeeper/agent-skills
```

See [.claude/](.claude/) for all available commands and skills.

### Notifications (Optional)

Claude Code hooks in `.claude/settings.json` send macOS notifications when Claude needs input (permission prompts, questions, idle). This requires [terminal-notifier](https://github.com/julienXX/terminal-notifier):

```bash
brew install terminal-notifier
```

No configuration needed — the hooks are already in `.claude/settings.json`. If you don't install it, hooks fail silently with no impact.

## License

MIT
