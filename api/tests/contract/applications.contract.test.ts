import { createTestApp, getRequest } from "../utils/server";

describe("Applications Contract Tests", () => {
  describe("GET /applications", () => {
    it("should return paginated list with 200 status", async () => {
      const app = createTestApp();
      const res = await getRequest(app).get("/applications?page=1&limit=20");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(res.body).toHaveProperty("page");
      expect(res.body).toHaveProperty("limit");
      expect(res.body).toHaveProperty("total");
    });

    it("should accept filter and pagination params", async () => {
      const app = createTestApp();
      const res = await getRequest(app)
        .get("/applications")
        .query({ status: "applied", page: 2, limit: 50, includeArchived: true });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /applications", () => {
    it("should create application with 201 status", async () => {
      const app = createTestApp();
      const payload = {
        companyName: "Test Corp",
        positionTitle: "Engineer",
      };
      const res = await getRequest(app).post("/applications").send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.companyName).toBe("Test Corp");
    });

    it("should validate required fields", async () => {
      const app = createTestApp();
      const payload = { companyName: "Test Corp" }; // Missing positionTitle
      const res = await getRequest(app).post("/applications").send(payload);
      // Will fail validation when actual service is implemented
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
