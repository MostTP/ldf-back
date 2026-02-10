import { User, Earning } from '../models/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * @param {string} userId 
 * @param {ObjectId} excludeUserId 
 * @param {object} session
 * @returns {Promise<number>} 
 */
async function getTotalMatrixUsers(userId, excludeUserId = null, session = null) {
  const maxLevels = 5;
  let totalCount = 0;
  
  const currentUser = await User.findById(userId).select('sponsorId').session(session);
  if (!currentUser) {
    return 0;
  }

  let uplineSpilloverCount = 0;
  if (currentUser.sponsorId) {
    const uplineDirectReferrals = await User.find({ sponsorId: currentUser.sponsorId })
      .select('_id')
      .sort({ createdAt: 1 })
      .session(session);
    
    const uplineSpillover = uplineDirectReferrals.slice(5);
    uplineSpilloverCount = Math.min(uplineSpillover.length, 5);
  }
  
  const level1Query = { sponsorId: userId };
  if (excludeUserId) {
    level1Query._id = { $ne: excludeUserId };
  }
  const allDirectReferrals = await User.find(level1Query).select('_id').sort({ createdAt: 1 }).session(session);
  
  const availableSlots = 5 - uplineSpilloverCount;
  
  const directReferralsInLevel1 = allDirectReferrals.slice(0, availableSlots);
  
  const level1Count = uplineSpilloverCount + directReferralsInLevel1.length;
  totalCount += level1Count;
  
  if (level1Count === 0) {
    return totalCount;
  }

  const level1UserIds = [];
  
  if (currentUser.sponsorId) {
    const uplineDirectReferrals = await User.find({ sponsorId: currentUser.sponsorId })
      .select('_id')
      .sort({ createdAt: 1 })
      .session(session);
    const uplineSpillover = uplineDirectReferrals.slice(5, 5 + uplineSpilloverCount);
    level1UserIds.push(...uplineSpillover.map(u => u._id));
  }
  
  level1UserIds.push(...directReferralsInLevel1.map(u => u._id));
  
  let level2Users = [];
  if (level1UserIds.length > 0) {
    for (const level1UserId of level1UserIds) {
      const level1UserDirectReferrals = await User.find({ sponsorId: level1UserId })
        .select('_id')
        .sort({ createdAt: 1 })
        .limit(5)
        .session(session);
      level2Users.push(...level1UserDirectReferrals);
    }
  }
  
  const userSpillover = allDirectReferrals.slice(availableSlots);
  level2Users.push(...userSpillover);
  
  const level2Count = level2Users.length;
  totalCount += level2Count;
  
  let currentLevelUsers = level2Users;
  
  for (let level = 2; level < maxLevels; level++) {
    if (currentLevelUsers.length === 0) {
      break;
    }
    
    const currentLevelIds = currentLevelUsers.map(u => u._id);
    const nextLevelUsers = await User.find({ 
      sponsorId: { $in: currentLevelIds } 
    }).select('_id').session(session);
    
    totalCount += nextLevelUsers.length;
    currentLevelUsers = nextLevelUsers;
  }
  
  return totalCount;
}

/**
 * @param {number} newUserId 
 * @param {number} activationAmount 
 * @returns {Promise<Object>}
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

  logger.info(`[EARNINGS FLOW] Creating GLOBAL_POOL_CONTRIBUTION: ₦1,000 for new user`);
  const poolEarning = await Earning.create([{
    userId: newUserId,
    amount: 1000,
    type: 'GLOBAL_POOL_CONTRIBUTION',
    description: 'Global pool contribution from activation',
  }], { session });
  logger.info(`[EARNINGS FLOW] ✓ GLOBAL_POOL_CONTRIBUTION created: Earning ID ${poolEarning[0]._id}`);
  payouts.push(poolEarning[0]);

  logger.info(`[EARNINGS FLOW] Creating OPERATIONS_COST: ₦500 for new user`);
  const opsEarning = await Earning.create([{
    userId: newUserId,
    amount: 500,
    type: 'OPERATIONS_COST',
    description: 'Operations cost allocation',
  }], { session });
  logger.info(`[EARNINGS FLOW] ✓ OPERATIONS_COST created: Earning ID ${opsEarning[0]._id}`);
  payouts.push(opsEarning[0]);

  const matrixLevels = [
    { start: 1, end: 5, amount: 100 },    
    { start: 6, end: 30, amount: 70 },    
    { start: 31, end: 155, amount: 60 },  
    { start: 156, end: 780, amount: 70 },   
    { start: 781, end: 3905, amount: 200 }, 
  ];
  
  if (user.sponsorId) {
    logger.info(`[EARNINGS FLOW] Processing matrix level bonus for direct sponsor`);
    
    const newUserObjectId = mongoose.Types.ObjectId.isValid(newUserId) 
      ? new mongoose.Types.ObjectId(newUserId) 
      : newUserId;
    
    const totalMatrixUsers = await getTotalMatrixUsers(user.sponsorId, newUserObjectId, session);
    
    logger.info(`[EARNINGS FLOW] Sponsor ${user.sponsorId} has ${totalMatrixUsers} total matrix users (direct + spillover, excluding new user ${newUserId})`);
    
    const referralPosition = totalMatrixUsers + 1;
    
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

