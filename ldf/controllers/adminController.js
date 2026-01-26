import { body, validationResult } from 'express-validator';
import { User, Earning } from '../models/index.js';
import { processWithdrawal } from '../services/withdrawalService.js';
import { logger } from '../utils/logger.js';

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

    const user = await User.findByIdAndUpdate(
      userId,
      { isAgent: true },
      { new: true, select: '_id firstName lastName email isAgent' }
    );

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

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { agentCouponCredits: parseInt(credits) } },
      { new: true, select: '_id firstName lastName email isAgent agentCouponCredits' }
    );

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

    logger.info('Admin processing withdrawal');

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
    logger.error('Process withdrawal error');
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process withdrawal',
    });
  }
}

/**
 * Get earnings flow tracking
 * View all earnings with details for monitoring and debugging
 */
export async function getEarningsFlow(req, res) {
  try {
    const { userId, type, startDate, endDate, limit = 100 } = req.query;

    const query = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const earnings = await Earning.find(query)
      .populate('userId', 'username firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get summary statistics
    const summary = await Earning.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const totalStats = await Earning.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        earnings,
        summary: {
          byType: summary,
          total: totalStats[0] || { totalEarnings: 0, totalCount: 0 },
        },
        filters: {
          userId: userId || null,
          type: type || null,
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    logger.error('Get earnings flow error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get earnings flow',
    });
  }
}

