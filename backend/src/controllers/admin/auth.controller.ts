import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { knexInstance } from '../../config/db.js';
import { env } from '../../config/env.js';
import { denyToken, isTokenDenied } from '../../config/redis.js';

const ADMIN_ROLES = ['SuperAdmin', 'FinanceManager', 'SupportAgent'];

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const user = await knexInstance('users')
    .where({ email: email.trim().toLowerCase() })
    .first('id', 'email', 'username', 'password_hash', 'role');

  if (
    !user ||
    !ADMIN_ROLES.includes(user.role) ||
    !(await bcrypt.compare(password, user.password_hash))
  ) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const accessJti = randomUUID();
  const refreshJti = randomUUID();
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: accessJti,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: refreshJti,
      type: 'refresh',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );

  await knexInstance('users').where({ id: user.id }).update({ last_login: knexInstance.fn.now() });

  res.status(200).json({
    accessToken,
    refreshToken,
    admin: { id: user.id, email: user.email, role: user.role },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body as { refreshToken: string };
  if (!token) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  let decoded: jwt.JwtPayload & { jti?: string; type?: string };
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & { jti?: string; type?: string };
  } catch {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  if (decoded.type !== 'refresh' || !decoded.jti) {
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
      role: decoded.role,
      jti: accessJti,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
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
