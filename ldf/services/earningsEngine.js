import { User, Earning } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { getMatrixFillStatus, getLevelFromPosition } from './matrixPlacementService.js';
import mongoose from 'mongoose';

/**
 * Get the first user in the system (by creation date)
 * This user receives commissions for orphaned signups (users without sponsors)
 * @param {object} session - MongoDB session
 * @returns {Promise<string|null>} First user ID or null if no users exist
 */
async function getFirstUser(session = null) {
  try {
    let query = User.findOne().sort({ createdAt: 1 }).select('_id');
    if (session) query = query.session(session);
    const firstUser = await query;
    return firstUser ? firstUser._id.toString() : null;
  } catch (error) {
    logger.error('[EARNINGS FLOW] Error finding first user:', error);
    return null;
  }
}

/**
 * @param {string} userId 
 * @param {ObjectId} excludeUserId 
 * @param {object} session
 * @returns {Promise<number>}
 */
async function getTotalMatrixUsers(userId, excludeUserId = null, session = null) {
  try {
    const fillStatus = await getMatrixFillStatus(userId, session);
    
    if (excludeUserId) {
      const matrix = fillStatus.matrix;
      
      let count = 0;
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[i] !== null && matrix[i] !== excludeUserId.toString()) {
          count++;
        }
      }
      return count;
    }
    
    return fillStatus.totalFilled;
  } catch (error) {
    logger.error(`[EARNINGS FLOW] Error getting total matrix users: ${error.message}`);
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

  // Determine sponsor: use user's sponsorId, or fallback to first user in system
  let sponsorId = user.sponsorId;
  let isOrphanedUser = false;
  
  if (!sponsorId) {
    const firstUserId = await getFirstUser(session);
    // Only assign to first user if it's not the same as the activating user
    if (firstUserId && firstUserId !== newUserId.toString()) {
      sponsorId = firstUserId;
      isOrphanedUser = true;
      logger.info(`[EARNINGS FLOW] No sponsor found, allocating commission to first user in system: ${sponsorId}`);
    } else {
      logger.warn(`[EARNINGS FLOW] No sponsor found and first user is the activating user, skipping REFERRAL_BONUS`);
    }
  }

  if (sponsorId) {
    const sponsor = await User.findById(sponsorId).select('firstName lastName username').session(session);
    const bonusDescription = isOrphanedUser 
      ? `Referral bonus for ${user.firstName} ${user.lastName} (orphaned signup - allocated to first user)`
      : `Referral bonus for ${user.firstName} ${user.lastName}`;
    
    logger.info(`[EARNINGS FLOW] Creating REFERRAL_BONUS: ₦2,500 for sponsor ${sponsor?.username || sponsorId}`);
    
    const referralEarning = await Earning.create([{
      userId: sponsorId,
      amount: 2500,
      type: 'REFERRAL_BONUS',
      description: bonusDescription,
      metadata: { isOrphanedUser },
    }], { session });
    
    await User.findByIdAndUpdate(sponsorId, {
      $inc: { balance: 2500 },
    }, { session });
    
    logger.info(`[EARNINGS FLOW] ✓ REFERRAL_BONUS created: Earning ID ${referralEarning[0]._id}, User balance updated`);
    payouts.push(referralEarning[0]);
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
  
  // Use sponsorId (either from user or first user fallback)
  if (sponsorId) {
    const sponsorDescription = isOrphanedUser ? 'first user (orphaned signup)' : 'direct sponsor';
    logger.info(`[EARNINGS FLOW] Processing matrix level bonus for ${sponsorDescription}`);
    
    const newUserObjectId = mongoose.Types.ObjectId.isValid(newUserId) 
      ? new mongoose.Types.ObjectId(newUserId) 
      : newUserId;
    
    const totalMatrixUsers = await getTotalMatrixUsers(sponsorId, newUserObjectId, session);
    
    logger.info(`[EARNINGS FLOW] Sponsor ${sponsorId} has ${totalMatrixUsers} total matrix users (direct + spillover, excluding new user ${newUserId})`);
    
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
      const sponsor = await User.findById(sponsorId).select('username').session(session);
      const matrixDescription = isOrphanedUser
        ? `Matrix level ${matrixLevel} bonus for ${user.firstName} ${user.lastName} (position #${referralPosition}, Force C - Orphaned Signup allocated to first user)`
        : `Matrix level ${matrixLevel} bonus for ${user.firstName} ${user.lastName} (position #${referralPosition}, Force C - Direct Referral)`;
      
      logger.info(`[EARNINGS FLOW] Sponsor ${sponsor?.username || sponsorId} has ${totalMatrixUsers} total matrix users. New referral is #${referralPosition}, placing them in Level ${matrixLevel} → ₦${matrixAmount}`);

      const isForceC = true;
      
      const sponsorDirectCount = await User.countDocuments({ 
        sponsorId: sponsorId 
      }).session(session);

      const matrixEarning = await Earning.create([{
        userId: sponsorId,
        amount: matrixAmount,
        type: `MATRIX_LEVEL_${matrixLevel}`,
        description: matrixDescription,
        metadata: { forceType: 'C', isDirectReferral: !isOrphanedUser, isOrphanedUser },
      }], { session });
      
      if (isForceC) {
        await User.findByIdAndUpdate(sponsorId, {
          $inc: { balance: matrixAmount },
        }, { session });
        logger.info(`[EARNINGS FLOW] Force C (Direct Referral) bonus added to main balance: ₦${matrixAmount}`);
      } else {
        if (sponsorDirectCount >= 2) {
          await User.findByIdAndUpdate(sponsorId, {
        $inc: { balance: matrixAmount },
      }, { session });
          logger.info(`[EARNINGS FLOW] Force A/B bonus added to main balance (sponsor has ${sponsorDirectCount} direct referrals)`);
        } else {
          await User.findByIdAndUpdate(sponsorId, {
            $inc: { pendingBalance: matrixAmount },
          }, { session });
          logger.info(`[EARNINGS FLOW] Force A/B bonus added to pending balance (sponsor has ${sponsorDirectCount} direct referrals, needs 2 to unlock)`);
        }
      }
      
      logger.info(`[EARNINGS FLOW] ✓ MATRIX_LEVEL_${matrixLevel} created: Earning ID ${matrixEarning[0]._id}, Sponsor balance updated by ₦${matrixAmount}`);
      payouts.push(matrixEarning[0]);

      const { getUplineHierarchy } = await import('../utils/matrixService.js');
      const uplineChain = await getUplineHierarchy(sponsorId, session);
      
      for (const uplineUserId of uplineChain) {
        const uplineMatrix = await getMatrixFillStatus(uplineUserId, session);
        const newUserPosition = uplineMatrix.matrix.indexOf(newUserId.toString());
        
        if (newUserPosition !== -1) {
          const uplineLevel = getLevelFromPosition(newUserPosition);
          const uplineMatrixLevels = [
            { start: 1, end: 5, amount: 100 },
            { start: 6, end: 30, amount: 70 },
            { start: 31, end: 155, amount: 60 },
            { start: 156, end: 780, amount: 70 },
            { start: 781, end: 3905, amount: 200 },
          ];
          
          const uplineBonus = uplineMatrixLevels[uplineLevel.level - 1]?.amount || 0;
          
          if (uplineBonus > 0) {
            const isUplineDirectReferral = sponsorId && sponsorId.toString() === uplineUserId.toString();
            const isForceC = false;
            
            const uplineDirectCount = await User.countDocuments({ 
              sponsorId: uplineUserId 
            }).session(session);
            
            const forceType = isUplineDirectReferral ? 'A' : 'B';
            const forceDescription = forceType === 'A' ? 'Force A - Spillover' : 'Force B - Spill-Under';
            
            const uplineEarning = await Earning.create([{
              userId: uplineUserId,
              amount: uplineBonus,
              type: `MATRIX_LEVEL_${uplineLevel.level}`,
              description: `Matrix level ${uplineLevel.level} bonus (upline) for ${user.firstName} ${user.lastName} (position #${newUserPosition + 1}, ${forceDescription})`,
              metadata: { forceType, isDirectReferral: isUplineDirectReferral },
            }], { session });
            
            if (uplineDirectCount >= 2) {
              await User.findByIdAndUpdate(uplineUserId, {
                $inc: { balance: uplineBonus },
              }, { session });
              logger.info(`[EARNINGS FLOW] ${forceDescription} bonus added to main balance (upline has ${uplineDirectCount} direct referrals)`);
            } else {
              await User.findByIdAndUpdate(uplineUserId, {
                $inc: { pendingBalance: uplineBonus },
              }, { session });
              logger.info(`[EARNINGS FLOW] ${forceDescription} bonus added to pending balance (upline has ${uplineDirectCount} direct referrals, needs 2 to unlock)`);
            }
            
            logger.info(`[EARNINGS FLOW] ✓ Upline ${uplineUserId} earned ₦${uplineBonus} (Level ${uplineLevel.level})`);
            payouts.push(uplineEarning[0]);
          }
        }
      }
    } else {
      logger.warn(`[EARNINGS FLOW] Referral position ${referralPosition} exceeds maximum matrix levels (3905) or invalid level, no matrix bonus paid`);
    }
  }

  const totalAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
  logger.info(`[EARNINGS FLOW] ✓ Payouts complete: ${payouts.length} earnings created, Total: ₦${totalAmount}`);

  return {
    success: true,
    payouts: payouts.length,
    totalAmount: totalAmount,
  };
}

