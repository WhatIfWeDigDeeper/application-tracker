import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  HttpCode,
  Inject,
  NotFoundException,
  UsePipes,
} from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationsService } from './applications.service.js';
import { CsvService } from './csv.service.js';
import { HistoryClient } from './history.client.js';
import { InterviewStagesService } from './interview-stages.service.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
  ListApplicationsQuerySchema,
  CreateInterviewStageSchema,
  UpdateInterviewStageSchema,
  RestoreRequestSchema,
  type CreateApplicationInput,
  type UpdateApplicationInput,
  type ListApplicationsQuery,
  type CreateInterviewStageInput,
  type UpdateInterviewStageInput,
  type ApplicationResponse,
  type PaginatedApplicationsResponse,
  type PaginatedHistoryResponse,
  type InterviewStageResponse,
} from '../types/api.js';
import { z } from 'zod';

const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

@Controller('applications')
export class ApplicationsController {
  constructor(
    @Inject(ApplicationsService) private applicationsService: ApplicationsService,
    @Inject(CsvService) private csvService: CsvService,
    @Inject(HistoryClient) private historyService: HistoryClient,
    @Inject(InterviewStagesService) private interviewStagesService: InterviewStagesService,
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(ListApplicationsQuerySchema))
  async list(@Query() query: ListApplicationsQuery): Promise<PaginatedApplicationsResponse> {
    return this.applicationsService.listApplications(query);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body(new ZodValidationPipe(CreateApplicationSchema)) input: CreateApplicationInput
  ): Promise<ApplicationResponse> {
    return this.applicationsService.createApplication(input);
  }

  @Post('import')
  async importCsv(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    const file = await req.file();
    if (!file) {
      reply.status(400).send({ code: 'validation_error', message: 'No file uploaded' });
      return;
    }
    const buffer = await file.toBuffer();
    const result = await this.csvService.importFromCsv(buffer);
    reply.status(200).send(result);
  }

  @Get('export')
  async exportCsv(@Res() reply: FastifyReply): Promise<void> {
    const csv = await this.csvService.exportToCsv();
    const date = new Date().toISOString().split('T')[0];
    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="applications-${date}.csv"`)
      .send(csv);
  }

  @Get('sample-csv')
  getSampleCsv(@Res() reply: FastifyReply): void {
    const csv = this.csvService.getSampleCsv();
    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="applications-template.csv"')
      .send(csv);
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ApplicationResponse> {
    const app = await this.applicationsService.getApplication(id);
    if (!app) {
      throw new NotFoundException({ code: 'not_found', message: 'Application not found' });
    }
    return app;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateApplicationSchema)) input: UpdateApplicationInput
  ): Promise<ApplicationResponse> {
    const app = await this.applicationsService.updateApplication(id, input);
    if (!app) {
      throw new NotFoundException({ code: 'not_found', message: 'Application not found' });
    }
    return app;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    const deleted = await this.applicationsService.deleteApplication(id);
    if (!deleted) {
      throw new NotFoundException({ code: 'not_found', message: 'Application not found' });
    }
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string): Promise<ApplicationResponse> {
    const app = await this.applicationsService.archiveApplication(id);
    if (!app) {
      throw new NotFoundException({ code: 'not_found', message: 'Application not found' });
    }
    return app;
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string): Promise<ApplicationResponse> {
    const app = await this.applicationsService.restoreApplication(id);
    if (!app) {
      throw new NotFoundException({ code: 'not_found', message: 'Application not found' });
    }
    return app;
  }

  @Get(':id/history')
  async getHistory(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(HistoryQuerySchema)) query: { page: number; limit: number }
  ): Promise<PaginatedHistoryResponse> {
    return this.historyService.listHistory(id, query.page, query.limit);
  }

  @Post(':id/history/restore')
  @HttpCode(200)
  async restoreVersion(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RestoreRequestSchema)) body: { sequence: number }
  ): Promise<ApplicationResponse> {
    const result = await this.historyService.restoreToVersion(id, body.sequence);
    if (!result) {
      throw new NotFoundException({ code: 'not_found', message: 'History entry not found' });
    }
    return result;
  }

  @Post(':id/interview-stages')
  @HttpCode(201)
  async createStage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateInterviewStageSchema)) input: CreateInterviewStageInput
  ): Promise<InterviewStageResponse> {
    const stage = await this.interviewStagesService.createInterviewStage(id, input);
    if (!stage) {
      throw new NotFoundException({ code: 'not_found', message: 'Application not found' });
    }
    return stage;
  }

  @Patch(':id/interview-stages/:stageId')
  async updateStage(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body(new ZodValidationPipe(UpdateInterviewStageSchema)) input: UpdateInterviewStageInput
  ): Promise<InterviewStageResponse> {
    const stage = await this.interviewStagesService.updateInterviewStage(id, stageId, input);
    if (!stage) {
      throw new NotFoundException({ code: 'not_found', message: 'Interview stage not found' });
    }
    return stage;
  }

  @Delete(':id/interview-stages/:stageId')
  @HttpCode(204)
  async deleteStage(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
  ): Promise<void> {
    const deleted = await this.interviewStagesService.deleteInterviewStage(id, stageId);
    if (!deleted) {
      throw new NotFoundException({ code: 'not_found', message: 'Interview stage not found' });
    }
  }
}
