import { describe, it, expect } from "vitest";
import { formatSalaryRange } from "./utils";

describe("formatSalaryRange", () => {
  it("should format both min and max when both are provided", () => {
    expect(formatSalaryRange(50000, 100000)).toBe("$50,000 - $100,000");
  });

  it("should format only min when only min is provided", () => {
    expect(formatSalaryRange(50000, null)).toBe("From $50,000");
  });

  it("should format only max when only max is provided", () => {
    expect(formatSalaryRange(null, 100000)).toBe("Up to $100,000");
  });

  it("should return empty string when both are null", () => {
    expect(formatSalaryRange(null, null)).toBe("");
  });

  it("should handle 0 as a valid min value", () => {
    expect(formatSalaryRange(0, 100000)).toBe("$0 - $100,000");
  });

  it("should handle 0 as a valid max value", () => {
    expect(formatSalaryRange(50000, 0)).toBe("$50,000 - $0");
  });

  it("should handle both min and max as 0", () => {
    expect(formatSalaryRange(0, 0)).toBe("$0 - $0");
  });

  it("should handle only min as 0", () => {
    expect(formatSalaryRange(0, null)).toBe("From $0");
  });

  it("should handle only max as 0", () => {
    expect(formatSalaryRange(null, 0)).toBe("Up to $0");
  });
});
