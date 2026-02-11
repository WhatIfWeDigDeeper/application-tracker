/**
 * Event Service Integration Tests
 *
 * These tests require:
 * 1. A running PostgreSQL instance with the app_tracker database
 * 2. The vue_nuxt schema with all migrations applied
 * 3. vitest configured in the nuxt-api project
 *
 * To run these tests, you would need to:
 * - Install vitest: npm install -D vitest
 * - Add a test script to package.json: "test": "vitest run"
 * - Ensure DATABASE_URL is set or PostgreSQL is running locally
 * - Run migrations: npx drizzle-kit migrate
 *
 * These tests are designed to run against a real database.
 * Each test suite cleans up after itself.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../server/db/client';
import { applications, applicationEvents, applicationSnapshots } from '../server/db/schema';
import { appendEvent, listEvents, getLatestSnapshot, restoreToEvent } from '../server/services/event.service';
import { createApplication, getApplication, deleteApplication } from '../server/services/application.service';
import type { ImmerPatch } from '../shared/types';

// Test data helpers
function createTestPatches(): { patches: ImmerPatch[]; inversePatches: ImmerPatch[] } {
  return {
    patches: [
      { op: 'replace', path: ['status'], value: 'interviewing' },
    ],
    inversePatches: [
      { op: 'replace', path: ['status'], value: 'applied' },
    ],
  };
}

function createTestChanges(): FieldChange[] {
  return [
    { field: 'status', label: 'Status', oldValue: 'applied', newValue: 'interviewing' },
  ];
}

describe('Event Service', () => {
  let testAppId: string;

  beforeEach(async () => {
    // Create a test application
    const app = await createApplication({
      companyName: 'Test Company',
      positionTitle: 'Software Engineer',
      dateApplied: '2026-01-15',
    });
    testAppId = app.id;
  });

  afterEach(async () => {
    // Clean up: delete the test application (cascades to events and snapshots)
    if (testAppId) {
      await deleteApplication(testAppId);
    }
  });

  describe('appendEvent', () => {
    it('should create an event with sequence 1 for the first event', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      const event = await appendEvent(testAppId, 'Updated status', changes, patches, inversePatches);

      expect(event.sequence).toBe(1);
      expect(event.applicationId).toBe(testAppId);
      expect(event.description).toBe('Updated status');
      expect(event.changes).toEqual(changes);
      expect(event.patches).toEqual(patches);
      expect(event.inversePatches).toEqual(inversePatches);
      expect(event.id).toBeDefined();
      expect(event.createdAt).toBeDefined();
    });

    it('should auto-increment sequence numbers', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      const event1 = await appendEvent(testAppId, 'First change', changes, patches, inversePatches);
      const event2 = await appendEvent(testAppId, 'Second change', changes, patches, inversePatches);
      const event3 = await appendEvent(testAppId, 'Third change', changes, patches, inversePatches);

      expect(event1.sequence).toBe(1);
      expect(event2.sequence).toBe(2);
      expect(event3.sequence).toBe(3);
    });

    it('should maintain independent sequences per application', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      // Create a second test application
      const app2 = await createApplication({
        companyName: 'Another Company',
        positionTitle: 'Designer',
        dateApplied: '2026-01-20',
      });

      try {
        const event1 = await appendEvent(testAppId, 'App1 event', changes, patches, inversePatches);
        const event2 = await appendEvent(app2.id, 'App2 event', changes, patches, inversePatches);
        const event3 = await appendEvent(testAppId, 'App1 second event', changes, patches, inversePatches);

        expect(event1.sequence).toBe(1);
        expect(event2.sequence).toBe(1); // Independent sequence for app2
        expect(event3.sequence).toBe(2);
      } finally {
        await deleteApplication(app2.id);
      }
    });

    it('should trigger snapshot creation at multiples of 50', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      // Create 50 events
      for (let i = 0; i < 50; i++) {
        await appendEvent(testAppId, `Change ${i + 1}`, changes, patches, inversePatches);
      }

      // Check that a snapshot was created at sequence 50
      const snapshot = await getLatestSnapshot(testAppId);
      expect(snapshot).not.toBeNull();
      expect(snapshot!.atSequence).toBe(50);
      expect(snapshot!.applicationId).toBe(testAppId);
      expect(snapshot!.state).toBeDefined();
      expect(snapshot!.state.companyName).toBe('Test Company');
    });

    it('should not create snapshot before reaching 50 events', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      // Create 49 events
      for (let i = 0; i < 49; i++) {
        await appendEvent(testAppId, `Change ${i + 1}`, changes, patches, inversePatches);
      }

      const snapshot = await getLatestSnapshot(testAppId);
      expect(snapshot).toBeNull();
    });
  });

  describe('listEvents', () => {
    it('should return events in descending sequence order', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      await appendEvent(testAppId, 'First', changes, patches, inversePatches);
      await appendEvent(testAppId, 'Second', changes, patches, inversePatches);
      await appendEvent(testAppId, 'Third', changes, patches, inversePatches);

      const result = await listEvents(testAppId);

      expect(result.events).toHaveLength(3);
      expect(result.events[0].description).toBe('Third');
      expect(result.events[1].description).toBe('Second');
      expect(result.events[2].description).toBe('First');
      expect(result.total).toBe(3);
    });

    it('should paginate results correctly', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      for (let i = 0; i < 5; i++) {
        await appendEvent(testAppId, `Event ${i + 1}`, changes, patches, inversePatches);
      }

      const page1 = await listEvents(testAppId, 1, 2);
      expect(page1.events).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page1.events[0].sequence).toBe(5);
      expect(page1.events[1].sequence).toBe(4);

      const page2 = await listEvents(testAppId, 2, 2);
      expect(page2.events).toHaveLength(2);
      expect(page2.events[0].sequence).toBe(3);
      expect(page2.events[1].sequence).toBe(2);

      const page3 = await listEvents(testAppId, 3, 2);
      expect(page3.events).toHaveLength(1);
      expect(page3.events[0].sequence).toBe(1);
    });

    it('should return empty list for application with no events', async () => {
      const result = await listEvents(testAppId);

      expect(result.events).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getLatestSnapshot', () => {
    it('should return null when no snapshots exist', async () => {
      const snapshot = await getLatestSnapshot(testAppId);
      expect(snapshot).toBeNull();
    });

    it('should return the latest snapshot at or before a given sequence', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      // Create 100 events (should trigger snapshots at 50 and 100)
      for (let i = 0; i < 100; i++) {
        await appendEvent(testAppId, `Change ${i + 1}`, changes, patches, inversePatches);
      }

      // Get snapshot before sequence 75 (should return snapshot at 50)
      const snapshot = await getLatestSnapshot(testAppId, 75);
      expect(snapshot).not.toBeNull();
      expect(snapshot!.atSequence).toBe(50);

      // Get snapshot before sequence 100 (should return snapshot at 100)
      const snapshot2 = await getLatestSnapshot(testAppId, 100);
      expect(snapshot2).not.toBeNull();
      expect(snapshot2!.atSequence).toBe(100);

      // Get latest snapshot without sequence constraint
      const latestSnapshot = await getLatestSnapshot(testAppId);
      expect(latestSnapshot).not.toBeNull();
      expect(latestSnapshot!.atSequence).toBe(100);
    });

    it('should return null when no snapshot exists before the given sequence', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      // Create 50 events (snapshot at 50)
      for (let i = 0; i < 50; i++) {
        await appendEvent(testAppId, `Change ${i + 1}`, changes, patches, inversePatches);
      }

      // Try to get snapshot before sequence 49 (none should exist)
      const snapshot = await getLatestSnapshot(testAppId, 49);
      expect(snapshot).toBeNull();
    });
  });

  describe('restoreToEvent', () => {
    it('should restore application to the state at a given sequence', async () => {
      // Manually update the application so state changes are real
      await db.update(applications).set({
        status: 'interviewing',
        updatedAt: new Date(),
      }).where(eq(applications.id, testAppId));

      // Append an event recording this change
      await appendEvent(
        testAppId,
        'Updated status to interviewing',
        [{ field: 'status', label: 'Status', oldValue: 'applied', newValue: 'interviewing' }],
        [{ op: 'replace', path: ['status'], value: 'interviewing' }],
        [{ op: 'replace', path: ['status'], value: 'applied' }],
      );

      // Make another change
      await db.update(applications).set({
        status: 'given offer',
        updatedAt: new Date(),
      }).where(eq(applications.id, testAppId));

      await appendEvent(
        testAppId,
        'Updated status to given offer',
        [{ field: 'status', label: 'Status', oldValue: 'interviewing', newValue: 'given offer' }],
        [{ op: 'replace', path: ['status'], value: 'given offer' }],
        [{ op: 'replace', path: ['status'], value: 'interviewing' }],
      );

      // Verify current state is 'given offer'
      const currentApp = await getApplication(testAppId);
      expect(currentApp!.status).toBe('given offer');

      // Restore to sequence 1 (should be 'interviewing')
      const restored = await restoreToEvent(testAppId, 1);
      expect(restored.status).toBe('interviewing');

      // Verify event 2 was deleted
      const events = await listEvents(testAppId);
      // Should have event 1 + the "Restored to version 1" event
      const sequences = events.events.map((e) => e.sequence);
      expect(sequences).toContain(1);
      expect(sequences).not.toContain(2); // Original event 2 should be deleted
    });

    it('should delete events after the target sequence', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      // Create 5 events
      for (let i = 0; i < 5; i++) {
        await appendEvent(testAppId, `Change ${i + 1}`, changes, patches, inversePatches);
      }

      // Restore to sequence 3
      await restoreToEvent(testAppId, 3);

      // Check that only sequences 1, 2, 3, and the restore event (4) remain
      const result = await listEvents(testAppId);
      const sequences = result.events.map((e) => e.sequence).sort((a, b) => a - b);
      expect(sequences).toEqual([1, 2, 3, 4]); // 4 is the "Restored to version 3" event
      expect(result.events.find((e) => e.sequence === 4)?.description).toBe('Restored to version 3');
    });
  });

  describe('cascade delete', () => {
    it('should delete events and snapshots when application is deleted', async () => {
      const { patches, inversePatches } = createTestPatches();
      const changes = createTestChanges();

      // Create some events
      for (let i = 0; i < 3; i++) {
        await appendEvent(testAppId, `Change ${i + 1}`, changes, patches, inversePatches);
      }

      // Verify events exist
      const beforeDelete = await listEvents(testAppId);
      expect(beforeDelete.total).toBe(3);

      // Delete the application
      await deleteApplication(testAppId);

      // Verify events are gone (query directly since the app is deleted)
      const remainingEvents = await db
        .select()
        .from(applicationEvents)
        .where(eq(applicationEvents.applicationId, testAppId));
      expect(remainingEvents).toHaveLength(0);

      const remainingSnapshots = await db
        .select()
        .from(applicationSnapshots)
        .where(eq(applicationSnapshots.applicationId, testAppId));
      expect(remainingSnapshots).toHaveLength(0);

      // Prevent afterEach from trying to delete again
      testAppId = '';
    });
  });
});
