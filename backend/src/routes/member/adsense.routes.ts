import { Router } from 'express';
import { z } from 'zod';
import { logAdsenseEvent } from '../../controllers/member/adsense.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const logSchema = z.object({
  eventType: z.string().min(1),
  payload: z.unknown().optional(),
  url: z.string().url().optional(),
});

router.post('/log', authenticateMemberJWT, validate(logSchema), logAdsenseEvent);

export default router;

