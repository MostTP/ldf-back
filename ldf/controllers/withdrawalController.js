import { body, validationResult } from 'express-validator';
import { Withdrawal } from '../models/index.js';
import { createWithdrawal, getUserBalance, processWithdrawal } from '../services/withdrawalService.js';

export const withdrawValidation = [
  body('amount')
    .custom((value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        throw new Error('Amount must be a number greater than 0');
      }
      return true;
    })
    .toFloat(),
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
      console.error('Withdrawal validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { amount, currency, ...bankDetails } = req.body;
    const userId = req.user._id || req.user.id;

    console.log('Withdrawal request:', { userId, amount, currency, bankDetails });

    const withdrawal = await createWithdrawal(userId, parseFloat(amount), currency, bankDetails);

    // Auto-process withdrawal in development mode for testing
    let processedWithdrawal = withdrawal;
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log(`[DEV MODE] Auto-processing withdrawal ${withdrawal.id} for testing`);
        // Try to process via Seerbit, but if it fails, just mark as APPROVED
        try {
          processedWithdrawal = await processWithdrawal(withdrawal.id);
          console.log(`[DEV MODE] Withdrawal ${withdrawal.id} processed via Seerbit. Status: ${processedWithdrawal.status}`);
        } catch (seerbitError) {
          // If Seerbit fails (credentials not set), just mark as APPROVED for testing
          console.warn(`[DEV MODE] Seerbit processing failed, marking as APPROVED for testing:`, seerbitError.message);
          const { User, Earning } = await import('../models/index.js');
          processedWithdrawal = await Withdrawal.findByIdAndUpdate(
            withdrawal._id,
            {
              status: 'APPROVED',
              processedAt: new Date(),
            },
            { new: true }
          );
          
          await User.findByIdAndUpdate(userId, {
            $inc: { balance: -parseFloat(amount) },
          });

          const dettyDecemberAmount = parseFloat(amount) * 0.1;
          if (dettyDecemberAmount > 0) {
            await Earning.create({
              userId: userId,
              amount: dettyDecemberAmount,
              type: 'DETTY_DECEMBER',
              description: `Detty December bonus - 10% of withdrawal (₦${parseFloat(amount).toLocaleString()})`,
            });

            await User.findByIdAndUpdate(userId, {
              $inc: { balance: dettyDecemberAmount },
            });

            console.log(`[DEV MODE] [DETTY_DECEMBER] Created ₦${dettyDecemberAmount} bonus for user ${userId} (10% of withdrawal ₦${parseFloat(amount)})`);
          }

          console.log(`[DEV MODE] Withdrawal ${withdrawal.id} marked as APPROVED (Seerbit not configured)`);
        }
      } catch (error) {
        console.warn(`[DEV MODE] Auto-processing failed for withdrawal ${withdrawal.id}:`, error.message);
        // Continue with original withdrawal (still PENDING)
      }
    }

    res.status(201).json({
      success: true,
      message: process.env.NODE_ENV === 'production' 
        ? 'Withdrawal request created' 
        : 'Withdrawal request created and processed (dev mode)',
      data: processedWithdrawal,
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
    const userId = req.user._id || req.user.id;
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

/**
 * Get user's withdrawal history
 */
export async function getWithdrawals(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const withdrawals = await Withdrawal.find({ userId })
      .select('_id amount currency bankName bankAccount accountName status paymentReference rejectionReason processedAt createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Withdrawal.countDocuments({ userId });

    res.json({
      success: true,
      data: withdrawals,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawals',
    });
  }
}

