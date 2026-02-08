import { ZodError } from 'zod';
import { CreateApplicationSchema } from '../../utils/validation';
import { createApplication } from '../../services/application.service';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const input = CreateApplicationSchema.parse(body);
    const application = await createApplication(input);
    setResponseStatus(event, 201);
    return application;
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        data: {
          code: 'validation_error',
          message: 'Invalid request body',
          details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
    }
    throw error;
  }
});
