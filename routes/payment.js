import express from 'express';
import { authenticate, requireAgent } from '../middleware/auth.js';
import { 
  initializePayment, 
  initializeAgentCouponPayment,
  redirectAgentCouponPayment,
  agentCouponPaymentCallback,
  verifyAgentCouponPayment
} from '../controllers/paymentController.js';

const router = express.Router();

// Premium upgrade payment
router.post('/initialize', authenticate, initializePayment);

// Agent coupon credits payment (inline widget - returns data)
router.post('/agent-coupons/initialize', authenticate, requireAgent, initializeAgentCouponPayment);

// Returns payment URL that frontend redirects to
router.post('/agent-coupons/pay', authenticate, requireAgent, redirectAgentCouponPayment);

// Manually verify payment if webhook didn't fire
router.post('/agent-coupons/verify', authenticate, requireAgent, verifyAgentCouponPayment);

// Callback after Flutterwave payment (no auth needed - Flutterwave redirects here)
router.get('/agent-coupons/callback', agentCouponPaymentCallback);

export default router;

