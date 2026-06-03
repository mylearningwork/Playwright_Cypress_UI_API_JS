import { env } from '../../config/env.js';
import { cacheHitsTotal } from '../../infra/metrics.js';
import { getRedis } from '../../infra/redis.js';
import { CircuitBreaker } from '../../shared/circuit-breaker.js';
import { fetchJson } from '../../shared/http-client.js';

const breaker = new CircuitBreaker({ name: 'jsonplaceholder', failureThreshold: 3, resetTimeoutMs: 15_000 });

async function getCached(key) {
  const redis = await getRedis();
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

async function setCached(key, data, ttlSeconds = 120) {
  const redis = await getRedis();
  await redis.set(key, JSON.stringify(data), ttlSeconds);
}

export async function getExternalUser(userId) {
  const key = `jsonplaceholder:user:${userId}`;
  const cached = await getCached(key);
  if (cached) {
    cacheHitsTotal.inc({ source: 'cache' });
    return { source: 'cache', data: cached, circuitBreaker: breaker.snapshot() };
  }

  const data = await breaker.execute(() => fetchJson(`${env.JSONPLACEHOLDER_BASE_URL}/users/${userId}`));
  await setCached(key, data);
  cacheHitsTotal.inc({ source: 'network' });
  return { source: 'network', data, circuitBreaker: breaker.snapshot() };
}

export async function getExternalUserPosts(userId) {
  const key = `jsonplaceholder:user-posts:${userId}`;
  const cached = await getCached(key);
  if (cached) {
    cacheHitsTotal.inc({ source: 'cache' });
    return { source: 'cache', data: cached, circuitBreaker: breaker.snapshot() };
  }

  const data = await breaker.execute(() => fetchJson(`${env.JSONPLACEHOLDER_BASE_URL}/users/${userId}/posts`));
  await setCached(key, data);
  cacheHitsTotal.inc({ source: 'network' });
  return { source: 'network', data, circuitBreaker: breaker.snapshot() };
}

export async function cacheStats() {
  return { backend: (await getRedis()).mode ?? 'memory', circuitBreaker: breaker.snapshot() };
}
