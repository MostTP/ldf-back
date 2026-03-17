import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';
import { writeAuditLog } from '../../services/auditLog.service.js';
import { insertNotification } from '../../services/notification.service.js';
import { initiateTransfer as paystackTransfer } from '../../services/payment/paystack.service.js';
import { initiateTransfer as flutterwaveTransfer } from '../../services/payment/flutterwave.service.js';

const DETTY_PERCENT = 10; // 10% of withdrawal to Detty December
const ALLOWED_PAYOUT_DAYS = [3, 5]; // Wednesday = 3, Friday = 5

function isPayoutDay(): boolean {
  return ALLOWED_PAYOUT_DAYS.includes(new Date().getDay());
}

export async function listPending(req: Request, res: Response): Promise<void> {
  const currency = req.query.currency as string | undefined;
  const minAmount = req.query.minAmount != null ? Number(req.query.minAmount) : undefined;
  const maxAmount = req.query.maxAmount != null ? Number(req.query.maxAmount) : undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  let qb = knexInstance('withdrawal_requests as w')
    .join('users as u', 'w.user_id', 'u.id')
    .where('w.status', 'pending')
    .select(
      'w.id',
      'w.user_id',
      'w.amount',
      'w.currency',
      'w.bank_code',
      'w.account_number',
      'w.status',
      'w.created_at',
      'u.email',
      'u.username as name'
    );

  if (currency) qb = qb.where('w.currency', currency);
  if (minAmount != null && !Number.isNaN(minAmount)) qb = qb.where('w.amount', '>=', minAmount);
  if (maxAmount != null && !Number.isNaN(maxAmount)) qb = qb.where('w.amount', '<=', maxAmount);
  if (from) qb = qb.where('w.created_at', '>=', from);
  if (to) qb = qb.where('w.created_at', '<=', to);

  const total = await qb.clone().count('w.id as count').first();
  const data = await qb
    .orderBy('w.created_at', 'asc')
    .offset((page - 1) * limit)
    .limit(limit);

  res.json({
    data,
    total: Number((total as { count: string })?.count ?? 0),
    page,
    limit,
  });
}

export async function approve(req: Request, res: Response): Promise<void> {
  if (!isPayoutDay()) {
    res.status(403).json({ error: 'Withdrawals are only processed on Wednesdays and Fridays' });
    return;
  }
  const { id } = req.params;
  const adminId = req.admin!.id;
  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  const withdrawal = await knexInstance('withdrawal_requests').where({ id }).first();
  if (!withdrawal) {
    res.status(404).json({ error: 'Withdrawal not found' });
    return;
  }
  if (withdrawal.status !== 'pending') {
    res.status(409).json({ error: 'Withdrawal is not pending' });
    return;
  }

  const amount = Number(withdrawal.amount);
  const amountToBank = Math.round(amount * (1 - DETTY_PERCENT / 100) * 100) / 100;
  const dettyAmount = Math.round(amount * (DETTY_PERCENT / 100) * 100) / 100;
  const userId = withdrawal.user_id as string;
  const currency = withdrawal.currency as string;
  const bankCode = withdrawal.bank_code as string;
  const accountNumber = withdrawal.account_number as string;

  let gatewayRef = '';
  try {
    await knexInstance.transaction(async (trx) => {
      await trx('withdrawal_requests')
        .where({ id })
        .update({ status: 'processing', processed_by: adminId });

      if (currency === 'NGN') {
        const result = await paystackTransfer({ amount: amountToBank, bankCode, accountNumber });
        if (!result.success || !result.reference) throw new Error('Paystack transfer failed');
        gatewayRef = result.reference;
      } else if (['GHS', 'KES', 'ZAR'].includes(currency)) {
        const result = await flutterwaveTransfer({
          amount: amountToBank,
          currency,
          bankCode,
          accountNumber,
        });
        if (!result.success || !result.reference) throw new Error('Flutterwave transfer failed');
        gatewayRef = result.reference;
      } else {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      if (dettyAmount > 0 && (await trx.schema.hasTable('wallets'))) {
        await trx('wallets').where({ user_id: userId }).increment('detty_december', dettyAmount);
      }

      await trx('withdrawal_requests')
        .where({ id })
        .update({
          status: 'completed',
          gateway_ref: gatewayRef,
          processed_at: trx.fn.now(),
        });

      await writeAuditLog(
        {
          adminId,
          actionType: 'APPROVE_WITHDRAWAL',
          targetEntity: 'withdrawal_requests',
          targetId: id,
          payloadSnapshot: { withdrawalId: id, gatewayRef, amount, amountToBank, dettyAmount, currency },
          ipAddress,
        },
        trx
      );

      await insertNotification(
        userId,
        'WITHDRAWAL_COMPLETED',
        'Withdrawal completed',
        `₦${amountToBank.toLocaleString()} sent to your bank. ₦${dettyAmount.toLocaleString()} added to Detty December.`,
        { amountToBank, dettyAmount, gatewayRef },
        trx
      );
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transfer failed';
    res.status(502).json({ error: message });
    return;
  }

  res.status(200).json({
    message: 'Withdrawal approved',
    gatewayRef,
    amountToBank,
    dettyAmount,
  });
}

export async function batchApprove(req: Request, res: Response): Promise<void> {
  if (!isPayoutDay()) {
    res.status(403).json({ error: 'Withdrawals are only processed on Wednesdays and Fridays' });
    return;
  }
  const ids = (req.body as { ids?: string[] }).ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids must be a non-empty array of withdrawal request IDs' });
    return;
  }
  const maxBatch = 50;
  const toProcess = ids.slice(0, maxBatch).filter((id) => typeof id === 'string');
  const processed: { id: string; gatewayRef: string; amountToBank: number; dettyAmount: number }[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const id of toProcess) {
    const withdrawal = await knexInstance('withdrawal_requests').where({ id }).first();
    if (!withdrawal) {
      failed.push({ id, error: 'Not found' });
      continue;
    }
    if (withdrawal.status !== 'pending') {
      failed.push({ id, error: 'Not pending' });
      continue;
    }
    const amount = Number(withdrawal.amount);
    const amountToBank = Math.round(amount * (1 - DETTY_PERCENT / 100) * 100) / 100;
    const dettyAmount = Math.round(amount * (DETTY_PERCENT / 100) * 100) / 100;
    const userId = withdrawal.user_id as string;
    const currency = withdrawal.currency as string;
    const bankCode = withdrawal.bank_code as string;
    const accountNumber = withdrawal.account_number as string;
    const adminId = req.admin!.id;
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

    try {
      let gatewayRef = '';
      await knexInstance.transaction(async (trx) => {
        await trx('withdrawal_requests')
          .where({ id })
          .update({ status: 'processing', processed_by: adminId });

        if (currency === 'NGN') {
          const result = await paystackTransfer({ amount: amountToBank, bankCode, accountNumber });
          if (!result.success || !result.reference) throw new Error('Paystack transfer failed');
          gatewayRef = result.reference;
        } else if (['GHS', 'KES', 'ZAR'].includes(currency)) {
          const result = await flutterwaveTransfer({
            amount: amountToBank,
            currency,
            bankCode,
            accountNumber,
          });
          if (!result.success || !result.reference) throw new Error('Flutterwave transfer failed');
          gatewayRef = result.reference;
        } else {
          throw new Error(`Unsupported currency: ${currency}`);
        }

        if (dettyAmount > 0 && (await trx.schema.hasTable('wallets'))) {
          await trx('wallets').where({ user_id: userId }).increment('detty_december', dettyAmount);
        }

        await trx('withdrawal_requests')
          .where({ id })
          .update({ status: 'completed', gateway_ref: gatewayRef, processed_at: trx.fn.now() });

        await writeAuditLog(
          {
            adminId,
            actionType: 'APPROVE_WITHDRAWAL',
            targetEntity: 'withdrawal_requests',
            targetId: id,
            payloadSnapshot: { withdrawalId: id, gatewayRef, amount, amountToBank, dettyAmount, currency },
            ipAddress,
          },
          trx
        );

        await insertNotification(
          userId,
          'WITHDRAWAL_COMPLETED',
          'Withdrawal completed',
          `${amountToBank.toLocaleString()} sent to your bank. ${dettyAmount.toLocaleString()} added to Detty December.`,
          { amountToBank, dettyAmount, gatewayRef },
          trx
        );
      });
      processed.push({ id, gatewayRef, amountToBank, dettyAmount });
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : 'Transfer failed' });
    }
  }

  res.status(200).json({
    message: `Processed ${processed.length}, failed ${failed.length}`,
    processed,
    failed,
  });
}

export async function reject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { reason } = req.body as { reason: string };
  const adminId = req.admin!.id;
  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  const withdrawal = await knexInstance('withdrawal_requests').where({ id }).first();
  if (!withdrawal) {
    res.status(404).json({ error: 'Withdrawal not found' });
    return;
  }
  if (withdrawal.status !== 'pending') {
    res.status(409).json({ error: 'Withdrawal is not pending' });
    return;
  }

  await knexInstance.transaction(async (trx) => {
    await trx('withdrawal_requests')
      .where({ id })
      .update({
        status: 'rejected',
        reject_reason: reason,
        processed_by: adminId,
        processed_at: trx.fn.now(),
      });
    await writeAuditLog(
      {
        adminId,
        actionType: 'REJECT_WITHDRAWAL',
        targetEntity: 'withdrawal_requests',
        targetId: id,
        payloadSnapshot: { reason },
        ipAddress,
      },
      trx
    );
    await trx('notifications').insert({
      user_id: withdrawal.user_id,
      type: 'WITHDRAWAL_REJECTED',
      message: reason,
      payload: { withdrawalId: id },
    });
  });

  res.status(200).json({ message: 'Withdrawal rejected' });
}

export async function auditLog(req: Request, res: Response): Promise<void> {
  const userId = req.query.userId as string | undefined;
  const status = req.query.status as string | undefined;
  const currency = req.query.currency as string | undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  let qb = knexInstance('withdrawal_requests as w')
    .join('users as u', 'w.user_id', 'u.id')
    .leftJoin('users as admin', 'w.processed_by', 'admin.id')
    .whereIn('w.status', ['completed', 'rejected'])
    .select(
      'w.id',
      'w.user_id',
      'w.amount',
      'w.currency',
      'w.status',
      'w.gateway_ref',
      'w.reject_reason',
      'w.processed_at',
      'w.created_at',
      'u.email',
      'u.username as user_name',
      'admin.username as processed_by_admin'
    );

  if (userId) qb = qb.where('w.user_id', userId);
  if (status) qb = qb.where('w.status', status);
  if (currency) qb = qb.where('w.currency', currency);
  if (from) qb = qb.where('w.processed_at', '>=', from);
  if (to) qb = qb.where('w.processed_at', '<=', to);

  const total = await qb.clone().count('w.id as count').first();
  const data = await qb
    .orderBy('w.processed_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  res.json({
    data,
    total: Number((total as { count: string })?.count ?? 0),
    page,
    limit,
  });
}

export async function listInvestments(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  let qb = knexInstance('investments as i')
    .join('users as u', 'i.user_id', 'u.id')
    .select(
      'i.id',
      'i.user_id',
      'i.amount',
      'i.lock_end_date',
      'i.total_roi_paid',
      'i.status',
      'i.created_at',
      'u.email',
      'u.username'
    );

  if (status) qb = qb.where('i.status', status);

  const total = await qb.clone().count('i.id as count').first();
  const rows = await qb
    .orderBy('i.lock_end_date', 'asc')
    .offset((page - 1) * limit)
    .limit(limit);

  const data = rows.map((r: Record<string, unknown>) => {
    const lockEnd = r.lock_end_date as string;
    const daysRemaining = lockEnd
      ? Math.max(0, Math.ceil((new Date(lockEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : null;
    return { ...r, daysRemaining };
  });

  res.json({
    data,
    total: Number((total as { count: string })?.count ?? 0),
    page,
    limit,
  });
}
