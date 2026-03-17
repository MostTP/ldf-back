/**
 * Paystack Transfer API (NGN). Wire PAYSTACK_SECRET_KEY and implement
 * https://paystack.com/docs/transfers/#initiate-transfer
 */
export interface TransferParams {
  amount: number; // in kobo (integer)
  bankCode: string;
  accountNumber: string;
  narration?: string;
}

export interface TransferResult {
  success: boolean;
  reference?: string;
}

export async function initiateTransfer(params: TransferParams): Promise<TransferResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.warn('[Paystack] PAYSTACK_SECRET_KEY not set; stubbing success');
    return { success: true, reference: `stub_${Date.now()}` };
  }
  const res = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(params.amount * 100), // naira to kobo
      recipient: params.bankCode + params.accountNumber, // or create recipient first
      reason: params.narration ?? 'LDF withdrawal',
    }),
  });
  const data = (await res.json()) as { status?: boolean; data?: { reference?: string }; message?: string };
  if (!data.status || !res.ok) {
    const err = new Error(data.message ?? 'Paystack transfer failed');
    (err as Error & { statusCode?: number }).statusCode = res.status;
    throw err;
  }
  return { success: true, reference: data.data?.reference };
}
