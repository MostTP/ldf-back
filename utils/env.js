// Environment variable validation
export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    if (isProduction) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(key => console.error(`   - ${key}`));
      console.error('\nPlease set these in your .env file');
      process.exit(1);
    } else {
      // In development, warn but don't exit
      console.warn('⚠️  Missing environment variables (development mode):');
      missing.forEach(key => console.warn(`   - ${key}`));
      console.warn('\nPlease set these in your .env file for production');
    }
  }

  // Warn about optional but important vars
  if (!process.env.FLUTTERWAVE_SECRET_HASH && isProduction) {
    console.warn('⚠️  FLUTTERWAVE_SECRET_HASH not set - webhook verification disabled');
  }
}

