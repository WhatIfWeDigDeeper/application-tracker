import { describe, it, expect } from 'vitest';
import { generateFieldChanges, generateDescription } from '../eventDescriptions';
import type { Application } from '@/types';

function createMockApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    companyName: 'Acme Corp',
    positionTitle: 'Software Engineer',
    dateApplied: '2025-01-15',
    status: 'applied',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
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
  };
}

describe('generateFieldChanges', () => {
  it('produces correct FieldChange objects for changed fields', () => {
    const oldState = createMockApplication({ status: 'applied', companyName: 'Acme Corp' });
    const newState = createMockApplication({ status: 'interviewing', companyName: 'Acme Corp' });

    const changes = generateFieldChanges(oldState, newState, ['status', 'companyName']);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      field: 'status',
      label: 'Status',
      oldValue: 'applied',
      newValue: 'interviewing',
    });
  });

  it('returns empty array when no fields actually changed', () => {
    const app = createMockApplication();
    const changes = generateFieldChanges(app, app, ['companyName', 'status']);
    expect(changes).toHaveLength(0);
  });

  it('produces changes for multiple fields', () => {
    const oldState = createMockApplication({ companyName: 'Old Inc', salaryMin: 100000 });
    const newState = createMockApplication({ companyName: 'New Inc', salaryMin: 120000 });

    const changes = generateFieldChanges(oldState, newState, ['companyName', 'salaryMin']);

    expect(changes).toHaveLength(2);
    expect(changes[0]).toEqual({
      field: 'companyName',
      label: 'Company Name',
      oldValue: 'Old Inc',
      newValue: 'New Inc',
    });
    expect(changes[1]).toEqual({
      field: 'salaryMin',
      label: 'Minimum Salary',
      oldValue: 100000,
      newValue: 120000,
    });
  });

  it('handles null to value transitions', () => {
    const oldState = createMockApplication({ notes: null });
    const newState = createMockApplication({ notes: 'Some notes' });

    const changes = generateFieldChanges(oldState, newState, ['notes']);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      field: 'notes',
      label: 'Notes',
      oldValue: null,
      newValue: 'Some notes',
    });
  });

  it('uses field name as label when field is not in FIELD_LABELS', () => {
    const oldState = createMockApplication();
    const newState = { ...createMockApplication(), unknownField: 'value' } as unknown as Application;
    (oldState as unknown as Record<string, unknown>).unknownField = 'old';

    const changes = generateFieldChanges(oldState, newState, ['unknownField']);

    expect(changes).toHaveLength(1);
    expect(changes[0].label).toBe('unknownField');
  });
});

describe('generateDescription', () => {
  const app = createMockApplication();

  it('generates create description', () => {
    const desc = generateDescription('create', app);
    expect(desc).toBe('Created application "Acme Corp - Software Engineer"');
  });

  it('generates delete description', () => {
    const desc = generateDescription('delete', app);
    expect(desc).toBe('Deleted application "Acme Corp - Software Engineer"');
  });

  it('generates archive description', () => {
    const desc = generateDescription('archive', app);
    expect(desc).toBe('Archived application "Acme Corp - Software Engineer"');
  });

  it('generates restore description', () => {
    const desc = generateDescription('restore', app);
    expect(desc).toBe('Restored application "Acme Corp - Software Engineer"');
  });

  it('generates single-field status update description', () => {
    const desc = generateDescription('update', app, { status: 'interviewing' });
    expect(desc).toBe('Changed status to "Interviewing"');
  });

  it('generates single-field non-status update description', () => {
    const desc = generateDescription('update', app, { companyName: 'New Corp' });
    expect(desc).toBe('Updated Company Name');
  });

  it('generates multi-field update description', () => {
    const desc = generateDescription('update', app, { companyName: 'New Corp', status: 'interviewing' });
    expect(desc).toBe('Updated 2 fields');
  });

  it('generates addStage description', () => {
    const desc = generateDescription('addStage', app, undefined, 'Phone Screen');
    expect(desc).toBe('Added interview stage "Phone Screen"');
  });

  it('generates updateStage description', () => {
    const desc = generateDescription('updateStage', app, undefined, 'On-site');
    expect(desc).toBe('Updated interview stage "On-site"');
  });

  it('generates deleteStage description', () => {
    const desc = generateDescription('deleteStage', app, undefined, 'Final Round');
    expect(desc).toBe('Removed interview stage "Final Round"');
  });

  it('generates toggleStage description', () => {
    const desc = generateDescription('toggleStage', app, undefined, 'Coding Challenge');
    expect(desc).toBe('Toggled completion for "Coding Challenge"');
  });

  it('returns default description for unknown action', () => {
    const desc = generateDescription('unknown', app);
    expect(desc).toBe('Modified application');
  });
});
