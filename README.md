# Job Application Tracker

A full-stack job application tracking system with multiple technology stack implementations.

## Overview

This repository contains a complete job application tracker with multiple full-stack implementations, allowing you to choose your preferred technology stack while maintaining the same core functionality and user experience.

## Implementations

### Root Implementation (Express + Prisma + Next.js)
**Location**: Root directory (`/api` and `/ui`)
**Stack**: Express.js + Prisma ORM + PostgreSQL + Next.js + React 18

See [API Documentation](api/README.md) and [UI Documentation](ui/README.md) for details.

### Alternative Implementations

Each implementation provides the same core features with different technology stacks:

#### 1. React + Koa + PostgreSQL
**Location**: [`implementations/react-koa-pg/`](implementations/react-koa-pg/)
**Stack**:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Koa.js + raw PostgreSQL (no ORM)
- Database: PostgreSQL with SQL migrations

[View README](implementations/react-koa-pg/README.md)

#### 2. Svelte + Hono + Drizzle
**Location**: [`implementations/svelte-hono-drizzle/`](implementations/svelte-hono-drizzle/)
**Stack**:
- Frontend: Svelte 5 + SvelteKit + Tailwind CSS
- Backend: Hono (lightweight framework)
- Database: Drizzle ORM + PostgreSQL

[View README](implementations/svelte-hono-drizzle/README.md)

#### 3. Vue + Parse Server
**Location**: [`implementations/vue-parse-server/`](implementations/vue-parse-server/)
**Stack**:
- Frontend: Vue 3 + TypeScript + Tailwind CSS
- Backend: Parse Server
- Database: MongoDB

[View README](implementations/vue-parse-server/README.md)

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

All PostgreSQL implementations share a single database (`app_tracker`) with separate schemas:
- `express_prisma` - Root Express + Prisma implementation
- `react_koa` - React + Koa + PostgreSQL implementation
- `svelte_hono` - Svelte + Hono + Drizzle implementation

The Vue + Parse Server implementation uses MongoDB.

See [CLAUDE.md](CLAUDE.md) for detailed database architecture documentation.

## Quick Start

### Root Implementation (Express + Prisma)
```bash
# Install dependencies
npm run ci:all

# Set up database
npm run prisma:migrate:dev
npm run seed

# Start API and UI
npm run dev
```

### Alternative Implementations
Each implementation has its own setup instructions in its respective README file.

## Repository Structure

```
/
├── api/                          # Express + Prisma API
├── ui/                           # Next.js + React UI
├── implementations/              # Alternative implementations
│   ├── react-koa-pg/
│   ├── svelte-hono-drizzle/
│   └── vue-parse-server/
├── .claude/                      # Claude Code skills and commands
├── CLAUDE.md                     # Repository instructions for Claude Code
└── docker-compose.yml            # Docker setup for root implementation
```

## Development Tools

This repository includes Claude Code skills for common development tasks:
- `/commit` - Generate commit messages
- `/pr` - Create pull requests
- `fix-build` - Fix build errors
- `update-deps` - Update dependencies

See [.claude/](.claude/) for all available commands and skills.

## License

MIT
