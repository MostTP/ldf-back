import { Router } from 'express';
import { getSummary } from '../../controllers/admin/dashboard.controller.js';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

router.get(
  '/summary',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager', 'SupportAgent'),
  getSummary
);

export default router;
