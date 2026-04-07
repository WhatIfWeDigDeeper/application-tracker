# lambda-react-ui

React 19 + Vite 7 + Zustand + Tailwind CSS 4 SPA frontend for the application tracker, paired with the `lambda-api` backend (Hono + DynamoDB).

## Ports

| Service | Port |
|---------|------|
| lambda-react-ui (dev) | 3090 |
| lambda-api | 5090 |
| DynamoDB Local | 8000 |

## Prerequisites

1. DynamoDB Local running: `docker compose up -d dynamodb-local`
2. DynamoDB table created: `npm run migrate:lambda-api`
3. lambda-api running: `npm run dev:lambda-api`

See [specs/026-lambda-react-ui/quickstart.md](../specs/026-lambda-react-ui/quickstart.md) for full setup.

## Development

```bash
npm run dev:lambda-react-ui
```

The Vite dev server proxies `/api` to `http://localhost:5090`.

## Testing

```bash
npm run test:lambda-react-ui      # unit tests (Vitest)
npm run test:e2e:lambda-react-ui  # E2E tests (Playwright)
```

## Build

```bash
npm run build:lambda-react-ui
```
