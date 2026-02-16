import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';
import { HistoryService } from './history.service.js';
import { InterviewStagesService } from './interview-stages.service.js';

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, HistoryService, InterviewStagesService],
})
export class ApplicationsModule {}
