import { type Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  useFactory: (): DrizzleDB => {
    const connectionString = process.env.DATABASE_URL!;
    const client = postgres(connectionString);
    return drizzle(client, { schema });
  },
};
