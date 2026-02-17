// Integration test for date-only format support
// Requires the API server to be running at localhost:3001

const API_BASE = process.env.API_BASE_URL || "http://localhost:3001";

describe("Date Format Integration Tests", () => {
  let createdApplicationId: string | null = null;

  afterAll(async () => {
    // Clean up: delete the application if it was created
    if (createdApplicationId) {
      try {
        await fetch(`${API_BASE}/applications/${createdApplicationId}`, {
          method: "DELETE",
        });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it("should default to unsubmitted status with null dateApplied on create", async () => {
    const response = await fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Test Company",
        positionTitle: "Test Position",
        companyCategory: "education",
        skillsMatch: 5,
        jobSource: "recruiter",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    createdApplicationId = data.id;

    expect(data.companyName).toBe("Test Company");
    expect(data.positionTitle).toBe("Test Position");
    expect(data.status).toBe("unsubmitted");
    expect(data.dateApplied).toBeNull();
  });

  it("should accept date-only format (YYYY-MM-DD) for dateApplied on update", async () => {
    expect(createdApplicationId).not.toBeNull();

    const response = await fetch(`${API_BASE}/applications/${createdApplicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateApplied: "2026-01-05",
        status: "applied",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // The API stores as full datetime but should preserve the date
    expect(data.dateApplied).toContain("2026-01-05");
    expect(data.status).toBe("applied");
  });

  it("should accept date-only format (YYYY-MM-DD) for dateApplied on second update", async () => {
    expect(createdApplicationId).not.toBeNull();

    const response = await fetch(`${API_BASE}/applications/${createdApplicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateApplied: "2026-02-15",
        status: "applied",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.dateApplied).toContain("2026-02-15");
    expect(data.status).toBe("applied");
  });

  it("should accept date-only format (YYYY-MM-DD) for offerDueDate on update", async () => {
    expect(createdApplicationId).not.toBeNull();

    const response = await fetch(`${API_BASE}/applications/${createdApplicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerDueDate: "2026-03-01",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.offerDueDate).toContain("2026-03-01");
  });

  it("should reject invalid date formats", async () => {
    const response = await fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Invalid Date Company",
        positionTitle: "Test Position",
        dateApplied: "01/05/2026", // Invalid format
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("validation_error");
  });

  it("should accept date-only format (YYYY-MM-DD) for completedDate on interview stage", async () => {
    expect(createdApplicationId).not.toBeNull();

    // First create an interview stage
    const stageResponse = await fetch(`${API_BASE}/applications/${createdApplicationId}/interview-stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Phone Screen",
        isCompleted: true,
        completedDate: "2026-01-09",
        performanceRating: 5,
      }),
    });

    expect(stageResponse.status).toBe(201);
    const stageData = await stageResponse.json();

    expect(stageData.name).toBe("Phone Screen");
    expect(stageData.isCompleted).toBe(true);
    // The API stores as full datetime but should preserve the date
    expect(stageData.completedDate).toContain("2026-01-09");
  });

  it("should accept date-only format (YYYY-MM-DD) for completedDate on interview stage update", async () => {
    expect(createdApplicationId).not.toBeNull();

    // First create a stage
    const stageResponse = await fetch(`${API_BASE}/applications/${createdApplicationId}/interview-stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Technical Interview",
        isCompleted: false,
      }),
    });

    expect(stageResponse.status).toBe(201);
    const stageData = await stageResponse.json();
    const stageId = stageData.id;

    // Now update it with a completed date
    const updateResponse = await fetch(`${API_BASE}/applications/${createdApplicationId}/interview-stages/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isCompleted: true,
        completedDate: "2026-01-10",
        performanceRating: 4,
      }),
    });

    expect(updateResponse.status).toBe(200);
    const updatedData = await updateResponse.json();

    expect(updatedData.isCompleted).toBe(true);
    expect(updatedData.completedDate).toContain("2026-01-10");
    expect(updatedData.performanceRating).toBe(4);
  });
});
