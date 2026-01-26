import { User, Investment, Earning } from '../models/index.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Monthly Global Pool ROI distribution
 * Distributes ROI from global pool to eligible users
 * Eligibility: (AFFILIATE INCOME + GLOBAL_POOL_ROI) < ₦10,000
 * Distribution: Credit exact amount to bring total to ₦10,000
 */
export async function distributeGlobalPoolROI() {
  try {
    // Starting monthly distribution

    // Calculate available pool: Total Contributions - Total Distributions
    const totalContributionsResult = await Earning.aggregate([
      {
        $match: { type: 'GLOBAL_POOL_CONTRIBUTION' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalDistributedResult = await Earning.aggregate([
      {
        $match: { type: 'GLOBAL_POOL_ROI' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const contributionsAmount = totalContributionsResult[0]?.total || 0;
    const distributedAmount = totalDistributedResult[0]?.total || 0;
    
    const availablePool = contributionsAmount - distributedAmount;

    if (availablePool <= 0) {
      return {
        success: true,
        message: 'No available pool to distribute',
        availablePool: 0,
        eligibleUsers: 0,
      };
    }

    // Get all email-verified users
    const allUsers = await User.find({ emailVerified: true }).select('_id');

    // Calculate eligibility and distribution amounts for each user
    const eligibleUsers = [];
    let totalNeeded = 0;

    for (const user of allUsers) {
      const userId = user._id || user.id;
      
      // Get user's AFFILIATE INCOME (REFERRAL_BONUS)
      const affiliateEarningsResult = await Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: 'REFERRAL_BONUS'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Get user's GLOBAL_POOL_ROI earnings
      const globalPoolEarningsResult = await Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: 'GLOBAL_POOL_ROI'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const affiliateTotal = affiliateEarningsResult[0]?.total || 0;
      const globalPoolTotal = globalPoolEarningsResult[0]?.total || 0;

      const combinedTotal = affiliateTotal + globalPoolTotal;
      const targetAmount = 10000; // ₦10,000

      // User is eligible if combined total < ₦10,000
      if (combinedTotal < targetAmount) {
        const amountNeeded = targetAmount - combinedTotal;
        eligibleUsers.push({
          id: userId,
          affiliateTotal,
          globalPoolTotal,
          combinedTotal,
          amountNeeded,
        });
        totalNeeded += amountNeeded;
      }
    }

    if (eligibleUsers.length === 0) {
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const user of eligibleUsers) {
        // Only distribute if pool has funds available
        if (availablePool - totalDistributedThisRound <= 0) {
          break;
        }

        // Calculate amount to credit (min of amount needed and remaining pool)
        const remainingPool = availablePool - totalDistributedThisRound;
        const amountToCredit = Math.min(user.amountNeeded, remainingPool);

        if (amountToCredit > 0) {
          await Earning.create([{
            userId: user.id,
            amount: amountToCredit,
            type: 'GLOBAL_POOL_ROI',
            description: `Global pool top-up to reach ₦10,000 (AFFILIATE: ₦${user.affiliateTotal}, GLOBAL_POOL: ₦${user.globalPoolTotal})`,
          }], { session });
          
          // Increment user's balance
          await User.findByIdAndUpdate(
            user.id,
            { $inc: { balance: amountToCredit } },
            { session }
          );

          totalDistributedThisRound += amountToCredit;
          usersCredited++;
          console.log(`[GLOBAL_POOL] Credited user ${user.id}: ₦${amountToCredit} (needed: ₦${user.amountNeeded}, combined total was: ₦${user.combinedTotal})`);
        }
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

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
    logger.error('Global pool distribution error');
    throw error;
  }
}

/**
 * Quarterly Premium ROI distribution
 * Distributes ROI to premium tier users
 */
export async function distributePremiumROI() {
  try {
    const premiumUsers = await User.find({
      isPremium: true,
      emailVerified: true,
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const user of premiumUsers) {
        // Get user's premium investments
        const investments = await Investment.find({
          userId: user._id,
          tier: 'PREMIUM',
          status: 'completed',
        });

        // Calculate ROI based on total investments (example: 10% quarterly)
        const totalInvestment = investments.reduce(
          (sum, inv) => sum + Number(inv.amount),
          0
        );
        const quarterlyROI = totalInvestment * 0.1; // 10% quarterly

        if (quarterlyROI > 0) {
          await Earning.create([{
            userId: user._id,
            amount: quarterlyROI,
            type: 'PREMIUM_ROI',
            description: 'Quarterly premium ROI distribution',
          }], { session });
          
          // Increment user's balance
          await User.findByIdAndUpdate(
            user._id,
            { $inc: { balance: quarterlyROI } },
            { session }
          );
        }
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

    logger.info('Premium ROI distribution completed');
  } catch (error) {
    logger.error('Premium ROI distribution error');
    throw error;
  }
}

// Export for cron job setup
export default {
  distributeGlobalPoolROI,
  distributePremiumROI,
};


