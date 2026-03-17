import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { isTokenDenied } from '../config/redis.js';

declare global {
  namespace Express {
    interface Request {
      member?: { id: string; email: string; username: string; isAgent: boolean; status: string };
    }
  }
}

interface MemberJwtPayload {
  sub: string;
  email: string;
  username: string;
  isAgent: boolean;
  status: string;
  type: 'member';
  jti?: string;
  exp?: number;
}

export async function authenticateMemberJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const token = authHeader.slice(7);
  let decoded: MemberJwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as MemberJwtPayload;
  } catch {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  if (decoded.type !== 'member') {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  if (decoded.jti) {
    const denied = await isTokenDenied(decoded.jti);
    if (denied) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }
  }

  if (decoded.status === 'suspended') {
    res.status(403).json({ error: 'Account suspended' });
    return;
  }

  req.member = {
    id: decoded.sub,
    email: decoded.email ?? '',
    username: decoded.username ?? '',
    isAgent: decoded.isAgent ?? false,
    status: decoded.status ?? 'pending',
  };
  next();
}
