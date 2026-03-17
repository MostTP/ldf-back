import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';
import { insertNotification } from '../../services/notification.service.js';

export async function submit(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const { amount, lockMonths } = req.body as { amount: number; lockMonths: number };

  const result = await knexInstance.transaction(async (trx) => {
    const balanceRow = await trx('available_balance').where({ user_id: id }).forUpdate().first('balance');
    if (!balanceRow || Number(balanceRow.balance) < amount) {
      throw new Error('INSUFFICIENT');
    }
    const lockEnd = new Date();
    lockEnd.setMonth(lockEnd.getMonth() + lockMonths);

    await trx('available_balance').where({ user_id: id }).decrement('balance', amount);

    const [inv] = await trx('investments')
      .insert({
        user_id: id,
        amount,
        lock_end_date: lockEnd.toISOString().slice(0, 10),
        status: 'locked',
      })
      .returning('id', 'lock_end_date');

    await insertNotification(
      id,
      'INVESTMENT',
      'Investment committed',
      `Investment of ₦${amount} committed for ${lockMonths} months.`,
      { amount, lockMonths },
      trx
    );

    return inv as { id: string; lock_end_date: string };
  }).catch((err) => {
    if (err.message === 'INSUFFICIENT') return null;
    throw err;
  });

  if (!result) {
    res.status(400).json({ error: 'Insufficient available balance' });
    return;
  }

  res.status(201).json({
    investmentId: result.id,
    lockEndDate: result.lock_end_date,
    amount,
  });
}

export async function list(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const status = req.query.status as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  let qb = knexInstance('investments').where({ user_id: id });
  if (status) qb = qb.where({ status });

  const total = await qb.clone().count('id as count').first();
  const rows = await qb
    .select('id', 'amount', 'lock_end_date', 'total_roi_paid', 'status', 'created_at')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  const data = rows.map((r: { lock_end_date: string; amount: string; total_roi_paid: string }) => {
    const end = new Date(r.lock_end_date);
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    return {
      ...r,
      amount: Number(r.amount),
      totalRoiPaid: Number(r.total_roi_paid ?? 0),
      daysRemaining,
      lockEndDate: r.lock_end_date,
    };
  });

  res.json({
    data,
    total: Number((total as { count: string })?.count ?? 0),
    page,
    limit,
  });
}
