import express from 'express';
import { authenticate, requireAgent } from '../middleware/auth.js';
import {
  generateCoupons,
  getMyCoupons,
  generateCouponValidation,
} from '../controllers/agentController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAgent);

router.get('/coupons', getMyCoupons);
router.post('/coupons/generate', generateCouponValidation, generateCoupons);

export default router;

