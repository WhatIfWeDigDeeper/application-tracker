import 'dotenv/config';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { schema } from './schema/index.js';
import { prisma } from './db/client.js';
import { getAllApplications, deleteApplication, createApplication, updateApplication, archiveApplication } from './services/application.service.js';
import { createStage, updateStage } from './services/stages.service.js';
import Busboy from 'busboy';

const STATUS_DISPLAY_TO_PRISMA: Record<string, string> = {
  'given offer': 'given_offer',
  'accepted offer': 'accepted_offer',
  'declined offer': 'declined_offer',
  'no offer': 'no_offer',
};

const COMPANY_CATEGORY_MAP: Record<string, string> = {
  'consumer-tech': 'consumer_tech',
  'e-commerce': 'e_commerce',
  'enterprise-software': 'enterprise_software',
  'media-entertainment': 'media_entertainment',
};

const JOB_SOURCE_MAP: Record<string, string> = {
  'company-website': 'company_website',
};

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (d: Buffer) => chunks.push(d));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

async function handleRestCreate(req: IncomingMessage, res: ServerResponse) {
  const body = await readJsonBody(req);
  const app = await createApplication({
    companyName: String(body.companyName ?? ''),
    positionTitle: String(body.positionTitle ?? ''),
    status: (body.status as import('@prisma/client').ApplicationStatus | undefined) ?? undefined,
    dateApplied: body.dateApplied ? String(body.dateApplied) : null,
    jobPostingUrl: body.jobPostingUrl ? String(body.jobPostingUrl) : null,
    companyUrl: body.companyUrl ? String(body.companyUrl) : null,
    companyCareerUrl: body.companyCareerUrl ? String(body.companyCareerUrl) : null,
    skillsMatch: body.skillsMatch != null ? Number(body.skillsMatch) : null,
    salaryMin: body.salaryMin != null ? Number(body.salaryMin) : null,
    salaryMax: body.salaryMax != null ? Number(body.salaryMax) : null,
    coverLetterRequired: body.coverLetterRequired != null ? Boolean(body.coverLetterRequired) : null,
    notes: body.notes ? String(body.notes) : null,
    offerDueDate: body.offerDueDate ? String(body.offerDueDate) : null,
  });
  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    id: app.id, companyName: app.companyName,
    positionTitle: app.positionTitle, status: app.status,
    dateApplied: app.dateApplied ? app.dateApplied.toISOString().split('T')[0] : null,
    companyUrl: app.companyUrl ?? null,
    jobPostingUrl: app.jobPostingUrl ?? null,
  }));
}

async function handleRestUpdate(req: IncomingMessage, res: ServerResponse, id: string) {
  const body = await readJsonBody(req);
  const input: Record<string, unknown> = {};
  if (body.companyName !== undefined) input.companyName = String(body.companyName);
  if (body.positionTitle !== undefined) input.positionTitle = String(body.positionTitle);
  if (body.status !== undefined) input.status = body.status;
  if (body.dateApplied !== undefined) input.dateApplied = body.dateApplied ? String(body.dateApplied) : null;
  if (body.offerDueDate !== undefined) input.offerDueDate = body.offerDueDate ? String(body.offerDueDate) : null;
  const app = await updateApplication(id, input as Parameters<typeof updateApplication>[1]);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    id: app.id, companyName: app.companyName,
    positionTitle: app.positionTitle, status: app.status,
    dateApplied: app.dateApplied ? app.dateApplied.toISOString().split('T')[0] : null,
    offerDueDate: app.offerDueDate ? app.offerDueDate.toISOString().split('T')[0] : null,
  }));
}

async function handleRestCreateStage(req: IncomingMessage, res: ServerResponse, applicationId: string) {
  const body = await readJsonBody(req);
  const stage = await createStage(applicationId, {
    name: String(body.name ?? ''),
    order: typeof body.order === 'number' ? body.order : parseInt(String(body.order ?? '0'), 10),
    isCompleted: Boolean(body.isCompleted),
    completedDate: body.completedDate ? String(body.completedDate) : null,
    performanceRating: body.performanceRating != null ? Number(body.performanceRating) : null,
    notes: body.notes ? String(body.notes) : null,
  });
  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    id: stage.id, name: stage.name, order: stage.order,
    isCompleted: stage.isCompleted,
    completedDate: stage.completedDate ? stage.completedDate.toISOString().split('T')[0] : null,
    performanceRating: stage.performanceRating,
  }));
}

async function handleRestUpdateStage(req: IncomingMessage, res: ServerResponse, applicationId: string, stageId: string) {
  const body = await readJsonBody(req);
  const input: Record<string, unknown> = {};
  if (body.name !== undefined) input.name = String(body.name);
  if (body.order !== undefined) input.order = Number(body.order);
  if (body.isCompleted !== undefined) input.isCompleted = Boolean(body.isCompleted);
  if (body.completedDate !== undefined) input.completedDate = body.completedDate ? String(body.completedDate) : null;
  if (body.performanceRating !== undefined) input.performanceRating = body.performanceRating != null ? Number(body.performanceRating) : null;
  if (body.notes !== undefined) input.notes = body.notes ? String(body.notes) : null;
  const stage = await updateStage(applicationId, stageId, input as Parameters<typeof updateStage>[2]);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    id: stage.id, name: stage.name, order: stage.order,
    isCompleted: stage.isCompleted,
    completedDate: stage.completedDate ? stage.completedDate.toISOString().split('T')[0] : null,
    performanceRating: stage.performanceRating,
  }));
}

const yoga = createYoga({
  schema,
  graphiql: process.env.NODE_ENV !== 'production',
  cors: { origin: ['http://localhost:3080'], credentials: true },
});

const CSV_COLUMNS = [
  'companyName', 'positionTitle', 'dateApplied', 'status',
  'companyUrl', 'jobPostingUrl', 'companyCareerUrl', 'companyCategory',
  'skillsMatch', 'jobSource', 'coverLetterRequired', 'specialRequirements',
  'salaryMin', 'salaryMax', 'notes', 'offerDueDate', 'isArchived',
] as const;

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCSV(row: Record<string, string>): string {
  return CSV_COLUMNS.map((col) => escapeCSV(row[col])).join(',');
}

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"' && content[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(current); current = ''; }
      else if (ch === '\r' && content[i + 1] === '\n') { row.push(current); current = ''; rows.push(row); row = []; i++; }
      else if (ch === '\n') { row.push(current); current = ''; rows.push(row); row = []; }
      else { current += ch; }
    }
  }
  if (current || row.length > 0) { row.push(current); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

async function handleExport(res: ServerResponse) {
  const apps = await prisma.application.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { interviewStages: { orderBy: { order: 'asc' } } },
  });
  const header = CSV_COLUMNS.join(',');
  const rows = apps.map((app) => rowToCSV({
    companyName: app.companyName,
    positionTitle: app.positionTitle,
    dateApplied: app.dateApplied ? app.dateApplied.toISOString().split('T')[0] : '',
    status: app.status,
    companyUrl: app.companyUrl ?? '',
    jobPostingUrl: app.jobPostingUrl ?? '',
    companyCareerUrl: app.companyCareerUrl ?? '',
    companyCategory: app.companyCategory ?? '',
    skillsMatch: app.skillsMatch != null ? String(app.skillsMatch) : '',
    jobSource: app.jobSource ?? '',
    coverLetterRequired: String(app.coverLetterRequired),
    specialRequirements: app.specialRequirements ?? '',
    salaryMin: app.salaryMin != null ? String(app.salaryMin) : '',
    salaryMax: app.salaryMax != null ? String(app.salaryMax) : '',
    notes: app.notes ?? '',
    offerDueDate: app.offerDueDate ? app.offerDueDate.toISOString().split('T')[0] : '',
    isArchived: String(app.isArchived),
  }));
  const csv = [header, ...rows].join('\n') + '\n';
  const date = new Date().toISOString().split('T')[0];
  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="applications-${date}.csv"`,
  });
  res.end(csv);
}

function handleSampleCSV(res: ServerResponse) {
  const header = CSV_COLUMNS.join(',');
  const example = 'Acme Corp,Software Engineer,2026-01-15,applied,https://acme.com,https://acme.com/jobs/123,https://acme.com/careers,ai,4,linkedin,false,Must have 3+ years experience,80000,120000,Great company culture,,false';
  const csv = `${header}\n${example}\n`;
  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': 'attachment; filename="applications-template.csv"',
  });
  res.end(csv);
}

async function handleImport(req: IncomingMessage, res: ServerResponse) {
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('multipart/form-data')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Expected multipart/form-data' }));
    return;
  }

  const fileBuffer = await new Promise<Buffer | null>((resolve, reject) => {
    const bb = Busboy({ headers: req.headers });
    let found: Buffer | null = null;
    bb.on('file', (_name, stream) => {
      const chunks: Buffer[] = [];
      stream.on('data', (d: Buffer) => chunks.push(d));
      stream.on('end', () => { found = Buffer.concat(chunks); });
    });
    bb.on('finish', () => resolve(found));
    bb.on('error', reject);
    req.pipe(bb);
  });

  if (!fileBuffer) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No file uploaded' }));
    return;
  }

  const content = fileBuffer.toString('utf-8');
  const rows = parseCSV(content);
  if (rows.length < 2) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ imported: 0, skipped: 0, errors: [] }));
    return;
  }

  const headers = rows[0];
  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => { colIndex[h.trim()] = i; });

  // Get existing jobPostingUrls for dedup
  const existingApps = await prisma.application.findMany({
    select: { jobPostingUrl: true, companyName: true, positionTitle: true },
  });
  const existingUrls = new Set(existingApps.filter((a) => a.jobPostingUrl).map((a) => a.jobPostingUrl!));
  const existingNamePos = new Set(existingApps.map((a) => `${a.companyName}|||${a.positionTitle}`));

  const seenUrls = new Set<string>();
  const seenNamePos = new Set<string>();
  const result = { imported: 0, skipped: 0, errors: [] as { row: number; message: string }[] };

  const get = (row: string[], col: string): string => {
    const idx = colIndex[col];
    return idx !== undefined ? (row[idx] ?? '').trim() : '';
  };

  for (let i = 1; i < rows.length; i++) {
    const rowNum = i + 1;
    const cols = rows[i];

    const companyName = get(cols, 'companyName');
    const positionTitle = get(cols, 'positionTitle');

    if (!companyName) {
      result.errors.push({ row: rowNum, message: 'companyName is required' });
      continue;
    }
    if (!positionTitle) {
      result.errors.push({ row: rowNum, message: 'positionTitle is required' });
      continue;
    }

    const jobPostingUrl = get(cols, 'jobPostingUrl') || null;

    // Duplicate check
    if (jobPostingUrl) {
      if (existingUrls.has(jobPostingUrl) || seenUrls.has(jobPostingUrl)) {
        result.skipped++;
        continue;
      }
      seenUrls.add(jobPostingUrl);
    } else {
      const key = `${companyName}|||${positionTitle}`;
      if (existingNamePos.has(key) || seenNamePos.has(key)) {
        result.skipped++;
        continue;
      }
      seenNamePos.add(key);
    }

    const statusRaw = get(cols, 'status');
    const validStatuses = ['unsubmitted', 'applied', 'interviewing', 'given offer', 'accepted offer', 'declined offer', 'rejected', 'no offer', 'given_offer', 'accepted_offer', 'declined_offer', 'no_offer'];
    const statusDisplay = validStatuses.includes(statusRaw) ? statusRaw : 'unsubmitted';
    const status = (STATUS_DISPLAY_TO_PRISMA[statusDisplay] ?? statusDisplay);

    const dateAppliedRaw = get(cols, 'dateApplied');
    const dateApplied = dateAppliedRaw ? new Date(dateAppliedRaw) : null;

    const skillsMatchRaw = get(cols, 'skillsMatch');
    const skillsMatch = skillsMatchRaw ? parseInt(skillsMatchRaw, 10) : null;
    if (skillsMatch != null && (isNaN(skillsMatch) || skillsMatch < 1 || skillsMatch > 5)) {
      result.errors.push({ row: rowNum, message: 'skillsMatch must be 1-5' });
      continue;
    }

    const salaryMinRaw = get(cols, 'salaryMin');
    const salaryMaxRaw = get(cols, 'salaryMax');
    const salaryMin = salaryMinRaw ? parseInt(salaryMinRaw, 10) : null;
    const salaryMax = salaryMaxRaw ? parseInt(salaryMaxRaw, 10) : null;

    const coverLetterRaw = get(cols, 'coverLetterRequired');
    const coverLetterRequired = coverLetterRaw === 'true';

    const isArchivedRaw = get(cols, 'isArchived');
    const isArchived = isArchivedRaw.toLowerCase() === 'true';

    try {
      await prisma.application.create({
        data: {
          companyName,
          positionTitle,
          status: status as import('@prisma/client').ApplicationStatus,
          dateApplied,
          companyUrl: get(cols, 'companyUrl') || null,
          jobPostingUrl,
          companyCareerUrl: get(cols, 'companyCareerUrl') || null,
          companyCategory: (() => { const v = get(cols, 'companyCategory'); return (v ? (COMPANY_CATEGORY_MAP[v] ?? v) : null) as import('@prisma/client').CompanyCategory | null; })(),
          skillsMatch,
          jobSource: (() => { const v = get(cols, 'jobSource'); return (v ? (JOB_SOURCE_MAP[v] ?? v) : null) as import('@prisma/client').JobSource | null; })(),
          coverLetterRequired,
          specialRequirements: get(cols, 'specialRequirements') || null,
          salaryMin,
          salaryMax,
          notes: get(cols, 'notes') || null,
          offerDueDate: get(cols, 'offerDueDate') ? new Date(get(cols, 'offerDueDate')) : null,
          isArchived,
        },
      });
      result.imported++;
    } catch (err) {
      result.errors.push({ row: rowNum, message: `Database error: ${(err as Error).message}` });
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

function appToJson(app: Awaited<ReturnType<typeof getAllApplications>>[number]) {
  return {
    id: app.id,
    companyName: app.companyName,
    positionTitle: app.positionTitle,
    status: app.status,
    dateApplied: app.dateApplied ? app.dateApplied.toISOString().split('T')[0] : null,
    offerDueDate: app.offerDueDate ? app.offerDueDate.toISOString().split('T')[0] : null,
    companyUrl: app.companyUrl ?? null,
    jobPostingUrl: app.jobPostingUrl ?? null,
    companyCareerUrl: app.companyCareerUrl ?? null,
    skillsMatch: app.skillsMatch ?? null,
    salaryMin: app.salaryMin ?? null,
    salaryMax: app.salaryMax ?? null,
    isArchived: app.isArchived,
    coverLetterRequired: app.coverLetterRequired,
  };
}

async function handleGetApplicationById(res: ServerResponse, id: string) {
  const app = await prisma.application.findUnique({
    where: { id },
    include: { interviewStages: { orderBy: { order: 'asc' } } },
  });
  if (!app) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(appToJson(app)));
}

async function handleGetApplications(res: ServerResponse, query: URLSearchParams) {
  const status = query.get('status');
  const limit = query.get('limit') ? parseInt(query.get('limit')!, 10) : undefined;
  const includeArchived = query.get('includeArchived') === 'true';
  const apps = await prisma.application.findMany({
    where: {
      ...(status ? { status: status as import('@prisma/client').ApplicationStatus } : {}),
      ...(!includeArchived ? { isArchived: false } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: { interviewStages: { orderBy: { order: 'asc' } } },
    ...(limit ? { take: limit } : {}),
  });
  const items = apps.map(appToJson);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ items, total: items.length }));
}

const server = createServer((req, res) => {
  const url = req.url ?? '';

  if (req.method === 'GET' && url.startsWith('/api/applications/export')) {
    handleExport(res).catch(() => { res.writeHead(500); res.end(); });
    return;
  }

  if (req.method === 'GET' && url.startsWith('/api/applications/sample-csv')) {
    handleSampleCSV(res);
    return;
  }

  if (req.method === 'POST' && url.startsWith('/api/applications/import')) {
    handleImport(req, res).catch(() => { res.writeHead(500); res.end(); });
    return;
  }

  const getByIdMatch = url.match(/^\/api\/applications\/([^/?]+)(\?.*)?$/);
  if (req.method === 'GET' && getByIdMatch && !url.includes('/interview-stages') && !url.includes('/export') && !url.includes('/sample-csv') && !url.includes('/import')) {
    handleGetApplicationById(res, getByIdMatch[1]).catch(() => { res.writeHead(500); res.end(); });
    return;
  }

  if (req.method === 'GET' && url.startsWith('/api/applications') && !url.includes('/graphql')) {
    const query = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    handleGetApplications(res, query).catch(() => { res.writeHead(500); res.end(); });
    return;
  }

  if (req.method === 'POST' && url === '/api/applications') {
    handleRestCreate(req, res).catch(() => { res.writeHead(500); res.end(); });
    return;
  }

  if (req.method === 'PATCH' && /^\/api\/applications\/[^/]+$/.test(url)) {
    const patchMatch = url.match(/^\/api\/applications\/([^/?]+)/);
    if (patchMatch) {
      handleRestUpdate(req, res, patchMatch[1]).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
  }

  if (req.method === 'POST' && /^\/api\/applications\/[^/]+\/interview-stages$/.test(url)) {
    const stageMatch = url.match(/^\/api\/applications\/([^/?]+)\/interview-stages/);
    if (stageMatch) {
      handleRestCreateStage(req, res, stageMatch[1]).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
  }

  if (req.method === 'PATCH' && /^\/api\/applications\/[^/]+\/interview-stages\/[^/?]+$/.test(url)) {
    const stageMatch = url.match(/^\/api\/applications\/([^/?]+)\/interview-stages\/([^/?]+)/);
    if (stageMatch) {
      handleRestUpdateStage(req, res, stageMatch[1], stageMatch[2]).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
  }

  const archiveMatch = url.match(/^\/api\/applications\/([^/?]+)\/archive$/);
  if (req.method === 'POST' && archiveMatch) {
    archiveApplication(archiveMatch[1])
      .then(() => { res.writeHead(204); res.end(); })
      .catch(() => { res.writeHead(404); res.end(); });
    return;
  }

  const match = url.match(/^\/api\/applications\/([^/?]+)/);
  if (req.method === 'DELETE' && match) {
    const id = match[1];
    deleteApplication(id)
      .then(() => { res.writeHead(204); res.end(); })
      .catch(() => { res.writeHead(404); res.end(); });
    return;
  }

  yoga(req, res);
});

const port = Number(process.env.PORT ?? 5080);
server.listen(port, () => {
  console.log(`GraphQL Yoga running at http://localhost:${port}/graphql`);
});
