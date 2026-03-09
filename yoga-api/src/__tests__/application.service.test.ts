import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';

const mockPrisma = mockDeep<PrismaClient>();
vi.mock('../db/client.js', () => ({ prisma: mockPrisma }));

beforeEach(() => mockReset(mockPrisma));

// Import after mock setup
const { listApplications, createApplication, updateApplication, deleteApplication } = await import('../services/application.service.js');

describe('listApplications', () => {
  it('excludes archived by default', async () => {
    mockPrisma.application.findMany.mockResolvedValue([]);
    mockPrisma.application.count.mockResolvedValue(0);

    await listApplications();

    expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: 'archived' } }),
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
    const mockApp = {
      id: 'test-id', companyName: 'Acme', positionTitle: 'Engineer',
      status: 'applied' as const, dateApplied: new Date(), jobPostingUrl: null,
      companyWebsiteUrl: null, companyCategory: null, jobSource: null,
      salaryMin: null, salaryMax: null, skillsMatch: null, notes: null,
      contactName: null, contactEmail: null, offerDueDate: null,
      isArchived: false, createdAt: new Date(), updatedAt: new Date(),
      interviewStages: [],
    };

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
});

describe('updateApplication', () => {
  it('throws when transitioning from terminal status rejected', async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: 'test-id', companyName: 'Acme', positionTitle: 'Engineer',
      status: 'rejected' as const, dateApplied: null, jobPostingUrl: null,
      companyWebsiteUrl: null, companyCategory: null, jobSource: null,
      salaryMin: null, salaryMax: null, skillsMatch: null, notes: null,
      contactName: null, contactEmail: null, offerDueDate: null,
      isArchived: false, createdAt: new Date(), updatedAt: new Date(),
    });

    await expect(updateApplication('test-id', { status: 'applied' }))
      .rejects.toThrow('Cannot transition from terminal status rejected');
  });
});

describe('deleteApplication', () => {
  it('returns true on success', async () => {
    mockPrisma.application.delete.mockResolvedValue({
      id: 'test-id', companyName: 'Acme', positionTitle: 'Engineer',
      status: 'wishlist' as const, dateApplied: null, jobPostingUrl: null,
      companyWebsiteUrl: null, companyCategory: null, jobSource: null,
      salaryMin: null, salaryMax: null, skillsMatch: null, notes: null,
      contactName: null, contactEmail: null, offerDueDate: null,
      isArchived: false, createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await deleteApplication('test-id');
    expect(result).toBe(true);
  });
});
