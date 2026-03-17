import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';

export function adminSecurity(req: Request, res: Response, next: NextFunction): void {
  const whitelist = (env.ADMIN_IP_WHITELIST || '').trim();
  if (whitelist) {
    const allowed = whitelist.split(',').map((s) => s.trim()).filter(Boolean);
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    if (!allowed.includes(ip)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
  }

  const secret = (env as { ADMIN_HMAC_SECRET?: string }).ADMIN_HMAC_SECRET?.trim();
  if (secret) {
    const sig = req.headers['x-admin-signature'] as string;
    const body = typeof req.body === 'object' ? JSON.stringify(req.body) : (req.body && String(req.body)) || '';
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (!sig || sig !== expected) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }
  }

  next();
}
