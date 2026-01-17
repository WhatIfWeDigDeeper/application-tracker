# Implementation Plan: Express API with Prisma (Postgres) and UI Reorganization

**Branch**: `003-express-api-prisma` | **Date**: 2026-01-17 | **Spec**: specs/003-express-api-prisma/spec.md
**Input**: Feature specification from `specs/003-express-api-prisma/spec.md`

## Summary

Add a dedicated Express API (TypeScript) using Prisma with Postgres and reorganize the existing Next.js app under `ui/`. Provide Docker Compose for local development, API contracts, and a clear quickstart. The UI should continue functioning while gradually shifting persistence from localStorage to API-backed storage.

## Technical Context

**Language/Version**: TypeScript (Node 18+), Next.js (UI)
**Primary Dependencies**: Express, Prisma, @prisma/client, pg, zod, dotenv, ts-node-dev
**Storage**: Postgres (Docker) via Prisma ORM
**Testing**: Jest + Supertest (API), existing Jest/Playwright (UI)
**Target Platform**: Local Docker (macOS), containers for `api`, `ui`, `postgres`
**Project Type**: Web application with separated `api/` and `ui/` services
**Performance Goals**: API p95 ≤ 200ms reads; writes ≤ 500ms (per Constitution)
**Constraints**: TypeScript strict; ESLint/Prettier clean; RESTful design; contracts documented; Docker-based dev
**Scale/Scope**: Local dev initially; sized for small dataset (<10k applications)

Unknowns (NEEDS CLARIFICATION):
- Authentication/authorization requirements (none specified) → NEEDS CLARIFICATION
- Pagination and filtering requirements for `/applications` → NEEDS CLARIFICATION
- Error format standard (proposal: RFC7807-style) → NEEDS CLARIFICATION
- Migration/seed data lifecycle in CI vs local → NEEDS CLARIFICATION

## Constitution Check

Quality gates to satisfy:
- Build Gate: API compiles; UI continues to compile
- Lint Gate: Zero lint warnings/errors for both services
- Test Gate: API unit/integration tests for CRUD; UI tests unaffected
- Type Gate: TS strict mode enabled for API/UI
- Performance Gate: Endpoint p95 targets as above
- Accessibility Gate: N/A for backend; unchanged for UI

Initial evaluation: PASSABLE with planned tests and strict TS; performance validated post-implementation. No gate violations planned.

## Project Structure

### Documentation (this feature)

```text
specs/003-express-api-prisma/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── spec.md
```

### Source Code (repository root)

```text
api/
├── src/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── db/
│   ├── types/
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example

ui/
├── src/
├── public/
├── package.json
├── tsconfig.json
├── next.config.mjs
├── Dockerfile
└── .env.example

docker-compose.yml
```

**Structure Decision**: Separate `api/` (Express + Prisma) and `ui/` (Next.js). Orchestrate with Docker Compose and share types conceptually via documented contracts.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Separate API service | Enables persistent DB connections, Prisma migrations, independent scaling | Next.js API routes complicate pooling/background jobs and tie scale to UI

