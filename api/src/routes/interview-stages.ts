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
    const input = CreateInterviewStageSchema.parse(req.body);
    const stage = await interviewStageService.createStage(req.params.id, input);
    res.status(201).json(stage);
  } catch (err) {
    next(err);
  }
});

// Update interview stage
router.patch("/:stageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = UpdateInterviewStageSchema.parse(req.body);
    const stage = await interviewStageService.updateStage(req.params.stageId, input);
    res.json(stage);
  } catch (err) {
    next(err);
  }
});

// Delete interview stage
router.delete("/:stageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await interviewStageService.deleteStage(req.params.stageId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
