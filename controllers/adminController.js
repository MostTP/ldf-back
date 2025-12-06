import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const upgradeToAgentValidation = [
  body('userId')
    .isInt().withMessage('Valid user ID is required'),
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

