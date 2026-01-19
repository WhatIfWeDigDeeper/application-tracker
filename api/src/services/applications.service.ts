import { prisma } from "../db/client.js";
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  ListApplicationsQuery,
} from "../types/index.js";
import { AppError } from "../middleware/errorHandler.js";

// Convert date-only strings (YYYY-MM-DD) to ISO datetime for Prisma
function toISODateTime(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function prepareDateFields<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input };
  if ('dateApplied' in result && typeof result.dateApplied === 'string') {
    (result as Record<string, unknown>).dateApplied = toISODateTime(result.dateApplied as string);
  }
  if ('offerDueDate' in result && typeof result.offerDueDate === 'string') {
    (result as Record<string, unknown>).offerDueDate = toISODateTime(result.offerDueDate as string);
  }
  return result;
}

export class ApplicationService {
  async listApplications(query: ListApplicationsQuery) {
    const { page = 1, limit = 20, status, companyCategory, jobSource, includeArchived = false } = query;

    const skip = (page - 1) * limit;

    // Parse comma-separated values into arrays for 'in' queries
    const statusList = status ? status.split(',').filter(Boolean) : null;
    const categoryList = companyCategory ? companyCategory.split(',').filter(Boolean) : null;
    const sourceList = jobSource ? jobSource.split(',').filter(Boolean) : null;

    const where = {
      ...(statusList && statusList.length > 0 && { status: { in: statusList } }),
      ...(categoryList && categoryList.length > 0 && { companyCategory: { in: categoryList } }),
      ...(sourceList && sourceList.length > 0 && { jobSource: { in: sourceList } }),
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
        ...prepareDateFields(input),
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
      data: prepareDateFields(input),
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
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }
    return prisma.application.update({
      where: { id },
      data: { isArchived: true },
      include: { interviewStages: true },
    });
  }

  async restoreApplication(id: string) {
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }
    return prisma.application.update({
      where: { id },
      data: { isArchived: false },
      include: { interviewStages: true },
    });
  }
}

export const applicationService = new ApplicationService();
