/**
 * AWS Lambda entry point.
 * The same Hono app that runs locally via server.ts is wrapped here for Lambda.
 * Deploy this handler with the `lambda-api` CDK/SAM stack.
 */
import { handle } from 'hono/aws-lambda';
import { app } from './app.js';

export const handler = handle(app);
