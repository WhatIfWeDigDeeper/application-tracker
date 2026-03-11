import { prisma } from '../db/client.js';
import type { Prisma } from '@prisma/client';

type AppWithStages = Prisma.ApplicationGetPayload<{ include: { interviewStages: true } }>;
type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function recordSnapshot(tx: TxClient, app: AppWithStages, changedFields: string[]) {
  const last = await tx.applicationHistory.findFirst({
    where: { applicationId: app.id }, orderBy: { sequence: 'desc' },
  });
  const sequence = (last?.sequence ?? 0) + 1;
  const snapshot = {
    id: app.id, companyName: app.companyName, positionTitle: app.positionTitle,
    status: app.status, dateApplied: app.dateApplied, jobPostingUrl: app.jobPostingUrl,
    companyUrl: app.companyUrl, companyCareerUrl: app.companyCareerUrl,
    companyCategory: app.companyCategory, jobSource: app.jobSource,
    salaryMin: app.salaryMin, salaryMax: app.salaryMax, skillsMatch: app.skillsMatch,
    coverLetterRequired: app.coverLetterRequired, specialRequirements: app.specialRequirements,
    notes: app.notes, offerDueDate: app.offerDueDate,
    isArchived: app.isArchived, createdAt: app.createdAt, updatedAt: app.updatedAt,
  };
  await tx.applicationHistory.create({
    data: { applicationId: app.id, sequence, snapshot, changedFields },
  });
}

export async function listHistory(applicationId: string, page = 1, limit = 20) {
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);
  const [items, total] = await Promise.all([
    prisma.applicationHistory.findMany({ where: { applicationId }, orderBy: { sequence: 'desc' }, skip, take }),
    prisma.applicationHistory.count({ where: { applicationId } }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / take) };
}

export async function restoreToSnapshot(applicationId: string, sequence: number) {
  const entry = await prisma.applicationHistory.findUnique({
    where: { applicationId_sequence: { applicationId, sequence } },
  });
  if (!entry) throw new Error(`History entry ${sequence} not found`);
  const snap = entry.snapshot as Record<string, unknown>;

  return prisma.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id: applicationId },
      data: {
        companyName: snap.companyName as string,
        positionTitle: snap.positionTitle as string,
        status: snap.status as import('@prisma/client').ApplicationStatus,
        dateApplied: snap.dateApplied ? new Date(snap.dateApplied as string) : null,
        jobPostingUrl: (snap.jobPostingUrl as string | null) ?? null,
        companyUrl: (snap.companyUrl as string | null) ?? null,
        companyCareerUrl: (snap.companyCareerUrl as string | null) ?? null,
        companyCategory: (snap.companyCategory as import('@prisma/client').CompanyCategory | null) ?? null,
        jobSource: (snap.jobSource as import('@prisma/client').JobSource | null) ?? null,
        salaryMin: (snap.salaryMin as number | null) ?? null,
        salaryMax: (snap.salaryMax as number | null) ?? null,
        skillsMatch: (snap.skillsMatch as number | null) ?? null,
        coverLetterRequired: (snap.coverLetterRequired as boolean) ?? false,
        specialRequirements: (snap.specialRequirements as string | null) ?? null,
        notes: (snap.notes as string | null) ?? null,
        offerDueDate: snap.offerDueDate ? new Date(snap.offerDueDate as string) : null,
        isArchived: snap.isArchived as boolean,
      },
      include: { interviewStages: { orderBy: { order: 'asc' } } },
    });
    await recordSnapshot(tx, app, ['restored']);
    return app;
  });
}
