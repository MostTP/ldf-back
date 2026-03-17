import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE earnings_ledger DROP CONSTRAINT IF EXISTS earnings_ledger_type_check');
  await knex.raw(
    "ALTER TABLE earnings_ledger ADD CONSTRAINT earnings_ledger_type_check CHECK (type IN ('AFFILIATE', 'MATRIX', 'GLOBAL_POOL', 'ROI', 'ADJUSTMENT', 'LOST_EARNINGS'))"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE earnings_ledger DROP CONSTRAINT IF EXISTS earnings_ledger_type_check');
  await knex.raw(
    "ALTER TABLE earnings_ledger ADD CONSTRAINT earnings_ledger_type_check CHECK (type IN ('AFFILIATE', 'MATRIX', 'GLOBAL_POOL', 'ROI', 'ADJUSTMENT'))"
  );
}
