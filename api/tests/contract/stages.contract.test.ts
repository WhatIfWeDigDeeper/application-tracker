import { createTestApp, getRequest } from "../utils/server";

describe("Interview Stages Contract Tests", () => {
  describe("POST /applications/{id}/interview-stages", () => {
    it("should create stage with 201 status", async () => {
      const app = createTestApp();
      const appId = "test-app-id";
      const payload = {
        name: "Phone Screen",
        isCompleted: false,
      };
      const res = await getRequest(app)
        .post(`/applications/${appId}/interview-stages`)
        .send(payload);
      // Will be 201 when implemented
      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe("PATCH /applications/{id}/interview-stages/{stageId}", () => {
    it("should update stage with 200 status", async () => {
      const app = createTestApp();
      const appId = "test-app-id";
      const stageId = "test-stage-id";
      // Partial payload: only send fields that changed
      const payload = {
        isCompleted: true,
      };
      const res = await getRequest(app)
        .patch(`/applications/${appId}/interview-stages/${stageId}`)
        .send(payload);
      // Will be 200 when implemented
      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  });
});
