import { User, Coupon } from '../models/index.js';
import { triggerActivationPayouts } from './earningsEngine.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Activate a user with a coupon
 * Validates coupon, marks as used, and triggers payouts
 * @param {number} userId - User ID to activate
 * @param {string} couponCode - Coupon code to use
 * @returns {Promise<Object>} Activation result
 */
export async function activateUser(userId, couponCode) {
  logger.info(`[ACTIVATION] Starting activation for user ${userId} with coupon ${couponCode}`);
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).populate('sponsorId').session(session);
    if (!user) {
      logger.error(`[ACTIVATION] User not found: ${userId}`);
      throw new Error('User not found');
    }

    logger.info(`[ACTIVATION] User found: ${user.firstName} ${user.lastName} (${user.username})`);

    const coupon = await Coupon.findOne({ code: couponCode }).populate('agentId').session(session);
    if (!coupon) {
      logger.error(`[ACTIVATION] Invalid coupon code: ${couponCode}`);
      throw new Error('Invalid coupon code');
    }

    logger.info(`[ACTIVATION] Coupon found: ${couponCode}, Agent: ${coupon.agentId?.username || coupon.agentId}`);

    if (coupon.isUsed) {
      logger.error(`[ACTIVATION] Coupon already used: ${couponCode}`);
      throw new Error('Coupon has already been used');
    }

    logger.info(`[ACTIVATION] Marking coupon as used`);
    await Coupon.findByIdAndUpdate(coupon._id, {
      isUsed: true,
      usedBy: userId,
      usedAt: new Date(),
    }, { session });

    logger.info(`[ACTIVATION] Triggering earnings payouts`);
    const payoutResult = await triggerActivationPayouts(userId, 50, session);
    logger.info(`[ACTIVATION] Earnings payouts completed: ${payoutResult.payouts} payouts, Total: ₦${payoutResult.totalAmount}`);

    await session.commitTransaction();
    logger.info(`[ACTIVATION] ✓ Activation successful for user ${userId}`);

    return {
      success: true,
      message: 'Activation successful',
      couponId: coupon._id.toString(),
      payouts: payoutResult,
    };
  } catch (error) {
    logger.error(`[ACTIVATION] Activation failed for user ${userId}:`, error.message);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

