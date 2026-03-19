import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('users', 'cashback_package'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('cashback_package', 10).defaultTo('both');
    });
  }
  if (!(await knex.schema.hasColumn('users', 'cashback_type'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('cashback_type', 20).defaultTo('all');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('users', 'cashback_package')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('cashback_package'));
  }
  if (await knex.schema.hasColumn('users', 'cashback_type')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('cashback_type'));
  }
}
