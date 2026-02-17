import request from "supertest";
import express, { Express } from "express";
import { requestLogger } from "../../src/middleware/logger";
import { errorHandler } from "../../src/middleware/errorHandler";

export function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);

  // Health endpoint for testing
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Placeholder routes
  app.get("/applications", (req, res) => {
    res.json({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });
  });

  app.post("/applications", (req, res) => {
    // Validate required fields
    if (!req.body.companyName || !req.body.positionTitle) {
      return res.status(400).json({
        code: "validation_error",
        message: "Missing required fields",
        details: [
          !req.body.companyName && { field: "companyName", message: "Required" },
          !req.body.positionTitle && { field: "positionTitle", message: "Required" },
        ].filter(Boolean),
      });
    }
    res.status(201).json({
      id: "test-id",
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  app.use(errorHandler);
  return app;
}

export function getRequest(app: Express): request.Agent {
  return request(app);
}
