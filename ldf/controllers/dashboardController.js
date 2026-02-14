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

    // Get matrix level counts (includes both direct referrals and spillovers)
    const matrixLevelCounts = await getMatrixLevelCounts(userId, 5);
    
    // Calculate total users in matrix (direct referrals + spillovers)
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
 * Count users in each matrix level using Dual-Force Matrix algorithm
 * Includes: Spillover (from above), Spill-Under (from below), Direct Filling
 * @param {string} userId - The user ID to count matrix levels for
 * @param {number} maxLevels - Maximum levels to count (default 5)
 * @returns {Promise<number[]>} Array of counts for each level [level1, level2, level3, level4, level5]
 */
async function getMatrixLevelCounts(userId, maxLevels = 5) {
  try {
    const fillStatus = await getMatrixFillStatus(userId);
    return fillStatus.levelCounts;
  } catch (error) {
    console.error('Error getting matrix level counts:', error);
    // Fallback to simple counting if service fails
    const levelCounts = new Array(maxLevels).fill(0);
    
    // Get all direct referrals
    const allDirectReferrals = await User.find({ sponsorId: userId }).select('_id').sort({ createdAt: 1 });
    
    // Level 1: First 5 direct referrals only
    const level1Users = allDirectReferrals.slice(0, 5);
    levelCounts[0] = level1Users.length;
    
    if (level1Users.length === 0) {
      return levelCounts;
    }

    // Get spillover direct referrals (6th+ direct referrals)
    const spilloverUsers = allDirectReferrals.slice(5);
    
    // Level 2: Users referred by Level 1 users + spillover direct referrals
    const level1Ids = level1Users.map(u => u._id);
    let level2Users = [];
    
    if (level1Ids.length > 0) {
      level2Users = await User.find({ 
        sponsorId: { $in: level1Ids } 
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
        sponsorId: { $in: currentLevelIds } 
      }).select('_id');
      
      levelCounts[level] = nextLevelUsers.length;
      currentLevelUsers = nextLevelUsers;
    }
    
    return levelCounts;
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
      .select('_id amount type description createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Earning.countDocuments(query);

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
      data: earnings,
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

