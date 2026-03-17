import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';
import { writeAuditLog } from '../../services/auditLog.service.js';

const DEFAULT_POINT_RATE = 1; // 1 point = ₦1

export async function convertGamePoints(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { points, rate } = req.body as { points?: number; rate?: number };
  const adminId = req.admin!.id;
  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  const user = await knexInstance('users').where({ id }).first('id');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const hasWallets = await knexInstance.schema.hasTable('wallets');
  if (!hasWallets) {
    res.status(400).json({ error: 'Wallet not available for user' });
    return;
  }

  const result = await knexInstance.transaction(async (trx) => {
    const walletRow = await trx('wallets').where({ user_id: id }).forUpdate().first('game_points');
    const currentPoints = Number((walletRow as { game_points?: number } | undefined)?.game_points ?? 0);
    if (currentPoints <= 0) {
      throw new Error('NO_POINTS');
    }

    const toConvert = points != null ? Math.min(currentPoints, Math.max(0, Math.floor(points))) : currentPoints;
    if (toConvert <= 0) {
      throw new Error('INVALID_POINTS');
    }

    const effectiveRate = rate != null && rate > 0 ? rate : DEFAULT_POINT_RATE;
    const amount = Math.round(toConvert * effectiveRate * 100) / 100;

    await trx('wallets')
      .where({ user_id: id })
      .update({ game_points: currentPoints - toConvert });

    const balanceRow = await trx('available_balance').where({ user_id: id }).first('id');
    if (balanceRow) {
      await trx('available_balance').where({ user_id: id }).increment('balance', amount);
    } else {
      await trx('available_balance').insert({ user_id: id, balance: amount });
    }

    const [ledger] = await trx('earnings_ledger')
      .insert({
        user_id: id,
        type: 'ADJUSTMENT',
        amount,
        description: `Converted ${toConvert} game points to balance at rate ${effectiveRate}`,
      })
      .returning('id');

    await writeAuditLog(
      {
        adminId,
        actionType: 'CONVERT_GAME_POINTS',
        targetEntity: 'users',
        targetId: id,
        payloadSnapshot: { points: toConvert, rate: effectiveRate, amount },
        ipAddress,
      },
      trx
    );

    return {
      convertedPoints: toConvert,
      amount,
      ledgerEntryId: (ledger as { id: string }).id,
    };
  });

  res.status(200).json({
    message: 'Game points converted',
    ...result,
  });
}

