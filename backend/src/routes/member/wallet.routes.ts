import { Router } from 'express';
import { z } from 'zod';
import { transferToMain, getGamePoints } from '../../controllers/member/wallet.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { requireActivated } from '../../middleware/requireActivated.js';
import { validate } from '../../middleware/validate.js';

const router = Router();
const transferSchema = z.object({
  amount: z.number().positive(),
});

router.get('/game-points', authenticateMemberJWT, getGamePoints);
router.post('/transfer-to-main', authenticateMemberJWT, requireActivated, validate(transferSchema), transferToMain);

export default router;
