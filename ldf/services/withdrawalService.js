import { User, Earning, Withdrawal } from '../models/index.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * @param {number} userId
 * @returns {Promise<number>}
 */
export async function getUserBalance(userId) {
  const user = await User.findById(userId).select('balance');
  if (!user) {
    throw new Error('User not found');
  }
  return Number(user.balance || 0);
}

/**
 * @param {number} userId
 * @returns {Promise<number>}
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
 * @param {number} userId
 * @param {number} amount
 * @returns {Promise<void>}
 */
export async function incrementBalance(userId, amount) {
  await User.findByIdAndUpdate(userId, {
    $inc: { balance: amount },
  });
}

/**
 * @param {number} userId
 * @param {number} amount
 * @returns {Promise<void>}
 */
export async function decrementBalance(userId, amount) {
  await User.findByIdAndUpdate(userId, {
    $inc: { balance: -amount },
  });
}

/**
 * @param {number} userId
 * @param {number} amount
 * @param {string} currency
 * @param {Object} bankDetails
 * @returns {Promise<Object>}
 */
export async function createWithdrawal(userId, amount, currency = 'NGN', bankDetails) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    const directReferralsCount = await User.countDocuments({ sponsorId: userId }).session(session);
    if (directReferralsCount < 2) {
      throw new Error(`You need at least 2 direct referrals to withdraw. You currently have ${directReferralsCount}. Matrix earnings are in your pending balance until you unlock.`);
    }

    if (user.pendingBalance > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { balance: user.pendingBalance, pendingBalance: -user.pendingBalance },
      }, { session });
      logger.info(`[WITHDRAWAL] Transferred ₦${user.pendingBalance} from pending to main balance for user ${userId}`);
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
 * @param {number} withdrawalId
 * @param {string} paymentReference
 * @returns {Promise<Object>}
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

    const txReference = paymentReference || `LDF-WD-${withdrawalId}-${Date.now()}`;

    const { initiateBankTransfer } = await import('./seerbitService.js');

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

