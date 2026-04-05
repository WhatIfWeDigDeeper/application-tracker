import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
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

describe('Lambda Function', () => {
  it('creates a Lambda function with Node.js 22.x runtime', () => {
    const template = buildTemplate();
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Timeout: 29,
      MemorySize: 256,
    });
  });

  it('sets DYNAMODB_TABLE environment variable pointing to the applications table', () => {
    const template = buildTemplate();
    // DYNAMODB_TABLE resolves to a CloudFormation Ref at synth time (not a literal string)
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          DYNAMODB_TABLE: Match.anyValue(),
        },
      },
    });
    // Verify the Ref points to the DynamoDB table resource (table name is hardcoded in that resource)
    const resources = template.findResources('AWS::Lambda::Function', {
      Properties: {
        Environment: {
          Variables: {
            DYNAMODB_TABLE: Match.anyValue(),
          },
        },
      },
    });
    const fnProps = Object.values(resources)[0].Properties;
    const tableRef: unknown = fnProps.Environment.Variables.DYNAMODB_TABLE;
    // The value should be a Ref to the DynamoDB table logical ID
    expect(tableRef).toMatchObject({ Ref: expect.stringContaining('ApplicationsTable') });
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
