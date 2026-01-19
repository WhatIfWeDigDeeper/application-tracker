import { prisma } from "../db/client.js";
import {
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../types/index.js";
import { AppError } from "../middleware/errorHandler.js";

// Convert date-only strings (YYYY-MM-DD) to ISO datetime for Prisma
function toISODateTime(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function prepareDateFields<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input };
  if ('completedDate' in result && typeof result.completedDate === 'string') {
    (result as Record<string, unknown>).completedDate = toISODateTime(result.completedDate as string);
  }
  return result;
}

export class InterviewStageService {
  async createStage(applicationId: string, input: CreateInterviewStageInput) {
    // Verify application exists
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!app) {
      throw new AppError("not_found", 404, `Application ${applicationId} not found`);
    }

    // Get next order number
    const lastStage = await prisma.interviewStage.findFirst({
      where: { applicationId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastStage?.order ?? -1) + 1;

    return prisma.interviewStage.create({
      data: {
        ...prepareDateFields(input),
        applicationId,
        order: nextOrder,
      },
    });
  }

  async updateStage(stageId: string, input: UpdateInterviewStageInput) {
    const stage = await prisma.interviewStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) {
      throw new AppError("not_found", 404, `Stage ${stageId} not found`);
    }

    return prisma.interviewStage.update({
      where: { id: stageId },
      data: prepareDateFields(input),
    });
  }

  async deleteStage(stageId: string) {
    const stage = await prisma.interviewStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) {
      throw new AppError("not_found", 404, `Stage ${stageId} not found`);
    }

    await prisma.interviewStage.delete({
      where: { id: stageId },
    });
  }

  async getStagesByApplicationId(applicationId: string) {
    return prisma.interviewStage.findMany({
      where: { applicationId },
      orderBy: { order: "asc" },
    });
  }
}

export const interviewStageService = new InterviewStageService();
