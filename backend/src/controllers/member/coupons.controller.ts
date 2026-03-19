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
  const body = req.body as { quantity?: number; packageType?: string };
  const quantity = Math.min(50, Math.max(1, Number(body.quantity) || 1));
  const hasPackageTypeCol = await knexInstance.schema.hasColumn('coupons', 'package_type');
  const packageType = hasPackageTypeCol && (body.packageType === 'Silver' || body.packageType === 'Gold') ? body.packageType : 'Silver';

  const hasCreditsLegacy = await knexInstance.schema.hasColumn('users', 'agent_coupon_credits');
  const hasSilverCredits = await knexInstance.schema.hasColumn('users', 'agent_coupon_credits_silver');
  const hasGoldCredits = await knexInstance.schema.hasColumn('users', 'agent_coupon_credits_gold');

  // Determine which credits column to use for this package.
  let creditsColumn: string | null = null;
  if (packageType === 'Gold') {
    if (hasGoldCredits) creditsColumn = 'agent_coupon_credits_gold';
    else if (hasCreditsLegacy) creditsColumn = 'agent_coupon_credits';
  } else {
    if (hasSilverCredits) creditsColumn = 'agent_coupon_credits_silver';
    else if (hasCreditsLegacy) creditsColumn = 'agent_coupon_credits';
  }

  if (creditsColumn) {
    const row = await knexInstance('users').where({ id }).first(creditsColumn);
    const credits = Number((row as Record<string, unknown>)?.[creditsColumn] ?? 0);
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
    const rows = codes.map((code) => ({ code, agent_id: id, ...(hasPackageTypeCol ? { package_type: packageType } : {}) }));
    await trx('coupons').insert(rows);
    if (creditsColumn) {
      await trx('users').where({ id }).decrement(creditsColumn, quantity);
    }
  });

  res.status(201).json({ success: true, coupons: codes, count: codes.length, packageType });
}

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.member!.isAgent) {
    res.status(403).json({ error: 'Agent access only' });
    return;
  }
  const id = req.member!.id;
  const status = req.query.status as string | undefined;
  const packageTypeFilter = req.query.packageType as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const hasPackageTypeCol = await knexInstance.schema.hasColumn('coupons', 'package_type');

  let countQb = knexInstance('coupons').where({ agent_id: id });
  if (status === 'unused') countQb = countQb.whereNull('used_by');
  if (status === 'used') countQb = countQb.whereNotNull('used_by');
  if (hasPackageTypeCol && packageTypeFilter === 'Silver') countQb = countQb.where('package_type', 'Silver');
  if (hasPackageTypeCol && packageTypeFilter === 'Gold') countQb = countQb.where('package_type', 'Gold');
  const total = await countQb.count('* as count').first();

  const listCols = ['c.id', 'c.code', 'c.used_by', 'c.used_at', 'c.created_at', 'u.username as used_by_username'];
  if (hasPackageTypeCol) listCols.push('c.package_type');
  let dataQb = knexInstance('coupons as c')
    .leftJoin('users as u', 'c.used_by', 'u.id')
    .where('c.agent_id', id)
    .select(listCols);
  if (status === 'unused') dataQb = dataQb.whereNull('c.used_by');
  if (status === 'used') dataQb = dataQb.whereNotNull('c.used_by');
  if (hasPackageTypeCol && packageTypeFilter === 'Silver') dataQb = dataQb.where('c.package_type', 'Silver');
  if (hasPackageTypeCol && packageTypeFilter === 'Gold') dataQb = dataQb.where('c.package_type', 'Gold');
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

const CREDIT_PRICE = 100; // ₦100 per coupon credit

const COUPON_CREDITS_GATEWAY_BY_PACKAGE: Record<'Silver' | 'Gold', 'paystack' | 'flutterwave'> = {
  Silver: 'paystack',
  Gold: 'flutterwave',
};

export async function initiateCouponCreditsPurchase(req: Request, res: Response): Promise<void> {
  if (!req.member!.isAgent) {
    res.status(403).json({ error: 'Agent access only' });
    return;
  }

  const agentId = req.member!.id;
  const body = req.body as { packageType: 'Silver' | 'Gold'; quantity: number; gateway?: 'paystack' | 'flutterwave' };
  const packageType = body.packageType;
  const quantity = Math.min(1000, Math.max(1, Number(body.quantity) || 0));

  if (!packageType || !['Silver', 'Gold'].includes(packageType)) {
    res.status(400).json({ error: 'packageType must be Silver or Gold' });
    return;
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    res.status(400).json({ error: 'quantity must be at least 1' });
    return;
  }

  const expectedGateway = COUPON_CREDITS_GATEWAY_BY_PACKAGE[packageType];
  const gateway = body.gateway ?? expectedGateway;
  if (gateway !== expectedGateway) {
    res.status(400).json({ error: `For ${packageType} credits, gateway must be ${expectedGateway}` });
    return;
  }

  const amount = quantity * CREDIT_PRICE;
  const ref = `couponcred_${agentId.slice(0, 8)}_${Date.now()}`;

  let paymentUrl = gateway === 'paystack' ? `https://checkout.paystack.com/fake?ref=${ref}` : `https://checkout.flutterwave.com/fake?ref=${ref}`;

  if (gateway === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
    const r = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: req.member!.email,
        amount: amount * 100, // naira to kobo
        reference: ref,
      }),
    });
    const d = (await r.json()) as { data?: { authorization_url?: string } };
    if (d.data?.authorization_url) paymentUrl = d.data.authorization_url;
  }

  if (gateway === 'flutterwave' && process.env.FLUTTERWAVE_SECRET_KEY) {
    const r = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.FLUTTERWAVE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: ref,
        amount,
        currency: 'NGN',
        redirect_url: process.env.FRONTEND_URL || '',
        customer: { email: req.member!.email },
      }),
    });
    const d = (await r.json()) as { data?: { link?: string } };
    if (d.data?.link) paymentUrl = d.data.link;
  }

  await knexInstance('agent_coupon_credit_payments').insert({
    agent_id: agentId,
    package_type: packageType,
    quantity,
    amount,
    currency: 'NGN',
    gateway,
    gateway_ref: ref,
    status: 'pending',
  });

  res.json({ paymentUrl, reference: ref, amount, currency: 'NGN', packageType, gateway, quantity });
}
