import { Injectable, Inject } from '@nestjs/common';
import { type Knex } from 'knex';
import { KNEX } from '../database/database.module';

export interface HistoryRow {
  id: string;
  application_id: string;
  sequence: number;
  description: string;
  snapshot: unknown;
  created_at: Date;
}

@Injectable()
export class HistoryService {
  constructor(@Inject(KNEX) private readonly db: Knex) {}

  async recordHistory(
    applicationId: string,
    description: string,
    snapshotBytes: Buffer
  ): Promise<number> {
    const sequence = await this.getNextSequence(applicationId);

    await this.db('application_history')
      .withSchema('react_nestjs_history')
      .insert({
        application_id: applicationId,
        sequence,
        description,
        snapshot: JSON.parse(snapshotBytes.toString('utf-8')),
      });

    return sequence;
  }

  async listHistory(
    applicationId: string,
    page: number,
    limit: number
  ): Promise<{ rows: HistoryRow[]; total: number }> {
    const effectivePage = page > 0 ? page : 1;
    const effectiveLimit = limit > 0 ? limit : 50;
    const offset = (effectivePage - 1) * effectiveLimit;

    const [countResult, rows] = await Promise.all([
      this.db('application_history')
        .withSchema('react_nestjs_history')
        .where({ application_id: applicationId })
        .count<{ count: string }>('* as count')
        .first(),

      this.db('application_history')
        .withSchema('react_nestjs_history')
        .where({ application_id: applicationId })
        .orderBy('sequence', 'desc')
        .limit(effectiveLimit)
        .offset(offset)
        .select('*'),
    ]);

    return {
      rows: rows as HistoryRow[],
      total: Number(countResult?.count ?? 0),
    };
  }

  async getSnapshotAtVersion(
    applicationId: string,
    sequence: number
  ): Promise<Buffer | null> {
    const row = await this.db('application_history')
      .withSchema('react_nestjs_history')
      .where({ application_id: applicationId, sequence })
      .select('snapshot')
      .first();

    if (!row) return null;
    return Buffer.from(JSON.stringify(row.snapshot), 'utf-8');
  }

  async deleteHistory(applicationId: string): Promise<number> {
    const deleted = await this.db('application_history')
      .withSchema('react_nestjs_history')
      .where({ application_id: applicationId })
      .delete();

    return deleted;
  }

  private async getNextSequence(applicationId: string): Promise<number> {
    const result = await this.db('application_history')
      .withSchema('react_nestjs_history')
      .where({ application_id: applicationId })
      .max<{ max: string | null }>('sequence as max')
      .first();

    return Number(result?.max ?? 0) + 1;
  }
}
