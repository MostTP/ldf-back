import type { Knex } from 'knex';
import {
  SUBSCRIPTION_RENEWAL,
  UPGRADE,
  UPGRADE_MATRIX_SCHEDULE,
  getRenewalMatrixSchedule,
  getUpgradeAmount,
  getRenewalAmount,
} from '../config/fees.js';
import { splitAffiliateCashback } from './cashback.service.js';
import { insertNotification } from './notification.service.js';
import { creditAdminWallet, isRecipientActiveForCommissions } from './subscriptionGuard.service.js';

const SILVER_SCHEDULE = getRenewalMatrixSchedule('Silver');
const GOLD_SCHEDULE = getRenewalMatrixSchedule('Gold');

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function getUplines(userId: string, trx: Knex.Transaction): Promise<string[]> {
  const uplines: string[] = [];
  let current = await trx('matrix_nodes').where({ user_id: userId }).first('parent_id');
  let parentId = (current as { parent_id?: string | null } | undefined)?.parent_id ?? null;
  while (parentId && uplines.length < 5) {
    uplines.push(parentId);
    const next = await trx('matrix_nodes').where({ user_id: parentId }).first('parent_id');
    parentId = (next as { parent_id?: string | null } | undefined)?.parent_id ?? null;
  }
  return uplines;
}

async function creditRecipient(args: {
  recipientId: string;
  amount: number;
  sourceUserId: string;
  level: number;
  description: string;
  trx: Knex.Transaction;
}): Promise<void> {
  const { recipientId, amount, sourceUserId, level, description, trx } = args;
  if (amount <= 0) return;

  await trx('earnings_ledger').insert({
    user_id: recipientId,
    type: 'MATRIX',
    amount,
    source_user_id: sourceUserId,
    level,
    description,
  });

  const bal = await trx('available_balance').where({ user_id: recipientId }).first('id');
  if (bal) await trx('available_balance').where({ user_id: recipientId }).increment('balance', amount);
  else await trx('available_balance').insert({ user_id: recipientId, balance: amount });

  const hasWallets = await trx.schema.hasTable('wallets');
  if (hasWallets) {
    await trx('wallets').where({ user_id: recipientId }).increment('matrix_income', amount);
  }
}

async function recordMissed(args: {
  recipientId: string;
  amount: number;
  sourceUserId: string;
  level: number;
  reason: 'EXPIRY' | 'TIER';
  trx: Knex.Transaction;
}): Promise<void> {
  const { recipientId, amount, sourceUserId, level, reason, trx } = args;
  if (amount <= 0) return;

  await trx('earnings_ledger').insert({
    user_id: recipientId,
    type: 'LOST_EARNINGS',
    amount,
    source_user_id: sourceUserId,
    level,
    description: reason === 'EXPIRY' ? 'Missed due to expiry' : 'Missed due to tier',
  });

  const hasWallets = await trx.schema.hasTable('wallets');
  if (hasWallets) {
    await trx('wallets').where({ user_id: recipientId }).increment('lost_earnings', amount);
  }

  await insertNotification(
    recipientId,
    'SUBSCRIPTION_MISSED_EARNING',
    'Missed earnings',
    `ALERT: You just missed ₦${Number(amount).toLocaleString()} because your subscription is EXPIRED.`,
    { amount, level, sourceUserId },
    trx
  );
}

async function distributeSchedule(args: {
  payerId: string;
  schedule: number[];
  payerTier: 'Silver' | 'Gold';
  trx: Knex.Transaction;
  tag: string;
  payerAmountTotal: number;
}): Promise<void> {
  const { payerId, schedule, payerTier, trx, tag, payerAmountTotal } = args;
  const uplines = await getUplines(payerId, trx);

  for (let i = 0; i < schedule.length; i++) {
    const level = i + 1;
    const uplineId = uplines[i];
    if (!uplineId) break;

    const u = await trx('users')
      .where({ id: uplineId })
      .first('package_type', 'status', 'subscription_active', 'subscription_expires_at');
    const uplineTier = ((u as { package_type?: string } | undefined)?.package_type ?? 'Silver') as 'Silver' | 'Gold';
    const eligible = isRecipientActiveForCommissions({
      status: (u as { status?: string } | undefined)?.status ?? 'active',
      subscriptionActive: (u as { subscription_active?: boolean } | undefined)?.subscription_active,
      subscriptionExpiresAt: (u as { subscription_expires_at?: string } | undefined)?.subscription_expires_at ?? null,
    });

    const goldAmt = GOLD_SCHEDULE[i] ?? 0;
    const silverAmt = SILVER_SCHEDULE[i] ?? 0;
    const scheduled = schedule[i] ?? 0;

    // Renewal logic:
    // - If payer is Silver: pay silver schedule (scheduled == silverAmt) when eligible; else redirect 100%
    // - If payer is Gold:
    //   - Gold upline + eligible: pay gold schedule
    //   - Silver upline + eligible: pay silver schedule, redirect (gold-silver)
    //   - Ineligible: redirect 100% of gold schedule
    let payToUpline = 0;
    let redirectToAdmin = 0;
    let missReason: 'EXPIRY' | 'TIER' | null = null;

    if (payerTier === 'Silver') {
      if (eligible) payToUpline = scheduled;
      else {
        redirectToAdmin = scheduled;
        missReason = 'EXPIRY';
      }
    } else {
      // payerTier Gold
      if (!eligible) {
        redirectToAdmin = goldAmt;
        missReason = 'EXPIRY';
      } else if (uplineTier === 'Gold') {
        payToUpline = goldAmt;
      } else {
        payToUpline = silverAmt;
        redirectToAdmin = Math.max(0, goldAmt - silverAmt);
        missReason = redirectToAdmin > 0 ? 'TIER' : null;
      }
    }

    if (payToUpline > 0) {
      await creditRecipient({
        recipientId: uplineId,
        amount: payToUpline,
        sourceUserId: payerId,
        level,
        description: `${tag} L${level} commission`,
        trx,
      });
    }

    if (redirectToAdmin > 0) {
      if (missReason) {
        await recordMissed({
          recipientId: uplineId,
          amount: redirectToAdmin,
          sourceUserId: payerId,
          level,
          reason: missReason,
          trx,
        });
      }
      await creditAdminWallet({
        amount: redirectToAdmin,
        type: 'MATRIX',
        sourceUserId: payerId,
        level,
        description: `${tag} redirected to admin`,
        trx,
      });
    }
  }

  // Payer notification summary (optional, light)
  await insertNotification(
    payerId,
    'SUBSCRIPTION_PAYMENT',
    'Subscription processed',
    `Your ${tag.toLowerCase()} was processed successfully.`,
    { amount: payerAmountTotal, tier: payerTier },
    trx
  );
}

export async function completeRenewalPayment(args: {
  userId: string;
  tier: 'Silver' | 'Gold';
  paymentRef: string;
  trx: Knex.Transaction;
}): Promise<void> {
  const { userId, tier, paymentRef, trx } = args;
  const now = new Date();

  const user = await trx('users')
    .where({ id: userId })
    .first('subscription_expires_at', 'subscription_active', 'status', 'package_type');
  if (!user) throw new Error('User not found');

  const currentExpiryRaw = (user as { subscription_expires_at?: string | null } | undefined)?.subscription_expires_at ?? null;
  const currentExpiry = currentExpiryRaw ? new Date(currentExpiryRaw) : null;
  const base = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  const nextExpiry = addDays(base, 30);

  await trx('users').where({ id: userId }).update({
    subscription_expires_at: nextExpiry,
    subscription_active: true,
    package_type: tier,
  });

  const renewal = SUBSCRIPTION_RENEWAL[tier];
  const amount = renewal.total;
  const schedule = tier === 'Gold' ? GOLD_SCHEDULE : SILVER_SCHEDULE;

  const sponsorId = (user as { referred_by?: string | null })?.referred_by ?? null;
  if (sponsorId && renewal.affiliate > 0) {
    const sponsorRow = await trx('users')
      .where({ id: sponsorId })
      .first('status', 'subscription_active', 'subscription_expires_at', 'package_type', 'cashback_enabled', 'cashback_percentage', 'cashback_package', 'cashback_type');
    const eligible = isRecipientActiveForCommissions({
      status: (sponsorRow as { status?: string } | undefined)?.status ?? 'active',
      subscriptionActive: (sponsorRow as { subscription_active?: boolean } | undefined)?.subscription_active,
      subscriptionExpiresAt: (sponsorRow as { subscription_expires_at?: string } | undefined)?.subscription_expires_at ?? null,
    });
    const affiliateTotalEligible = eligible ? renewal.affiliate : 0;
    const redirectAffiliate = renewal.affiliate - affiliateTotalEligible;
    const sponsorPkg = (sponsorRow as { package_type?: string } | undefined)?.package_type ?? 'Silver';
    const sponsorSettings =
      sponsorPkg === 'Gold'
        ? {
            cashback_enabled: (sponsorRow as { cashback_enabled?: boolean })?.cashback_enabled,
            cashback_percentage: (sponsorRow as { cashback_percentage?: string })?.cashback_percentage,
            cashback_package: (sponsorRow as { cashback_package?: string })?.cashback_package,
            cashback_type: (sponsorRow as { cashback_type?: string })?.cashback_type,
          }
        : {};
    const { sponsorAmount, cashbackAmount } = splitAffiliateCashback(
      affiliateTotalEligible,
      sponsorSettings,
      'monthly',
      tier
    );
    if (sponsorAmount > 0) {
      await trx('earnings_ledger').insert({
        user_id: sponsorId,
        type: 'AFFILIATE',
        amount: sponsorAmount,
        source_user_id: userId,
        description: 'Renewal affiliate commission',
      });
      const bal = await trx('available_balance').where({ user_id: sponsorId }).first('id');
      if (bal) await trx('available_balance').where({ user_id: sponsorId }).increment('balance', sponsorAmount);
      else await trx('available_balance').insert({ user_id: sponsorId, balance: sponsorAmount });
      const hasWallets = await trx.schema.hasTable('wallets');
      if (hasWallets) await trx('wallets').where({ user_id: sponsorId }).increment('affiliate_income', sponsorAmount);
    }
    if (cashbackAmount > 0) {
      await trx('earnings_ledger').insert({
        user_id: userId,
        type: 'CASHBACK',
        amount: cashbackAmount,
        source_user_id: sponsorId,
        description: 'Cashback from sponsor (renewal)',
      });
      const bal = await trx('available_balance').where({ user_id: userId }).first('id');
      if (bal) await trx('available_balance').where({ user_id: userId }).increment('balance', cashbackAmount);
      else await trx('available_balance').insert({ user_id: userId, balance: cashbackAmount });
      const hasWallets = await trx.schema.hasTable('wallets');
      if (hasWallets) await trx('wallets').where({ user_id: userId }).increment('main_earnings', cashbackAmount);
    }
    if (redirectAffiliate > 0) {
      await creditAdminWallet({
        amount: redirectAffiliate,
        type: 'AFFILIATE',
        sourceUserId: userId,
        description: 'Renewal affiliate redirected (inactive/expired)',
        trx,
      });
    }
  }

  await distributeSchedule({
    payerId: userId,
    schedule,
    payerTier: tier,
    trx,
    tag: 'Renewal',
    payerAmountTotal: amount,
  });

  const hasGlobalPoolLedger = await trx.schema.hasTable('global_pool_ledger');
  if (hasGlobalPoolLedger && renewal.globalPool > 0) {
    await trx('global_pool_ledger').insert({
      amount: renewal.globalPool,
      description: `Renewal ${tier} (user ${userId})`,
    });
  }
  if (renewal.operation > 0) {
    await creditAdminWallet({
      amount: renewal.operation,
      type: 'OPERATION',
      sourceUserId: userId,
      description: `Renewal ${tier} operation fee`,
      trx,
    });
  }
}

export async function completeUpgradePayment(args: {
  userId: string;
  paymentRef: string;
  trx: Knex.Transaction;
}): Promise<void> {
  const { userId, trx } = args;

  await trx('users').where({ id: userId }).update({ package_type: 'Gold' });

  const sponsorIdRow = await trx('users').where({ id: userId }).first('referred_by');
  const sponsorId = (sponsorIdRow as { referred_by?: string | null })?.referred_by ?? null;
  if (sponsorId && UPGRADE.affiliate > 0) {
    const sponsorRow = await trx('users')
      .where({ id: sponsorId })
      .first('status', 'subscription_active', 'subscription_expires_at', 'package_type', 'cashback_enabled', 'cashback_percentage', 'cashback_package', 'cashback_type');
    const eligible = isRecipientActiveForCommissions({
      status: (sponsorRow as { status?: string } | undefined)?.status ?? 'active',
      subscriptionActive: (sponsorRow as { subscription_active?: boolean } | undefined)?.subscription_active,
      subscriptionExpiresAt: (sponsorRow as { subscription_expires_at?: string } | undefined)?.subscription_expires_at ?? null,
    });
    const affiliateTotalEligible = eligible ? UPGRADE.affiliate : 0;
    const redirectAffiliate = UPGRADE.affiliate - affiliateTotalEligible;
    const sponsorPkg = (sponsorRow as { package_type?: string } | undefined)?.package_type ?? 'Silver';
    const sponsorSettings =
      sponsorPkg === 'Gold'
        ? {
            cashback_enabled: (sponsorRow as { cashback_enabled?: boolean })?.cashback_enabled,
            cashback_percentage: (sponsorRow as { cashback_percentage?: string })?.cashback_percentage,
            cashback_package: (sponsorRow as { cashback_package?: string })?.cashback_package,
            cashback_type: (sponsorRow as { cashback_type?: string })?.cashback_type,
          }
        : {};
    const { sponsorAmount, cashbackAmount } = splitAffiliateCashback(
      affiliateTotalEligible,
      sponsorSettings,
      'upgrade',
      'Gold'
    );
    if (sponsorAmount > 0) {
      await trx('earnings_ledger').insert({
        user_id: sponsorId,
        type: 'AFFILIATE',
        amount: sponsorAmount,
        source_user_id: userId,
        description: 'Upgrade to Gold affiliate commission',
      });
      const bal = await trx('available_balance').where({ user_id: sponsorId }).first('id');
      if (bal) await trx('available_balance').where({ user_id: sponsorId }).increment('balance', sponsorAmount);
      else await trx('available_balance').insert({ user_id: sponsorId, balance: sponsorAmount });
      const hasWallets = await trx.schema.hasTable('wallets');
      if (hasWallets) await trx('wallets').where({ user_id: sponsorId }).increment('affiliate_income', sponsorAmount);
    }
    if (cashbackAmount > 0) {
      await trx('earnings_ledger').insert({
        user_id: userId,
        type: 'CASHBACK',
        amount: cashbackAmount,
        source_user_id: sponsorId,
        description: 'Cashback from sponsor (upgrade)',
      });
      const bal = await trx('available_balance').where({ user_id: userId }).first('id');
      if (bal) await trx('available_balance').where({ user_id: userId }).increment('balance', cashbackAmount);
      else await trx('available_balance').insert({ user_id: userId, balance: cashbackAmount });
      const hasWallets = await trx.schema.hasTable('wallets');
      if (hasWallets) await trx('wallets').where({ user_id: userId }).increment('main_earnings', cashbackAmount);
    }
    if (redirectAffiliate > 0) {
      await creditAdminWallet({
        amount: redirectAffiliate,
        type: 'AFFILIATE',
        sourceUserId: userId,
        description: 'Upgrade affiliate redirected (inactive/expired)',
        trx,
      });
    }
  }

  await distributeSchedule({
    payerId: userId,
    schedule: [...UPGRADE_MATRIX_SCHEDULE],
    payerTier: 'Gold',
    trx,
    tag: 'Upgrade',
    payerAmountTotal: UPGRADE.total,
  });

  const hasGlobalPoolLedger = await trx.schema.hasTable('global_pool_ledger');
  if (hasGlobalPoolLedger && UPGRADE.globalPool > 0) {
    await trx('global_pool_ledger').insert({
      amount: UPGRADE.globalPool,
      description: `Upgrade to Gold (user ${userId})`,
    });
  }
  if (UPGRADE.operation > 0) {
    await creditAdminWallet({
      amount: UPGRADE.operation,
      type: 'OPERATION',
      sourceUserId: userId,
      description: 'Upgrade operation fee',
      trx,
    });
  }
}

export { getRenewalAmount, getUpgradeAmount };

