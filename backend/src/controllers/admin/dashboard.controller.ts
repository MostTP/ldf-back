import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

export async function getSummary(_req: Request, res: Response): Promise<void> {
  const [
    totalRevenueRow,
    globalPoolRow,
    capitalPoolRow,
    activeUsersRow,
    newTodayRow,
    newThisWeekRow,
    lastWebhookRow,
  ] = await Promise.all([
    knexInstance('earnings_ledger')
      .where({ type: 'AFFILIATE' })
      .sum('amount as total')
      .first(),
    knexInstance('global_pool_ledger').sum('amount as balance').first(),
    knexInstance('capital_pool_ledger').sum('amount as balance').first(),
    knexInstance('users').where({ status: 'active' }).count('id as count').first(),
    knexInstance('users')
      .whereRaw('created_at >= CURRENT_DATE')
      .count('id as count')
      .first(),
    knexInstance('users')
      .whereRaw('created_at >= date_trunc(\'week\', CURRENT_DATE)')
      .count('id as count')
      .first(),
    knexInstance('webhook_events').orderBy('received_at', 'desc').first('received_at'),
  ]);

  const totalRevenue = Number(totalRevenueRow?.total ?? 0);
  const globalPoolBalance = Number(globalPoolRow?.balance ?? 0);
  const capitalPoolBalance = Number(capitalPoolRow?.balance ?? 0);
  const activeUsers = Number(activeUsersRow?.count ?? 0);
  const newToday = Number(newTodayRow?.count ?? 0);
  const newThisWeek = Number(newThisWeekRow?.count ?? 0);
  const lastWebhookAt = (lastWebhookRow as { received_at: string | null } | undefined)?.received_at ?? null;

  res.json({
    totalRevenue,
    globalPoolBalance,
    capitalPoolBalance,
    activeUsers,
    newToday,
    newThisWeek,
    lastWebhookAt,
  });
}
