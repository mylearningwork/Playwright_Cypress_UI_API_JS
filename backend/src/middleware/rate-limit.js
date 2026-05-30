import { env } from '../config/env.js';

const buckets = new Map();

export function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip ?? 'unknown';
  const bucket = buckets.get(key) ?? { count: 0, resetAt: now + env.RATE_LIMIT_WINDOW_MS };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + env.RATE_LIMIT_WINDOW_MS;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  res.setHeader('x-rate-limit-limit', env.RATE_LIMIT_MAX);
  res.setHeader('x-rate-limit-remaining', Math.max(env.RATE_LIMIT_MAX - bucket.count, 0));
  res.setHeader('x-rate-limit-reset', new Date(bucket.resetAt).toISOString());

  if (bucket.count > env.RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        requestId: req.id
      }
    });
  }

  next();
}
