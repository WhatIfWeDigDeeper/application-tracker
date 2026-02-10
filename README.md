# Job Application Tracker

A full-stack job application tracking system with multiple technology stack implementations.

- [Overview](#overview)
- [Implementations](#implementations)
  - [1. Vue + Nuxt + Drizzle](#1-vue--nuxt--drizzle)
  - [2. Next.js + Express + Prisma](#2-nextjs--express--prisma)
  - [3. React + Koa + PostgreSQL](#3-react--koa--postgresql)
  - [4. Svelte + Hono + Drizzle](#4-svelte--hono--drizzle)
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

This repository contains a complete job application tracker built with four different full-stack implementations. Each provides the same core functionality and user experience, allowing you to compare technology stacks side by side.

## Implementations

### 1. Vue + Nuxt + Drizzle
**Directories**: `vue-ui/` + `nuxt-api/`
**Stack**:
- Frontend: Vue 3 + Pinia + TypeScript + Vite + Tailwind CSS
- Backend: Nuxt server routes
- Database: Drizzle ORM + PostgreSQL
- Event sourcing with Immer patches, undo/redo (Ctrl+Z / Ctrl+Shift+Z), history panel with diff view, and snapshot-based restore

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

See [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) for ORM setup and connection string patterns.

## Type Diagrams

Mermaid class diagrams generated from TypeScript type definitions:
- [nuxt-api](docs/types/nuxt-api/types.mermaid) - Vue + Nuxt (includes event sourcing types)
- [ui](docs/types/ui/application.mermaid) - Next.js + Express
- [react-ui](docs/types/react-ui/application.mermaid) - React + Koa
- [koa-api](docs/types/koa-api/index.mermaid) - Koa API (partial - Zod-inferred types unresolved)
- [svelte-ui](docs/types/svelte-ui/index.mermaid) - Svelte + Hono

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
├── nuxt-api/                     # Nuxt server API
├── specs/                        # Feature specifications
├── docs/                         # Documentation
├── .claude/                      # Claude Code skills and commands
├── CLAUDE.md                     # Repository instructions for Claude Code
└── docker-compose.yml            # Docker + PostgreSQL setup
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose (for PostgreSQL)
- [tbls](https://github.com/k1LoW/tbls) (optional, for regenerating schema docs): `brew install tbls`

### Installation

1. Clone the repository
2. Install dependencies for all implementations:
   ```bash
   npm run ci:all
   ```

3. Start PostgreSQL:
   ```bash
   docker-compose up -d postgres
   ```

4. Run database migrations:
   ```bash
   npm run prisma:migrate:dev
   ```

### Running Applications

Each implementation can be run independently:

```bash
# Next.js + Express (UI 3000 + API 3001)
npm run dev

# React + Koa (UI 3010 + API 5010)
cd react-ui && npm run dev
cd koa-api && npm run dev

# Vue + Nuxt (UI 3020 + API 5040)
cd vue-ui && npm run dev
cd nuxt-api && npm run dev

# Svelte + Hono (UI 3030 + API 5030)
cd svelte-ui && npm run dev
cd hono-api && npm run dev
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
npm run test:api          # Express + Prisma API tests
npm run test:ui           # Next.js UI tests
npm run test:koa-api      # Koa API tests
npm run test:react-ui     # React UI tests
npm run test:svelte-ui    # Svelte UI tests
npm run test:vue-ui       # Vue UI tests
```

Run all unit tests:

```bash
npm run test              # Run api + ui tests only
npm run test:all          # Run all implementation tests
```

### End-to-End Tests

E2E tests use Playwright and run against each implementation:

```bash
npm run test:e2e          # Next.js + Express (port 3000)
npm run test:e2e:vue      # Vue + Vite (port 3020)
npm run test:e2e:svelte   # Svelte + Hono (port 3030)
npm run test:e2e:react-koa # React + Koa (port 3010)
npm run test:e2e:all      # Run all e2e tests
```

### Build Verification

Build all implementations:

```bash
npm run build             # Build api + ui
npm run build:all         # Build all implementations
```

## Development Tools

This repository includes Claude Code commands and skills for common development tasks:

- `/commit` - Generate commit messages
- `/pr` - Create pull requests
- `/fix-build` - Fix build errors

Skills installed from [WhatIfWeDigDeeper/agent-skills](https://github.com/WhatIfWeDigDeeper/agent-skills?tab=readme-ov-file#installation) with

```bash
# Extract lessons from conversations and persist to context files or skills
npx skills add whatifwedigdeeper/agent-skills \
--skill learn

# Update dependencies and/or fix audit errors
npx skills add whatifwedigdeeper/agent-skills \
--skill package-json-maintenance

# You may use this command to check for any updates
npx skills check
```

See [.claude/](.claude/) for all available commands and skills.

## License

MIT
