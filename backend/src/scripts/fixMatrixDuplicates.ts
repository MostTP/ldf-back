/**
 * Fix duplicate (parent_id, position) rows in matrix_nodes and list active users without a node.
 * Run with: npm run db:fix-matrix
 */
import 'dotenv/config';
import { knexInstance } from '../config/db.js';

const PARENT_ID_FROM_ERROR = 'a8c6edd9-810f-4a21-9376-dec7c2283aad';

async function main() {
  console.log('Checking matrix_nodes for duplicate (parent_id, position)...\n');

  const rows = await knexInstance('matrix_nodes')
    .where({ parent_id: PARENT_ID_FROM_ERROR })
    .select('id', 'user_id', 'parent_id', 'position', 'level', 'created_at')
    .orderBy('position')
    .orderBy('created_at');

  console.log(`Rows under parent ${PARENT_ID_FROM_ERROR}:`);
  if (rows.length === 0) {
    console.log('  (none)\n');
  } else {
    rows.forEach((r: { id: string; user_id: string; position: number; created_at: string }) => {
      console.log(`  id=${r.id} user_id=${r.user_id} position=${r.position} created_at=${r.created_at}`);
    });
    console.log('');
  }

  const duplicates = await knexInstance.raw(
    `
    SELECT parent_id, position, COUNT(*) AS cnt
    FROM matrix_nodes
    GROUP BY parent_id, position
    HAVING COUNT(*) > 1
    `
  );
  const dupRows = (duplicates.rows as { parent_id: string; position: number; cnt: string }[]) || [];

  if (dupRows.length === 0) {
    console.log('No duplicate (parent_id, position) pairs found. Nothing to delete.\n');
  } else {
    console.log('Duplicate (parent_id, position) pairs found. Removing extra rows (keeping earliest created_at)...');
    for (const d of dupRows) {
      const toDelete = await knexInstance('matrix_nodes')
        .where({ parent_id: d.parent_id, position: d.position })
        .orderBy('created_at', 'asc')
        .orderBy('id', 'asc')
        .offset(1)
        .select('id');
      const ids = toDelete.map((r: { id: string }) => r.id);
      if (ids.length > 0) {
        const deleted = await knexInstance('matrix_nodes').whereIn('id', ids).delete();
        console.log(`  parent_id=${d.parent_id} position=${d.position}: deleted ${deleted} row(s)`);
      }
    }
    console.log('');
  }

  const activeWithoutNode = await knexInstance('users')
    .leftJoin('matrix_nodes as m', 'users.id', 'm.user_id')
    .where({ 'users.role': 'Member', 'users.status': 'active' })
    .whereNull('m.id')
    .select('users.id', 'users.username', 'users.email', 'users.referred_by', 'users.created_at');

  console.log('Active members without a matrix node:');
  if (activeWithoutNode.length === 0) {
    console.log('  (none)\n');
  } else {
    activeWithoutNode.forEach((u: { id: string; username: string; email: string; referred_by: string; created_at: string }) => {
      console.log(`  id=${u.id} username=${u.username} email=${u.email} referred_by=${u.referred_by}`);
    });
    console.log('');
  }

  console.log('Done.');
}

main()
  .then(() => knexInstance.destroy())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    knexInstance.destroy().finally(() => process.exit(1));
  });
