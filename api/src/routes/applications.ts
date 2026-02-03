import { Router, Request, Response, NextFunction } from "express";
import { applicationService } from "../services/applications.service.js";
import interviewStagesRouter from "./interview-stages.js";
import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
  ListApplicationsQuerySchema,
} from "../types/index.js";

const router = Router();

// Mount interview stages router
router.use("/:id/interview-stages", interviewStagesRouter);

// List applications with filters and pagination
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListApplicationsQuerySchema.parse(req.query);
    const result = await applicationService.listApplications(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create application
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateApplicationSchema.parse(req.body);
    const app = await applicationService.createApplication(input);
    res.status(201).json(app);
  } catch (err) {
    next(err);
  }
});

// Get single application
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const app = await applicationService.getApplication(id);
    res.json(app);
  } catch (err) {
    next(err);
  }
});

// Update application
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const input = UpdateApplicationSchema.parse(req.body);
    const app = await applicationService.updateApplication(id, input);
    res.json(app);
  } catch (err) {
    next(err);
  }
});

// Delete application
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await applicationService.deleteApplication(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Archive application
router.post("/:id/archive", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const app = await applicationService.archiveApplication(id);
    res.json(app);
  } catch (err) {
    next(err);
  }
});

// Restore application
router.post("/:id/restore", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const app = await applicationService.restoreApplication(id);
    res.json(app);
  } catch (err) {
    next(err);
  }
});

export default router;
