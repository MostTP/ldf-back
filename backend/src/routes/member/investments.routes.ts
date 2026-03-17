import { Router } from 'express';
import { z } from 'zod';
import { submit, list } from '../../controllers/member/investments.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { requireActivated } from '../../middleware/requireActivated.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const submitSchema = z.object({
  amount: z.number().positive().min(10000, 'Minimum investment is ₦10,000'),
  lockMonths: z.number().int().min(3).max(24),
});

router.post('/', authenticateMemberJWT, requireActivated, validate(submitSchema), submit);
router.get('/', authenticateMemberJWT, requireActivated, list);

export default router;
