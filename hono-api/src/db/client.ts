import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/app_tracker';

// Create postgres connection
const client = postgres(connectionString);

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

export type Database = typeof db;
