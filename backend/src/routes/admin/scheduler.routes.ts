import { Router } from 'express';
import { z } from 'zod';
import { trigger } from '../../controllers/admin/scheduler.controller.js';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const triggerSchema = z.object({
  jobType: z.enum(['GLOBAL_POOL_DISTRIBUTION', 'PREMIUM_ROI_DISTRIBUTION']),
});

router.post(
  '/trigger',
  authenticateJWT,
  requireRole('SuperAdmin'),
  validate(triggerSchema),
  trigger
);

export default router;
