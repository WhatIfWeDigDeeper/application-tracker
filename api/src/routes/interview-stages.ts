import { Router, Request, Response, NextFunction } from "express";
import { interviewStageService } from "../services/stages.service.js";
import {
  CreateInterviewStageSchema,
  UpdateInterviewStageSchema,
} from "../types/index.js";

const router = Router({ mergeParams: true });

// Create interview stage
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const input = CreateInterviewStageSchema.parse(req.body);
    const stage = await interviewStageService.createStage(id, input);
    res.status(201).json(stage);
  } catch (err) {
    next(err);
  }
});

// Update interview stage
router.patch("/:stageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stageId = Array.isArray(req.params.stageId) ? req.params.stageId[0] : req.params.stageId;
    const input = UpdateInterviewStageSchema.parse(req.body);
    const stage = await interviewStageService.updateStage(stageId, input);
    res.json(stage);
  } catch (err) {
    next(err);
  }
});

// Delete interview stage
router.delete("/:stageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stageId = Array.isArray(req.params.stageId) ? req.params.stageId[0] : req.params.stageId;
    await interviewStageService.deleteStage(stageId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
