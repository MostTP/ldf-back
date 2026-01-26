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

