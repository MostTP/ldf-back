import { Router } from 'express';
import { z } from 'zod';
import { getModules, updateProgress } from '../../controllers/member/masterclass.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { requireActivated } from '../../middleware/requireActivated.js';
import { validate } from '../../middleware/validate.js';

const router = Router();
const progressSchema = z.object({ completionPct: z.number().min(0).max(100) });

router.get('/modules', authenticateMemberJWT, requireActivated, getModules);
router.patch('/modules/:moduleId/progress', authenticateMemberJWT, requireActivated, validate(progressSchema), updateProgress);

export default router;
