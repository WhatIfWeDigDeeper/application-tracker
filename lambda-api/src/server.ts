import dotenv from 'dotenv';
import { serve } from '@hono/node-server';
import { app } from './app.js';

dotenv.config();

const port = Number(process.env.PORT) || 5090;

console.log(`Starting lambda-api on port ${port}...`);

serve({ fetch: app.fetch, port });

console.log(`Server running at http://localhost:${port}`);
