import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
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
