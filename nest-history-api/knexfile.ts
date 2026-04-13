import type { Knex } from 'knex';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '.env') });

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: ['react_nestjs_history'],
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: join(__dirname, 'migrations'),
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};

export default config;
