/**
 * Place active members who have a sponsor (referred_by) but no matrix_nodes row.
 * Use when a referral shows in "My Referrals" but not in "My Matrix" (placement failed earlier).
 * Run with: npm run db:place-missing-matrix
 */
import 'dotenv/config';
import { knexInstance } from '../config/db.js';
import { placeNewMember } from '../services/matrix/placement.service.js';

async function main() {
  const missing = await knexInstance('users')
    .leftJoin('matrix_nodes as m', 'users.id', 'm.user_id')
    .where({ 'users.role': 'Member', 'users.status': 'active' })
    .whereNotNull('users.referred_by')
    .whereNull('m.id')
    .select('users.id', 'users.username', 'users.email', 'users.referred_by');

  if (missing.length === 0) {
    console.log('No active members missing a matrix node. Nothing to do.');
    return;
  }

  console.log(`Found ${missing.length} active member(s) without a matrix node. Placing them now...\n`);

  for (const u of missing as { id: string; username: string; email: string; referred_by: string }[]) {
    const sponsorId = u.referred_by;
    if (!sponsorId) continue;
    try {
      await knexInstance.transaction(async (trx) => {
        await placeNewMember(u.id, sponsorId, trx);
      });
      console.log(`  Placed ${u.username} (${u.email}) under sponsor ${sponsorId}`);
    } catch (err) {
      console.error(`  Failed to place ${u.username} (${u.id}):`, (err as Error).message);
    }
  }

  console.log('\nDone.');
}

main()
  .then(() => knexInstance.destroy())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    knexInstance.destroy().finally(() => process.exit(1));
  });
