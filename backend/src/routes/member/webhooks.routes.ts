import { Router } from 'express';
import { paystackWebhook, flutterwaveWebhook } from '../../controllers/member/webhooks.controller.js';

const router = Router();

router.post('/paystack', paystackWebhook);
router.post('/flutterwave', flutterwaveWebhook);

export default router;
