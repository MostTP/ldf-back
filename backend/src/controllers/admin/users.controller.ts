import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';
import { writeAuditLog } from '../../services/auditLog.service.js';

const USER_SELECT = [
  'id',
  'email',
  'username',
  'role',
  'is_agent',
  'commission_rate',
  'status',
  'created_at',
  'last_login',
];

export async function search(req: Request, res: Response): Promise<void> {
  const query = String(req.query.query ?? '').trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const role = req.query.role as string | undefined;
  const status = req.query.status as string | undefined;

  let qb = knexInstance('users').select(USER_SELECT);

  if (query) {
    qb = qb.where((builder) => {
      builder
        .whereRaw('LOWER(email) LIKE ?', [`%${query.toLowerCase()}%`])
        .orWhereRaw('LOWER(username) LIKE ?', [`%${query.toLowerCase()}%`]);
    });
  }
  if (role) qb = qb.where({ role });
  if (status) qb = qb.where({ status });

  const total = await qb.clone().count('id as count').first();
  const data = await qb
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  res.json({
    data,
    total: Number(total?.count ?? 0),
    page,
    limit,
  });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const user = await knexInstance('users').select(USER_SELECT).where({ id }).first();
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const [matrixLevelRow, totalEarningsRow] = await Promise.all([
    knexInstance('matrix_nodes').where({ user_id: id }).max('level as max_level').first(),
    knexInstance('earnings_ledger').where({ user_id: id }).sum('amount as total').first(),
  ]);

  const matrixLevel = matrixLevelRow?.max_level != null ? Number(matrixLevelRow.max_level) : null;
  const totalEarnings = Number(totalEarningsRow?.total ?? 0);
  const kycStatus = 'pending'; // Placeholder until KYC table exists

  res.json({
    ...user,
    matrixLevel,
    totalEarnings,
    kycStatus,
  });
}

export async function getLedger(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const type = req.query.type as string | undefined;

  const user = await knexInstance('users').where({ id }).first('id');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  let qb = knexInstance('earnings_ledger').where({ user_id: id });
  if (type) qb = qb.where({ type });

  const total = await qb.clone().count('id as count').first();
  const data = await qb
    .select('id', 'type', 'amount', 'source_user_id', 'level', 'reference_id', 'description', 'created_at')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  res.json({
    data,
    total: Number(total?.count ?? 0),
    page,
    limit,
  });
}

export async function ledgerAdjustment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { type, amount, reason } = req.body as { type: 'credit' | 'debit'; amount: number; reason: string };
  const adminId = req.admin!.id;
  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  const user = await knexInstance('users').where({ id }).first('id');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const signedAmount = type === 'credit' ? Number(amount) : -Number(amount);

  const ledgerEntryId = await knexInstance.transaction(async (trx) => {
    const [row] = await trx('earnings_ledger')
      .insert({
        user_id: id,
        type: 'ADJUSTMENT',
        amount: signedAmount,
        description: reason,
      })
      .returning('id');
    await writeAuditLog(
      {
        adminId,
        actionType: 'ADJUST_LEDGER',
        targetEntity: 'users',
        targetId: id,
        payloadSnapshot: { type, amount, reason },
        ipAddress,
      },
      trx
    );
    return (row as { id: string }).id;
  });

  res.status(201).json({ message: 'Adjustment applied', ledgerEntryId });
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, reason } = req.body as { status: 'active' | 'suspended'; reason: string };
  const adminId = req.admin!.id;
  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  const user = await knexInstance('users').where({ id }).first('id');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await knexInstance.transaction(async (trx) => {
    await trx('users').where({ id }).update({ status });
    if (status === 'suspended') {
      await trx('matrix_nodes').where({ user_id: id }).update({ status: 'frozen' });
    }
    await writeAuditLog(
      {
        adminId,
        actionType: 'UPDATE_USER_STATUS',
        targetEntity: 'users',
        targetId: id,
        payloadSnapshot: { status, reason },
        ipAddress,
      },
      trx
    );
    await trx('notifications').insert({
      user_id: id,
      type: 'STATUS_CHANGE',
      message: reason,
      payload: { status },
    });
  });

  res.status(200).json({ message: 'Status updated' });
}

export async function updateAgentStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { isAgent, commissionRate } = req.body as { isAgent: boolean; commissionRate?: number };
  const adminId = req.admin!.id;
  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  const user = await knexInstance('users').where({ id }).first('id');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await knexInstance.transaction(async (trx) => {
    const updatePayload: { is_agent: boolean; commission_rate?: number } = { is_agent: isAgent };
    if (commissionRate !== undefined) updatePayload.commission_rate = commissionRate;
    await trx('users').where({ id }).update(updatePayload);
    await writeAuditLog(
      {
        adminId,
        actionType: 'UPDATE_AGENT_STATUS',
        targetEntity: 'users',
        targetId: id,
        payloadSnapshot: { isAgent, commissionRate },
        ipAddress,
      },
      trx
    );
  });

  res.status(200).json({ message: 'Agent status updated' });
}
