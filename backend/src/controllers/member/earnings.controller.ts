import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

export async function getSummary(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;

  const [balanceRow, byType, totalWithdrawn, pendingWd] = await Promise.all([
    knexInstance('available_balance').where({ user_id: id }).first('balance'),
    knexInstance('earnings_ledger').where({ user_id: id }).select('type').sum('amount as total').groupBy('type'),
    knexInstance('withdrawal_requests').where({ user_id: id, status: 'completed' }).sum('amount as total').first(),
    knexInstance('withdrawal_requests').where({ user_id: id, status: 'pending' }).sum('amount as total').first(),
  ]);

  const availableBalance = Number(balanceRow?.balance ?? 0);
  const totalWithdrawnVal = Number(totalWithdrawn?.total ?? 0);
  const pendingWithdrawals = Number(pendingWd?.total ?? 0);

  const byTypeMap: Record<string, number> = {};
  let totalEarnings = 0;
  for (const row of byType as { type: string; total: string }[]) {
    byTypeMap[row.type] = Number(row.total);
    totalEarnings += Number(row.total);
  }

  res.json({
    availableBalance,
    totalEarnings,
    byType: byTypeMap,
    totalWithdrawn: totalWithdrawnVal,
    pendingWithdrawals,
  });
}

export async function getLedger(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const type = req.query.type as string | undefined;

  let qb = knexInstance('earnings_ledger').where({ user_id: id });
  if (type) qb = qb.where({ type });

  const total = await qb.clone().count('id as count').first();
  const data = await qb
    .select('id', 'type', 'amount', 'level', 'description', 'created_at')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  res.json({
    data,
    total: Number((total as { count: string })?.count ?? 0),
    page,
    limit,
  });
}

export async function getBalance(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;

  const [balanceRow, pendingRow] = await Promise.all([
    knexInstance('available_balance').where({ user_id: id }).first('balance'),
    knexInstance('withdrawal_requests').where({ user_id: id, status: 'pending' }).sum('amount as total').first(),
  ]);

  const availableBalance = Number(balanceRow?.balance ?? 0);
  const pendingWithdrawals = Number(pendingRow?.total ?? 0);
  const withdrawableBalance = Math.max(0, availableBalance - pendingWithdrawals);

  res.json({
    availableBalance,
    pendingWithdrawals,
    withdrawableBalance,
  });
}
