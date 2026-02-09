import { db } from '../../db/client';
import { applications, interviewStages } from '../../db/schema';
import { getApplication } from '../../services/application.service';
import type { Application } from '~~/shared/types';

export default defineEventHandler(async (event) => {
  const body = await readBody<Application>(event);

  if (!body?.id || !body?.companyName || !body?.positionTitle) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: id, companyName, positionTitle',
    });
  }

  // Check if application with this id already exists
  const existing = await getApplication(body.id);
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Application with this id already exists',
    });
  }

  const result = await db.transaction(async (tx) => {
    // Insert the application row with the exact same id
    const [app] = await tx
      .insert(applications)
      .values({
        id: body.id,
        companyName: body.companyName,
        positionTitle: body.positionTitle,
        dateApplied: body.dateApplied || new Date().toISOString().split('T')[0],
        status: body.status || 'applied',
        companyUrl: body.companyUrl || null,
        jobPostingUrl: body.jobPostingUrl || null,
        companyCareerUrl: body.companyCareerUrl || null,
        companyCategory: body.companyCategory || null,
        skillsMatch: body.skillsMatch || null,
        jobSource: body.jobSource || null,
        coverLetterRequired: body.coverLetterRequired ?? null,
        specialRequirements: body.specialRequirements || null,
        salaryMin: body.salaryMin || null,
        salaryMax: body.salaryMax || null,
        notes: body.notes || null,
        offerDueDate: body.offerDueDate || null,
        isArchived: body.isArchived ?? false,
      })
      .returning();

    // Insert all interview stages
    const stages = [];
    if (body.interviewStages && body.interviewStages.length > 0) {
      const insertedStages = await tx
        .insert(interviewStages)
        .values(
          body.interviewStages.map((stage) => ({
            id: stage.id,
            applicationId: body.id,
            name: stage.name,
            order: stage.order,
            isCompleted: stage.isCompleted ?? false,
            completedDate: stage.completedDate || null,
            notes: stage.notes || null,
            performanceRating: stage.performanceRating || null,
          })),
        )
        .returning();
      stages.push(...insertedStages);
    }

    return {
      id: app.id,
      companyName: app.companyName,
      positionTitle: app.positionTitle,
      dateApplied: app.dateApplied,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      companyUrl: app.companyUrl,
      jobPostingUrl: app.jobPostingUrl,
      companyCareerUrl: app.companyCareerUrl,
      companyCategory: app.companyCategory,
      skillsMatch: app.skillsMatch,
      jobSource: app.jobSource,
      coverLetterRequired: app.coverLetterRequired,
      specialRequirements: app.specialRequirements,
      salaryMin: app.salaryMin,
      salaryMax: app.salaryMax,
      notes: app.notes,
      offerDueDate: app.offerDueDate,
      isArchived: app.isArchived,
      interviewStages: stages
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          id: s.id,
          name: s.name,
          order: s.order,
          isCompleted: s.isCompleted,
          completedDate: s.completedDate,
          notes: s.notes,
          performanceRating: s.performanceRating,
        })),
    };
  });

  setResponseStatus(event, 201);
  return result;
});
