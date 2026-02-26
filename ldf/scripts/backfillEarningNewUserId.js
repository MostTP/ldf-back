/**
 * Backfill metadata.newUserId on old matrix earnings so earning history shows
 * each user's current matrix position (fixes duplicate "position #7" for Ty7 vs Sol1).
 * Run from the ldf directory: node scripts/backfillEarningNewUserId.js
 */
import dotenv from 'dotenv';
import { connect, disconnect } from '../utils/db.js';
import { User, Earning } from '../models/index.js';
import { getMatrixFillStatus } from '../services/matrixPlacementService.js';

dotenv.config();

const NAME_REGEX = /for\s+([^(]+?)\s*\(\s*position/i;

function parseNameFromDescription(description) {
  if (!description || typeof description !== 'string') return null;
  const m = description.match(NAME_REGEX);
  return m ? m[1].trim() : null;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not set');
    process.exit(1);
  }

  await connect();

  const earnings = await Earning.find({
    type: { $regex: /^MATRIX_LEVEL_/ },
    $or: [
      { 'metadata.newUserId': { $exists: false } },
      { 'metadata.newUserId': null },
    ],
  })
    .select('_id userId description metadata type')
    .lean();

  let updated = 0;
  let skipped = 0;

  for (const e of earnings) {
    const name = parseNameFromDescription(e.description);
    if (!name) {
      skipped++;
      continue;
    }

    const recipientId = e.userId?.toString();
    if (!recipientId) {
      skipped++;
      continue;
    }

    let matrix;
    try {
      const fill = await getMatrixFillStatus(recipientId);
      matrix = fill?.matrix || [];
    } catch {
      skipped++;
      continue;
    }

    const userIds = [...new Set(matrix.filter(Boolean))];
    if (userIds.length === 0) {
      skipped++;
      continue;
    }

    const users = await User.find({ _id: { $in: userIds } })
      .select('_id firstName lastName')
      .lean();

    const matches = users.filter((u) => {
      const fullName = `${(u.firstName || '').trim()} ${(u.lastName || '').trim()}`.trim();
      return fullName === name;
    });

    if (matches.length !== 1) {
      skipped++;
      continue;
    }

    const newUserId = matches[0]._id.toString();
    await Earning.updateOne(
      { _id: e._id },
      { $set: { 'metadata.newUserId': newUserId } }
    );
    updated++;
  }

  console.log(`Backfill complete: ${updated} earnings updated with metadata.newUserId, ${skipped} skipped.`);
  await disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
