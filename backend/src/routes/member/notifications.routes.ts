import { Router } from 'express';
import { list, markRead } from '../../controllers/member/notifications.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';

const router = Router();

router.get('/', authenticateMemberJWT, list);
router.patch('/read', authenticateMemberJWT, markRead);

export default router;
