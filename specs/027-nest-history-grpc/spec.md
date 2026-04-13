# Spec 027: nest-api History Service → NestJS gRPC Microservice

**Status:** Complete
**Stack:** TypeScript + NestJS + `@nestjs/microservices` (gRPC) + `@grpc/grpc-js` + Knex + PostgreSQL + `buf` + `ts-proto`

---

## Context

A target job posting requires gRPC API design in NestJS and Protocol-Buffers-based service-to-service communication patterns. This monorepo currently has no gRPC surface — every API is REST or GraphQL. To build credible experience, we extract a self-contained slice of `nest-api` into a dedicated NestJS microservice that exposes its API over gRPC. `nest-api` stays as the browser-facing REST edge and becomes a gRPC **client** of the new service. The browser, and all other stacks, are unaffected.

Reference: `specs/core/` for technology-agnostic history/event-sourcing requirements. Most similar in spirit to `specs/009-react-nestjs/` (which defined `nest-api` itself).

React Native is out of scope — per discussion, that work lives in a separate repository.

---

## Stack Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Transport | gRPC (HTTP/2, Protocol Buffers) | Matches target-role wording; idiomatic for NestJS service mesh |
| gRPC implementation | `@grpc/grpc-js` (pure JS) | No native toolchain in CI |
| NestJS integration | `@nestjs/microservices` with `Transport.GRPC` | First-class NestJS pattern; `@GrpcMethod` handlers |
| Proto toolchain | `buf` + `ts-proto` | Linting + breaking-change detection + NestJS-aware TS codegen |
| Generated code | Committed to repo (`src/generated/`) | Matches monorepo `docs/types/` convention; keeps CI off buf critical path |
| gRPC port | 50051 | De facto gRPC standard |
| NestJS runtime mode | Pure microservice (`createMicroservice`) | No HTTP listener; simpler and more idiomatic |
| DB access (new service) | Knex + `knex` CLI migrations | Adds query-builder diversity (Drizzle/Prisma/sqlc/raw SQL already present) |
| DB schema | `react_nestjs_history` (separate from `react_nestjs`) | Microservice owns its table end-to-end |
| Snapshot payload | `bytes` (JSON-encoded by client) | Decouples proto schema from app-schema churn |
| Cascade delete | Explicit `DeleteHistory` RPC | No cross-schema FK across service boundaries |
| Directory | `nest-history-api/` | Sibling to `nest-api` |
| Extraction target | `HistoryService` only | Self-contained, single table, clear method surface |

---

## Feature Scope

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| [006 History](../core/features/006-history.md) | P1 | ✅ In scope | Record snapshot on mutation; list; revert via `GetSnapshotAtVersion` |
| RPC contract: `RecordHistory` | P1 | ✅ In scope | Writes one row; takes `application_id`, `description`, `snapshot` |
| RPC contract: `ListHistory` | P1 | ✅ In scope | Ordered by `sequence`, returns full snapshot payload |
| RPC contract: `GetSnapshotAtVersion` | P1 | ✅ In scope | Replaces old server-side revert write path |
| RPC contract: `DeleteHistory` | P1 | ✅ In scope | Called from `ApplicationsService.remove` |
| Cross-schema write isolation | P1 | ✅ In scope | `nest-history-api` never writes `applications`/`interview_stages` |
| `buf lint` + `buf breaking` in CI | P1 | ✅ In scope | Verify proto quality and backwards compatibility |
| Migration of existing history rows | P2 | ✅ In scope | Knex migration copies from old schema |
| Drop old `react_nestjs.application_history` | P3 | ⬜ Deferred | Follow-up PR; no-op while dead reference remains |
| Extend gRPC to CSV import/export | P3 | ⬜ Deferred | Possible future extraction |
| Re-expose history to browser over Connect-RPC / gRPC-Web | P3 | ⬜ Deferred | Current story keeps REST edge unchanged |

### Feature Notes

#### 006 — History

- Snapshot payload remains opaque JSON at the gRPC boundary (transported as `bytes`). Only `nest-api` interprets its structure.
- `restoreToVersion` is split: `nest-history-api` serves `GetSnapshotAtVersion`; `nest-api` applies the revert inside its own transaction, preserving write isolation for the microservice.
- Delete cascade is explicit: `ApplicationsService.remove` calls `historyClient.deleteHistory(applicationId)` before (or after — idempotent either way) removing the application.

#### Proto versioning

- Package `history.v1`. Future breaking changes increment to `history.v2` and keep v1 running until all clients migrate. `buf breaking` enforces this.

#### Non-goals

- No service mesh, no Envoy, no mTLS. Plain unencrypted gRPC over localhost for dev. CI runs services on localhost too. Production deployment is out of scope.
- No distributed tracing / OpenTelemetry wiring (possible follow-up).
- No changes to other stacks (`hono-api`, `fastapi`, etc.) — their history implementations remain self-contained.

---

## Out-of-Scope Implementations

- React Native mobile experience — will live in a separate repository.
- Connect-RPC / gRPC-Web for direct browser→gRPC calls — future consideration.
- Replacing `nest-api`'s Drizzle with Knex — `nest-api` is left unchanged.
