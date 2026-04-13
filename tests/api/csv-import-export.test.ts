// Integration tests for CSV Import/Export endpoints
// Runs against all 5 CSV-capable stacks when API_URL is unset, or a single stack when API_URL is set.

import { CSV_STACKS, getTargetStacks } from './helpers';

const targets = getTargetStacks(CSV_STACKS);
const describeEach = targets.length > 0
  ? describe.each(targets)
  : describe.skip.each([{ name: 'no-csv-stacks', baseUrl: '' }]);

describeEach('CSV Import/Export ($name)', ({ baseUrl }) => {
  const createdApplicationIds: string[] = [];

  afterAll(async () => {
    for (const id of createdApplicationIds) {
      try {
        await fetch(`${baseUrl}/applications/${id}`, { method: 'DELETE' });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('GET /applications/sample-csv', () => {
    it('should return a CSV template with correct headers', async () => {
      const response = await fetch(`${baseUrl}/applications/sample-csv`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
      expect(response.headers.get('content-disposition')).toContain(
        'applications-template.csv'
      );

      const csv = await response.text();
      const lines = csv.trim().split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2); // header + example row

      const headers = lines[0].split(',');
      expect(headers).toContain('companyName');
      expect(headers).toContain('positionTitle');
      expect(headers).toContain('dateApplied');
      expect(headers).toContain('status');
      expect(headers).toContain('jobPostingUrl');
      expect(headers).toContain('companyCategory');
      expect(headers).toContain('skillsMatch');
      expect(headers).toContain('salaryMin');
      expect(headers).toContain('salaryMax');
      expect(headers).toContain('notes');
      expect(headers).toContain('offerDueDate');
      expect(headers).toContain('isArchived');
      expect(headers.length).toBe(17);
    });
  });

  describe('POST /applications/import', () => {
    it('should import valid CSV with all fields', async () => {
      const csv = [
        'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
        'API: CSV Test Corp,Frontend Dev,2026-01-10,applied,https://csvtest.com,https://csvtest.com/jobs/1,https://csvtest.com/careers,ai,4,linkedin,false,React experience required,90000,130000,Great opportunity,2026-03-15,false',
      ].join('\n');

      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv');

      const response = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toEqual([]);

      const listResponse = await fetch(`${baseUrl}/applications?limit=100`);
      const listData = await listResponse.json();
      const created = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === 'API: CSV Test Corp'
      );
      expect(created).toBeDefined();
      if (created) createdApplicationIds.push(created.id as string);
      expect(created.positionTitle).toBe('Frontend Dev');
      expect(created.dateApplied).toContain('2026-01-10');
      expect(created.status).toBe('applied');
      expect(created.companyUrl).toBe('https://csvtest.com');
      expect(created.jobPostingUrl).toBe('https://csvtest.com/jobs/1');
      expect(created.skillsMatch).toBe(4);
      expect(created.salaryMin).toBe(90000);
      expect(created.salaryMax).toBe(130000);
      expect(created.isArchived).toBe(false);
    });

    it('should import isArchived=true and create an archived application', async () => {
      const uniqueCompany = `API: Archived Import Corp ${Date.now()}`;
      const csv = [
        'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
        `${uniqueCompany},Archived Role,,,,,,,,,,,,,,,true`,
      ].join('\n');

      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv');

      const response = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(1);
      expect(result.errors).toEqual([]);

      const listResponse = await fetch(`${baseUrl}/applications?limit=100&includeArchived=true`);
      const listData = await listResponse.json();
      const created = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === uniqueCompany
      );
      expect(created).toBeDefined();
      if (created) createdApplicationIds.push(created.id as string);
      expect(created.isArchived).toBe(true);
    });

    it('should import CSV with only required fields and apply defaults', async () => {
      const csv = [
        'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
        'API: Minimal Corp,Junior Dev,,,,,,,,,,,,,,,',
      ].join('\n');

      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv');

      const response = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);

      const listResponse = await fetch(`${baseUrl}/applications?limit=100`);
      const listData = await listResponse.json();
      const created = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === 'API: Minimal Corp'
      );
      expect(created).toBeDefined();
      if (created) createdApplicationIds.push(created.id as string);
      expect(created.status).toBe('unsubmitted');
      expect(created.dateApplied).toBeNull();
    });

    it('should report validation errors with row numbers', async () => {
      const csv = [
        'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
        ',Missing Title,,,,,,,,,,,,,,,',
        'Missing Position,,,,,,,,,,,,,,,,',
        'API: Valid Row,Valid Title,,,,,,,,,,,,,,,',
      ].join('\n');

      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv');

      const response = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(1);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[1].row).toBe(3);

      const listResponse = await fetch(`${baseUrl}/applications?limit=100`);
      const listData = await listResponse.json();
      const created = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === 'API: Valid Row'
      );
      if (created) createdApplicationIds.push(created.id as string);
    });

    it('should skip rows with duplicate jobPostingUrl (existing DB records)', async () => {
      const createResponse = await fetch(`${baseUrl}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'API: Existing Corp',
          positionTitle: 'Existing Role',
          jobPostingUrl: 'https://existing.com/jobs/dedup-test',
        }),
      });
      expect(createResponse.status).toBe(201);
      const existingApp = await createResponse.json();
      createdApplicationIds.push(existingApp.id);

      const csv = [
        'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
        'API: Duplicate Corp,Duplicate Role,,,,https://existing.com/jobs/dedup-test,,,,,,,,,,,',
      ].join('\n');

      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv');

      const response = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should skip duplicate jobPostingUrl within the same file', async () => {
      const uniqueUrl = `https://intra-dedup-${Date.now()}.com/jobs/1`;
      const csv = [
        'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
        `API: First Corp,First Role,,,,${uniqueUrl},,,,,,,,,,,`,
        `API: Second Corp,Second Role,,,,${uniqueUrl},,,,,,,,,,,`,
      ].join('\n');

      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv');

      const response = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);

      const listResponse = await fetch(`${baseUrl}/applications?limit=100`);
      const listData = await listResponse.json();
      const created = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === 'API: First Corp'
      );
      if (created) createdApplicationIds.push(created.id as string);
    });

    it('should never skip rows with empty jobPostingUrl', async () => {
      const csv = [
        'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived',
        'API: No URL Corp A,Role A,,,,,,,,,,,,,,,',
        'API: No URL Corp B,Role B,,,,,,,,,,,,,,,',
      ].join('\n');

      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv');

      const response = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);

      const listResponse = await fetch(`${baseUrl}/applications?limit=100`);
      const listData = await listResponse.json();
      for (const name of ['API: No URL Corp A', 'API: No URL Corp B']) {
        const created = listData.items.find(
          (a: Record<string, unknown>) => a.companyName === name
        );
        if (created) createdApplicationIds.push(created.id as string);
      }
    });

    it('should handle empty CSV (headers only)', async () => {
      const csv =
        'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived\n';

      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv');

      const response = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should return error when no file is uploaded', async () => {
      const formData = new FormData();

      const response = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });

      // 400 Bad Request or 422 Unprocessable Entity depending on the stack
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('GET /applications/export', () => {
    it('should export applications as CSV', async () => {
      const createResponse = await fetch(`${baseUrl}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'API: Export Test Corp',
          positionTitle: 'Export Role',
          salaryMin: 80000,
          salaryMax: 120000,
        }),
      });
      expect(createResponse.status).toBe(201);
      const createdApp = await createResponse.json();
      createdApplicationIds.push(createdApp.id);

      await fetch(`${baseUrl}/applications/${createdApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'API: Export Test Corp',
          positionTitle: 'Export Role',
          status: 'interviewing',
          dateApplied: '2026-02-10',
        }),
      });

      const response = await fetch(`${baseUrl}/applications/export`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
      expect(response.headers.get('content-disposition')).toMatch(
        /applications-\d{4}-\d{2}-\d{2}\.csv/
      );

      const csv = await response.text();
      const lines = csv.trim().split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);

      const headers = lines[0].split(',');
      expect(headers.length).toBe(17);
      expect(headers[0]).toBe('companyName');

      const found = lines.some((line) => line.includes('API: Export Test Corp'));
      expect(found).toBe(true);
    });

    it('should export with correct date format and boolean format', async () => {
      const createResponse = await fetch(`${baseUrl}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'API: Format Test Corp',
          positionTitle: 'Format Role',
          coverLetterRequired: true,
        }),
      });
      expect(createResponse.status).toBe(201);
      const createdApp = await createResponse.json();
      createdApplicationIds.push(createdApp.id);

      await fetch(`${baseUrl}/applications/${createdApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'API: Format Test Corp',
          positionTitle: 'Format Role',
          status: 'applied',
          dateApplied: '2026-01-20',
          offerDueDate: '2026-04-01',
          coverLetterRequired: true,
        }),
      });

      const response = await fetch(`${baseUrl}/applications/export`);
      const csv = await response.text();

      const line = csv.split('\n').find((l: string) => l.includes('API: Format Test Corp'));
      expect(line).toBeDefined();
      expect(line).toContain('2026-01-20');
      expect(line).toContain('true');
      expect(line).toContain('2026-04-01');
    });

    it('should include archived applications in export', async () => {
      const createResponse = await fetch(`${baseUrl}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'API: Archived Export Corp',
          positionTitle: 'Archived Role',
        }),
      });
      const createdApp = await createResponse.json();
      createdApplicationIds.push(createdApp.id);

      await fetch(`${baseUrl}/applications/${createdApp.id}/archive`, {
        method: 'POST',
      });

      const response = await fetch(`${baseUrl}/applications/export`);
      const csv = await response.text();
      expect(csv).toContain('API: Archived Export Corp');
      const lines = csv.split('\n');
      const headers = lines[0].trim().split(',');
      const isArchivedIdx = headers.indexOf('isArchived');
      expect(isArchivedIdx).toBeGreaterThan(-1);
      const archivedRow = lines.find((l: string) => l.includes('API: Archived Export Corp'));
      expect(archivedRow).toBeDefined();
      if (archivedRow) {
        const cols = archivedRow.trim().split(',');
        expect(cols[isArchivedIdx]).toBe('true');
      }
    });

    it('should produce round-trip compatible CSV (export then import)', async () => {
      const uniqueUrl = `https://roundtrip-${Date.now()}.com/jobs/1`;
      const createResponse = await fetch(`${baseUrl}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'API: Roundtrip Corp',
          positionTitle: 'Roundtrip Role',
          jobPostingUrl: uniqueUrl,
          skillsMatch: 3,
          coverLetterRequired: false,
          salaryMin: 70000,
          salaryMax: 100000,
        }),
      });
      const createdApp = await createResponse.json();
      createdApplicationIds.push(createdApp.id);

      const exportResponse = await fetch(`${baseUrl}/applications/export`);
      const csv = await exportResponse.text();

      const lines = csv.split('\n');
      const roundtripLine = lines.find((l: string) =>
        l.includes('API: Roundtrip Corp') && l.includes(uniqueUrl)
      );
      expect(roundtripLine).toBeDefined();

      await fetch(`${baseUrl}/applications/${createdApp.id}`, { method: 'DELETE' });
      const idx = createdApplicationIds.indexOf(createdApp.id);
      if (idx >= 0) createdApplicationIds.splice(idx, 1);

      const reimportCsv = lines[0] + '\n' + roundtripLine + '\n';
      const formData = new FormData();
      formData.append('file', new Blob([reimportCsv], { type: 'text/csv' }), 'roundtrip.csv');

      const importResponse = await fetch(`${baseUrl}/applications/import`, {
        method: 'POST',
        body: formData,
      });
      const result = await importResponse.json();
      expect(result.imported).toBe(1);

      const listResponse = await fetch(`${baseUrl}/applications?limit=100`);
      const listData = await listResponse.json();
      const reimported = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === 'API: Roundtrip Corp' && a.jobPostingUrl === uniqueUrl
      );
      expect(reimported).toBeDefined();
      if (reimported) createdApplicationIds.push(reimported.id as string);
      expect(reimported.positionTitle).toBe('Roundtrip Role');
      expect(reimported.status).toBe('unsubmitted');
      expect(reimported.skillsMatch).toBe(3);
      expect(reimported.salaryMin).toBe(70000);
    });
  });
});
