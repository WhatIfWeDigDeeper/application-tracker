import type { Knex } from 'knex';

/**
 * Copies history rows from the original react_nestjs schema into the new react_nestjs_history schema.
 * Safe to run multiple times: ON CONFLICT DO NOTHING prevents duplicate inserts.
 * Intended for local dev migration; production deployments should use a dedicated data migration.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    INSERT INTO react_nestjs_history.application_history
      (id, application_id, sequence, description, snapshot, created_at)
    SELECT id, application_id, sequence, description, snapshot, created_at
    FROM react_nestjs.application_history
    ON CONFLICT (application_id, sequence) DO NOTHING
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Intentionally a no-op: copying data back to the original schema is out of scope.
  // Re-run the previous migration's down() to drop the destination schema entirely.
}
