import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('users', 'package_type'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('package_type', 20).defaultTo('Silver').checkIn(['Silver', 'Gold']);
    });
  }
  if (!(await knex.schema.hasColumn('users', 'is_matrix_qualified'))) {
    await knex.schema.alterTable('users', (t) => {
      t.boolean('is_matrix_qualified').defaultTo(false);
    });
  }
  if (!(await knex.schema.hasColumn('users', 'direct_referral_count'))) {
    await knex.schema.alterTable('users', (t) => {
      t.integer('direct_referral_count').defaultTo(0);
    });
  }

  if (!(await knex.schema.hasTable('wallets'))) {
    await knex.schema.createTable('wallets', (table) => {
      table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
      table.decimal('main_earnings', 12, 2).defaultTo(0);
      table.decimal('affiliate_income', 12, 2).defaultTo(0);
      table.decimal('matrix_income', 12, 2).defaultTo(0);
      table.decimal('global_pool', 12, 2).defaultTo(0);
      table.decimal('lost_earnings', 12, 2).defaultTo(0);
      table.decimal('detty_december', 12, 2).defaultTo(0);
      table.integer('game_points').defaultTo(0);
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
    const userIds = await knex('users').select('id');
    for (const row of userIds as { id: string }[]) {
      await knex('wallets').insert({ user_id: row.id });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('wallets');
  if (await knex.schema.hasColumn('users', 'package_type')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('package_type'));
  }
  if (await knex.schema.hasColumn('users', 'is_matrix_qualified')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('is_matrix_qualified'));
  }
  if (await knex.schema.hasColumn('users', 'direct_referral_count')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('direct_referral_count'));
  }
}
