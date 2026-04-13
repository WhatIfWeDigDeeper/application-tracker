import { Injectable, Inject } from '@nestjs/common';
import Papa from 'papaparse';
import { DRIZZLE, type DrizzleDB } from '../database/database.provider.js';
import { applications } from '../database/schema.js';
import { HistoryClient, buildDescription } from './history.client.js';
import { CsvRowSchema, type ImportResult } from '../types/api.js';
import { isNotNull, sql } from 'drizzle-orm';

const CSV_COLUMNS = [
  'companyName', 'positionTitle', 'dateApplied', 'status',
  'companyUrl', 'jobPostingUrl', 'companyCareerUrl', 'companyCategory',
  'skillsMatch', 'jobSource', 'coverLetterRequired', 'specialRequirements',
  'salaryMin', 'salaryMax', 'notes', 'offerDueDate', 'isArchived',
] as const;

@Injectable()
export class CsvService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    @Inject(HistoryClient) private historyService: HistoryClient,
  ) {}

  async getExistingJobPostingUrls(): Promise<Set<string>> {
    const rows = await this.db
      .select({ url: applications.jobPostingUrl })
      .from(applications)
      .where(isNotNull(applications.jobPostingUrl));
    return new Set(rows.map(r => r.url!));
  }

  async importFromCsv(buffer: Buffer): Promise<ImportResult> {
    const content = buffer.toString('utf-8');
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return { imported: 0, skipped: 0, errors: [{ row: 1, message: 'Failed to parse CSV file' }] };
    }

    const existingUrls = await this.getExistingJobPostingUrls();
    const seenUrls = new Set<string>();
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < parsed.data.length; i++) {
      const rowNum = i + 2; // 1-based, +1 for header row
      const rawRow = parsed.data[i] as Record<string, string>;

      // Convert empty strings to undefined
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rawRow)) {
        cleaned[key] = value === '' ? undefined : value;
      }

      // Validate
      const validation = CsvRowSchema.safeParse(cleaned);
      if (!validation.success) {
        const messages = validation.error.issues.map(e => `${e.path.map(String).join('.')}: ${e.message}`);
        result.errors.push({ row: rowNum, message: messages.join('; ') });
        continue;
      }

      const row = validation.data;

      // Duplicate detection
      if (row.jobPostingUrl) {
        if (existingUrls.has(row.jobPostingUrl) || seenUrls.has(row.jobPostingUrl)) {
          result.skipped++;
          continue;
        }
        seenUrls.add(row.jobPostingUrl);
      }

      // Insert
      try {
        const [app] = await this.db.insert(applications).values({
          companyName: row.companyName,
          positionTitle: row.positionTitle,
          dateApplied: row.dateApplied ?? null,
          status: row.status ?? 'unsubmitted',
          companyUrl: row.companyUrl ?? null,
          jobPostingUrl: row.jobPostingUrl ?? null,
          companyCareerUrl: row.companyCareerUrl ?? null,
          companyCategory: row.companyCategory ?? null,
          skillsMatch: row.skillsMatch ?? null,
          jobSource: row.jobSource ?? null,
          coverLetterRequired: row.coverLetterRequired ?? null,
          specialRequirements: row.specialRequirements ?? null,
          salaryMin: row.salaryMin ?? null,
          salaryMax: row.salaryMax ?? null,
          notes: row.notes ?? null,
          offerDueDate: row.offerDueDate ?? null,
          isArchived: row.isArchived ?? false,
        }).returning();

        await this.historyService.recordHistory(app.id, buildDescription('create', 'Imported from CSV'));
        result.imported++;
      } catch (error) {
        result.errors.push({ row: rowNum, message: `Database error: ${(error as Error).message}` });
      }
    }

    return result;
  }

  async exportToCsv(): Promise<string> {
    const rows = await this.db
      .select()
      .from(applications)
      .orderBy(sql`${applications.dateApplied} NULLS LAST`);

    const csvRows = rows.map(app => ({
      companyName: app.companyName,
      positionTitle: app.positionTitle,
      dateApplied: app.dateApplied ?? '',
      status: app.status,
      companyUrl: app.companyUrl ?? '',
      jobPostingUrl: app.jobPostingUrl ?? '',
      companyCareerUrl: app.companyCareerUrl ?? '',
      companyCategory: app.companyCategory ?? '',
      skillsMatch: app.skillsMatch !== null ? String(app.skillsMatch) : '',
      jobSource: app.jobSource ?? '',
      coverLetterRequired: app.coverLetterRequired !== null ? String(app.coverLetterRequired) : '',
      specialRequirements: app.specialRequirements ?? '',
      salaryMin: app.salaryMin !== null ? String(app.salaryMin) : '',
      salaryMax: app.salaryMax !== null ? String(app.salaryMax) : '',
      notes: app.notes ?? '',
      offerDueDate: app.offerDueDate ?? '',
      isArchived: String(app.isArchived),
    }));

    return Papa.unparse(csvRows, { columns: [...CSV_COLUMNS] });
  }

  getSampleCsv(): string {
    const header = CSV_COLUMNS.join(',');
    const example = 'Acme Corp,Software Engineer,2026-01-15,applied,https://acme.com,https://acme.com/jobs/123,https://acme.com/careers,ai,4,linkedin,false,Must have 3+ years React experience,80000,120000,Great company culture,,false';
    return `${header}\n${example}\n`;
  }
}
