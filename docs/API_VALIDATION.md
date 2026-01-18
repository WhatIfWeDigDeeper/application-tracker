# Local API Validation & Testing Guide

## Current Environment Status

✅ **Available**: Docker, Node.js 18+, npm
❌ **Not Available**: Local PostgreSQL, docker-compose command
❌ **Not Tested Yet**: Real database integration

This guide provides multiple approaches to validate the API implementation.

---

## Approach 1: Contract Tests (In-Memory / Mock Database)

Contract tests validate API endpoints without requiring a real database.

```bash
cd /Users/greg/code/application-tracker/api

# Install dependencies (already done, but verify)
npm install

# Run contract tests
npm test -- --testPathPattern=contract
```

**Expected Output**: Tests discover `/health`, `/applications`, and `/interview-stages` endpoints with Supertest

**What's Being Tested**:
- Health endpoint returns 200 with status: "ok"
- Applications CRUD: list, create, get, update, delete
- Interview stages nested CRUD: create, update, delete
- Error handling: 404 for missing resources, 400 for invalid input
- Filters and pagination: status, companyCategory, jobSource, includeArchived
- Archive/restore operations

---

## Approach 2: Docker-Based Full Stack Validation

If you have Docker running, we can set up PostgreSQL in a container for testing.

### Option A: Manual Docker Commands

```bash
# Create a Docker volume for Postgres data
docker volume create app-tracker-db

# Start PostgreSQL container
docker run -d \
  --name app-tracker-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=application_tracker_dev \
  -p 5432:5432 \
  -v app-tracker-db:/var/lib/postgresql/data \
  postgres:16-alpine

# Wait for Postgres to start
sleep 10

# Verify connection
docker exec app-tracker-postgres \
  psql -U postgres -d application_tracker_dev -c "SELECT 1;"

# Run migrations
cd /Users/greg/code/application-tracker/api
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/application_tracker_dev" \
npm run prisma:migrate:deploy

# Seed data
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/application_tracker_dev" \
npm run seed

# Start API server
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/application_tracker_dev" \
npm run dev

# In another terminal, run tests
npm test

# Stop services
docker stop app-tracker-postgres
docker rm app-tracker-postgres
```

### Option B: Docker Compose (If Available)

```bash
cd /Users/greg/code/application-tracker

# Check if docker-compose is available
docker-compose --version

# If available, start all services
docker-compose up -d

# Wait for services to be healthy (15-20 seconds)
sleep 20

# Check status
docker-compose ps

# View logs
docker-compose logs -f api

# Run tests against live API
cd api && npm test

# Cleanup
docker-compose down
```

---

## Approach 3: Code Analysis & Type Validation

Validate implementation without running against a database.

```bash
cd /Users/greg/code/application-tracker/api

# Type checking
npm run build

# Linting
npm run lint

# Code inspection
find src -name "*.ts" -type f | xargs wc -l | tail -1

# Test discovery
npm test -- --listTests

# Coverage report
npm run test:coverage
```

---

## Approach 4: Manual cURL Testing (After Docker Setup)

Once API is running with a database, test endpoints manually:

```bash
# Health check
curl http://localhost:5000/health

# List applications (should be empty or have seed data)
curl http://localhost:5000/applications

# Create application
curl -X POST http://localhost:5000/applications \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Corp",
    "positionTitle": "Engineer",
    "dateApplied": "2024-01-17T10:00:00Z"
  }'

# Filter applications
curl "http://localhost:5000/applications?status=applied&limit=10"

# Get single application (replace {id})
curl http://localhost:5000/applications/{id}

# Archive application
curl -X POST http://localhost:5000/applications/{id}/archive

# Restore application
curl -X POST http://localhost:5000/applications/{id}/restore
```

---

## Validation Checklist

- [ ] **Type Safety**: `npm run build` completes without errors
- [ ] **Test Discovery**: `npm test -- --listTests` finds 5 test files
- [ ] **Contract Tests**: Contract tests execute (mocked or real DB)
- [ ] **Health Endpoint**: Returns `{ status: "ok", timestamp }`
- [ ] **Applications CRUD**: Create, read, update, delete operations work
- [ ] **Interview Stages**: Nested CRUD operations work
- [ ] **Filters**: Status, category, source filters return correct results
- [ ] **Pagination**: Page/limit parameters work with total count
- [ ] **Error Handling**: 404, 400, 500 errors return standardized format
- [ ] **Archive/Restore**: Applications can be archived and restored
- [ ] **Performance**: Health check < 50ms, list/create < 200ms with real DB

---

## CI/CD Preparation

Once local validation is complete, we'll set up GitHub Actions to:
1. Run contract tests on every push
2. Run integration tests against test database in Docker
3. Run k6 performance tests
4. Report coverage metrics
5. Deploy to staging (optional)

See `.github/workflows/api.yml` for CI configuration.

---

## Debugging Tips

### If migrations fail:
```bash
# Check migration status
npx prisma migrate status

# Reset and re-apply (WARNING: deletes data)
npx prisma migrate reset

# View migration SQL
cat api/prisma/migrations/0_init/migration.sql
```

### If connection fails:
```bash
# Test Postgres connection
PGPASSWORD=postgres psql -h localhost -U postgres -d application_tracker_dev -c "SELECT 1;"

# Or from Docker container
docker exec app-tracker-postgres \
  psql -U postgres -d application_tracker_dev -c "SELECT version();"
```

### If tests fail:
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test api/tests/contract/health.contract.test.ts

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### View database:
```bash
# Prisma Studio (GUI)
npm run prisma:studio

# Direct psql
PGPASSWORD=postgres psql -h localhost -U postgres -d application_tracker_dev

# Within psql:
SELECT * FROM "Application";
SELECT * FROM "InterviewStage";
```

---

## Success Criteria

- ✅ API builds without TypeScript errors
- ✅ Test files are discoverable
- ✅ Contract tests validate endpoint behavior
- ✅ (Optional) Real database integration works with Docker
- ✅ (Optional) All endpoints respond correctly
- ✅ (Optional) Performance meets k6 thresholds

Once these are validated, we proceed to:
- [ ] Documentation updates
- [ ] Security hardening
- [ ] CI/CD integration
- [ ] Production deployment readiness
