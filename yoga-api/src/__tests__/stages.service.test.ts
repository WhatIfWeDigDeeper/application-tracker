import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';

const mockPrisma = mockDeep<PrismaClient>();
vi.mock('../db/client.js', () => ({ prisma: mockPrisma }));

beforeEach(() => mockReset(mockPrisma));

const { createStage, deleteStage } = await import('../services/stages.service.js');

function makeStage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'stage-id', applicationId: 'app-id', name: 'Phone Screen',
    order: 1, isCompleted: false, completedDate: null, notes: null,
    performanceRating: null, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  };
}

function makeApp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-id', companyName: 'Acme', positionTitle: 'Engineer',
    status: 'applied' as const, dateApplied: null, jobPostingUrl: null,
    companyUrl: null, companyCareerUrl: null,
    companyCategory: null, jobSource: null,
    salaryMin: null, salaryMax: null, skillsMatch: null,
    coverLetterRequired: false, specialRequirements: null,
    notes: null, offerDueDate: null,
    isArchived: false, createdAt: new Date(), updatedAt: new Date(),
    interviewStages: [],
    ...overrides,
  };
}

describe('createStage', () => {
  it('throws when name is empty', async () => {
    await expect(createStage('app-id', { name: '', order: 1 }))
      .rejects.toThrow('stageName is required');
  });

  it('throws when name is whitespace only', async () => {
    await expect(createStage('app-id', { name: '   ', order: 1 }))
      .rejects.toThrow('stageName is required');
  });

  it('throws when order is negative', async () => {
    await expect(createStage('app-id', { name: 'Phone Screen', order: -1 }))
      .rejects.toThrow('order must be a non-negative integer');
  });
});

describe('deleteStage', () => {
  it('returns true on success', async () => {
    const mockStage = makeStage();
    const mockApp = makeApp();

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
