import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './dynamodb.client.js';
import * as applicationService from './application.service.js';
import type { ApplicationItem } from '../types/dynamo.js';
import {
  ApplicationStatusSchema,
  CompanyCategorySchema,
  JobSourceSchema,
} from '../types/api.js';
import type { ApplicationResponse, ImportResult } from '../types/api.js';

const CSV_HEADERS = [
  'companyName',
  'positionTitle',
  'dateApplied',
  'status',
  'companyUrl',
  'jobPostingUrl',
  'companyCareerUrl',
  'companyCategory',
  'skillsMatch',
  'jobSource',
  'coverLetterRequired',
  'specialRequirements',
  'salaryMin',
  'salaryMax',
  'notes',
  'offerDueDate',
  'isArchived',
] as const;

type CsvRow = Record<(typeof CSV_HEADERS)[number], string>;

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function toCsvRow(row: CsvRow): string {
  return CSV_HEADERS.map((header) => escapeCsvField(row[header] ?? '')).join(',');
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(value);
      value = '';
      if (row.length > 1 || row[0] !== '') {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function hasHeader(row: string[]): boolean {
  return CSV_HEADERS.every((header, index) => (row[index] ?? '').trim() === header);
}

export function serializeToCSV(applications: Array<Record<string, unknown>>): string {
  const lines = [CSV_HEADERS.join(',')];

  for (const app of applications) {
    const row: CsvRow = {
      companyName: String(app.companyName ?? ''),
      positionTitle: String(app.positionTitle ?? ''),
      dateApplied: String(app.dateApplied ?? ''),
      status: String(app.status ?? 'unsubmitted'),
      companyUrl: String(app.companyUrl ?? ''),
      jobPostingUrl: String(app.jobPostingUrl ?? ''),
      companyCareerUrl: String(app.companyCareerUrl ?? ''),
      companyCategory: String(app.companyCategory ?? ''),
      skillsMatch: String(app.skillsMatch ?? ''),
      jobSource: String(app.jobSource ?? ''),
      coverLetterRequired: String(app.coverLetterRequired ?? ''),
      specialRequirements: String(app.specialRequirements ?? ''),
      salaryMin: String(app.salaryMin ?? ''),
      salaryMax: String(app.salaryMax ?? ''),
      notes: String(app.notes ?? ''),
      offerDueDate: String(app.offerDueDate ?? ''),
      isArchived: String(app.isArchived ?? false),
    };

    lines.push(toCsvRow(row));
  }

  return `${lines.join('\n')}\n`;
}

export function parseCSV(text: string): CsvRow[] {
  const rows = parseCsvRows(text);
  if (rows.length === 0) {
    return [];
  }

  const startIndex = hasHeader(rows[0]) ? 1 : 0;

  return rows.slice(startIndex).map((columns) => {
    const row = {} as CsvRow;
    CSV_HEADERS.forEach((header, index) => {
      row[header] = columns[index] ?? '';
    });
    return row;
  });
}

interface DynamoLike {
  send: (command: ScanCommand) => Promise<{ Items?: unknown[]; LastEvaluatedKey?: Record<string, unknown> }>;
}

async function listExistingJobPostingUrls(dynamodb: DynamoLike): Promise<Set<string>> {
  const existing = new Set<string>();
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(SK, :appPrefix)',
        ExpressionAttributeValues: {
          ':appPrefix': 'APP#',
        },
        ProjectionExpression: 'jobPostingUrl',
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    for (const item of (page.Items ?? []) as Array<Pick<ApplicationItem, 'jobPostingUrl'>>) {
      if (item.jobPostingUrl) {
        existing.add(item.jobPostingUrl);
      }
    }

    lastEvaluatedKey = page.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return existing;
}

function toBoolean(input: string): boolean | undefined {
  if (!input) return undefined;
  if (input === 'true') return true;
  if (input === 'false') return false;
  return undefined;
}

function toNumber(input: string): number | undefined {
  if (!input) return undefined;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function importApplications(
  csvText: string,
  dynamodb: DynamoLike = docClient
): Promise<ImportResult> {
  const parsedRows = parseCsvRows(csvText);
  const hasCsvHeader = parsedRows.length > 0 && hasHeader(parsedRows[0]);
  const rows = parseCSV(csvText);
  const existingUrls = await listExistingJobPostingUrls(dynamodb);
  const result: ImportResult = { imported: 0, skipped: 0, failed: 0, errors: [] };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + (hasCsvHeader ? 2 : 1);

    if (!row.companyName || !row.positionTitle) {
      result.failed += 1;
      result.errors.push(`Row ${rowNumber}: missing required companyName or positionTitle`);
      continue;
    }

    if (row.jobPostingUrl && existingUrls.has(row.jobPostingUrl)) {
      result.skipped += 1;
      continue;
    }

    try {
      const statusResult = ApplicationStatusSchema.safeParse(row.status || 'unsubmitted');
      const companyCategoryResult = row.companyCategory
        ? CompanyCategorySchema.safeParse(row.companyCategory)
        : null;
      const jobSourceResult = row.jobSource ? JobSourceSchema.safeParse(row.jobSource) : null;

      if (!statusResult.success) {
        result.failed += 1;
        result.errors.push(`Row ${rowNumber}: invalid status "${row.status}"`);
        continue;
      }

      const skillsMatchNum = toNumber(row.skillsMatch);
      if (skillsMatchNum !== undefined && (skillsMatchNum < 1 || skillsMatchNum > 5)) {
        result.failed += 1;
        result.errors.push(`Row ${rowNumber}: skillsMatch must be between 1 and 5`);
        continue;
      }

      const created = await applicationService.createApplication({
        companyName: row.companyName,
        positionTitle: row.positionTitle,
        dateApplied: row.dateApplied || undefined,
        status: statusResult.data,
        companyUrl: row.companyUrl || undefined,
        jobPostingUrl: row.jobPostingUrl || undefined,
        companyCareerUrl: row.companyCareerUrl || undefined,
        companyCategory: companyCategoryResult?.success ? companyCategoryResult.data : undefined,
        skillsMatch: skillsMatchNum,
        jobSource: jobSourceResult?.success ? jobSourceResult.data : undefined,
        coverLetterRequired: toBoolean(row.coverLetterRequired),
        specialRequirements: row.specialRequirements || undefined,
        salaryMin: toNumber(row.salaryMin),
        salaryMax: toNumber(row.salaryMax),
        notes: row.notes || undefined,
      });

      if (row.offerDueDate || row.isArchived === 'true') {
        await applicationService.updateApplication(created.id, {
          offerDueDate: row.offerDueDate || undefined,
        });

        if (row.isArchived === 'true') {
          await applicationService.archiveApplication(created.id);
        }
      }

      if (row.jobPostingUrl) {
        existingUrls.add(row.jobPostingUrl);
      }

      result.imported += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'import failed'}`);
    }
  }

  return result;
}

export async function exportApplications(
  dynamodb: DynamoLike = docClient,
  includeArchived = false
): Promise<string> {
  void dynamodb;
  const limit = 1000;
  const items: ApplicationResponse[] = [];
  let page = 1;

  while (true) {
    const response = await applicationService.listApplications({
      page,
      limit,
      sortBy: 'updatedAt',
      sortDir: 'desc',
      includeArchived,
    });

    items.push(...response.items);

    if (response.items.length < limit) {
      break;
    }

    page += 1;
  }

  return serializeToCSV(items);
}

export function sampleCsvHeader(): string {
  const sampleRow = [
    'Sample Company',
    'Software Engineer',
    '2026-01-15',
    'applied',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'false',
  ].join(',');

  return `${CSV_HEADERS.join(',')}\n${sampleRow}\n`;
}
