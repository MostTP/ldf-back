import { User } from '../models/index.js';

/**
 * Get basic matrix tree (L1 & L2 downline) for the authenticated user
 */
export async function getMatrixTree(req, res) {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId).select('_id username firstName lastName');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Level 1: First 5 direct referrals + spillover from upline (if user has less than 5 direct referrals)
    // Get all direct referrals
    const allDirectReferrals = await User.find({ sponsorId: userId })
      .select('_id username firstName lastName')
      .sort({ createdAt: 1 });
    
    let level1Users = allDirectReferrals.slice(0, 5); // Start with first 5 direct referrals
    
    // If user has less than 5 direct referrals, check for spillover from upline
    // Spillover from upline = upline's 6th+ direct referrals that can fill remaining Level 1 slots
    if (level1Users.length < 5 && user.sponsorId) {
      // Get upline's direct referrals to find spillover users
      const uplineDirectReferrals = await User.find({ sponsorId: user.sponsorId })
        .select('_id username firstName lastName')
        .sort({ createdAt: 1 });
      
      // Upline's spillover users (6th+ direct referrals of upline)
      // These are users who overflow from upline's Level 1 and can appear in downlines' Level 1
      const uplineSpillover = uplineDirectReferrals.slice(5);
      
      // Fill remaining Level 1 slots with spillover from upline
      const slotsNeeded = 5 - level1Users.length;
      const availableSpillover = uplineSpillover.slice(0, slotsNeeded);
      
      // Add spillover users from upline to Level 1
      level1Users = [...level1Users, ...availableSpillover];
    }
    
    // Ensure Level 1 never exceeds 5 users
    level1Users = level1Users.slice(0, 5);

    const level1Ids = level1Users.map((u) => u._id);

    // Level 2 includes:
    // 1. Users who are direct referrals of Level 1 users
    // 2. Spillover direct referrals (6th+ direct referrals of the root user)
    
    // Get all direct referrals of Level 1 users
    let level2FromLevel1 = [];
    if (level1Ids.length > 0) {
      level2FromLevel1 = await User.find({ sponsorId: { $in: level1Ids } })
        .select('_id username firstName lastName sponsorId')
        .sort({ createdAt: 1 });
    }

    // Get spillover direct referrals (6th+ direct referrals of root user)
    // These are still direct referrals but placed in Level 2 positions
    // If user's direct downline is up to 5, the next referral will be a spillover
    const spilloverUsers = allDirectReferrals.slice(5); // Skip first 5 (they're in Level 1)

    // Combine Level 2 users: those referred by Level 1 + spillover direct referrals
    // All spillover users are assigned to the first Level 1 user (first direct referral)
    const level2BySponsor = {};
    
    // First, add users referred by Level 1 users
    level2FromLevel1.forEach((u) => {
      if (!u.sponsorId) return;
      const sponsorId = u.sponsorId.toString();
      if (!level2BySponsor[sponsorId]) level2BySponsor[sponsorId] = [];
      level2BySponsor[sponsorId].push({
        id: u._id.toString(),
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
      });
    });

    // Then, assign all spillover direct referrals to the first Level 1 user
    if (spilloverUsers.length > 0 && level1Users.length > 0) {
      const firstLevel1Id = level1Users[0]._id.toString();
      
      spilloverUsers.forEach((spilloverUser) => {
        if (!level2BySponsor[firstLevel1Id]) level2BySponsor[firstLevel1Id] = [];
        level2BySponsor[firstLevel1Id].push({
          id: spilloverUser._id.toString(),
          username: spilloverUser.username,
          displayName: `${spilloverUser.firstName} ${spilloverUser.lastName}`.trim() || spilloverUser.username,
        });
      });
    }

    const tree = {
      root: {
        id: user._id.toString(),
        username: user.username,
        displayName: `${user.firstName} ${user.lastName}`.trim() || user.username,
      },
      level1: level1Users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
        children: level2BySponsor[u._id.toString()] || [],
      })),
    };

    return res.json({
      success: true,
      tree,
    });
  } catch (error) {
    console.error('Get matrix tree error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch matrix tree',
    });
  }
}


