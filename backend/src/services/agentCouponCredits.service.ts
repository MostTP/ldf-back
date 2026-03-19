import type { Knex } from 'knex';

export type CouponCreditGateway = 'paystack' | 'flutterwave';
export type CouponCreditPackage = 'Silver' | 'Gold';

export async function completeAgentCouponCreditPayment(
  gatewayRef: string,
  gateway: CouponCreditGateway,
  trx: Knex.Transaction
): Promise<void> {
  const payment = await trx('agent_coupon_credit_payments')
    .where({ gateway_ref: gatewayRef, gateway })
    .first('id', 'agent_id', 'package_type', 'quantity', 'status');

  if (!payment) return;
  if ((payment as { status: string }).status === 'completed') return;

  const agentId = (payment as { agent_id: string }).agent_id;
  const packageType = (payment as { package_type: CouponCreditPackage }).package_type;
  const quantity = Number((payment as { quantity: number | string }).quantity);

  if (!agentId || !packageType || !Number.isFinite(quantity) || quantity <= 0) return;

  await trx('agent_coupon_credit_payments')
    .where({ id: (payment as { id: string }).id })
    .update({ status: 'completed', completed_at: trx.fn.now() });

  const hasSilver = await trx.schema.hasColumn('users', 'agent_coupon_credits_silver');
  const hasGold = await trx.schema.hasColumn('users', 'agent_coupon_credits_gold');
  const hasLegacy = await trx.schema.hasColumn('users', 'agent_coupon_credits');

  let creditColumn: string | null = null;
  if (packageType === 'Gold') {
    creditColumn = hasGold ? 'agent_coupon_credits_gold' : hasLegacy ? 'agent_coupon_credits' : null;
  } else {
    creditColumn = hasSilver ? 'agent_coupon_credits_silver' : hasLegacy ? 'agent_coupon_credits' : null;
  }

  if (!creditColumn) return;

  await trx('users').where({ id: agentId }).increment(creditColumn, quantity);
}

