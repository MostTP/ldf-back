import { User } from '../models/index.js';
import { getMatrixTreeStructure } from '../services/matrixPlacementService.js';

/**
 * Get matrix tree (L1 & L2 downline) using Dual-Force Matrix algorithm
 * Implements: Spillover (from above), Spill-Under (from below), Direct Filling
 * Uses "First Available Hole" algorithm (Top-to-Bottom, Left-to-Right)
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

    // Use the new matrix placement service
    const tree = await getMatrixTreeStructure(userId);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Failed to build matrix tree',
      });
    }

    return res.json({
      success: true,
      tree,
      fillStatus: tree.fillStatus,
    });
  } catch (error) {
    console.error('Get matrix tree error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch matrix tree',
    });
  }
}


