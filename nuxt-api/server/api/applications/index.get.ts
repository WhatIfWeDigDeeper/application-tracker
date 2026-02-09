import { ZodError } from 'zod';
import { ListApplicationsQuerySchema } from '../../utils/validation';
import { listApplications } from '../../services/application.service';

export default defineEventHandler(async (event) => {
  try {
    const rawQuery = getQuery(event);
    const query = ListApplicationsQuerySchema.parse(rawQuery);
    return await listApplications(query);
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
