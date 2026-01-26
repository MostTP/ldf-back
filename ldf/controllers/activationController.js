import { body, validationResult } from 'express-validator';
import { activateUser } from '../services/activationService.js';
import { logger } from '../utils/logger.js';

export const activateValidation = [
  body('couponCode')
    .trim()
    .notEmpty().withMessage('Coupon code is required'),
];

export async function activate(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { couponCode } = req.body;
    const userId = req.user.id;

    logger.info('Activation request received');

    const result = await activateUser(userId, couponCode);

    logger.info('Activation successful');

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error('Activation error');
    res.status(400).json({
      success: false,
      message: error.message || 'Activation failed',
    });
  }
}

