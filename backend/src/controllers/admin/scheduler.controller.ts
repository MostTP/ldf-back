import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';
import { getRedis } from '../../config/redis.js';
import { writeAuditLog } from '../../services/auditLog.service.js';
import { runGlobalPoolDistribution } from '../../services/scheduler/globalPool.job.js';
import { runPremiumROIDistribution } from '../../services/scheduler/premiumROI.job.js';

const LOCK_KEY_PREFIX = 'scheduler:running:';
const LOCK_TTL_SECONDS = 3600;

export async function trigger(req: Request, res: Response): Promise<void> {
  const { jobType } = req.body as { jobType: 'GLOBAL_POOL_DISTRIBUTION' | 'PREMIUM_ROI_DISTRIBUTION' };
  const adminId = req.admin!.id;
  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  const redis = getRedis();
  const lockKey = LOCK_KEY_PREFIX + jobType;
  if (redis) {
    const exists = await redis.exists(lockKey);
    if (exists) {
      res.status(409).json({ error: 'Job already running' });
      return;
    }
  }

  const [logRow] = await knexInstance('scheduler_logs')
    .insert({
      job_type: jobType,
      triggered_by: 'manual',
      admin_id: adminId,
      status: 'running',
    })
    .returning('id');

  const schedulerLogId = (logRow as { id: string }).id;

  if (redis) {
    await redis.setex(lockKey, LOCK_TTL_SECONDS, '1');
  }

  await knexInstance.transaction(async (trx) => {
    await writeAuditLog(
      {
        adminId,
        actionType: 'TRIGGER_SCHEDULER',
        targetEntity: 'scheduler_logs',
        targetId: schedulerLogId,
        payloadSnapshot: { jobType },
        ipAddress,
      },
      trx
    );
  });

  if (jobType === 'GLOBAL_POOL_DISTRIBUTION') {
    runGlobalPoolDistribution(schedulerLogId).catch((e) => console.error('[Scheduler]', e));
  } else {
    runPremiumROIDistribution(schedulerLogId).catch((e) => console.error('[Scheduler]', e));
  }

  res.status(202).json({ message: 'Job triggered', schedulerLogId });
}
