import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get upline hierarchy for a user (up to 5 levels)
 * @param {number} userId - The user ID to trace from
 * @returns {Promise<number[]>} Array of sponsor IDs (0-5 levels)
 */
export async function getUplineHierarchy(userId) {
  const upline = [];
  let currentUserId = userId;
  let level = 0;
  const maxLevels = 5;

  while (level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { sponsorId: true },
    });

    if (!user || !user.sponsorId) {
      break; // No more upline
    }

    upline.push(user.sponsorId);
    currentUserId = user.sponsorId;
    level++;
  }

  return upline;
}

