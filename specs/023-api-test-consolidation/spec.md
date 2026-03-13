# Spec 023: API Test Consolidation

**Status**: Complete

## Problem

`tests/api/` has 5 test files with uneven coverage and significant duplication:

- `nuxt-application-status.test.ts`, `nest-application-status.test.ts`, `fastapi-application-status.test.ts` — identical test bodies, only the default port differs
- `date-format.test.ts` — targets express-api (port 3001) only
- `csv-import-export.test.ts` — targets nest-api (port 5050) only; 4 other CSV-capable stacks untested

No API tests at all for: koa-api, hono-api, go-api, spring-api, yoga-api.

## Scope

Replace the fragmented, duplicated files with a single set of shared, parametrized test files that run the same assertions against all 9 implementations.

## Requirements

1. Single set of test files, each parametrized over all applicable stacks
2. Per-stack `test:api:<stack>` npm scripts (sets `API_URL`, runs jest against `tests/api/`)
3. `test:api:all` npm script with server lifecycle management via `scripts/run-api-tests.sh`
4. Delete the 3 duplicate application-status test files
5. All 9 stacks covered by application-status, CRUD, and date-format tests
6. All 5 CSV stacks covered by csv-import-export tests

## Stack Registry

| API name     | Port | Base URL                        | CSV? | Interview Stages? |
|---|---|---|---|---|
| express-api  | 3001 | `http://localhost:3001`         | no   | yes |
| koa-api      | 5010 | `http://localhost:5010`         | no   | yes |
| nuxt-api     | 5040 | `http://localhost:5040/api`     | no   | yes |
| hono-api     | 5030 | `http://localhost:5030`         | no   | yes |
| fastapi      | 5160 | `http://localhost:5160`         | yes  | yes |
| nest-api     | 5050 | `http://localhost:5050`         | yes  | yes |
| go-api       | 5070 | `http://localhost:5070`         | yes  | yes |
| spring-api   | 8080 | `http://localhost:8080`         | yes  | yes |
| yoga-api     | 5080 | `http://localhost:5080/api`     | yes  | yes |

## Success Criteria

- `npm run test:api:<stack>` runs tests against a single running API
- `npm run test:api:all` starts all APIs, runs tests, stops APIs
- No duplicate test logic across files
- Coverage: 9 stacks × application-status, 9 stacks × CRUD, 9 stacks × date-format, 5 stacks × CSV
