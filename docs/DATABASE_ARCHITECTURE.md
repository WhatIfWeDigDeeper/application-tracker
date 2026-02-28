# Database Architecture

## Multi-Schema Organization

All implementations share a single PostgreSQL database (`app_tracker`) but use separate schemas for isolation:

- **Resource efficiency**: Single PostgreSQL instance
- **Data isolation**: Each implementation has its own namespace
- **Easy comparison**: All data accessible from one database
- **Independent operation**: Schemas don't interfere with each other

## Schema Configuration by Implementation

**Root (Express + Prisma):**
- Schema defined in: `api/prisma/schema.prisma`
- Uses `@@schema("express_prisma")` directive

**React-Koa-PG:**
- Schema defined in: `koa-api/src/db/schema.sql`
- Creates `react_koa` schema at the top of the file
- Uses `SET search_path TO react_koa;`

**Svelte-Hono-Drizzle:**
- Schema defined in: `hono-api/src/db/schema.ts`
- Uses Drizzle's `pgSchema('svelte_hono')`
- Config in: `drizzle.config.ts` with `schemaFilter: ['svelte_hono']`

**Vue-Nuxt-Drizzle:**
- Schema defined in: `nuxt-api/server/db/schema.ts`
- Uses Drizzle's `pgSchema('vue_nuxt')`
- Config in: `nuxt-api/drizzle.config.ts` with `schemaFilter: ['vue_nuxt']`
- Shared types in: `nuxt-api/shared/types.ts` (imported by both nuxt-api and vue-ui via `@shared` alias)

**React-TanStack-NestJS-Drizzle:**
- Schema defined in: `nest-api/src/database/schema.ts`
- Uses Drizzle's `pgSchema('react_nestjs')`
- Config in: `nest-api/drizzle.config.ts` with `schemaFilter: ['react_nestjs']`
- Snapshot-based history (like Express, Koa, Hono)

**Python-FastAPI-asyncpg:**
- Schema defined in: `fastapi/migrations/001_initial.sql`
- Raw SQL migration with `CREATE SCHEMA IF NOT EXISTS python_fastapi`
- asyncpg pool configured with `server_settings={"search_path": "python_fastapi"}`
- Snapshot-based history (like Hono, NestJS)
- No ORM — uses raw SQL queries with asyncpg

**Go-Gin-pgx:**
- Schema defined in: `go-api/migrations/001_initial.up.sql`
- Raw SQL migration with `CREATE SCHEMA IF NOT EXISTS go_gin`
- pgx v5 pool configured with `search_path=go_gin` in the connection string
- Snapshot-based history (like Hono, NestJS, FastAPI)
- No ORM — uses raw SQL queries via pgx v5
