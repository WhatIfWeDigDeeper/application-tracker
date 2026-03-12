import { Prisma } from "@prisma/client";
import { prisma } from "../db/client.js";
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  ListApplicationsQuery,
} from "../types/index.js";
import { AppError } from "../middleware/errorHandler.js";
import { recordHistory, buildDescription, FIELD_LABELS } from "./history.service.js";

type ApplicationWithStages = Prisma.ApplicationGetPayload<{
  include: { interviewStages: true };
}>;

interface ListApplicationsResult {
  items: ApplicationWithStages[];
  page: number;
  limit: number;
  total: number;
}

// Convert date-only strings (YYYY-MM-DD) to ISO datetime for Prisma
function toISODateTime(dateStr: string | null | undefined): Date | null | undefined {
  if (dateStr === null) return null;
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function prepareDateFields<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input };
  if ('dateApplied' in result && (typeof result.dateApplied === 'string' || result.dateApplied === null)) {
    (result as Record<string, unknown>).dateApplied = toISODateTime(result.dateApplied as string | null);
  }
  if ('offerDueDate' in result && typeof result.offerDueDate === 'string') {
    (result as Record<string, unknown>).offerDueDate = toISODateTime(result.offerDueDate as string);
  }
  if ('completedDate' in result && typeof result.completedDate === 'string') {
    (result as Record<string, unknown>).completedDate = toISODateTime(result.completedDate as string);
  }
  return result;
}

export class ApplicationService {
  async listApplications(query: ListApplicationsQuery): Promise<ListApplicationsResult> {
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
        orderBy: { updatedAt: "desc" },
      }),
      prisma.application.count({ where }),
    ]);

    return { items, page, limit, total };
  }

  async getApplication(id: string): Promise<ApplicationWithStages> {
    const app = await prisma.application.findUnique({
      where: { id },
      include: { interviewStages: { orderBy: { order: "asc" } } },
    });

    if (!app) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }

    return app;
  }

  async createApplication(input: CreateApplicationInput): Promise<ApplicationWithStages> {
    const preparedInput = prepareDateFields(input);
    const status = preparedInput.status ?? "unsubmitted";
    const dateApplied = status === "unsubmitted" ? null : (preparedInput.dateApplied ?? new Date());
    const data = {
      ...preparedInput,
      status,
      dateApplied,
    };
    const app = await prisma.application.create({
      data,
      include: { interviewStages: true },
    });

    await recordHistory(app.id, buildDescription("create", `${app.companyName} - ${app.positionTitle}`));

    return app;
  }

  async updateApplication(id: string, input: UpdateApplicationInput): Promise<ApplicationWithStages> {
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }

    const preparedData = prepareDateFields(input);
    // When status is being set to 'unsubmitted', force dateApplied to null
    if (input.status === "unsubmitted") {
      (preparedData as Record<string, unknown>).dateApplied = null;
    }
    const updated = await prisma.application.update({
      where: { id },
      data: preparedData,
      include: { interviewStages: { orderBy: { order: "asc" } } },
    });

    const changedFields = Object.keys(input)
      .filter((key) => key in FIELD_LABELS)
      .map((key) => FIELD_LABELS[key]);
    if (changedFields.length > 0) {
      await recordHistory(id, buildDescription("update", changedFields.join(", ")));
    }

    return updated;
  }

  async deleteApplication(id: string): Promise<void> {
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }

    await prisma.application.delete({ where: { id } });
  }

  async archiveApplication(id: string): Promise<ApplicationWithStages> {
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }
    const result = await prisma.application.update({
      where: { id },
      data: { isArchived: true },
      include: { interviewStages: true },
    });

    await recordHistory(id, buildDescription("archive"));

    return result;
  }

  async restoreApplication(id: string): Promise<ApplicationWithStages> {
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("not_found", 404, `Application ${id} not found`);
    }
    const result = await prisma.application.update({
      where: { id },
      data: { isArchived: false },
      include: { interviewStages: true },
    });

    await recordHistory(id, buildDescription("restore"));

    return result;
  }
}

export const applicationService = new ApplicationService();
