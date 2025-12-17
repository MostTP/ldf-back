import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * JWT authentication middleware
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid user',
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
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

