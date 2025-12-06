import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate user's total balance from earnings
 * @param {number} userId - User ID
 * @returns {Promise<number>} Total balance
 */
export async function getUserBalance(userId) {
  const result = await prisma.earning.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  // Get total withdrawals
  const withdrawals = await prisma.withdrawal.aggregate({
    where: {
      userId,
      status: { in: ['APPROVED', 'PAID'] },
    },
    _sum: { amount: true },
  });

  const totalEarnings = Number(result._sum.amount || 0);
  const totalWithdrawn = Number(withdrawals._sum.amount || 0);

  return totalEarnings - totalWithdrawn;
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
  return await prisma.$transaction(async (tx) => {
    // Validate user exists and has KYC
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.kycVerified) {
      throw new Error('KYC verification required for withdrawals');
    }

    // Check balance
    const balance = await getUserBalance(userId);
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create withdrawal record
    const withdrawal = await tx.withdrawal.create({
      data: {
        userId,
        amount,
        currency,
        bankName: bankDetails.bankName || user.bankName,
        bankAccount: bankDetails.bankAccount || user.bankAccount,
        accountName: bankDetails.accountName || `${user.firstName} ${user.lastName}`,
        status: 'PENDING',
      },
    });

    return withdrawal;
  });
}

/**
 * Process withdrawal (approve and trigger payment)
 * @param {number} withdrawalId - Withdrawal ID
 * @param {string} paymentReference - Payment gateway reference
 * @returns {Promise<Object>} Updated withdrawal
 */
export async function processWithdrawal(withdrawalId, paymentReference) {
  return await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: 'PAID',
      paymentReference,
      processedAt: new Date(),
    },
  });
}

