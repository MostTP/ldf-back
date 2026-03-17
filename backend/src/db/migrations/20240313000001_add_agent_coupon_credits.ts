import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'agent_coupon_credits');
  if (!hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.integer('agent_coupon_credits').defaultTo(0).notNullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('users', 'agent_coupon_credits')) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('agent_coupon_credits');
    });
  }
}
