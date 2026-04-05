# Lambda API CDK Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-contained AWS CDK package at `lambda-api/cdk/` that defines and deploys the Hono Lambda + DynamoDB + HTTP API Gateway v2 stack, with LocalStack as an opt-in Docker Compose profile.

**Architecture:** A `lambda-api/cdk/` subdirectory with its own `package.json` (CDK deps isolated from the Lambda bundle) contains a single CDK stack (`LambdaApiStack`) that uses `NodejsFunction` to bundle `src/handler.ts` at synth time, `TableV2` for the DynamoDB table, and `HttpApi` for HTTP API Gateway v2. LocalStack is added as a Docker Compose `localstack` profile so it's excluded from default `docker compose up`.

**Tech Stack:** AWS CDK v2 (`aws-cdk-lib`), `NodejsFunction` + esbuild for bundling, `TableV2` (DynamoDB), `HttpApi` (API Gateway v2), `ts-node` for CDK app execution, `aws-cdk-local` (`cdklocal`) for LocalStack, Vitest for CDK assertions tests.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lambda-api/cdk/package.json` | CDK-specific deps isolated from Lambda runtime |
| Create | `lambda-api/cdk/tsconfig.json` | CJS module system for ts-node / CDK toolchain |
| Create | `lambda-api/cdk/cdk.json` | CDK app entry point config |
| Create | `lambda-api/cdk/bin/app.ts` | Instantiates CDK App + LambdaApiStack |
| Create | `lambda-api/cdk/lib/lambda-api-stack.ts` | DynamoDB + Lambda + HTTP API constructs |
| Create | `lambda-api/cdk/test/lambda-api-stack.test.ts` | CDK assertions unit tests |
| Modify | `docker-compose.yml` | Add `localstack` service under `profiles: [localstack]` |
| Modify | `package.json` (root) | Add `cdk:*` scripts |

---

### Task 1: Scaffold the CDK package

**Files:**
- Create: `lambda-api/cdk/package.json`
- Create: `lambda-api/cdk/tsconfig.json`
- Create: `lambda-api/cdk/cdk.json`

- [ ] **Step 1: Create `lambda-api/cdk/package.json` with scripts and pinned non-CDK deps**

Create `lambda-api/cdk/package.json`:

```json
{
  "name": "job-tracker-lambda-api-cdk",
  "version": "1.0.0",
  "description": "AWS CDK stack for Lambda API deployment",
  "private": true,
  "scripts": {
    "synth": "cdk synth",
    "deploy": "cdk deploy --require-approval never",
    "deploy:local": "cdklocal deploy --require-approval never",
    "diff": "cdk diff",
    "destroy": "cdk destroy --force",
    "destroy:local": "cdklocal destroy --force",
    "bootstrap:local": "cdklocal bootstrap",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "25.3.5",
    "typescript": "5.9.3",
    "vitest": "4.1.2"
  }
}
```

- [ ] **Step 2: Install CDK dependencies with exact pinning**

```bash
cd lambda-api/cdk
npm install --save-exact aws-cdk-lib constructs
npm install --save-exact --save-dev aws-cdk aws-cdk-local ts-node
```

Expected: `package.json` now has `dependencies` and additional `devDependencies` entries with exact pinned versions (no `^` or `~`). Verify:

```bash
grep -E '"aws-cdk|"constructs|"ts-node"' lambda-api/cdk/package.json
```

Expected output (versions will vary — confirm they are exact, no carets):
```
"aws-cdk-lib": "2.x.y",
"constructs": "10.x.y",
"aws-cdk": "2.x.y",
"aws-cdk-local": "2.x.y",
"ts-node": "10.x.y",
```

- [ ] **Step 3: Create `lambda-api/cdk/tsconfig.json`**

CDK apps run via `ts-node` which requires CommonJS — this tsconfig is intentionally different from the parent ESM tsconfig:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": false
  },
  "include": ["bin/**/*", "lib/**/*", "test/**/*"],
  "exclude": ["node_modules", "cdk.out"]
}
```

- [ ] **Step 4: Create `lambda-api/cdk/cdk.json`**

```json
{
  "app": "npx ts-node -P tsconfig.json bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig*.json",
      "package*.json",
      "node_modules",
      "test"
    ]
  },
  "context": {}
}
```

- [ ] **Step 5: Commit scaffold**

```bash
git add lambda-api/cdk/
git commit -m "feat(lambda-api): scaffold CDK package with deps and tsconfig"
```

---

### Task 2: Write the CDK app entry point and stack skeleton

**Files:**
- Create: `lambda-api/cdk/bin/app.ts`
- Create: `lambda-api/cdk/lib/lambda-api-stack.ts` (skeleton — no constructs yet)

- [ ] **Step 1: Create `lambda-api/cdk/bin/app.ts`**

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaApiStack } from '../lib/lambda-api-stack';

const app = new cdk.App();
new LambdaApiStack(app, 'LambdaApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
```

- [ ] **Step 2: Create `lambda-api/cdk/lib/lambda-api-stack.ts` skeleton**

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class LambdaApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Constructs added in subsequent tasks
  }
}
```

- [ ] **Step 3: Verify the skeleton compiles and synths**

```bash
cd lambda-api/cdk
npx ts-node -P tsconfig.json bin/app.ts
```

Expected: no output, no errors (the app instantiates silently).

```bash
npx cdk synth
```

Expected: outputs a CloudFormation template YAML with only the CDK metadata resources (no application resources yet).

- [ ] **Step 4: Commit skeleton**

```bash
git add lambda-api/cdk/bin/ lambda-api/cdk/lib/
git commit -m "feat(lambda-api): add CDK app entry point and stack skeleton"
```

---

### Task 3: Implement DynamoDB table (test-first)

**Files:**
- Create: `lambda-api/cdk/test/lambda-api-stack.test.ts`
- Modify: `lambda-api/cdk/lib/lambda-api-stack.ts`

- [ ] **Step 1: Write the failing DynamoDB test**

Create `lambda-api/cdk/test/lambda-api-stack.test.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it, expect } from 'vitest';
import { LambdaApiStack } from '../lib/lambda-api-stack';

function buildTemplate(): Template {
  const app = new cdk.App();
  const stack = new LambdaApiStack(app, 'TestStack');
  return Template.fromStack(stack);
}

describe('DynamoDB Table', () => {
  it('creates a GlobalTable named lambda_api_applications with PAY_PER_REQUEST billing', () => {
    const template = buildTemplate();
    template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      TableName: 'lambda_api_applications',
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  it('has PK (hash) and SK (range) key schema', () => {
    const template = buildTemplate();
    template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
    });
  });

  it('has GSI1 and GSI2 indexes', () => {
    const template = buildTemplate();
    template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
        },
        {
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'GSI2PK', KeyType: 'HASH' },
            { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
          ],
        },
      ],
    });
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd lambda-api/cdk
npx vitest run
```

Expected: 3 tests fail with `Unable to find resources of type AWS::DynamoDB::GlobalTable`.

- [ ] **Step 3: Implement the DynamoDB construct**

Replace `lambda-api/cdk/lib/lambda-api-stack.ts` with:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class LambdaApiStack extends cdk.Stack {
  public readonly table: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.table = new dynamodb.TableV2(this, 'ApplicationsTable', {
      tableName: 'lambda_api_applications',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      globalSecondaryIndexes: [
        {
          indexName: 'GSI1',
          partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        },
        {
          indexName: 'GSI2',
          partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd lambda-api/cdk
npx vitest run
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lambda-api/cdk/test/ lambda-api/cdk/lib/lambda-api-stack.ts
git commit -m "feat(lambda-api): add DynamoDB TableV2 construct with GSI1/GSI2"
```

---

### Task 4: Add Lambda function and HTTP API Gateway (test-first)

**Files:**
- Modify: `lambda-api/cdk/test/lambda-api-stack.test.ts`
- Modify: `lambda-api/cdk/lib/lambda-api-stack.ts`

- [ ] **Step 1: Add failing tests for Lambda and HTTP API**

Append to the `describe` blocks in `lambda-api/cdk/test/lambda-api-stack.test.ts`:

```typescript
describe('Lambda Function', () => {
  it('creates a Lambda function with Node.js 22.x runtime', () => {
    const template = buildTemplate();
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Timeout: 29,
      MemorySize: 256,
    });
  });

  it('sets DYNAMODB_TABLE environment variable', () => {
    const template = buildTemplate();
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          DYNAMODB_TABLE: 'lambda_api_applications',
        },
      },
    });
  });
});

describe('HTTP API Gateway', () => {
  it('creates an HttpApi named lambda-api', () => {
    const template = buildTemplate();
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      Name: 'lambda-api',
      ProtocolType: 'HTTP',
    });
  });

  it('creates a catch-all proxy route', () => {
    const template = buildTemplate();
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'ANY /{proxy+}',
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm new tests fail**

```bash
cd lambda-api/cdk
npx vitest run
```

Expected: original 3 pass, 4 new tests fail.

- [ ] **Step 3: Implement Lambda + HTTP API constructs**

Replace the full `lambda-api/cdk/lib/lambda-api-stack.ts`.

> **Import note:** `aws-apigatewayv2` and `aws-apigatewayv2-integrations` graduated from alpha to stable in `aws-cdk-lib` around v2.130. If you get a TypeScript error that `aws-cdk-lib/aws-apigatewayv2` has no exported member `HttpApi`, your installed version may predate graduation — run `npm install --save-exact --save-dev @aws-cdk/aws-apigatewayv2-alpha @aws-cdk/aws-apigatewayv2-integrations-alpha` (versions must exactly match `aws-cdk-lib`) and update the imports to those packages instead.

```typescript
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';

export class LambdaApiStack extends cdk.Stack {
  public readonly table: dynamodb.TableV2;
  public readonly fn: nodejs.NodejsFunction;
  public readonly api: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.table = new dynamodb.TableV2(this, 'ApplicationsTable', {
      tableName: 'lambda_api_applications',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      globalSecondaryIndexes: [
        {
          indexName: 'GSI1',
          partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        },
        {
          indexName: 'GSI2',
          partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.fn = new nodejs.NodejsFunction(this, 'ApiHandler', {
      entry: path.join(__dirname, '../../src/handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      bundling: {
        format: nodejs.OutputFormat.ESM,
        externalModules: [],
      },
      environment: {
        DYNAMODB_TABLE: this.table.tableName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
    });

    this.table.grantReadWriteData(this.fn);

    this.api = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: 'lambda-api',
      corsPreflight: {
        allowOrigins: ['http://localhost:3000', 'http://localhost:3090'],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    this.api.addRoutes({
      path: '/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: new HttpLambdaIntegration('ApiIntegration', this.fn),
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url ?? 'URL not available',
      description: 'HTTP API Gateway URL',
    });
  }
}
```

> **Note on AWS_NODEJS_CONNECTION_REUSE_ENABLED:** This env var enables HTTP keep-alive for AWS SDK connections in Lambda, reducing cold-start latency. It's a best-practice addition with no downside.

- [ ] **Step 4: Run all tests — confirm all 7 pass**

```bash
cd lambda-api/cdk
npx vitest run
```

Expected: 7 tests pass.

- [ ] **Step 5: Verify full synth produces a complete CloudFormation template**

```bash
cd lambda-api/cdk
npx cdk synth 2>&1 | grep -E "Type: AWS::"
```

Expected output includes all of:
```
Type: AWS::DynamoDB::GlobalTable
Type: AWS::Lambda::Function
Type: AWS::ApiGatewayV2::Api
Type: AWS::ApiGatewayV2::Stage
Type: AWS::ApiGatewayV2::Integration
Type: AWS::ApiGatewayV2::Route
```

- [ ] **Step 6: Commit**

```bash
git add lambda-api/cdk/lib/lambda-api-stack.ts lambda-api/cdk/test/lambda-api-stack.test.ts
git commit -m "feat(lambda-api): add Lambda NodejsFunction and HTTP API Gateway v2 constructs"
```

---

### Task 5: Add LocalStack Docker Compose profile

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add LocalStack service to `docker-compose.yml`**

Add the LocalStack service before the `volumes:` block. The final file should be:

```yaml
services:
  dynamodb-local:
    image: amazon/dynamodb-local:2.5.4
    container_name: app_tracker_dynamodb
    ports:
      - "${DYNAMODB_PORT:-8000}:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath /data"
    user: root
    volumes:
      - ./data/dynamodb:/data
    networks:
      - app_tracker_network

  localstack:
    image: localstack/localstack:4
    container_name: app_tracker_localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=lambda,dynamodb,apigatewayv2,cloudformation,s3,iam,sts
      - DEFAULT_REGION=${AWS_REGION:-us-east-1}
      - LAMBDA_EXECUTOR=local
    volumes:
      - ./data/localstack:/var/lib/localstack
      - /var/run/docker.sock:/var/run/docker.sock
    profiles:
      - localstack
    networks:
      - app_tracker_network

  postgres:
    image: postgres:18-alpine
    container_name: app_tracker_postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-app_tracker}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app_tracker_network

volumes:
  postgres_data:

networks:
  app_tracker_network:
    driver: bridge
  default:
    name: app-tracker-network
```

- [ ] **Step 2: Verify LocalStack is excluded from default `docker compose up`**

```bash
docker compose config --services
```

Expected: `dynamodb-local` and `postgres` listed — **not** `localstack` (profiles-only services are excluded from the default service list).

- [ ] **Step 3: Verify `data/` is gitignored (covers `data/localstack/`)**

```bash
grep "^data/" .gitignore
```

Expected: `data/` — already present, no change needed.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat(infra): add LocalStack Docker Compose profile (opt-in via --profile localstack)"
```

---

### Task 6: Wire root `package.json` scripts

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Add CDK scripts to root `package.json`**

In the `"scripts"` block, add the following entries. Insert them after the `"migrate:lambda-api"` entry (around line 183), keeping alphabetical ordering within the `cdk:*` group:

```json
"cdk:synth": "npm run --prefix lambda-api/cdk synth",
"cdk:deploy": "npm run --prefix lambda-api/cdk deploy",
"cdk:deploy:local": "npm run --prefix lambda-api/cdk deploy:local",
"cdk:bootstrap:local": "npm run --prefix lambda-api/cdk bootstrap:local",
"cdk:diff": "npm run --prefix lambda-api/cdk diff",
"cdk:destroy": "npm run --prefix lambda-api/cdk destroy",
"cdk:destroy:local": "npm run --prefix lambda-api/cdk destroy:local",
"install:lambda-api-cdk": "cd lambda-api/cdk && npm install",
"audit:ci:lambda-api-cdk": "cd lambda-api/cdk && npx -y audit-ci --config .auditconfig.json",
```

- [ ] **Step 2: Create `lambda-api/cdk/.auditconfig.json`**

```json
{
  "moderate": true
}
```

- [ ] **Step 3: Run `npm run cdk:synth` from repo root to confirm the script resolves**

```bash
npm run cdk:synth
```

Expected: CDK synthesizes the CloudFormation template and prints it to stdout. No error.

- [ ] **Step 4: Run security audit**

```bash
cd lambda-api/cdk && npx -y audit-ci --config .auditconfig.json
```

Expected: exits 0. If vulnerabilities are found, resolve them before committing (see CLAUDE.md dependency management section).

- [ ] **Step 5: Commit**

```bash
git add package.json lambda-api/cdk/.auditconfig.json
git commit -m "feat(lambda-api): add cdk:* npm scripts to root package.json"
```

---

### Task 7: Update spec status and final validation

**Files:**
- Modify: `specs/025-lambda-api-cdk/spec.md`

- [ ] **Step 1: Run full CDK test suite one final time**

```bash
npm run --prefix lambda-api/cdk test
```

Expected: all 7 tests pass.

- [ ] **Step 2: Run typecheck**

```bash
npm run --prefix lambda-api/cdk typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 3: Run `cdk synth` from root to confirm end-to-end script works**

```bash
npm run cdk:synth 2>&1 | tail -5
```

Expected: ends with CloudFormation YAML output (no errors).

- [ ] **Step 4: Update spec status to Complete**

In `specs/025-lambda-api-cdk/spec.md`, change:

```
**Status:** Approved
```

to:

```
**Status:** Complete
```

- [ ] **Step 5: Final commit**

```bash
git add specs/025-lambda-api-cdk/spec.md
git commit -m "docs: mark spec 025 lambda-api-cdk as Complete"
```

---

## LocalStack Smoke Test (manual, post-implementation)

Once implementation is complete, optionally verify the full stack deploys to LocalStack:

```bash
# 1. Start LocalStack
docker compose --profile localstack up -d localstack

# 2. Wait ~10s for LocalStack to initialize, then bootstrap (first time only)
npm run cdk:bootstrap:local

# 3. Deploy
npm run cdk:deploy:local
# → Look for "ApiUrl" output at the end, e.g.:
# LambdaApiStack.ApiUrl = https://xxxxxxxx.execute-api.localhost.localstack.cloud:4566/

# 4. Test the health endpoint
curl <ApiUrl>/health

# 5. Tear down when done
npm run cdk:destroy:local
docker compose stop localstack
```
