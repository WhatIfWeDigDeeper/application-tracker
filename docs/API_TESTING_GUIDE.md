# API Testing Guide

## Database Setup

### Prerequisites
- PostgreSQL 16 running locally or via Docker
- Node.js 18+
- npm installed

### Setup Steps

```bash
# 1. Navigate to API directory
cd api

# 2. Install dependencies (already done)
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local to point to your Postgres instance

# 4. Run migrations
npx prisma migrate deploy

# 5. Seed sample data
npm run seed

# 6. Start the server
npm run dev
```

## Testing Endpoints with cURL

### Health Check
```bash
curl http://localhost:5000/health
# Response: {"status":"ok","timestamp":"2024-01-17T..."}
```

### List Applications
```bash
# All applications
curl http://localhost:5000/applications

# With filters
curl "http://localhost:5000/applications?status=interviewing&limit=10&page=1"
curl "http://localhost:5000/applications?companyCategory=startup&includeArchived=false"
curl "http://localhost:5000/applications?jobSource=referral"
```

### Get Single Application
```bash
curl http://localhost:5000/applications/{id}
```

### Create Application
```bash
curl -X POST http://localhost:5000/applications \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Google",
    "positionTitle": "Senior Backend Engineer",
    "dateApplied": "2024-01-17T10:00:00Z",
    "status": "interviewing",
    "companyCategory": "enterprise",
    "jobSource": "job_board",
    "interviewUrl": "https://meet.google.com/abc-def-ghi",
    "salary": 180000,
    "notes": "Referral from John"
  }'
```

### Update Application
```bash
curl -X PATCH http://localhost:5000/applications/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "offered",
    "notes": "Received offer"
  }'
```

### Archive Application
```bash
curl -X POST http://localhost:5000/applications/{id}/archive
```

### Restore Application
```bash
curl -X POST http://localhost:5000/applications/{id}/restore
```

### Delete Application
```bash
curl -X DELETE http://localhost:5000/applications/{id}
```

### Create Interview Stage
```bash
curl -X POST http://localhost:5000/applications/{id}/interview-stages \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technical Round",
    "order": 1,
    "notes": "Focus on system design"
  }'
```

### Update Interview Stage
```bash
curl -X PATCH http://localhost:5000/applications/{id}/interview-stages/{stageId} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technical Round - Completed",
    "isCompleted": true,
    "completedDate": "2024-01-17T14:00:00Z",
    "performanceRating": 4
  }'
```

### Delete Interview Stage
```bash
curl -X DELETE http://localhost:5000/applications/{id}/interview-stages/{stageId}
```

## Running Tests

### Unit Tests
```bash
npm test
```

### Contract Tests
```bash
npm test -- --testPathPattern=contract
```

### Integration Tests
```bash
npm test -- --testPathPattern=integration
```

### Test Coverage
```bash
npm run test:coverage
```

## Performance Testing with k6

```bash
# Install k6
brew install k6  # macOS
# or
choco install k6  # Windows
# or
sudo apt-get install k6  # Linux

# Run performance tests
npm run perf:test

# Expected output:
# - p95 GET latency: ≤ 200ms
# - p95 POST/PATCH latency: ≤ 500ms
# - p99 latency: ≤ 1000ms
# - Error rate: < 1%
```

## Database Management

### View Database with Prisma Studio
```bash
npm run prisma:studio
# Opens GUI at http://localhost:5555
```

### Query Database Directly
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d application_tracker_dev

# View applications
SELECT id, "companyName", status, "dateApplied" FROM "Application" ORDER BY "dateApplied" DESC;

# View interview stages for an application
SELECT * FROM "InterviewStage" WHERE "applicationId" = '{application-id}' ORDER BY "order";

# Count records
SELECT COUNT(*) FROM "Application";
SELECT COUNT(*) FROM "InterviewStage";
```

### Reset Database
```bash
npx prisma migrate reset
# WARNING: This drops the database and re-applies all migrations
```

## Debugging

### Enable Debug Logging
```bash
# In .env or .env.local
DEBUG=*
```

### Check Database Connection
```bash
# Test connection from command line
PGPASSWORD=postgres psql -h localhost -U postgres -d application_tracker_dev -c "SELECT 1;"
```

### View Migration Status
```bash
npx prisma migrate status
```

### Check Build Output
```bash
npm run build
# Should complete without errors
```

## Expected Data After Seeding

2 sample applications are created:
1. **Acme Corp** - Senior Backend Engineer
   - Status: interviewing
   - 2 interview stages: Initial Phone Screen (completed), Technical Assessment (pending)

2. **Tech Startup** - Frontend Engineer
   - Status: applied
   - 1 interview stage: First Round (pending)

Query to verify:
```bash
curl http://localhost:5000/applications
# Should return: {"items": [...], "page": 1, "limit": 20, "total": 2}
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm run prisma:generate
npm run build
```

### Database connection refused
- Ensure Postgres is running: `brew services start postgresql`
- Check DATABASE_URL in .env.local
- Verify Postgres user/password credentials

### Migration conflicts
- Ensure no other processes are running migrations
- Check `npx prisma migrate status` for stuck migrations

### Port already in use
- API defaults to port 5000
- Change via `API_PORT` environment variable
- Or kill process: `lsof -i :5000` and `kill -9 <PID>`

## Docker Compose Testing

To test with full Docker stack:

```bash
# Start all services
docker compose up -d

# Wait 15-20 seconds for initialization
sleep 20

# Test API (it should be migrated and seeded)
curl http://localhost:5000/health

# View logs
docker compose logs -f api

# Stop services
docker compose down
```

## CI/CD Integration

Tests are run in GitHub Actions on every push:
- Contract tests (Supertest)
- Integration tests (real DB)
- Performance validation (k6 thresholds)
- Coverage reporting

See `.github/workflows/` for CI configuration.
