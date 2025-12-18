import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get basic matrix tree (L1 & L2 downline) for the authenticated user
 */
export async function getMatrixTree(req, res) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Level 1: direct referrals (users whose sponsorId = current user)
    const level1Users = await prisma.user.findMany({
      where: { sponsorId: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const level1Ids = level1Users.map((u) => u.id);

    // Level 2: referrals of level 1 users
    let level2Users = [];
    if (level1Ids.length > 0) {
      level2Users = await prisma.user.findMany({
        where: { sponsorId: { in: level1Ids } },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          sponsorId: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // Group level 2 users by their sponsor (level 1 member)
    const level2BySponsor = level2Users.reduce((acc, u) => {
      if (!u.sponsorId) return acc;
      if (!acc[u.sponsorId]) acc[u.sponsorId] = [];
      acc[u.sponsorId].push({
        id: u.id,
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
      });
      return acc;
    }, {});

    const tree = {
      root: {
        id: user.id,
        username: user.username,
        displayName: `${user.firstName} ${user.lastName}`.trim() || user.username,
      },
      level1: level1Users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
        children: level2BySponsor[u.id] || [],
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


