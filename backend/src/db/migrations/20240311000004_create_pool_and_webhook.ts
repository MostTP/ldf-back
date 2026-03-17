import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Global pool: ledger of contributions/distributions; balance = SUM(amount)
  await knex.schema.createTable('global_pool_ledger', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.decimal('amount', 12, 2).notNullable();
    table.string('description').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('capital_pool_ledger', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.decimal('amount', 12, 2).notNullable();
    table.string('description').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Last webhook event timestamp (Paystack/Flutterwave)
  await knex.schema.createTable('webhook_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('source').notNullable(); // 'paystack' | 'flutterwave'
    table.string('event_id').nullable();
    table.timestamp('received_at').defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_webhook_events_received_at ON webhook_events (received_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('webhook_events');
  await knex.schema.dropTableIfExists('capital_pool_ledger');
  await knex.schema.dropTableIfExists('global_pool_ledger');
}
