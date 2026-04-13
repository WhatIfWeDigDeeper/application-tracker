import { Module, Global } from '@nestjs/common';
import knex, { type Knex } from 'knex';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

export const KNEX = Symbol('KNEX');

@Global()
@Module({
  providers: [
    {
      provide: KNEX,
      useFactory: (): Knex => {
        return knex({
          client: 'pg',
          connection: process.env.DATABASE_URL,
          searchPath: ['react_nestjs_history'],
          pool: { min: 1, max: 10 },
        });
      },
    },
  ],
  exports: [KNEX],
})
export class DatabaseModule {}
