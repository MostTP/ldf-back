import { User, Coupon } from '../models/index.js';
import { triggerActivationPayouts } from './earningsEngine.js';
import mongoose from 'mongoose';

/**
 * Activate a user with a coupon
 * Validates coupon, marks as used, and triggers payouts
 * @param {number} userId - User ID to activate
 * @param {string} couponCode - Coupon code to use
 * @returns {Promise<Object>} Activation result
 */
export async function activateUser(userId, couponCode) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).populate('sponsorId').session(session);
    if (!user) {
      throw new Error('User not found');
    }

    const coupon = await Coupon.findOne({ code: couponCode }).populate('agentId').session(session);
    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    if (coupon.isUsed) {
      throw new Error('Coupon has already been used');
    }

    await Coupon.findByIdAndUpdate(coupon._id, {
      isUsed: true,
      usedBy: userId,
      usedAt: new Date(),
    }, { session });

    const payoutResult = await triggerActivationPayouts(userId, 50, session);

    await session.commitTransaction();

    return {
      success: true,
      message: 'Activation successful',
      couponId: coupon._id.toString(),
      payouts: payoutResult,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

