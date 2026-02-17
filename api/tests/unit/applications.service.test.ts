// Mock the history service
jest.mock("../../src/services/history.service", () => ({
  recordHistory: jest.fn().mockResolvedValue(undefined),
  buildDescription: jest.fn().mockReturnValue("test description"),
  FIELD_LABELS: { status: "Status", dateApplied: "Date Applied" },
}));

// Mock the db client - the factory runs before variable declarations,
// so we define the mock object inline and retrieve it later via require.
jest.mock("../../src/db/client", () => ({
  prisma: {
    application: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { ApplicationService } from "../../src/services/applications.service";
import { prisma } from "../../src/db/client";

// Cast to jest.Mock for easy access
const mockCreate = prisma.application.create as jest.Mock;
const mockFindUnique = prisma.application.findUnique as jest.Mock;
const mockUpdate = prisma.application.update as jest.Mock;

describe("ApplicationService - unsubmitted status logic", () => {
  let service: ApplicationService;

  beforeEach(() => {
    service = new ApplicationService();
    jest.clearAllMocks();
  });

  describe("createApplication", () => {
    it("should default to 'unsubmitted' status with null dateApplied", async () => {
      const input = {
        companyName: "Test Corp",
        positionTitle: "Engineer",
      };

      const mockCreated = {
        id: "test-id",
        ...input,
        status: "unsubmitted",
        dateApplied: null,
        interviewStages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCreate.mockResolvedValue(mockCreated);

      await service.createApplication(input);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "unsubmitted",
            dateApplied: null,
          }),
        })
      );
    });

    it("should force dateApplied to null even if provided, since status defaults to unsubmitted", async () => {
      const input = {
        companyName: "Test Corp",
        positionTitle: "Engineer",
        dateApplied: "2026-01-15",
      };

      const mockCreated = {
        id: "test-id",
        ...input,
        status: "unsubmitted",
        dateApplied: null,
        interviewStages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCreate.mockResolvedValue(mockCreated);

      await service.createApplication(input);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "unsubmitted",
            dateApplied: null,
          }),
        })
      );
    });
  });

  describe("updateApplication", () => {
    it("should clear dateApplied when status is set to 'unsubmitted'", async () => {
      const existingApp = {
        id: "test-id",
        companyName: "Test Corp",
        positionTitle: "Engineer",
        status: "applied",
        dateApplied: new Date("2026-01-15"),
      };

      mockFindUnique.mockResolvedValue(existingApp);
      mockUpdate.mockResolvedValue({
        ...existingApp,
        status: "unsubmitted",
        dateApplied: null,
        interviewStages: [],
      });

      await service.updateApplication("test-id", { status: "unsubmitted" });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "unsubmitted",
            dateApplied: null,
          }),
        })
      );
    });

    it("should force dateApplied to null even when dateApplied is also provided with unsubmitted status", async () => {
      const existingApp = {
        id: "test-id",
        companyName: "Test Corp",
        positionTitle: "Engineer",
        status: "applied",
        dateApplied: new Date("2026-01-15"),
      };

      mockFindUnique.mockResolvedValue(existingApp);
      mockUpdate.mockResolvedValue({
        ...existingApp,
        status: "unsubmitted",
        dateApplied: null,
        interviewStages: [],
      });

      await service.updateApplication("test-id", {
        status: "unsubmitted",
        dateApplied: "2026-02-01",
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "unsubmitted",
            dateApplied: null,
          }),
        })
      );
    });

    it("should preserve dateApplied when status is not 'unsubmitted'", async () => {
      const existingApp = {
        id: "test-id",
        companyName: "Test Corp",
        positionTitle: "Engineer",
        status: "unsubmitted",
        dateApplied: null,
      };

      mockFindUnique.mockResolvedValue(existingApp);
      mockUpdate.mockResolvedValue({
        ...existingApp,
        status: "applied",
        dateApplied: new Date("2026-02-01"),
        interviewStages: [],
      });

      await service.updateApplication("test-id", {
        status: "applied",
        dateApplied: "2026-02-01",
      });

      // dateApplied should be converted to Date, NOT forced to null
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "applied",
            dateApplied: new Date("2026-02-01T00:00:00.000Z"),
          }),
        })
      );
    });
  });
});
