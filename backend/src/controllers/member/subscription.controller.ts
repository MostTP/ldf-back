import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';
import { completeRenewalPayment, completeUpgradePayment, getRenewalAmount, getUpgradeAmount } from '../../services/subscription.service.js';

const DEFAULT_GATEWAY: Record<'Silver' | 'Gold', 'paystack' | 'flutterwave'> = {
  Silver: 'paystack',
  Gold: 'flutterwave',
};

function makeRef(prefix: string, userId: string): string {
  return `${prefix}_${userId.slice(0, 8)}_${Date.now()}`;
}

export async function initiateRenewal(req: Request, res: Response): Promise<void> {
  const userId = req.member!.id;
  const body = req.body as { tier: 'Silver' | 'Gold'; gateway?: 'paystack' | 'flutterwave' };
  const tier = body.tier;
  const gateway = body.gateway ?? DEFAULT_GATEWAY[tier];
  const amount = getRenewalAmount(tier);
  const ref = makeRef('sub', userId);

  let paymentUrl = 'https://checkout.paystack.com/fake?ref=' + ref;
  if (gateway === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
    const r = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: req.member!.email, amount: amount * 100, reference: ref }),
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
        amount,
        currency: 'NGN',
        redirect_url: process.env.FRONTEND_URL || '',
        customer: { email: req.member!.email },
      }),
    });
    const d = (await r.json()) as { data?: { link?: string } };
    if (d.data?.link) paymentUrl = d.data.link;
  }

  await knexInstance('subscription_payments').insert({
    user_id: userId,
    kind: 'RENEWAL',
    tier,
    amount,
    currency: 'NGN',
    gateway,
    gateway_ref: ref,
    status: 'pending',
  });

  res.json({ paymentUrl, reference: ref, tier, amount });
}

export async function initiateUpgrade(req: Request, res: Response): Promise<void> {
  const userId = req.member!.id;
  const body = req.body as { gateway?: 'paystack' | 'flutterwave' };
  const gateway = body.gateway ?? 'flutterwave';
  const amount = getUpgradeAmount();
  const ref = makeRef('upg', userId);

  let paymentUrl = 'https://checkout.paystack.com/fake?ref=' + ref;
  if (gateway === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
    const r = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: req.member!.email, amount: amount * 100, reference: ref }),
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
        amount,
        currency: 'NGN',
        redirect_url: process.env.FRONTEND_URL || '',
        customer: { email: req.member!.email },
      }),
    });
    const d = (await r.json()) as { data?: { link?: string } };
    if (d.data?.link) paymentUrl = d.data.link;
  }

  await knexInstance('subscription_payments').insert({
    user_id: userId,
    kind: 'UPGRADE',
    tier: 'Gold',
    amount,
    currency: 'NGN',
    gateway,
    gateway_ref: ref,
    status: 'pending',
  });

  res.json({ paymentUrl, reference: ref, amount });
}

// Internal helper used by webhooks
export async function completeSubscriptionPayment(ref: string, gateway: 'paystack' | 'flutterwave'): Promise<void> {
  const payment = await knexInstance('subscription_payments').where({ gateway_ref: ref, gateway }).first();
  if (!payment || (payment as { status: string }).status === 'completed') return;

  const userId = (payment as { user_id: string }).user_id;
  const kind = (payment as { kind: string }).kind;
  const tier = ((payment as { tier: string }).tier ?? 'Silver') as 'Silver' | 'Gold';

  await knexInstance.transaction(async (trx) => {
    const p = await trx('subscription_payments').where({ gateway_ref: ref }).first('status');
    if (!p || (p as { status: string }).status === 'completed') return;

    await trx('subscription_payments').where({ gateway_ref: ref }).update({ status: 'completed', completed_at: trx.fn.now() });

    if (kind === 'RENEWAL') {
      await completeRenewalPayment({ userId, tier, paymentRef: ref, trx });
    } else if (kind === 'UPGRADE') {
      await completeUpgradePayment({ userId, paymentRef: ref, trx });
    }
  });
}

