import { Router } from 'express';
import { z } from 'zod';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { requireActivated } from '../../middleware/requireActivated.js';
import { validate } from '../../middleware/validate.js';
import { initiateRenewal, initiateUpgrade } from '../../controllers/member/subscription.controller.js';

const router = Router();

const renewSchema = z.object({
  tier: z.enum(['Silver', 'Gold']),
  gateway: z.enum(['paystack', 'flutterwave']).optional(),
});

const upgradeSchema = z.object({
  gateway: z.enum(['paystack', 'flutterwave']).optional(),
});

router.post('/renew/initiate', authenticateMemberJWT, requireActivated, validate(renewSchema), initiateRenewal);
router.post('/upgrade/initiate', authenticateMemberJWT, requireActivated, validate(upgradeSchema), initiateUpgrade);

export default router;

