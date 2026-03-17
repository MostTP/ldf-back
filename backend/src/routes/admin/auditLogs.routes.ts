import { Router } from 'express';
import { list } from '../../controllers/admin/auditLogs.controller.js';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

router.get(
  '/',
  authenticateJWT,
  requireRole('SuperAdmin'),
  list
);

export default router;
