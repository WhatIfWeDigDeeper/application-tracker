# TanStack UI + NestJS Patterns

- Stack: React 19 + TanStack Query v5 + TanStack Router + NestJS (Fastify adapter) + Drizzle; tanstack-ui port 3050, nest-api port 5050, DB schema `react_nestjs`; snapshot-based history
- **TanStack Router file-based routing**: `src/routes/__root.tsx`, `index.tsx`, `applications/new.tsx`, `applications/$id.tsx`
- **TanStack Query**: Query key factory pattern in `src/queries/queryKeys.ts`
- **NestJS DI with tsx**: Must use explicit `@Inject(ServiceClass)` on constructor params — tsx/esbuild doesn't emit decorator metadata, so parameter-based injection fails silently
- **Zod validation pipe**: Custom Zod validation pipe used, not class-validator — do not add class-validator decorators
- **Vite proxy**: `/api` → `http://localhost:5050` with path rewrite
