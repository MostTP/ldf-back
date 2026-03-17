import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('users', 'activation_coupon'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('activation_coupon', 64).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('users', 'activation_coupon')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('activation_coupon'));
  }
}
