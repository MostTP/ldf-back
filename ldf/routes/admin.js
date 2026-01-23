import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  upgradeToAgent,
  upgradeToAgentValidation,
  creditAgentCoupons,
  creditAgentCouponsValidation,
  processWithdrawalRequest,
  processWithdrawalValidation,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/upgrade-agent', upgradeToAgentValidation, upgradeToAgent);
router.post('/agent/credit-coupons', creditAgentCouponsValidation, creditAgentCoupons);
router.post('/withdrawals/process', processWithdrawalValidation, processWithdrawalRequest);

export default router;

