import type { Knex } from 'knex';

const MATRIX_COMMISSION_RATES: Record<number, number> = {
  1: 500,
  2: 300,
  3: 200,
  4: 100,
  5: 50,
};

/** Gap multiple: when parent is Silver and new member is Gold, parent gets Silver rate, rest to lost_earnings. */
const GAP_MULTIPLE = 3;

export async function calculateMatrixEarnings(
  newUserId: string,
  parentId: string,
  trx: Knex.Transaction
): Promise<void> {
  const newMember = await trx('users').where({ id: newUserId }).first('package_type');
  const newMemberPackage = ((newMember as { package_type?: string } | undefined)?.package_type ?? 'Silver') as 'Silver' | 'Gold';

  let currentId: string | null = parentId;
  let depth = 1;

  while (currentId && depth <= 5) {
    const parentUser = await trx('users').where({ id: currentId }).first('package_type');
    const parentPackage = ((parentUser as { package_type?: string } | undefined)?.package_type ?? 'Silver') as 'Silver' | 'Gold';

    const silverRate = MATRIX_COMMISSION_RATES[depth];
    const isGap = parentPackage === 'Silver' && newMemberPackage === 'Gold';
    const matrixAmount = isGap ? silverRate : silverRate;
    const lostAmount = isGap ? silverRate * GAP_MULTIPLE : 0;

    await trx('earnings_ledger').insert({
      user_id: currentId,
      type: 'MATRIX',
      amount: matrixAmount,
      source_user_id: newUserId,
      level: depth,
      description: `Matrix L${depth} commission`,
    });
    if (lostAmount > 0) {
      await trx('earnings_ledger').insert({
        user_id: currentId,
        type: 'LOST_EARNINGS',
        amount: lostAmount,
        source_user_id: newUserId,
        level: depth,
        description: `Matrix L${depth} gap (Silver parent, Gold member)`,
      });
    }

    const balanceRow = await trx('available_balance').where({ user_id: currentId }).first('id');
    if (balanceRow) {
      await trx('available_balance').where({ user_id: currentId }).increment('balance', matrixAmount);
    } else {
      await trx('available_balance').insert({ user_id: currentId, balance: matrixAmount });
    }

    const hasWallets = await trx.schema.hasTable('wallets');
    if (hasWallets) {
      await trx('wallets').where({ user_id: currentId }).increment('matrix_income', matrixAmount);
      if (lostAmount > 0) {
        await trx('wallets').where({ user_id: currentId }).increment('lost_earnings', lostAmount);
      }
    }

    const parent = await trx('matrix_nodes').where({ user_id: currentId }).first('parent_id');
    currentId = parent?.parent_id ?? null;
    depth++;
  }
}
