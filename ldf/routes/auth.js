import express from 'express'; import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { activateUser } from '../services/activationService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules
const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
  
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone number format'),
  
  body('username')
    .trim()
    .isLength({ min: 6, max: 15 }).withMessage('Username must be 6-15 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('bankName')
    .trim()
    .notEmpty().withMessage('Bank name is required'),
  
  body('bankAccount')
    .trim()
    .notEmpty().withMessage('Bank account number is required')
    .matches(/^\d+$/).withMessage('Bank account must contain only numbers'),
  
  body('sponsor')
    .optional()
    .trim(),
  
  body('couponCode')
    .optional()
    .trim(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('termsAccepted')
    .equals('true').withMessage('You must accept the Terms & Conditions'),
  
  body('riskDisclosureAccepted')
    .equals('true').withMessage('You must accept the Risk Disclosure Statement'),
  
  body('couponAcknowledged')
    .equals('true').withMessage('You must acknowledge the coupon terms'),
];

// Login validation rules
const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email or username is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    // Return user data (excluding sensitive information)
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      phone: user.phone,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Registration endpoint
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      username,
      bankName,
      bankAccount,
      sponsor,
      sponsorId, // Allow direct sponsorId for backward compatibility
      couponCode,
      password,
      termsAccepted,
      riskDisclosureAccepted,
      couponAcknowledged,
    } = req.body;

    // Check if user already exists (email, username, or phone)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { phone },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' 
                  : existingUser.username === username ? 'username' 
                  : 'phone';
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`,
      });
    }

    // Resolve sponsor (username/code) to sponsorId
    let resolvedSponsorId = sponsorId || null;
    
    if (sponsor && !resolvedSponsorId) {
      // Try to find sponsor by username (most common case)
      const sponsorUser = await prisma.user.findUnique({
        where: { username: sponsor.trim() },
        select: { id: true },
      });

      if (sponsorUser) {
        resolvedSponsorId = sponsorUser.id;
      } else {
        // If not found by username, could be a referral code or invalid
        // For now, we'll log a warning but allow registration to proceed
        logger.warn(`Sponsor not found: ${sponsor}. User will be registered without sponsor.`);
      }
    }

    // Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        username,
        bankName,
        bankAccount,
        sponsorId: resolvedSponsorId,
        couponCode,
        passwordHash,
        termsAccepted: termsAccepted === 'true' || termsAccepted === true,
        riskDisclosureAccepted: riskDisclosureAccepted === 'true' || riskDisclosureAccepted === true,
        couponAcknowledged: couponAcknowledged === 'true' || couponAcknowledged === true,
        emailVerificationToken,
        emailVerificationTokenExpiry,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Automatically activate user if coupon code is provided
    let activationResult = null;
    let activationError = null;

    if (couponCode && couponCode.trim()) {
      try {
        logger.info(`[REGISTRATION] Auto-activating user ${user.id} with coupon ${couponCode}`);
        activationResult = await activateUser(user.id, couponCode.trim());
        logger.info(`[REGISTRATION] Auto-activation successful for user ${user.id}`);
      } catch (error) {
        // Log error but don't fail registration - user can activate manually later
        activationError = error.message;
        logger.error(`[REGISTRATION] Auto-activation failed for user ${user.id}:`, error);
      }
    }

    // TODO: Send verification email with token
    // For now, return the token in development (remove in production)
    const responseMessage = activationResult 
      ? 'Account created and activated successfully. Earnings have been distributed.'
      : activationError
      ? `Account created successfully. Activation failed: ${activationError}. You can activate manually later.`
      : 'Account created successfully. Please verify your email.';

    res.status(201).json({
      success: true,
      message: responseMessage,
      user,
      activated: !!activationResult,
      activation: activationResult ? {
        success: true,
        payouts: activationResult.payouts,
      } : activationError ? {
        success: false,
        error: activationError,
      } : null,
      verificationToken: process.env.NODE_ENV === 'development' ? emailVerificationToken : undefined,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
});

// Email verification validation
const verifyEmailValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('Verification token is required'),
];

// Verify email endpoint
router.post('/verify-email', verifyEmailValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { token } = req.body;

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
});

// Resend verification email validation
const resendVerificationValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
];

// Resend verification email endpoint
router.post('/resend-verification', resendVerificationValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If the email exists, a verification link has been sent.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationTokenExpiry,
      },
    });

    // TODO: Send verification email with token
    // For now, return the token in development (remove in production)
    res.json({
      success: true,
      message: 'Verification email sent successfully',
      verificationToken: process.env.NODE_ENV === 'development' ? emailVerificationToken : undefined,
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
});

export default router;

