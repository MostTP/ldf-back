import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { processWithdrawal } from '../services/withdrawalService.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const upgradeToAgentValidation = [
  body('userId')
    .isInt().withMessage('Valid user ID is required'),
];

export const creditAgentCouponsValidation = [
  body('userId')
    .isInt().withMessage('Valid user ID is required'),
  body('credits')
    .isInt({ min: 1 }).withMessage('Credits must be at least 1'),
];

export const processWithdrawalValidation = [
  body('withdrawalId')
    .isInt().withMessage('Valid withdrawal ID is required'),
];

/**
 * Upgrade user to agent
 */
export async function upgradeToAgent(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { userId } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { isAgent: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isAgent: true,
      },
    });

    res.json({
      success: true,
      message: 'User upgraded to agent',
      data: user,
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upgrade user',
    });
  }
}

/**
 * Credit coupon balance for an agent
 * (simple admin-controlled deposit, 1 credit = 1 coupon)
 */
export async function creditAgentCoupons(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { userId, credits } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        agentCouponCredits: {
          increment: parseInt(credits),
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isAgent: true,
        agentCouponCredits: true,
      },
    });

    res.json({
      success: true,
      message: `Credited ${credits} coupon credit(s) to agent`,
      data: user,
    });
  } catch (error) {
    console.error('Credit agent coupons error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to credit agent coupons',
    });
  }
}

/**
 * Process withdrawal via Seerbit
 * Admin endpoint to approve and process withdrawal requests
 */
export async function processWithdrawalRequest(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { withdrawalId } = req.body;

    logger.info(`Admin processing withdrawal ${withdrawalId}`);

    // Process withdrawal via Seerbit
    const result = await processWithdrawal(parseInt(withdrawalId));

    res.json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        withdrawal: result,
        status: result.status,
        paymentReference: result.paymentReference,
      },
    });
  } catch (error) {
    logger.error('Process withdrawal error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process withdrawal',
    });
  }
}


