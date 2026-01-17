import { prisma } from "../db/client.js";
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  ListApplicationsQuery,
} from "../types/index.js";
import { AppError } from "../middleware/errorHandler.js";

export class ApplicationService {
  async listApplications(query: ListApplicationsQuery) {
    const { page = 1, limit = 20, status, companyCategory, jobSource, includeArchived = false } = query;

    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(companyCategory && { companyCategory }),
      ...(jobSource && { jobSource }),
      ...(!includeArchived && { isArchived: false }),
    };

    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        include: { interviewStages: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.application.count({ where }),
    ]);

    return { items, page, limit, total };
  }

  async getApplication(id: string) {
    const app = await prisma.application.findUnique({
      where: { id },
      include: { interviewStages: { orderBy: { order: "asc" } } },
    });

    if (!app) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }

    return app;
  }

  async createApplication(input: CreateApplicationInput) {
    return prisma.application.create({
      data: {
        ...input,
        status: "unsubmitted",
      },
      include: { interviewStages: true },
    });
  }

  async updateApplication(id: string, input: UpdateApplicationInput) {
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }

    return prisma.application.update({
      where: { id },
      data: input,
      include: { interviewStages: { orderBy: { order: "asc" } } },
    });
  }

  async deleteApplication(id: string) {
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }

    await prisma.application.delete({ where: { id } });
  }

  async archiveApplication(id: string) {
    return this.updateApplication(id, { isArchived: true });
  }

  async restoreApplication(id: string) {
    return this.updateApplication(id, { isArchived: false });
  }
}

export const applicationService = new ApplicationService();
