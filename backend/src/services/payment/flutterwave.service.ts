/**
 * Flutterwave Transfer API (GHS, KES, ZAR). Wire FLUTTERWAVE_SECRET_KEY and implement
 * https://developer.flutterwave.com/docs/collect/transfers
 */
export interface TransferParams {
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  narration?: string;
}

export interface TransferResult {
  success: boolean;
  reference?: string;
}

export async function initiateTransfer(params: TransferParams): Promise<TransferResult> {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) {
    console.warn('[Flutterwave] FLUTTERWAVE_SECRET_KEY not set; stubbing success');
    return { success: true, reference: `stub_${Date.now()}` };
  }
  const res = await fetch('https://api.flutterwave.com/v3/transfers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      narration: params.narration ?? 'LDF withdrawal',
      bank_code: params.bankCode,
      account_number: params.accountNumber,
    }),
  });
  const data = (await res.json()) as { status?: string; data?: { reference?: string }; message?: string };
  if (data.status !== 'success' || !res.ok) {
    const err = new Error(data.message ?? 'Flutterwave transfer failed');
    (err as Error & { statusCode?: number }).statusCode = res.status;
    throw err;
  }
  return { success: true, reference: data.data?.reference };
}
