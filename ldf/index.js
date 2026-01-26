import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import activationRoutes from './routes/activation.js';
import withdrawalRoutes from './routes/withdrawal.js';
import webhookRoutes from './routes/webhook.js';
import agentRoutes from './routes/agent.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import paymentRoutes from './routes/payment.js';
import { validateEnv } from './utils/env.js';
import { logger } from './utils/logger.js';

dotenv.config();

// Validate required environment variables (warns in dev, exits in prod)
validateEnv();

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy - Required for Render and other reverse proxies
// This allows Express to correctly identify the client's IP address
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Common localhost origins for development/testing
    const localhostOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
    ];
    
    
    // Build allowed origins list
    const allowedOrigins = [
      process.env.FRONTEND_URL, // Production frontend URL from env
      'https://ldf-projecct.vercel.app', // Vercel frontend deployment
      'https://www.ldf-projecct.vercel.app', // Vercel www subdomain
      ...localhostOrigins, // Always allow localhost for testing
    ].filter(Boolean); // Remove undefined values
    
    // Normalize origin (remove trailing slash and convert to lowercase for comparison)
    const normalizeOrigin = (orig) => orig ? orig.replace(/\/$/, '').toLowerCase() : null;
    const normalizedOrigin = normalizeOrigin(origin);
    
    // Log the incoming origin for debugging
    logger.info(`CORS check - Origin: ${origin}, Normalized: ${normalizedOrigin}`);
    logger.info(`CORS check - Allowed origins: ${allowedOrigins.join(', ')}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || !normalizedOrigin) {
      logger.info('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin matches any allowed origin (exact or normalized, case-insensitive)
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = normalizeOrigin(allowed);
      return normalizedOrigin === normalizedAllowed || 
             normalizedOrigin === allowed.toLowerCase() ||
             normalizedOrigin.includes('ldf-projecct.vercel.app');
    });
    
    // Also check if it's a Vercel domain (more permissive for Vercel)
    const isVercelDomain = normalizedOrigin.includes('.vercel.app') || 
                          normalizedOrigin.includes('vercel.app');
    
    // In production, be more permissive with origins to avoid CORS issues
    // Allow any origin that looks like a valid frontend deployment
    const isProduction = process.env.NODE_ENV === 'production';
    const looksLikeFrontend = isProduction && (
      normalizedOrigin.includes('vercel.app') ||
      normalizedOrigin.includes('netlify.app') ||
      normalizedOrigin.includes('github.io') ||
      normalizedOrigin.includes('render.com') ||
      normalizedOrigin.includes('localhost') ||
      normalizedOrigin.includes('127.0.0.1')
    );
    
    if (isAllowed || isVercelDomain || looksLikeFrontend) {
      logger.info(`CORS: Allowing origin: ${normalizedOrigin}`);
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      logger.warn(`CORS blocked origin: ${normalizedOrigin}`);
      logger.warn(`Allowed origins: ${allowedOrigins.join(', ')}`);
      // In production, allow the request but log a warning
      if (isProduction) {
        logger.warn(`CORS: Allowing origin in production mode: ${normalizedOrigin}`);
        callback(null, true);
      } else {
      callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
};

// Middleware - CORS must be first
app.use(cors(corsOptions));

// Raw body for webhook signature verification (Flutterwave & Seerbit) - must be before express.json()
app.use('/api/webhooks/payment', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/seerbit', express.raw({ type: 'application/json' }));

// Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later .',
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Security headers (after CORS to avoid conflicts)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activate', activationRoutes);
app.use('/api/withdraw', withdrawalRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);

// Health check with diagnostics
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Check database connection
  const dbUrl = process.env.DATABASE_URL || '';
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const isNeon = dbUrl.includes('neon.tech') || dbUrl.includes('neon.tech');
  
  // Warn if using localhost in production
  if (isProduction && isLocalhost) {
    health.database = 'misconfigured';
    health.databaseError = 'DATABASE_URL uses localhost - this will not work in production. Use your production database hostname.';
    health.status = 'error';
  } else {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.databaseError = process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Database connection failed. Check DATABASE_URL and ensure database is accessible.';
      health.status = 'degraded';
      
      // Provide helpful hints for common errors
      if (error.message?.includes("Can't reach database server")) {
        health.databaseHint = 'Check if DATABASE_URL hostname is correct and database service is running.';
      } else if (error.message?.includes("authentication failed")) {
        health.databaseHint = 'Check database username and password in DATABASE_URL.';
      } else if (error.message?.includes("does not exist")) {
        health.databaseHint = 'Check if database name in DATABASE_URL is correct.';
      }
    }
  }

  // Check critical environment variables
  health.env = {
    hasJWTSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasFrontendUrl: !!process.env.FRONTEND_URL,
    databaseUrlFormat: isLocalhost 
      ? 'localhost (local only)' 
      : isNeon 
        ? 'Neon (production)' 
        : 'production hostname',
    databaseProvider: isNeon ? 'Neon' : isLocalhost ? 'Local' : 'Other',
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check for common configuration issues
  const dbUrl = process.env.DATABASE_URL || '';
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  
  if (isProduction && isLocalhost) {
    logger.error('⚠️  WARNING: DATABASE_URL uses localhost in production!');
    logger.error('   This will NOT work. Update DATABASE_URL with your production database hostname.');
    logger.error('   See NEON_SETUP.md for Neon setup or DATABASE_SETUP.md for other providers.');
  }
  
  if (dbUrl.includes('neon.tech')) {
    logger.info('✅ Using Neon database (pooler connection)');
  }
  
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`Health check: http://localhost:${PORT}/health`);
  } else {
    logger.info(`Health check: https://ldf-back-1.onrender.com/health`);
  }
});
