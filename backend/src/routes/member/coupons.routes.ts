import { Router } from 'express';
import { z } from 'zod';
import { generate, list, getStats } from '../../controllers/member/coupons.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { requireActivated } from '../../middleware/requireActivated.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const generateSchema = z.object({ quantity: z.number().int().min(1).max(50) });

router.post('/generate', authenticateMemberJWT, requireActivated, validate(generateSchema), generate);
router.get('/', authenticateMemberJWT, requireActivated, list);
router.get('/stats', authenticateMemberJWT, requireActivated, getStats);

export default router;
