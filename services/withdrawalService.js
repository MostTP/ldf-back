import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get user's stored balance (fast - returns cached value)
 * @param {number} userId - User ID
 * @returns {Promise<number>} Stored balance
 */
export async function getUserBalance(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

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
  const result = await prisma.earning.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  // Get total withdrawals (APPROVED or PAID only)
  const withdrawals = await prisma.withdrawal.aggregate({
    where: {
      userId,
      status: { in: ['APPROVED', 'PAID'] },
    },
    _sum: { amount: true },
  });

  const totalEarnings = Number(result._sum.amount || 0);
  const totalWithdrawn = Number(withdrawals._sum.amount || 0);
  const newBalance = totalEarnings - totalWithdrawn;

  // Update stored balance
  await prisma.user.update({
    where: { id: userId },
    data: { balance: newBalance },
  });

  return newBalance;
}

/**
 * Increment user's balance (when earning is created)
 * @param {number} userId - User ID
 * @param {number} amount - Amount to add
 * @returns {Promise<void>}
 */
export async function incrementBalance(userId, amount) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      balance: {
        increment: amount,
      },
    },
  });
}

/**
 * Decrement user's balance (when withdrawal is approved/paid)
 * @param {number} userId - User ID
 * @param {number} amount - Amount to subtract
 * @returns {Promise<void>}
 */
export async function decrementBalance(userId, amount) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      balance: {
        decrement: amount,
      },
    },
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
  return await prisma.$transaction(async (tx) => {
    // Validate user exists and has KYC
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // KYC verification check (can be bypassed in development for testing)
    if (!user.kycVerified && process.env.NODE_ENV === 'production') {
      throw new Error('KYC verification required for withdrawals');
    }
    
    // In development, log a warning but allow withdrawal
    if (!user.kycVerified && process.env.NODE_ENV !== 'production') {
      console.warn(`[WITHDRAWAL] User ${userId} attempting withdrawal without KYC verification (allowed in development)`);
    }

    // Check balance (use stored balance)
    const balance = Number(user.balance || 0);
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create withdrawal record (balance not reduced yet - still PENDING)
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
 * Process withdrawal (approve and trigger payment via Interswitch)
 * @param {number} withdrawalId - Withdrawal ID
 * @param {string} paymentReference - Payment gateway reference (optional, will be generated)
 * @returns {Promise<Object>} Updated withdrawal with payment details
 */
export async function processWithdrawal(withdrawalId, paymentReference = null) {
  return await prisma.$transaction(async (tx) => {
    // Get withdrawal details
    const withdrawal = await tx.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    });

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

      // Update withdrawal with payment reference and status
      const newStatus = transferResult.status === 'SUCCESS' ? 'PAID' : 'APPROVED';
      const updatedWithdrawal = await tx.withdrawal.update({
    where: { id: withdrawalId },
    data: {
          status: newStatus,
          paymentReference: transferResult.transactionReference || txReference,
      processedAt: new Date(),
    },
      });

      // Decrement user's balance (only if not already decremented)
      // Check if this withdrawal was previously APPROVED/PAID
      if (withdrawal.status === 'PENDING') {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            balance: {
              decrement: Number(withdrawal.amount),
            },
          },
        });
      }

      return {
        ...updatedWithdrawal,
        transferResult,
      };
    } catch (error) {
      // If transfer fails, mark as failed
      // Balance should NOT be decremented (withdrawal failed)
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'FAILED',
          rejectionReason: error.message,
        },
      });

      throw error;
    }
  });
}

