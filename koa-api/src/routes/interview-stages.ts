import Router from "@koa/router";
import { interviewStageService } from "../services/stages.service.js";
import {
  CreateInterviewStageSchema,
  UpdateInterviewStageSchema,
} from "../types/index.js";

const router = new Router({ prefix: "/applications/:id/interview-stages" });

// Create interview stage
router.post("/", async (ctx): Promise<void> => {
  const input = CreateInterviewStageSchema.parse(ctx.request.body);
  const stage = await interviewStageService.createStage(ctx.params.id, input);
  ctx.status = 201;
  ctx.body = stage;
});

// Update interview stage
router.patch("/:stageId", async (ctx): Promise<void> => {
  const input = UpdateInterviewStageSchema.parse(ctx.request.body);
  const stage = await interviewStageService.updateStage(
    ctx.params.id,
    ctx.params.stageId,
    input
  );
  ctx.body = stage;
});

// Delete interview stage
router.delete("/:stageId", async (ctx): Promise<void> => {
  await interviewStageService.deleteStage(ctx.params.id, ctx.params.stageId);
  ctx.status = 204;
});

export default router;
