import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { closePool } from './db/pool.js';
import { closeRedis } from './infra/redis.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      repository: env.USE_IN_MEMORY ? 'memory' : 'postgres',
      redis: env.REDIS_URL ? 'enabled' : 'memory-fallback'
    },
    'backend API listening'
  );
});

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await closeRedis();
    if (!env.USE_IN_MEMORY) await closePool();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
