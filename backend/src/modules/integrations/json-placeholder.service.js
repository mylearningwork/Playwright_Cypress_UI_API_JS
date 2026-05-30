import { env } from '../../config/env.js';
import { fetchJson } from '../../shared/http-client.js';
import { TtlCache } from '../../shared/ttl-cache.js';

const cache = new TtlCache(120000);

export async function getExternalUser(userId) {
  const key = `jsonplaceholder:user:${userId}`;
  const cached = cache.get(key);
  if (cached) return { source: 'cache', data: cached };

  const data = await fetchJson(`${env.JSONPLACEHOLDER_BASE_URL}/users/${userId}`);
  cache.set(key, data);
  return { source: 'network', data };
}

export async function getExternalUserPosts(userId) {
  const key = `jsonplaceholder:user-posts:${userId}`;
  const cached = cache.get(key);
  if (cached) return { source: 'cache', data: cached };

  const data = await fetchJson(`${env.JSONPLACEHOLDER_BASE_URL}/users/${userId}/posts`);
  cache.set(key, data);
  return { source: 'network', data };
}

export function cacheStats() {
  return { entries: cache.size() };
}
