// Test script for Neon database connection
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  console.log('\nPlease set DATABASE_URL in your .env file:');
  console.log('DATABASE_URL=postgresql://neondb_owner:npg_xdKG2WhTAC0i@ep-soft-band-ahyjejbf-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require');
  process.exit(1);
}

console.log('🔍 Testing Neon database connection...');
console.log('📍 Host:', dbUrl.match(/@([^:/\s]+)/)?.[1] || 'unknown');
console.log('📊 Database:', dbUrl.match(/\/([^?]+)/)?.[1] || 'unknown');
console.log('');

const prisma = new PrismaClient({
  log: ['error'],
});

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log('Test 1: Testing basic connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic connection successful');

    // Test 2: Check database version
    console.log('\nTest 2: Checking database version...');
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database version:', version[0].version.split(' ')[0] + ' ' + version[0].version.split(' ')[1]);

    // Test 3: Check if tables exist
    console.log('\nTest 3: Checking Prisma schema tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} table(s):`);
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. Run migrations: npx prisma migrate deploy');
    }

    // Test 4: Test a simple query (if User table exists)
    if (tables.some(t => t.table_name === 'User')) {
      console.log('\nTest 4: Testing User table query...');
      const userCount = await prisma.user.count();
      console.log(`✅ User table accessible. Found ${userCount} user(s)`);
    }

    console.log('\n🎉 All tests passed! Database connection is working.');
    console.log('\nNext steps:');
    console.log('1. Run migrations: npx prisma migrate deploy');
    console.log('2. Test your API endpoints');
    console.log('3. Check health endpoint: https://ldf-back-1.onrender.com/health');

  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('channel_binding')) {
      console.error('\n💡 Solution: Remove channel_binding from DATABASE_URL');
      console.error('   Change: ?sslmode=require&channel_binding=require');
      console.error('   To:     ?sslmode=require');
    } else if (error.message.includes("Can't reach database server")) {
      console.error('\n💡 Possible causes:');
      console.error('   1. Database is paused (wake it up in Neon dashboard)');
      console.error('   2. Wrong hostname in connection string');
      console.error('   3. Network/firewall issue');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Solution: Check username and password in DATABASE_URL');
      console.error('   Reset password in Neon dashboard if needed');
    } else if (error.message.includes('does not exist')) {
      console.error('\n💡 Solution: Check database name in DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

