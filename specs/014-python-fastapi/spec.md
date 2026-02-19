# 014 - Python FastAPI API

- **Created**: 2026-02-18
- **Status**: Complete

## Overview

Add a 6th backend implementation to the monorepo: Python FastAPI API (`fastapi/`). Matches the full API contract of existing TypeScript backends. Uses functional programming style throughout — no classes except Pydantic data models.

## Technology Stack

### Backend (`fastapi/` — port 5160, 5060 is reserved by macOS SIP)
- Python 3.12+
- FastAPI (async web framework)
- asyncpg (raw SQL, no ORM — functional style)
- Pydantic v2 (validation and serialization)
- uv (package management and tooling)
- DB schema: `python_fastapi`

### Dev Tooling
- ruff (linting and formatting)
- mypy (type checking)
- pytest + pytest-asyncio (Python-side tests, future)

## Features (matching all existing implementations)

1. **Application CRUD** — Create, read, update, delete job applications
2. **Interview Stages** — Individual CRUD for interview stages per application
3. **Filtering & Sorting** — Status, company category, job source, skills match, archived
4. **Pagination** — Server-side with configurable page size (default 20, max 100)
5. **Archive/Restore** — Dedicated endpoints (not via PATCH)
6. **History Panel** — Snapshot-based history with field diffs and restore-to-version

## API Contract

12 endpoints under `/applications`, matching the existing API exactly:
- CRUD: GET (list), GET (single), POST, PATCH, DELETE
- Archive: POST `/:id/archive`, POST `/:id/restore`
- History: GET `/:id/history`, POST `/:id/history/restore`
- Interview Stages: POST, PATCH, DELETE under `/:id/interview-stages`

Response format: camelCase JSON, matching existing backends.

## Key Design Decisions

- **asyncpg over SQLAlchemy** — raw SQL is more functional, avoids ORM class hierarchy
- **Raw SQL migrations** — Alembic requires SQLAlchemy; simple migration runner suffices
- **Functional service layer** — all service functions take `asyncpg.Pool` as first argument
- **Pydantic v2 aliases** — `alias_generator=to_camel` for automatic snake_case → camelCase

## Success Criteria

- [ ] All 12 API endpoints return correct responses matching existing backends
- [ ] Black-box API tests pass (`test:api:fastapi`)
- [ ] Python linting passes (`ruff check`)
- [ ] Python type checking passes (`mypy`)
- [ ] History snapshots and diffs work correctly
- [ ] Status/dateApplied constraint enforced (unsubmitted → dateApplied=null)
