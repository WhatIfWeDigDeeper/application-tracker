import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE SCHEMA IF NOT EXISTS react_nestjs_history');

  await knex.schema.withSchema('react_nestjs_history').createTable('application_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').notNullable();
    table.integer('sequence').notNullable();
    table.text('description').notNullable();
    table.jsonb('snapshot').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['application_id', 'sequence'], { indexName: 'uq_history_app_sequence' });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('react_nestjs_history').dropTableIfExists('application_history');
  await knex.raw('DROP SCHEMA IF EXISTS react_nestjs_history CASCADE');
}
