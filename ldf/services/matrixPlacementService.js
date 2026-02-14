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

  let levelStartPosition = 5;
  const userSpillover = allDirectReferrals.slice(availableLevel1Slots);
  let spilloverIndex = 0;

  for (let level = 1; level < 5; level++) {
    const levelCapacity = capacities[level];
    const usersPerParent = 5;

    if (level === 1) {
      for (let i = 0; i < level1Users.length; i++) {
        const parentUserId = level1Users[i];
        if (!parentUserId) continue;

        let parentQuery = User.find({ sponsorId: parentUserId })
          .select('_id')
          .sort({ createdAt: 1 })
          .limit(usersPerParent);
        if (session) parentQuery = parentQuery.session(session);
        const parentDirectReferrals = await parentQuery;

        for (let j = 0; j < usersPerParent; j++) {
          const absolutePosition = levelStartPosition + (i * usersPerParent) + j;
          if (absolutePosition < matrix.length && j < parentDirectReferrals.length) {
            matrix[absolutePosition] = parentDirectReferrals[j]._id.toString();
          }
        }
      }

      if (spilloverIndex < userSpillover.length) {
        const levelStarts = [5, 30, 155, 780];
        const levelCaps = [25, 125, 625, 3125];
        for (let depth = levelStarts.length - 1; depth >= 0 && spilloverIndex < userSpillover.length; depth--) {
          const depthStart = levelStarts[depth];
          const depthCapacity = levelCaps[depth];
          
          for (let i = 0; i < depthCapacity && spilloverIndex < userSpillover.length; i++) {
            const absolutePosition = depthStart + i;
            if (absolutePosition < matrix.length && matrix[absolutePosition] === null) {
              matrix[absolutePosition] = userSpillover[spilloverIndex]._id.toString();
              spilloverIndex++;
            }
          }
        }
      }
    } else {
      const parentLevelUsers = [];
      const previousLevelCapacity = capacities[level - 1];
      const previousLevelStart = levelStartPosition - previousLevelCapacity;
      
      for (let i = 0; i < previousLevelCapacity; i++) {
        const pos = previousLevelStart + i;
        if (pos >= 0 && pos < matrix.length && matrix[pos] !== null) {
          parentLevelUsers.push(matrix[pos]);
        }
      }

      let parentIndex = 0;
      for (const parentUserId of parentLevelUsers) {
        if (!parentUserId) continue;

        let parentQuery = User.find({ sponsorId: parentUserId })
          .select('_id')
          .sort({ createdAt: 1 })
          .limit(usersPerParent);
        if (session) parentQuery = parentQuery.session(session);
        const parentDirectReferrals = await parentQuery;

        for (let j = 0; j < usersPerParent; j++) {
          const absolutePosition = levelStartPosition + (parentIndex * usersPerParent) + j;
          if (absolutePosition < matrix.length && j < parentDirectReferrals.length) {
            matrix[absolutePosition] = parentDirectReferrals[j]._id.toString();
          }
        }
        parentIndex++;
      }
    }

    levelStartPosition += levelCapacity;
  }

  return matrix;
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
 * Get matrix tree structure for visualization (Level 1 & Level 2)
 * @param {string} userId - The user ID
 * @param {object} session - MongoDB session
 * @returns {Promise<Object>} Tree structure with root, level1, and level2
 */
export async function getMatrixTreeStructure(userId, session = null) {
  const fillStatus = await getMatrixFillStatus(userId, session);
  const matrix = fillStatus.matrix;
  
  let userQuery = User.findById(userId)
    .select('_id username firstName lastName sponsorId');
  if (session) userQuery = userQuery.session(session);
  const user = await userQuery;
  
  if (!user) {
    return null;
  }

  const level1UserIds = [];
  for (let i = 0; i < 5; i++) {
    if (matrix[i] !== null) {
      level1UserIds.push(matrix[i]);
    }
  }

  let level1Query = User.find({ _id: { $in: level1UserIds } })
    .select('_id username firstName lastName');
  if (session) level1Query = level1Query.session(session);
  const level1Users = await level1Query;

  const level2ByParent = {};
  let level2Position = 5;

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

  const allLevel2Ids = Object.values(level2ByParent).flat();
  let level2Query = User.find({ _id: { $in: allLevel2Ids } })
    .select('_id username firstName lastName');
  if (session) level2Query = level2Query.session(session);
  const level2Users = await level2Query;

  const level2UsersMap = {};
  level2Users.forEach(u => {
    level2UsersMap[u._id.toString()] = {
      id: u._id.toString(),
      username: u.username,
      displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
    };
  });

  return {
    root: {
      id: user._id.toString(),
      username: user.username,
      displayName: `${user.firstName} ${user.lastName}`.trim() || user.username,
    },
    level1: level1Users.map(u => ({
      id: u._id.toString(),
      username: u.username,
      displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
      children: (level2ByParent[u._id.toString()] || []).map(id => level2UsersMap[id.toString()] || null).filter(Boolean),
    })),
    fillStatus: {
      totalFilled: fillStatus.totalFilled,
      levelCounts: fillStatus.levelCounts,
    },
  };
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

