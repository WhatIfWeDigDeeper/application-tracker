# E2E Guidance

- Start the matching API before running UI Playwright suites. See env-and-ports for expected ports.
- Root Playwright: `npm run test:e2e` (targets Next + Express). Ensure `api` on 5000 (or 3001 via Docker) and `ui` on 3000.
- Vue + Nuxt: start `nuxt-api` on 5040, then `cd vue-ui && npm run test:e2e`.
- Other stacks: align UI/API ports per env-and-ports; run their local dev servers before e2e.
- Use data-testid selectors where possible; avoid brittle text selectors.
- Keep tests isolated: seed/reset data where needed; prefer creating entities via API when possible.
- For debugging: `npm run test:e2e:ui` or `npm run test:e2e:debug` (where available).
- Record what you ran and any flakes; open issues for flaky tests with repro steps.