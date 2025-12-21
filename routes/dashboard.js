import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, getStats, updateBankDetails, changePassword } from '../controllers/dashboardController.js';
import { getMatrixTree } from '../controllers/matrixController.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', getProfile);

// Get dashboard statistics
router.get('/stats', getStats);

// Get basic matrix tree (L1 & L2)
router.get('/matrix', getMatrixTree);

// Update bank details
router.put('/bank', updateBankDetails);

// Change password
router.put('/password', changePassword);

export default router;

