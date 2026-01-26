import { body, validationResult } from 'express-validator';
import { User, Coupon } from '../models/index.js';
import crypto from 'crypto';

export const generateCouponValidation = [
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100'),
];

/**
 * Generate coupon codes for an agent
 */
export async function generateCoupons(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const agentId = req.user._id || req.user.id;
    const quantity = parseInt(req.body.quantity) || 1;

    const agent = await User.findById(agentId).select('agentCouponCredits');
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    if (agent.agentCouponCredits < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coupon credits. You have ${agent.agentCouponCredits}, but need ${quantity}. Please deposit or request more credits from admin.`,
      });
    }

    const coupons = [];
    for (let i = 0; i < quantity; i++) {
      const code = `LDF-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const coupon = await Coupon.create({
        code,
        agentId,
      });
      coupons.push(coupon);
    }

    await User.findByIdAndUpdate(agentId, {
      $inc: { agentCouponCredits: -quantity },
    });

    res.status(201).json({
      success: true,
      message: `${quantity} coupon(s) generated successfully`,
      data: coupons,
    });
  } catch (error) {
    console.error('Coupon generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate coupons',
    });
  }
}

/**
 * Get agent's coupons
 */
export async function getMyCoupons(req, res) {
  try {
    const agentId = req.user._id || req.user.id;

    const coupons = await Coupon.find({ agentId })
      .populate('usedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coupons',
    });
  }
}

