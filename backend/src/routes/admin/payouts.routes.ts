import { Router } from 'express';
import { z } from 'zod';
import {
  listPending,
  approve,
  batchApprove,
  reject,
  auditLog,
  listInvestments,
} from '../../controllers/admin/payouts.controller.js';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const rejectSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

const batchApproveSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

router.get(
  '/pending',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager'),
  listPending
);

router.get(
  '/audit-log',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager'),
  auditLog
);

router.get(
  '/investments',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager'),
  listInvestments
);

router.post(
  '/batch-approve',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager'),
  validate(batchApproveSchema),
  batchApprove
);

router.post(
  '/:id/approve',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager'),
  approve
);

router.post(
  '/:id/reject',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager'),
  validate(rejectSchema),
  reject
);

export default router;
