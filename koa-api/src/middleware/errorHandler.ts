import { Context, Next } from "koa";
import { ZodError } from "zod";
import type { ErrorResponse } from "../types/index.js";

export class AppError extends Error {
  constructor(
    public code: ErrorResponse["code"],
    public statusCode: number,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export async function errorHandler(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (err) {
    console.error("Error:", (err as Error).message, (err as Error).stack);

    if (err instanceof AppError) {
      ctx.status = err.statusCode;
      ctx.body = {
        code: err.code,
        message: err.message,
        details: err.details,
      } as ErrorResponse;
      return;
    }

    if (err instanceof ZodError) {
      ctx.status = 400;
      ctx.body = {
        code: "validation_error",
        message: "Validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      } as ErrorResponse;
      return;
    }

    ctx.status = 500;
    ctx.body = {
      code: "internal_error",
      message: "Internal server error",
    } as ErrorResponse;
  }
}
