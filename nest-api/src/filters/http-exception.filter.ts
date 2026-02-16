import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'code' in exceptionResponse) {
        void response.status(status).send(exceptionResponse);
        return;
      }

      const message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string }).message || 'An error occurred';

      const code = status === 404 ? 'not_found'
        : status === 400 ? 'validation_error'
        : 'internal_error';

      void response.status(status).send({ code, message });
      return;
    }

    if (exception instanceof ZodError) {
      void response.status(400).send({
        code: 'validation_error',
        message: 'Validation failed',
        details: exception.issues.map(e => ({
          field: e.path.map(String).join('.'),
          message: e.message,
        })),
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = exception as any;
    console.error('Unhandled error:', err);
    void response.status(500).send({
      code: 'internal_error',
      message: 'An unexpected error occurred',
    });
  }
}
