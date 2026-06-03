import { getRedis } from '../infra/redis.js';

export function idempotency(req, res, next) {
  if (!['POST', 'PATCH', 'PUT'].includes(req.method)) return next();

  const key = req.headers['idempotency-key'];
  if (!key) return next();

  const cacheKey = `idempotency:${req.method}:${req.originalUrl}:${key}`;

  getRedis()
    .then(async (redis) => {
      const previous = await redis.get(cacheKey);
      if (previous) {
        const parsed = JSON.parse(previous);
        res.setHeader('x-idempotent-replay', 'true');
        return res.status(parsed.statusCode).json(parsed.body);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.set(cacheKey, JSON.stringify({ statusCode: res.statusCode, body }), 86_400).catch(() => {});
        }
        return originalJson(body);
      };
      next();
    })
    .catch(next);
}
