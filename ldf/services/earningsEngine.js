import { User, Earning } from '../models/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Count total matrix users (direct referrals + spillovers) for a user
 * @param {string} userId - The user ID to count matrix users for
 * @param {ObjectId} excludeUserId - User ID to exclude from count (the new user being added)
 * @param {object} session - MongoDB session
 * @returns {Promise<number>} Total count of matrix users (excluding the new user)
 */
async function getTotalMatrixUsers(userId, excludeUserId = null, session = null) {
  const maxLevels = 5;
  let totalCount = 0;
  
  // Level 1: Direct referrals only (exclude the new user if provided)
  const level1Query = { sponsorId: userId };
  if (excludeUserId) {
    level1Query._id = { $ne: excludeUserId };
  }
  const level1Users = await User.find(level1Query).select('_id').session(session);
  totalCount += level1Users.length;
  
  if (level1Users.length === 0) {
    return totalCount;
  }

  // For levels 2-5, count all users in that level's positions (includes spillovers)
  // Note: The new user is always a direct referral (Level 1), so we don't need to exclude them from deeper levels
  let currentLevelUsers = level1Users;
  
  for (let level = 1; level < maxLevels; level++) {
    const currentLevelIds = currentLevelUsers.map(u => u._id);
    
    if (currentLevelIds.length === 0) {
      break;
    }
    
    // Get all direct referrals of users in current level (this includes spillovers)
    const nextLevelUsers = await User.find({ 
      sponsorId: { $in: currentLevelIds } 
    }).select('_id').session(session);
    
    totalCount += nextLevelUsers.length;
    currentLevelUsers = nextLevelUsers;
  }
  
  return totalCount;
}

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
    logger.info(`[EARNINGS FLOW] Creating REFERRAL_BONUS: ₦2,500 for sponsor ${sponsor?.username || user.sponsorId}`);
    
    const referralEarning = await Earning.create([{
      userId: user.sponsorId,
      amount: 2500,
      type: 'REFERRAL_BONUS',
      description: `Referral bonus for ${user.firstName} ${user.lastName}`,
    }], { session });
    
    await User.findByIdAndUpdate(user.sponsorId, {
      $inc: { balance: 2500 },
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

  // Matrix Level Bonuses - Based on total matrix users (direct referrals + spillovers)
  // When you refer someone, you get matrix income immediately based on your total matrix count
  // Level 1: First 5 users (direct + spillover) → ₦100 each
  // Level 2: Next 25 (6th-30th) → ₦70 each
  // Level 3: Next 125 (31st-155th) → ₦60 each
  // Level 4: Next 625 (156th-780th) → ₦70 each
  // Level 5: Next 3125 (781st-3905th) → ₦200 each
  const matrixLevels = [
    { start: 1, end: 5, amount: 100 },      // Level 1: positions 1-5
    { start: 6, end: 30, amount: 70 },     // Level 2: positions 6-30
    { start: 31, end: 155, amount: 60 },   // Level 3: positions 31-155
    { start: 156, end: 780, amount: 70 },   // Level 4: positions 156-780
    { start: 781, end: 3905, amount: 200 }, // Level 5: positions 781-3905
  ];
  
  if (user.sponsorId) {
    logger.info(`[EARNINGS FLOW] Processing matrix level bonus for direct sponsor`);
    
    // Ensure newUserId is an ObjectId for proper comparison
    const newUserObjectId = mongoose.Types.ObjectId.isValid(newUserId) 
      ? new mongoose.Types.ObjectId(newUserId) 
      : newUserId;
    
    // Count total matrix users (direct referrals + spillovers) excluding this new user
    const totalMatrixUsers = await getTotalMatrixUsers(user.sponsorId, newUserObjectId, session);
    
    logger.info(`[EARNINGS FLOW] Sponsor ${user.sponsorId} has ${totalMatrixUsers} total matrix users (direct + spillover, excluding new user ${newUserId})`);
    
    // This new referral will be at position (totalMatrixUsers + 1)
    const referralPosition = totalMatrixUsers + 1;
    
    // Determine which matrix level this referral falls into
    let matrixLevel = 0;
    let matrixAmount = 0;
    
    for (let i = 0; i < matrixLevels.length; i++) {
      if (referralPosition >= matrixLevels[i].start && referralPosition <= matrixLevels[i].end) {
        matrixLevel = i + 1;
        matrixAmount = matrixLevels[i].amount;
        break;
      }
    }
    
    logger.info(`[EARNINGS FLOW] New referral position: ${referralPosition}, Matrix Level: ${matrixLevel}, Amount: ₦${matrixAmount}`);
    
    if (matrixLevel > 0 && matrixAmount > 0) {
      const sponsor = await User.findById(user.sponsorId).select('username').session(session);
      logger.info(`[EARNINGS FLOW] Sponsor ${sponsor?.username || user.sponsorId} has ${totalMatrixUsers} total matrix users. New referral is #${referralPosition}, placing them in Level ${matrixLevel} → ₦${matrixAmount}`);

      const matrixEarning = await Earning.create([{
        userId: user.sponsorId,
        amount: matrixAmount,
        type: `MATRIX_LEVEL_${matrixLevel}`,
        description: `Matrix level ${matrixLevel} bonus for ${user.firstName} ${user.lastName} (position #${referralPosition}, includes spillovers)`,
      }], { session });
      
      await User.findByIdAndUpdate(user.sponsorId, {
        $inc: { balance: matrixAmount },
      }, { session });
      
      logger.info(`[EARNINGS FLOW] ✓ MATRIX_LEVEL_${matrixLevel} created: Earning ID ${matrixEarning[0]._id}, Sponsor balance updated by ₦${matrixAmount}`);
      payouts.push(matrixEarning[0]);
    } else {
      logger.warn(`[EARNINGS FLOW] Referral position ${referralPosition} exceeds maximum matrix levels (3905) or invalid level, no matrix bonus paid`);
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

