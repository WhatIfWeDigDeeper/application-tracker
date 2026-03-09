import { prisma } from '../db/client.js';
import { recordSnapshot } from './history.service.js';

export async function createStage(applicationId: string, input: {
  name: string; order: number; isCompleted?: boolean; completedDate?: string | null;
  notes?: string | null; performanceRating?: number | null;
}) {
  if (!input.name?.trim()) throw new Error('stageName is required');
  if (!Number.isInteger(input.order) || input.order < 0)
    throw new Error('order must be a non-negative integer');
  await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });

  const stage = await prisma.interviewStage.create({
    data: {
      applicationId, name: input.name, order: input.order,
      isCompleted: input.isCompleted ?? false,
      completedDate: input.completedDate ? new Date(input.completedDate) : null,
      notes: input.notes,
      performanceRating: input.performanceRating ?? null,
    },
  });
  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId }, include: { interviewStages: true },
  });
  await prisma.$transaction(async (tx) => recordSnapshot(tx, app, ['interviewStages']));
  return stage;
}

export async function updateStage(applicationId: string, stageId: string, input: Partial<{
  name: string; order: number; isCompleted: boolean; completedDate: string | null;
  notes: string | null; performanceRating: number | null;
}>) {
  const stage = await prisma.interviewStage.findFirst({ where: { id: stageId, applicationId } });
  if (!stage) throw new Error(`Stage ${stageId} not found`);
  return prisma.interviewStage.update({
    where: { id: stageId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.isCompleted !== undefined && { isCompleted: input.isCompleted }),
      ...(input.completedDate !== undefined && { completedDate: input.completedDate ? new Date(input.completedDate) : null }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.performanceRating !== undefined && { performanceRating: input.performanceRating }),
    },
  });
}

export async function deleteStage(applicationId: string, stageId: string) {
  const stage = await prisma.interviewStage.findFirst({ where: { id: stageId, applicationId } });
  if (!stage) throw new Error(`Stage ${stageId} not found`);
  await prisma.interviewStage.delete({ where: { id: stageId } });
  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId }, include: { interviewStages: true },
  });
  await prisma.$transaction(async (tx) => recordSnapshot(tx, app, ['interviewStages']));
  return true;
}
