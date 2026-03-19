import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('coupons', 'package_type');
  if (!hasColumn) {
    await knex.schema.alterTable('coupons', (t) => {
      t.string('package_type', 20).defaultTo('Silver').checkIn(['Silver', 'Gold']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('coupons', 'package_type')) {
    await knex.schema.alterTable('coupons', (t) => t.dropColumn('package_type'));
  }
}
