import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

const MIN_DIRECT_REFERRALS = 2;

export async function transferToMain(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const amount = Number((req.body as { amount?: number }).amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Amount must be a positive number' });
    return;
  }

  const hasWallets = await knexInstance.schema.hasTable('wallets');
  if (!hasWallets) {
    res.status(400).json({ error: 'Wallet not available' });
    return;
  }

  const user = await knexInstance('users').where({ id }).first('direct_referral_count');
  const count = Number((user as { direct_referral_count?: number } | undefined)?.direct_referral_count ?? 0);
  if (count < MIN_DIRECT_REFERRALS) {
    res.status(400).json({
      error: 'You need 2 direct referrals to unlock matrix earnings transfer',
      directReferralCount: count,
    });
    return;
  }

  const amountRounded = Math.round(amount * 100) / 100;

  try {
    await knexInstance.transaction(async (trx) => {
      const wallet = await trx('wallets').where({ user_id: id }).first('matrix_income');
      const matrixIncome = Number((wallet as { matrix_income: string } | undefined)?.matrix_income ?? 0);
      if (matrixIncome < amountRounded) {
        throw new Error('INSUFFICIENT_MATRIX');
      }
      await trx('wallets').where({ user_id: id }).decrement('matrix_income', amountRounded);
      await trx('wallets').where({ user_id: id }).increment('main_earnings', amountRounded);
      const bal = await trx('available_balance').where({ user_id: id }).first('id');
      if (bal) {
        await trx('available_balance').where({ user_id: id }).increment('balance', amountRounded);
      } else {
        await trx('available_balance').insert({ user_id: id, balance: amountRounded });
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'INSUFFICIENT_MATRIX') {
      res.status(400).json({ error: 'Insufficient matrix income balance' });
      return;
    }
    throw err;
  }

  res.status(200).json({
    message: 'Transfer to main completed',
    amount: amountRounded,
  });
}

export async function getGamePoints(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const hasWallets = await knexInstance.schema.hasTable('wallets');
  if (!hasWallets) {
    res.json({ gamePoints: 0 });
    return;
  }
  const row = await knexInstance('wallets').where({ user_id: id }).first('game_points');
  const gamePoints = Number((row as { game_points?: number } | undefined)?.game_points ?? 0);
  res.json({ gamePoints });
}
