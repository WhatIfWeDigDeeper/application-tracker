# Lambda API CDK Deployment Design

**Date:** 2026-04-05  
**Status:** Complete  
**Scope:** Add AWS CDK infrastructure-as-code to `lambda-api` for learning/experimentation; enable optional LocalStack deployment; add HTTP API Gateway v2.

---

## Goal

Add AWS CDK support to the existing `lambda-api` package so the Hono + DynamoDB Lambda stack can be synthesized, deployed to LocalStack locally, and optionally deployed to real AWS. The primary goal is learning — actual production deployment is optional and future.

---

## Architecture

```
lambda-api/
  src/           ← existing Hono app (unchanged)
  cdk/
    bin/
      app.ts     ← CDK app entry point
    lib/
      lambda-api-stack.ts  ← single stack: DynamoDB + Lambda + HTTP API
    cdk.json
    package.json ← CDK deps isolated from runtime
    tsconfig.json
```

The CDK package is self-contained under `lambda-api/cdk/` with its own `package.json`. CDK's heavy dependency tree does not affect the Lambda bundle size — `NodejsFunction` uses esbuild to bundle `src/handler.ts` independently at synth time.

---

## Components

### DynamoDB Table (`TableV2`)

Replicates the schema defined in `lambda-api/scripts/setup-dynamodb.ts` exactly:

- **Table name:** `lambda_api_applications`
- **Partition key:** `PK` (String)
- **Sort key:** `SK` (String)
- **Billing:** `PAY_PER_REQUEST` (on-demand)
- **GSI1:** `GSI1PK` / `GSI1SK` — filter by status + archived, sort by updatedAt
- **GSI2:** `GSI2PK` / `GSI2SK` — all active apps, sorted by updatedAt
- **Removal policy:** `DESTROY` — appropriate for learning/dev; change to `RETAIN` before any real data usage

### Lambda Function (`NodejsFunction`)

- **Entry:** `lambda-api/src/handler.ts`
- **Handler export:** `handler`
- **Runtime:** Node.js 22.x
- **Bundling:** esbuild, ESM output format, all deps bundled (no Lambda layer)
- **Timeout:** 29 seconds (HTTP API Gateway v2 maximum)
- **Memory:** 256 MB
- **Environment variables injected by CDK:**
  - `DYNAMODB_TABLE` — table name from the stack
  - `AWS_REGION` — stack region
- **IAM:** `table.grantReadWriteData(fn)` — CDK generates the policy automatically

### HTTP API Gateway v2 (`HttpApi`)

- **API name:** `lambda-api`
- **Route:** `/{proxy+}` ANY — Hono handles all routing internally
- **Integration:** `HttpLambdaIntegration` → Lambda function
- **CORS:** mirrors `app.ts` config (`localhost:3000`, `localhost:3090`, all methods)
- **Output:** `CfnOutput` prints the API URL after deployment

---

## LocalStack Integration

LocalStack runs as an opt-in Docker Compose profile — excluded from default `docker compose up`:

```yaml
# docker-compose.yml addition
localstack:
  image: localstack/localstack:4
  profiles: [localstack]
  ports: ["4566:4566"]
  environment:
    - SERVICES=lambda,dynamodb,apigatewayv2
    - DEFAULT_REGION=us-east-1
    - LAMBDA_EXECUTOR=local
  volumes:
    - ./data/localstack:/var/lib/localstack
    - /var/run/docker.sock:/var/run/docker.sock
```

- Start with: `docker compose --profile localstack up -d localstack`
- `data/localstack/` added to `.gitignore`
- `aws-cdk-local` package provides the `cdklocal` CLI wrapper that redirects all AWS SDK calls to `localhost:4566`
- No real AWS credentials needed for LocalStack deployments

The existing `dynamodb-local` service is unchanged — it remains the default for fast day-to-day development.

---

## Scripts

### Root `package.json` additions

| Script | Command |
|--------|---------|
| `cdk:synth` | `npm run --prefix lambda-api/cdk synth` |
| `cdk:deploy` | `npm run --prefix lambda-api/cdk deploy` |
| `cdk:deploy:local` | `npm run --prefix lambda-api/cdk deploy:local` |
| `cdk:diff` | `npm run --prefix lambda-api/cdk diff` |
| `cdk:destroy` | `npm run --prefix lambda-api/cdk destroy` |

### `lambda-api/cdk/package.json` scripts

| Script | Command |
|--------|---------|
| `synth` | `cdk synth` |
| `deploy` | `cdk deploy` |
| `deploy:local` | `cdklocal deploy` |
| `diff` | `cdk diff` |
| `destroy` | `cdk destroy` |

---

## Workflows

### Day-to-day development (unchanged)
```bash
docker compose up -d dynamodb-local
npm run dev:lambda-api
```

### CDK learning / LocalStack
```bash
docker compose --profile localstack up -d localstack

# First time only — bootstrap LocalStack
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test npx cdklocal bootstrap

# Deploy
npm run cdk:deploy:local
# → prints LocalStack API Gateway URL

# Tear down
npm run cdk:destroy
```

### Real AWS deployment (future)
```bash
npm run cdk:synth    # preview CloudFormation template
npm run cdk:deploy   # deploy to AWS account
```

---

## What Is Not In Scope

- CI/CD pipeline for automated deployment
- Multi-environment config (dev/prod stages)
- Custom domain names
- CloudWatch alarms or dashboards
- VPC or private networking

These are intentionally deferred — the goal is a clean learning foundation, not a production-ready platform.
