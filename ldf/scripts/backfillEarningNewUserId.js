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

  const earningsWithoutNewUserId = await Earning.find({
    type: { $regex: /^MATRIX_LEVEL_/ },
    $or: [
      { 'metadata.newUserId': { $exists: false } },
      { 'metadata.newUserId': null },
    ],
  })
    .select('_id userId description metadata type')
    .lean();

  const earningsMissingPosition = await Earning.find({
    type: { $regex: /^MATRIX_LEVEL_/ },
    'metadata.newUserId': { $exists: true, $ne: null },
    $or: [
      { 'metadata.matrixPosition': { $exists: false } },
      { 'metadata.matrixPosition': null },
    ],
  })
    .select('_id userId metadata')
    .lean();

  let updated = 0;
  let skipped = 0;

  for (const e of earningsWithoutNewUserId) {
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
    const idx = matrix.indexOf(newUserId);
    const matrixPosition = idx >= 0 ? idx + 1 : null;
    const update = { 'metadata.newUserId': newUserId };
    if (matrixPosition != null) update['metadata.matrixPosition'] = matrixPosition;
    await Earning.updateOne(
      { _id: e._id },
      { $set: update }
    );
    updated++;
  }

  for (const e of earningsMissingPosition) {
    const newUserId = e.metadata?.newUserId;
    const recipientId = e.userId?.toString();
    if (!newUserId || !recipientId) continue;
    let matrix;
    try {
      const fill = await getMatrixFillStatus(recipientId);
      matrix = fill?.matrix || [];
    } catch {
      continue;
    }
    const idx = matrix.indexOf(newUserId.toString());
    if (idx < 0) continue;
    await Earning.updateOne(
      { _id: e._id },
      { $set: { 'metadata.matrixPosition': idx + 1 } }
    );
    updated++;
  }

  const forceDEarnings = await Earning.find({
    type: { $regex: /^MATRIX_LEVEL_/ },
    'metadata.newUserId': { $exists: true, $ne: null },
    $or: [
      { 'metadata.isSlotHolder': true },
      { 'metadata.forceType': 'D' },
      { description: { $regex: /slot holder|Force D/i } },
    ],
  })
    .select('_id userId metadata')
    .lean();

  for (const e of forceDEarnings) {
    const slotHolderId = e.userId?.toString();
    const newUserId = e.metadata?.newUserId?.toString();
    if (!slotHolderId || !newUserId) continue;
    let slotHolder;
    try {
      slotHolder = await User.findById(slotHolderId).select('sponsorId').lean();
    } catch {
      continue;
    }
    const sponsorId = slotHolder?.sponsorId?.toString();
    if (!sponsorId) continue;
    let sponsorMatrix;
    try {
      const fill = await getMatrixFillStatus(sponsorId);
      sponsorMatrix = fill?.matrix || [];
    } catch {
      continue;
    }
    const slotHolderL1Index = sponsorMatrix.slice(0, 5).findIndex((id) => (id || '').toString() === slotHolderId);
    if (slotHolderL1Index < 0) continue;
    const newUserPosition = sponsorMatrix.indexOf(newUserId);
    if (newUserPosition < 5) continue;
    const level2Start = 5 + slotHolderL1Index * 5;
    const level2End = level2Start + 5;
    if (newUserPosition < level2Start || newUserPosition >= level2End) continue;
    const positionInLeg = (newUserPosition - level2Start) + 1;
    await Earning.updateOne(
      { _id: e._id },
      { $set: { 'metadata.positionInLeg': positionInLeg, 'metadata.isSlotHolder': true, 'metadata.forceType': 'D' } }
    );
    updated++;
  }

  console.log(`Backfill complete: ${updated} earnings updated (newUserId, matrixPosition, and/or positionInLeg for Force D), ${skipped} skipped.`);
  await disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
