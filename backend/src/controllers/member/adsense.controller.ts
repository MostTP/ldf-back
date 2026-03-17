import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

export async function logAdsenseEvent(req: Request, res: Response): Promise<void> {
  const { eventType, payload, url } = req.body as {
    eventType?: string;
    payload?: unknown;
    url?: string;
  };

  if (!eventType || typeof eventType !== 'string') {
    res.status(400).json({ error: 'eventType is required' });
    return;
  }

  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  await knexInstance('adsense_events').insert({
    event_type: eventType,
    payload: payload ?? {},
    url: url ?? null,
    ip_address: ipAddress ?? null,
  });

  res.status(201).json({ success: true });
}

