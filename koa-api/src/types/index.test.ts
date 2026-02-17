import { ApplicationStatusSchema, CreateApplicationSchema, UpdateApplicationSchema } from "./index";

describe("ApplicationStatusSchema", () => {
  it("should accept 'unsubmitted' as a valid status", () => {
    const result = ApplicationStatusSchema.safeParse("unsubmitted");
    expect(result.success).toBe(true);
  });

  it("should have 'unsubmitted' as the first enum value", () => {
    expect(ApplicationStatusSchema.options[0]).toBe("unsubmitted");
  });

  it("should accept all other valid statuses", () => {
    const statuses = [
      "applied",
      "rejected",
      "interviewing",
      "given offer",
      "accepted offer",
      "declined offer",
      "no offer",
    ];
    for (const status of statuses) {
      const result = ApplicationStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid statuses", () => {
    const result = ApplicationStatusSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("CreateApplicationSchema - unsubmitted date constraint", () => {
  it("should accept creation without dateApplied (for unsubmitted status)", () => {
    const result = CreateApplicationSchema.safeParse({
      companyName: "Test Co",
      positionTitle: "Dev",
    });
    expect(result.success).toBe(true);
    expect(result.data?.dateApplied).toBeUndefined();
  });

  it("should accept creation with dateApplied", () => {
    const result = CreateApplicationSchema.safeParse({
      companyName: "Test Co",
      positionTitle: "Dev",
      dateApplied: "2026-01-15",
    });
    expect(result.success).toBe(true);
    expect(result.data?.dateApplied).toBe("2026-01-15");
  });
});

describe("UpdateApplicationSchema - unsubmitted status", () => {
  it("should accept setting status to 'unsubmitted'", () => {
    const result = UpdateApplicationSchema.safeParse({
      status: "unsubmitted",
    });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("unsubmitted");
  });

  it("should accept setting status to 'unsubmitted' with dateApplied undefined", () => {
    const result = UpdateApplicationSchema.safeParse({
      status: "unsubmitted",
      dateApplied: undefined,
    });
    expect(result.success).toBe(true);
  });
});
