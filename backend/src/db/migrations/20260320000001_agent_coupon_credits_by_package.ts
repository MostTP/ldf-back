import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasSilver = await knex.schema.hasColumn('users', 'agent_coupon_credits_silver');
  if (!hasSilver) {
    await knex.schema.alterTable('users', (t) => {
      t.integer('agent_coupon_credits_silver').defaultTo(0).notNullable();
    });
  }

  const hasGold = await knex.schema.hasColumn('users', 'agent_coupon_credits_gold');
  if (!hasGold) {
    await knex.schema.alterTable('users', (t) => {
      t.integer('agent_coupon_credits_gold').defaultTo(0).notNullable();
    });
  }

  // Backfill existing single-balance credits into Silver credits if Silver is still 0.
  const hasLegacy = await knex.schema.hasColumn('users', 'agent_coupon_credits');
  if (hasLegacy) {
    await knex.raw(
      `UPDATE users
       SET agent_coupon_credits_silver = CASE
         WHEN agent_coupon_credits_silver = 0 THEN COALESCE(agent_coupon_credits, 0)
         ELSE agent_coupon_credits_silver
       END
       WHERE agent_coupon_credits_silver = 0`
    );
  }

  const hasPayments = await knex.schema.hasTable('agent_coupon_credit_payments');
  if (!hasPayments) {
    await knex.schema.createTable('agent_coupon_credit_payments', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('agent_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('package_type').notNullable().checkIn(['Silver', 'Gold']);
      t.integer('quantity').notNullable();
      t.decimal('amount', 12, 2).notNullable();
      t.string('currency').notNullable().defaultTo('NGN');
      t.string('gateway').notNullable().checkIn(['paystack', 'flutterwave']);
      t.string('gateway_ref').notNullable().unique();
      t.string('status').notNullable().defaultTo('pending').checkIn(['pending', 'completed', 'failed']);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('completed_at');
    });

    await knex.raw('CREATE INDEX IF NOT EXISTS idx_agent_coupon_credit_payments_agent_id ON agent_coupon_credit_payments(agent_id)');
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('agent_coupon_credit_payments');

  if (await knex.schema.hasColumn('users', 'agent_coupon_credits_silver')) {
    await knex.schema.alterTable('users', (t) => {
      t.dropColumn('agent_coupon_credits_silver');
    });
  }
  if (await knex.schema.hasColumn('users', 'agent_coupon_credits_gold')) {
    await knex.schema.alterTable('users', (t) => {
      t.dropColumn('agent_coupon_credits_gold');
    });
  }
}

