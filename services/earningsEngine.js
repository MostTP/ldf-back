import { PrismaClient } from '@prisma/client';
import { getUplineHierarchy } from '../utils/matrixService.js';

const prisma = new PrismaClient();

/**
 * Trigger activation payouts for a new user activation
 * All payouts happen in a single transaction
 * @param {number} newUserId - The newly activated user ID
 * @param {number} activationAmount - Total activation amount (₦50)
 * @returns {Promise<Object>} Result of the payout operation
 */
export async function triggerActivationPayouts(newUserId, activationAmount = 50) {
  console.log(`[EARNINGS] Starting activation payouts for user ${newUserId}`);
  
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: newUserId },
      include: { sponsor: true },
    });

    if (!user) {
      console.error(`[EARNINGS] User ${newUserId} not found`);
      throw new Error('User not found');
    }

    console.log(`[EARNINGS] User found: ${user.firstName} ${user.lastName}, Sponsor ID: ${user.sponsorId || 'None'}`);

    const payouts = [];

    // 1. Referral Bonus: ₦1,000 → direct referrer (sponsor)
    if (user.sponsorId) {
      console.log(`[EARNINGS] Creating referral bonus for sponsor ${user.sponsorId}`);
      const referralEarning = await tx.earning.create({
        data: {
          userId: user.sponsorId,
          amount: 1000,
          type: 'REFERRAL_BONUS',
          description: `Referral bonus for ${user.firstName} ${user.lastName}`,
          referrerId: user.sponsorId,
          sponsorId: user.sponsorId,
          activationId: newUserId,
        },
      });
      
      // Increment sponsor's balance
      await tx.user.update({
        where: { id: user.sponsorId },
        data: {
          balance: {
            increment: 1000,
          },
        },
      });
      
      payouts.push(referralEarning);
      console.log(`[EARNINGS] Referral bonus created: ₦1,000 for sponsor ${user.sponsorId}`);
    } else {
      console.log(`[EARNINGS] No sponsor found for user ${newUserId}, skipping referral bonus`);
    }

    // 2. Global Pool Allocation: ₦1,000 → pool ledger (system user or special handling)
    // For now, we'll create a system earning entry
    const poolEarning = await tx.earning.create({
      data: {
        userId: newUserId, // Tracked on new user for audit
        amount: 1000,
        type: 'GLOBAL_POOL_ROI',
        description: 'Global pool allocation',
        activationId: newUserId,
      },
    });
    payouts.push(poolEarning);

    // 3. Operations Cost: ₦500 → internal ledger
    const opsEarning = await tx.earning.create({
      data: {
        userId: newUserId, // Tracked on new user for audit
        amount: 500,
        type: 'OPERATIONS_COST',
        description: 'Operations cost allocation',
        activationId: newUserId,
      },
    });
    payouts.push(opsEarning);

    // 4. Matrix Split: 5-level upline (starting from the new user's sponsor)
    // The matrix levels are: sponsor's sponsor, sponsor's sponsor's sponsor, etc.
    const matrixAmounts = [200, 100, 70, 60, 70]; // Level 1-5 amounts
    
    if (user.sponsorId) {
      // Get upline hierarchy starting from the sponsor
      const upline = await getUplineHierarchy(user.sponsorId);
      console.log(`[EARNINGS] Found ${upline.length} upline levels for matrix bonuses`);
      
      for (let i = 0; i < Math.min(upline.length, 5); i++) {
        const level = i + 1;
        const sponsorId = upline[i];
        const amount = matrixAmounts[i];

        const matrixEarning = await tx.earning.create({
          data: {
            userId: sponsorId,
            amount: amount,
            type: `MATRIX_LEVEL_${level}`,
            description: `Matrix level ${level} bonus for ${user.firstName} ${user.lastName}`,
            sponsorId: sponsorId,
            activationId: newUserId,
          },
        });
        
        // Increment upline user's balance
        await tx.user.update({
          where: { id: sponsorId },
          data: {
            balance: {
              increment: amount,
            },
          },
        });
        
        payouts.push(matrixEarning);
        console.log(`[EARNINGS] Matrix level ${level} bonus created: ₦${amount} for user ${sponsorId}`);
      }
    } else {
      console.log(`[EARNINGS] No sponsor found, skipping matrix bonuses`);
    }

    const totalAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
    console.log(`[EARNINGS] Activation payouts completed: ${payouts.length} payouts, Total: ₦${totalAmount}`);

    return {
      success: true,
      payouts: payouts.length,
      totalAmount: totalAmount,
    };
  });
}

