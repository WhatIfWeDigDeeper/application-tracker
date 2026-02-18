import { v4 as uuid } from "uuid";
import { query } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  Application,
  InterviewStage,
  CreateApplicationInput,
  UpdateApplicationInput,
  ListApplicationsQuery,
  PaginatedApplications,
} from "../types/index.js";
import { recordHistory, buildDescription, FIELD_LABELS } from "./history.service.js";

// Database row types (snake_case)
interface ApplicationRow {
  id: string;
  company_name: string;
  position_title: string;
  date_applied: Date | null;
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

// Convert database row to API response format
function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split("T")[0];
}

function formatDateTime(date: Date): string {
  return date.toISOString();
}

function toApplication(row: ApplicationRow, stages: InterviewStage[] = []): Application {
  return {
    id: row.id,
    companyName: row.company_name,
    positionTitle: row.position_title,
    dateApplied: formatDate(row.date_applied),
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

export class ApplicationService {
  async listApplications(
    queryParams: ListApplicationsQuery
  ): Promise<PaginatedApplications> {
    const {
      page = 1,
      limit = 20,
      status,
      companyCategory,
      jobSource,
      skillsMatchMin,
      includeArchived = false,
      sortBy = "updatedAt",
      sortDir = "desc",
    } = queryParams;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Filter conditions
    if (!includeArchived) {
      conditions.push(`is_archived = false`);
    }

    if (status) {
      const statusList = status.split(",").filter(Boolean);
      if (statusList.length > 0) {
        conditions.push(
          `status = ANY($${paramIndex}::application_status[])`
        );
        params.push(statusList);
        paramIndex++;
      }
    }

    if (companyCategory) {
      const categoryList = companyCategory.split(",").filter(Boolean);
      if (categoryList.length > 0) {
        conditions.push(
          `company_category = ANY($${paramIndex}::company_category[])`
        );
        params.push(categoryList);
        paramIndex++;
      }
    }

    if (jobSource) {
      const sourceList = jobSource.split(",").filter(Boolean);
      if (sourceList.length > 0) {
        conditions.push(`job_source = ANY($${paramIndex}::job_source[])`);
        params.push(sourceList);
        paramIndex++;
      }
    }

    if (skillsMatchMin) {
      conditions.push(`skills_match >= $${paramIndex}`);
      params.push(skillsMatchMin);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Sort column mapping
    const sortColumnMap: Record<string, string> = {
      dateApplied: "date_applied",
      companyName: "company_name",
      updatedAt: "updated_at",
    };
    const sortColumn = sortColumnMap[sortBy] || "date_applied";
    const orderClause = `ORDER BY ${sortColumn} ${sortDir.toUpperCase()} NULLS LAST`;

    // Count query
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM applications ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Data query with pagination
    const dataParams = [...params, limit, offset];
    const dataResult = await query<ApplicationRow>(
      `SELECT * FROM applications ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    // Get all interview stages for the returned applications
    if (dataResult.rows.length > 0) {
      const appIds = dataResult.rows.map((row) => row.id);
      const stagesResult = await query<InterviewStageRow>(
        `SELECT * FROM interview_stages WHERE application_id = ANY($1) ORDER BY "order" ASC`,
        [appIds]
      );

      // Group stages by application
      const stagesByApp = new Map<string, InterviewStage[]>();
      for (const row of stagesResult.rows) {
        const appId = row.application_id;
        if (!stagesByApp.has(appId)) {
          stagesByApp.set(appId, []);
        }
        stagesByApp.get(appId)!.push(toInterviewStage(row));
      }

      const items = dataResult.rows.map((row) =>
        toApplication(row, stagesByApp.get(row.id) || [])
      );

      return { items, page, limit, total };
    }

    return { items: [], page, limit, total };
  }

  async getApplication(id: string): Promise<Application> {
    const appResult = await query<ApplicationRow>(
      `SELECT * FROM applications WHERE id = $1`,
      [id]
    );

    if (appResult.rows.length === 0) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }

    const stagesResult = await query<InterviewStageRow>(
      `SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order" ASC`,
      [id]
    );

    const stages = stagesResult.rows.map(toInterviewStage);
    return toApplication(appResult.rows[0], stages);
  }

  async createApplication(input: CreateApplicationInput): Promise<Application> {
    const id = uuid();
    // Status defaults to 'unsubmitted'; force dateApplied to null for unsubmitted
    const result = await query<ApplicationRow>(
      `INSERT INTO applications (
        id, company_name, position_title, date_applied, status,
        company_url, job_posting_url, company_career_url,
        company_category, skills_match, job_source,
        cover_letter_required, special_requirements,
        salary_min, salary_max, notes
      ) VALUES (
        $1, $2, $3, $4, 'unsubmitted',
        $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *`,
      [
        id,
        input.companyName.trim(),
        input.positionTitle.trim(),
        null,
        input.companyUrl || null,
        input.jobPostingUrl || null,
        input.companyCareerUrl || null,
        input.companyCategory || null,
        input.skillsMatch || null,
        input.jobSource || null,
        input.coverLetterRequired ?? null,
        input.specialRequirements?.trim() || null,
        input.salaryMin || null,
        input.salaryMax || null,
        input.notes?.trim() || null,
      ]
    );

    await recordHistory(
      result.rows[0].id,
      buildDescription("create", `${result.rows[0].company_name} - ${result.rows[0].position_title}`)
    );

    return toApplication(result.rows[0], []);
  }

  async updateApplication(
    id: string,
    input: UpdateApplicationInput
  ): Promise<Application> {
    // Check if application exists
    const existingResult = await query<ApplicationRow>(
      `SELECT * FROM applications WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      companyName: "company_name",
      positionTitle: "position_title",
      dateApplied: "date_applied",
      status: "status",
      companyUrl: "company_url",
      jobPostingUrl: "job_posting_url",
      companyCareerUrl: "company_career_url",
      companyCategory: "company_category",
      skillsMatch: "skills_match",
      jobSource: "job_source",
      coverLetterRequired: "cover_letter_required",
      specialRequirements: "special_requirements",
      salaryMin: "salary_min",
      salaryMax: "salary_max",
      notes: "notes",
      offerDueDate: "offer_due_date",
      isArchived: "is_archived",
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      if (key in input && input[key as keyof UpdateApplicationInput] !== undefined) {
        let value = input[key as keyof UpdateApplicationInput];

        // Handle empty strings as null for optional fields
        if (value === "") {
          value = null;
        } else if (typeof value === "string" && ["companyName", "positionTitle", "specialRequirements", "notes"].includes(key)) {
          value = (value as string).trim();
        }

        updates.push(`${column} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    // If status is being set to 'unsubmitted', force dateApplied to null
    if (input.status === "unsubmitted") {
      // Check if dateApplied is already in the updates list
      const dateAppliedIdx = updates.findIndex((u) => u.startsWith("date_applied"));
      if (dateAppliedIdx >= 0) {
        // Replace the existing value
        params[dateAppliedIdx] = null;
      } else {
        // Add dateApplied = null to the updates
        updates.push(`date_applied = $${paramIndex}`);
        params.push(null);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      // No updates, just return existing
      return this.getApplication(id);
    }

    params.push(id);
    const result = await query<ApplicationRow>(
      `UPDATE applications SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    const stagesResult = await query<InterviewStageRow>(
      `SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order" ASC`,
      [id]
    );

    const stages = stagesResult.rows.map(toInterviewStage);

    // Record history after update
    const changedFields = Object.keys(input)
      .filter((key) => key in FIELD_LABELS && input[key as keyof UpdateApplicationInput] !== undefined)
      .map((key) => FIELD_LABELS[key]);
    if (changedFields.length > 0) {
      await recordHistory(id, buildDescription("update", changedFields.join(", ")));
    }

    return toApplication(result.rows[0], stages);
  }

  async deleteApplication(id: string): Promise<void> {
    const result = await query(
      `DELETE FROM applications WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }
  }

  async archiveApplication(id: string): Promise<Application> {
    const app = await this.updateApplication(id, { isArchived: true });
    await recordHistory(id, buildDescription("archive"));
    return app;
  }

  async restoreApplication(id: string): Promise<Application> {
    const app = await this.updateApplication(id, { isArchived: false });
    await recordHistory(id, buildDescription("restore"));
    return app;
  }
}

export const applicationService = new ApplicationService();
