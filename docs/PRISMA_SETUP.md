# Prisma Setup & Database Management

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
cd /Users/greg/code/application-tracker
docker compose up -d

# Migrations and seeding run automatically in the API container
# Wait 10-15 seconds for services to be ready

# Test the API
curl http://localhost:5000/health
```

### Option 2: Local Postgres

Prerequisites:
- PostgreSQL 16 running on localhost:5432
- Postgres user: `postgres`, password: `postgres`

```bash
cd /Users/greg/code/application-tracker/api

# Run the automated setup script
bash scripts/local-setup.sh

# Or manually:
npx prisma migrate deploy    # Apply migrations
npm run seed                 # Load sample data
npm run dev                  # Start API server
```

## Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration from schema changes
npx prisma migrate dev --name <migration_name>

# Apply pending migrations to database
npx prisma migrate deploy

# Reset database (WARNING: deletes all data!)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Open Prisma Studio (GUI for database)
npx prisma studio

# Seed the database with sample data
npm run seed
```

## Database Schema

### Application Model
- `id`: UUID (Primary Key)
- `companyName`: String
- `positionTitle`: String
- `dateApplied`: DateTime
- `status`: Enum (unsubmitted, applied, interviewing, offered, rejected, accepted)
- `interviewUrl`: String (optional)
- `onsite`: Boolean (optional)
- `salary`: Integer (optional)
- `companyCategory`: Enum (startup, scale_up, mid_market, enterprise, other)
- `jobSource`: Enum (referral, job_board, company_website, recruiter, other)
- `notes`: String (optional)
- `isArchived`: Boolean (default: false)
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `interviewStages`: InterviewStage[] (1:N relation, cascade delete)

### InterviewStage Model
- `id`: UUID (Primary Key)
- `applicationId`: UUID (Foreign Key → Application)
- `name`: String
- `order`: Integer
- `isCompleted`: Boolean (default: false)
- `completedDate`: DateTime (optional)
- `notes`: String (optional)
- `performanceRating`: Integer (optional, 1-5)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Indexes
- Application: `status`, `isArchived`
- InterviewStage: `applicationId`

## Cascade Delete
When an Application is deleted, all associated InterviewStages are automatically deleted (defined in schema).

## Environment Variables

**For Docker:**
```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/application_tracker_dev
API_PORT=5000
NODE_ENV=development
```

**For Local Dev:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/application_tracker_dev
API_PORT=5000
NODE_ENV=development
```

## Migrations

Migrations are stored in `/api/prisma/migrations/`. Each migration is timestamped and includes:
- `migration.sql`: SQL DDL statements
- `migration_lock.toml`: Lock file to prevent concurrent migrations

Current migrations:
- `0_init/migration.sql`: Initial schema (Application + InterviewStage models, enums, indexes)

## Seeding

Sample data includes:
- 2 Applications (Acme Corp, Tech Startup)
- Multiple InterviewStages per application
- Varied statuses, dates, and metadata

Run `npm run seed` to populate.

## Troubleshooting

### Migration Conflicts
If you see migration conflicts, ensure no two devs are running `prisma migrate dev` simultaneously.

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
Ensure Postgres is running:
```bash
# Start via Docker
docker compose up -d postgres

# Or locally via Homebrew
brew services start postgresql
```

### Reset Everything
```bash
# Drops and recreates database, applies all migrations
npx prisma migrate reset
```

### View Data
```bash
# Interactive GUI
npx prisma studio

# Or query via psql
PGPASSWORD=postgres psql -h localhost -U postgres -d application_tracker_dev
```

## Testing

Tests use a test database. Before running tests, ensure `.env.test` is configured with a test database URL:

```bash
npm test
```

Contract tests validate API contracts without DB integration.
Integration tests use a real test database.

See [CONTRACT_TESTS.md](./docs/CONTRACT_TESTS.md) for details.
