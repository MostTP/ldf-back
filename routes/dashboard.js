import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, getStats } from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', getProfile);

// Get dashboard statistics
router.get('/stats', getStats);

export default router;

