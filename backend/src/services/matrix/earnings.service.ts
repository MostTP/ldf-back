import type { Knex } from 'knex';
import { getRegistrationMatrixRates } from '../../config/fees.js';
import { creditAdminWallet, isRecipientActiveForCommissions } from '../subscriptionGuard.service.js';

export async function calculateMatrixEarnings(
  newUserId: string,
  parentId: string,
  trx: Knex.Transaction
): Promise<void> {
  const newMember = await trx('users').where({ id: newUserId }).first('package_type');
  const newMemberPackage = ((newMember as { package_type?: string } | undefined)?.package_type ?? 'Silver') as 'Silver' | 'Gold';
  const silverRates = getRegistrationMatrixRates('Silver');
  const goldRates = getRegistrationMatrixRates('Gold');

  let currentId: string | null = parentId;
  let depth = 1;

  while (currentId && depth <= 5) {
    const parentUser = await trx('users')
      .where({ id: currentId })
      .first('package_type', 'status', 'subscription_active', 'subscription_expires_at');
    const parentPackage = ((parentUser as { package_type?: string } | undefined)?.package_type ?? 'Silver') as 'Silver' | 'Gold';
    const eligible = isRecipientActiveForCommissions({
      status: (parentUser as { status?: string } | undefined)?.status ?? 'active',
      subscriptionActive: (parentUser as { subscription_active?: boolean } | undefined)?.subscription_active,
      subscriptionExpiresAt: (parentUser as { subscription_expires_at?: string } | undefined)?.subscription_expires_at ?? null,
    });

    const silverRate = silverRates[depth - 1] ?? 0;
    const goldRate = goldRates[depth - 1] ?? 0;
    const isGap = parentPackage === 'Silver' && newMemberPackage === 'Gold';
    const baseAmount = isGap ? silverRate : (newMemberPackage === 'Gold' ? goldRate : silverRate);
    const gapAmount = isGap ? Math.max(0, goldRate - silverRate) : 0;

    const matrixAmount = eligible ? baseAmount : 0;
    const lostAmount = eligible ? gapAmount : baseAmount + gapAmount;

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
        description: eligible ? `Matrix L${depth} gap (Silver parent, Gold member)` : `Matrix L${depth} commission redirected (inactive/expired)`,
      });

      // Redirect to Admin Wallet (if configured) for gaps and inactive recipients.
      await creditAdminWallet({
        amount: lostAmount,
        type: 'MATRIX',
        sourceUserId: newUserId,
        level: depth,
        description: eligible ? `Matrix L${depth} tier gap redirected` : `Matrix L${depth} redirected (inactive/expired)`,
        trx,
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

    const parentRow = (await trx('matrix_nodes').where({ user_id: currentId }).first('parent_id')) as
      | { parent_id?: string | null }
      | undefined;
    currentId = parentRow?.parent_id ?? null;
    depth++;
  }
}
