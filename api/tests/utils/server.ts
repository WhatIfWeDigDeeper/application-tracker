import request from "supertest";
import express, { Express } from "express";
import { logger } from "../../src/middleware/logger.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";

export function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(logger);

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

export function getRequest(app: Express) {
  return request(app);
}
