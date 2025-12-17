import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { initializePayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initialize', authenticate, initializePayment);

export default router;

