# Quickstart: API (Express + Prisma) and UI (Next.js) with Docker

## Prerequisites
- Docker + Docker Compose
- Node 18+

## Environment

Create env files:
- `api/.env`: `DATABASE_URL=postgres://postgres:postgres@postgres:5432/app_tracker`
- `ui/.env`: add any UI envs as needed (optional)

## Install (local without Docker, optional)

```bash
cd api && npm install && npx prisma generate && cd -
cd ui && npm install && cd -
```

## Run with Docker Compose

```bash
docker-compose up -d --build
```

Services:
- Postgres: `localhost:5432`
- API: `http://localhost:5000`
- UI: `http://localhost:3000`

## Database Setup

```bash
cd api
npx prisma migrate deploy
npm run prisma:seed # optional
```

## Health Check

```bash
curl http://localhost:5000/health
```

## Development

```bash
# API dev
cd api
npm run dev

# UI dev
cd ../ui
npm run dev
```

## Testing

```bash
# API tests
cd api && npm test

# UI tests
cd ../ui && npm test
```
