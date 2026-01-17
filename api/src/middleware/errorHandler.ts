import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Array<{ field?: string; message: string }>;
}

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
    } as ErrorResponse);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      code: "validation_error",
      message: "Validation failed",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    } as ErrorResponse);
  }

  res.status(500).json({
    code: "internal_error",
    message: "Internal server error",
  } as ErrorResponse);
};
