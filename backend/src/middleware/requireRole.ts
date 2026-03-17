import type { Request, Response, NextFunction } from 'express';

const ALLOWED_ROLES = ['SuperAdmin', 'FinanceManager', 'SupportAgent'] as const;
export type AdminRole = (typeof ALLOWED_ROLES)[number];

export function requireRole(...allowed: AdminRole[]) {
  const set = new Set(allowed);
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }
    if (!set.has(req.admin.role as AdminRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
