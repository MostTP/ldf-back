import type { Request, Response, NextFunction } from 'express';

export function requireActivated(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.member) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }
  if (req.member.status !== 'active') {
    res.status(403).json({ error: 'Account not activated' });
    return;
  }
  next();
}
