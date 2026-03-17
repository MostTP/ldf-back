import { knexInstance } from '../../config/db.js';
import { getRedis } from '../../config/redis.js';

const LOCK_KEY = 'scheduler:running:GLOBAL_POOL_DISTRIBUTION';

export async function runGlobalPoolDistribution(logId: string): Promise<void> {
  const redis = getRedis();
  try {
    await knexInstance('scheduler_logs').where({ id: logId }).update({
      status: 'success',
      total_distributed: 0,
      member_count: 0,
      completed_at: knexInstance.fn.now(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await knexInstance('scheduler_logs').where({ id: logId }).update({
      status: 'failed',
      error_message: msg,
      completed_at: knexInstance.fn.now(),
    });
  } finally {
    if (redis) await redis.del(LOCK_KEY);
  }
}
