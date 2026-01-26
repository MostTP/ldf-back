import { User, Earning } from '../models/index.js';
import { getUplineHierarchy } from '../utils/matrixService.js';
import { logger } from '../utils/logger.js';

/**
 * Trigger activation payouts for a new user activation
 * All payouts happen in a single transaction
 * @param {number} newUserId - The newly activated user ID
 * @param {number} activationAmount - Total activation amount (₦50)
 * @returns {Promise<Object>} Result of the payout operation
 */
export async function triggerActivationPayouts(newUserId, activationAmount = 50, session = null) {
  logger.info(`[EARNINGS FLOW] Starting activation payouts for user ${newUserId}, activation amount: ₦${activationAmount}`);
  
  const user = await User.findById(newUserId).session(session);
  if (!user) {
    logger.error(`[EARNINGS FLOW] User not found: ${newUserId}`);
    throw new Error('User not found');
  }

  logger.info(`[EARNINGS FLOW] Processing payouts for: ${user.firstName} ${user.lastName} (${user.username})`);
  
  const payouts = [];

  // Referral Bonus
  if (user.sponsorId) {
    const sponsor = await User.findById(user.sponsorId).select('firstName lastName username').session(session);
    logger.info(`[EARNINGS FLOW] Creating REFERRAL_BONUS: ₦1,000 for sponsor ${sponsor?.username || user.sponsorId}`);
    
    const referralEarning = await Earning.create([{
      userId: user.sponsorId,
      amount: 1000,
      type: 'REFERRAL_BONUS',
      description: `Referral bonus for ${user.firstName} ${user.lastName}`,
    }], { session });
    
    await User.findByIdAndUpdate(user.sponsorId, {
      $inc: { balance: 1000 },
    }, { session });
    
    logger.info(`[EARNINGS FLOW] ✓ REFERRAL_BONUS created: Earning ID ${referralEarning[0]._id}, User balance updated`);
    payouts.push(referralEarning[0]);
  } else {
    logger.info(`[EARNINGS FLOW] No sponsor found, skipping REFERRAL_BONUS`);
  }

  // Global Pool Contribution
  logger.info(`[EARNINGS FLOW] Creating GLOBAL_POOL_CONTRIBUTION: ₦1,000 for new user`);
  const poolEarning = await Earning.create([{
    userId: newUserId,
    amount: 1000,
    type: 'GLOBAL_POOL_CONTRIBUTION',
    description: 'Global pool contribution from activation',
  }], { session });
  logger.info(`[EARNINGS FLOW] ✓ GLOBAL_POOL_CONTRIBUTION created: Earning ID ${poolEarning[0]._id}`);
  payouts.push(poolEarning[0]);

  // Operations Cost
  logger.info(`[EARNINGS FLOW] Creating OPERATIONS_COST: ₦500 for new user`);
  const opsEarning = await Earning.create([{
    userId: newUserId,
    amount: 500,
    type: 'OPERATIONS_COST',
    description: 'Operations cost allocation',
  }], { session });
  logger.info(`[EARNINGS FLOW] ✓ OPERATIONS_COST created: Earning ID ${opsEarning[0]._id}`);
  payouts.push(opsEarning[0]);

  // Matrix Level Bonuses
  const matrixAmounts = [200, 100, 70, 60, 70];
  
  if (user.sponsorId) {
    logger.info(`[EARNINGS FLOW] Processing matrix level bonuses`);
    const upline = await getUplineHierarchy(user.sponsorId.toString(), session);
    logger.info(`[EARNINGS FLOW] Found ${upline.length} upline members, processing up to 5 levels`);
    
    for (let i = 0; i < Math.min(upline.length, 5); i++) {
      const level = i + 1;
      const sponsorId = upline[i];
      const amount = matrixAmounts[i];
      
      const sponsor = await User.findById(sponsorId).select('username').session(session);
      logger.info(`[EARNINGS FLOW] Creating MATRIX_LEVEL_${level}: ₦${amount} for ${sponsor?.username || sponsorId}`);

      const matrixEarning = await Earning.create([{
        userId: sponsorId,
        amount: amount,
        type: `MATRIX_LEVEL_${level}`,
        description: `Matrix level ${level} bonus for ${user.firstName} ${user.lastName}`,
      }], { session });
      
      await User.findByIdAndUpdate(sponsorId, {
        $inc: { balance: amount },
      }, { session });
      
      logger.info(`[EARNINGS FLOW] ✓ MATRIX_LEVEL_${level} created: Earning ID ${matrixEarning[0]._id}, User balance updated`);
      payouts.push(matrixEarning[0]);
    }
  } else {
    logger.info(`[EARNINGS FLOW] No sponsor found, skipping matrix level bonuses`);
  }

  const totalAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
  logger.info(`[EARNINGS FLOW] ✓ Payouts complete: ${payouts.length} earnings created, Total: ₦${totalAmount}`);

  return {
    success: true,
    payouts: payouts.length,
    totalAmount: totalAmount,
  };
}

