import { User } from '../models/index.js';

/**
 * Get upline hierarchy for a user (up to 5 levels)
 * @param {number} userId - The user ID to trace from
 * @returns {Promise<number[]>} Array of sponsor IDs (0-5 levels)
 */
export async function getUplineHierarchy(userId, session = null) {
  const upline = [];
  let currentUserId = userId;
  let level = 0;
  const maxLevels = 5;

  while (level < maxLevels) {
    const user = await User.findById(currentUserId).select('sponsorId').session(session);
    if (!user || !user.sponsorId) {
      break;
    }

    upline.push(user.sponsorId.toString());
    currentUserId = user.sponsorId.toString();
    level++;
  }

  return upline;
}

/**
 * Get downline hierarchy for a user - finds all users who have the target user in their downline
 * and calculates the level at which the target user appears in each owner's matrix
 * @param {string} targetUserId - The user ID to find in downlines
 * @param {number} maxLevels - Maximum levels to search (default 5)
 * @param {object} session - MongoDB session
 * @returns {Promise<Array<{ownerId: string, level: number}>>} Array of owners with the level
 */
export async function getDownlineOwners(targetUserId, maxLevels = 5, session = null) {
  const owners = [];
  
  // Start from the target user and walk up the sponsor chain
  // For each user in the chain, we need to find all users who have them in their downline
  let currentUserId = targetUserId;
  const visitedOwners = new Set();
  
  // Walk up the sponsor chain to find all potential owners
  for (let depth = 0; depth < maxLevels; depth++) {
    const currentUser = await User.findById(currentUserId).select('sponsorId').session(session);
    if (!currentUser || !currentUser.sponsorId) {
      break;
    }
    
    const sponsorId = currentUser.sponsorId.toString();
    
    // For this sponsor, find all users who have them in their downline at various levels
    // We need to recursively find all users who have this sponsor in their downline
    const potentialOwners = await findUsersWithInDownline(sponsorId, targetUserId, maxLevels, session);
    
    for (const owner of potentialOwners) {
      if (!visitedOwners.has(owner.ownerId)) {
        owners.push(owner);
        visitedOwners.add(owner.ownerId);
      }
    }
    
    currentUserId = sponsorId;
  }
  
  return owners;
}

/**
 * Find all users who have a target user in their downline at a specific level
 * @param {string} rootUserId - The root user to search from
 * @param {string} targetUserId - The user to find in downline
 * @param {number} maxLevels - Maximum depth to search
 * @param {object} session - MongoDB session
 * @returns {Promise<Array<{ownerId: string, level: number}>>} Array of owners
 */
async function findUsersWithInDownline(rootUserId, targetUserId, maxLevels, session) {
  const owners = [];
  
  // Use BFS to find the target user in the downline
  const queue = [{ userId: rootUserId, level: 0 }];
  const visited = new Set();
  
  while (queue.length > 0) {
    const { userId, level } = queue.shift();
    
    if (visited.has(userId) || level >= maxLevels) {
      continue;
    }
    
    visited.add(userId);
    
    // Get direct referrals of this user
    const directReferrals = await User.find({ sponsorId: userId })
      .select('_id')
      .session(session);
    
    for (const referral of directReferrals) {
      const referralId = referral._id.toString();
      
      if (referralId === targetUserId) {
        // Found the target user at this level
        owners.push({ ownerId: userId, level: level + 1 });
      } else {
        // Continue searching in this referral's downline
        queue.push({ userId: referralId, level: level + 1 });
      }
    }
  }
  
  return owners;
}

/**
 * Get the level at which a target user appears in a specific owner's downline
 * Returns the level (1-5) or 0 if not found
 * @param {string} ownerId - The owner user ID
 * @param {string} targetUserId - The target user ID to find
 * @param {number} maxLevels - Maximum depth to search
 * @param {object} session - MongoDB session
 * @returns {Promise<number>} Level (1-5) or 0 if not found
 */
export async function getDownlineLevel(ownerId, targetUserId, maxLevels = 5, session = null) {
  if (ownerId === targetUserId) {
    return 0; // Same user
  }
  
  // Use BFS to find the target
  const queue = [{ userId: ownerId, level: 0 }];
  const visited = new Set();
  
  while (queue.length > 0) {
    const { userId, level } = queue.shift();
    
    if (visited.has(userId) || level >= maxLevels) {
      continue;
    }
    
    visited.add(userId);
    
    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: userId })
      .select('_id')
      .session(session);
    
    for (const referral of directReferrals) {
      const referralId = referral._id.toString();
      
      if (referralId === targetUserId) {
        return level + 1; // Found at this level
      }
      
      queue.push({ userId: referralId, level: level + 1 });
    }
  }
  
  return 0; // Not found
}
