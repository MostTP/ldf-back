import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simple authentication middleware
 * In production, use JWT tokens
 */
export async function authenticate(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
}

/**
 * Check if user is an agent
 */
export function requireAgent(req, res, next) {
  if (!req.user || !req.user.isAgent) {
    return res.status(403).json({
      success: false,
      message: 'Agent access required',
    });
  }
  next();
}

/**
 * Check if user is an admin
 */
export function requireAdmin(req, res, next) {
  // In production, add isAdmin field to User model
  if (!req.user || !req.user.isAgent) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
}

