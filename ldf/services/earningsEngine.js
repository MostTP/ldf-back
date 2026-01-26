import { User, Earning } from '../models/index.js';
import { getUplineHierarchy } from '../utils/matrixService.js';

/**
 * Trigger activation payouts for a new user activation
 * All payouts happen in a single transaction
 * @param {number} newUserId - The newly activated user ID
 * @param {number} activationAmount - Total activation amount (₦50)
 * @returns {Promise<Object>} Result of the payout operation
 */
export async function triggerActivationPayouts(newUserId, activationAmount = 50, session = null) {
  const user = await User.findById(newUserId).session(session);
  if (!user) {
    throw new Error('User not found');
  }

  const payouts = [];

  if (user.sponsorId) {
    const referralEarning = await Earning.create([{
      userId: user.sponsorId,
      amount: 1000,
      type: 'REFERRAL_BONUS',
      description: `Referral bonus for ${user.firstName} ${user.lastName}`,
    }], { session });
    
    await User.findByIdAndUpdate(user.sponsorId, {
      $inc: { balance: 1000 },
    }, { session });
    
    payouts.push(referralEarning[0]);
  }

  const poolEarning = await Earning.create([{
    userId: newUserId,
    amount: 1000,
    type: 'GLOBAL_POOL_CONTRIBUTION',
    description: 'Global pool contribution from activation',
  }], { session });
  payouts.push(poolEarning[0]);

  const opsEarning = await Earning.create([{
    userId: newUserId,
    amount: 500,
    type: 'OPERATIONS_COST',
    description: 'Operations cost allocation',
  }], { session });
  payouts.push(opsEarning[0]);

  const matrixAmounts = [200, 100, 70, 60, 70];
  
  if (user.sponsorId) {
    const upline = await getUplineHierarchy(user.sponsorId.toString(), session);
    
    for (let i = 0; i < Math.min(upline.length, 5); i++) {
      const level = i + 1;
      const sponsorId = upline[i];
      const amount = matrixAmounts[i];

      const matrixEarning = await Earning.create([{
        userId: sponsorId,
        amount: amount,
        type: `MATRIX_LEVEL_${level}`,
        description: `Matrix level ${level} bonus for ${user.firstName} ${user.lastName}`,
      }], { session });
      
      await User.findByIdAndUpdate(sponsorId, {
        $inc: { balance: amount },
      }, { session });
      
      payouts.push(matrixEarning[0]);
    }
  }

  const totalAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    success: true,
    payouts: payouts.length,
    totalAmount: totalAmount,
  };
}

