import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

export async function list(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const unreadOnly = req.query.unreadOnly === 'true';

  let qb = knexInstance('notifications').where({ user_id: id });
  if (unreadOnly) {
    qb = qb.where('is_read', false);
  }
  const total = await qb.clone().count('id as count').first();
  const unreadCount = await knexInstance('notifications').where({ user_id: id }).where('is_read', false).count('id as count').first();
  const data = await qb
    .select('id', 'type', 'title', 'body', 'message', 'metadata', 'payload', 'is_read', 'created_at')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  res.json({
    data,
    total: Number((total as { count: string })?.count ?? 0),
    unreadCount: Number((unreadCount as { count: string })?.count ?? 0),
    page,
    limit,
  });
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const body = req.body as { ids?: string[]; all?: boolean };

  if (body.all) {
    await knexInstance('notifications').where({ user_id: id }).update({ is_read: true });
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    await knexInstance('notifications').where({ user_id: id }).whereIn('id', body.ids).update({ is_read: true });
  }

  res.status(200).json({ message: 'Updated' });
}
