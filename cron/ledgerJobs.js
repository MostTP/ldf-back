import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Monthly Global Pool ROI distribution
 * Distributes ROI from global pool to eligible users
 * Eligibility: (AFFILIATE INCOME + GLOBAL_POOL_ROI) < ₦10,000
 * Distribution: Credit exact amount to bring total to ₦10,000
 */
export async function distributeGlobalPoolROI() {
  try {
    console.log('[GLOBAL_POOL] Starting monthly distribution...');

    // Calculate available pool: Total Contributions - Total Distributions
    const totalContributions = await prisma.earning.aggregate({
      where: {
        type: 'GLOBAL_POOL_CONTRIBUTION',
      },
      _sum: {
        amount: true,
      },
    });

    const totalDistributed = await prisma.earning.aggregate({
      where: {
        type: 'GLOBAL_POOL_ROI',
      },
      _sum: {
        amount: true,
      },
    });

    const contributionsAmount = totalContributions._sum.amount 
      ? parseFloat(totalContributions._sum.amount.toString()) 
      : 0;
    const distributedAmount = totalDistributed._sum.amount 
      ? parseFloat(totalDistributed._sum.amount.toString()) 
      : 0;
    
    const availablePool = contributionsAmount - distributedAmount;

    console.log(`[GLOBAL_POOL] Pool calculation:`, {
      totalContributions: contributionsAmount,
      totalDistributed: distributedAmount,
      availablePool: availablePool,
    });

    if (availablePool <= 0) {
      console.log('[GLOBAL_POOL] No available pool to distribute');
      return {
        success: true,
        message: 'No available pool to distribute',
        availablePool: 0,
        eligibleUsers: 0,
      };
    }

    // Get all email-verified users
    const allUsers = await prisma.user.findMany({
      where: {
        emailVerified: true,
      },
      select: {
        id: true,
      },
    });

    // Calculate eligibility and distribution amounts for each user
    const eligibleUsers = [];
    let totalNeeded = 0;

    for (const user of allUsers) {
      // Get user's AFFILIATE INCOME (REFERRAL_BONUS)
      const affiliateEarnings = await prisma.earning.aggregate({
        where: {
          userId: user.id,
          type: 'REFERRAL_BONUS',
        },
        _sum: {
          amount: true,
        },
      });

      // Get user's GLOBAL_POOL_ROI earnings
      const globalPoolEarnings = await prisma.earning.aggregate({
        where: {
          userId: user.id,
          type: 'GLOBAL_POOL_ROI',
        },
        _sum: {
          amount: true,
        },
      });

      const affiliateTotal = affiliateEarnings._sum.amount 
        ? parseFloat(affiliateEarnings._sum.amount.toString()) 
        : 0;
      const globalPoolTotal = globalPoolEarnings._sum.amount 
        ? parseFloat(globalPoolEarnings._sum.amount.toString()) 
        : 0;

      const combinedTotal = affiliateTotal + globalPoolTotal;
      const targetAmount = 10000; // ₦10,000

      // User is eligible if combined total < ₦10,000
      if (combinedTotal < targetAmount) {
        const amountNeeded = targetAmount - combinedTotal;
        eligibleUsers.push({
          id: user.id,
          affiliateTotal,
          globalPoolTotal,
          combinedTotal,
          amountNeeded,
        });
        totalNeeded += amountNeeded;
      }
    }

    console.log(`[GLOBAL_POOL] Found ${eligibleUsers.length} eligible users (out of ${allUsers.length} email-verified users)`);
    console.log(`[GLOBAL_POOL] Total amount needed: ₦${totalNeeded}, Available pool: ₦${availablePool}`);

    if (eligibleUsers.length === 0) {
      console.log('[GLOBAL_POOL] No eligible users found (all users have AFFILIATE + GLOBAL_POOL >= ₦10,000)');
      return {
        success: true,
        message: 'No eligible users found',
        availablePool: availablePool,
        eligibleUsers: 0,
      };
    }

    // Distribute ROI to eligible users (up to available pool)
    let totalDistributedThisRound = 0;
    let usersCredited = 0;

    await prisma.$transaction(async (tx) => {
      for (const user of eligibleUsers) {
        // Only distribute if pool has funds available
        if (availablePool - totalDistributedThisRound <= 0) {
          console.log(`[GLOBAL_POOL] Pool exhausted. Stopping distribution.`);
          break;
        }

        // Calculate amount to credit (min of amount needed and remaining pool)
        const remainingPool = availablePool - totalDistributedThisRound;
        const amountToCredit = Math.min(user.amountNeeded, remainingPool);

        if (amountToCredit > 0) {
          await tx.earning.create({
            data: {
              userId: user.id,
              amount: amountToCredit,
              type: 'GLOBAL_POOL_ROI',
              description: `Global pool top-up to reach ₦10,000 (AFFILIATE: ₦${user.affiliateTotal}, GLOBAL_POOL: ₦${user.globalPoolTotal})`,
            },
          });
          
          // Increment user's balance
          await tx.user.update({
            where: { id: user.id },
            data: {
              balance: {
                increment: amountToCredit,
              },
            },
          });

          totalDistributedThisRound += amountToCredit;
          usersCredited++;
          console.log(`[GLOBAL_POOL] Credited user ${user.id}: ₦${amountToCredit} (needed: ₦${user.amountNeeded}, combined total was: ₦${user.combinedTotal})`);
        }
      }
    });

    console.log(`[GLOBAL_POOL] Distribution completed: ₦${totalDistributedThisRound} distributed to ${usersCredited} users`);

    return {
      success: true,
      message: 'Global pool ROI distributed successfully',
      availablePool: availablePool,
      eligibleUsers: eligibleUsers.length,
      usersCredited: usersCredited,
      totalDistributed: totalDistributedThisRound,
      totalNeeded: totalNeeded,
    };
  } catch (error) {
    console.error('[GLOBAL_POOL] Distribution error:', error);
    throw error;
  }
}

/**
 * Quarterly Premium ROI distribution
 * Distributes ROI to premium tier users
 */
export async function distributePremiumROI() {
  try {
    const premiumUsers = await prisma.user.findMany({
      where: {
        isPremium: true,
        emailVerified: true,
      },
      include: {
        investments: {
          where: {
            tier: 'PREMIUM',
            status: 'completed',
          },
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      for (const user of premiumUsers) {
        // Calculate ROI based on total investments (example: 10% quarterly)
        const totalInvestment = user.investments.reduce(
          (sum, inv) => sum + Number(inv.amount),
          0
        );
        const quarterlyROI = totalInvestment * 0.1; // 10% quarterly

        if (quarterlyROI > 0) {
          await tx.earning.create({
            data: {
              userId: user.id,
              amount: quarterlyROI,
              type: 'PREMIUM_ROI',
              description: 'Quarterly premium ROI distribution',
            },
          });
          
          // Increment user's balance
          await tx.user.update({
            where: { id: user.id },
            data: {
              balance: {
                increment: quarterlyROI,
              },
            },
          });
        }
      }
    });

    console.log(`Distributed premium ROI to ${premiumUsers.length} users`);
  } catch (error) {
    console.error('Premium ROI distribution error:', error);
    throw error;
  }
}

// Export for cron job setup
export default {
  distributeGlobalPoolROI,
  distributePremiumROI,
};

