import { ZodError } from 'zod';
import { AppendEventSchema } from '../../../../utils/validation';
import { appendEvent } from '../../../../services/event.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id' });
  }

  try {
    const body = await readBody(event);
    const input = AppendEventSchema.parse(body);
    const appEvent = await appendEvent(id, input.description, input.changes, input.patches, input.inversePatches);
    setResponseStatus(event, 201);
    return appEvent;
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
