// Simple logger utility
const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (...args) => {
    if (isDevelopment) console.log('[INFO]', ...args);
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
  warn: (...args) => {
    if (isDevelopment) console.warn('[WARN]', ...args);
  },
};

