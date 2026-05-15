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
          projectionType: dynamodb.ProjectionType.ALL,
        },
        {
          indexName: 'GSI2',
          partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
          projectionType: dynamodb.ProjectionType.ALL,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.fn = new nodejs.NodejsFunction(this, 'ApiHandler', {
      entry: path.join(__dirname, '../../src/handler.ts'),
      projectRoot: path.join(__dirname, '../..'),
      depsLockFilePath: path.join(__dirname, '../../package-lock.json'),
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
