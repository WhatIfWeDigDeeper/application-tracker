import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';

const mockPrisma = mockDeep<PrismaClient>();
vi.mock('../db/client.js', () => ({ prisma: mockPrisma }));

beforeEach(() => mockReset(mockPrisma));

const { createStage, deleteStage } = await import('../services/stages.service.js');

describe('createStage', () => {
  it('throws when stageName is empty', async () => {
    await expect(createStage('app-id', { stageName: '', stageOrder: 1 }))
      .rejects.toThrow('stageName is required');
  });

  it('throws when stageName is whitespace only', async () => {
    await expect(createStage('app-id', { stageName: '   ', stageOrder: 1 }))
      .rejects.toThrow('stageName is required');
  });

  it('throws when stageOrder is out of range', async () => {
    await expect(createStage('app-id', { stageName: 'Phone Screen', stageOrder: 0 }))
      .rejects.toThrow('stageOrder must be 1-100');
  });
});

describe('deleteStage', () => {
  it('returns true on success', async () => {
    const mockStage = {
      id: 'stage-id', applicationId: 'app-id', stageName: 'Phone Screen',
      stageOrder: 1, scheduledDate: null, notes: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    const mockApp = {
      id: 'app-id', companyName: 'Acme', positionTitle: 'Engineer',
      status: 'applied' as const, dateApplied: null, jobPostingUrl: null,
      companyWebsiteUrl: null, companyCategory: null, jobSource: null,
      salaryMin: null, salaryMax: null, skillsMatch: null, notes: null,
      contactName: null, contactEmail: null, offerDueDate: null,
      isArchived: false, createdAt: new Date(), updatedAt: new Date(),
      interviewStages: [],
    };

    mockPrisma.interviewStage.findFirst.mockResolvedValue(mockStage);
    mockPrisma.interviewStage.delete.mockResolvedValue(mockStage);
    mockPrisma.application.findUniqueOrThrow.mockResolvedValue(mockApp);
    mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
    mockPrisma.applicationHistory.findFirst.mockResolvedValue(null);
    mockPrisma.applicationHistory.create.mockResolvedValue({
      id: 'h1', applicationId: 'app-id', sequence: 1,
      snapshot: {}, changedFields: [], createdAt: new Date(),
    });

    const result = await deleteStage('app-id', 'stage-id');
    expect(result).toBe(true);
  });
});
