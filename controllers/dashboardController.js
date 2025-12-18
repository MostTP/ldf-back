import { PrismaClient } from '@prisma/client';
import { getUserBalance } from '../services/withdrawalService.js';
import { getUplineHierarchy } from '../utils/matrixService.js';

const prisma = new PrismaClient();

/**
 * Get user profile with bank details
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        bankName: true,
        bankAccount: true,
        emailVerified: true,
        isAgent: true,
        isPremium: true,
        kycVerified: true,
        agentCouponCredits: true,
        createdAt: true,
      },
    });

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

    // Get total earnings (sum of all earnings)
    const earningsResult = await prisma.earning.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const totalEarnings = Number(earningsResult._sum.amount || 0);

    // Get direct referrals count (users who have this user as sponsor)
    const directReferrals = await prisma.user.count({
      where: { sponsorId: userId },
    });

    // Get team size (all users in the downline matrix)
    // This includes direct referrals and their referrals recursively
    const teamSize = await getTeamSize(userId);

    // Determine global pool status
    // User is eligible if they have at least 5 direct referrals
    const globalPoolStatus = directReferrals >= 5 ? 'Eligible' : 'Ineligible';

    res.json({
      success: true,
      totalEarnings,
      directReferrals,
      teamSize,
      globalPoolStatus,
    });
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
  const directReferrals = await prisma.user.findMany({
    where: { sponsorId: userId },
    select: { id: true },
  });

  if (directReferrals.length === 0) {
    return 0;
  }

  // Count direct referrals
  let count = directReferrals.length;

  // Recursively count referrals of each direct referral
  for (const referral of directReferrals) {
    count += await getTeamSize(referral.id);
  }

  return count;
}

