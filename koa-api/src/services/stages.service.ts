import { v4 as uuid } from "uuid";
import { query } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  InterviewStage,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../types/index.js";
import { recordHistory, buildDescription } from "./history.service.js";

// Database row type
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

export class InterviewStageService {
  async createStage(
    applicationId: string,
    input: CreateInterviewStageInput
  ): Promise<InterviewStage> {
    // Verify application exists
    const appResult = await query(
      `SELECT id FROM applications WHERE id = $1`,
      [applicationId]
    );

    if (appResult.rows.length === 0) {
      throw new AppError(
        "not_found",
        404,
        `Application ${applicationId} not found`
      );
    }

    const id = uuid();

    const result = await query<InterviewStageRow>(
      `INSERT INTO interview_stages (
        id, application_id, name, "order", is_completed,
        completed_date, notes, performance_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id,
        applicationId,
        input.name.trim(),
        input.order,
        input.isCompleted ?? false,
        input.completedDate || null,
        input.notes?.trim() || null,
        input.performanceRating || null,
      ]
    );

    // Update application's updated_at
    await query(
      `UPDATE applications SET updated_at = NOW() WHERE id = $1`,
      [applicationId]
    );

    await recordHistory(applicationId, buildDescription("stage_add", input.name.trim()));

    return toInterviewStage(result.rows[0]);
  }

  async updateStage(
    applicationId: string,
    stageId: string,
    input: UpdateInterviewStageInput
  ): Promise<InterviewStage> {
    // Check if stage exists and belongs to the application
    const existingResult = await query<InterviewStageRow>(
      `SELECT * FROM interview_stages WHERE id = $1 AND application_id = $2`,
      [stageId, applicationId]
    );

    if (existingResult.rows.length === 0) {
      throw new AppError(
        "not_found",
        404,
        `Stage ${stageId} not found for application ${applicationId}`
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      name: "name",
      order: '"order"',
      isCompleted: "is_completed",
      completedDate: "completed_date",
      notes: "notes",
      performanceRating: "performance_rating",
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      if (key in input && input[key as keyof UpdateInterviewStageInput] !== undefined) {
        let value = input[key as keyof UpdateInterviewStageInput];

        // Handle trimming for string fields
        if (typeof value === "string" && key === "name") {
          value = value.trim();
        } else if (typeof value === "string" && key === "notes") {
          value = value.trim() || null;
        }

        updates.push(`${column} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      // No updates, just return existing
      return toInterviewStage(existingResult.rows[0]);
    }

    params.push(stageId);
    const result = await query<InterviewStageRow>(
      `UPDATE interview_stages SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    // Update parent application's updated_at
    await query(
      `UPDATE applications SET updated_at = NOW() WHERE id = $1`,
      [result.rows[0].application_id]
    );

    const stageName = result.rows[0].name;
    await recordHistory(applicationId, buildDescription("stage_update", stageName));

    return toInterviewStage(result.rows[0]);
  }

  async deleteStage(applicationId: string, stageId: string): Promise<void> {
    // Get the stage first to verify it belongs to the application
    const existingResult = await query<InterviewStageRow>(
      `SELECT * FROM interview_stages WHERE id = $1 AND application_id = $2`,
      [stageId, applicationId]
    );

    if (existingResult.rows.length === 0) {
      throw new AppError(
        "not_found",
        404,
        `Stage ${stageId} not found for application ${applicationId}`
      );
    }

    const stageName = existingResult.rows[0].name;

    // Record history before delete so snapshot still includes the stage
    await recordHistory(applicationId, buildDescription("stage_delete", stageName));

    await query(`DELETE FROM interview_stages WHERE id = $1`, [stageId]);

    // Update parent application's updated_at
    await query(
      `UPDATE applications SET updated_at = NOW() WHERE id = $1`,
      [applicationId]
    );
  }

  async getStagesByApplicationId(applicationId: string): Promise<InterviewStage[]> {
    const result = await query<InterviewStageRow>(
      `SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order" ASC`,
      [applicationId]
    );

    return result.rows.map(toInterviewStage);
  }
}

export const interviewStageService = new InterviewStageService();
