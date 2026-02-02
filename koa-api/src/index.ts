import "dotenv/config";
import Koa from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import applicationsRouter from "./routes/applications.js";
import interviewStagesRouter from "./routes/interview-stages.js";

const app = new Koa();
const PORT = process.env.PORT || 5010;

// Middleware
app.use(cors());
app.use(bodyParser());
app.use(logger);
app.use(errorHandler);

// Health endpoint
app.use(async (ctx, next) => {
  if (ctx.path === "/health" && ctx.method === "GET") {
    ctx.body = { status: "ok", timestamp: new Date().toISOString() };
    return;
  }
  await next();
});

// Routes
app.use(applicationsRouter.routes());
app.use(applicationsRouter.allowedMethods());
app.use(interviewStagesRouter.routes());
app.use(interviewStagesRouter.allowedMethods());

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
