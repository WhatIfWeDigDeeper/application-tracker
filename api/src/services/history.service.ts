import { Prisma } from "@prisma/client";
import { prisma } from "../db/client.js";

interface FieldChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
}

interface HistoryEntryResponse {
  id: string;
  sequence: number;
  description: string;
  changes: FieldChange[];
  createdAt: string;
}

interface PaginatedHistoryResponse {
  entries: HistoryEntryResponse[];
  total: number;
  page: number;
  limit: number;
}

interface ApplicationSnapshot {
  id: string;
  companyName: string;
  positionTitle: string;
  dateApplied: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  companyUrl: string | null;
  jobPostingUrl: string | null;
  companyCareerUrl: string | null;
  companyCategory: string | null;
  skillsMatch: number | null;
  jobSource: string | null;
  coverLetterRequired: boolean | null;
  specialRequirements: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  notes: string | null;
  offerDueDate: string | null;
  isArchived: boolean;
  interviewStages: {
    id: string;
    name: string;
    order: number;
    isCompleted: boolean;
    completedDate: string | null;
    notes: string | null;
    performanceRating: number | null;
  }[];
}

export const FIELD_LABELS: Record<string, string> = {
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

function toSnapshot(
  app: Prisma.ApplicationGetPayload<{ include: { interviewStages: true } }>
): ApplicationSnapshot {
  return {
    id: app.id,
    companyName: app.companyName,
    positionTitle: app.positionTitle,
    dateApplied: app.dateApplied ? app.dateApplied.toISOString().split("T")[0]! : null,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    companyUrl: app.companyUrl,
    jobPostingUrl: app.jobPostingUrl,
    companyCareerUrl: app.companyCareerUrl,
    companyCategory: app.companyCategory,
    skillsMatch: app.skillsMatch,
    jobSource: app.jobSource,
    coverLetterRequired: app.coverLetterRequired,
    specialRequirements: app.specialRequirements,
    salaryMin: app.salaryMin,
    salaryMax: app.salaryMax,
    notes: app.notes,
    offerDueDate: app.offerDueDate ? app.offerDueDate.toISOString().split("T")[0]! : null,
    isArchived: app.isArchived,
    interviewStages: app.interviewStages.map((s) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      isCompleted: s.isCompleted,
      completedDate: s.completedDate ? s.completedDate.toISOString().split("T")[0]! : null,
      notes: s.notes,
      performanceRating: s.performanceRating,
    })),
  };
}

async function captureSnapshot(applicationId: string): Promise<ApplicationSnapshot | null> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { interviewStages: { orderBy: { order: "asc" } } },
  });

  if (!app) return null;
  return toSnapshot(app);
}

async function getNextSequence(applicationId: string): Promise<number> {
  const result = await prisma.applicationHistory.aggregate({
    where: { applicationId },
    _max: { sequence: true },
  });
  return (result._max.sequence ?? 0) + 1;
}

export async function recordHistory(applicationId: string, description: string): Promise<void> {
  const snapshot = await captureSnapshot(applicationId);
  if (!snapshot) return;

  const sequence = await getNextSequence(applicationId);

  await prisma.applicationHistory.create({
    data: {
      applicationId,
      sequence,
      description,
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function listHistory(
  applicationId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedHistoryResponse> {
  const total = await prisma.applicationHistory.count({
    where: { applicationId },
  });

  const offset = (page - 1) * limit;
  const rows = await prisma.applicationHistory.findMany({
    where: { applicationId },
    orderBy: { sequence: "desc" },
    skip: offset,
    take: limit,
  });

  const entries: HistoryEntryResponse[] = rows.map((row, index) => {
    const thisSnapshot = row.snapshot as unknown as ApplicationSnapshot;
    let changes: FieldChange[] = [];

    const olderRow = rows[index + 1];
    if (olderRow) {
      const olderSnapshot = olderRow.snapshot as unknown as ApplicationSnapshot;
      changes = computeFieldDiffs(olderSnapshot, thisSnapshot);
    }

    return {
      id: row.id,
      sequence: row.sequence,
      description: row.description,
      changes,
      createdAt: row.createdAt.toISOString(),
    };
  });

  return { entries, total, page, limit };
}

export async function restoreToVersion(
  applicationId: string,
  targetSequence: number
): Promise<Prisma.ApplicationGetPayload<{ include: { interviewStages: true } }> | null> {
  const entry = await prisma.applicationHistory.findFirst({
    where: { applicationId, sequence: targetSequence },
  });

  if (!entry) return null;

  const snapshot = entry.snapshot as unknown as ApplicationSnapshot;

  // Wrap restore in a transaction to prevent partial updates
  await prisma.$transaction(async (tx) => {
    // Update application fields
    await tx.application.update({
      where: { id: applicationId },
      data: {
        companyName: snapshot.companyName,
        positionTitle: snapshot.positionTitle,
        dateApplied: snapshot.dateApplied ? new Date(`${snapshot.dateApplied}T00:00:00.000Z`) : null,
        status: snapshot.status,
        companyUrl: snapshot.companyUrl,
        jobPostingUrl: snapshot.jobPostingUrl,
        companyCareerUrl: snapshot.companyCareerUrl,
        companyCategory: snapshot.companyCategory,
        skillsMatch: snapshot.skillsMatch,
        jobSource: snapshot.jobSource,
        coverLetterRequired: snapshot.coverLetterRequired,
        specialRequirements: snapshot.specialRequirements,
        salaryMin: snapshot.salaryMin,
        salaryMax: snapshot.salaryMax,
        notes: snapshot.notes,
        offerDueDate: snapshot.offerDueDate ? new Date(`${snapshot.offerDueDate}T00:00:00.000Z`) : null,
        isArchived: snapshot.isArchived,
      },
    });

    // Delete all current stages
    await tx.interviewStage.deleteMany({
      where: { applicationId },
    });

    // Re-insert stages from snapshot
    if (snapshot.interviewStages && snapshot.interviewStages.length > 0) {
      await tx.interviewStage.createMany({
        data: snapshot.interviewStages.map((s) => ({
          applicationId,
          name: s.name,
          order: s.order,
          isCompleted: s.isCompleted,
          completedDate: s.completedDate ? new Date(`${s.completedDate}T00:00:00.000Z`) : null,
          notes: s.notes,
          performanceRating: s.performanceRating,
        })),
      });
    }
  });

  // Record history after restore (outside transaction — non-critical)
  await recordHistory(applicationId, buildDescription("restore_version", String(targetSequence)));

  // Return the restored state
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: { interviewStages: { orderBy: { order: "asc" } } },
  });
}

export function computeFieldDiffs(before: ApplicationSnapshot, after: ApplicationSnapshot): FieldChange[] {
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
