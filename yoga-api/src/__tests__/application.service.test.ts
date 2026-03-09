import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';

const mockPrisma = mockDeep<PrismaClient>();
vi.mock('../db/client.js', () => ({ prisma: mockPrisma }));

beforeEach(() => mockReset(mockPrisma));

// Import after mock setup
const { listApplications, createApplication, updateApplication, deleteApplication } = await import('../services/application.service.js');

function makeApp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-id', companyName: 'Acme', positionTitle: 'Engineer',
    status: 'applied' as const, dateApplied: null, jobPostingUrl: null,
    companyUrl: null, companyCareerUrl: null,
    companyCategory: null, jobSource: null,
    salaryMin: null, salaryMax: null, skillsMatch: null,
    coverLetterRequired: false, specialRequirements: null,
    notes: null, offerDueDate: null,
    isArchived: false, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  };
}

describe('listApplications', () => {
  it('excludes archived by default', async () => {
    mockPrisma.application.findMany.mockResolvedValue([]);
    mockPrisma.application.count.mockResolvedValue(0);

    await listApplications();

    expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isArchived: false }),
      })
    );
  });
});

describe('createApplication', () => {
  it('throws when companyName is empty', async () => {
    await expect(createApplication({ companyName: '', positionTitle: 'Engineer' }))
      .rejects.toThrow('companyName is required');
  });

  it('throws when companyName is whitespace only', async () => {
    await expect(createApplication({ companyName: '   ', positionTitle: 'Engineer' }))
      .rejects.toThrow('companyName is required');
  });

  it('auto-sets dateApplied when status is applied', async () => {
    const mockApp = { ...makeApp({ dateApplied: new Date() }), interviewStages: [] };

    mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
    mockPrisma.application.create.mockResolvedValue(mockApp);
    mockPrisma.applicationHistory.findFirst.mockResolvedValue(null);
    mockPrisma.applicationHistory.create.mockResolvedValue({
      id: 'h1', applicationId: 'test-id', sequence: 1,
      snapshot: {}, changedFields: [], createdAt: new Date(),
    });

    await createApplication({ companyName: 'Acme', positionTitle: 'Engineer', status: 'applied' });

    const createCall = mockPrisma.application.create.mock.calls[0][0];
    expect(createCall.data.dateApplied).toBeInstanceOf(Date);
  });

  it('throws when skillsMatch is out of range', async () => {
    await expect(createApplication({ companyName: 'Acme', positionTitle: 'Engineer', skillsMatch: 6 }))
      .rejects.toThrow('skillsMatch must be 1-5');
  });

  it('throws when skillsMatch is 0', async () => {
    await expect(createApplication({ companyName: 'Acme', positionTitle: 'Engineer', skillsMatch: 0 }))
      .rejects.toThrow('skillsMatch must be 1-5');
  });
});

describe('updateApplication', () => {
  it('throws when transitioning from terminal status accepted_offer', async () => {
    mockPrisma.application.findUnique.mockResolvedValue(makeApp({ status: 'accepted_offer' as const }));

    await expect(updateApplication('test-id', { status: 'applied' }))
      .rejects.toThrow('Cannot transition from terminal status accepted_offer');
  });

  it('throws when transitioning from terminal status declined_offer', async () => {
    mockPrisma.application.findUnique.mockResolvedValue(makeApp({ status: 'declined_offer' as const }));

    await expect(updateApplication('test-id', { status: 'applied' }))
      .rejects.toThrow('Cannot transition from terminal status declined_offer');
  });

  it('clears dateApplied when transitioning to unsubmitted', async () => {
    const existing = makeApp({ status: 'applied' as const, dateApplied: new Date() });
    mockPrisma.application.findUnique.mockResolvedValue(existing);

    const mockUpdated = { ...makeApp({ status: 'unsubmitted' as const, dateApplied: null }), interviewStages: [] };
    mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
    mockPrisma.application.update.mockResolvedValue(mockUpdated);
    mockPrisma.applicationHistory.findFirst.mockResolvedValue(null);
    mockPrisma.applicationHistory.create.mockResolvedValue({
      id: 'h1', applicationId: 'test-id', sequence: 1,
      snapshot: {}, changedFields: [], createdAt: new Date(),
    });

    await updateApplication('test-id', { status: 'unsubmitted' });

    const updateCall = mockPrisma.application.update.mock.calls[0][0];
    expect(updateCall.data.dateApplied).toBeNull();
  });
});

describe('deleteApplication', () => {
  it('returns true on success', async () => {
    mockPrisma.application.delete.mockResolvedValue(makeApp({ status: 'unsubmitted' as const }));

    const result = await deleteApplication('test-id');
    expect(result).toBe(true);
  });
});
