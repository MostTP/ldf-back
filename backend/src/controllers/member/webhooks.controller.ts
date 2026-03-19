import type { Request, Response } from 'express';
import crypto from 'crypto';
import { knexInstance } from '../../config/db.js';
import { completeActivation } from '../../services/activation.service.js';
import { insertNotification } from '../../services/notification.service.js';
import { completeSubscriptionPayment } from './subscription.controller.js';
import { completeAgentCouponCreditPayment } from '../../services/agentCouponCredits.service.js';

function verifyPaystackSignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
  return hash === signature;
}

export async function paystackWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    res.status(200).send();
    return;
  }
  const signature = req.headers['x-paystack-signature'] as string;
  if (!signature) {
    res.status(400).send();
    return;
  }
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody || !verifyPaystackSignature(rawBody.toString(), signature, secret)) {
    res.status(400).send();
    return;
  }

  const event = req.body?.event as string;
  const data = req.body?.data as Record<string, unknown> | undefined;

  try {
    if (event === 'charge.success' && data?.reference) {
      const ref = data.reference as string;
      const payment = await knexInstance('activation_payments').where({ gateway_ref: ref, gateway: 'paystack' }).first();
      if (payment && (payment as { status: string }).status !== 'completed') {
        const userId = (payment as { user_id: string }).user_id;
        try {
          await knexInstance.transaction(async (trx) => {
            await completeActivation(userId, ref, trx);
          });
        } catch (err) {
          if ((err as Error).message?.includes('duplicate') || (err as Error).message?.includes('unique')) {
            // Idempotent: already processed
          } else {
            console.error('[Webhook] Activation failed:', err);
          }
        }
      }

      // Subscription renewals/upgrades
      await completeSubscriptionPayment(ref, 'paystack');

      // Agent coupon credit purchases
      await knexInstance.transaction(async (trx) => {
        await completeAgentCouponCreditPayment(ref, 'paystack', trx);
      });
    }

    if (event === 'transfer.success' && data?.reference) {
      const ref = data.reference as string;
      const wr = await knexInstance('withdrawal_requests').where({ gateway_ref: ref, status: 'processing' }).first();
      if (wr) {
        const userId = (wr as { user_id: string }).user_id;
        const amount = Number((wr as { amount: string }).amount);
        await knexInstance.transaction(async (trx) => {
          await trx('withdrawal_requests').where({ id: wr.id }).update({ status: 'completed', processed_at: trx.fn.now() });
          await trx('available_balance').where({ user_id: userId }).decrement('balance', amount);
          await insertNotification(userId, 'WITHDRAWAL_COMPLETED', 'Withdrawal completed', 'Your withdrawal has been processed.', { amount }, trx);
        });
      }
    }

    if (event === 'transfer.failed' && data?.reference) {
      const ref = data.reference as string;
      await knexInstance('withdrawal_requests').where({ gateway_ref: ref }).update({ status: 'pending' });
      const wr = await knexInstance('withdrawal_requests').where({ gateway_ref: ref }).first('user_id', 'amount');
      if (wr) {
        await knexInstance.transaction(async (trx) => {
          await insertNotification(
            (wr as { user_id: string }).user_id,
            'WITHDRAWAL_FAILED',
            'Withdrawal failed',
            'Your withdrawal could not be completed. It has been set back to pending.',
            {},
            trx
          );
        });
      }
    }
  } catch (err) {
    console.error('[Webhook] Paystack:', err);
  }
  res.status(200).send();
}

export async function flutterwaveWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!secret) {
    res.status(200).send();
    return;
  }
  const hash = req.headers['verif-hash'] as string;
  if (hash !== secret) {
    res.status(400).send();
    return;
  }

  const event = req.body?.event as string;
  const data = req.body?.data as Record<string, unknown> | undefined;

  try {
    if (event === 'charge.completed' && data?.flw_ref) {
      const ref = (data.flw_ref ?? data.tx_ref) as string;
      const payment = await knexInstance('activation_payments').where({ gateway_ref: ref, gateway: 'flutterwave' }).first();
      if (payment && (payment as { status: string }).status !== 'completed') {
        const userId = (payment as { user_id: string }).user_id;
        try {
          await knexInstance.transaction(async (trx) => {
            await completeActivation(userId, ref, trx);
          });
        } catch (err) {
          if ((err as Error).message?.includes('duplicate') || (err as Error).message?.includes('unique')) {
          } else {
            console.error('[Webhook] Flutterwave activation failed:', err);
          }
        }
      }

      // Subscription renewals/upgrades
      await completeSubscriptionPayment(ref, 'flutterwave');

      // Agent coupon credit purchases
      await knexInstance.transaction(async (trx) => {
        await completeAgentCouponCreditPayment(ref, 'flutterwave', trx);
      });
    }

    if (event === 'transfer.completed' && data?.reference) {
      const ref = data.reference as string;
      const wr = await knexInstance('withdrawal_requests').where({ gateway_ref: ref, status: 'processing' }).first();
      if (wr) {
        const userId = (wr as { user_id: string }).user_id;
        const amount = Number((wr as { amount: string }).amount);
        await knexInstance.transaction(async (trx) => {
          await trx('withdrawal_requests').where({ id: wr.id }).update({ status: 'completed', processed_at: trx.fn.now() });
          await trx('available_balance').where({ user_id: userId }).decrement('balance', amount);
          await insertNotification(userId, 'WITHDRAWAL_COMPLETED', 'Withdrawal completed', 'Your withdrawal has been processed.', { amount }, trx);
        });
      }
    }

    if (event === 'transfer.failed' && data?.reference) {
      const ref = data.reference as string;
      await knexInstance('withdrawal_requests').where({ gateway_ref: ref }).update({ status: 'pending' });
      const wr = await knexInstance('withdrawal_requests').where({ gateway_ref: ref }).first('user_id');
      if (wr) {
        await knexInstance.transaction(async (trx) => {
          await insertNotification(
            (wr as { user_id: string }).user_id,
            'WITHDRAWAL_FAILED',
            'Withdrawal failed',
            'Your withdrawal could not be completed. It has been set back to pending.',
            {},
            trx
          );
        });
      }
    }
  } catch (err) {
    console.error('[Webhook] Flutterwave:', err);
  }
  res.status(200).send();
}
