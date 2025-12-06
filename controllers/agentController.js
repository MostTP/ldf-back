import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

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

    const agentId = req.user.id;
    const quantity = parseInt(req.body.quantity) || 1;

    const coupons = [];

    for (let i = 0; i < quantity; i++) {
      // Generate secure coupon code
      const code = `LDF-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      const coupon = await prisma.coupon.create({
        data: {
          code,
          agentId,
        },
      });

      coupons.push(coupon);
    }

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
    const agentId = req.user.id;

    const coupons = await prisma.coupon.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      include: {
        usedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

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

