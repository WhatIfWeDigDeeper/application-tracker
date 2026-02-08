import { deleteInterviewStage } from '../../../../services/interview-stage.service';

export default defineEventHandler(async (event) => {
  const applicationId = getRouterParam(event, 'id');
  const stageId = getRouterParam(event, 'stageId');

  if (!applicationId || !stageId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id or stage id' });
  }

  const deleted = await deleteInterviewStage(applicationId, stageId);
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Interview stage not found' });
  }

  setResponseStatus(event, 204);
  return null;
});
