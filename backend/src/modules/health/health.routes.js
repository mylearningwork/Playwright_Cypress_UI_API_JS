import { Router } from 'express';
import { env } from '../../config/env.js';
import { checkDatabaseHealth } from '../../db/pool.js';
import { checkRedisHealth } from '../../infra/redis.js';

export const healthRouter = Router();

healthRouter.get('/live', (_req, res) => {
  res.json({ status: 'ok', probe: 'live', timestamp: new Date().toISOString() });
});

healthRouter.get('/ready', async (_req, res) => {
  const checks = { repository: env.USE_IN_MEMORY ? 'memory' : 'postgres' };

  try {
    if (env.USE_IN_MEMORY) {
      checks.database = 'skipped';
    } else {
      checks.database = (await checkDatabaseHealth()) ? 'up' : 'down';
    }
    checks.redis = (await checkRedisHealth()) ? 'up' : 'down';
  } catch {
    checks.database = 'down';
    checks.redis = 'down';
  }

  const dbReady = env.USE_IN_MEMORY || checks.database === 'up';
  const redisReady = checks.redis === 'up';
  const ready = dbReady && redisReady;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not-ready', checks, timestamp: new Date().toISOString() });
});

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'backend-heavy-js-training-project',
    version: 'v1',
    repository: env.USE_IN_MEMORY ? 'memory' : 'postgres',
    timestamp: new Date().toISOString()
  });
});
