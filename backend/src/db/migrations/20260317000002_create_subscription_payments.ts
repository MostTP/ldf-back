import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('subscription_payments'))) {
    await knex.schema.createTable('subscription_payments', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('kind', 20).notNullable(); // RENEWAL | UPGRADE
      t.string('tier', 20).notNullable(); // Silver | Gold (target tier / paid tier)
      t.decimal('amount', 12, 2).notNullable();
      t.string('currency', 10).defaultTo('NGN');
      t.string('gateway', 20).notNullable(); // paystack | flutterwave
      t.string('gateway_ref', 255).notNullable().unique();
      t.string('status', 20).notNullable().defaultTo('pending'); // pending | completed | failed
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('completed_at');
    });
    try {
      await knex.raw('CREATE INDEX IF NOT EXISTS subscription_payments_user_id_idx ON subscription_payments(user_id)');
    } catch {
      // ignore
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  try {
    await knex.raw('DROP INDEX IF EXISTS subscription_payments_user_id_idx');
  } catch {
    // ignore
  }
  await knex.schema.dropTableIfExists('subscription_payments');
}

