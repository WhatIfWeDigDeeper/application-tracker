import { deleteApplication } from '../../services/application.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id' });
  }

  const deleted = await deleteApplication(id);
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Application not found' });
  }

  setResponseStatus(event, 204);
  return null;
});
