import { Router } from 'express';
import { z } from 'zod';
import { submit, list, getOne } from '../../controllers/member/withdrawals.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { requireActivated } from '../../middleware/requireActivated.js';
import { validate } from '../../middleware/validate.js';
import { withdrawalLimiter } from '../../middleware/rateLimiter.js';

const router = Router();
const WITHDRAWAL_MIN = 5000;
const WITHDRAWAL_MAX = 5_000_000;

const submitSchema = z.object({
  amount: z.number().positive().min(WITHDRAWAL_MIN, `Minimum withdrawal is ₦${WITHDRAWAL_MIN.toLocaleString()}`).max(WITHDRAWAL_MAX, `Maximum withdrawal is ₦${WITHDRAWAL_MAX.toLocaleString()}`),
  currency: z.enum(['NGN', 'GHS', 'KES', 'ZAR']),
  bankCode: z.string().min(1),
  accountNumber: z.string().min(1),
});

router.post('/', authenticateMemberJWT, requireActivated, withdrawalLimiter, validate(submitSchema), submit);
router.get('/', authenticateMemberJWT, requireActivated, list);
router.get('/:id', authenticateMemberJWT, requireActivated, getOne);

export default router;
