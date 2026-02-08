import { archiveApplication } from '../../../services/application.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id' });
  }

  const application = await archiveApplication(id);
  if (!application) {
    throw createError({ statusCode: 404, statusMessage: 'Application not found' });
  }

  return application;
});
