import { PrismaClient } from '@prisma/client';
import { recalculateBalance } from '../services/withdrawalService.js';

const prisma = new PrismaClient();

async function initializeAllBalances() {
  console.log('🔄 Initializing balances for all users...');

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true },
    });

    console.log(`Found ${users.length} users to process`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const balance = await recalculateBalance(user.id);
        console.log(`✅ User ${user.username} (${user.email}): ₦${balance.toLocaleString()}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error calculating balance for user ${user.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Completed!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
initializeAllBalances();

