import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

const MAX_DEPTH = 5;

interface TreeNode {
  userId: string;
  name: string;
  placementType: string;
  level: number;
  children: TreeNode[];
}

export async function getTree(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const depthParam = Math.min(MAX_DEPTH, Math.max(1, Number(req.query.depth) || 5));

  const root = await knexInstance('matrix_nodes as m')
    .join('users as u', 'm.user_id', 'u.id')
    .where('m.user_id', userId)
    .where('m.status', 'active')
    .select('m.user_id', 'm.placement_type', 'm.level', 'u.username as name')
    .first();

  if (!root) {
    res.status(404).json({ error: 'User not found in matrix' });
    return;
  }

  const rows = await knexInstance.raw(
    `
    WITH RECURSIVE tree AS (
      SELECT m.user_id, m.parent_id, m.placement_type, m.level, u.username as name, 1 AS depth
      FROM matrix_nodes m
      JOIN users u ON u.id = m.user_id
      WHERE m.parent_id = ? AND m.status = 'active'
      UNION ALL
      SELECT m.user_id, m.parent_id, m.placement_type, m.level, u.username as name, tree.depth + 1
      FROM matrix_nodes m
      JOIN users u ON u.id = m.user_id
      JOIN tree ON m.parent_id = tree.user_id
      WHERE m.status = 'active' AND tree.depth < ?
    )
    SELECT user_id, parent_id, placement_type, level, name FROM tree ORDER BY depth, parent_id, user_id
    `,
    [userId, depthParam]
  );

  const nodes = (rows.rows as { user_id: string; parent_id: string; placement_type: string; level: number; name: string }[]) || [];
  const byParent = new Map<string, typeof nodes>();
  for (const n of nodes) {
    const list = byParent.get(n.parent_id) ?? [];
    list.push(n);
    byParent.set(n.parent_id, list);
  }

  function build(node: { user_id: string; placement_type: string; level: number; name: string }): TreeNode {
    const children = (byParent.get(node.user_id) ?? []).map((c) =>
      build({ ...c, user_id: c.user_id, placement_type: c.placement_type, level: c.level, name: c.name })
    );
    return {
      userId: node.user_id,
      name: node.name,
      placementType: node.placement_type,
      level: node.level,
      children,
    };
  }

  const rootNode: TreeNode = {
    userId: root.user_id,
    name: (root as { name: string }).name ?? '',
    placementType: root.placement_type ?? 'DIRECT',
    level: root.level ?? 0,
    children: (byParent.get(userId) ?? []).map((c) => build(c)),
  };

  res.json(rootNode);
}
