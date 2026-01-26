import { connect, disconnect } from '../utils/db.js';
import { recalculateBalance } from '../services/withdrawalService.js';
import { User } from '../models/index.js';

async function initializeAllBalances() {
  try {
    await connect();
    const users = await User.find({}).select('_id email username');

    console.log(`Found ${users.length} users to process`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const balance = await recalculateBalance(user._id.toString());
        console.log(`User ${user.username} (${user.email}): ₦${balance.toLocaleString()}`);
        successCount++;
      } catch (error) {
        console.error(`Error calculating balance for user ${user._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Completed! Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

initializeAllBalances();
