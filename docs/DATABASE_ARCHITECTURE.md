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

**GraphQL-Yoga-Prisma:**
- Schema defined in: `yoga-api/prisma/schema.prisma`
- Uses Prisma migrations with `DATABASE_URL` containing `?schema=graphql_yoga`
- Prisma client output: `node_modules/.prisma/client`
- Pothos schema builder generates GraphQL types from Prisma models
- Snapshot-based history (like Hono, NestJS, FastAPI, Go, Spring)
- Connection string: `postgresql://<user>:<password>@localhost:5432/app_tracker?schema=graphql_yoga`

**Java-Spring-JPA:**
- Schema defined in: `spring-api/src/main/resources/db/migration/V1__initial.sql`
- Flyway migration runs automatically on startup; creates `java_spring` schema and PostgreSQL enum types
- Spring Data JPA + Hibernate 6; `spring.jpa.properties.hibernate.default_schema=java_spring`
- Connection string: `jdbc:postgresql://localhost:5432/app_tracker?currentSchema=java_spring`
- PostgreSQL enum types use `AttributeConverter` classes (values like "given offer", "enterprise-software" contain spaces/hyphens)
- JSONB snapshots via `@JdbcTypeCode(SqlTypes.JSON)` with Hibernate 6
- Snapshot-based history (like Hono, NestJS, FastAPI, Go)
- Spring Data JPA `Specification<T>` + `JpaSpecificationExecutor` for multi-criteria filters

---

## DynamoDB (Non-Relational)

**Lambda-DynamoDB:**
- Table: `lambda_api_applications` (single-table design — no PostgreSQL schema)
- Single table stores applications, interview stages, and history snapshots as separate item types, distinguished by `SK` prefix:
  - Application: `PK=APP#<uuid>`, `SK=APP#<uuid>`
  - Stage: `PK=APP#<uuid>`, `SK=STAGE#<uuid>`
  - History: `PK=APP#<uuid>`, `SK=HIST#<zero-padded-seq>`
- Global Secondary Indexes:
  - `GSI1`: `GSI1PK=STATUS#<status>#ARCHIVED#<0|1>` / `GSI1SK=UPDATED#<timestamp>#<id>` — filter by status + archive flag, sort by updatedAt
  - `GSI2`: `GSI2PK=ACTIVE` / `GSI2SK=UPDATED#<timestamp>#<id>` — all non-archived apps sorted by updatedAt
- Table setup: `npm run migrate:lambda-api` (runs `lambda-api/scripts/setup-dynamodb.ts` — idempotent)
- Local development: `amazon/dynamodb-local` Docker container on port 8000 (configured via `DYNAMODB_ENDPOINT` env var)
- AWS SDK: `@aws-sdk/lib-dynamodb` (DynamoDB DocumentClient) with `removeUndefinedValues: true`
- Connection config: `DYNAMODB_ENDPOINT=http://localhost:8000`, `AWS_REGION=us-east-1`, credentials `local/local` for DynamoDB Local
