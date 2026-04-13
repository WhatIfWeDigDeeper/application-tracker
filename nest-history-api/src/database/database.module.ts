import { Module, Global } from '@nestjs/common';
import knex, { type Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

export const KNEX = Symbol('KNEX');

@Global()
@Module({
  providers: [
    {
      provide: KNEX,
      useFactory: (): Knex => {
        const url = process.env.DATABASE_URL;
        if (!url) {
          throw new Error(
            'DATABASE_URL is not set. Copy nest-history-api/.env.example to nest-history-api/.env and fill in your connection string.',
          );
        }
        return knex({
          client: 'pg',
          connection: url,
          searchPath: ['react_nestjs_history'],
          pool: { min: 1, max: 10 },
        });
      },
    },
  ],
  exports: [KNEX],
})
export class DatabaseModule {}
