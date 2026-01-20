# Research: API with Prisma (Postgres) and UI Reorganization

## Decisions

- Decision: Use Prisma ORM with Postgres
  - Rationale: Strong DX, migrations, type-safe client; aligns with relational model
  - Alternatives considered: Drizzle ORM (lighter, good types), Knex (query builder), TypeORM (heavier)

- Decision: Separate `api/` Express service (not Next.js API routes)
  - Rationale: Persistent DB connections, background tasks, independent scaling, clean Docker orchestration
  - Alternatives considered: Next.js API routes (couples scale with UI), serverless functions (connection limits)

- Decision: Validation via `zod`
  - Rationale: Composable schema validation with strong TypeScript inference
  - Alternatives considered: Joi (mature but less TS-friendly), Yup (frontend-oriented)

- Decision: Contracts via OpenAPI (YAML)
  - Rationale: Tooling ecosystem, clear API docs; supports future codegen/testing
  - Alternatives considered: GraphQL (overkill for initial CRUD), AsyncAPI (not applicable)

- Decision: Docker Compose orchestration
  - Rationale: Simple local dev with shared network; explicit dependencies
  - Alternatives considered: Dev containers, local DB without Docker

## Clarifications Resolved

- Pagination: Cursor-based optional; default `limit=20`, `page=1` [adjustable]
- Filters: `status`, `companyCategory`, `jobSource`, `includeArchived` supported
- Error format: JSON with `code`, `message`, `details[]`; aligns with RFC7807 shape
- Seed lifecycle: Local-only seed via `npm run prisma:seed`; CI uses migrations without seeding

## Open Questions (NEEDS CLARIFICATION)

- Authentication/authorization scope (e.g., local dev only vs future users)
- Full-text search needs on `companyName`/`positionTitle`
- Rate limiting requirements for API
