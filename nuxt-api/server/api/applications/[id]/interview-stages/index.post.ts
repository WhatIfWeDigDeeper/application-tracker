import { ZodError } from 'zod';
import { CreateInterviewStageSchema } from '../../../../utils/validation';
import { createInterviewStage } from '../../../../services/interview-stage.service';

export default defineEventHandler(async (event) => {
  const applicationId = getRouterParam(event, 'id');
  if (!applicationId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id' });
  }

  try {
    const body = await readBody(event);
    const input = CreateInterviewStageSchema.parse(body);
    const stage = await createInterviewStage(applicationId, input);

    if (!stage) {
      throw createError({ statusCode: 404, statusMessage: 'Application not found' });
    }

    setResponseStatus(event, 201);
    return stage;
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
