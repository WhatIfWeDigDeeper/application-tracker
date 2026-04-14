# Go API Patterns

- Stack: Go + Gin + pgx/sqlc; go-api port 5070, angular-ui port 3060, DB schema `go_gin`
- **StageInput JSON keys**: Uses `name`/`order` (not `stageName`/`stageOrder`) — must match what Angular frontend sends
- **ApplicationInput validation**: No `binding:"required"` struct tags — validation done in service layer; `UpdateApplication` falls back to existing `companyName`/`positionTitle` when omitted
- **angular-ui proxy**: `/api` → `http://localhost:5070` with `pathRewrite: {'^/api': ''}` in Angular dev proxy config
- **Server startup**: `go run ./cmd/server` compiles and starts; `run-e2e.sh` manages lifecycle via `dev:go-api` npm script
- **Manual restart after kill**: If go-api is killed manually, use `bash scripts/run-e2e.sh angular-ui` (not `npm run test:e2e:angular-ui`) — the npm script does not start the API backend
