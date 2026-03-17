import { Router } from 'express';
import { getPosition, getDownline, getStats } from '../../controllers/member/matrix.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';

const router = Router();

// Read-only: allow pending members so dashboard can load (zeros/empty until activated)
router.get('/position', authenticateMemberJWT, getPosition);
router.get('/downline', authenticateMemberJWT, getDownline);
router.get('/stats', authenticateMemberJWT, getStats);

export default router;
