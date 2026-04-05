/**
 * Idempotent DynamoDB table setup script.
 * Creates the lambda_api_applications table with GSIs if it doesn't already exist.
 * Run with: npm run setup
 */
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.DYNAMODB_ENDPOINT;

if (!endpoint) {
  console.error(
    'Error: DYNAMODB_ENDPOINT is not set. This script is intended for use with DynamoDB Local.\n' +
    'Copy lambda-api/.env.example to lambda-api/.env and set DYNAMODB_ENDPOINT=http://localhost:8000.'
  );
  process.exit(1);
}

const region = process.env.AWS_REGION || 'us-east-1';
const tableName = process.env.DYNAMODB_TABLE || 'lambda_api_applications';

const client = new DynamoDBClient({
  region,
  ...(endpoint
    ? {
        endpoint,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
        },
      }
    : {}),
});

async function tableExists(): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (err) {
    const error = err as { name?: string };
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw err;
  }
}

async function createTable(): Promise<void> {
  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
        { AttributeName: 'GSI2PK', AttributeType: 'S' },
        { AttributeName: 'GSI2SK', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'GSI2PK', KeyType: 'HASH' },
            { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    })
  );
}

async function main(): Promise<void> {
  console.log(`Connecting to DynamoDB at ${endpoint ?? 'AWS (production)'}...`);
  console.log(`Table: ${tableName}`);

  if (await tableExists()) {
    console.log('Table already exists — skipping creation.');
    return;
  }

  console.log('Creating table...');
  await createTable();
  console.log('Table created successfully.');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
