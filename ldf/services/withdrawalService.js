import { User, Earning, Withdrawal } from '../models/index.js';
import mongoose from 'mongoose';

/**
 * Get user's stored balance (fast - returns cached value)
 * @param {number} userId - User ID
 * @returns {Promise<number>} Stored balance
 */
export async function getUserBalance(userId) {
  const user = await User.findById(userId).select('balance');
  if (!user) {
    throw new Error('User not found');
  }
  return Number(user.balance || 0);
}

/**
 * Recalculate user's balance from earnings and withdrawals (for corrections)
 * @param {number} userId - User ID
 * @returns {Promise<number>} Recalculated balance
 */
export async function recalculateBalance(userId) {
  const result = await Earning.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const withdrawals = await Withdrawal.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        status: { $in: ['APPROVED', 'PAID'] },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalEarnings = Number(result[0]?.total || 0);
  const totalWithdrawn = Number(withdrawals[0]?.total || 0);
  const newBalance = totalEarnings - totalWithdrawn;

  await User.findByIdAndUpdate(userId, { balance: newBalance });
  return newBalance;
}

/**
 * Increment user's balance (when earning is created)
 * @param {number} userId - User ID
 * @param {number} amount - Amount to add
 * @returns {Promise<void>}
 */
export async function incrementBalance(userId, amount) {
  await User.findByIdAndUpdate(userId, {
    $inc: { balance: amount },
  });
}

/**
 * Decrement user's balance (when withdrawal is approved/paid)
 * @param {number} userId - User ID
 * @param {number} amount - Amount to subtract
 * @returns {Promise<void>}
 */
export async function decrementBalance(userId, amount) {
  await User.findByIdAndUpdate(userId, {
    $inc: { balance: -amount },
  });
}

/**
 * Create a withdrawal request
 * @param {number} userId - User ID
 * @param {number} amount - Withdrawal amount
 * @param {string} currency - Currency code (default: NGN)
 * @param {Object} bankDetails - Bank account details
 * @returns {Promise<Object>} Withdrawal record
 */
export async function createWithdrawal(userId, amount, currency = 'NGN', bankDetails) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.kycVerified && process.env.NODE_ENV === 'production') {
      throw new Error('KYC verification required for withdrawals');
    }

    if (!user.kycVerified && process.env.NODE_ENV !== 'production') {
      console.warn(`[WITHDRAWAL] User ${userId} attempting withdrawal without KYC verification (allowed in development)`);
    }

    const balance = Number(user.balance || 0);
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    const withdrawal = await Withdrawal.create([{
      userId,
      amount,
      currency,
      bankName: bankDetails.bankName || user.bankName,
      bankAccount: bankDetails.bankAccount || user.bankAccount,
      accountName: bankDetails.accountName || `${user.firstName} ${user.lastName}`,
      status: 'PENDING',
    }], { session });

    await session.commitTransaction();
    return withdrawal[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Process withdrawal (approve and trigger payment via Interswitch)
 * @param {number} withdrawalId - Withdrawal ID
 * @param {string} paymentReference - Payment gateway reference (optional, will be generated)
 * @returns {Promise<Object>} Updated withdrawal with payment details
 */
export async function processWithdrawal(withdrawalId, paymentReference = null) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const withdrawal = await Withdrawal.findById(withdrawalId).populate('userId').session(session);
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new Error(`Withdrawal is already ${withdrawal.status}`);
    }

    // Generate payment reference if not provided
    const txReference = paymentReference || `LDF-WD-${withdrawalId}-${Date.now()}`;

    // Import Seerbit service
    const { initiateBankTransfer } = await import('./seerbitService.js');

    // Map bank name to bank code (common Nigerian banks)
    const bankCodeMap = {
      'Access Bank': '044',
      'GTBank': '058',
      'First Bank': '011',
      'UBA': '033',
      'Zenith Bank': '057',
      'Fidelity Bank': '070',
      'Union Bank': '032',
      'Stanbic IBTC': '221',
      'Sterling Bank': '232',
      'Wema Bank': '035',
      'FCMB': '214',
      'Heritage Bank': '030',
      'Keystone Bank': '082',
      'Polaris Bank': '076',
      'Providus Bank': '101',
      'Jaiz Bank': '301',
      'Taj Bank': '302',
    };

    const bankCode = bankCodeMap[withdrawal.bankName] || null;

    if (!bankCode) {
      throw new Error(`Bank code not found for ${withdrawal.bankName}. Please ensure bank name matches supported banks.`);
    }

    // Initiate bank transfer via Seerbit
    try {
      const transferResult = await initiateBankTransfer({
        accountNumber: withdrawal.bankAccount,
        bankCode: bankCode,
        amount: Number(withdrawal.amount),
        accountName: withdrawal.accountName || `${withdrawal.user.firstName} ${withdrawal.user.lastName}`,
        narration: `LDF Withdrawal - ${withdrawal.user.username}`,
        reference: txReference,
      });

      const newStatus = transferResult.status === 'SUCCESS' ? 'PAID' : 'APPROVED';
      const updatedWithdrawal = await Withdrawal.findByIdAndUpdate(
        withdrawalId,
        {
          status: newStatus,
          paymentReference: transferResult.transactionReference || txReference,
          processedAt: new Date(),
        },
        { new: true, session }
      );

      if (withdrawal.status === 'PENDING') {
        await User.findByIdAndUpdate(
          withdrawal.userId,
          { $inc: { balance: -Number(withdrawal.amount) } },
          { session }
        );

        const dettyDecemberAmount = Number(withdrawal.amount) * 0.1;
        if (dettyDecemberAmount > 0) {
          await Earning.create([{
            userId: withdrawal.userId,
            amount: dettyDecemberAmount,
            type: 'DETTY_DECEMBER',
            description: `Detty December bonus - 10% of withdrawal (₦${Number(withdrawal.amount).toLocaleString()})`,
          }], { session });

          await User.findByIdAndUpdate(
            withdrawal.userId,
            { $inc: { balance: dettyDecemberAmount } },
            { session }
          );
        }
      }

      await session.commitTransaction();
      return {
        ...updatedWithdrawal.toObject(),
        transferResult,
      };
    } catch (error) {
      await Withdrawal.findByIdAndUpdate(
        withdrawalId,
        {
          status: 'FAILED',
          rejectionReason: error.message,
        },
        { session }
      );
      await session.abortTransaction();
      throw error;
    }
  } finally {
    session.endSession();
  }
}

