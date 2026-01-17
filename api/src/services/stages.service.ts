import { prisma } from "../db/client.js";
import {
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../types/index.js";
import { AppError } from "../middleware/errorHandler.js";

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
        ...input,
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
      data: input,
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
