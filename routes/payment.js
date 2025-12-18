import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { initializePayment, initializeAgentCouponPayment } from '../controllers/paymentController.js';

const router = express.Router();

// Premium upgrade payment
router.post('/initialize', authenticate, initializePayment);

// Agent coupon credits payment
router.post('/agent-coupons/initialize', authenticate, initializeAgentCouponPayment);

export default router;

