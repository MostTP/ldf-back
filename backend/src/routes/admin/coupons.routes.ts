import { Router } from 'express';
import { list } from '../../controllers/admin/coupons.controller.js';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

router.get(
  '/',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager', 'SupportAgent'),
  list
);

export default router;
