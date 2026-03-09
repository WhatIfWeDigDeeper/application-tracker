import { prisma } from '../db/client.js';
import { recordSnapshot } from './history.service.js';

export async function createStage(applicationId: string, input: {
  stageName: string; stageOrder: number; scheduledDate?: string | null; notes?: string | null;
}) {
  if (!input.stageName?.trim()) throw new Error('stageName is required');
  if (!Number.isInteger(input.stageOrder) || input.stageOrder < 1 || input.stageOrder > 100)
    throw new Error('stageOrder must be 1-100');
  await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });

  const stage = await prisma.interviewStage.create({
    data: {
      applicationId, stageName: input.stageName, stageOrder: input.stageOrder,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      notes: input.notes,
    },
  });
  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId }, include: { interviewStages: true },
  });
  await prisma.$transaction(async (tx) => recordSnapshot(tx, app, ['interviewStages']));
  return stage;
}

export async function updateStage(applicationId: string, stageId: string, input: Partial<{
  stageName: string; stageOrder: number; scheduledDate: string | null; notes: string | null;
}>) {
  const stage = await prisma.interviewStage.findFirst({ where: { id: stageId, applicationId } });
  if (!stage) throw new Error(`Stage ${stageId} not found`);
  return prisma.interviewStage.update({
    where: { id: stageId },
    data: {
      ...(input.stageName !== undefined && { stageName: input.stageName }),
      ...(input.stageOrder !== undefined && { stageOrder: input.stageOrder }),
      ...(input.scheduledDate !== undefined && { scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null }),
      ...(input.notes !== undefined && { notes: input.notes }),
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
