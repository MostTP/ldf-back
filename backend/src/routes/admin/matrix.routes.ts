import { Router } from 'express';
import { getTree } from '../../controllers/admin/matrix.controller.js';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

router.get(
  '/:userId/tree',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager', 'SupportAgent'),
  getTree
);

export default router;
