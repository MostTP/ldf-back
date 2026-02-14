import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const LOCK_TIMEOUT_MS = 30000;

/**
 * @param {string} userId
 * @param {object} session 
 * @returns {Promise<boolean>}
 */
export async function acquireMatrixLock(userId, session = null) {
  try {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + LOCK_TIMEOUT_MS);
    
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        $or: [
          { matrixPlacementLock: null },
          { matrixPlacementLock: { $lt: now } },
        ],
      },
      {
        $set: { matrixPlacementLock: lockExpiry },
      },
      { session, new: true }
    );
    
    if (user) {
      logger.info(`[MATRIX LOCK] Lock acquired for user ${userId}, expires at ${lockExpiry}`);
      return true;
    } else {
      logger.warn(`[MATRIX LOCK] Failed to acquire lock for user ${userId} - already locked`);
      return false;
    }
  } catch (error) {
    logger.error(`[MATRIX LOCK] Error acquiring lock for user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * @param {string} userId
 * @param {object} session
 */
export async function releaseMatrixLock(userId, session = null) {
  try {
    await User.findByIdAndUpdate(
      userId,
      { $set: { matrixPlacementLock: null } },
      { session }
    );
    logger.info(`[MATRIX LOCK] Lock released for user ${userId}`);
  } catch (error) {
    logger.error(`[MATRIX LOCK] Error releasing lock for user ${userId}:`, error.message);
  }
}

/**
 * @param {string} userId
 * @param {Function} fn
 * @param {object} session
 * @returns {Promise<any>}
 */
export async function withMatrixLock(userId, fn, session = null) {
  const lockAcquired = await acquireMatrixLock(userId, session);
  
  if (!lockAcquired) {
    throw new Error('Matrix placement is currently locked. Please try again in a moment.');
  }
  
  try {
    const result = await fn();
    return result;
  } finally {
    await releaseMatrixLock(userId, session);
  }
}

