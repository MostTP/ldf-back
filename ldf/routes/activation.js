import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { activate, activateValidation } from '../controllers/activationController.js';

const router = express.Router();

router.post('/', authenticate, activateValidation, activate);

export default router;

