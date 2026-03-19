import type { Knex } from 'knex';
import { REGISTRATION } from '../config/fees.js';
import { splitAffiliateCashback } from './cashback.service.js';
import { placeNewMember } from './matrix/placement.service.js';
import { insertNotification } from './notification.service.js';
import { creditAdminWallet, isRecipientActiveForCommissions } from './subscriptionGuard.service.js';

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
    .first('package_type', 'cashback_enabled', 'cashback_percentage', 'cashback_package', 'cashback_type');
  const sponsorPkg = (sponsorRow as { package_type?: string } | undefined)?.package_type ?? 'Silver';
  const affiliateTotal = REGISTRATION[packageType].affiliate;
  const sponsorSettings =
    sponsorPkg === 'Gold'
      ? {
          cashback_enabled: (sponsorRow as { cashback_enabled?: boolean })?.cashback_enabled,
          cashback_percentage: Number((sponsorRow as { cashback_percentage?: string })?.cashback_percentage ?? 0),
          cashback_package: (sponsorRow as { cashback_package?: string })?.cashback_package,
          cashback_type: (sponsorRow as { cashback_type?: string })?.cashback_type,
        }
      : {};
  const { sponsorAmount, cashbackAmount } = splitAffiliateCashback(
    affiliateTotal,
    sponsorSettings,
    'reg',
    packageType
  );

  // Real-time guard: sponsor must be active + subscription valid to receive commissions.
  const sponsorEligibilityRow = await trx('users')
    .where({ id: sponsorId })
    .first('status', 'subscription_active', 'subscription_expires_at');
  const sponsorEligible = isRecipientActiveForCommissions({
    status: (sponsorEligibilityRow as { status?: string } | undefined)?.status ?? 'active',
    subscriptionActive: (sponsorEligibilityRow as { subscription_active?: boolean } | undefined)?.subscription_active,
    subscriptionExpiresAt: (sponsorEligibilityRow as { subscription_expires_at?: string } | undefined)?.subscription_expires_at ?? null,
  });

  const sponsorPaid = sponsorEligible ? sponsorAmount : 0;
  const redirected = sponsorEligible ? 0 : sponsorAmount;

  await trx('earnings_ledger').insert({
    user_id: sponsorId,
    type: 'AFFILIATE',
    amount: sponsorPaid,
    source_user_id: userId,
    description: sponsorEligible ? 'Affiliate activation commission' : 'Affiliate commission redirected (inactive/expired)',
  });
  if (sponsorPaid > 0) {
    await trx('available_balance').where({ user_id: sponsorId }).increment('balance', sponsorPaid);
  }
  const hasWallets = await trx.schema.hasTable('wallets');
  if (hasWallets) {
    await trx('wallets').where({ user_id: sponsorId }).increment('affiliate_income', sponsorPaid);
    if (redirected > 0) {
      await trx('wallets').where({ user_id: sponsorId }).increment('lost_earnings', redirected);
    }
  }
  if (redirected > 0) {
    await creditAdminWallet({
      amount: redirected,
      type: 'AFFILIATE',
      sourceUserId: userId,
      description: 'Affiliate commission redirected (inactive/expired)',
      trx,
    });
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

  const globalPoolAmount = REGISTRATION[packageType].globalPool;
  const operationAmount = REGISTRATION[packageType].operation;
  const hasGlobalPoolLedger = await trx.schema.hasTable('global_pool_ledger');
  if (hasGlobalPoolLedger && globalPoolAmount > 0) {
    await trx('global_pool_ledger').insert({
      amount: globalPoolAmount,
      description: `Registration ${packageType} (user ${userId})`,
    });
  }
  if (operationAmount > 0) {
    await creditAdminWallet({
      amount: operationAmount,
      type: 'OPERATION',
      sourceUserId: userId,
      description: `Registration ${packageType} operation fee`,
      trx,
    });
  }

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
    sponsorEligible
      ? `Your referral has activated their account. ₦${sponsorPaid} commission credited.`
      : `Your referral activated, but your account is inactive/expired so your commission was not credited.`,
    { amount: sponsorPaid, redirected },
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
  const couponId = payment ? (payment as { coupon_used: string | null }).coupon_used : null;
  const gateway = (payment as { gateway?: string } | undefined)?.gateway;

  let packageType: 'Silver' | 'Gold' = gateway === 'flutterwave' ? 'Gold' : 'Silver';
  if (couponId) {
    const hasPackageTypeCol = await trx.schema.hasColumn('coupons', 'package_type');
    if (hasPackageTypeCol) {
      const coupon = await trx('coupons').where({ id: couponId }).first('package_type');
      const pkg = (coupon as { package_type?: string } | undefined)?.package_type;
      if (pkg === 'Silver' || pkg === 'Gold') packageType = pkg;
    }
  }

  if (payment) {
    await trx('activation_payments')
      .where({ gateway_ref: gatewayRef })
      .update({ status: 'completed', completed_at: trx.fn.now() });
  }

  await coreActivation({ userId, sponsorId, couponId, packageType }, trx);
}
