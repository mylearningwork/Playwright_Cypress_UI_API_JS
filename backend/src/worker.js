import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { closePool } from './db/pool.js';
import { closeQueue, createOutboxWorker, isQueueEnabled } from './infra/queue.js';
import { closeRedis } from './infra/redis.js';
import { getRepository } from './repositories/index.js';
import { processOutboxEvent } from './shared/process-outbox-event.js';

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLegacyWorker() {
  logger.info('Legacy outbox worker started (direct DB polling — no queue)');
  const repo = await getRepository();

  while (true) {
    try {
      const batch = await repo.claimOutboxForProcessing(10);
      for (const event of batch) {
        try {
          await processOutboxEvent(event);
          await repo.markOutboxProcessed(event.id);
        } catch (error) {
          await repo.markOutboxFailed(event.id, error.message);
          logger.error({ err: error, eventId: event.id }, 'Outbox processing failed');
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Worker loop error');
    }

    await sleep(env.WORKER_POLL_INTERVAL_MS);
  }
}

async function runQueueWorker() {
  logger.info({ queue: env.OUTBOX_QUEUE_NAME, concurrency: env.QUEUE_CONCURRENCY }, 'BullMQ worker started');
  const repo = await getRepository();

  const worker = await createOutboxWorker(async (job) => {
    const event = job.data;
    logger.info({ jobId: job.id, eventType: event.eventType }, 'Consuming queue job');
    await processOutboxEvent(event);
    await repo.markOutboxProcessed(event.id);
  });

  worker.on('failed', async (job, error) => {
    if (!job) return;
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      await repo.markOutboxFailed(job.data.id, error.message);
    }
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Worker shutting down');
    await worker.close();
    await closeQueue();
    await closeRedis();
    if (!env.USE_IN_MEMORY) await closePool();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

async function start() {
  if (isQueueEnabled()) {
    await runQueueWorker();
  } else {
    await runLegacyWorker();
  }
}

start().catch(async (error) => {
  logger.error({ err: error }, 'Worker crashed');
  await closeQueue();
  await closeRedis();
  if (!env.USE_IN_MEMORY) await closePool();
  process.exit(1);
});
