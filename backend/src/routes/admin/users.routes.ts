import { Router } from 'express';
import { z } from 'zod';
import { search, getById, getLedger, ledgerAdjustment, updateStatus, updateAgentStatus } from '../../controllers/admin/users.controller.js';
import { convertGamePoints } from '../../controllers/admin/gamePoints.controller.js';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';

const router = Router();
const allAdminRoles = ['SuperAdmin', 'FinanceManager', 'SupportAgent'] as const;

const ledgerAdjustmentSchema = z.object({
  type: z.enum(['credit', 'debit']),
  amount: z.number().positive(),
  reason: z.string().min(20, 'Reason must be at least 20 characters'),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
  reason: z.string().min(1),
});

const updateAgentStatusSchema = z.object({
  isAgent: z.boolean(),
  commissionRate: z.number().min(0).max(100).optional(),
});

const convertPointsSchema = z.object({
  points: z.number().int().positive().optional(),
  rate: z.number().positive().optional(),
});

router.get(
  '/',
  authenticateJWT,
  requireRole(...allAdminRoles),
  search
);

router.get(
  '/:id',
  authenticateJWT,
  requireRole(...allAdminRoles),
  getById
);

router.get(
  '/:id/ledger',
  authenticateJWT,
  requireRole(...allAdminRoles),
  getLedger
);

router.post(
  '/:id/ledger-adjustment',
  authenticateJWT,
  requireRole('SuperAdmin'),
  validate(ledgerAdjustmentSchema),
  ledgerAdjustment
);

router.post(
  '/:id/convert-game-points',
  authenticateJWT,
  requireRole('SuperAdmin'),
  validate(convertPointsSchema),
  convertGamePoints
);

router.patch(
  '/:id/status',
  authenticateJWT,
  requireRole('SuperAdmin', 'FinanceManager'),
  validate(updateStatusSchema),
  updateStatus
);

router.patch(
  '/:id/agent-status',
  authenticateJWT,
  requireRole('SuperAdmin'),
  validate(updateAgentStatusSchema),
  updateAgentStatus
);

export default router;
