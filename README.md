# Job Application Tracker

A full-stack job application tracking system with multiple technology stack implementations.

## Overview

This repository contains a complete job application tracker built with four different full-stack implementations. Each provides the same core functionality and user experience, allowing you to compare technology stacks side by side.

## Implementations

### 1. Next.js + Express + Prisma
**Directories**: `ui/` + `api/`
**Stack**:
- Frontend: Next.js + React 19 + TypeScript + Tailwind CSS
- Backend: Express.js + Prisma ORM
- Database: PostgreSQL

### 2. React + Koa + PostgreSQL
**Directories**: `react-ui/` + `koa-api/`
**Stack**:
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: Koa.js + raw PostgreSQL (no ORM)
- Database: PostgreSQL with SQL migrations

### 3. Svelte + Hono + Drizzle
**Directories**: `svelte-ui/` + `hono-api/`
**Stack**:
- Frontend: Svelte 5 + SvelteKit + Tailwind CSS
- Backend: Hono (lightweight framework)
- Database: Drizzle ORM + PostgreSQL

### 4. Vue + Nuxt + Drizzle
**Directories**: `vue-ui/` + `nuxt-api/`
**Stack**:
- Frontend: Vue 3 + Pinia + TypeScript + Vite + Tailwind CSS
- Backend: Nuxt server routes
- Database: Drizzle ORM + PostgreSQL
- Event sourcing with Immer patches, undo/redo (Ctrl+Z / Ctrl+Shift+Z), history panel with diff view, and snapshot-based restore

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
- `express_prisma` - Next.js + Express + Prisma
- `react_koa` - React + Koa + PostgreSQL
- `svelte_hono` - Svelte + Hono + Drizzle
- `vue_nuxt` - Vue + Nuxt + Drizzle

See [CLAUDE.md](CLAUDE.md) for detailed database architecture documentation.

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

## Development Tools

This repository includes Claude Code skills for common development tasks:
- `/commit` - Generate commit messages
- `/pr` - Create pull requests
- `/fix-build` - Fix build errors
- `/update-deps` - Update dependencies

See [.claude/](.claude/) for all available commands and skills.

## License

MIT
