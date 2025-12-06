import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  upgradeToAgent,
  upgradeToAgentValidation,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/upgrade-agent', upgradeToAgentValidation, upgradeToAgent);

export default router;

