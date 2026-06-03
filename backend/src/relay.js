import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { closePool } from './db/pool.js';
import { closeQueue, publishOutboxEvent, isQueueEnabled } from './infra/queue.js';
import { closeRedis } from './infra/redis.js';
import { getRepository } from './repositories/index.js';

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRelay() {
  if (!isQueueEnabled()) {
    logger.warn('REDIS_URL not set — relay requires Redis/BullMQ. Exiting.');
    process.exit(0);
  }

  logger.info({ queue: env.OUTBOX_QUEUE_NAME }, 'Outbox relay started');
  const repo = await getRepository();

  while (true) {
    try {
      const batch = await repo.claimOutboxForRelay(10);

      for (const event of batch) {
        try {
          await publishOutboxEvent(event);
          await repo.markOutboxQueued(event.id);
          logger.info({ eventId: event.id, eventType: event.eventType }, 'Relayed outbox event to queue');
        } catch (error) {
          await repo.markOutboxRelayFailed(event.id, error.message);
          logger.error({ err: error, eventId: event.id }, 'Failed to relay outbox event');
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Relay loop error');
    }

    await sleep(env.RELAY_POLL_INTERVAL_MS);
  }
}

runRelay().catch(async (error) => {
  logger.error({ err: error }, 'Relay crashed');
  await closeQueue();
  await closeRedis();
  if (!env.USE_IN_MEMORY) await closePool();
  process.exit(1);
});
