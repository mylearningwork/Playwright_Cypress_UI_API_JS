import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const QUEUE_NAME = env.OUTBOX_QUEUE_NAME;
let queueInstance;
let queueConnection;

export function isQueueEnabled() {
  return Boolean(env.REDIS_URL);
}

export async function getQueueConnection() {
  if (!isQueueEnabled()) return null;
  if (!queueConnection) {
    const { default: Redis } = await import('ioredis');
    queueConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    queueConnection.on('error', (error) => logger.error({ err: error }, 'BullMQ Redis connection error'));
  }
  return queueConnection;
}

export async function getOutboxQueue() {
  if (!isQueueEnabled()) return null;
  if (!queueInstance) {
    const { Queue } = await import('bullmq');
    const connection = await getQueueConnection();
    queueInstance = new Queue(QUEUE_NAME, { connection });
  }
  return queueInstance;
}

export async function publishOutboxEvent(event) {
  const queue = await getOutboxQueue();
  if (!queue) throw new Error('Queue is not configured');

  await queue.add(
    event.eventType,
    {
      id: event.id,
      tenantId: event.tenantId,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload
    },
    {
      jobId: event.id,
      removeOnComplete: 1000,
      removeOnFail: 5000,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 }
    }
  );
}

export async function createOutboxWorker(processor) {
  if (!isQueueEnabled()) return null;

  const { Worker } = await import('bullmq');
  const { default: Redis } = await import('ioredis');
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  const worker = new Worker(QUEUE_NAME, processor, {
    connection,
    concurrency: env.QUEUE_CONCURRENCY
  });

  worker.on('failed', (job, error) => {
    logger.error({ err: error, jobId: job?.id, eventType: job?.data?.eventType }, 'Queue job failed');
  });

  return worker;
}

export async function closeQueue() {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = undefined;
  }
  if (queueConnection) {
    await queueConnection.quit();
    queueConnection = undefined;
  }
}

export async function getQueueStats() {
  const queue = await getOutboxQueue();
  if (!queue) return { enabled: false };

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);

  return { enabled: true, name: QUEUE_NAME, waiting, active, completed, failed, delayed };
}
