import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenant.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { getRepository } from '../../repositories/index.js';
import { getQueueStats } from '../../infra/queue.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('admin'), tenantContext);

adminRouter.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const repo = await getRepository();
    const counts = await repo.getMetrics(req.tenantId);
    const queue = await getQueueStats();
    res.json({
      ...counts,
      queue,
      uptimeSeconds: Math.round(process.uptime()),
      repository: repo.mode
    });
  })
);

adminRouter.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const repo = await getRepository();
    res.json(await repo.listAuditLogs(req.tenantId, 100));
  })
);
