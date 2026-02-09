# Database Setup Guide

This guide explains how to set up the PostgreSQL database with all schemas for different implementations.

## Prerequisites

- PostgreSQL 18 installed and running (or use Docker Compose)
- Node.js and npm installed

## Architecture Overview

All implementations share a single PostgreSQL database (`app_tracker`) with separate schemas:
- `express_prisma` - Root Express + Prisma implementation
- `react_koa` - React + Koa + raw PostgreSQL implementation
- `svelte_hono` - Svelte + Hono + Drizzle ORM implementation
- `vue_nuxt` - Vue + Nuxt + Drizzle ORM implementation

---

## Quick Start: Using Docker Compose

The easiest way to set up everything is using Docker Compose, which handles database creation, schema setup, and seeding automatically.

### Root Implementation (Express + Prisma)

```bash
# Start Postgres and run migrations with seed data
docker compose up -d

# The docker-compose.yml automatically:
# - Creates the app_tracker database
# - Runs Prisma migrations (creates express_prisma schema)
# - Seeds sample data
```

### Individual Implementations

Each implementation has its own docker-compose:

```bash
# React + Koa + PostgreSQL
cd implementations/react-koa-pg
docker compose up -d

# Svelte + Hono + Drizzle
cd implementations/svelte-hono-drizzle
docker compose up -d

# Vue + Nuxt + Drizzle
cd nuxt-api
docker compose up -d
```

---

## Manual Setup: Local PostgreSQL

If you prefer to use a local PostgreSQL instance instead of Docker:

### Step 1: Create the Database

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres

# Create the database
CREATE DATABASE app_tracker;

# Exit psql
\q
```

### Step 2: Set Up Each Implementation

#### Root Implementation (Express + Prisma)

```bash
# Set the DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_tracker?schema=express_prisma"

# Install dependencies
cd api
npm install

# Run Prisma migrations (creates express_prisma schema + tables)
npm run prisma:migrate:deploy

# Generate Prisma client
npm run prisma:generate

# Seed sample data
npm run seed

# Start the API server
npm run dev
```

#### React + Koa + PostgreSQL

```bash
# Set the DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_tracker?schema=react_koa"

# Install dependencies
cd implementations/react-koa-pg/koa-api
npm install

# Run migrations (creates react_koa schema + tables from schema.sql)
npm run db:migrate

# Seed sample data
npm run db:seed

# Start the API server
npm run dev
```

#### Svelte + Hono + Drizzle

```bash
# Set the DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_tracker?schema=svelte_hono"

# Install dependencies
cd implementations/svelte-hono-drizzle/hono-api
npm install

# Push Drizzle schema to database (creates svelte_hono schema + tables)
npm run db:push

# Note: This implementation doesn't have a seed script yet
# You can create data through the API

# Start the API server
npm run dev
```

#### Vue + Nuxt + Drizzle

```bash
# Set the DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_tracker?schema=vue_nuxt"

# Install dependencies
cd nuxt-api
npm install

# Push Drizzle schema to database (creates vue_nuxt schema + tables)
npm run db:push

# Start the Nuxt API server
npm run dev
```

---

## Verifying the Setup

### Check All Schemas Exist

```bash
psql -h localhost -U postgres -d app_tracker -c "\dn"
```

Expected output should show:
```
       List of schemas
      Name       |  Owner
-----------------+----------
 express_prisma  | postgres
 react_koa       | postgres
 svelte_hono     | postgres
 vue_nuxt        | postgres
 public          | postgres
```

### Check Tables in Each Schema

```bash
# Express Prisma schema
psql -h localhost -U postgres -d app_tracker -c "\dt express_prisma.*"

# React Koa schema
psql -h localhost -U postgres -d app_tracker -c "\dt react_koa.*"

# Svelte Hono schema
psql -h localhost -U postgres -d app_tracker -c "\dt svelte_hono.*"

# Vue Nuxt schema
psql -h localhost -U postgres -d app_tracker -c "\dt vue_nuxt.*"
```

---

## Useful Commands

### Prisma (Root + some implementations)

```bash
# Create a new migration
npm run prisma:migrate:dev --name migration_name

# Apply migrations
npm run prisma:migrate:deploy

# Reset database (WARNING: deletes all data)
npm run prisma:migrate:reset

# Open Prisma Studio to view/edit data
npm run prisma:studio
```

### Drizzle (Svelte-Hono implementation)

```bash
# Generate migration files
npm run db:generate

# Push schema changes directly to database
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Raw SQL (React-Koa implementation)

```bash
# Run migrations from schema.sql
npm run db:migrate

# Seed data
npm run db:seed
```

---

## Troubleshooting

### "Database does not exist" error

Make sure the `app_tracker` database exists:
```bash
psql -h localhost -U postgres -c "CREATE DATABASE app_tracker;"
```

### Schema not found

Each implementation creates its own schema during migration/setup. Make sure you've run the migration commands for that specific implementation.

### Connection refused

- Ensure PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check your connection string includes the correct schema parameter
- Verify port 5432 is not blocked

### Port conflicts

If port 5432 is already in use, you can change the PostgreSQL port in docker-compose.yml:
```yaml
ports:
  - "5433:5432"  # Map to different host port
```

Then update your DATABASE_URL to use the new port.

---

## Environment Variables

Each implementation should have a `.env` file with the appropriate DATABASE_URL:

**Root (api/.env):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_tracker?schema=express_prisma
```

**React-Koa (implementations/react-koa-pg/koa-api/.env):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_tracker?schema=react_koa
```

**Svelte-Hono (implementations/svelte-hono-drizzle/hono-api/.env):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_tracker?schema=svelte_hono
```

**Vue-Nuxt (nuxt-api/.env):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_tracker?schema=vue_nuxt
```

---

## Notes

- All schemas are isolated from each other - changes in one won't affect others
- You can run multiple implementations simultaneously as they use different schemas
- Sample/seed data is independent per implementation
- To completely reset everything, drop the entire database and recreate:
  ```bash
  psql -h localhost -U postgres -c "DROP DATABASE app_tracker;"
  psql -h localhost -U postgres -c "CREATE DATABASE app_tracker;"
  ```
  Then re-run the setup steps for each implementation you want to use.
