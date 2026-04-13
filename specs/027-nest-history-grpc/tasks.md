# Tasks 027: nest-api history → gRPC microservice

**Status:** Complete
**Related:** `plan.md`, `spec.md`

Tasks are ordered to minimize broken intermediate states. Each phase should leave the repo building and testing cleanly. Finish one phase before starting the next.

---

## Phase 1 — Proto contract & toolchain

1. [x] Add `buf` CLI to developer toolchain (document install in `nest-history-api/README.md`; no global package added).
2. [x] Create `proto/buf.yaml` (lint rules: `STANDARD`, breaking: `FILE`) and `buf.gen.yaml` at repo root (ts-proto plugin, `nestJs=true`, `outputServices=grpc-js`, `esModuleInterop=true`).
3. [x] Author `proto/history/v1/history.proto` with `RecordHistory`, `ListHistory`, `GetSnapshotAtVersion`, `DeleteHistory` messages and `HistoryService` rpc.
4. [x] Add root-level scripts: `proto:generate`, `proto:lint`, `proto:breaking`. Point `proto:generate` outputs to `nest-api/src/generated/history/v1/` and `nest-history-api/src/generated/history/v1/`.
5. [x] Run `npm run proto:generate` and commit generated TS.
6. [x] Run `npm run proto:lint` — must pass.

## Phase 2 — `nest-history-api` scaffold

1. [x] Create `nest-history-api/package.json` with exact-pinned deps: `@nestjs/*`, `@nestjs/microservices`, `@grpc/grpc-js`, `knex`, `pg`, `vitest`, `typescript`, `tsx`. Add `@types/*` where needed.
2. [x] Create `tsconfig.json` mirroring `nest-api`'s settings (strict, `experimentalDecorators`, `emitDecoratorMetadata`).
3. [x] Create `knexfile.ts` configured for `react_nestjs_history` schema with `searchPath: ['react_nestjs_history']`.
4. [x] Add migrations in `nest-history-api/migrations/`:
   - `001_create_application_history.ts` — creates `react_nestjs_history.application_history` (id UUID PK, application_id UUID, sequence INT, description TEXT, snapshot JSONB, created_at TIMESTAMPTZ; index on `(application_id, sequence)`).
   - `002_copy_existing_history.ts` — `INSERT ... SELECT ... ON CONFLICT DO NOTHING` from `react_nestjs.application_history`.
5. [x] Implement `src/database/database.module.ts` with a `KNEX` provider token.
6. [x] Implement `src/history/history.service.ts` — port `computeFieldDiffs`, `buildDescription`, sequence allocation, insert, list, getSnapshotAtVersion, delete. Treat snapshot as opaque bytes at the RPC boundary (JSON-encode on write, pass through on read).
7. [x] Implement `src/history/history.controller.ts` — `@GrpcMethod('HistoryService', ...)` handlers calling the service. Bytes↔JSON encoding happens here.
8. [x] Implement `src/main.ts` using `NestFactory.createMicroservice({ transport: Transport.GRPC, options: { package: 'history.v1', protoPath, url: `0.0.0.0:${process.env.HISTORY_GRPC_PORT ?? 50051}` } })`.
9. [x] Port unit tests for diff/description/sequence logic from `nest-api` to `nest-history-api`.
10. [x] Add root scripts: `dev:nest-history-api`, `build:nest-history-api`, `lint:nest-history-api`, `test:nest-history-api`, `audit:ci:nest-history-api`, `install:nest-history-api`, `migrate:nest-history-api`. Wire each into the relevant `*:all` script.
11. [x] Run the chain: `install → migrate → build → lint → test → audit:ci` for `nest-history-api`. All pass.
12. [x] Start it manually (`npm run dev:nest-history-api`) and confirm it listens on `50051`.

## Phase 3 — `nest-api` client swap

1. [x] Add `@nestjs/microservices` + `@grpc/grpc-js` to `nest-api/package.json`. Run `npm run install:nest-api`.
2. [x] Create `nest-api/src/applications/history.client.ts` — an injectable `HistoryClient` that wraps `ClientGrpc.getService<HistoryServiceClient>('HistoryService')` and exposes the same method names the existing code already calls (`recordHistory`, `listHistory`, `getSnapshotAtVersion`, `deleteHistory`). Internally: JSON-encode/decode the snapshot bytes.
3. [x] In `applications.module.ts`, register `ClientsModule` with the gRPC transport; replace `HistoryService` provider with `HistoryClient`.
4. [x] Update `applications.service.ts` to depend on `HistoryClient` instead of `HistoryService` (mechanical rename at the injection site and call sites).
5. [x] Update `csv.service.ts` to depend on `HistoryClient` (same).
6. [x] Update `interview-stages.service.ts` to depend on `HistoryClient` (same). Verify all three mutation paths — create, update, delete stage — still call `recordHistory` with equivalent payloads.
7. [x] Add `HistoryClient.restoreToVersion(id, sequence)` — calls `this.grpc.getSnapshotAtVersion`, then applies the snapshot to `applications` + `interview_stages` inside a single Drizzle transaction. (Note: implemented on `HistoryClient` directly rather than a separate `ApplicationsService` method, keeping all history-related logic in one place.)
8. [x] Update `applications.controller.ts`:
   - Inject `HistoryClient` in place of `HistoryService` for `GET /applications/:id/history`.
   - Change `POST /applications/:id/history/restore` to delegate to `historyClient.restoreToVersion` directly.
9. [x] Add an explicit `historyClient.deleteHistory(applicationId)` call in `ApplicationsService.remove` (replacing the cross-schema FK cascade).
10. [x] Delete `nest-api/src/applications/history.service.ts` and its test file. Grep for any remaining `HistoryService` references — must be zero.
11. [x] Run the chain for `nest-api`: `build → lint → test → audit:ci`. All pass.

## Phase 4 — Test coverage for the gRPC path

Today's coverage is inadequate: `tests/e2e/history.spec.ts` explicitly skips port 3050 (nest-api's paired UI), and there are no `tests/api/` cases for `/history` or `/history/restore`. Both gaps are addressed here before any passing claim is made.

1. [x] Extend `tests/e2e/history.spec.ts`: add port 3050 to the `isTargetUI` list. Run `TEST_UI_PORT=3050 npm run test:e2e:tanstack-ui` to confirm it executes (not skips).
2. [x] Add API tests under `tests/api/` for nest-api:
   - `GET /applications/:id/history` returns the expected sequence and descriptions after create + edit.
   - `POST /applications/:id/history/restore` reverts application fields.
   - Stage create / update / delete each produce a history entry with the expected description (covers `interview-stages.service.ts` wiring).
3. [x] Verify the new API tests run as part of `bash scripts/run-api-tests.sh nest-api`.

## Phase 5 — Integration & regression runs

1. [x] Bring up stack: `docker compose ps db` → `docker compose up -d db` if needed; `dev:nest-history-api`; `dev:nest-api`; `dev:tanstack-ui`.
2. [x] Manual smoke: create application → edit fields → confirm history list populates on detail view → revert to prior version → confirm fields restored; add/update/delete a stage → confirm each produces a history entry.
3. [x] Run `npm run test:e2e:tanstack-ui` — all history/revert scenarios pass against port 3050.
4. [x] Run `bash scripts/run-api-tests.sh nest-api` — new history + stage-history API tests pass.
5. [x] Run `bash scripts/run-e2e.sh all` — no regressions in any other stack.

## Phase 6 — Docs & infra

1. [x] Update `scripts/stop-all.sh` to kill port 50051.
2. [x] Update `scripts/generate-schema-docs.sh` (add `react_nestjs_history:nest-history-api`); run `npm run docs:schema`.
3. [x] Update `docs/DATABASE_ARCHITECTURE.md` with the new schema.
4. [x] Update `README.md`: TOC entry, new "Service Communication" subsection describing nest-api ↔ nest-history-api gRPC link, running instructions, schema docs link.
5. [x] Update `CLAUDE.md` with a "gRPC / Protocol Buffers Patterns" section (buf workflow, opaque-bytes snapshots, pure microservice bootstrap, cross-schema cascade-via-RPC, any ts-proto quirks encountered).
6. [x] Add `.vscode/launch.json` debug config for `nest-history-api` (Node, debug port 9230).
7. [x] Update `.github/workflows/verify-pr.yaml` to install `buf` and run `proto:lint` + `proto:breaking` against `origin/main`.

## Phase 7 — Wrap

1. [x] Set spec status to `Complete` in `spec.md`.
2. [x] Final full validation chain: `build:all`, `lint:all`, `test:all`, `audit:ci:all`, `test:e2e:all`, `proto:lint`, `proto:breaking`.
3. [x] Open PR; wait for CI green; squash merge; post-merge cleanup per `CLAUDE.md`.
