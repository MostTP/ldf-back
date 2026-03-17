import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('earnings_ledger', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table
      .string('type')
      .notNullable()
      .checkIn(['AFFILIATE', 'MATRIX', 'GLOBAL_POOL', 'ROI', 'ADJUSTMENT']);
    table.decimal('amount', 12, 2).notNullable();
    table.uuid('source_user_id').nullable().references('id').inTable('users');
    table.integer('level').nullable();
    table.uuid('reference_id').nullable();
    table.text('description').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_earnings_ledger_user_id ON earnings_ledger (user_id)');
  await knex.raw('CREATE INDEX idx_earnings_ledger_type ON earnings_ledger (type)');
  await knex.raw('CREATE INDEX idx_earnings_ledger_created_at ON earnings_ledger (created_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('earnings_ledger');
}
