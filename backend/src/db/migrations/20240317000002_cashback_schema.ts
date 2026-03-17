import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE earnings_ledger DROP CONSTRAINT IF EXISTS earnings_ledger_type_check');
  await knex.raw(
    "ALTER TABLE earnings_ledger ADD CONSTRAINT earnings_ledger_type_check CHECK (type IN ('AFFILIATE', 'MATRIX', 'GLOBAL_POOL', 'ROI', 'ADJUSTMENT', 'LOST_EARNINGS', 'CASHBACK'))"
  );

  if (!(await knex.schema.hasColumn('users', 'cashback_enabled'))) {
    await knex.schema.alterTable('users', (t) => {
      t.boolean('cashback_enabled').defaultTo(false);
    });
  }
  if (!(await knex.schema.hasColumn('users', 'cashback_percentage'))) {
    await knex.schema.alterTable('users', (t) => {
      t.decimal('cashback_percentage', 5, 2).defaultTo(0);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE earnings_ledger DROP CONSTRAINT IF EXISTS earnings_ledger_type_check');
  await knex.raw(
    "ALTER TABLE earnings_ledger ADD CONSTRAINT earnings_ledger_type_check CHECK (type IN ('AFFILIATE', 'MATRIX', 'GLOBAL_POOL', 'ROI', 'ADJUSTMENT', 'LOST_EARNINGS'))"
  );
  if (await knex.schema.hasColumn('users', 'cashback_enabled')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('cashback_enabled'));
  }
  if (await knex.schema.hasColumn('users', 'cashback_percentage')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('cashback_percentage'));
  }
}
