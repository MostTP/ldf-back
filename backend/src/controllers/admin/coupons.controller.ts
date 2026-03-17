import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

export async function list(req: Request, res: Response): Promise<void> {
  const agentId = req.query.agentId as string | undefined;
  const status = req.query.status as string | undefined; // 'used' | 'unused'
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  let qb = knexInstance('coupons as c')
    .leftJoin('users as agent', 'c.agent_id', 'agent.id')
    .leftJoin('users as used_by', 'c.used_by', 'used_by.id')
    .select(
      'c.id',
      'c.code',
      'c.agent_id',
      'c.used_by',
      'c.used_at',
      'c.created_at',
      'agent.email as agent_email',
      'agent.username as agent_username',
      'used_by.email as used_by_email',
      'used_by.username as used_by_username'
    );

  if (agentId) qb = qb.where('c.agent_id', agentId);
  if (status === 'unused') qb = qb.whereNull('c.used_by');
  if (status === 'used') qb = qb.whereNotNull('c.used_by');

  const total = await qb.clone().count('c.id as count').first();
  const data = await qb
    .orderBy('c.created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  res.json({
    data,
    total: Number((total as { count: string })?.count ?? 0),
    page,
    limit,
  });
}
