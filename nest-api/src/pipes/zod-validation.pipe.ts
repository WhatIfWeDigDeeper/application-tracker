import { PipeTransform, BadRequestException } from '@nestjs/common';
import { type ZodType, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'validation_error',
          message: 'Validation failed',
          details: error.issues.map(e => ({
            field: e.path.map(String).join('.'),
            message: e.message,
          })),
        });
      }
      throw error;
    }
  }
}
