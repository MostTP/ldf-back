import express from 'express';
import { handlePaymentWebhook } from '../controllers/webhookController.js';
import { handleSeerbitWebhook } from '../controllers/seerbitWebhookController.js';

const router = express.Router();

// Flutterwave payment webhook
router.post('/payment', handlePaymentWebhook);

// Seerbit withdrawal webhook
router.post('/seerbit', handleSeerbitWebhook);

export default router;

