# Implementation Plan: Java Spring Boot + Angular

## Approach

Build `spring-api/` (Gradle, Spring Boot REST API) and `angular-spring-ui/` (Angular SPA) as separate applications. The Angular frontend is modeled on `angular-ui/` (spec 017) but proxied to port 8080. Wire both into the monorepo scripts, Playwright config, and CI last.

---

## Root package.json Additions

```json
"dev:spring-api":            "cd spring-api && ./gradlew bootRun",
"build:spring-api":          "cd spring-api && ./gradlew build",
"lint:spring-api":           "cd spring-api && ./gradlew checkstyleMain",
"test:spring-api":           "cd spring-api && ./gradlew test",
"migrate:spring-api":        "cd spring-api && ./gradlew flywayMigrate",
"install:spring-api":        "cd spring-api && ./gradlew dependencies",
"dev:angular-spring-ui":     "cd angular-spring-ui && ng serve --port 3070",
"build:angular-spring-ui":   "cd angular-spring-ui && ng build",
"lint:angular-spring-ui":    "cd angular-spring-ui && ng lint",
"test:angular-spring-ui":    "cd angular-spring-ui && ng test --watch=false",
"install:angular-spring-ui": "cd angular-spring-ui && npm install",
"test:e2e:spring":           "TEST_UI_PORT=3070 PLAYWRIGHT_HTML_OPEN=never npx -y playwright test"
```

Add each to its `:all` counterpart. Add ports `8080` and `3070` to `scripts/stop-all.sh`.

---

## playwright.config.ts

```ts
3070: 'npm run dev:angular-spring-ui',
```

The Spring Boot API must be started separately (or via `run-e2e.sh`) before Playwright runs.

Spring Boot startup is slow (~15s) — set `webServer.timeout` to `120_000` (2 minutes) for the port 3070 entry.

---

## scripts/run-e2e.sh

Add `spring` to `STACKS`. `api_port=8080`, `api_script=dev:spring-api`, `ui_port=3070`, `ui_script=dev:angular-spring-ui`.

---

## CI: .github/workflows/verify-pr.yaml

```yaml
- uses: actions/setup-java@v4
  with:
    java-version: '21'
    distribution: 'temurin'
- uses: gradle/actions/setup-gradle@v4
```

---

## Verification

1. `npm run build:spring-api` — JAR builds cleanly
2. `npm run lint:spring-api` — Checkstyle passes
3. `npm run test:spring-api` — unit + `@WebMvcTest` slice tests pass
4. `npm run build:angular-spring-ui` — Angular build passes
5. `npm run lint:angular-spring-ui` — ESLint passes
6. `npm run test:angular-spring-ui` — Angular unit tests pass
7. Manual: start both servers, open http://localhost:3070, verify all features
8. `npm run test:e2e:spring` — all 13 shared Playwright tests pass
9. `bash scripts/run-e2e.sh` — all 8 stacks pass with no regression
10. Update `README.md`, `docs/DATABASE_ARCHITECTURE.md`, `scripts/generate-schema-docs.sh`, run `npm run docs:schema`

---

## Execution Approach

Single session, sequential (tasks in tasks.md). Isolated worktree recommended given the number of new files, CI config changes, and monorepo wiring.
