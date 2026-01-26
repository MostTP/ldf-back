// Database connection utility
// Provides a singleton Prisma client instance with proper connection handling
// 
// Neon PostgreSQL Configuration:
// - Use pooled connection (?pgbouncer=true) for application: better performance, connection management
// - Use direct connection (no ?pgbouncer=true) for migrations: required for schema changes
// - Prisma automatically handles connection pooling when DATABASE_URL includes ?pgbouncer=true

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

// Create Prisma client instance
// Prisma will use the DATABASE_URL from environment variables
// For Neon: ensure DATABASE_URL includes ?pgbouncer=true for pooled connections
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Test database connection
export async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return { connected: true };
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    return { 
      connected: false, 
      error: error.message 
    };
  }
}

// Graceful shutdown handler
export async function disconnect() {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
  }
}

// Handle process termination
process.on('beforeExit', async () => {
  await disconnect();
});

process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

export default prisma;

