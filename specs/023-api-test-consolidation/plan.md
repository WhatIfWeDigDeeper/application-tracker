# Plan 023: API Test Consolidation

## Execution Approach

Single sequential session.

## File Changes

```
specs/023-api-test-consolidation/
├── spec.md      ✓
├── plan.md      ✓
└── tasks.md     ✓

tests/api/
├── helpers.ts                        NEW: stack registry + getTargetStacks()
├── application-status.test.ts        REPLACE 3 duplicates → describe.each all 9 stacks
├── application-crud.test.ts          NEW: CRUD suite for all 9 stacks
├── csv-import-export.test.ts         EXTEND: parametrize to all 5 CSV stacks
├── date-format.test.ts               EXTEND: parametrize to all 9 stacks
│   [DELETE] nuxt-application-status.test.ts
│   [DELETE] nest-application-status.test.ts
│   [DELETE] fastapi-application-status.test.ts

scripts/
└── run-api-tests.sh                  NEW: server lifecycle (mirrors run-e2e.sh)

package.json                          ADD: test:api:<stack> scripts + test:api:all
                                      REMOVE: test:api:opaque, test:api:fastapi
```

## Key Design Decisions

- `API_URL` env var → single-stack mode; unset → all stacks
- All stacks support interview-stages REST endpoints
- PATCH bodies always include `companyName`+`positionTitle` for go-api/spring-api compatibility
