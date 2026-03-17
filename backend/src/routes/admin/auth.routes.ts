import { Router } from 'express';
import { z } from 'zod';
import { login, refresh, logout } from '../../controllers/admin/auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authenticateJWT, requireRole('SuperAdmin', 'FinanceManager', 'SupportAgent'), validate(logoutSchema), logout);

export default router;
