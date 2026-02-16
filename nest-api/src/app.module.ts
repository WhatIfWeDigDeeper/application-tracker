import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [DatabaseModule, ApplicationsModule, HealthModule],
})
export class AppModule {}
