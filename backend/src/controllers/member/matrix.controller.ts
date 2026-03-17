import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

export async function getPosition(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const node = await knexInstance('matrix_nodes').where({ user_id: id, status: 'active' }).first();
  const directRow = await knexInstance('matrix_nodes').where({ parent_id: id, status: 'active' }).count('id as count').first();
  const directDownlineCount = Number(directRow?.count ?? 0);

  if (!node) {
    // User has no matrix node (e.g. root/first user); return 200 with defaults so Matrix page can render
    res.json({
      level: 1,
      position: 1,
      placementType: 'DIRECT',
      sponsor: null,
      parentNode: null,
      subtreeSize: directDownlineCount,
      directDownlineCount,
    });
    return;
  }

  const sponsor = await knexInstance('users').where({ id: node.sponsor_id }).first('id', 'username', 'full_name');
  const parent = await knexInstance('users').where({ id: node.parent_id }).first('id', 'username');
  const subtreeRow = await knexInstance('matrix_nodes').where({ sponsor_id: node.sponsor_id, status: 'active' }).count('id as count').first();
  res.json({
    level: node.level,
    position: node.position,
    placementType: node.placement_type,
    sponsor: sponsor ? { id: sponsor.id, username: sponsor.username, fullName: sponsor.full_name } : null,
    parentNode: parent ? { id: parent.id, username: parent.username } : null,
    subtreeSize: Number(subtreeRow?.count ?? 0),
    directDownlineCount,
  });
}

export async function getDownline(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const level = Math.min(5, Math.max(1, Number(req.query.level) || 1));
  const depth = level;

  if (depth === 1) {
    const rows = await knexInstance('matrix_nodes')
      .where({ parent_id: id, status: 'active' })
      .select('user_id', 'parent_id', 'placement_type', 'level', 'position', 'created_at')
      .orderBy('position', 'asc');
    if (rows.length === 0) {
      res.json({ data: [] });
      return;
    }
    const userIds = rows.map((r: { user_id: string }) => r.user_id);
    const users = await knexInstance('users').whereIn('id', userIds).select('id', 'username', 'full_name', 'email', 'phone', 'status');
    const byId = new Map(users.map((u: { id: string }) => [u.id, u]));
    const data = (rows as { user_id: string; parent_id: string; placement_type: string; level: number; position: number; created_at: string }[]).map((n) => {
      const u = byId.get(n.user_id) as { username: string; full_name: string | null; email: string; phone: string | null; status: string } | undefined;
      const accountStatus = u?.status === 'active' ? 'Active' : u?.status === 'suspended' ? 'Suspended' : 'Pending';
      return {
        id: n.user_id,
        userId: n.user_id,
        parentId: n.parent_id,
        username: u?.username,
        fullName: u?.full_name,
        name: u?.full_name ?? u?.username ?? '',
        email: u?.email ?? '',
        phone: u?.phone ?? '',
        accountStatus,
        joinedAt: n.created_at,
        joinedDate: n.created_at,
        placementType: n.placement_type,
        level: n.level,
        position: n.position,
      };
    });
    res.json({ data });
    return;
  }

  // Deeper levels: recursive CTE for depth N, then return all at that depth (no sponsor filter)
  const result = await knexInstance.raw(
    `WITH RECURSIVE d AS (
      SELECT user_id, 1 AS depth FROM matrix_nodes WHERE parent_id = ? AND status = 'active'
      UNION ALL
      SELECT m.user_id, d.depth + 1 FROM matrix_nodes m
      JOIN d ON m.parent_id = d.user_id WHERE d.depth < 5 AND m.status = 'active'
    )
    SELECT user_id FROM d WHERE depth = ?`,
    [id, depth]
  );
  const userIds = (result.rows as { user_id: string }[]).map((r) => r.user_id);
  if (userIds.length === 0) {
    res.json({ data: [] });
    return;
  }
  const nodes = await knexInstance('matrix_nodes')
    .whereIn('user_id', userIds)
    .where({ status: 'active' })
    .select('user_id', 'parent_id', 'placement_type', 'level', 'position', 'created_at');
  const users = await knexInstance('users').whereIn('id', userIds).select('id', 'username', 'full_name', 'email', 'phone', 'status');
  const byId = new Map(users.map((u: { id: string }) => [u.id, u]));
  const data = (nodes as { user_id: string; parent_id: string; placement_type: string; level: number; position: number; created_at: string }[]).map((n) => {
    const u = byId.get(n.user_id) as { username: string; full_name: string | null; email: string; phone: string | null; status: string } | undefined;
    const accountStatus = u?.status === 'active' ? 'Active' : u?.status === 'suspended' ? 'Suspended' : 'Pending';
    return {
      id: n.user_id,
      userId: n.user_id,
      parentId: n.parent_id,
      username: u?.username,
      fullName: u?.full_name,
      name: u?.full_name ?? u?.username ?? '',
      email: u?.email ?? '',
      phone: u?.phone ?? '',
      accountStatus,
      joinedAt: n.created_at,
      joinedDate: n.created_at,
      placementType: n.placement_type,
      level: n.level,
      position: n.position,
    };
  });
  res.json({ data });
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;

  const [totalRow, subtreeRow, byLevel, byPlacement, matrixEarnings, cyclesRow] = await Promise.all([
    knexInstance('matrix_nodes').where({ sponsor_id: id, status: 'active' }).count('id as count').first(),
    knexInstance.raw(
      `
      WITH RECURSIVE subtree AS (
        SELECT user_id FROM matrix_nodes WHERE parent_id = ? AND status = 'active'
        UNION ALL
        SELECT m.user_id FROM matrix_nodes m
        INNER JOIN subtree s ON m.parent_id = s.user_id
        WHERE m.status = 'active'
      )
      SELECT COUNT(*)::int AS count FROM subtree
      `,
      [id]
    ).then((r) => (r.rows as { count: number }[])[0]),
    knexInstance('matrix_nodes').where({ sponsor_id: id, status: 'active' }).select('level').count('id as count').groupBy('level'),
    knexInstance('matrix_nodes').where({ sponsor_id: id, status: 'active' }).select('placement_type').count('id as count').groupBy('placement_type'),
    knexInstance('earnings_ledger').where({ user_id: id, type: 'MATRIX' }).sum('amount as total').first(),
    knexInstance('earnings_ledger').where({ user_id: id, type: 'MATRIX' }).whereRaw("description LIKE '%cycle%'").count('id as count').first(),
  ]);
  const byLevelMap: Record<string, number> = {};
  for (const r of byLevel as { level: number; count: string }[]) {
    byLevelMap[String(r.level)] = Number(r.count);
  }
  const byPlacementMap: Record<string, number> = {};
  for (const r of byPlacement as { placement_type: string; count: string }[]) {
    byPlacementMap[r.placement_type] = Number(r.count);
  }
  const totalDownline = Number(totalRow?.count ?? 0);
  const filledSpots = Number(subtreeRow?.count ?? 0);
  res.json({
    totalDownline,
    filledSpots,
    byLevel: byLevelMap,
    byPlacementType: byPlacementMap,
    totalMatrixEarnings: Number(matrixEarnings?.total ?? 0),
    cyclesCompleted: Number(cyclesRow?.count ?? 0),
  });
}
