import { describe, expect, it, vi } from 'vitest';
import * as applicationService from '../services/application.service.js';
import { importApplications, parseCSV, serializeToCSV } from '../services/csv.service.js';

describe('csv.service parseCSV', () => {
  it('parses with header row', () => {
    const csv = [
      'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
      'Acme,Engineer,2026-04-01,applied,,,,,4,linkedin,false,,80000,120000,,2026-04-21,false',
    ].join('\n');

    const parsed = parseCSV(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].companyName).toBe('Acme');
    expect(parsed[0].skillsMatch).toBe('4');
  });

  it('parses without header row', () => {
    const csv =
      'Acme,Engineer,2026-04-01,applied,,,,,4,linkedin,false,,80000,120000,,2026-04-21,false\n';

    const parsed = parseCSV(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].positionTitle).toBe('Engineer');
  });

  it('parses quoted multiline values', () => {
    const csv = [
      'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
      'Acme,Engineer,2026-04-01,applied,,,,,4,linkedin,false,,80000,120000,"Line 1\nLine 2",2026-04-21,false',
    ].join('\n');

    const parsed = parseCSV(csv);
    expect(parsed[0].notes).toBe('Line 1\nLine 2');
  });
});

describe('csv.service serializeToCSV', () => {
  it('escapes commas/newlines/quotes', () => {
    const csv = serializeToCSV([
      {
        companyName: 'Acme',
        positionTitle: 'Engineer',
        status: 'applied',
        notes: 'One, "two",\nthree',
      },
    ]);

    expect(csv).toContain('"One, ""two"",\nthree"');
  });
});

describe('csv.service importApplications', () => {
  it('skips duplicate jobPostingUrl rows', async () => {
    const csv = [
      'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
      'Acme,Engineer,2026-04-01,applied,,https://jobs.example/123,,,4,linkedin,false,,80000,120000,,,false',
    ].join('\n');

    const createSpy = vi.spyOn(applicationService, 'createApplication');

    const fakeDynamo = {
      send: vi.fn().mockResolvedValue({
        Items: [{ jobPostingUrl: 'https://jobs.example/123' }],
      }),
    };

    const result = await importApplications(csv, fakeDynamo);

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
    expect(createSpy).not.toHaveBeenCalled();

    createSpy.mockRestore();
  });
});
