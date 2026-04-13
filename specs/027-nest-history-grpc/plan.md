# Plan 027: Extract `nest-api` history into a NestJS gRPC microservice

**Status:** Complete
**Related:** `spec.md` (this folder), `tasks.md` (this folder)

## Context

A target job posting requires gRPC API design in NestJS and Protocol-Buffers-based service communication patterns. This monorepo currently has no gRPC surface — every API is REST or GraphQL. To build credible experience, we'll carve a self-contained slice of `nest-api` out into a dedicated NestJS service that exposes its API over gRPC, keep `nest-api` as the public REST edge, and demonstrate end-to-end proto-driven service-to-service communication.

The extraction target is **`HistoryService`** (`nest-api/src/applications/history.service.ts`), chosen because it already owns `application_history` end-to-end, has a small cohesive method surface, and is a single injected provider. It is consumed from four call sites in `nest-api`: `ApplicationsService`, `CsvService`, `InterviewStagesService`, and `ApplicationsController` (the controller injects it directly for `GET /applications/:id/history` and `POST /applications/:id/history/restore`). All four must be migrated to the new `HistoryClient` before `history.service.ts` can be deleted. No UI path reads history except `GET /api/applications/:id/history` — a per-id lookup, so no cross-schema joins are required.

React Native is explicitly out of scope; per discussion it will live in a separate repository and is not part of this plan.

## Outcome

- A new package `nest-history-api/` (NestJS, Fastify/HTTP disabled; runs as pure gRPC service on port `50051`) that owns PostgreSQL schema `react_nestjs_history` and its `application_history` table, including Knex migrations.
- A `proto/` directory at the repo root containing `history/v1/history.proto`, governed by `buf` (`proto/buf.yaml` for lint/breaking rules; `buf.gen.yaml` at repo root for codegen) with `ts-proto` codegen and `buf lint` / `buf breaking` wired into the validation chain.
- `nest-api` no longer touches `application_history`; its `HistoryService` provider is replaced by a thin gRPC client (`@nestjs/microservices` + `ClientGrpc`) that speaks to `nest-history-api`. Existing REST endpoints (`/applications/:id/history`, revert) continue to work unchanged for the browser.
- `restoreToVersion` is refactored so the gRPC service is write-isolated: it returns the target snapshot; `nest-api` applies the revert to `applications` + `interview_stages` inside its own transaction.
- Monorepo scripts, docs (`README.md`, `docs/DATABASE_ARCHITECTURE.md`, `CLAUDE.md`), `scripts/stop-all.sh`, and `.vscode/launch.json` updated per the "adding a new implementation" checklist in `CLAUDE.md`.

## Architecture

```
Browser (tanstack-ui :3050)
        │ REST
        ▼
   nest-api :5050  ──────── gRPC (HTTP/2, proto) ─────────▶  nest-history-api :50051
        │                                                          │
        │ Drizzle (react_nestjs schema)                             │ Knex (react_nestjs_history schema)
        ▼                                                          ▼
 applications, interview_stages                           application_history
                         (single Postgres instance, separate schemas)
```

Contract boundary (`proto/history/v1/history.proto`, rpcs):

- `RecordHistory(RecordHistoryRequest) → RecordHistoryResponse` — writes one history row. Payload: `application_id`, `description`, `snapshot` (bytes — JSON-encoded to keep the proto stable against app-schema churn).
- `ListHistory(ListHistoryRequest) → ListHistoryResponse` — returns ordered entries with `sequence`, `description`, `created_at`, `snapshot`.
- `GetSnapshotAtVersion(GetSnapshotAtVersionRequest) → GetSnapshotAtVersionResponse` — returns the snapshot for a given `application_id` + `sequence`. Replaces the write-side of `restoreToVersion`; the caller applies it.
- `DeleteHistory(DeleteHistoryRequest) → DeleteHistoryResponse` — returns `deleted_count`; called when an application is deleted (cascade replacement, since we no longer share a DB FK across schemas).

Design notes:

- Snapshots are transported as opaque JSON-in-bytes, not a typed proto message. The application schema is still evolving across the monorepo; forcing it into proto would couple the history service to every field change. The service treats snapshots as opaque; only `nest-api` interprets them.
- Cross-schema cascade delete is replaced by an explicit `DeleteHistory` RPC triggered in `ApplicationsService.remove`. Acceptable because both services share one Postgres instance and one request path; no distributed-transaction semantics needed for a dev project.
- The gRPC service runs as a **pure** NestJS microservice (`NestFactory.createMicroservice`, no HTTP listener) — simpler, and matches idiomatic NestJS gRPC patterns.

## Critical files

**New:**
- `proto/buf.yaml`, `proto/buf.gen.yaml`, `proto/history/v1/history.proto`
- `nest-history-api/` — `package.json`, `tsconfig.json`, `src/main.ts`, `src/app.module.ts`, `src/history/history.module.ts`, `src/history/history.controller.ts` (gRPC controller, `@GrpcMethod`), `src/history/history.service.ts` (port of `HistoryService` logic, minus the `applications`/`stages` writes in restore), `src/database/*` (Knex provider/module, query builders, migrations in `knexfile.ts` + `migrations/` directory — only `application_history` table), `src/generated/history/v1/*` (buf-generated), `.auditconfig.json`, `vitest.config.ts`.
- `nest-api/src/generated/history/v1/*` (buf-generated; committed).
- `.vscode/launch.json` — debug config for `nest-history-api` (Node, port 9230 to avoid clash with existing 9229).

**Modified:**
- `nest-api/src/applications/applications.module.ts` — replace `HistoryService` provider with `ClientsModule.register([{ name: 'HISTORY_PACKAGE', transport: Transport.GRPC, options: { package: 'history.v1', protoPath: ..., url: env('HISTORY_GRPC_URL', 'localhost:50051') } }])` plus a small `HistoryClient` wrapper with the same method signatures the rest of the code already calls.
- `nest-api/src/applications/applications.service.ts`, `csv.service.ts`, `interview-stages.service.ts` — inject `HistoryClient` instead of `HistoryService` (same method names, mechanical change). `interview-stages.service.ts` keeps its existing `recordHistory` calls on create/update/delete stage — they just route through the gRPC client now.
- `nest-api/src/applications/applications.controller.ts` — inject `HistoryClient` instead of `HistoryService` for `GET /applications/:id/history`. For `POST /applications/:id/history/restore`, the controller should delegate to a new `ApplicationsService.restoreToVersion(id, sequence)` method rather than calling the history service directly. That service method calls `historyClient.getSnapshotAtVersion`, then applies the snapshot to `applications` + `interview_stages` inside a single Drizzle transaction. This keeps the write-isolation boundary clean (the gRPC service never writes non-history tables).
- `nest-api/src/applications/history.service.ts` — **deleted**.
- `nest-api/src/database/schema.ts` — **unchanged**. `nest-api` keeps Drizzle; we simply stop reading/writing `application_history` from it (the table definition can remain in the schema file as a dead reference, or be removed in a follow-up — out of scope for this plan). No migration on the nest-api side.
- `package.json` (root) — add scripts: `dev:nest-history-api`, `build:nest-history-api`, `lint:nest-history-api`, `test:nest-history-api`, `audit:ci:nest-history-api`, `install:nest-history-api`, `proto:generate`, `proto:lint`, `proto:breaking`. Add each to `*:all` counterparts. Add `proto:lint` to `lint:all` and `proto:breaking` to CI verification.
- `scripts/stop-all.sh` — add port 50051.
- `scripts/generate-schema-docs.sh` — add `react_nestjs_history:nest-history-api` to the SCHEMAS array; run `npm run docs:schema`.
- `.github/workflows/verify-pr.yaml` — install `buf` CLI; run `npm run proto:lint` and `npm run proto:breaking` against `origin/main`.
- `README.md` — TOC, implementations table (add nest-history-api as a companion service, not a stack — a new "Service Communication" subsection), schema docs link, running instructions.
- `docs/DATABASE_ARCHITECTURE.md` — add `react_nestjs_history` schema entry.
- `CLAUDE.md` — add a "gRPC / Protocol Buffers Patterns" section capturing: buf workflow, opaque-bytes snapshot pattern, pure-microservice NestJS bootstrap, cross-schema cascade-via-RPC pattern, ts-proto gotchas we hit.

## Toolchain choices

- **Proto tooling**: `buf` + `ts-proto`. Generated TS is committed (matches `docs/types/` pattern; keeps CI off the `buf` critical path for regular builds). `buf generate` runs via `npm run proto:generate` and is expected to be run by contributors when `.proto` files change; CI runs `buf lint` and `buf breaking` against `origin/main` to enforce.
- **Schema isolation**: fully separate schema `react_nestjs_history`, owned by `nest-history-api`. `nest-api` simply stops reading/writing the old `react_nestjs.application_history` table; its Drizzle schema file is left unchanged to minimize blast radius.
- **DB layer in `nest-history-api`**: Knex (+ `knex` CLI for migrations). Intentionally different from `nest-api`'s Drizzle, to add query-builder diversity alongside the existing Drizzle, Prisma, sqlc, and raw-SQL stacks in the monorepo.
- **Transport**: `@grpc/grpc-js` (pure JS, no native deps — avoids the `grpc` C++ toolchain headache in CI).

## Reused patterns & utilities

- NestJS bootstrap + Fastify + Zod validation pipe pattern: copy from `nest-api/src/main.ts` and `nest-api/src/pipes/` (but drop the HTTP side in `nest-history-api/main.ts`; use `NestFactory.createMicroservice`).
- DB access pattern: new to this service — **Knex**, not Drizzle. Deliberately chosen to add toolchain diversity, since Drizzle is already used in hono-api, nuxt-api, and nest-api. Expose Knex via a NestJS `DatabaseModule` with a `KNEX` provider token (same DI shape as nest-api's Drizzle module). Migrations via `knex migrate:*` CLI, `knexfile.ts` configuring the `react_nestjs_history` schema (`searchPath: ['react_nestjs_history']`).
- History domain logic (`computeFieldDiffs`, `buildDescription`, sequence allocation, snapshot insertion): lift verbatim from `nest-api/src/applications/history.service.ts` — these become the body of the gRPC handlers in `nest-history-api/src/history/history.service.ts`.
- Monorepo script conventions: follow `verb:package-name` and `*:all` aggregation per `CLAUDE.md`; model new scripts on `nest-api`'s existing entries.
- Test harness: `tests/e2e/history.spec.ts` today runs against ports 3000/3010/3020/3030/3090 and **skips** port 3050 (tanstack-ui + nest-api). It is therefore **not** a regression signal for this change out of the box. Two fixes are required before tests can cover this work:
  1. Extend `tests/e2e/history.spec.ts` to include port 3050 (tanstack-ui). Gate on any stack-specific selectors that may differ, but the history panel UI is shared — this should be a small change.
  2. Add `nest-api` API tests under `tests/api/` for `GET /applications/:id/history`, `POST /applications/:id/history/restore`, and a stage create/update/delete flow asserting that history rows are written. These are the direct regression signals for the gRPC path, independent of the UI.

## Data migration

`application_history` rows currently live in `react_nestjs.application_history`. On first `dev:nest-history-api` run, the new service's initial Knex migration creates `react_nestjs_history.application_history`. A second Knex migration copies existing rows across (`INSERT INTO react_nestjs_history.application_history SELECT * FROM react_nestjs.application_history ON CONFLICT DO NOTHING`). `nest-api` is left alone — its Drizzle schema still references the old table but nothing reads or writes it anymore; cleanup can happen in a future PR. For local dev, acceptable to just truncate and restart — document both paths in `nest-history-api/README.md`.

## Run strategy

Single session, sequential. This is one coherent slice (proto → new service → nest-api client swap → docs), with tight ordering dependencies (proto must exist before clients compile; nest-api swap must happen atomically with nest-history-api coming up). Parallel subagents would fight over `package.json` and `CLAUDE.md`. Worktree isolation optional; not required since no other concurrent work is in flight.

## Verification

1. **Unit**: `npm run test:nest-history-api` — port history service tests from `nest-api` to run against the new service (diff computation, snapshot building, sequence allocation).
2. **Build chain**: `npm run build:nest-history-api && npm run lint:nest-history-api && npm run test:nest-history-api`, then same for `nest-api`. Then `npm run audit:ci:nest-history-api` and `npm run audit:ci:nest-api`.
3. **Proto contract**: `npm run proto:lint` clean; `npm run proto:breaking` clean against `origin/main`.
4. **Integration**: start `nest-history-api` (`npm run dev:nest-history-api`) + `nest-api` (`npm run dev:nest-api`) + `tanstack-ui` (`npm run dev:tanstack-ui`). Manually exercise: create application → edit → verify history appears in the detail view; revert to a prior version → verify rollback. Confirms REST→gRPC→DB round trip.
5. **E2E**: Extend `tests/e2e/history.spec.ts` to include port 3050 (see Reused patterns). Then `npm run test:e2e:tanstack-ui` — history + revert scenarios pass end-to-end against the gRPC path. Then `bash scripts/run-e2e.sh all` to confirm no regressions in other stacks.
6. **API tests**: Add the new `nest-api` history API tests (see Reused patterns). Then `bash scripts/run-api-tests.sh nest-api` — new history tests pass, covering application-history list/restore and stage-mutation history recording.
7. **Docs**: `npm run docs:schema` regenerates; new `react_nestjs_history` schema appears.
