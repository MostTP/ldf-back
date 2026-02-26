/**
 * Reassign spillover positions so L1 direct-ref slots are not duplicated.
 * Run from the ldf directory: node scripts/reassignSpilloverPositions.js
 */
import dotenv from 'dotenv';
import { connect, disconnect } from '../utils/db.js';
import { reassignAllSpilloverPositions } from '../services/matrixPlacementService.js';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL is not set');
  process.exit(1);
}

async function main() {
  try {
    await connect();
    const { sponsorsProcessed, totalUpdated } = await reassignAllSpilloverPositions();
    console.log(`Reassigned spillover positions: ${totalUpdated} users updated across ${sponsorsProcessed} sponsor(s).`);
  } catch (err) {
    console.error('Reassign failed:', err);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

main();
