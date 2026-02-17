// Integration tests for CSV Import/Export endpoints on nest-api
// Requires nest-api running at localhost:5050

const API_BASE = process.env.API_BASE_URL || "http://localhost:5050";

describe("CSV Import/Export Integration Tests", () => {
  const createdApplicationIds: string[] = [];

  afterAll(async () => {
    // Clean up all created applications
    for (const id of createdApplicationIds) {
      try {
        await fetch(`${API_BASE}/applications/${id}`, { method: "DELETE" });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe("GET /applications/sample-csv", () => {
    it("should return a CSV template with correct headers", async () => {
      const response = await fetch(`${API_BASE}/applications/sample-csv`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/csv");
      expect(response.headers.get("content-disposition")).toContain(
        "applications-template.csv"
      );

      const csv = await response.text();
      const lines = csv.trim().split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(2); // header + example row

      const headers = lines[0].split(",");
      expect(headers).toContain("companyName");
      expect(headers).toContain("positionTitle");
      expect(headers).toContain("dateApplied");
      expect(headers).toContain("status");
      expect(headers).toContain("jobPostingUrl");
      expect(headers).toContain("companyCategory");
      expect(headers).toContain("skillsMatch");
      expect(headers).toContain("salaryMin");
      expect(headers).toContain("salaryMax");
      expect(headers).toContain("notes");
      expect(headers).toContain("offerDueDate");
      expect(headers.length).toBe(16);
    });
  });

  describe("POST /applications/import", () => {
    it("should import valid CSV with all fields", async () => {
      const csv = [
        "companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate",
        'CSV Test Corp,Frontend Dev,2026-01-10,applied,https://csvtest.com,https://csvtest.com/jobs/1,https://csvtest.com/careers,ai,4,linkedin,false,React experience required,90000,130000,Great opportunity,2026-03-15',
      ].join("\n");

      const formData = new FormData();
      formData.append("file", new Blob([csv], { type: "text/csv" }), "test.csv");

      const response = await fetch(`${API_BASE}/applications/import`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toEqual([]);

      // Verify the application was created by listing
      const listResponse = await fetch(`${API_BASE}/applications?limit=100`);
      const listData = await listResponse.json();
      const created = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === "CSV Test Corp"
      );
      expect(created).toBeDefined();
      if (created) createdApplicationIds.push(created.id);
      expect(created.positionTitle).toBe("Frontend Dev");
      expect(created.dateApplied).toContain("2026-01-10");
      expect(created.status).toBe("applied");
      expect(created.companyUrl).toBe("https://csvtest.com");
      expect(created.jobPostingUrl).toBe("https://csvtest.com/jobs/1");
      expect(created.skillsMatch).toBe(4);
      expect(created.salaryMin).toBe(90000);
      expect(created.salaryMax).toBe(130000);
    });

    it("should import CSV with only required fields and apply defaults", async () => {
      const csv = [
        "companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate",
        "Minimal Corp,Junior Dev,,,,,,,,,,,,,,",
      ].join("\n");

      const formData = new FormData();
      formData.append("file", new Blob([csv], { type: "text/csv" }), "test.csv");

      const response = await fetch(`${API_BASE}/applications/import`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);

      // Verify defaults
      const listResponse = await fetch(`${API_BASE}/applications?limit=100`);
      const listData = await listResponse.json();
      const created = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === "Minimal Corp"
      );
      expect(created).toBeDefined();
      if (created) createdApplicationIds.push(created.id);
      expect(created.status).toBe("unsubmitted");
      expect(created.dateApplied).toBeNull();
    });

    it("should report validation errors with row numbers", async () => {
      const csv = [
        "companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate",
        ",Missing Title,,,,,,,,,,,,,,",
        "Missing Position,,,,,,,,,,,,,,,",
        "Valid Row,Valid Title,,,,,,,,,,,,,,",
      ].join("\n");

      const formData = new FormData();
      formData.append("file", new Blob([csv], { type: "text/csv" }), "test.csv");

      const response = await fetch(`${API_BASE}/applications/import`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(1); // Only "Valid Row" succeeds
      expect(result.errors.length).toBe(2);
      expect(result.errors[0].row).toBe(2); // First data row
      expect(result.errors[1].row).toBe(3); // Second data row

      // Clean up the valid row
      const listResponse = await fetch(`${API_BASE}/applications?limit=100`);
      const listData = await listResponse.json();
      const created = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === "Valid Row"
      );
      if (created) createdApplicationIds.push(created.id);
    });

    it("should skip rows with duplicate jobPostingUrl (existing DB records)", async () => {
      // First, create an application with a known URL
      const createResponse = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Existing Corp",
          positionTitle: "Existing Role",
          jobPostingUrl: "https://existing.com/jobs/dedup-test",
        }),
      });
      expect(createResponse.status).toBe(201);
      const existingApp = await createResponse.json();
      createdApplicationIds.push(existingApp.id);

      // Now import a CSV with the same URL
      const csv = [
        "companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate",
        "Duplicate Corp,Duplicate Role,,,,https://existing.com/jobs/dedup-test,,,,,,,,,,",
      ].join("\n");

      const formData = new FormData();
      formData.append("file", new Blob([csv], { type: "text/csv" }), "test.csv");

      const response = await fetch(`${API_BASE}/applications/import`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it("should skip duplicate jobPostingUrl within the same file", async () => {
      const uniqueUrl = `https://intra-dedup-${Date.now()}.com/jobs/1`;
      const csv = [
        "companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate",
        `First Corp,First Role,,,,${uniqueUrl},,,,,,,,,,`,
        `Second Corp,Second Role,,,,${uniqueUrl},,,,,,,,,,`,
      ].join("\n");

      const formData = new FormData();
      formData.append("file", new Blob([csv], { type: "text/csv" }), "test.csv");

      const response = await fetch(`${API_BASE}/applications/import`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(1); // First row imported
      expect(result.skipped).toBe(1); // Second row skipped

      // Clean up
      const listResponse = await fetch(`${API_BASE}/applications?limit=100`);
      const listData = await listResponse.json();
      const created = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === "First Corp"
      );
      if (created) createdApplicationIds.push(created.id);
    });

    it("should never skip rows with empty jobPostingUrl", async () => {
      const csv = [
        "companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate",
        "No URL Corp A,Role A,,,,,,,,,,,,,,",
        "No URL Corp B,Role B,,,,,,,,,,,,,,",
      ].join("\n");

      const formData = new FormData();
      formData.append("file", new Blob([csv], { type: "text/csv" }), "test.csv");

      const response = await fetch(`${API_BASE}/applications/import`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(2); // Both imported — no dedup on empty URL
      expect(result.skipped).toBe(0);

      // Clean up
      const listResponse = await fetch(`${API_BASE}/applications?limit=100`);
      const listData = await listResponse.json();
      for (const name of ["No URL Corp A", "No URL Corp B"]) {
        const created = listData.items.find(
          (a: Record<string, unknown>) => a.companyName === name
        );
        if (created) createdApplicationIds.push(created.id);
      }
    });

    it("should handle empty CSV (headers only)", async () => {
      const csv =
        "companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate\n";

      const formData = new FormData();
      formData.append("file", new Blob([csv], { type: "text/csv" }), "test.csv");

      const response = await fetch(`${API_BASE}/applications/import`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it("should return error when no file is uploaded", async () => {
      const formData = new FormData();

      const response = await fetch(`${API_BASE}/applications/import`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /applications/export", () => {
    it("should export applications as CSV", async () => {
      // Create a test application first
      const createResponse = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Export Test Corp",
          positionTitle: "Export Role",
          salaryMin: 80000,
          salaryMax: 120000,
        }),
      });
      expect(createResponse.status).toBe(201);
      const createdApp = await createResponse.json();
      createdApplicationIds.push(createdApp.id);

      // Set status and dateApplied via update (create defaults to unsubmitted with null date)
      await fetch(`${API_BASE}/applications/${createdApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "interviewing", dateApplied: "2026-02-10" }),
      });

      const response = await fetch(`${API_BASE}/applications/export`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/csv");
      expect(response.headers.get("content-disposition")).toMatch(
        /applications-\d{4}-\d{2}-\d{2}\.csv/
      );

      const csv = await response.text();
      const lines = csv.trim().split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(2); // header + at least our test row

      // Check headers
      const headers = lines[0].split(",");
      expect(headers.length).toBe(16);
      expect(headers[0]).toBe("companyName");

      // Find our test row
      const found = lines.some((line) => line.includes("Export Test Corp"));
      expect(found).toBe(true);
    });

    it("should export with correct date format and boolean format", async () => {
      // Create an application with boolean and date fields
      const createResponse = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Format Test Corp",
          positionTitle: "Format Role",
          coverLetterRequired: true,
        }),
      });
      expect(createResponse.status).toBe(201);
      const createdApp = await createResponse.json();
      createdApplicationIds.push(createdApp.id);

      // Set status, dateApplied, and offerDueDate via update (create defaults to unsubmitted)
      await fetch(`${API_BASE}/applications/${createdApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "applied", dateApplied: "2026-01-20", offerDueDate: "2026-04-01" }),
      });

      const response = await fetch(`${API_BASE}/applications/export`);
      const csv = await response.text();

      // Find the format test row
      const line = csv
        .split("\n")
        .find((l: string) => l.includes("Format Test Corp"));
      expect(line).toBeDefined();
      expect(line).toContain("2026-01-20");
      expect(line).toContain("true");
      expect(line).toContain("2026-04-01");
    });

    it("should include archived applications in export", async () => {
      // Create and archive an application
      const createResponse = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Archived Export Corp",
          positionTitle: "Archived Role",
        }),
      });
      const createdApp = await createResponse.json();
      createdApplicationIds.push(createdApp.id);

      // Archive it
      await fetch(`${API_BASE}/applications/${createdApp.id}/archive`, {
        method: "POST",
      });

      // Export should include it
      const response = await fetch(`${API_BASE}/applications/export`);
      const csv = await response.text();
      expect(csv).toContain("Archived Export Corp");
    });

    it("should produce round-trip compatible CSV (export then import)", async () => {
      const uniqueUrl = `https://roundtrip-${Date.now()}.com/jobs/1`;
      // Create a test application
      const createResponse = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Roundtrip Corp",
          positionTitle: "Roundtrip Role",
          jobPostingUrl: uniqueUrl,
          skillsMatch: 3,
          coverLetterRequired: false,
          salaryMin: 70000,
          salaryMax: 100000,
        }),
      });
      const createdApp = await createResponse.json();
      createdApplicationIds.push(createdApp.id);

      // Export
      const exportResponse = await fetch(`${API_BASE}/applications/export`);
      const csv = await exportResponse.text();

      // Find our row in the export
      const lines = csv.split("\n");
      const roundtripLine = lines.find((l: string) =>
        l.includes("Roundtrip Corp") && l.includes(uniqueUrl)
      );
      expect(roundtripLine).toBeDefined();

      // Delete the original
      await fetch(`${API_BASE}/applications/${createdApp.id}`, {
        method: "DELETE",
      });
      // Remove from cleanup list since we deleted it
      const idx = createdApplicationIds.indexOf(createdApp.id);
      if (idx >= 0) createdApplicationIds.splice(idx, 1);

      // Re-import just that row
      const reimportCsv = lines[0] + "\n" + roundtripLine + "\n";
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([reimportCsv], { type: "text/csv" }),
        "roundtrip.csv"
      );

      const importResponse = await fetch(`${API_BASE}/applications/import`, {
        method: "POST",
        body: formData,
      });
      const result = await importResponse.json();
      expect(result.imported).toBe(1);

      // Verify the re-imported data
      const listResponse = await fetch(`${API_BASE}/applications?limit=100`);
      const listData = await listResponse.json();
      const reimported = listData.items.find(
        (a: Record<string, unknown>) => a.companyName === "Roundtrip Corp" && a.jobPostingUrl === uniqueUrl
      );
      expect(reimported).toBeDefined();
      if (reimported) createdApplicationIds.push(reimported.id);
      expect(reimported.positionTitle).toBe("Roundtrip Role");
      expect(reimported.status).toBe("unsubmitted"); // DB default (create doesn't accept status)
      expect(reimported.skillsMatch).toBe(3);
      expect(reimported.salaryMin).toBe(70000);
    });
  });
});
