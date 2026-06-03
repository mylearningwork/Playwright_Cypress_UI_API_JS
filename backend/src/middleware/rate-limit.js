import { env } from '../config/env.js';
import { getRedis } from '../infra/redis.js';

const loginMemory = new Map();

export function rateLimit(req, res, next) {
  const isLogin = req.method === 'POST' && req.path === '/login' && req.baseUrl.includes('/auth');
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const max = isLogin ? env.LOGIN_RATE_LIMIT_MAX : env.RATE_LIMIT_MAX;
  const key = isLogin ? `login:${req.ip}` : `rate:${req.ip}`;

  getRedis()
    .then(async (redis) => {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, Math.ceil(windowMs / 1000));

      res.setHeader('x-ratelimit-limit', String(max));
      res.setHeader('x-ratelimit-remaining', String(Math.max(max - count, 0)));

      if (count > max) {
        return res.status(429).json({
          type: `${env.API_BASE_URL}/problems/rate-limit`,
          title: 'Too Many Requests',
          status: 429,
          detail: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
      next();
    })
    .catch(() => {
      const now = Date.now();
      const bucket = loginMemory.get(key) ?? { count: 0, resetAt: now + windowMs };
      if (now > bucket.resetAt) {
        bucket.count = 0;
        bucket.resetAt = now + windowMs;
      }
      bucket.count += 1;
      loginMemory.set(key, bucket);
      if (bucket.count > max) {
        return res.status(429).json({ code: 'RATE_LIMIT_EXCEEDED', detail: 'Rate limit exceeded' });
      }
      next();
    });
}
