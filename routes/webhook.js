import express from 'express';
import { handlePaymentWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/payment', handlePaymentWebhook);

export default router;

