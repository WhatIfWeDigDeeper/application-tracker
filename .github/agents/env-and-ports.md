# Env and Ports

## Default Local Ports
- Next + Express: UI 3000, API 5000
- React + Koa: UI 3010, API 5010
- Vue + Parse: UI 3020, API 5001
- Svelte + Hono: UI 3030, API 5030

## Docker (compose)
- API mapped to 3001 (container 5000); UI 3000
- DB: Postgres on 5432 with database `app_tracker`

## Env Vars
- `DATABASE_URL` per schema, e.g. `postgresql://postgres:postgres@localhost:5432/app_tracker?schema=express_prisma`
- UI -> API: set `NEXT_PUBLIC_API_URL` (or Vite env equivalents) to match the running API port (5000 local, 3001 via Docker)

## Schema Isolation
- express_prisma (Express + Prisma)
- react_koa (Koa + pg)
- svelte_hono (Hono + Drizzle)
- vue_parse (Parse Server)

Notes: Keep ports in sync when running e2e; start the matching API before UI e2e tests.