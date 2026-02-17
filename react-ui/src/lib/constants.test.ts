import { describe, it, expect } from "vitest";
import { APPLICATION_STATUSES, STATUS_COLORS } from "./constants";

describe("APPLICATION_STATUSES - unsubmitted", () => {
  it('should have "unsubmitted" as the first status', () => {
    expect(APPLICATION_STATUSES[0].value).toBe("unsubmitted");
    expect(APPLICATION_STATUSES[0].label).toBe("Unsubmitted");
  });

  it("should include all expected statuses", () => {
    const values = APPLICATION_STATUSES.map((s) => s.value);
    expect(values).toContain("unsubmitted");
    expect(values).toContain("applied");
    expect(values).toContain("interviewing");
  });
});

describe("STATUS_COLORS - unsubmitted", () => {
  it('should have a gray color for "unsubmitted"', () => {
    expect(STATUS_COLORS.unsubmitted).toContain("bg-gray-200");
    expect(STATUS_COLORS.unsubmitted).toContain("text-gray-700");
  });

  it("should have colors for all statuses", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(STATUS_COLORS[status.value]).toBeDefined();
    }
  });
});
