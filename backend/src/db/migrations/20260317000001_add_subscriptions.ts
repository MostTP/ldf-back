import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Subscription: 30-day recurring access control for commissions/matrix.
  if (!(await knex.schema.hasColumn('users', 'subscription_expires_at'))) {
    await knex.schema.alterTable('users', (t) => {
      t.timestamp('subscription_expires_at').nullable();
    });
  }

  if (!(await knex.schema.hasColumn('users', 'subscription_active'))) {
    await knex.schema.alterTable('users', (t) => {
      t.boolean('subscription_active').defaultTo(true);
    });
  }

  // Helpful index for the midnight sweep.
  // Use raw to avoid Knex index name collisions across environments.
  try {
    await knex.raw('CREATE INDEX IF NOT EXISTS users_subscription_expires_at_idx ON users(subscription_expires_at)');
  } catch {
    // ignore
  }
}

export async function down(knex: Knex): Promise<void> {
  try {
    await knex.raw('DROP INDEX IF EXISTS users_subscription_expires_at_idx');
  } catch {
    // ignore
  }
  if (await knex.schema.hasColumn('users', 'subscription_expires_at')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('subscription_expires_at'));
  }
  if (await knex.schema.hasColumn('users', 'subscription_active')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('subscription_active'));
  }
}

