import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

export async function list(req: Request, res: Response): Promise<void> {
  const adminId = req.query.adminId as string | undefined;
  const actionType = req.query.actionType as string | undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 50));

  let qb = knexInstance('audit_logs as a')
    .join('users as u', 'a.admin_id', 'u.id')
    .select(
      'a.id',
      'a.admin_id',
      'a.action_type',
      'a.target_entity',
      'a.target_id',
      'a.payload_snapshot',
      'a.ip_address',
      'a.created_at',
      'u.email as admin_email',
      'u.username as admin_name',
      'u.role as admin_role'
    );

  if (adminId) qb = qb.where('a.admin_id', adminId);
  if (actionType) qb = qb.where('a.action_type', actionType);
  if (from) qb = qb.where('a.created_at', '>=', from);
  if (to) qb = qb.where('a.created_at', '<=', to);

  const total = await qb.clone().count('a.id as count').first();
  const data = await qb
    .orderBy('a.created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  res.json({
    data,
    total: Number((total as { count: string })?.count ?? 0),
    page,
    limit,
  });
}
