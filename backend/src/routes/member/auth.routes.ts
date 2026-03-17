import { Router } from 'express';
import { z } from 'zod';
import { register, login, refresh, logout, forgotPassword, resetPassword } from '../../controllers/member/auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { registerLimiter, loginLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  phone: z.string().max(30).optional(),
  referredBy: z.string().min(1, 'Sponsor ID is required'),
  couponCode: z.string().min(1, 'Activation coupon is required'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authenticateMemberJWT, logout);
router.post('/forgot-password', validate(forgotSchema), forgotPassword);
router.post('/reset-password', validate(resetSchema), resetPassword);

export default router;
