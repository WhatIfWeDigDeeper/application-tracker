import { createTestApp, getRequest } from "../utils/server.js";

describe("Health Endpoint", () => {
  it("should return 200 status", async () => {
    const app = createTestApp();
    const res = await getRequest(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
