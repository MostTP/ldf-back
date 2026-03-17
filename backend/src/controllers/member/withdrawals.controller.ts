import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';
import { insertNotification } from '../../services/notification.service.js';

export async function submit(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const { amount, currency, bankCode, accountNumber } = req.body as { amount: number; currency: string; bankCode: string; accountNumber: string };

  try {
    const requestId = await knexInstance.transaction(async (trx) => {
      const balanceRow = await trx('available_balance').where({ user_id: id }).forUpdate().first('balance');
      if (!balanceRow) throw new Error('BALANCE_NOT_FOUND');
      const pendingRow = await trx('withdrawal_requests').where({ user_id: id, status: 'pending' }).sum('amount as total').first();
      const available = Number(balanceRow.balance);
      const pendingTotal = Number(pendingRow?.total ?? 0);
      const withdrawable = Math.max(0, available - pendingTotal);
      if (amount > withdrawable) throw new Error('INSUFFICIENT');
      const [reqRow] = await trx('withdrawal_requests')
        .insert({ user_id: id, amount, currency, bank_code: bankCode, account_number: accountNumber, status: 'pending' })
        .returning('id');
      await insertNotification(
        id,
        'WITHDRAWAL_REQUEST',
        'Withdrawal submitted',
        'Your withdrawal is pending review. 10% will be allocated to Detty December.',
        { amount, currency },
        trx
      );
      return (reqRow as { id: string }).id;
    });
    res.status(201).json({ success: true, message: 'Withdrawal request submitted', requestId });
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT') {
      res.status(400).json({ error: 'Insufficient withdrawable balance' });
      return;
    }
    if (err instanceof Error && err.message === 'BALANCE_NOT_FOUND') {
      res.status(400).json({ error: 'Balance record not found' });
      return;
    }
    throw err;
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const status = req.query.status as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  let qb = knexInstance('withdrawal_requests').where({ user_id: id });
  if (status) qb = qb.where({ status });
  const total = await qb.clone().count('id as count').first();
  const data = await qb.select('id', 'amount', 'currency', 'status', 'gateway_ref', 'reject_reason', 'created_at', 'processed_at').orderBy('created_at', 'desc').offset((page - 1) * limit).limit(limit);
  const sanitized = (data as Record<string, unknown>[]).map((row) => {
    const r = { ...row, requestedAt: row.created_at, processedAt: row.processed_at };
    if (r.status !== 'completed') delete r.gateway_ref;
    return r;
  });
  res.json({ data: sanitized, total: Number((total as { count: string })?.count ?? 0), page, limit });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const row = await knexInstance('withdrawal_requests').where({ id: req.params.id, user_id: id }).first();
  if (!row) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const r = row as Record<string, unknown>;
  const out: Record<string, unknown> = { id: r.id, amount: r.amount, currency: r.currency, status: r.status, rejectReason: r.reject_reason, requestedAt: r.created_at, processedAt: r.processed_at };
  if (r.status === 'completed') out.gatewayRef = r.gateway_ref;
  res.json(out);
}
