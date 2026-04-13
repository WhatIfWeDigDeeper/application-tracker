import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ApplicationsController } from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';
import { CsvService } from './csv.service.js';
import { HistoryClient, HISTORY_CLIENT } from './history.client.js';
import { InterviewStagesService } from './interview-stages.service.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: HISTORY_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: 'history.v1',
          protoPath: join(process.cwd(), 'proto', 'history', 'v1', 'history.proto'),
          url: `${process.env.HISTORY_GRPC_HOST ?? 'localhost'}:${process.env.HISTORY_GRPC_PORT ?? 50051}`,
        },
      },
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, CsvService, HistoryClient, InterviewStagesService],
})
export class ApplicationsModule {}
