import { getLatestSnapshot } from '../../../../services/event.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing application id' });
  }

  const rawQuery = getQuery(event);
  const beforeSequence = rawQuery.beforeSequence ? Number(rawQuery.beforeSequence) : undefined;

  const snapshot = await getLatestSnapshot(id, beforeSequence);
  return snapshot ?? null;
});
