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

    const level1Users = await User.find({ sponsorId: userId })
      .select('_id username firstName lastName')
      .sort({ createdAt: 1 });

    const level1Ids = level1Users.map((u) => u._id);

    let level2Users = [];
    if (level1Ids.length > 0) {
      level2Users = await User.find({ sponsorId: { $in: level1Ids } })
        .select('_id username firstName lastName sponsorId')
        .sort({ createdAt: 1 });
    }

    const level2BySponsor = level2Users.reduce((acc, u) => {
      if (!u.sponsorId) return acc;
      const sponsorId = u.sponsorId.toString();
      if (!acc[sponsorId]) acc[sponsorId] = [];
      acc[sponsorId].push({
        id: u._id.toString(),
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
      });
      return acc;
    }, {});

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


