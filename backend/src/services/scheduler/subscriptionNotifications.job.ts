import cron from 'node-cron';
import { knexInstance } from '../../config/db.js';

/**
 * Daily warning sweep: notify users when subscription expires soon.
 * - 3 days remaining: Yellow alert
 * - 0 days remaining: Red alert (expired)
 *
 * Best-effort; commission guard is the source of truth.
 */
export function startSubscriptionNotificationCron(): void {
  // Run daily at 08:00 server time (avoid midnight contention with sweep).
  cron.schedule('0 8 * * *', async () => {
    try {
      const users = await knexInstance('users')
        .whereNotNull('subscription_expires_at')
        .andWhere('subscription_active', true)
        .select('id', 'subscription_expires_at');

      for (const u of users as any[]) {
        const uid = String(u.id);
        const exp = u.subscription_expires_at ? new Date(String(u.subscription_expires_at)) : null;
        if (!exp) continue;
        const days = Math.ceil((exp.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        if (days !== 3 && days !== 0) continue;

        const type = days === 3 ? 'SUBSCRIPTION_WARNING' : 'SUBSCRIPTION_EXPIRED';
        const existing = await knexInstance('notifications')
          .where({ user_id: uid, type })
          .andWhere('created_at', '>=', knexInstance.raw("NOW() - INTERVAL '24 hours'"))
          .first('id');
        if (existing) continue;

        if (days === 3) {
          await knexInstance('notifications').insert({
            user_id: uid,
            type,
            title: 'Renewal due soon',
            body: 'Warning: Your subscription expires in 3 days. Renew now to avoid losing commissions.',
            message: 'Warning: Your subscription expires in 3 days. Renew now to avoid losing commissions.',
            payload: { daysRemaining: 3 },
          });
        } else {
          await knexInstance('notifications').insert({
            user_id: uid,
            type,
            title: 'Account expired',
            body: 'Account Expired! You are no longer earning commissions.',
            message: 'Account Expired! You are no longer earning commissions.',
            payload: { daysRemaining: 0 },
          });
        }
      }
    } catch (err) {
      console.error('[SubscriptionNotify] Failed:', err);
    }
  });
}
