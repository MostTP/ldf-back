import { User } from '../models/index.js';

/**
 * @param {string} userId - The user ID
 * @param {object} session - MongoDB session
 * @returns {Promise<Array>}
 */
async function getMatrixStructure(userId, session = null) {
  const matrix = new Array(3905).fill(null);
  const capacities = [5, 25, 125, 625, 3125];
  let userQuery = User.findById(userId).select('sponsorId');
  if (session) userQuery = userQuery.session(session);
  const user = await userQuery;
  if (!user) {
    return matrix;
  }

  let level1Users = [];
  if (user.sponsorId) {
    let uplineQuery = User.find({ sponsorId: user.sponsorId })
      .select('_id')
      .sort({ createdAt: 1 });
    if (session) uplineQuery = uplineQuery.session(session);
    const uplineDirectReferrals = await uplineQuery;
    
    const uplineSpillover = uplineDirectReferrals.slice(5);
    
    for (let i = 0; i < Math.min(5, uplineSpillover.length); i++) {
      level1Users.push(uplineSpillover[i]._id.toString());
    }
  }

  let directReferralsQuery = User.find({ sponsorId: userId })
    .select('_id')
    .sort({ createdAt: 1 });
  if (session) directReferralsQuery = directReferralsQuery.session(session);
  const allDirectReferrals = await directReferralsQuery;

  const availableLevel1Slots = 5 - level1Users.length;
  for (let i = 0; i < Math.min(availableLevel1Slots, allDirectReferrals.length); i++) {
    level1Users.push(allDirectReferrals[i]._id.toString());
  }

  for (let i = 0; i < 5; i++) {
    if (i < level1Users.length) {
      matrix[i] = level1Users[i];
    }
  }

  // L2+ (positions 5-3904): build from stored matrixPositionInSponsor (first-available, first-come-first-serve, spillover never moves)
  let placementQuery = User.find({ matrixPositionInSponsor: { $ne: null } })
    .select('_id sponsorId matrixPositionInSponsor');
  if (session) placementQuery = placementQuery.session(session);
  const placements = await placementQuery;
  const placementMap = new Map();
  for (const u of placements) {
    const sid = u.sponsorId ? u.sponsorId.toString() : '';
    placementMap.set(`${sid}_${u.matrixPositionInSponsor}`, u._id.toString());
  }

  const ownerId = userId.toString();
  for (let p = 5; p < 3905; p++) {
    // Owner's direct ref (e.g. spillover) at position p
    let uid = placementMap.get(`${ownerId}_${p}`);
    if (uid) {
      matrix[p] = uid;
      continue;
    }
    const parentPos = getParentPosition(p);
    if (parentPos === null) continue;
    const parentId = matrix[parentPos];
    if (!parentId) continue;
    // Parent's 5 slots = parent's matrix positions 0-4 (their direct refs), not p
    const positionInParent = getLevelFromPosition(p).positionInLevel % 5;
    uid = placementMap.get(`${parentId}_${positionInParent}`);
    if (uid) matrix[p] = uid;
  }

  return matrix;
}

/**
 * First available position >= 5 in sponsor's matrix (for spillover). Used so spillover is first-come-first-serve and never moves.
 * @param {string} sponsorId - The sponsor user ID
 * @param {object} session - MongoDB session
 * @returns {Promise<number>} First position p >= 5 not assigned to any user with sponsorId
 */
export async function getFirstAvailableSpilloverPosition(sponsorId, session = null) {
  let q = User.find({ sponsorId, matrixPositionInSponsor: { $gte: 5, $lte: 3904 } }).select('matrixPositionInSponsor');
  if (session) q = q.session(session);
  const used = await q;
  const set = new Set(used.map((u) => u.matrixPositionInSponsor));
  for (let p = 5; p < 3905; p++) {
    if (!set.has(p)) return p;
  }
  return 3905; // matrix full
}

/**
 * Assign and persist this user's position in their sponsor's matrix (first-available, first-come-first-serve; spillover never moves).
 * Call at activation, inside matrix lock for sponsor. L1 (0-4) and spillover (5+) are both stored.
 * @param {string} newUserId - The newly activated user ID
 * @param {object} session - MongoDB session
 */
export async function assignMatrixPosition(newUserId, session = null) {
  let userQuery = User.findById(newUserId).select('sponsorId');
  if (session) userQuery = userQuery.session(session);
  const user = await userQuery;
  if (!user || !user.sponsorId) return;

  const sponsorId = user.sponsorId.toString();

  let refsQuery = User.find({ sponsorId }).select('_id createdAt').sort({ createdAt: 1 });
  if (session) refsQuery = refsQuery.session(session);
  const directRefs = await refsQuery;
  const newUserIndex = directRefs.findIndex((r) => r._id.toString() === newUserId);
  if (newUserIndex === -1) return;

  let uplineSpilloverCount = 0;
  let uplineQuery = User.findById(sponsorId).select('sponsorId');
  if (session) uplineQuery = uplineQuery.session(session);
  const sponsor = await uplineQuery;
  if (sponsor && sponsor.sponsorId) {
    let sibQuery = User.find({ sponsorId: sponsor.sponsorId }).select('_id').sort({ createdAt: 1 });
    if (session) sibQuery = sibQuery.session(session);
    const siblings = await sibQuery;
    uplineSpilloverCount = Math.min(5, Math.max(0, siblings.length - 5));
  }

  const availableL1 = 5 - uplineSpilloverCount;
  let position;

  if (newUserIndex < availableL1) {
    position = uplineSpilloverCount + newUserIndex;
  } else {
    position = await getFirstAvailableSpilloverPosition(sponsorId, session);
    if (position >= 3905) return;
  }

  let updateQuery = User.findByIdAndUpdate(newUserId, { matrixPositionInSponsor: position }, { new: true });
  if (session) updateQuery = updateQuery.session(session);
  await updateQuery;
}

/**
 * Backfill matrixPositionInSponsor for users who have a sponsor but no position set (e.g. before persistence was added).
 * Processes in (sponsorId, createdAt) order so each sponsor's refs get correct L1/spillover order. Idempotent: skips users who already have a position.
 * @param {object} session - Optional MongoDB session
 * @returns {Promise<{ updated: number, skipped: number }>}
 */
export async function backfillMatrixPositions(session = null) {
  let q = User.find({ sponsorId: { $ne: null }, $or: [{ matrixPositionInSponsor: null }, { matrixPositionInSponsor: { $exists: false } }] })
    .select('_id sponsorId createdAt')
    .sort({ sponsorId: 1, createdAt: 1 });
  if (session) q = q.session(session);
  const users = await q;

  let updated = 0;
  let skipped = 0;

  for (const u of users) {
    const userId = u._id.toString();
    try {
      await assignMatrixPosition(userId, session);
      updated++;
    } catch (err) {
      skipped++;
    }
  }

  return { updated, skipped };
}

/**
 * @param {string} userId - The user ID
 * @param {object} session - MongoDB session
 * @param {boolean} deepestFirst - If true, search from Level 5 down (for direct referrals). If false, TBLR (for spillover)
 * @returns {Promise<number|null>} Position index (0-3904) or null if matrix is full
 */
export async function findFirstAvailableHole(userId, session = null, deepestFirst = false) {
  const matrix = await getMatrixStructure(userId, session);
  const capacities = [5, 25, 125, 625, 3125];
  
  if (deepestFirst) {
    let levelStart = 0;
    for (let level = 0; level < capacities.length; level++) {
      const levelCapacity = capacities[level];
      const levelEnd = levelStart + levelCapacity;
      
      for (let i = levelStart; i < levelEnd; i++) {
        if (i < matrix.length && matrix[i] === null) {
          return i;
        }
      }
      
      levelStart = levelEnd;
    }
  } else {
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i] === null) {
        return i;
      }
    }
  }
  
  return null;
}

  /**
 * @param {number} position
 * @returns {Object}  
 */
export function getLevelFromPosition(position) {
  const capacities = [5, 25, 125, 625, 3125];
  let cumulative = 0;
  
  for (let level = 0; level < capacities.length; level++) {
    if (position < cumulative + capacities[level]) {
      return {
        level: level + 1,
        positionInLevel: position - cumulative,
        levelCapacity: capacities[level],
      };
    }
    cumulative += capacities[level];
  }
  
  return { level: 5, positionInLevel: position - 3905, levelCapacity: 3125 };
}

/** Level start positions (0-based): L1=0, L2=5, L3=30, L4=155, L5=780 */
const LEVEL_STARTS = [0, 5, 30, 155, 780];

/**
 * Get the matrix position of the parent slot for a given position.
 * Level 1 (positions 0-4) has no parent in the matrix (direct children of matrix owner).
 * @param {number} position - 0-based matrix position (0-3904)
 * @returns {number|null} Parent position index, or null for Level 1
 */
export function getParentPosition(position) {
  if (position < 0 || position >= 3905) return null;
  const levelInfo = getLevelFromPosition(position);
  if (levelInfo.level === 1) return null;
  const level = levelInfo.level;
  const parentPos = LEVEL_STARTS[level - 2] + Math.floor((position - LEVEL_STARTS[level - 1]) / 5);
  return parentPos;
}

/**
 * @param {string} userId - The user ID
 * @param {object} session - MongoDB session
 * @returns {Promise<Object>}
 */
export async function getMatrixFillStatus(userId, session = null) {
  const matrix = await getMatrixStructure(userId, session);
  const capacities = [5, 25, 125, 625, 3125];
  const levelCounts = [0, 0, 0, 0, 0];
  
  let position = 0;
  let totalFilled = 0;
  
  for (let level = 0; level < capacities.length; level++) {
    const levelCapacity = capacities[level];
    let levelFilled = 0;
    
    for (let i = 0; i < levelCapacity; i++) {
      if (position < matrix.length && matrix[position] !== null) {
        levelFilled++;
        totalFilled++;
      }
      position++;
    }
    
    levelCounts[level] = levelFilled;
  }
  
  return {
    totalFilled,
    levelCounts,
    matrix,
  };
}

/**
 * Build tree { root, level1, fillStatus } from a matrix slice (level1UserIds, level2ByParent).
 * level1 is built in matrix order. Used for both root and downline views.
 */
async function buildTreeFromSlice(user, level1UserIds, level2ByParent, fillStatus, session = null) {
  if (level1UserIds.length === 0) {
    return {
      root: {
        id: user._id.toString(),
        username: user.username,
        displayName: `${user.firstName} ${user.lastName}`.trim() || user.username,
      },
      level1: [],
      fillStatus: fillStatus || { totalFilled: 0, levelCounts: [0, 0, 0, 0, 0] },
    };
  }

  let level1Query = User.find({ _id: { $in: level1UserIds } })
    .select('_id username firstName lastName');
  if (session) level1Query = level1Query.session(session);
  const level1Users = await level1Query;

  const allLevel2Ids = Object.values(level2ByParent).flat().filter(Boolean);
  const level2UsersMap = {};
  if (allLevel2Ids.length > 0) {
    let level2Query = User.find({ _id: { $in: allLevel2Ids } })
      .select('_id username firstName lastName');
    if (session) level2Query = level2Query.session(session);
    const level2Users = await level2Query;
    level2Users.forEach(u => {
      level2UsersMap[u._id.toString()] = {
        id: u._id.toString(),
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
      };
    });
  }

  const level1UsersById = {};
  level1Users.forEach(u => { level1UsersById[u._id.toString()] = u; });

  const level1 = level1UserIds
    .map((parentId) => {
      const idStr = parentId.toString();
      const u = level1UsersById[idStr];
      if (!u) return null;
      return {
        id: u._id.toString(),
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
        children: (level2ByParent[idStr] || []).map(id => level2UsersMap[id.toString()] || null).filter(Boolean),
      };
    })
    .filter(Boolean);

  return {
    root: {
      id: user._id.toString(),
      username: user.username,
      displayName: `${user.firstName} ${user.lastName}`.trim() || user.username,
    },
    level1,
    fillStatus: fillStatus || { totalFilled: 0, levelCounts: [0, 0, 0, 0, 0] },
  };
}

/**
 * Get matrix tree structure for visualization (Level 1 & Level 2).
 * If the user has a sponsor, the tree is built from their slice of the sponsor's matrix
 * so spillover appears only under the L1 who earned it (not under every L1 when they log in).
 * @param {string} userId - The user ID
 * @param {object} session - MongoDB session
 * @returns {Promise<Object>} Tree structure with root, level1, and level2
 */
export async function getMatrixTreeStructure(userId, session = null) {
  let userQuery = User.findById(userId)
    .select('_id username firstName lastName sponsorId');
  if (session) userQuery = userQuery.session(session);
  const user = await userQuery;

  if (!user) {
    return null;
  }

  const userIdStr = user._id.toString();

  // Downline view: user has a sponsor — show only their slice of sponsor's matrix (no spillover under wrong L1)
  if (user.sponsorId) {
    const sponsorMatrix = await getMatrixStructure(user.sponsorId, session);
    const l1Index = sponsorMatrix.slice(0, 5).findIndex((id) => id !== null && id.toString() === userIdStr);
    if (l1Index === -1) {
      // User not in sponsor's L1 (shouldn't happen) — fallback to empty tree
      return buildTreeFromSlice(user, [], {}, { totalFilled: 0, levelCounts: [0, 0, 0, 0, 0] }, session);
    }

    const level2Start = 5 + l1Index * 5;
    const level3Start = 30 + l1Index * 25;

    const level1UserIds = [];
    const level2ByParent = {};
    let sliceFilled = 0;
    const levelCounts = [0, 0, 0, 0, 0];

    for (let j = 0; j < 5; j++) {
      const pos = level2Start + j;
      const id = pos < sponsorMatrix.length && sponsorMatrix[pos] !== null ? sponsorMatrix[pos] : null;
      if (id) {
        level1UserIds.push(id);
        level2ByParent[id.toString()] = [];
        levelCounts[0]++;
        sliceFilled++;
        for (let k = 0; k < 5; k++) {
          const l3Pos = level3Start + j * 5 + k;
          if (l3Pos < sponsorMatrix.length && sponsorMatrix[l3Pos] !== null) {
            level2ByParent[id.toString()].push(sponsorMatrix[l3Pos]);
            levelCounts[1]++;
            sliceFilled++;
          }
        }
      }
    }

    return buildTreeFromSlice(user, level1UserIds, level2ByParent, { totalFilled: sliceFilled, levelCounts }, session);
  }

  // Root view: no sponsor — use this user's full matrix (spillover shows under correct L1 by position)
  const fillStatus = await getMatrixFillStatus(userId, session);
  const matrix = fillStatus.matrix;

  const level1UserIds = [];
  for (let i = 0; i < 5; i++) {
    if (matrix[i] !== null) {
      level1UserIds.push(matrix[i]);
    }
  }

  const level2ByParent = {};
  const level2Position = 5;
  for (let i = 0; i < level1UserIds.length; i++) {
    const parentId = level1UserIds[i];
    const parentIdStr = parentId.toString();
    level2ByParent[parentIdStr] = [];
    for (let j = 0; j < 5; j++) {
      const pos = level2Position + (i * 5) + j;
      if (pos < matrix.length && matrix[pos] !== null) {
        level2ByParent[parentIdStr].push(matrix[pos]);
      }
    }
  }

  return buildTreeFromSlice(user, level1UserIds, level2ByParent, fillStatus, session);
}

/**
 * @param {string} newUserId - The newly activated user ID
 * @param {string} sponsorId - The sponsor who referred them
 * @param {object} session - MongoDB session
 * @returns {Promise<Array>}
 */
export async function findMatrixPlacements(newUserId, sponsorId, session = null) {
  const placements = [];
  
  if (!sponsorId) {
    return placements;
  }

  let sponsorQuery = User.findById(sponsorId).select('sponsorId');
  if (session) sponsorQuery = sponsorQuery.session(session);
  const sponsor = await sponsorQuery;
  if (!sponsor) {
    return placements;
  }

  const sponsorHole = await findFirstAvailableHole(sponsorId, session, true);
  if (sponsorHole !== null) {
    placements.push({ userId: sponsorId, position: sponsorHole });
  }

  return placements;
}

