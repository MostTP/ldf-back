import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { isTokenDenied } from '../config/redis.js';

const ADMIN_ROLES = ['SuperAdmin', 'FinanceManager', 'SupportAgent'] as const;

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; role: string; email: string };
    }
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string;
  exp?: number;
}

export async function authenticateJWT(
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
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const role = decoded.role;
  if (!role || !ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const jti = decoded.jti;
  if (jti) {
    const denied = await isTokenDenied(jti);
    if (denied) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }
  }

  req.admin = {
    id: decoded.sub,
    email: decoded.email ?? '',
    role: decoded.role,
  };
  next();
}
