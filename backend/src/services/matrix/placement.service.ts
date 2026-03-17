import type { Knex } from 'knex';
import { calculateMatrixEarnings } from './earnings.service.js';
import { checkCycleCompletion } from './cycle.service.js';

async function classifyPlacement(
  sponsorId: string,
  parentId: string,
  trx: Knex.Transaction
): Promise<'DIRECT' | 'SPILLUNDER' | 'SPILLOVER'> {
  if (parentId === sponsorId) return 'DIRECT';

  const result = await trx.raw(
    `
    WITH RECURSIVE subtree AS (
      SELECT user_id FROM matrix_nodes WHERE user_id = ?
      UNION ALL
      SELECT m.user_id FROM matrix_nodes m
      INNER JOIN subtree s ON m.parent_id = s.user_id
    )
    SELECT 1 FROM subtree WHERE user_id = ? LIMIT 1
    `,
    [sponsorId, parentId]
  );

  const rows = result.rows as { '?column?': number }[];
  return rows.length > 0 ? 'SPILLUNDER' : 'SPILLOVER';
}

export async function placeNewMember(
  newUserId: string,
  sponsorId: string,
  trx: Knex.Transaction
): Promise<void> {
  // Advisory lock keyed by sponsor so placements under same sponsor serialize (works with connection poolers e.g. Neon)
  await trx.raw(`SELECT pg_advisory_xact_lock(hashtext(?))`, [sponsorId]);
  await trx.raw(
    `SELECT id FROM matrix_nodes WHERE sponsor_id = ? OR parent_id = ? FOR UPDATE`,
    [sponsorId, sponsorId]
  );

  const sponsorNode = await trx('matrix_nodes').where({ user_id: sponsorId, status: 'active' }).first('user_id');
  let placed = false;
  if (!sponsorNode) {
    await trx.raw('SAVEPOINT place_direct');
    try {
      await trx('matrix_nodes').insert({
        user_id: newUserId,
        sponsor_id: sponsorId,
        parent_id: sponsorId,
        position: 1,
        level: 1,
        placement_type: 'DIRECT',
        status: 'active',
      });
      await calculateMatrixEarnings(newUserId, sponsorId, trx);
      placed = true;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== '23505') throw err;
      // Duplicate: another request won the race. Roll back to savepoint so transaction is usable, then use BFS.
      await trx.raw('ROLLBACK TO SAVEPOINT place_direct');
    }
  }

  if (!placed) {
    let parentId: string | null = null;
    let position: number | null = null;

    if (!sponsorNode) {
      // Sponsor has no matrix node (e.g. agent): use positions 1–5 under sponsor, then BFS from their children for spillover.
      const countRow = await trx('matrix_nodes')
        .where({ parent_id: sponsorId, status: 'active' })
        .count('id as c')
        .first();
      const count = Number((countRow as { c: string })?.c ?? 0);
      if (count < 5) {
        parentId = sponsorId;
        position = count + 1;
      } else {
        // Direct slots full: find first open slot at level 2+ via BFS from sponsor's direct children.
        const bfsResult = await trx.raw(
          `
    WITH RECURSIVE bfs AS (
      SELECT user_id, 1 AS depth FROM matrix_nodes WHERE parent_id = ? AND status = 'active'
      UNION ALL
      SELECT m.user_id, bfs.depth + 1 FROM matrix_nodes m
      INNER JOIN bfs ON m.parent_id = bfs.user_id
      WHERE m.status = 'active' AND bfs.depth < 5
    )
    SELECT bfs.user_id, COUNT(children.id) AS child_count
    FROM bfs
    LEFT JOIN matrix_nodes children ON children.parent_id = bfs.user_id AND children.status = 'active'
    GROUP BY bfs.user_id, bfs.depth
    HAVING COUNT(children.id) < 5
    ORDER BY bfs.depth ASC, bfs.user_id ASC
    LIMIT 1
    `,
          [sponsorId]
        );
        const firstSlot = (bfsResult.rows as { user_id: string; child_count: string }[])[0];
        if (firstSlot) {
          parentId = firstSlot.user_id;
          position = Number(firstSlot.child_count) + 1;
        }
        if (!parentId) {
          await checkCycleCompletion(sponsorId, trx);
          throw new Error('Sponsor matrix is full (781 slots). Registration cannot place this user.');
        }
      }
    } else {
      const bfsResult = await trx.raw(
        `
    WITH RECURSIVE bfs AS (
      SELECT user_id, 0 AS depth FROM matrix_nodes WHERE user_id = ? AND status = 'active'
      UNION ALL
      SELECT m.user_id, bfs.depth + 1 FROM matrix_nodes m
      INNER JOIN bfs ON m.parent_id = bfs.user_id
      WHERE m.status = 'active' AND bfs.depth < 5
    )
    SELECT bfs.user_id, COUNT(children.id) AS child_count
    FROM bfs
    LEFT JOIN matrix_nodes children ON children.parent_id = bfs.user_id AND children.status = 'active'
    GROUP BY bfs.user_id, bfs.depth
    HAVING COUNT(children.id) < 5
    ORDER BY bfs.depth ASC, bfs.user_id ASC
    LIMIT 1
    `,
        [sponsorId]
      );
      const firstSlot = (bfsResult.rows as { user_id: string; child_count: string }[])[0];
      if (firstSlot) {
        parentId = firstSlot.user_id;
        position = Number(firstSlot.child_count) + 1;
      }
      if (!parentId) {
        await checkCycleCompletion(sponsorId, trx);
        throw new Error('Sponsor matrix is full (781 slots). Registration cannot place this user.');
      }
    }

    const parentNode = await trx('matrix_nodes').where({ user_id: parentId }).first('level');
    const newLevel = parentId === sponsorId ? 1 : (Number(parentNode?.level) || 0) + 1;
    const placementType = await classifyPlacement(sponsorId, parentId, trx);

    await trx('matrix_nodes').insert({
      user_id: newUserId,
      sponsor_id: sponsorId,
      parent_id: parentId,
      position: position!,
      level: newLevel,
      placement_type: placementType,
      status: 'active',
    });

    await calculateMatrixEarnings(newUserId, parentId, trx);
  }
}
