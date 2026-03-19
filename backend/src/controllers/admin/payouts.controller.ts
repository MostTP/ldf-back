import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';
import { writeAuditLog } from '../../services/auditLog.service.js';
import { insertNotification } from '../../services/notification.service.js';
import { initiateTransfer as paystackTransfer } from '../../services/payment/paystack.service.js';
import { initiateTransfer as flutterwaveTransfer } from '../../services/payment/flutterwave.service.js';

const DETTY_PERCENT = 10; // 10% of withdrawal to Detty December
const ALLOWED_PAYOUT_DAYS = [3, 5]; // Wednesday = 3, Friday = 5
const MAX_EXECUTE_BATCH = 50;

function isPayoutDay(): boolean {
  return ALLOWED_PAYOUT_DAYS.includes(new Date().getDay());
}

function getDisbursementProvider(): 'paystack' | 'flutterwave' | 'auto' {
  const v = String(process.env.DISBURSEMENT_PROVIDER ?? 'auto').toLowerCase();
  if (v === 'paystack' || v === 'flutterwave') return v;
  return 'auto';
}

async function executeGatewayTransfer(args: {
  provider: 'paystack' | 'flutterwave' | 'auto';
  amountToBank: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
}): Promise<{ gatewayRef: string }> {
  const { provider, amountToBank, currency, bankCode, accountNumber } = args;

  if (provider === 'paystack' || (provider === 'auto' && currency === 'NGN')) {
    const result = await paystackTransfer({ amount: amountToBank, bankCode, accountNumber });
    if (!result.success || !result.reference) throw new Error('Paystack transfer failed');
    return { gatewayRef: result.reference };
  }

  // Flutterwave supports multiple currencies; allow NGN too when configured.
  const result = await flutterwaveTransfer({ amount: amountToBank, currency, bankCode, accountNumber });
  if (!result.success || !result.reference) throw new Error('Flutterwave transfer failed');
  return { gatewayRef: result.reference };
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

  try {
    await knexInstance.transaction(async (trx) => {
      // Re-check inside trx for correct status before moving to processing
      const current = await trx('withdrawal_requests').where({ id }).first('status');
      if (!current) throw new Error('NOT_FOUND');
      if ((current as { status: string }).status !== 'pending') throw new Error('NOT_PENDING');

      await trx('withdrawal_requests').where({ id }).update({ status: 'processing', processed_by: adminId });

      await writeAuditLog(
        {
          adminId,
          actionType: 'APPROVE_WITHDRAWAL',
          targetEntity: 'withdrawal_requests',
          targetId: id,
          payloadSnapshot: { withdrawalId: id, status: 'processing' },
          ipAddress,
        },
        trx
      );
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND') {
      res.status(404).json({ error: 'Withdrawal not found' });
      return;
    }
    if (msg === 'NOT_PENDING') {
      res.status(409).json({ error: 'Withdrawal is not pending' });
      return;
    }
    throw err;
  }

  res.status(202).json({ message: 'Withdrawal queued for execution', id });
}

export async function batchApprove(req: Request, res: Response): Promise<void> {
  const ids = (req.body as { ids?: string[] }).ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids must be a non-empty array of withdrawal request IDs' });
    return;
  }
  const maxBatch = 50;
  const toProcess = ids.slice(0, maxBatch).filter((id) => typeof id === 'string');
  const processed: { id: string }[] = [];
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
    const adminId = req.admin!.id;
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

    try {
      await knexInstance.transaction(async (trx) => {
        await trx('withdrawal_requests')
          .where({ id })
          .update({ status: 'processing', processed_by: adminId });

        await writeAuditLog(
          {
            adminId,
            actionType: 'APPROVE_WITHDRAWAL',
            targetEntity: 'withdrawal_requests',
            targetId: id,
            payloadSnapshot: { withdrawalId: id, status: 'processing' },
            ipAddress,
          },
          trx
        );
      });
      processed.push({ id });
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : 'Transfer failed' });
    }
  }

  res.status(200).json({
    message: `Queued ${processed.length}, failed ${failed.length}`,
    processed,
    failed,
  });
}

export async function executeQueued(req: Request, res: Response): Promise<void> {
  if (!isPayoutDay()) {
    res.status(403).json({ error: 'Withdrawals are only processed on Wednesdays and Fridays' });
    return;
  }

  const limitRaw = req.query.limit != null ? Number(req.query.limit) : 20;
  const limit = Math.min(MAX_EXECUTE_BATCH, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));
  const currency = (req.query.currency as string | undefined) ?? undefined;
  const provider = getDisbursementProvider();
  const adminId = req.admin!.id;
  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  let qb = knexInstance('withdrawal_requests').where({ status: 'processing' });
  if (currency) qb = qb.andWhere('currency', currency);

  const rows = await qb
    .select('id', 'user_id', 'amount', 'currency', 'bank_code', 'account_number')
    .orderBy('created_at', 'asc')
    .limit(limit);

  const processed: { id: string; gatewayRef: string }[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const w of rows as any[]) {
    const id = String(w.id);
    const userId = String(w.user_id);
    const amount = Number(w.amount);
    const currencyVal = String(w.currency);
    const bankCode = String(w.bank_code);
    const accountNumber = String(w.account_number);

    const amountToBank = Math.round(amount * (1 - DETTY_PERCENT / 100) * 100) / 100;
    const dettyAmount = Math.round(amount * (DETTY_PERCENT / 100) * 100) / 100;

    try {
      const { gatewayRef } = await executeGatewayTransfer({
        provider,
        amountToBank,
        currency: currencyVal,
        bankCode,
        accountNumber,
      });

      await knexInstance.transaction(async (trx) => {
        const current = await trx('withdrawal_requests').where({ id }).first('status');
        if (!current || (current as { status: string }).status !== 'processing') return;

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
            actionType: 'EXECUTE_WITHDRAWAL',
            targetEntity: 'withdrawal_requests',
            targetId: id,
            payloadSnapshot: { withdrawalId: id, gatewayRef, amount, amountToBank, dettyAmount, currency: currencyVal },
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

      processed.push({ id, gatewayRef });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Transfer failed';
      failed.push({ id, error });

      await knexInstance.transaction(async (trx) => {
        const current = await trx('withdrawal_requests').where({ id }).first('status');
        if (!current || (current as { status: string }).status !== 'processing') return;

        await trx('withdrawal_requests').where({ id }).update({ status: 'pending' });
        await writeAuditLog(
          {
            adminId,
            actionType: 'EXECUTE_WITHDRAWAL_FAILED',
            targetEntity: 'withdrawal_requests',
            targetId: id,
            payloadSnapshot: { withdrawalId: id, error },
            ipAddress,
          },
          trx
        );
      });
    }
  }

  res.status(200).json({
    message: `Executed ${processed.length}, failed ${failed.length}`,
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
