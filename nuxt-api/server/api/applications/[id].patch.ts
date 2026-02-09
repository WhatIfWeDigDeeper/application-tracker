import { ZodError } from 'zod';
import { UpdateApplicationSchema } from '../../utils/validation';
import { updateApplication } from '../../services/application.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id' });
  }

  try {
    const body = await readBody(event);
    const input = UpdateApplicationSchema.parse(body);
    const application = await updateApplication(id, input);

    if (!application) {
      throw createError({ statusCode: 404, statusMessage: 'Application not found' });
    }

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
