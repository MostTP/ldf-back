import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { withdraw, getBalance, withdrawValidation } from '../controllers/withdrawalController.js';

const router = express.Router();

router.get('/balance', authenticate, getBalance);
router.post('/', authenticate, withdrawValidation, withdraw);

export default router;

