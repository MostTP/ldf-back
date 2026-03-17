import { Router } from 'express';
import { z } from 'zod';
import { validateCoupon, initiateActivation, getActivationStatus } from '../../controllers/member/activation.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const validateCouponSchema = z.object({ code: z.string().min(1) });
const initiateSchema = z
  .object({
    package: z.enum(['Silver', 'Gold']).optional(),
    gateway: z.enum(['paystack', 'flutterwave']).optional(),
    couponCode: z.string().optional(),
  })
  .refine((data) => data.package != null || data.gateway != null, {
    message: 'Either package (Silver|Gold) or gateway (paystack|flutterwave) is required',
  });

router.post('/validate-coupon', authenticateMemberJWT, validate(validateCouponSchema), validateCoupon);
router.post('/initiate', authenticateMemberJWT, validate(initiateSchema), initiateActivation);
router.get('/status', authenticateMemberJWT, getActivationStatus);

export default router;
