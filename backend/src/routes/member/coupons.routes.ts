import { Router } from 'express';
import { z } from 'zod';
import { generate, list, getStats, initiateCouponCreditsPurchase } from '../../controllers/member/coupons.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { requireActivated } from '../../middleware/requireActivated.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const generateSchema = z.object({
  quantity: z.number().int().min(1).max(50),
  packageType: z.enum(['Silver', 'Gold']).optional(),
});

router.post('/generate', authenticateMemberJWT, requireActivated, validate(generateSchema), generate);
const creditsPurchaseSchema = z.object({
  packageType: z.enum(['Silver', 'Gold']),
  quantity: z.number().int().min(1).max(1000),
  gateway: z.enum(['paystack', 'flutterwave']).optional(),
});
router.post(
  '/credits/purchase',
  authenticateMemberJWT,
  requireActivated,
  validate(creditsPurchaseSchema),
  initiateCouponCreditsPurchase
);
router.get('/', authenticateMemberJWT, requireActivated, list);
router.get('/stats', authenticateMemberJWT, requireActivated, getStats);

export default router;
