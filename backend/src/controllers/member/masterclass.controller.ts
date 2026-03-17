import type { Request, Response } from 'express';
import { knexInstance } from '../../config/db.js';

export async function getModules(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;

  const modules = await knexInstance('masterclass_modules as m')
    .leftJoin('masterclass_progress as p', function () {
      this.on('p.module_id', '=', 'm.id').andOn('p.user_id', '=', knexInstance.raw('?', [id]));
    })
    .where('m.status', 'active')
    .select(
      'm.id as moduleId',
      'm.title',
      'm.description',
      'm.video_url as videoUrl',
      'm.order_index as orderIndex',
      'p.completion_pct as completionPct',
      'p.completed_at as completedAt'
    )
    .orderBy('m.order_index', 'asc');

  const data = modules.map((r: Record<string, unknown>) => ({
    moduleId: r.moduleId,
    title: r.title,
    description: r.description,
    videoUrl: r.videoUrl,
    orderIndex: r.orderIndex,
    completionPct: r.completionPct ?? 0,
    completedAt: r.completedAt ?? null,
  }));

  res.json({ data });
}

export async function updateProgress(req: Request, res: Response): Promise<void> {
  const id = req.member!.id;
  const moduleId = req.params.moduleId;
  const { completionPct } = req.body as { completionPct: number };

  const moduleRow = await knexInstance('masterclass_modules').where({ id: moduleId, status: 'active' }).first();
  if (!moduleRow) {
    res.status(404).json({ error: 'Module not found' });
    return;
  }

  const existing = await knexInstance('masterclass_progress').where({ user_id: id, module_id: moduleId }).first('completion_pct', 'completed_at');
  const currentPct = existing ? Number((existing as { completion_pct: number }).completion_pct) : 0;
  if (completionPct < currentPct) {
    res.status(400).json({ error: 'Completion percentage cannot decrease' });
    return;
  }

  const completedAt = completionPct >= 100 ? knexInstance.fn.now() : null;
  if (existing) {
    await knexInstance('masterclass_progress')
      .where({ user_id: id, module_id: moduleId })
      .update({
        completion_pct: Math.min(100, completionPct),
        last_activity: knexInstance.fn.now(),
        ...(completedAt && { completed_at: completedAt }),
      });
  } else {
    await knexInstance('masterclass_progress').insert({
      user_id: id,
      module_id: moduleId,
      completion_pct: Math.min(100, completionPct),
      ...(completedAt && { completed_at: knexInstance.fn.now() }),
    });
  }

  const updated = await knexInstance('masterclass_progress').where({ user_id: id, module_id: moduleId }).first('completion_pct', 'completed_at');
  res.json({
    completionPct: Number((updated as { completion_pct: number })?.completion_pct ?? completionPct),
    completedAt: (updated as { completed_at: string | null })?.completed_at ?? null,
  });
}
