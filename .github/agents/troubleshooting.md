# Troubleshooting

- Ports in use: check for existing dev servers; stop with `npm run kill:all-next-dev` or adjust ports per env-and-ports.
- DB connection: verify `DATABASE_URL` schema matches the implementation; ensure Postgres running on 5432.
- Prisma issues: rerun `npm run prisma:generate` or `npm run prisma:migrate:dev` in `api`.
- Type errors after dep changes: rerun install with `npm ci` and rebuild; use `fix-build` skill if persistent.
- Playwright flakes: run in headed/--debug mode; ensure API/UI running on expected ports.
- Parse/Vite quirk: Vue + Parse uses `vue-ui/src/lib/parse.ts` wrapper to avoid LiveQuery issues.
- If stuck: narrow repro, gather logs, and consult relevant skill from skills-index before deep edits.