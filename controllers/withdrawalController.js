import { body, validationResult } from 'express-validator';
import { createWithdrawal, getUserBalance, processWithdrawal } from '../services/withdrawalService.js';

export const withdrawValidation = [
  body('amount')
    .isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isString().withMessage('Currency must be a string'),
  body('bankName')
    .optional()
    .trim(),
  body('bankAccount')
    .optional()
    .trim(),
  body('accountName')
    .optional()
    .trim(),
];

export async function withdraw(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { amount, currency, ...bankDetails } = req.body;
    const userId = req.user.id;

    const withdrawal = await createWithdrawal(userId, parseFloat(amount), currency, bankDetails);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created',
      data: withdrawal,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Withdrawal failed',
    });
  }
}

export async function getBalance(req, res) {
  try {
    const userId = req.user.id;
    const balance = await getUserBalance(userId);

    res.json({
      success: true,
      balance: balance,
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance',
    });
  }
}

