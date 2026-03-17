import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

const ACTIVATION_AMOUNT = 3000;

export async function validateCoupon(req: Request, res: Response): Promise<void> {
  const { code } = req.body as { code: string };
  if (!code?.trim()) {
    res.status(400).json({ error: 'Code is required' });
    return;
  }
  const coupon = await knexInstance('coupons as c')
    .join('users as u', 'c.agent_id', 'u.id')
    .where('c.code', code.trim().toUpperCase())
    .select('c.id', 'c.used_by', 'u.username as agent_name')
    .first();
  if (!coupon) {
    res.status(400).json({ error: 'Invalid coupon code' });
    return;
  }
  const c = coupon as { used_by: string | null; agent_name: string };
  if (c.used_by) {
    res.status(409).json({ error: 'Coupon already used' });
    return;
  }
  res.json({ valid: true, agentName: c.agent_name });
}

const PACKAGE_GATEWAY: Record<string, 'paystack' | 'flutterwave'> = {
  Silver: 'paystack',
  Gold: 'flutterwave',
};

export async function initiateActivation(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const body = req.body as { package?: 'Silver' | 'Gold'; gateway?: 'paystack' | 'flutterwave'; couponCode?: string };
  const gateway = body.package != null ? PACKAGE_GATEWAY[body.package] : body.gateway;
  if (!gateway) {
    res.status(400).json({ error: 'Either package (Silver|Gold) or gateway (paystack|flutterwave) is required' });
    return;
  }
  if (body.package != null && body.gateway != null && gateway !== body.gateway) {
    res.status(400).json({
      error: `Package ${body.package} uses ${gateway}; gateway must match or be omitted`,
    });
    return;
  }
  const user = await knexInstance('users').where({ id }).first('status', 'activation_coupon');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if ((user as { status: string }).status === 'active') {
    res.status(409).json({ error: 'Already activated' });
    return;
  }
  const couponCode = (body.couponCode?.trim() || (user as { activation_coupon?: string }).activation_coupon)?.toUpperCase();
  let couponId: string | null = null;
  if (couponCode) {
    const coupon = await knexInstance('coupons').where('code', couponCode).first('id', 'used_by');
    if (!coupon || (coupon as { used_by: string | null }).used_by) {
      res.status(400).json({ error: 'Invalid or used coupon' });
      return;
    }
    couponId = (coupon as { id: string }).id;
  }
  const ref = 'act_' + id.slice(0, 8) + '_' + Date.now();
  let paymentUrl = 'https://checkout.paystack.com/fake?ref=' + ref;
  if (gateway === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
    const r = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: req.member!.email, amount: ACTIVATION_AMOUNT * 100, reference: ref }),
    });
    const d = (await r.json()) as { data?: { authorization_url?: string } };
    if (d.data?.authorization_url) paymentUrl = d.data.authorization_url;
  } else if (gateway === 'flutterwave' && process.env.FLUTTERWAVE_SECRET_KEY) {
    const r = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.FLUTTERWAVE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: ref,
        amount: ACTIVATION_AMOUNT,
        currency: 'NGN',
        redirect_url: process.env.FRONTEND_URL || '',
        customer: { email: req.member!.email },
      }),
    });
    const d = (await r.json()) as { data?: { link?: string } };
    if (d.data?.link) paymentUrl = d.data.link;
  }
  await knexInstance('activation_payments').insert({
    user_id: id,
    amount: ACTIVATION_AMOUNT,
    currency: 'NGN',
    gateway,
    gateway_ref: ref,
    status: 'pending',
    coupon_used: couponId,
  });
  res.json({ paymentUrl, reference: ref });
}

export async function getActivationStatus(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const user = await knexInstance('users').where({ id }).first('status');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const payment = await knexInstance('activation_payments')
    .where({ user_id: id, status: 'completed' })
    .orderBy('completed_at', 'desc')
    .first('completed_at');
  res.json({
    status: (user as { status: string }).status,
    activatedAt: (payment as { completed_at: string } | undefined)?.completed_at,
  });
}
