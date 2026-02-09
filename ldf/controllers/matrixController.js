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
    
    // Start with user's direct referrals (first 5)
    let level1Users = allDirectReferrals.slice(0, 5);
    
    // If user has less than 5 direct referrals, fill remaining slots with spillover from upline
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
    
    // Ensure Level 1 never exceeds 5 users total (direct referrals + spillover from upline)
    level1Users = level1Users.slice(0, 5);
    
    // Note: User's own direct referrals beyond 5 (6th+) will still be treated as spillover and go to Level 2
    // This is independent of whether Level 1 has spillover from upline

    const level1Ids = level1Users.map((u) => u._id);

    // Level 2 includes:
    // 1. Users who are direct referrals of Level 1 users
    // 2. Spillover direct referrals (6th+ direct referrals of the root user)
    
    // Level 2: Each Level 1 user can have max 5 direct referrals under them
    // Spillover from Level 1 (root user's 6th+ direct referrals) goes to Level 2
    const level2BySponsor = {};
    const level2Spillover = []; // Track Level 2 users that will spill to Level 3
    
    // For each Level 1 user, get their direct referrals (max 5 shown, excess becomes spillover to Level 3)
    for (const level1User of level1Users) {
      const level1UserId = level1User._id.toString();
      const allLevel1UserDirectReferrals = await User.find({ sponsorId: level1UserId })
        .select('_id username firstName lastName')
        .sort({ createdAt: 1 });
      
      // Show first 5 direct referrals in Level 2
      const level1UserDirectReferrals = allLevel1UserDirectReferrals.slice(0, 5);
      
      level2BySponsor[level1UserId] = level1UserDirectReferrals.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
      }));
      
      // If Level 1 user has more than 5 direct referrals, excess becomes spillover to Level 3
      if (allLevel1UserDirectReferrals.length > 5) {
        const level1UserSpillover = allLevel1UserDirectReferrals.slice(5);
        level2Spillover.push(...level1UserSpillover.map((u) => ({
          id: u._id.toString(),
          username: u.username,
          displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
          fromLevel1UserId: level1UserId,
        })));
      }
    }

    // Get spillover direct referrals from Level 1 (root user's 6th+ direct referrals)
    // These go to Level 2 positions
    const level1SpilloverUsers = allDirectReferrals.slice(5); // Skip first 5 (they're in Level 1)

    // Distribute Level 1 spillover (root user's 6th+ direct referrals) to Level 2
    // Each Level 1 user can have max 5 direct referrals under them (including spillover from Level 1)
    if (level1SpilloverUsers.length > 0 && level1Users.length > 0) {
      let spilloverIndex = 0;
      
      // Distribute Level 1 spillover across all Level 1 users
      for (const level1User of level1Users) {
        if (spilloverIndex >= level1SpilloverUsers.length) break;
        
        const level1UserId = level1User._id.toString();
        const currentLevel2Count = level2BySponsor[level1UserId]?.length || 0;
        const slotsAvailable = 5 - currentLevel2Count;
        
        if (slotsAvailable > 0) {
          // Add Level 1 spillover users to this Level 1 user up to available slots
          const spilloverToAdd = level1SpilloverUsers.slice(
            spilloverIndex, 
            spilloverIndex + Math.min(slotsAvailable, level1SpilloverUsers.length - spilloverIndex)
          );
          
          if (!level2BySponsor[level1UserId]) {
            level2BySponsor[level1UserId] = [];
          }
          
          spilloverToAdd.forEach((spilloverUser) => {
            level2BySponsor[level1UserId].push({
              id: spilloverUser._id.toString(),
              username: spilloverUser.username,
              displayName: `${spilloverUser.firstName} ${spilloverUser.lastName}`.trim() || spilloverUser.username,
            });
          });
          
          spilloverIndex += spilloverToAdd.length;
        }
      }
      
      // If there are still Level 1 spillover users that couldn't fit in Level 2,
      // they become spillover to Level 3 (but we only show Level 1 & 2 in visualization)
      if (spilloverIndex < level1SpilloverUsers.length) {
        const remainingSpillover = level1SpilloverUsers.slice(spilloverIndex);
        level2Spillover.push(...remainingSpillover.map((u) => ({
          id: u._id.toString(),
          username: u.username,
          displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
          fromLevel: 1,
        })));
      }
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


