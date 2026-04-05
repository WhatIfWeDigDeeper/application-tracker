/**
 * Unit tests for pure functions — no DynamoDB required.
 * These run with `npm test` in the lambda-api package.
 * For API integration tests against a running server, use:
 *   npm run test:api:lambda-api (requires DynamoDB Local on port 8000)
 */
import { describe, it, expect } from 'vitest';
import {
  appPK,
  stageSK,
  historySK,
  gsi1PK,
  gsiSK,
  GSI2_ACTIVE,
  isApplicationItem,
  isStageItem,
  isHistoryItem,
} from '../types/dynamo.js';
import { buildDescription, computeFieldDiffs } from '../services/history.service.js';
import type { ApplicationResponse } from '../types/api.js';

// Key builder tests
describe('DynamoDB key builders', () => {
  it('appPK prefixes with APP#', () => {
    expect(appPK('abc123')).toBe('APP#abc123');
  });

  it('stageSK prefixes with STAGE#', () => {
    expect(stageSK('def456')).toBe('STAGE#def456');
  });

  it('historySK zero-pads sequence to 8 digits', () => {
    expect(historySK(1)).toBe('HIST#00000001');
    expect(historySK(42)).toBe('HIST#00000042');
    expect(historySK(99999999)).toBe('HIST#99999999');
  });

  it('historySK produces sortable order', () => {
    const sk1 = historySK(1);
    const sk2 = historySK(2);
    const sk10 = historySK(10);
    expect(sk1 < sk2).toBe(true);
    expect(sk2 < sk10).toBe(true);
  });

  it('gsi1PK encodes status and archive flag', () => {
    expect(gsi1PK('applied', false)).toBe('STATUS#applied#ARCHIVED#0');
    expect(gsi1PK('applied', true)).toBe('STATUS#applied#ARCHIVED#1');
    expect(gsi1PK('given offer', false)).toBe('STATUS#given offer#ARCHIVED#0');
  });

  it('gsiSK encodes updatedAt and id for sort', () => {
    const sk = gsiSK('2026-01-01T00:00:00.000Z', 'uuid-123');
    expect(sk).toBe('UPDATED#2026-01-01T00:00:00.000Z#uuid-123');
  });

  it('GSI2_ACTIVE is a constant string', () => {
    expect(GSI2_ACTIVE).toBe('ACTIVE');
  });
});

// Item type guard tests
describe('DynamoDB item type guards', () => {
  it('isApplicationItem returns true for APP# SK', () => {
    expect(isApplicationItem({ SK: 'APP#abc123' })).toBe(true);
    expect(isApplicationItem({ SK: 'STAGE#abc123' })).toBe(false);
    expect(isApplicationItem({ SK: 'HIST#00000001' })).toBe(false);
  });

  it('isStageItem returns true for STAGE# SK', () => {
    expect(isStageItem({ SK: 'STAGE#abc123' })).toBe(true);
    expect(isStageItem({ SK: 'APP#abc123' })).toBe(false);
  });

  it('isHistoryItem returns true for HIST# SK', () => {
    expect(isHistoryItem({ SK: 'HIST#00000001' })).toBe(true);
    expect(isHistoryItem({ SK: 'APP#abc123' })).toBe(false);
  });
});

// buildDescription tests
describe('buildDescription', () => {
  it('generates create description', () => {
    expect(buildDescription('create', 'Acme - SWE')).toBe('Created application Acme - SWE');
  });

  it('generates update description with field list', () => {
    expect(buildDescription('update', 'Status, Notes')).toBe('Updated Status, Notes');
  });

  it('generates delete description', () => {
    expect(buildDescription('delete')).toBe('Deleted application');
  });

  it('generates archive description', () => {
    expect(buildDescription('archive')).toBe('Archived application');
  });

  it('generates restore description', () => {
    expect(buildDescription('restore')).toBe('Restored from archive');
  });

  it('generates restore_version description', () => {
    expect(buildDescription('restore_version', '5')).toBe('Restored to version 5');
  });

  it('generates stage_add description', () => {
    expect(buildDescription('stage_add', 'Phone Screen')).toBe('Added interview stage "Phone Screen"');
  });

  it('generates stage_update description', () => {
    expect(buildDescription('stage_update', 'Phone Screen')).toBe('Updated interview stage "Phone Screen"');
  });

  it('generates stage_delete description', () => {
    expect(buildDescription('stage_delete', 'Phone Screen')).toBe('Removed interview stage "Phone Screen"');
  });
});

// computeFieldDiffs tests
describe('computeFieldDiffs', () => {
  const makeSnapshot = (overrides: Partial<ApplicationResponse> = {}): ApplicationResponse => ({
    id: 'app-1',
    companyName: 'Acme',
    positionTitle: 'Engineer',
    dateApplied: '2026-01-01',
    status: 'applied',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    companyUrl: null,
    jobPostingUrl: null,
    companyCareerUrl: null,
    companyCategory: null,
    skillsMatch: null,
    jobSource: null,
    coverLetterRequired: null,
    specialRequirements: null,
    salaryMin: null,
    salaryMax: null,
    notes: null,
    offerDueDate: null,
    isArchived: false,
    interviewStages: [],
    ...overrides,
  });

  it('returns no changes when snapshots are identical', () => {
    const snap = makeSnapshot();
    expect(computeFieldDiffs(snap, snap)).toHaveLength(0);
  });

  it('detects status change', () => {
    const before = makeSnapshot({ status: 'applied' });
    const after = makeSnapshot({ status: 'interviewing' });
    const diffs = computeFieldDiffs(before, after);
    const statusDiff = diffs.find((d) => d.field === 'status');
    expect(statusDiff).toBeDefined();
    expect(statusDiff?.oldValue).toBe('applied');
    expect(statusDiff?.newValue).toBe('interviewing');
  });

  it('detects companyName change', () => {
    const before = makeSnapshot({ companyName: 'Acme' });
    const after = makeSnapshot({ companyName: 'Globex' });
    const diffs = computeFieldDiffs(before, after);
    const diff = diffs.find((d) => d.field === 'companyName');
    expect(diff?.oldValue).toBe('Acme');
    expect(diff?.newValue).toBe('Globex');
  });

  it('detects interview stage changes', () => {
    const before = makeSnapshot({ interviewStages: [] });
    const after = makeSnapshot({
      interviewStages: [
        {
          id: 'stage-1',
          name: 'Phone Screen',
          order: 0,
          isCompleted: false,
          completedDate: null,
          notes: null,
          performanceRating: null,
        },
      ],
    });
    const diffs = computeFieldDiffs(before, after);
    const stageDiff = diffs.find((d) => d.field === 'interviewStages');
    expect(stageDiff).toBeDefined();
  });

  it('does not report unchanged null fields', () => {
    const snap = makeSnapshot({ notes: null });
    const diffs = computeFieldDiffs(snap, snap);
    expect(diffs).toHaveLength(0);
  });
});
