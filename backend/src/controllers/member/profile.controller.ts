import type { Request, Response } from 'express';
import crypto from 'crypto';
import { knexInstance } from '../../config/db.js';
import { saveKycDocument, getAllowedTypes, getMaxFileSize } from '../../config/storage.js';

const USER_SELECT = ['id', 'email', 'username', 'full_name', 'phone', 'role', 'is_agent', 'status', 'created_at'];

export async function getProfile(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;

  const userSelect = [...USER_SELECT];
  const hasCredits = await knexInstance.schema.hasColumn('users', 'agent_coupon_credits');
  if (hasCredits) userSelect.push('agent_coupon_credits');
  const hasPackageType = await knexInstance.schema.hasColumn('users', 'package_type');
  if (hasPackageType) userSelect.push('package_type');
  const hasDirectRefCount = await knexInstance.schema.hasColumn('users', 'direct_referral_count');
  if (hasDirectRefCount) userSelect.push('direct_referral_count');

  const user = await knexInstance('users').select(userSelect).where({ id }).first();
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const hasWallets = await knexInstance.schema.hasTable('wallets');
  const [profile, balanceRow, matrixRow, walletRow] = await Promise.all([
    knexInstance('member_profiles').where({ user_id: id }).first(),
    knexInstance('available_balance').where({ user_id: id }).first('balance'),
    knexInstance('matrix_nodes').where({ user_id: id }).max('level as matrix_level').first(),
    hasWallets ? knexInstance('wallets').where({ user_id: id }).first('detty_december', 'game_points') : Promise.resolve(null),
  ]);

  const availableBalance = balanceRow ? Number((balanceRow as { balance: string }).balance) : 0;
  const matrixLevel = matrixRow?.matrix_level != null ? Number((matrixRow as { matrix_level: string }).matrix_level) : null;
  const agentCouponCredits = hasCredits && user && 'agent_coupon_credits' in user ? Number((user as { agent_coupon_credits?: number }).agent_coupon_credits ?? 0) : 0;
  const directReferralCount = hasDirectRefCount && user && 'direct_referral_count' in user ? Number((user as { direct_referral_count?: number }).direct_referral_count ?? 0) : 0;
  const dettyDecember = hasWallets && walletRow ? Number((walletRow as { detty_december?: string }).detty_december ?? 0) : 0;
  const gamePoints = hasWallets && walletRow ? Number((walletRow as { game_points?: number }).game_points ?? 0) : 0;

  const out: Record<string, unknown> = {
    ...user,
    isAgent: !!(user as { is_agent?: boolean }).is_agent,
    profile: profile ?? null,
    availableBalance,
    matrixLevel,
    directReferralCount,
    dettyDecember,
    gamePoints,
  };
  if (hasCredits) out.agentCouponCredits = agentCouponCredits;

  res.json(out);
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const body = req.body as Record<string, unknown>;

  const userUpdates: Record<string, unknown> = {};
  if (body.fullName !== undefined) userUpdates.full_name = body.fullName;
  if (body.phone !== undefined) userUpdates.phone = body.phone;

  const profileUpdates: Record<string, unknown> = {};
  if (body.country !== undefined) profileUpdates.country = body.country;
  if (body.bankName !== undefined) profileUpdates.bank_name = body.bankName;
  if (body.bankCode !== undefined) profileUpdates.bank_code = body.bankCode;
  if (body.accountNumber !== undefined) profileUpdates.account_number = body.accountNumber;
  if (body.accountName !== undefined) profileUpdates.account_name = body.accountName;
  if (body.currency !== undefined) profileUpdates.currency = body.currency;

  if (Object.keys(userUpdates).length > 0) {
    await knexInstance('users').where({ id }).update(userUpdates);
  }
  if (Object.keys(profileUpdates).length > 0) {
    profileUpdates.updated_at = knexInstance.fn.now();
    const existing = await knexInstance('member_profiles').where({ user_id: id }).first();
    if (existing) {
      await knexInstance('member_profiles').where({ user_id: id }).update(profileUpdates);
    } else {
      await knexInstance('member_profiles').insert({ user_id: id, ...profileUpdates });
    }
  }

  const user = await knexInstance('users').select(USER_SELECT).where({ id }).first();
  const profile = await knexInstance('member_profiles').where({ user_id: id }).first();
  const balanceRow = await knexInstance('available_balance').where({ user_id: id }).first('balance');
  const matrixRow = await knexInstance('matrix_nodes').where({ user_id: id }).max('level as matrix_level').first();

  res.json({
    ...user,
    profile: profile ?? null,
    availableBalance: balanceRow ? Number(balanceRow.balance) : 0,
    matrixLevel: matrixRow?.matrix_level != null ? Number(matrixRow.matrix_level) : null,
  });
}

export async function uploadKyc(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const file = (req as Request & { file?: { buffer: Buffer; mimetype: string } }).file;
  if (!file || !file.buffer) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const allowed = getAllowedTypes();
  if (!allowed.includes(file.mimetype)) {
    res.status(400).json({ error: 'Invalid file type. Use JPEG, PNG, or PDF.' });
    return;
  }
  if (file.buffer.length > getMaxFileSize()) {
    res.status(400).json({ error: 'File too large. Max 5MB.' });
    return;
  }
  const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const { url } = await saveKycDocument(file.buffer, id, file.mimetype);

  const existing = await knexInstance('member_profiles').where({ user_id: id }).first();
  if (existing) {
    await knexInstance('member_profiles').where({ user_id: id }).update({
      kyc_doc_url: url,
      kyc_doc_hash: hash,
      kyc_status: 'pending',
      updated_at: knexInstance.fn.now(),
    });
  } else {
    await knexInstance('member_profiles').insert({
      user_id: id,
      kyc_doc_url: url,
      kyc_doc_hash: hash,
      kyc_status: 'pending',
    });
  }

  res.json({
    message: 'KYC document uploaded. Pending review.',
    kycStatus: 'pending',
  });
}

/** List users who signed up with this member's referral link (referred_by = me). */
export async function getReferrals(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const rows = await knexInstance('users')
    .where({ referred_by: id })
    .select('id', 'username', 'full_name', 'email', 'phone', 'status', 'created_at')
    .orderBy('created_at', 'asc');
  if (rows.length === 0) {
    res.json({ data: [] });
    return;
  }
  const userIds = rows.map((r: { id: string }) => r.id);
  const [levelRows, downlineRows] = await Promise.all([
    knexInstance('matrix_nodes').whereIn('user_id', userIds).where({ status: 'active' }).select('user_id', 'level'),
    knexInstance('matrix_nodes').whereIn('parent_id', userIds).where({ status: 'active' }).select('parent_id').count('id as count').groupBy('parent_id'),
  ]);
  const levelByUser = new Map((levelRows as { user_id: string; level: number }[]).map((x) => [x.user_id, x.level]));
  const downlineByUser = new Map((downlineRows as { parent_id: string; count: string }[]).map((x) => [x.parent_id, Number(x.count)]));
  const data = rows.map((r: { id: string; username: string; full_name: string | null; email: string; phone: string | null; status: string; created_at: string }, index: number) => ({
    id: r.id,
    username: r.username,
    name: r.full_name ?? r.username,
    email: r.email,
    phone: r.phone ?? '',
    accountStatus: r.status === 'active' ? 'Active' : r.status === 'suspended' ? 'Suspended' : 'Pending',
    joinedDate: r.created_at,
    positionInReferrals: index + 1,
    matrixLevel: levelByUser.get(r.id) ?? null,
    directDownlines: downlineByUser.get(r.id) ?? 0,
  }));
  res.json({ data });
}
