import 'dotenv/config';
import express from 'express';
import { env, getAllowedOrigins } from './config/env.js';
import authRoutes from './routes/admin/auth.routes.js';
import dashboardRoutes from './routes/admin/dashboard.routes.js';
import usersRoutes from './routes/admin/users.routes.js';
import payoutsRoutes from './routes/admin/payouts.routes.js';
import schedulerRoutes from './routes/admin/scheduler.routes.js';
import couponsRoutes from './routes/admin/coupons.routes.js';
import matrixRoutes from './routes/admin/matrix.routes.js';
import auditLogsRoutes from './routes/admin/auditLogs.routes.js';
import memberAuthRoutes from './routes/member/auth.routes.js';
import memberProfileRoutes from './routes/member/profile.routes.js';
import memberActivationRoutes from './routes/member/activation.routes.js';
import memberNotificationsRoutes from './routes/member/notifications.routes.js';
import memberEarningsRoutes from './routes/member/earnings.routes.js';
import memberWithdrawalsRoutes from './routes/member/withdrawals.routes.js';
import memberInvestmentsRoutes from './routes/member/investments.routes.js';
import memberCouponsRoutes from './routes/member/coupons.routes.js';
import memberMatrixRoutes from './routes/member/matrix.routes.js';
import memberMasterclassRoutes from './routes/member/masterclass.routes.js';
import memberWebhooksRoutes from './routes/member/webhooks.routes.js';
import memberWalletRoutes from './routes/member/wallet.routes.js';
import memberAdsenseRoutes from './routes/member/adsense.routes.js';
import memberSubscriptionRoutes from './routes/member/subscription.routes.js';
import { adminSecurity } from './middleware/adminSecurity.js';
import { startSubscriptionSweepCron } from './services/scheduler/subscriptionSweep.job.js';
import { startSubscriptionNotificationCron } from './services/scheduler/subscriptionNotifications.job.js';

const app = express();

const allowedOrigins = getAllowedOrigins();
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Signature');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
app.options('*', (_, res) => res.sendStatus(204));

app.use((req, _res, next) => {
  if (req.originalUrl === '/api/member/webhooks/paystack' && req.method === 'POST') {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.concat(chunks);
      next();
    });
    return;
  }
  next();
});

app.use(express.json());

app.use('/api/admin', adminSecurity);
app.use('/api/admin/auth', authRoutes);
app.use('/api/member/auth', memberAuthRoutes);
app.use('/api/member/profile', memberProfileRoutes);
app.use('/api/member/activation', memberActivationRoutes);
app.use('/api/member/notifications', memberNotificationsRoutes);
app.use('/api/member/earnings', memberEarningsRoutes);
app.use('/api/member/withdrawals', memberWithdrawalsRoutes);
app.use('/api/member/investments', memberInvestmentsRoutes);
app.use('/api/member/coupons', memberCouponsRoutes);
app.use('/api/member/matrix', memberMatrixRoutes);
app.use('/api/member/masterclass', memberMasterclassRoutes);
app.use('/api/member/webhooks', memberWebhooksRoutes);
app.use('/api/member/wallet', memberWalletRoutes);
app.use('/api/member/adsense', memberAdsenseRoutes);
app.use('/api/member/subscription', memberSubscriptionRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/admin/payouts', payoutsRoutes);
app.use('/api/admin/scheduler', schedulerRoutes);
app.use('/api/admin/coupons', couponsRoutes);
app.use('/api/admin/matrix', matrixRoutes);
app.use('/api/admin/audit-logs', auditLogsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  startSubscriptionSweepCron();
  startSubscriptionNotificationCron();
  app.listen(env.PORT, () => {
    console.log(`LDF API listening on port ${env.PORT}`);
  });
}
