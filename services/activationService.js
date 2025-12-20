import { PrismaClient } from '@prisma/client';
import { triggerActivationPayouts } from './earningsEngine.js';

const prisma = new PrismaClient();

/**
 * Activate a user with a coupon
 * Validates coupon, marks as used, and triggers payouts
 * @param {number} userId - User ID to activate
 * @param {string} couponCode - Coupon code to use
 * @returns {Promise<Object>} Activation result
 */
export async function activateUser(userId, couponCode) {
  return await prisma.$transaction(async (tx) => {
    // Validate user exists
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { sponsor: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate coupon
    const coupon = await tx.coupon.findUnique({
      where: { code: couponCode },
      include: { agent: true },
    });

    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    if (coupon.isUsed) {
      throw new Error('Coupon has already been used');
    }

    // Mark coupon as used
    await tx.coupon.update({
      where: { id: coupon.id },
      data: {
        isUsed: true,
        usedBy: userId,
        usedAt: new Date(),
      },
    });

    // Trigger payouts
    const payoutResult = await triggerActivationPayouts(userId, 50);

    return {
      success: true,
      message: 'Activation successful',
      couponId: coupon.id,
      payouts: payoutResult,
    };
  });
}

