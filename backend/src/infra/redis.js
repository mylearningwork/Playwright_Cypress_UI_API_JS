import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const memoryFallback = new Map();

function memoryGet(key) {
  const entry = memoryFallback.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryFallback.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key, value, ttlSeconds) {
  memoryFallback.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
  });
}

function createMemoryClient() {
  return {
    mode: 'memory',
    async get(key) {
      return memoryGet(key);
    },
    async set(key, value, ttlSeconds) {
      memorySet(key, value, ttlSeconds);
    },
    async del(key) {
      memoryFallback.delete(key);
    },
    async incr(key) {
      const current = Number(memoryGet(key) ?? 0) + 1;
      memorySet(key, String(current));
      return current;
    },
    async expire(key, ttlSeconds) {
      const value = memoryGet(key);
      if (value !== null) memorySet(key, value, ttlSeconds);
    },
    async ping() {
      return 'PONG';
    }
  };
}

let client;

export async function getRedis() {
  if (client) return client;

  if (!env.REDIS_URL) {
    client = createMemoryClient();
    return client;
  }

  const { default: Redis } = await import('ioredis');
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true
  });
  redis.on('error', (error) => logger.error({ err: error }, 'Redis error'));
  await redis.connect();

  client = {
    mode: 'redis',
    async get(key) {
      return redis.get(key);
    },
    async set(key, value, ttlSeconds) {
      if (ttlSeconds) await redis.set(key, value, 'EX', ttlSeconds);
      else await redis.set(key, value);
    },
    async del(key) {
      await redis.del(key);
    },
    async incr(key) {
      return redis.incr(key);
    },
    async expire(key, ttlSeconds) {
      await redis.expire(key, ttlSeconds);
    },
    async ping() {
      return redis.ping();
    },
    quit: () => redis.quit()
  };

  return client;
}

export async function checkRedisHealth() {
  const redis = await getRedis();
  const pong = await redis.ping();
  return pong === 'PONG';
}

export async function closeRedis() {
  if (client?.quit) {
    await client.quit();
    client = undefined;
  } else {
    client = undefined;
  }
}
