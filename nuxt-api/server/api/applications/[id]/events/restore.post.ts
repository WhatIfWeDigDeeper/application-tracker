import { ZodError } from 'zod';
import { RestoreToEventSchema } from '../../../../utils/validation';
import { restoreToEvent } from '../../../../services/event.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id' });
  }

  try {
    const body = await readBody(event);
    const input = RestoreToEventSchema.parse(body);
    return await restoreToEvent(id, input.targetSequence);
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
