import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class LambdaApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Constructs added in subsequent tasks
  }
}
