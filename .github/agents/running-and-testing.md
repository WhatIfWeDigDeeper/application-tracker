# Running and Testing

## Root (Express API + Next UI)
- Install all: `npm ci`
- Dev: `npm run dev` (runs `dev:api` and `dev:ui` in parallel)
- Build: `npm run build` (api + ui)
- Lint: `npm run lint` (api + ui)
- Test: `npm run test` (api + ui)
- Coverage: `npm run test:coverage`
- E2E: `npm run test:e2e` (Playwright; ensure API/UI running per env-and-ports)
- Audit: `npm run audit:ci`
- Prisma: `npm run prisma:migrate:dev`, `npm run prisma:generate`, `npm run prisma:studio`, `npm run seed`

## api/
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Test: `npm test` (Jest), `npm run test:watch`, `npm run test:coverage`
- Lint: `npm run lint`
- Format: `npm run format`
- Prisma: `npm run prisma:migrate:dev`, `npm run prisma:migrate:deploy`, `npm run prisma:generate`, `npm run prisma:studio`
- Seed: `npm run seed`
- Perf: `npm run perf:test`

## ui/ (Next.js)
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`
- Type check: `npm run compile`
- Test: `npm test`, `npm run test:watch`, `npm run test:coverage`

## koa-api/ (React Koa backend)
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Test: `npm test`, `npm run test:watch`, `npm run test:coverage`
- Lint: `npm run lint`
- Format: `npm run format`
- DB: `npm run db:migrate`, `npm run db:seed`

## react-ui/
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm run test`, `npm run test:watch`
- Preview: `npm run preview`

## hono-api/
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- DB: `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio`

## svelte-ui/
- Dev: `npm run dev`
- Build: `npm run build`
- Check: `npm run check`, `npm run check:watch`
- Test: `npm run test`, `npm run test:ui`
- Preview: `npm run preview`

## parse-server-api/
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Typecheck: `npm run typecheck`
- Test: `npm run test`, `npm run test:watch`, `npm run test:ui`

## vue-ui/
- Dev: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Test: `npm run test`, `npm run test:ui`
- E2E: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:debug`

Notes:
- Prefer `npm ci` for installs. Use exact versions; do not add ^ or ~.
- When touching a specific implementation, run its lint/build/test (and e2e if applicable).