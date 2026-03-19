import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto, { randomUUID } from 'crypto';
import { knexInstance } from '../../config/db.js';
import { env } from '../../config/env.js';
import { denyToken, isTokenDenied, setPasswordResetToken, getPasswordResetToken, deletePasswordResetToken } from '../../config/redis.js';
import { coreActivation } from '../../services/activation.service.js';

export async function register(req: Request, res: Response): Promise<void> {
  const { fullName, email, username, password, phone, referredBy, couponCode } = req.body as {
    fullName: string;
    email: string;
    username: string;
    password: string;
    phone?: string;
    referredBy?: string;
    couponCode?: string;
  };

  const emailNorm = email.trim().toLowerCase();
  const existingEmail = await knexInstance('users').whereRaw('LOWER(email) = ?', [emailNorm]).first('id');
  if (existingEmail) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const existingUsername = await knexInstance('users').whereRaw('LOWER(username) = ?', [username.trim().toLowerCase()]).first('id');
  if (existingUsername) {
    res.status(409).json({ error: 'Username taken' });
    return;
  }

  let resolvedReferrerId: string | null = null;
  if (referredBy && String(referredBy).trim()) {
    const ref = String(referredBy).trim();
    const isUuid = /^[0-9a-f-]{36}$/i.test(ref);
    const referrer = isUuid
      ? await knexInstance('users').where({ id: ref, role: 'Member', status: 'active' }).first('id')
      : await knexInstance('users').whereRaw('LOWER(username) = ?', [ref.toLowerCase()]).where({ role: 'Member', status: 'active' }).first('id');
    if (!referrer) {
      res.status(400).json({ error: 'Invalid referral' });
      return;
    }
    resolvedReferrerId = (referrer as { id: string }).id;
  }

  const couponNorm = couponCode?.trim().toUpperCase();
  if (!couponNorm) {
    res.status(400).json({ error: 'Activation coupon is required' });
    return;
  }
  const hasPackageTypeCol = await knexInstance.schema.hasColumn('coupons', 'package_type');
  const couponSelect = hasPackageTypeCol ? ['id', 'used_by', 'package_type'] : ['id', 'used_by'];
  const coupon = await knexInstance('coupons').where('code', couponNorm).first(couponSelect);
  if (!coupon) {
    res.status(400).json({ error: 'Invalid coupon code' });
    return;
  }
  if ((coupon as { used_by: string | null }).used_by) {
    res.status(409).json({ error: 'Coupon already used' });
    return;
  }
  const pkg = hasPackageTypeCol && (coupon as { package_type?: string }).package_type;
  const packageType: 'Silver' | 'Gold' = pkg === 'Gold' || pkg === 'Silver' ? pkg : 'Silver';

  if (!resolvedReferrerId) {
    res.status(400).json({ error: 'Referral (sponsor) is required' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const couponId = (coupon as { id: string }).id;

  let userId: string;
  try {
    userId = await knexInstance.transaction(async (trx) => {
      const [u] = await trx('users')
        .insert({
          email: emailNorm,
          username: username.trim(),
          password_hash,
          full_name: fullName?.trim() ?? null,
          phone: phone?.trim() ? phone.trim().slice(0, 30) : null,
          role: 'Member',
          status: 'pending',
          referred_by: resolvedReferrerId,
          activation_coupon: couponNorm,
        })
        .returning('id');
      const newUserId = (u as { id: string }).id;
      await trx('available_balance').insert({ user_id: newUserId, balance: 0 });
      if (await trx.schema.hasTable('wallets')) {
        await trx('wallets').insert({ user_id: newUserId });
      }
      await coreActivation(
        { userId: newUserId, sponsorId: resolvedReferrerId, couponId, packageType },
        trx
      );
      return newUserId;
    });
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? '';
    if (msg.includes('Sponsor matrix is full')) {
      res.status(400).json({ error: 'This sponsor\'s matrix is full. Please use another referral code.' });
      return;
    }
    throw err;
  }

  const newUser = await knexInstance('users')
    .where({ id: userId })
    .first('id', 'email', 'username', 'is_agent', 'status');
  if (!newUser) {
    res.status(201).json({ message: 'Registration successful. Your account is active.', userId });
    return;
  }
  const accessJti = randomUUID();
  const refreshJti = randomUUID();
  const accessToken = jwt.sign(
    {
      sub: newUser.id,
      email: newUser.email,
      username: newUser.username,
      isAgent: !!(newUser as { is_agent?: boolean }).is_agent,
      status: (newUser as { status: string }).status,
      type: 'member',
      jti: accessJti,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions
  );
  const refreshToken = jwt.sign(
    {
      sub: newUser.id,
      email: newUser.email,
      username: newUser.username,
      isAgent: !!(newUser as { is_agent?: boolean }).is_agent,
      status: (newUser as { status: string }).status,
      type: 'member',
      jti: refreshJti,
      kind: 'refresh',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions
  );
  res.status(201).json({
    message: 'Registration successful. Your account is active.',
    userId,
    accessToken,
    refreshToken,
    member: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      isAgent: !!(newUser as { is_agent?: boolean }).is_agent,
      status: (newUser as { status: string }).status,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const user = await knexInstance('users')
    .whereRaw('LOWER(email) = ?', [email.trim().toLowerCase()])
    .where({ role: 'Member' })
    .first('id', 'email', 'username', 'password_hash', 'is_agent', 'status');

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'Account suspended. Contact support.' });
    return;
  }

  await knexInstance('users').where({ id: user.id }).update({ last_login: knexInstance.fn.now() });

  const accessJti = randomUUID();
  const refreshJti = randomUUID();
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
      isAgent: !!user.is_agent,
      status: user.status,
      type: 'member',
      jti: accessJti,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions
  );
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
      isAgent: !!user.is_agent,
      status: user.status,
      type: 'member',
      jti: refreshJti,
      kind: 'refresh',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions
  );

  res.status(200).json({
    accessToken,
    refreshToken,
    member: {
      id: user.id,
      email: user.email,
      username: user.username,
      isAgent: !!user.is_agent,
      status: user.status,
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body as { refreshToken: string };
  if (!token) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  let decoded: jwt.JwtPayload & { jti?: string; kind?: string; type?: string };
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & { jti?: string; kind?: string; type?: string };
  } catch {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  if (decoded.kind !== 'refresh' || decoded.type !== 'member' || !decoded.jti) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  if (await isTokenDenied(decoded.jti)) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const accessJti = randomUUID();
  const accessToken = jwt.sign(
    {
      sub: decoded.sub,
      email: decoded.email,
      username: decoded.username,
      isAgent: decoded.isAgent,
      status: decoded.status,
      type: 'member',
      jti: accessJti,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions
  );

  res.status(200).json({ accessToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.decode(token) as { jti?: string; exp?: number } | null;
      if (decoded?.jti != null && decoded.exp != null) {
        const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
        await denyToken(decoded.jti, ttl);
      }
    } catch {
      // ignore
    }
  }
  const refreshToken = (req.body as { refreshToken?: string }).refreshToken;
  if (refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken) as { jti?: string; exp?: number } | null;
      if (decoded?.jti != null && decoded.exp != null) {
        const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
        await denyToken(decoded.jti, ttl);
      }
    } catch {
      // ignore
    }
  }
  res.status(204).send();
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  const emailNorm = email?.trim().toLowerCase();
  const user = emailNorm
    ? await knexInstance('users').whereRaw('LOWER(email) = ?', [emailNorm]).where({ role: 'Member' }).first('id')
    : null;
  if (user) {
    const token = jwt.sign(
      { sub: (user as { id: string }).id, type: 'pwd-reset' },
      env.JWT_SECRET,
      { expiresIn: '15m' } as jwt.SignOptions
    );
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await setPasswordResetToken((user as { id: string }).id, tokenHash, 15 * 60);
    const resetLink = process.env.MEMBER_RESET_PASSWORD_URL
      ? `${process.env.MEMBER_RESET_PASSWORD_URL}?token=${token}`
      : `https://app.example.com/reset-password?token=${token}`;
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Auth] Password reset link for', emailNorm, ':', resetLink);
    }
  }
  res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  if (!token?.trim() || !newPassword?.trim()) {
    res.status(400).json({ error: 'Token and new password are required' });
    return;
  }
  let decoded: jwt.JwtPayload & { sub?: string; type?: string };
  try {
    decoded = jwt.verify(token.trim(), env.JWT_SECRET) as jwt.JwtPayload & { sub?: string; type?: string };
  } catch {
    res.status(400).json({ error: 'Invalid or expired token' });
    return;
  }
  if (decoded.type !== 'pwd-reset' || !decoded.sub) {
    res.status(400).json({ error: 'Invalid token' });
    return;
  }
  const userId = decoded.sub;
  const storedHash = await getPasswordResetToken(userId);
  const incomingHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  if (!storedHash || storedHash !== incomingHash) {
    res.status(400).json({ error: 'Token already used or expired' });
    return;
  }
  const password_hash = await bcrypt.hash(newPassword, 12);
  await knexInstance('users').where({ id: userId }).update({ password_hash });
  await deletePasswordResetToken(userId);
  res.status(200).json({ message: 'Password reset successful' });
}
