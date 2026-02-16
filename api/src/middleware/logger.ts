import { Request, Response, NextFunction } from "express";
import { logger as log } from "../lib/logger.js";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    log.info(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};
