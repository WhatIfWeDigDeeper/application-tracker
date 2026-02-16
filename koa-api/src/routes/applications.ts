import Router from "@koa/router";
import { applicationService } from "../services/applications.service.js";
import { listHistory, restoreToVersion } from "../services/history.service.js";
import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
  ListApplicationsQuerySchema,
  RestoreRequestSchema,
} from "../types/index.js";

const router = new Router({ prefix: "/applications" });

// List applications with filters and pagination
router.get("/", async (ctx): Promise<void> => {
  const queryParams = ListApplicationsQuerySchema.parse(ctx.query);
  const result = await applicationService.listApplications(queryParams);
  ctx.body = result;
});

// Create application
router.post("/", async (ctx): Promise<void> => {
  const input = CreateApplicationSchema.parse(ctx.request.body);
  const app = await applicationService.createApplication(input);
  ctx.status = 201;
  ctx.body = app;
});

// Get single application
router.get("/:id", async (ctx): Promise<void> => {
  const app = await applicationService.getApplication(ctx.params.id);
  ctx.body = app;
});

// Update application
router.patch("/:id", async (ctx): Promise<void> => {
  const input = UpdateApplicationSchema.parse(ctx.request.body);
  const app = await applicationService.updateApplication(ctx.params.id, input);
  ctx.body = app;
});

// Delete application
router.delete("/:id", async (ctx): Promise<void> => {
  await applicationService.deleteApplication(ctx.params.id);
  ctx.status = 204;
});

// Archive application
router.post("/:id/archive", async (ctx): Promise<void> => {
  const app = await applicationService.archiveApplication(ctx.params.id);
  ctx.body = app;
});

// Restore application
router.post("/:id/restore", async (ctx): Promise<void> => {
  const app = await applicationService.restoreApplication(ctx.params.id);
  ctx.body = app;
});

// Get application history
router.get("/:id/history", async (ctx): Promise<void> => {
  const rawPage = parseInt((ctx.query.page as string) || "1");
  const rawLimit = parseInt((ctx.query.limit as string) || "50");
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 100);
  const result = await listHistory(ctx.params.id, page, limit);
  ctx.body = result;
});

// Restore to a historical version
router.post("/:id/history/restore", async (ctx): Promise<void> => {
  const { sequence } = RestoreRequestSchema.parse(ctx.request.body);
  const app = await restoreToVersion(ctx.params.id, sequence);
  if (!app) {
    ctx.status = 404;
    ctx.body = { code: "not_found", message: "History entry not found" };
    return;
  }
  ctx.body = app;
});

export default router;
