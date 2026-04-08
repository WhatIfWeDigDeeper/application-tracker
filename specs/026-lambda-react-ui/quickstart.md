# Quickstart: Lambda React UI

## Prerequisites

1. **PostgreSQL** not required — lambda-react-ui uses DynamoDB
2. **DynamoDB Local** running on port 8000:
   ```bash
   docker compose up -d dynamodb-local
   ```
3. **Lambda API** (port 5090):
   ```bash
   npm run dev:lambda-api
   ```
4. **lambda-react-ui** dependencies installed:
   ```bash
   npm run install:lambda-react-ui
   ```

## Start Development Server

```bash
npm run dev:lambda-react-ui
# Opens http://localhost:3090
```

The frontend proxies `/api` → `http://localhost:5090`, so API calls work without CORS configuration.

## Run Unit Tests

```bash
npm run test:lambda-react-ui
# Runs Vitest + Testing Library tests in lambda-react-ui/
```

## Run E2E Tests

```bash
# Full managed run (starts lambda-api + lambda-react-ui automatically):
bash scripts/run-e2e.sh lambda-react-ui

# Manual (when servers already running):
TEST_UI_PORT=3090 npm run test:e2e:lambda-react-ui
```

## Run API Integration Tests

```bash
# Full managed run:
bash scripts/run-api-tests.sh lambda-api

# Manual (when lambda-api already running):
npm run test:api:lambda-api
```

## Run Full Validation Chain

```bash
npm run build:lambda-react-ui   # Vite build
npm run lint:lambda-react-ui    # ESLint
npm run test:lambda-react-ui    # Vitest unit tests
npm run test:e2e:lambda-react-ui  # Playwright E2E
```

## Environment Variables

The lambda-react-ui Vite proxy handles routing automatically. No `.env` file is required for development. The `VITE_API_URL` env var can override the backend URL if needed:

```bash
# Default (uses Vite proxy):
VITE_API_URL=/api

# For direct API access (bypasses proxy):
VITE_API_URL=http://localhost:5090
```

## DynamoDB Table Setup

The DynamoDB table is shared with the lambda-api. Run setup once if starting fresh:

```bash
npm run migrate:lambda-api
```

## Debug in VS Code

A `Lambda React UI (port 3090)` launch configuration is available in `.vscode/launch.json`. Start the dev server first, then launch the debugger to attach.

## Package Location

```
lambda-react-ui/        # Frontend SPA (Vite + React + Zustand)
lambda-api/             # Backend API (Hono + DynamoDB)
```

Both are siblings in the monorepo root.
