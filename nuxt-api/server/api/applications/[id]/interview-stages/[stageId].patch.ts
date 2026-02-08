import { ZodError } from 'zod';
import { UpdateInterviewStageSchema } from '../../../../utils/validation';
import { updateInterviewStage } from '../../../../services/interview-stage.service';

export default defineEventHandler(async (event) => {
  const applicationId = getRouterParam(event, 'id');
  const stageId = getRouterParam(event, 'stageId');

  if (!applicationId || !stageId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id or stage id' });
  }

  try {
    const body = await readBody(event);
    const input = UpdateInterviewStageSchema.parse(body);
    const stage = await updateInterviewStage(applicationId, stageId, input);

    if (!stage) {
      throw createError({ statusCode: 404, statusMessage: 'Interview stage not found' });
    }

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
