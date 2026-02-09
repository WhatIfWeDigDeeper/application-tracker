import { ZodError } from 'zod';
import { ListEventsQuerySchema } from '../../../../utils/validation';
import { listEvents } from '../../../../services/event.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id' });
  }

  try {
    const rawQuery = getQuery(event);
    const query = ListEventsQuerySchema.parse(rawQuery);
    return await listEvents(id, query.page, query.limit);
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        data: {
          code: 'validation_error',
          message: 'Invalid query parameters',
          details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
    }
    throw error;
  }
});
