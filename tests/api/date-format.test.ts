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

  it("should accept date-only format (YYYY-MM-DD) for dateApplied on create", async () => {
    const response = await fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Test Company",
        positionTitle: "Test Position",
        dateApplied: "2026-01-05",
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
    // The API stores as full datetime but should preserve the date
    expect(data.dateApplied).toContain("2026-01-05");
  });

  it("should accept date-only format (YYYY-MM-DD) for dateApplied on update", async () => {
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
});
