import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { HistoryService } from './history.service';
import type {
  RecordHistoryRequest,
  RecordHistoryResponse,
  ListHistoryRequest,
  ListHistoryResponse,
  GetSnapshotAtVersionRequest,
  GetSnapshotAtVersionResponse,
  DeleteHistoryRequest,
  DeleteHistoryResponse,
} from '../generated/history/v1/history';

@Controller()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @GrpcMethod('HistoryService', 'RecordHistory')
  async recordHistory(request: RecordHistoryRequest): Promise<RecordHistoryResponse> {
    const sequence = await this.historyService.recordHistory(
      request.applicationId,
      request.description,
      Buffer.from(request.snapshot)
    );
    return { sequence };
  }

  @GrpcMethod('HistoryService', 'ListHistory')
  async listHistory(request: ListHistoryRequest): Promise<ListHistoryResponse> {
    const page = request.page || 1;
    const limit = request.limit || 50;
    const { rows, total } = await this.historyService.listHistory(request.applicationId, page, limit);

    return {
      entries: rows.map((row) => ({
        id: row.id,
        sequence: row.sequence,
        description: row.description,
        createdAt: row.created_at.toISOString(),
        snapshot: Buffer.from(JSON.stringify(row.snapshot), 'utf-8'),
      })),
      total,
      page,
      limit,
    };
  }

  @GrpcMethod('HistoryService', 'GetSnapshotAtVersion')
  async getSnapshotAtVersion(request: GetSnapshotAtVersionRequest): Promise<GetSnapshotAtVersionResponse> {
    const snapshotBytes = await this.historyService.getSnapshotAtVersion(
      request.applicationId,
      request.sequence
    );

    if (!snapshotBytes) {
      return { snapshot: new Uint8Array(), found: false };
    }

    return { snapshot: snapshotBytes, found: true };
  }

  @GrpcMethod('HistoryService', 'DeleteHistory')
  async deleteHistory(request: DeleteHistoryRequest): Promise<DeleteHistoryResponse> {
    const deletedCount = await this.historyService.deleteHistory(request.applicationId);
    return { deletedCount };
  }
}
