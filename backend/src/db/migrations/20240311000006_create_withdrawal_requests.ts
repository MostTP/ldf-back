import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('withdrawal_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency', 10).notNullable().checkIn(['NGN', 'GHS', 'KES', 'ZAR']);
    table.string('bank_code').notNullable();
    table.string('account_number').notNullable();
    table
      .string('status', 50)
      .defaultTo('pending')
      .checkIn(['pending', 'processing', 'completed', 'rejected']);
    table.text('reject_reason').nullable();
    table.string('gateway_ref').nullable();
    table.uuid('processed_by').nullable().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('processed_at').nullable();
  });
  await knex.raw('CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests (status)');
  await knex.raw('CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests (user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('withdrawal_requests');
}
