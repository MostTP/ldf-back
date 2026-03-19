import type { Knex } from 'knex';

export interface RecipientSubscription {
  status: 'active' | 'pending' | 'suspended' | string;
  subscriptionActive?: boolean;
  subscriptionExpiresAt?: Date | string | null;
}

export function isRecipientActiveForCommissions(recipient: RecipientSubscription): boolean {
  // User account must be active (not suspended/pending)
  if (recipient.status !== 'active') return false;

  // If subscription_active exists and is false => inactive
  if (recipient.subscriptionActive === false) return false;

  // If expires_at exists and is in the past => inactive
  if (recipient.subscriptionExpiresAt) {
    const ts = recipient.subscriptionExpiresAt instanceof Date ? recipient.subscriptionExpiresAt.getTime() : new Date(recipient.subscriptionExpiresAt).getTime();
    if (Number.isFinite(ts) && ts < Date.now()) return false;
  }

  return true;
}

export async function creditAdminWallet(args: {
  amount: number;
  type: 'AFFILIATE' | 'MATRIX' | 'GLOBAL_POOL' | 'ROI' | 'ADJUSTMENT' | 'LOST_EARNINGS' | 'CASHBACK' | 'OPERATION';
  sourceUserId?: string | null;
  description: string;
  level?: number | null;
  trx: Knex.Transaction;
}): Promise<void> {
  const adminId = process.env.ADMIN_WALLET_USER_ID;
  if (!adminId) return;
  if (!Number.isFinite(args.amount) || args.amount <= 0) return;

  await args.trx('earnings_ledger').insert({
    user_id: adminId,
    type: args.type,
    amount: args.amount,
    source_user_id: args.sourceUserId ?? null,
    level: args.level ?? null,
    description: args.description,
  });

  const bal = await args.trx('available_balance').where({ user_id: adminId }).first('id');
  if (bal) {
    await args.trx('available_balance').where({ user_id: adminId }).increment('balance', args.amount);
  } else {
    await args.trx('available_balance').insert({ user_id: adminId, balance: args.amount });
  }
}

