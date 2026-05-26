import dotenv from 'dotenv';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { ZodError } from 'zod';
import health from './routes/health.js';
import applications from './routes/applications.js';

dotenv.config();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3030', 'http://localhost:5173', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Error handling for Zod validation errors
app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        code: 'validation_error',
        message: 'Validation failed',
        details: err.issues.map((e) => ({
          field: e.path.map(String).join('.'),
          message: e.message,
        })),
      },
      400
    );
  }

  console.error('Unhandled error:', err);
  return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
});

// Routes
app.route('/health', health);
app.route('/applications', applications);

// 404 handler
app.notFound((c) => {
  return c.json({ code: 'not_found', message: 'Route not found' }, 404);
});

const port = Number(process.env.API_PORT) || 5030;

console.log(`Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);

export default app;
