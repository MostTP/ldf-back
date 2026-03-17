import type { Knex } from 'knex';
import { placeNewMember } from './matrix/placement.service.js';
import { insertNotification } from './notification.service.js';

const AFFILIATE_COMMISSION = 500;

export interface CoreActivationParams {
  userId: string;
  sponsorId: string;
  couponId?: string | null;
  packageType?: 'Silver' | 'Gold';
}

export async function coreActivation(params: CoreActivationParams, trx: Knex.Transaction): Promise<void> {
  const { userId, sponsorId, couponId, packageType = 'Silver' } = params;

  const user = await trx('users').where({ id: userId }).first('referred_by', 'status');
  if (!user) throw new Error('User not found');
  if ((user as { status: string }).status === 'active') return;

  await trx('users').where({ id: userId }).update({ status: 'active', package_type: packageType });

  if (couponId) {
    await trx('coupons').where({ id: couponId }).update({ used_by: userId, used_at: trx.fn.now() });
  }

  await placeNewMember(userId, sponsorId, trx);

  const node = await trx('matrix_nodes').where({ user_id: userId }).first('parent_id');
  if (node && (node as { parent_id: string }).parent_id === sponsorId) {
    await trx('users').where({ id: sponsorId }).increment('direct_referral_count', 1);
  }

  const sponsorRow = await trx('users')
    .where({ id: sponsorId })
    .first('package_type', 'cashback_enabled', 'cashback_percentage');
  const sponsorPkg = (sponsorRow as { package_type?: string } | undefined)?.package_type ?? 'Silver';
  const cashbackEnabled = (sponsorRow as { cashback_enabled?: boolean } | undefined)?.cashback_enabled === true;
  const cashbackPct = Math.min(100, Math.max(0, Number((sponsorRow as { cashback_percentage?: string } | undefined)?.cashback_percentage ?? 0)));
  const hasCashback = sponsorPkg === 'Gold' && cashbackEnabled && cashbackPct > 0;

  const cashbackAmount = hasCashback ? Math.round((AFFILIATE_COMMISSION * cashbackPct) / 100 * 100) / 100 : 0;
  const sponsorAmount = Math.round((AFFILIATE_COMMISSION - cashbackAmount) * 100) / 100;

  await trx('earnings_ledger').insert({
    user_id: sponsorId,
    type: 'AFFILIATE',
    amount: sponsorAmount,
    source_user_id: userId,
    description: 'Affiliate activation commission',
  });
  await trx('available_balance').where({ user_id: sponsorId }).increment('balance', sponsorAmount);
  const hasWallets = await trx.schema.hasTable('wallets');
  if (hasWallets) {
    await trx('wallets').where({ user_id: sponsorId }).increment('affiliate_income', sponsorAmount);
  }

  if (cashbackAmount > 0) {
    await trx('earnings_ledger').insert({
      user_id: userId,
      type: 'CASHBACK',
      amount: cashbackAmount,
      source_user_id: sponsorId,
      description: 'Cashback from sponsor',
    });
    const existingBalance = await trx('available_balance').where({ user_id: userId }).first();
    if (existingBalance) {
      await trx('available_balance').where({ user_id: userId }).increment('balance', cashbackAmount);
    } else {
      await trx('available_balance').insert({ user_id: userId, balance: cashbackAmount });
    }
    if (hasWallets) {
      await trx('wallets').where({ user_id: userId }).increment('main_earnings', cashbackAmount);
    }
  }

  const existingBalance = await trx('available_balance').where({ user_id: userId }).first();
  if (!existingBalance) {
    await trx('available_balance').insert({ user_id: userId, balance: 0 });
  }

  await trx('global_pool_memberships').insert({ user_id: userId });

  await insertNotification(
    userId,
    'ACTIVATION',
    'Account Activated!',
    'Your account is now active. Welcome to LDF.',
    {},
    trx
  );

  await insertNotification(
    sponsorId,
    'NEW_REFERRAL',
    'New Referral Activated',
    `Your referral has activated their account. ₦${sponsorAmount} commission credited.`,
    { amount: sponsorAmount },
    trx
  );

  if (cashbackAmount > 0) {
    const sponsorUser = await trx('users').where({ id: sponsorId }).first('username');
    const name = (sponsorUser as { username?: string } | undefined)?.username ?? 'Sponsor';
    await insertNotification(
      userId,
      'CASHBACK',
      'Cashback received',
      `You received ₦${cashbackAmount} cashback from ${name}.`,
      { amount: cashbackAmount, fromSponsorId: sponsorId },
      trx
    );
  }
}

export async function completeActivation(
  userId: string,
  gatewayRef: string,
  trx: Knex.Transaction
): Promise<void> {
  const user = await trx('users').where({ id: userId }).first('referred_by', 'status');
  if (!user) throw new Error('User not found');
  if ((user as { status: string }).status === 'active') return;

  const sponsorId = (user as { referred_by: string | null }).referred_by;
  if (!sponsorId) throw new Error('No sponsor for matrix placement');

  const payment = await trx('activation_payments').where({ gateway_ref: gatewayRef }).first('id', 'coupon_used', 'gateway');
  const gateway = (payment as { gateway?: string } | undefined)?.gateway;
  const packageType = gateway === 'flutterwave' ? 'Gold' : 'Silver';
  const couponId = payment ? (payment as { coupon_used: string | null }).coupon_used : null;

  if (payment) {
    await trx('activation_payments')
      .where({ gateway_ref: gatewayRef })
      .update({ status: 'completed', completed_at: trx.fn.now() });
  }

  await coreActivation({ userId, sponsorId, couponId, packageType }, trx);
}
