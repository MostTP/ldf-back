import { Router } from 'express';
import { z } from 'zod';
import { getProfile, updateProfile, uploadKyc, getReferrals } from '../../controllers/member/profile.controller.js';
import { authenticateMemberJWT } from '../../middleware/authenticateMemberJWT.js';
import { requireActivated } from '../../middleware/requireActivated.js';
import { validate } from '../../middleware/validate.js';
import { uploadKycMulter } from '../../middleware/uploadKyc.js';

const router = Router();

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  currency: z.enum(['NGN', 'GHS', 'KES', 'ZAR']).optional(),
  cashbackEnabled: z.boolean().optional(),
  cashbackPackage: z.enum(['S', 'G', 'both']).optional(),
  cashbackType: z.enum(['reg', 'upgrade', 'monthly', 'all']).optional(),
  cashbackPercentage: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(75), z.literal(100)]).optional(),
});

router.get('/', authenticateMemberJWT, getProfile);
router.get('/referrals', authenticateMemberJWT, getReferrals);
router.patch('/', authenticateMemberJWT, validate(updateSchema), updateProfile);
router.post('/kyc', authenticateMemberJWT, requireActivated, (req, res, next) => {
  uploadKycMulter(req, res, (err: Error) => {
    if (err) return res.status(400).json({ error: err.message || 'File upload failed' });
    next();
  });
}, uploadKyc);

export default router;
