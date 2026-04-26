import { Injectable, Inject } from '@nestjs/common';
import { type Knex } from 'knex';
import { KNEX } from '../database/database.module';
import {
  parseSnapshot,
  clampPagination,
  toDate,
  encodeSnapshot,
  countFromQuery,
} from './history-logic';

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
    snapshotBytes: Buffer,
  ): Promise<number> {
    const snapshot = parseSnapshot(snapshotBytes);

    return await this.db.transaction(async (trx) => {
      const sequence = await this.getNextSequence(applicationId, trx);

      await trx('application_history')
        .withSchema('react_nestjs_history')
        .insert({
          application_id: applicationId,
          sequence,
          description,
          snapshot,
        });

      return sequence;
    });
  }

  async listHistory(
    applicationId: string,
    page: number,
    limit: number,
  ): Promise<{ rows: HistoryRow[]; total: number }> {
    const { limit: effectiveLimit, offset } = clampPagination(page, limit);

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
      rows: (rows as HistoryRow[]).map((row) => ({
        ...row,
        created_at: toDate(row.created_at),
      })),
      total: countFromQuery(countResult),
    };
  }

  async getSnapshotAtVersion(
    applicationId: string,
    sequence: number,
  ): Promise<Buffer | null> {
    const row = await this.db('application_history')
      .withSchema('react_nestjs_history')
      .where({ application_id: applicationId, sequence })
      .select('snapshot')
      .first();

    if (!row) return null;
    return encodeSnapshot(row.snapshot);
  }

  private async getNextSequence(applicationId: string, trx: Knex.Transaction): Promise<number> {
    const maxRow = await trx('application_history')
      .withSchema('react_nestjs_history')
      .where({ application_id: applicationId })
      .max<{ max: string | null }>('sequence as max')
      .first();
    return Number(maxRow?.max ?? 0) + 1;
  }

  async deleteHistory(applicationId: string): Promise<number> {
    return await this.db('application_history')
      .withSchema('react_nestjs_history')
      .where({ application_id: applicationId })
      .delete();
  }
}
