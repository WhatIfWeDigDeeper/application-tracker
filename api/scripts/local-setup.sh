#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Application Tracker API - Local Setup & Validation ===${NC}\n"

# Step 1: Check if Postgres is running locally
echo -e "${YELLOW}Step 1: Checking Postgres connection...${NC}"
PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -c "SELECT 1" > /dev/null 2>&1 || {
  echo -e "${YELLOW}WARNING: Postgres not found at localhost:5432${NC}"
  echo "You'll need to start Postgres manually or use Docker Compose:"
  echo "  docker compose up -d postgres"
  echo ""
  exit 1
}
echo -e "${GREEN}✓ Postgres is running${NC}\n"

# Step 2: Create database if it doesn't exist
echo -e "${YELLOW}Step 2: Creating database...${NC}"
PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -c "CREATE DATABASE application_tracker_dev;" 2>/dev/null || true
echo -e "${GREEN}✓ Database ready${NC}\n"

# Step 3: Run migrations
echo -e "${YELLOW}Step 3: Running Prisma migrations...${NC}"
cd api
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations applied${NC}\n"

# Step 4: Generate Prisma client
echo -e "${YELLOW}Step 4: Generating Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}\n"

# Step 5: Seed data
echo -e "${YELLOW}Step 5: Seeding sample data...${NC}"
npm run seed
echo -e "${GREEN}✓ Sample data loaded${NC}\n"

# Step 6: Start API server
echo -e "${YELLOW}Step 6: Starting API server...${NC}"
npm run dev &
API_PID=$!
sleep 3

echo -e "${GREEN}✓ API server running (PID: $API_PID)${NC}\n"

# Step 7: Validate endpoints
echo -e "${YELLOW}Step 7: Validating API endpoints...${NC}\n"

# Health check
echo "Testing GET /health..."
HEALTH=$(curl -s http://localhost:5000/health)
if [[ $HEALTH == *"ok"* ]]; then
  echo -e "${GREEN}✓ Health endpoint working${NC}"
else
  echo -e "${RED}✗ Health endpoint failed${NC}"
  kill $API_PID
  exit 1
fi

# List applications
echo "Testing GET /applications..."
APPS=$(curl -s http://localhost:5000/applications)
if [[ $APPS == *"items"* ]]; then
  echo -e "${GREEN}✓ Applications list endpoint working${NC}"
  echo "  Response: $(echo $APPS | jq '.total') applications found"
else
  echo -e "${RED}✗ Applications endpoint failed${NC}"
  kill $API_PID
  exit 1
fi

echo ""
echo -e "${GREEN}=== All validations passed! ===${NC}"
echo ""
echo "API is running at http://localhost:5000"
echo ""
echo "Available endpoints:"
echo "  GET    /health"
echo "  GET    /applications?status=applied&page=1&limit=20"
echo "  POST   /applications (with body)"
echo "  GET    /applications/:id"
echo "  PATCH  /applications/:id (with body)"
echo "  DELETE /applications/:id"
echo "  POST   /applications/:id/archive"
echo "  POST   /applications/:id/restore"
echo "  POST   /applications/:id/interview-stages"
echo "  PATCH  /applications/:id/interview-stages/:stageId"
echo "  DELETE /applications/:id/interview-stages/:stageId"
echo ""
echo "Running tests..."
npm test
echo ""
echo -e "${GREEN}Setup complete!${NC}"
kill $API_PID
