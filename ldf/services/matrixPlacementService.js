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
  const l1Set = new Set(level1Users);
  for (let p = 5; p < 3905; p++) {
    const parentPos = getParentPosition(p);
    const positionInParent = parentPos !== null ? getLevelFromPosition(p).positionInLevel % 5 : -1;
    const parentId = parentPos !== null && parentPos < level1Users.length ? level1Users[parentPos] : null;
    // Prefer L1's direct ref in this slot (parent's positionInParent) so sol1 shows under Ty1; else owner's spillover at p
    let uid = parentId ? placementMap.get(`${parentId}_${positionInParent}`) : null;
    if (!uid) {
      uid = placementMap.get(`${ownerId}_${p}`);
      if (uid && l1Set.has(uid)) uid = null;
    }
    if (uid) matrix[p] = uid;
  }

  return matrix;
}

/**
 * Build L1 user IDs (max 5) for a matrix owner: upline spillover first, then owner's direct refs.
 * @param {string} ownerId - The matrix owner user ID
 * @param {object} session - MongoDB session
 * @returns {Promise<string[]>} Array of up to 5 user IDs in L1 order
 */
async function getLevel1UserIds(ownerId, session = null) {
  let sponsorQuery = User.findById(ownerId).select('sponsorId');
  if (session) sponsorQuery = sponsorQuery.session(session);
  const owner = await sponsorQuery;
  const level1Users = [];
  if (owner && owner.sponsorId) {
    let uplineQuery = User.find({ sponsorId: owner.sponsorId }).select('_id').sort({ createdAt: 1 });
    if (session) uplineQuery = uplineQuery.session(session);
    const uplineDirectReferrals = await uplineQuery;
    const uplineSpillover = uplineDirectReferrals.slice(5);
    for (let i = 0; i < Math.min(5, uplineSpillover.length); i++) {
      level1Users.push(uplineSpillover[i]._id.toString());
    }
  }
  let directQuery = User.find({ sponsorId: ownerId }).select('_id').sort({ createdAt: 1 });
  if (session) directQuery = directQuery.session(session);
  const allDirectReferrals = await directQuery;
  const available = 5 - level1Users.length;
  for (let i = 0; i < Math.min(available, allDirectReferrals.length); i++) {
    level1Users.push(allDirectReferrals[i]._id.toString());
  }
  return level1Users;
}

/**
 * First available position >= 5 in sponsor's matrix (for spillover). Skips positions reserved for an L1 user's direct ref
 * so spillover never occupies the same slot as a downline's direct ref (no duplicate position).
 * @param {string} sponsorId - The sponsor user ID
 * @param {object} session - MongoDB session
 * @returns {Promise<number>} First position p >= 5 not assigned and not reserved for parent direct ref
 */
export async function getFirstAvailableSpilloverPosition(sponsorId, session = null) {
  const level1Users = await getLevel1UserIds(sponsorId, session);
  let placementQuery = User.find({ matrixPositionInSponsor: { $ne: null } })
    .select('_id sponsorId matrixPositionInSponsor');
  if (session) placementQuery = placementQuery.session(session);
  const placements = await placementQuery;
  const placementMap = new Map();
  for (const u of placements) {
    const sid = u.sponsorId ? u.sponsorId.toString() : '';
    placementMap.set(`${sid}_${u.matrixPositionInSponsor}`, u._id.toString());
  }
  let usedQuery = User.find({ sponsorId, matrixPositionInSponsor: { $gte: 5, $lte: 3904 } }).select('matrixPositionInSponsor');
  if (session) usedQuery = usedQuery.session(session);
  const usedRows = await usedQuery;
  const used = new Set(usedRows.map((u) => u.matrixPositionInSponsor));
  for (let p = 5; p < 3905; p++) {
    if (used.has(p)) continue;
    const parentPos = getParentPosition(p);
    if (parentPos === null || parentPos >= level1Users.length) continue;
    const parentId = level1Users[parentPos];
    if (!parentId) continue;
    const positionInParent = getLevelFromPosition(p).positionInLevel % 5;
    if (placementMap.has(`${parentId}_${positionInParent}`)) continue;
    return p;
  }
  return 3905;
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
 * Reassign spillover positions for a sponsor so reserved slots (L1 direct refs) are skipped.
 * Run once after deploying the "reserved slot" fix so existing spillover (e.g. ty6 at 5) moves to correct slots (e.g. 6).
 * @param {string} sponsorId - The sponsor user ID
 * @param {object} session - Optional MongoDB session
 * @returns {Promise<number>} Number of users whose position was updated
 */
export async function reassignSpilloverPositionsForSponsor(sponsorId, session = null) {
  let q = User.find({ sponsorId, matrixPositionInSponsor: { $gte: 5, $lte: 3904 } })
    .select('_id matrixPositionInSponsor')
    .sort({ matrixPositionInSponsor: 1 });
  if (session) q = q.session(session);
  const spilloverUsers = await q;
  let updated = 0;
  for (const u of spilloverUsers) {
    const newPos = await getFirstAvailableSpilloverPosition(sponsorId, session);
    if (newPos >= 3905) break;
    const currentPos = u.matrixPositionInSponsor;
    if (newPos !== currentPos) {
      let updateQuery = User.findByIdAndUpdate(u._id, { matrixPositionInSponsor: newPos }, { new: true });
      if (session) updateQuery = updateQuery.session(session);
      await updateQuery;
      updated++;
    }
  }
  return updated;
}

/**
 * Reassign spillover positions for all sponsors that have spillover. Run once after the reserved-slot fix.
 * @param {object} session - Optional MongoDB session
 * @returns {Promise<{ sponsorsProcessed: number, totalUpdated: number }>}
 */
export async function reassignAllSpilloverPositions(session = null) {
  const sponsorIds = await User.distinct('sponsorId', { matrixPositionInSponsor: { $gte: 5, $lte: 3904 } });
  let totalUpdated = 0;
  for (const sid of sponsorIds) {
    if (!sid) continue;
    totalUpdated += await reassignSpilloverPositionsForSponsor(sid.toString(), session);
  }
  return { sponsorsProcessed: sponsorIds.filter(Boolean).length, totalUpdated };
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
 * L1 = only this user's direct referrals (no upline spillover siblings). L2 = users placed under each in the matrix.
 * So spillover users with no directs and no one under them see an empty team.
 * @param {string} userId - The user ID (root of the tree)
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

  const fillStatus = await getMatrixFillStatus(userId, session);
  const matrix = fillStatus.matrix;

  // L1 for visualization = only this user's direct referrals (first 5 by createdAt), not upline spillover
  let directRefsQuery = User.find({ sponsorId: userId }).select('_id').sort({ createdAt: 1 }).limit(5);
  if (session) directRefsQuery = directRefsQuery.session(session);
  const directRefs = await directRefsQuery;
  const level1UserIds = directRefs.map((r) => r._id.toString());

  // L2 = for each direct ref, the 5 slots under them in the matrix (by parent position)
  const level2ByParent = {};
  for (const lid of level1UserIds) {
    level2ByParent[lid] = [];
  }
  for (let p = 5; p < 30; p++) {
    const parentPos = getParentPosition(p);
    if (parentPos === null) continue;
    const parentId = parentPos < matrix.length ? matrix[parentPos] : null;
    if (!parentId || !level2ByParent[parentId]) continue;
    if (matrix[p] && level2ByParent[parentId].length < 5) {
      level2ByParent[parentId].push(matrix[p]);
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

