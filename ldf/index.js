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
import { connect, testConnection } from './utils/db.js';

dotenv.config();

validateEnv();

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);

const corsOptions = {
  origin: function (origin, callback) {
    const localhostOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
    ];
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://ldf-projecct.vercel.app',
      'https://www.ldf-projecct.vercel.app',
      ...localhostOrigins,
    ].filter(Boolean);
    
    const normalizeOrigin = (orig) => orig ? orig.replace(/\/$/, '').toLowerCase() : null;
    const normalizedOrigin = normalizeOrigin(origin);
    
    if (!origin || !normalizedOrigin) {
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = normalizeOrigin(allowed);
      return normalizedOrigin === normalizedAllowed || 
             normalizedOrigin === allowed.toLowerCase() ||
             normalizedOrigin.includes('ldf-projecct.vercel.app');
    });
    
    const isVercelDomain = normalizedOrigin.includes('.vercel.app') || 
                          normalizedOrigin.includes('vercel.app');
    
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
      callback(null, true);
    } else {
      if (isProduction) {
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

app.use(cors(corsOptions));

app.use('/api/webhooks/payment', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/seerbit', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login attempts, please try again later.',
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/activate', activationRoutes);
app.use('/api/withdraw', withdrawalRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  const dbUrl = process.env.DATABASE_URL || '';
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const isMongoAtlas = dbUrl.includes('mongodb.net') || dbUrl.includes('mongodb+srv');
  
  if (isProduction && isLocalhost) {
    health.database = 'misconfigured';
    health.databaseError = 'DATABASE_URL uses localhost - this will not work in production.';
    health.status = 'error';
  } else {
    try {
      const connectionResult = await testConnection();
      if (connectionResult.connected) {
        health.database = 'connected';
      } else {
        health.database = 'disconnected';
        health.databaseError = connectionResult.error || 'Database connection failed';
        health.status = 'degraded';
      }
    } catch (error) {
      health.database = 'disconnected';
      health.databaseError = process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Database connection failed.';
      health.status = 'degraded';
    }
  }

  health.env = {
    hasJWTSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasFrontendUrl: !!process.env.FRONTEND_URL,
    databaseProvider: isMongoAtlas ? 'MongoDB Atlas' : isLocalhost ? 'Local MongoDB' : 'MongoDB',
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

async function startServer() {
  try {
    await connect();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      const dbUrl = process.env.DATABASE_URL || '';
      const isProduction = process.env.NODE_ENV === 'production';
      const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
      
      if (isProduction && isLocalhost) {
        logger.error('WARNING: DATABASE_URL uses localhost in production!');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
