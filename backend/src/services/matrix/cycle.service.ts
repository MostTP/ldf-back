import type { Knex } from 'knex';

export const CYCLE_BONUS_AMOUNT = 5000;

export async function checkCycleCompletion(
  sponsorId: string,
  trx: Knex.Transaction
): Promise<void> {
  const row = await trx('matrix_nodes')
    .where({ sponsor_id: sponsorId, status: 'active' })
    .count('id as count')
    .first();

  const count = Number(row?.count ?? 0);
  if (count >= 781) {
    await trx('earnings_ledger').insert({
      user_id: sponsorId,
      type: 'MATRIX',
      amount: CYCLE_BONUS_AMOUNT,
      description: 'Matrix cycle completion bonus',
    });
    // Re-entry: caller should place sponsor as new node in wider matrix (separate flow)
  }
}
