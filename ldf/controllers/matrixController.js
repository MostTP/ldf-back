import { User } from '../models/index.js';


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

    let uplineSpilloverInLevel1 = [];
    if (user.sponsorId) {
      const uplineDirectReferrals = await User.find({ sponsorId: user.sponsorId })
        .select('_id username firstName lastName')
        .sort({ createdAt: 1 });
      
      const uplineSpillover = uplineDirectReferrals.slice(5);
      
      uplineSpilloverInLevel1 = uplineSpillover.slice(0, 5);
    }

    const allDirectReferrals = await User.find({ sponsorId: userId })
      .select('_id username firstName lastName')
      .sort({ createdAt: 1 });
    
    const spilloverCount = uplineSpilloverInLevel1.length;
    const availableSlots = 5 - spilloverCount;
    
    const directReferralsInLevel1 = allDirectReferrals.slice(0, availableSlots);
    
    const directReferralsSpillover = allDirectReferrals.slice(availableSlots);
    
    const finalLevel1Users = [...uplineSpilloverInLevel1, ...directReferralsInLevel1].slice(0, 5);

    const level1Ids = finalLevel1Users.map((u) => u._id);

    const level2BySponsor = {};
    const level2Spillover = [];
    
    for (const level1User of finalLevel1Users) {
      const level1UserId = level1User._id.toString();
      const allLevel1UserDirectReferrals = await User.find({ sponsorId: level1UserId })
        .select('_id username firstName lastName')
        .sort({ createdAt: 1 });
      
      const level1UserDirectReferrals = allLevel1UserDirectReferrals.slice(0, 5);
      
      level2BySponsor[level1UserId] = level1UserDirectReferrals.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
      }));
      
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

    const level1SpilloverUsers = directReferralsSpillover;

    if (level1SpilloverUsers.length > 0 && finalLevel1Users.length > 0) {
      let spilloverIndex = 0;
      
      for (const level1User of finalLevel1Users) {
        if (spilloverIndex >= level1SpilloverUsers.length) break;
        
        
        const level1UserId = level1User._id.toString();
        const currentLevel2Count = level2BySponsor[level1UserId]?.length || 0;
        const slotsAvailable = 5 - currentLevel2Count;
        
        if (slotsAvailable > 0) {
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
      level1: finalLevel1Users.map((u) => ({
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


