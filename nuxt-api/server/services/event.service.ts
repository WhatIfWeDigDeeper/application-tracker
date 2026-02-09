import { eq, and, sql, desc, asc, lte, gt } from 'drizzle-orm';
import { enablePatches, applyPatches } from 'immer';
import { db } from '../db/client';
import { applications, interviewStages, applicationEvents, applicationSnapshots } from '../db/schema';
import { getApplication } from './application.service';
import type { Application, ApplicationEvent, ApplicationSnapshot, FieldChange, ImmerPatch } from '~~/shared/types';

// Enable Immer patches for server-side replay
enablePatches();

// Helper to format datetime for response
function formatDateTime(date: Date | null): string {
  if (!date) return new Date().toISOString();
  return date.toISOString();
}

// Transform DB event to API response
function toEventResponse(event: typeof applicationEvents.$inferSelect): ApplicationEvent {
  return {
    id: event.id,
    applicationId: event.applicationId,
    sequence: event.sequence,
    description: event.description,
    changes: event.changes,
    patches: event.patches,
    inversePatches: event.inversePatches,
    createdAt: formatDateTime(event.createdAt),
  };
}

// Transform DB snapshot to API response
function toSnapshotResponse(snapshot: typeof applicationSnapshots.$inferSelect): ApplicationSnapshot {
  return {
    id: snapshot.id,
    applicationId: snapshot.applicationId,
    atSequence: snapshot.atSequence,
    state: snapshot.state,
    createdAt: formatDateTime(snapshot.createdAt),
  };
}

/**
 * Create a snapshot of the current application state.
 */
async function createSnapshot(applicationId: string, atSequence: number): Promise<void> {
  const app = await getApplication(applicationId);
  if (!app) return;

  await db.insert(applicationSnapshots).values({
    applicationId,
    atSequence,
    state: app,
  });
}

/**
 * Append a new event for an application.
 * Calculates next sequence, inserts the event, triggers snapshot at multiples of 50.
 */
export async function appendEvent(
  applicationId: string,
  description: string,
  changes: FieldChange[],
  patches: ImmerPatch[],
  inversePatches: ImmerPatch[],
): Promise<ApplicationEvent> {
  // Calculate next sequence
  const maxResult = await db
    .select({ maxSeq: sql<number | null>`max(${applicationEvents.sequence})` })
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, applicationId));

  const nextSequence = (maxResult[0]?.maxSeq ?? 0) + 1;

  // Insert the event
  const [event] = await db
    .insert(applicationEvents)
    .values({
      applicationId,
      sequence: nextSequence,
      description,
      changes,
      patches,
      inversePatches,
    })
    .returning();

  // Create snapshot at multiples of 50
  if (nextSequence % 50 === 0) {
    await createSnapshot(applicationId, nextSequence);
  }

  return toEventResponse(event);
}

/**
 * List events for an application (paginated, newest first).
 */
export async function listEvents(
  applicationId: string,
  page: number = 1,
  limit: number = 50,
): Promise<{ events: ApplicationEvent[]; total: number; page: number; limit: number }> {
  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, applicationId));

  const total = Number(countResult[0]?.count || 0);

  // Get paginated results
  const offset = (page - 1) * limit;
  const events = await db
    .select()
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, applicationId))
    .orderBy(desc(applicationEvents.sequence))
    .limit(limit)
    .offset(offset);

  return {
    events: events.map(toEventResponse),
    total,
    page,
    limit,
  };
}

/**
 * Get the latest snapshot at or before a given sequence.
 */
export async function getLatestSnapshot(
  applicationId: string,
  beforeSequence?: number,
): Promise<ApplicationSnapshot | null> {
  const conditions = [eq(applicationSnapshots.applicationId, applicationId)];

  if (beforeSequence !== undefined) {
    conditions.push(lte(applicationSnapshots.atSequence, beforeSequence));
  }

  const results = await db
    .select()
    .from(applicationSnapshots)
    .where(and(...conditions))
    .orderBy(desc(applicationSnapshots.atSequence))
    .limit(1);

  if (results.length === 0) return null;
  return toSnapshotResponse(results[0]);
}

/**
 * Restore application to state at a given sequence.
 * Finds nearest snapshot, replays patches forward, updates the DB, cleans up future events.
 */
export async function restoreToEvent(
  applicationId: string,
  targetSequence: number,
): Promise<Application> {
  // Find nearest snapshot before targetSequence
  const snapshot = await getLatestSnapshot(applicationId, targetSequence);

  let currentState: Application;
  let startSequence: number;

  if (snapshot) {
    currentState = snapshot.state;
    startSequence = snapshot.atSequence;
  } else {
    // No snapshot available - we need the initial state from the first event
    // Start from the application's current state and work backwards,
    // or just get all events from sequence 1 and replay from scratch.
    // For safety, get the application's current state and apply inverse patches
    // backwards from the latest event down to targetSequence.
    // Actually, the simplest approach: get the first event's state.
    // Since we don't store initial state separately, we need to fetch
    // all events from 1 to targetSequence and replay from the current app state
    // after un-applying all events after targetSequence.

    // Alternative approach: get all events up to targetSequence, ordered ASC.
    // We cannot replay forward without a base state. The base state IS the
    // application before any events. Since we don't have that stored,
    // we should take the current application state and apply inverse patches
    // backwards from the current sequence to targetSequence + 1.

    // Simplest correct approach: get current app state, get all events
    // after targetSequence in DESC order, apply inverse patches sequentially.
    const app = await getApplication(applicationId);
    if (!app) {
      throw createError({ statusCode: 404, statusMessage: 'Application not found' });
    }

    // Get all events after targetSequence, ordered DESC (newest first)
    const eventsAfterTarget = await db
      .select()
      .from(applicationEvents)
      .where(
        and(
          eq(applicationEvents.applicationId, applicationId),
          gt(applicationEvents.sequence, targetSequence),
        ),
      )
      .orderBy(desc(applicationEvents.sequence));

    // Apply inverse patches backwards from newest to oldest
    currentState = app;
    for (const evt of eventsAfterTarget) {
      currentState = applyPatches(currentState, evt.inversePatches);
    }

    // Now we have the state at targetSequence, skip the forward-replay
    startSequence = targetSequence;
  }

  // If we used a snapshot, replay events forward from snapshot to target
  if (snapshot && startSequence < targetSequence) {
    const eventsToReplay = await db
      .select()
      .from(applicationEvents)
      .where(
        and(
          eq(applicationEvents.applicationId, applicationId),
          gt(applicationEvents.sequence, startSequence),
          lte(applicationEvents.sequence, targetSequence),
        ),
      )
      .orderBy(asc(applicationEvents.sequence));

    for (const evt of eventsToReplay) {
      currentState = applyPatches(currentState, evt.patches);
    }
  }

  // Update the applications table with reconstructed state
  await db.update(applications).set({
    companyName: currentState.companyName,
    positionTitle: currentState.positionTitle,
    dateApplied: currentState.dateApplied,
    status: currentState.status,
    companyUrl: currentState.companyUrl,
    jobPostingUrl: currentState.jobPostingUrl,
    companyCareerUrl: currentState.companyCareerUrl,
    companyCategory: currentState.companyCategory,
    skillsMatch: currentState.skillsMatch,
    jobSource: currentState.jobSource,
    coverLetterRequired: currentState.coverLetterRequired,
    specialRequirements: currentState.specialRequirements,
    salaryMin: currentState.salaryMin,
    salaryMax: currentState.salaryMax,
    notes: currentState.notes,
    offerDueDate: currentState.offerDueDate,
    isArchived: currentState.isArchived,
    updatedAt: new Date(),
  }).where(eq(applications.id, applicationId));

  // Delete all existing interview stages and recreate from restored state
  await db.delete(interviewStages).where(eq(interviewStages.applicationId, applicationId));

  if (currentState.interviewStages && currentState.interviewStages.length > 0) {
    await db.insert(interviewStages).values(
      currentState.interviewStages.map((stage) => ({
        id: stage.id,
        applicationId,
        name: stage.name,
        order: stage.order,
        isCompleted: stage.isCompleted,
        completedDate: stage.completedDate || null,
        notes: stage.notes,
        performanceRating: stage.performanceRating,
      })),
    );
  }

  // Delete events AFTER targetSequence
  await db.delete(applicationEvents).where(
    and(
      eq(applicationEvents.applicationId, applicationId),
      gt(applicationEvents.sequence, targetSequence),
    ),
  );

  // Delete snapshots AFTER targetSequence
  await db.delete(applicationSnapshots).where(
    and(
      eq(applicationSnapshots.applicationId, applicationId),
      gt(applicationSnapshots.atSequence, targetSequence),
    ),
  );

  // Create a new "Restored to version N" event
  await appendEvent(
    applicationId,
    `Restored to version ${targetSequence}`,
    [],
    [],
    [],
  );

  // Return the restored application
  const restored = await getApplication(applicationId);
  if (!restored) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to restore application' });
  }

  return restored;
}
