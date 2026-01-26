import { User, Investment, Earning } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { getUserBalance } from '../services/withdrawalService.js';
import { getUplineHierarchy } from '../utils/matrixService.js';
import mongoose from 'mongoose';

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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * Get dashboard statistics
 */
export async function getStats(req, res) {
  try {
    const userId = req.user.id;
    console.log('Getting stats for user ID:', userId);

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
    const directReferrals = await User.countDocuments({ sponsorId: userId });

    // Get team size (all users in the downline matrix)
    // This includes direct referrals and their referrals recursively
    const teamSize = await getTeamSize(userId);

    // Get premium slots count (completed PREMIUM investments)
    const premiumSlots = await Investment.countDocuments({
      userId,
      tier: 'PREMIUM',
      status: 'completed',
    });

    // Calculate spillover (team size - direct referrals)
    const spillover = Math.max(0, teamSize - directReferrals);

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

    // Calculate matrix level based on direct referrals
    // Level 1: 0-1 referrals, Level 2: 2-3, Level 3: 4-7, Level 4: 8-15, Level 5: 16+
    let matrixLevel = 'Level 1';
    if (directReferrals >= 16) matrixLevel = 'Level 5';
    else if (directReferrals >= 8) matrixLevel = 'Level 4';
    else if (directReferrals >= 4) matrixLevel = 'Level 3';
    else if (directReferrals >= 2) matrixLevel = 'Level 2';

    // Calculate slots filled (direct referrals capped at 2 for level 1)
    const slotsFilled = Math.min(directReferrals, 2);

    // Get user to check premium status and subscription
    let subDaysDisplay = '30/30';
    try {
      const user = await User.findById(userId).select('isPremium createdAt');

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

    // Log for debugging
    console.log('Dashboard Stats for user', userId, {
      affiliateAvailableNum,
      matrixAvailableNum,
      globalPoolAvailableNum,
      dettyDecNum,
      totalEarningsNum,
      totalWithdrawable,
      earningsCount: allEarnings.length,
      sampleEarnings: allEarnings.slice(0, 3),
    });

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
      slotsFilled: Number(slotsFilled) || 0,
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    console.error('Update bank details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

