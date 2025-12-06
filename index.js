import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import activationRoutes from './routes/activation.js';
import withdrawalRoutes from './routes/withdrawal.js';
import webhookRoutes from './routes/webhook.js';
import agentRoutes from './routes/agent.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  Auth: http://localhost:${PORT}/api/auth/*`);
  console.log(`  Activation: http://localhost:${PORT}/api/activate`);
  console.log(`  Withdrawal: http://localhost:${PORT}/api/withdraw/*`);
  console.log(`  Webhooks: http://localhost:${PORT}/api/webhooks/*`);
  console.log(`  Agent: http://localhost:${PORT}/api/agent/*`);
  console.log(`  Admin: http://localhost:${PORT}/api/admin/*`);
});
