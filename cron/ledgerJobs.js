import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Monthly Global Pool ROI distribution
 * Distributes ROI from global pool to all active users
 */
export async function distributeGlobalPoolROI() {
  try {
    // Get all active users (email verified)
    const users = await prisma.user.findMany({
      where: {
        emailVerified: true,
      },
      select: { id: true },
    });

    // Calculate ROI per user (example: 5% of pool)
    // In production, implement proper pool calculation
    const roiPerUser = 100; // Example amount

    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        await tx.earning.create({
          data: {
            userId: user.id,
            amount: roiPerUser,
            type: 'GLOBAL_POOL_ROI',
            description: 'Monthly global pool ROI distribution',
          },
        });
      }
    });

    console.log(`Distributed global pool ROI to ${users.length} users`);
  } catch (error) {
    console.error('Global pool ROI distribution error:', error);
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

