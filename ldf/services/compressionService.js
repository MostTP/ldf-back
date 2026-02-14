import { User, Earning } from '../models/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';


  /**
  * @param {Date} currentDate 
 */
export async function checkAndMarkInactiveUsers(currentDate = new Date()) {
  logger.info('[COMPRESSION] Checking for inactive users (expired subscriptions)');
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const inactiveUsers = await User.find({
      $or: [
        { subscriptionExpiresAt: { $lt: currentDate } },
        { isActive: false },
      ],
      isActive: { $ne: false },
    }).session(session);

    logger.info(`[COMPRESSION] Found ${inactiveUsers.length} users with expired subscriptions`);

    let totalCompressedAmount = 0;
    const compressedUsers = [];

    for (const user of inactiveUsers) {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const monthlyMatrixEarnings = await Earning.aggregate([
        {
          $match: {
            userId: user._id,
            type: { $regex: /^MATRIX_LEVEL_/ },
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]).session(session);

      const monthlyEarnings = monthlyMatrixEarnings[0]?.total || 0;

      if (monthlyEarnings > 0) {
        await User.findByIdAndUpdate(user._id, {
          isActive: false,
        }, { session });

        await Earning.create([{
          userId: null,
          amount: monthlyEarnings,
          type: 'GLOBAL_POOL_COMPRESSION',
          description: `Compressed earnings from inactive user ${user.username} (${user._id}) - ₦${monthlyEarnings}`,
        }], { session });

        totalCompressedAmount += monthlyEarnings;
        compressedUsers.push({
          userId: user._id.toString(),
          username: user.username,
          amount: monthlyEarnings,
        });

        logger.info(`[COMPRESSION] Compressed ₦${monthlyEarnings} from inactive user ${user.username}`);
      } else {
        await User.findByIdAndUpdate(user._id, {
          isActive: false,
        }, { session });
      }
    }

    await session.commitTransaction();
    logger.info(`[COMPRESSION] ✓ Compression complete: ₦${totalCompressedAmount} diverted to Global Safety Pool from ${compressedUsers.length} users`);

    return {
      success: true,
      totalCompressedAmount,
      compressedUsers,
      inactiveUsersCount: inactiveUsers.length,
    };
  } catch (error) {
    logger.error('[COMPRESSION] Error during compression:', error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
  * @param {string} userId
 * @param {number} subscriptionDays
 * @returns {Promise<Object>}
 */
export async function reactivateUser(userId, subscriptionDays = 30) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + subscriptionDays);

    await User.findByIdAndUpdate(userId, {
      isActive: true,
      subscriptionExpiresAt: expiresAt,
    }, { session });

    await session.commitTransaction();
    logger.info(`[COMPRESSION] User ${userId} reactivated, subscription expires ${expiresAt}`);

    return {
      success: true,
      expiresAt,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

