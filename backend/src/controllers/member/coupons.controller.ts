import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { knexInstance } from '../../config/db.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  const buf = randomBytes(4);
  let s = '';
  for (let i = 0; i < 8; i++) {
    s += CHARS[buf[i % 4]! % CHARS.length];
  }
  return s;
}

export async function generate(req: Request, res: Response): Promise<void> {
  if (!req.member!.isAgent) {
    res.status(403).json({ error: 'Agent access only' });
    return;
  }
  const id = req.member!.id;
  const quantity = Math.min(50, Math.max(1, Number((req.body as { quantity?: number }).quantity) || 1));

  const hasCreditsColumn = await knexInstance.schema.hasColumn('users', 'agent_coupon_credits');
  if (hasCreditsColumn) {
    const row = await knexInstance('users').where({ id }).first('agent_coupon_credits');
    const credits = Number((row as { agent_coupon_credits?: number })?.agent_coupon_credits ?? 0);
    if (credits < quantity) {
      res.status(400).json({ error: `Insufficient coupon credits. You have ${credits}, need ${quantity}. Buy more credits first.` });
      return;
    }
  }

  const codes: string[] = [];
  const existing = new Set(await knexInstance('coupons').pluck('code'));

  while (codes.length < quantity) {
    const code = generateCode();
    if (!existing.has(code)) {
      codes.push(code);
      existing.add(code);
    }
  }

  await knexInstance.transaction(async (trx) => {
    await trx('coupons').insert(codes.map((code) => ({ code, agent_id: id })));
    if (hasCreditsColumn) {
      await trx('users').where({ id }).decrement('agent_coupon_credits', quantity);
    }
  });

  res.status(201).json({ success: true, coupons: codes, count: codes.length });
}

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.member!.isAgent) {
    res.status(403).json({ error: 'Agent access only' });
    return;
  }
  const id = req.member!.id;
  const status = req.query.status as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  let countQb = knexInstance('coupons').where({ agent_id: id });
  if (status === 'unused') countQb = countQb.whereNull('used_by');
  if (status === 'used') countQb = countQb.whereNotNull('used_by');
  const total = await countQb.count('* as count').first();

  let dataQb = knexInstance('coupons as c')
    .leftJoin('users as u', 'c.used_by', 'u.id')
    .where('c.agent_id', id)
    .select('c.id', 'c.code', 'c.used_by', 'c.used_at', 'c.created_at', 'u.username as used_by_username');
  if (status === 'unused') dataQb = dataQb.whereNull('c.used_by');
  if (status === 'used') dataQb = dataQb.whereNotNull('c.used_by');
  const data = await dataQb.orderBy('c.created_at', 'desc').offset((page - 1) * limit).limit(limit);

  res.json({
    data,
    total: Number((total as { count: string })?.count ?? 0),
    page,
    limit,
  });
}

export async function getStats(req: Request, res: Response): Promise<void> {
  if (!req.member!.isAgent) {
    res.status(403).json({ error: 'Agent access only' });
    return;
  }
  const id = req.member!.id;

  const [totalRow, usedRow, commissionRow] = await Promise.all([
    knexInstance('coupons').where({ agent_id: id }).count('id as count').first(),
    knexInstance('coupons').where({ agent_id: id }).whereNotNull('used_by').count('id as count').first(),
    knexInstance('earnings_ledger').where({ user_id: id, type: 'AFFILIATE' }).sum('amount as total').first(),
  ]);

  const total = Number((totalRow as { count: string })?.count ?? 0);
  const used = Number((usedRow as { count: string })?.count ?? 0);

  res.json({
    totalGenerated: total,
    totalUsed: used,
    totalUnused: total - used,
    commissionsEarned: Number(commissionRow?.total ?? 0),
  });
}
