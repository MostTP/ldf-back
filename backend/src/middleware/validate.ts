import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import { ZodError } from 'zod';

export function validate<T extends z.ZodTypeAny>(schema: T) {
  return function (req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const first = (parsed.error as ZodError).errors[0];
        const message = first?.message ?? 'Validation failed';
        res.status(400).json({ error: message, details: (parsed.error as ZodError).flatten() });
        return;
      }
      req.body = parsed.data;
      next();
    } catch {
      res.status(400).json({ error: 'Validation failed' });
    }
  };
}
