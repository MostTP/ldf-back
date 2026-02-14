// Script to check database connection and show user information
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...\n');
    
    // Check DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    console.log(`📊 DATABASE_URL: ${dbUrl}`);
    console.log(`📊 Provider: SQLite (no password required)\n`);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Get user count
    const userCount = await prisma.user.count();
    console.log(`👥 Total users in database: ${userCount}\n`);
    
    // List all users (without password hashes for security)
    if (userCount > 0) {
      console.log('📋 Users in database:');
      console.log('─'.repeat(80));
      const users = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          phone: true,
          isAgent: true,
          isPremium: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Agent: ${user.isAgent ? '✅' : '❌'} | Premium: ${user.isPremium ? '✅' : '❌'} | Verified: ${user.emailVerified ? '✅' : '❌'}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      });
      console.log('\n' + '─'.repeat(80));
      console.log('\n💡 Note: Passwords are hashed with bcrypt and cannot be retrieved.');
      console.log('   Default test password for seeded users: password123');
    } else {
      console.log('⚠️  No users found in database.');
      console.log('   Run: npm run seed (to seed test data)');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. DATABASE_URL is set in .env file');
    console.error('   2. For SQLite: DATABASE_URL="file:./prisma/dev.db"');
    console.error('   3. Database file exists at the specified path');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

