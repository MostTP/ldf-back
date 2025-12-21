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
  console.log(`[ACTIVATION] Starting activation for user ${userId} with coupon ${couponCode}`);
  
  return await prisma.$transaction(async (tx) => {
    // Validate user exists
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { sponsor: true },
    });

    if (!user) {
      console.error(`[ACTIVATION] User ${userId} not found`);
      throw new Error('User not found');
    }

    console.log(`[ACTIVATION] User found: ${user.firstName} ${user.lastName}, Sponsor: ${user.sponsorId || 'None'}`);

    // Validate coupon
    const coupon = await tx.coupon.findUnique({
      where: { code: couponCode },
      include: { agent: true },
    });

    if (!coupon) {
      console.error(`[ACTIVATION] Invalid coupon code: ${couponCode}`);
      throw new Error('Invalid coupon code');
    }

    if (coupon.isUsed) {
      console.error(`[ACTIVATION] Coupon ${couponCode} already used`);
      throw new Error('Coupon has already been used');
    }

    console.log(`[ACTIVATION] Coupon validated: ${couponCode} from agent ${coupon.agentId}`);

    // Mark coupon as used
    await tx.coupon.update({
      where: { id: coupon.id },
      data: {
        isUsed: true,
        usedBy: userId,
        usedAt: new Date(),
      },
    });

    console.log(`[ACTIVATION] Coupon marked as used, triggering payouts...`);

    // Trigger payouts
    const payoutResult = await triggerActivationPayouts(userId, 50);
    
    console.log(`[ACTIVATION] Payouts completed:`, payoutResult);

    return {
      success: true,
      message: 'Activation successful',
      couponId: coupon.id,
      payouts: payoutResult,
    };
  });
}

