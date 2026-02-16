import { v4 as uuid } from "uuid";
import { query } from "../db/client.js";
import type {
  Application,
  InterviewStage,
  FieldChange,
  HistoryEntry,
  PaginatedHistory,
} from "../types/index.js";

// Database row types
interface ApplicationRow {
  id: string;
  company_name: string;
  position_title: string;
  date_applied: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
  company_url: string | null;
  job_posting_url: string | null;
  company_career_url: string | null;
  company_category: string | null;
  skills_match: number | null;
  job_source: string | null;
  cover_letter_required: boolean | null;
  special_requirements: string | null;
  salary_min: number | null;
  salary_max: number | null;
  notes: string | null;
  offer_due_date: Date | null;
  is_archived: boolean;
}

interface InterviewStageRow {
  id: string;
  application_id: string;
  name: string;
  order: number;
  is_completed: boolean;
  completed_date: Date | null;
  notes: string | null;
  performance_rating: number | null;
}

interface HistoryRow {
  id: string;
  application_id: string;
  sequence: number;
  description: string;
  snapshot: Application;
  created_at: Date;
}

const FIELD_LABELS: Record<string, string> = {
  companyName: "Company Name",
  positionTitle: "Position Title",
  dateApplied: "Date Applied",
  status: "Status",
  companyUrl: "Company URL",
  jobPostingUrl: "Job Posting URL",
  companyCareerUrl: "Career Page URL",
  companyCategory: "Company Category",
  skillsMatch: "Skills Match",
  jobSource: "Job Source",
  coverLetterRequired: "Cover Letter Required",
  specialRequirements: "Special Requirements",
  salaryMin: "Min Salary",
  salaryMax: "Max Salary",
  notes: "Notes",
  offerDueDate: "Offer Due Date",
  isArchived: "Archived",
};

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split("T")[0];
}

function formatDateTime(date: Date): string {
  return date.toISOString();
}

function toApplication(
  row: ApplicationRow,
  stages: InterviewStage[]
): Application {
  return {
    id: row.id,
    companyName: row.company_name,
    positionTitle: row.position_title,
    dateApplied: formatDate(row.date_applied)!,
    status: row.status as Application["status"],
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    companyUrl: row.company_url,
    jobPostingUrl: row.job_posting_url,
    companyCareerUrl: row.company_career_url,
    companyCategory: row.company_category as Application["companyCategory"],
    skillsMatch: row.skills_match,
    jobSource: row.job_source as Application["jobSource"],
    coverLetterRequired: row.cover_letter_required,
    specialRequirements: row.special_requirements,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    notes: row.notes,
    offerDueDate: formatDate(row.offer_due_date),
    isArchived: row.is_archived,
    interviewStages: stages,
  };
}

function toInterviewStage(row: InterviewStageRow): InterviewStage {
  return {
    id: row.id,
    applicationId: row.application_id,
    name: row.name,
    order: row.order,
    isCompleted: row.is_completed,
    completedDate: formatDate(row.completed_date),
    notes: row.notes,
    performanceRating: row.performance_rating,
  };
}

export async function captureSnapshot(
  applicationId: string
): Promise<Application | null> {
  const appResult = await query<ApplicationRow>(
    `SELECT * FROM applications WHERE id = $1`,
    [applicationId]
  );

  if (appResult.rows.length === 0) return null;

  const stagesResult = await query<InterviewStageRow>(
    `SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order" ASC`,
    [applicationId]
  );

  const stages = stagesResult.rows.map(toInterviewStage);
  return toApplication(appResult.rows[0], stages);
}

export async function getNextSequence(applicationId: string): Promise<number> {
  const result = await query<{ max_seq: number | null }>(
    `SELECT COALESCE(MAX(sequence), 0) AS max_seq FROM application_history WHERE application_id = $1`,
    [applicationId]
  );

  return Number(result.rows[0]?.max_seq ?? 0) + 1;
}

export async function recordHistory(
  applicationId: string,
  description: string
): Promise<void> {
  const snapshot = await captureSnapshot(applicationId);
  if (!snapshot) return;

  const sequence = await getNextSequence(applicationId);
  const id = uuid();

  await query(
    `INSERT INTO application_history (id, application_id, sequence, description, snapshot) VALUES ($1, $2, $3, $4, $5)`,
    [id, applicationId, sequence, description, JSON.stringify(snapshot)]
  );
}

export async function listHistory(
  applicationId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedHistory> {
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM application_history WHERE application_id = $1`,
    [applicationId]
  );

  const total = parseInt(countResult.rows[0].count);
  const offset = (page - 1) * limit;

  const rows = await query<HistoryRow>(
    `SELECT * FROM application_history WHERE application_id = $1 ORDER BY sequence DESC LIMIT $2 OFFSET $3`,
    [applicationId, limit, offset]
  );

  const entries: HistoryEntry[] = rows.rows.map((row, index) => {
    const thisSnapshot = row.snapshot as Application;
    let changes: FieldChange[] = [];

    const olderRow = rows.rows[index + 1];
    if (olderRow) {
      const olderSnapshot = olderRow.snapshot as Application;
      changes = computeFieldDiffs(olderSnapshot, thisSnapshot);
    }

    return {
      id: row.id,
      sequence: row.sequence,
      description: row.description,
      changes,
      createdAt: row.created_at.toISOString(),
    };
  });

  return { entries, total, page, limit };
}

export async function restoreToVersion(
  applicationId: string,
  targetSequence: number
): Promise<Application | null> {
  const result = await query<HistoryRow>(
    `SELECT * FROM application_history WHERE application_id = $1 AND sequence = $2`,
    [applicationId, targetSequence]
  );

  if (result.rows.length === 0) return null;

  const snapshot = result.rows[0].snapshot as Application;

  // Update the application row
  await query(
    `UPDATE applications SET
      company_name = $1, position_title = $2, date_applied = $3, status = $4,
      company_url = $5, job_posting_url = $6, company_career_url = $7,
      company_category = $8, skills_match = $9, job_source = $10,
      cover_letter_required = $11, special_requirements = $12,
      salary_min = $13, salary_max = $14, notes = $15,
      offer_due_date = $16, is_archived = $17, updated_at = NOW()
    WHERE id = $18`,
    [
      snapshot.companyName,
      snapshot.positionTitle,
      snapshot.dateApplied,
      snapshot.status,
      snapshot.companyUrl,
      snapshot.jobPostingUrl,
      snapshot.companyCareerUrl,
      snapshot.companyCategory,
      snapshot.skillsMatch,
      snapshot.jobSource,
      snapshot.coverLetterRequired,
      snapshot.specialRequirements,
      snapshot.salaryMin,
      snapshot.salaryMax,
      snapshot.notes,
      snapshot.offerDueDate,
      snapshot.isArchived,
      applicationId,
    ]
  );

  // Delete current stages
  await query(`DELETE FROM interview_stages WHERE application_id = $1`, [
    applicationId,
  ]);

  // Re-insert stages from snapshot
  if (snapshot.interviewStages && snapshot.interviewStages.length > 0) {
    for (const s of snapshot.interviewStages) {
      const stageId = uuid();
      await query(
        `INSERT INTO interview_stages (id, application_id, name, "order", is_completed, completed_date, notes, performance_rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          stageId,
          applicationId,
          s.name,
          s.order,
          s.isCompleted,
          s.completedDate || null,
          s.notes,
          s.performanceRating,
        ]
      );
    }
  }

  // Record history after restore
  await recordHistory(
    applicationId,
    buildDescription("restore_version", String(targetSequence))
  );

  return captureSnapshot(applicationId);
}

export function computeFieldDiffs(
  before: Application,
  after: Application
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const [field, label] of Object.entries(FIELD_LABELS)) {
    const oldValue = (before as unknown as Record<string, unknown>)[field];
    const newValue = (after as unknown as Record<string, unknown>)[field];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field, label, oldValue, newValue });
    }
  }

  // Compare interview stages
  const oldStages = JSON.stringify(before.interviewStages);
  const newStages = JSON.stringify(after.interviewStages);
  if (oldStages !== newStages) {
    changes.push({
      field: "interviewStages",
      label: "Interview Stages",
      oldValue: before.interviewStages,
      newValue: after.interviewStages,
    });
  }

  return changes;
}

export function buildDescription(action: string, details?: string): string {
  switch (action) {
    case "create":
      return `Created application ${details || ""}`.trim();
    case "update":
      return `Updated ${details || ""}`.trim();
    case "delete":
      return "Deleted application";
    case "archive":
      return "Archived application";
    case "restore":
      return "Restored from archive";
    case "restore_version":
      return `Restored to version ${details}`;
    case "stage_add":
      return `Added interview stage "${details}"`;
    case "stage_update":
      return `Updated interview stage "${details}"`;
    case "stage_delete":
      return `Removed interview stage "${details}"`;
    default:
      return details || action;
  }
}
