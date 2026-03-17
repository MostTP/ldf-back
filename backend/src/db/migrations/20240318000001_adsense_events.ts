import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('adsense_events')) return;
  await knex.schema.createTable('adsense_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('event_type', 100).notNullable();
    table.jsonb('payload').nullable();
    table.string('url', 2048).nullable();
    table.string('ip_address', 45).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_adsense_events_created_at ON adsense_events (created_at)');
  await knex.raw('CREATE INDEX idx_adsense_events_event_type ON adsense_events (event_type)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('adsense_events');
}
