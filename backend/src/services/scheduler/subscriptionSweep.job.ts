import cron from 'node-cron';
import { knexInstance } from '../../config/db.js';

/**
 * Midnight Sweep (00:00 daily): deactivate expired subscriptions.
 * - subscription_expires_at < NOW()
 * - subscription_active = true
 * Sets subscription_active = false
 */
export function startSubscriptionSweepCron(): void {
  // Run at midnight server time.
  cron.schedule('0 0 * * *', async () => {
    try {
      const expired = await knexInstance('users')
        .whereNotNull('subscription_expires_at')
        .andWhere('subscription_expires_at', '<', knexInstance.fn.now())
        .andWhere('subscription_active', true)
        .select('id');

      const ids = (expired as { id: string }[]).map((r) => r.id);
      const result =
        ids.length > 0
          ? await knexInstance('users').whereIn('id', ids).update({ subscription_active: false })
          : 0;

      if (ids.length > 0) {
        // Notify users once (best-effort; de-dupe for last 24h).
        for (const userId of ids) {
          const existing = await knexInstance('notifications')
            .where({ user_id: userId, type: 'SUBSCRIPTION_EXPIRED' })
            .andWhere('created_at', '>=', knexInstance.raw("NOW() - INTERVAL '24 hours'"))
            .first('id');
          if (existing) continue;
          await knexInstance('notifications').insert({
            user_id: userId,
            type: 'SUBSCRIPTION_EXPIRED',
            title: 'Account expired',
            body: 'Account Expired! You are no longer earning commissions.',
            message: 'Account Expired! You are no longer earning commissions.',
            payload: {},
          });
        }
      }

      console.log(`[SubscriptionSweep] Deactivated ${Number(result || 0)} expired users`);
    } catch (err) {
      console.error('[SubscriptionSweep] Failed:', err);
    }
  });
}

