import { Global, Module } from '@nestjs/common';
import { drizzleProvider, DRIZZLE } from './database.provider.js';

@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
