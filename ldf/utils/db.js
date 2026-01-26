import mongoose from 'mongoose';
import { logger } from './logger.js';

let isConnected = false;

export async function testConnection() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      return { connected: true };
    }
    return { connected: false, error: 'Not connected to database' };
  } catch (error) {
    logger.error('Database connection failed');
    return { connected: false, error: error.message };
  }
}

export async function connect() {
  if (isConnected) {
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.DATABASE_URL, options);
    isConnected = true;
    logger.info('MongoDB connected');
  } catch (error) {
    isConnected = false;
    logger.error('MongoDB connection error');
    throw error;
  }
}

export async function disconnect() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
  } catch (error) {
    logger.error('Error disconnecting database:', error);
  }
}

mongoose.connection.on('connected', () => {
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

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

export default mongoose;

