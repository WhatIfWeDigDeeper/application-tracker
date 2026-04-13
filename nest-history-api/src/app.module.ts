import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [DatabaseModule, HistoryModule],
})
export class AppModule {}
