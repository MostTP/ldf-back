import { Router } from 'express';
import { getSummary, getLedger, getBalance } from '../../controllers/member/earnings.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';

const router = Router();

// Read-only: allow pending members so dashboard can load (zeros/empty until activated)
router.get('/summary', authenticateMemberJWT, getSummary);
router.get('/ledger', authenticateMemberJWT, getLedger);
router.get('/balance', authenticateMemberJWT, getBalance);

export default router;
