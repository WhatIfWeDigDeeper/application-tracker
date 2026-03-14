// Integration test for date-only format support
// Runs against all 9 stacks when API_URL is unset, or a single stack when API_URL is set.

import { ALL_STACKS, getTargetStacks } from './helpers';

describe.each(getTargetStacks(ALL_STACKS))('Date Format ($name)', ({ baseUrl, validatesDates, hasInterviewStageDates }) => {
  let createdApplicationId: string | null = null;

  afterAll(async () => {
    if (createdApplicationId) {
      try {
        await fetch(`${baseUrl}/applications/${createdApplicationId}`, {
          method: 'DELETE',
        });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should default to unsubmitted status with null dateApplied on create', async () => {
    const response = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Test Company',
        positionTitle: 'Test Position',
        companyCategory: 'education',
        skillsMatch: 5,
        jobSource: 'recruiter',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    createdApplicationId = data.id;

    expect(data.companyName).toBe('Test Company');
    expect(data.positionTitle).toBe('Test Position');
    expect(data.status).toBe('unsubmitted');
    expect(data.dateApplied).toBeNull();
  });

  it('should accept date-only format (YYYY-MM-DD) for dateApplied on update', async () => {
    expect(createdApplicationId).not.toBeNull();

    const response = await fetch(`${baseUrl}/applications/${createdApplicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Test Company',
        positionTitle: 'Test Position',
        dateApplied: '2026-01-05',
        status: 'applied',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.dateApplied).toContain('2026-01-05');
    expect(data.status).toBe('applied');
  });

  it('should accept date-only format (YYYY-MM-DD) for dateApplied on second update', async () => {
    expect(createdApplicationId).not.toBeNull();

    const response = await fetch(`${baseUrl}/applications/${createdApplicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Test Company',
        positionTitle: 'Test Position',
        dateApplied: '2026-02-15',
        status: 'applied',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.dateApplied).toContain('2026-02-15');
    expect(data.status).toBe('applied');
  });

  it('should accept date-only format (YYYY-MM-DD) for offerDueDate on update', async () => {
    expect(createdApplicationId).not.toBeNull();

    const response = await fetch(`${baseUrl}/applications/${createdApplicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Test Company',
        positionTitle: 'Test Position',
        offerDueDate: '2026-03-01',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.offerDueDate).toContain('2026-03-01');
  });

  (validatesDates ? it : it.skip)('should reject invalid date formats', async () => {
    const response = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Invalid Date Company',
        positionTitle: 'Test Position',
        dateApplied: '01/05/2026', // Invalid format
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('validation_error');
  });

  (hasInterviewStageDates ? it : it.skip)('should accept date-only format (YYYY-MM-DD) for completedDate on interview stage', async () => {
    expect(createdApplicationId).not.toBeNull();

    const stageResponse = await fetch(`${baseUrl}/applications/${createdApplicationId}/interview-stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phone Screen',
        order: 1,
        isCompleted: true,
        completedDate: '2026-01-09',
        performanceRating: 5,
      }),
    });

    expect(stageResponse.status).toBe(201);
    const stageData = await stageResponse.json();

    expect(stageData.name).toBe('Phone Screen');
    expect(stageData.isCompleted).toBe(true);
    expect(stageData.completedDate).toContain('2026-01-09');
  });

  (hasInterviewStageDates ? it : it.skip)('should accept date-only format (YYYY-MM-DD) for completedDate on interview stage update', async () => {
    expect(createdApplicationId).not.toBeNull();

    const stageResponse = await fetch(`${baseUrl}/applications/${createdApplicationId}/interview-stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Technical Interview',
        order: 2,
        isCompleted: false,
      }),
    });

    expect(stageResponse.status).toBe(201);
    const stageData = await stageResponse.json();
    const stageId = stageData.id;

    const updateResponse = await fetch(`${baseUrl}/applications/${createdApplicationId}/interview-stages/${stageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Technical Interview',
        order: 2,
        isCompleted: true,
        completedDate: '2026-01-10',
        performanceRating: 4,
      }),
    });

    expect(updateResponse.status).toBe(200);
    const updatedData = await updateResponse.json();

    expect(updatedData.isCompleted).toBe(true);
    expect(updatedData.completedDate).toContain('2026-01-10');
    expect(updatedData.performanceRating).toBe(4);
  });
});
