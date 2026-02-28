import { User, Investment, Earning } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { getUserBalance } from '../services/withdrawalService.js';
import { getUplineHierarchy } from '../utils/matrixService.js';
import { getMatrixFillStatus } from '../services/matrixPlacementService.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Get user profile with bank details
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      'username firstName lastName email phone bankName bankAccount emailVerified isAgent isPremium kycVerified agentCouponCredits createdAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Format bank details
    const bankDetails = {
      bankName: user.bankName || '',
      accountName: `${user.firstName} ${user.lastName}`,
      accountNumber: user.bankAccount || '',
      isSet: !!(user.bankName && user.bankAccount),
    };

    // Use username as referral code (or you can generate a unique referral code)
    const referralCode = user.username;

    
    res.json({
      success: true,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      referralCode,
      bankDetails,
      emailVerified: user.emailVerified,
      isAgent: user.isAgent,
      isPremium: user.isPremium,
      kycVerified: user.kycVerified,
      agentCouponCredits: user.agentCouponCredits ?? 0,
      createdAt: user.createdAt,
    });
  } catch (error) {
    logger.error('Get profile error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
}

/**
 * Get dashboard statistics
 */
export async function getStats(req, res) {
  try {
    const userId = req.user.id;

    // Initialize defaults
    let totalEarnings = 0;
    let affiliateEarnings = 0;
    let matrixEarnings = 0;
    let globalPoolEarnings = 0;
    let dettyDecEarnings = 0;
    let totalWithdrawable = 0;
    let allEarnings = [];

    try {
      // Get total earnings (sum of all earnings)
      const earningsResult = await Earning.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      totalEarnings = earningsResult[0]?.total || 0;

      // Get earnings breakdown by type
      allEarnings = await Earning.find({ userId }).select('amount type');

      // Calculate affiliate earnings (REFERRAL_BONUS)
      affiliateEarnings = allEarnings
        .filter(e => e.type === 'REFERRAL_BONUS')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      // Calculate matrix earnings (MATRIX_LEVEL_*)
      matrixEarnings = allEarnings
        .filter(e => e.type.startsWith('MATRIX_LEVEL_'))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      // Calculate Global Pool earnings (GLOBAL_POOL_ROI)
      globalPoolEarnings = allEarnings
        .filter(e => e.type === 'GLOBAL_POOL_ROI')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      // Calculate Detty December earnings (DETTY_DECEMBER)
      dettyDecEarnings = allEarnings
        .filter(e => e.type === 'DETTY_DECEMBER')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    } catch (earningsError) {
      console.error('Error calculating earnings:', earningsError);
      // Continue with defaults (0)
    }

    try {
      // Get user balance (withdrawable amount)
      totalWithdrawable = await getUserBalance(userId);
    } catch (balanceError) {
      console.error('Error getting balance:', balanceError);
      totalWithdrawable = 0;
    }

    // Get direct referrals count (users who have this user as sponsor)
    // Cap at 5 - spillover users (6th+) are not counted as direct referrals
    const allDirectReferralsCount = await User.countDocuments({ sponsorId: userId });
    const directReferrals = Math.min(allDirectReferralsCount, 5);

    // Get team size (all users in the downline matrix)
    // This includes direct referrals and their referrals recursively
    const teamSize = await getTeamSize(userId);

    // Get premium slots count (completed PREMIUM investments)
    const premiumSlots = await Investment.countDocuments({
      userId,
      tier: 'PREMIUM',
      status: 'completed',
    });

    // Get matrix level counts: downline only (direct referrals + their referrals), no upline spillover
    const matrixLevelCounts = await getMatrixLevelCountsDownlineOnly(userId, 5);

    // Calculate total users in matrix (downline only)
    const totalMatrixUsers = matrixLevelCounts.reduce((sum, count) => sum + count, 0);
    
    // Calculate spillover: Direct referrals beyond Level 1 (beyond 5)
    // Spillover = direct referrals that overflow from Level 1 to Level 2+
    // Use allDirectReferralsCount (not capped directReferrals) to calculate spillover
    const spillover = Math.max(0, allDirectReferralsCount - 5);

    // Matrix slots configuration (per level) based on TOTAL MATRIX USERS (direct referrals + spillovers)
    // Capacities per level: 5, 25, 125, 625, 3125
    const matrixCapacities = [5, 25, 125, 625, 3125];

    const matrixSlots = matrixCapacities.map((capacity, index) => {
      // Use actual count for each level from matrixLevelCounts
      // Ensure filled slots never exceed the max capacity for that level
      const filled = Math.min(matrixLevelCounts[index] || 0, capacity);

      return {
        level: index + 1,
        maxSlots: capacity,
        filledSlots: filled,
      };
    });

    // Determine global pool status
    // User is eligible if (AFFILIATE INCOME + GLOBAL_POOL_ROI) < ₦10,000
    let globalPoolStatus = 'Ineligible';
    try {
      // Get user's AFFILIATE INCOME (REFERRAL_BONUS)
      const affiliateEarningsResult = await Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: 'REFERRAL_BONUS'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Get user's GLOBAL_POOL_ROI earnings
      const globalPoolEarningsResult = await Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: 'GLOBAL_POOL_ROI'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const affiliateTotal = affiliateEarningsResult[0]?.total || 0;
      const globalPoolTotal = globalPoolEarningsResult[0]?.total || 0;

      const combinedTotal = affiliateTotal + globalPoolTotal;
      
      // Eligible if combined total < ₦10,000
      if (combinedTotal < 10000) {
        globalPoolStatus = 'Eligible';
      }
    } catch (eligibilityError) {
      console.error('Error checking global pool eligibility:', eligibilityError);
      // Default to Ineligible on error
    }

    // Calculate matrix level based on total matrix users (direct referrals + spillovers)
    // Level 1: 0-5 users, Level 2: 6-30, Level 3: 31-155, Level 4: 156-780, Level 5: 781+
    let matrixLevel = 'Level 1';
    if (totalMatrixUsers >= 781) matrixLevel = 'Level 5';
    else if (totalMatrixUsers >= 156) matrixLevel = 'Level 4';
    else if (totalMatrixUsers >= 31) matrixLevel = 'Level 3';
    else if (totalMatrixUsers >= 6) matrixLevel = 'Level 2';

    // Calculate total slots filled across all levels
    // Sum all filled slots from each level in matrixSlots
    const totalFilledSlots = matrixSlots.reduce((sum, slot) => sum + (slot.filledSlots || 0), 0);
    // Total max slots across all levels: 5 + 25 + 125 + 625 + 3125 = 3905
    const totalMaxSlots = 3905; // Sum of all level capacities
    const slotsFilled = Math.min(totalFilledSlots, totalMaxSlots); // Total filled slots across all levels (capped at totalMaxSlots)
    const maxSlots = totalMaxSlots;

    // Get user to check premium status, subscription, and pending balance
    let subDaysDisplay = '30/30';
    let pendingBalance = 0;
    let directReferralsCount = 0;
    try {
      const user = await User.findById(userId).select('isPremium createdAt pendingBalance');
      pendingBalance = Number(user?.pendingBalance || 0);
      directReferralsCount = await User.countDocuments({ sponsorId: userId });

      if (user && user.createdAt) {
        // Calculate subscription days (30 days from creation, or custom logic)
        const daysSinceCreation = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const subDaysLeft = Math.max(0, 30 - (daysSinceCreation % 30));
        subDaysDisplay = `${subDaysLeft}/30`;
      }
    } catch (userError) {
      console.error('Error getting user for subscription:', userError);
      // Use default
    }

    // Ensure all values are numbers (not Decimal objects)
    const affiliateAvailableNum = Number(affiliateEarnings) || 0;
    const matrixAvailableNum = Number(matrixEarnings) || 0;
    const globalPoolAvailableNum = Number(globalPoolEarnings) || 0;
    const dettyDecNum = Number(dettyDecEarnings) || 0;
    const totalEarningsNum = Number(totalEarnings) || 0;

    const response = {
      success: true,
      // Core stats
      totalEarnings: totalEarningsNum,
      totalWithdrawable: Number(totalWithdrawable) || 0,
      directReferrals: Number(directReferrals) || 0,
      teamSize: Number(teamSize) || 0,
      globalPoolStatus: globalPoolStatus || 'Ineligible',
      // Earnings breakdown - ensure numbers
      affiliateAvailable: affiliateAvailableNum,
      affiliateLifetime: affiliateAvailableNum,
      matrixAvailable: matrixAvailableNum,
      matrixLifetime: matrixAvailableNum,
      globalPoolAvailable: globalPoolAvailableNum,
      globalPoolLifetime: globalPoolAvailableNum,
      dettyDec: dettyDecNum,
      // Premium & Matrix
      premiumSlots: Number(premiumSlots) || 0,
      matrixLevel: matrixLevel || 'Level 1',
      subDaysLeft: subDaysDisplay || '30/30',
      // Team metrics
      totalTeam: Number(teamSize) || 0,
      spillover: Number(spillover) || 0,
      // Used by Matrix / progression views
      // totalActiveDownline should be total matrix users (includes spillovers), not just recursive team size
      totalActiveDownline: Number(totalMatrixUsers) || Number(teamSize) || 0,
      matrixSlots,
      slotsFilled: Number(slotsFilled) || 0,
      maxSlots: Number(maxSlots) || 5, // Max slots for current matrix level
      // 2-Direct Unlock Protocol
      pendingBalance: Number(pendingBalance) || 0,
      directReferralsCount: Number(directReferralsCount) || 0,
      canWithdraw: directReferralsCount >= 2, // Can withdraw if has 2+ direct referrals
    };

    res.json(response);
  } catch (error) {
    logger.error('Get stats error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
    });
  }
}

/**
 * Calculate total team size (all downline users)
 * This recursively counts all users in the matrix below the given user
 */
async function getTeamSize(userId) {
  // Get all direct referrals
  const directReferrals = await User.find({ sponsorId: userId }).select('_id');

  if (directReferrals.length === 0) {
    return 0;
  }

  // Count direct referrals
  let count = directReferrals.length;

  // Recursively count referrals of each direct referral
  for (const referral of directReferrals) {
    const referralId = referral._id || referral.id;
    count += await getTeamSize(referralId);
  }

  return count;
}

/**
 * Count users in each matrix level using full matrix (includes upline spillover in Level 1).
 * Used for placement/earnings logic.
 */
async function getMatrixLevelCounts(userId, maxLevels = 5) {
  try {
    const fillStatus = await getMatrixFillStatus(userId);
    return fillStatus.levelCounts;
  } catch (error) {
    console.error('Error getting matrix level counts:', error);
    return getMatrixLevelCountsDownlineOnly(userId, maxLevels);
  }
}

/**
 * Count users in each matrix level using only downline (lower-level users).
 * Excludes upline spillover; only direct referrals and their referrals are counted.
 * Use this for dashboard "Slots Filled" so the number reflects only users below this user.
 * @param {string} userId - The user ID to count matrix levels for
 * @param {number} maxLevels - Maximum levels to count (default 5)
 * @returns {Promise<number[]>} Array of counts for each level [level1, level2, level3, level4, level5]
 */
async function getMatrixLevelCountsDownlineOnly(userId, maxLevels = 5) {
  const levelCounts = new Array(maxLevels).fill(0);

  const allDirectReferrals = await User.find({ sponsorId: userId }).select('_id').sort({ createdAt: 1 });

  // Level 1: First 5 direct referrals only (no upline spillover)
  const level1Users = allDirectReferrals.slice(0, 5);
  levelCounts[0] = level1Users.length;

  if (level1Users.length === 0) {
    return levelCounts;
  }

  const spilloverUsers = allDirectReferrals.slice(5);

  const level1Ids = level1Users.map(u => u._id);
  let level2Users = [];

  if (level1Ids.length > 0) {
    level2Users = await User.find({
      sponsorId: { $in: level1Ids },
    }).select('_id');
  }

  levelCounts[1] = level2Users.length + spilloverUsers.length;

  let currentLevelUsers = [...level2Users, ...spilloverUsers];

  for (let level = 2; level < maxLevels; level++) {
    const currentLevelIds = currentLevelUsers.map(u => u._id);

    if (currentLevelIds.length === 0) {
      break;
    }

    const nextLevelUsers = await User.find({
      sponsorId: { $in: currentLevelIds },
    }).select('_id');

    levelCounts[level] = nextLevelUsers.length;
    currentLevelUsers = nextLevelUsers;
  }

  return levelCounts;
}

/**
 * Get direct referrals list
 */
export async function getReferrals(req, res) {
  try {
    const userId = req.user.id;

    // Get all direct referrals (users who have this user as sponsor)
    const directReferrals = await User.find({ sponsorId: userId })
      .select('firstName lastName username email phone isActive subscriptionExpiresAt createdAt')
      .sort({ createdAt: -1 });

    // Position among direct referrals (1-based): oldest = #1, so "your 1st referral" shows as #1
    const directReferralsByCreatedAsc = await User.find({ sponsorId: userId })
      .select('_id')
      .sort({ createdAt: 1 });
    const positionByReferralId = new Map();
    directReferralsByCreatedAsc.forEach((r, i) => positionByReferralId.set(r._id.toString(), i + 1));

    // Get matrix structure to find levels
    const { getMatrixFillStatus } = await import('../services/matrixPlacementService.js');
    const { getDownlineLevel } = await import('../utils/matrixService.js');
    const matrixData = await getMatrixFillStatus(userId);
    const matrix = matrixData.matrix;

    // Helper to get level from position
    const getLevelFromPosition = (position) => {
      if (position < 5) return 1;
      if (position < 30) return 2;
      if (position < 155) return 3;
      if (position < 780) return 4;
      if (position < 3905) return 5;
      return 0;
    };

    // Format referrals data with all required fields
    const referrals = await Promise.all(
      directReferrals.map(async (referral) => {
        const referralId = referral._id.toString();

        // Position among your direct referrals (1-based): 1st referral = #1
        const positionInReferrals = positionByReferralId.get(referralId) ?? 0;
        // Find referral's position in matrix (for level only)
        const matrixPosition = matrix.indexOf(referralId);
        const matrixLevel = matrixPosition !== -1 ? getLevelFromPosition(matrixPosition) : 1;
        
        // Get direct downlines count for this referral
        const directDownlines = await User.countDocuments({ sponsorId: referralId });
        
        // Calculate subscription days left
        let subDaysLeft = 0;
        if (referral.subscriptionExpiresAt) {
          const now = new Date();
          const expiry = new Date(referral.subscriptionExpiresAt);
          if (expiry > now) {
            const diffTime = expiry - now;
            subDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
        
        // Determine if active
        const isActive = referral.isActive && 
          (!referral.subscriptionExpiresAt || new Date(referral.subscriptionExpiresAt) > new Date());

        return {
          id: referralId,
          name: `${referral.firstName} ${referral.lastName}`,
          username: referral.username,
          email: referral.email,
          phone: referral.phone,
          isActive, // Boolean for frontend
          createdAt: referral.createdAt, // Date for frontend
          positionInReferrals, // 1-based: 1st direct referral = #1
          matrixLevel: `Level ${matrixLevel}`, // String format for frontend
          directDownlines, // Number
          subDaysLeft, // Number (days remaining)
        };
      })
    );

    res.json({
      success: true,
      referrals,
    });
  } catch (error) {
    logger.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referrals',
    });
  }
}

/**
 * Update user profile (firstName, lastName, email, phone)
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone } = req.body;

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required',
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate phone format if provided
    if (phone && !/^\+?[\d\s-()]+$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({
        email: email.trim(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken by another user',
        });
      }
    }

    // Check if phone is already taken by another user
    if (phone) {
      const existingUser = await User.findOne({
        phone: phone.trim(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Phone number is already taken by another user',
        });
      }
    }

    // Update user profile
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };
    if (email) updateData.email = email.trim();
    if (phone) updateData.phone = phone.trim();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('username firstName lastName email phone bankName bankAccount emailVerified isAgent isPremium kycVerified agentCouponCredits createdAt');

    // Format bank details
    const bankDetails = {
      bankName: updatedUser.bankName || '',
      accountName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      accountNumber: updatedUser.bankAccount || '',
      isSet: !!(updatedUser.bankName && updatedUser.bankAccount),
    };

    // Use username as referral code
    const referralCode = updatedUser.username;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      referralCode,
      bankDetails,
      emailVerified: updatedUser.emailVerified,
      isAgent: updatedUser.isAgent,
      isPremium: updatedUser.isPremium,
      kycVerified: updatedUser.kycVerified,
      agentCouponCredits: updatedUser.agentCouponCredits ?? 0,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    logger.error('Update profile error');
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
}

/**
 * Update user bank details
 */
export async function updateBankDetails(req, res) {
  try {
    const userId = req.user.id;
    const { bankName, accountName, accountNumber } = req.body;

    // Validation
    if (!bankName || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bank name and account number are required',
      });
    }

    // Validate account number (should be numeric and reasonable length)
    if (!/^\d+$/.test(accountNumber) || accountNumber.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account number format',
      });
    }

    // Update user bank details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        bankName: bankName.trim(),
        bankAccount: accountNumber.trim(),
        // Note: accountName is typically derived from firstName + lastName
        // If you want to store it separately, you'd need to add an accountName field to the schema
      },
      { new: true }
    ).select('bankName bankAccount firstName lastName');

    res.json({
      success: true,
      message: 'Bank details updated successfully',
      bankDetails: {
        bankName: updatedUser.bankName,
        accountName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        accountNumber: updatedUser.bankAccount,
        isSet: true,
      },
    });
  } catch (error) {
    logger.error('Update bank details error');
    res.status(500).json({
      success: false,
      message: 'Failed to update bank details',
    });
  }
}

/**
 * Change user password
 */
export async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      });
    }

    // Get user with password hash
    const user = await User.findById(userId).select('passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(userId, {
      passwordHash: newPasswordHash,
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error');
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
}

/**
 * Get earnings history for the authenticated user
 */
export async function getEarningsHistory(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { limit = 50, offset = 0, type } = req.query;

    const query = { userId };
    
    if (type) {
      query.type = type;
    }

    const earnings = await Earning.find(query)
      .select('_id amount type description createdAt metadata')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await Earning.countDocuments(query);

    // Fix position in description for matrix earnings: use current matrix position (so it reflects spillover reassignment)
    const matrixEarnings = earnings.filter((e) => e.type?.startsWith('MATRIX_LEVEL_'));
    const recipientIds = [...new Set(matrixEarnings.map((e) => e.userId?.toString()).filter(Boolean))];
    const matrixByRecipient = {};
    for (const rid of recipientIds) {
      try {
        const fill = await getMatrixFillStatus(rid);
        matrixByRecipient[rid] = fill?.matrix || [];
      } catch {
        matrixByRecipient[rid] = [];
      }
    }
    const getCurrentPosition = (recipientId, newUserId) => {
      const matrix = matrixByRecipient[recipientId?.toString()];
      if (!matrix || !newUserId) return null;
      const idx = matrix.indexOf(newUserId.toString());
      return idx >= 0 ? idx + 1 : null;
    };
    // For old earnings without newUserId: try to infer from "for FirstName LastName" in description and recipient's matrix
    const nameToIds = {};
    const allMatrixIds = [...new Set(Object.values(matrixByRecipient).flat().filter(Boolean))];
    if (allMatrixIds.length > 0) {
      const users = await User.find({ _id: { $in: allMatrixIds } }).select('_id firstName lastName').lean();
      const userById = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
      for (const rid of recipientIds) {
        const matrix = matrixByRecipient[rid] || [];
        for (const uid of matrix) {
          const u = userById[uid];
          if (!u) continue;
          const name = `${(u.firstName || '').trim()} ${(u.lastName || '').trim()}`.trim() || null;
          if (name) {
            if (!nameToIds[name]) nameToIds[name] = {};
            if (!nameToIds[name][rid]) nameToIds[name][rid] = [];
            nameToIds[name][rid].push(uid);
          }
        }
      }
    }
    const inferNewUserIdFromDescription = (description, recipientId) => {
      const m = (description || '').match(/for\s+([^(]+?)\s*\(\s*position/i);
      if (!m) return null;
      const name = m[1].trim().replace(/\s+/g, ' ');
      const rid = recipientId?.toString();
      const ids = nameToIds[name]?.[rid];
      if (ids?.length === 1) return ids[0];
      if (ids?.length > 1) return null;
      const normalizedKeys = Object.keys(nameToIds).filter((k) => k.replace(/\s+/g, ' ') === name);
      for (const key of normalizedKeys) {
        const arr = nameToIds[key]?.[rid];
        if (arr?.length === 1) return arr[0];
      }
      return null;
    };
    const isForceD = (e) =>
      e.metadata?.isSlotHolder === true ||
      e.metadata?.forceType === 'D' ||
      (e.description && /slot holder|Force D/i.test(e.description));
    const slotHolderEarningsNeedingLegPos = earnings.filter(
      (e) => e.type?.startsWith('MATRIX_LEVEL_') && isForceD(e) && (e.metadata?.positionInLeg == null || e.metadata?.positionInLeg < 1)
    );
    const slotHolderIdsForLeg = [...new Set(slotHolderEarningsNeedingLegPos.map((e) => e.userId?.toString()).filter(Boolean))];
    const sponsorMatrixBySlotHolderId = {};
    for (const sid of slotHolderIdsForLeg) {
      try {
        const slotHolder = await User.findById(sid).select('sponsorId').lean();
        const sponsorId = slotHolder?.sponsorId?.toString();
        if (sponsorId) {
          const fill = await getMatrixFillStatus(sponsorId);
          sponsorMatrixBySlotHolderId[sid] = fill?.matrix || [];
        }
      } catch {
        sponsorMatrixBySlotHolderId[sid] = [];
      }
    }
    const getPositionInLeg = (slotHolderId, newUserId) => {
      const matrix = sponsorMatrixBySlotHolderId[slotHolderId?.toString()];
      if (!matrix || !newUserId) return null;
      const slotHolderStr = slotHolderId?.toString();
      const newUserStr = newUserId.toString();
      const slotHolderL1Index = matrix.slice(0, 5).findIndex((id) => (id || '').toString() === slotHolderStr);
      if (slotHolderL1Index < 0) return null;
      const newUserPosition = matrix.indexOf(newUserStr);
      if (newUserPosition < 5) return null;
      const level2Start = 5 + slotHolderL1Index * 5;
      const level2End = level2Start + 5;
      if (newUserPosition < level2Start || newUserPosition >= level2End) return null;
      return (newUserPosition - level2Start) + 1;
    };
    const earningsWithFixedDescription = earnings.map((e) => {
      if (!e.type || !e.type.startsWith('MATRIX_LEVEL_')) return e;
      const forceD = isForceD(e);
      let pos = null;
      if (forceD) {
        pos = e.metadata?.positionInLeg;
        if (pos == null || pos < 1) {
          const newUserId = e.metadata?.newUserId || inferNewUserIdFromDescription(e.description, e.userId);
          pos = newUserId ? getPositionInLeg(e.userId, newUserId) : null;
        }
      }
      if (pos == null && !forceD) {
        const storedPos = e.metadata?.matrixPosition;
        if (storedPos != null && storedPos >= 1 && storedPos <= 3905) pos = storedPos;
      }
      if (pos == null && !forceD) {
        const newUserId = e.metadata?.newUserId || inferNewUserIdFromDescription(e.description, e.userId);
        pos = newUserId ? getCurrentPosition(e.userId, newUserId) : e.metadata?.positionAmongDirectReferrals;
      }
      if (pos == null || pos < 1) return e;
      const fixedDescription = (e.description || '').replace(/\bposition\s*#\s*\d+/i, `position #${pos}`);
      return { ...e, description: fixedDescription };
    });

    // Get summary by type
    const summaryByType = await Earning.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    res.json({
      success: true,
      data: earningsWithFixedDescription,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      summary: summaryByType,
    });
    
  } catch (error) {
    logger.error('Get earnings history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings history',
    });
  }
}

