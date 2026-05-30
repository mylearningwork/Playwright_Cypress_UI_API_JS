const cache = new Map();

export function idempotency(req, res, next) {
  if (!['POST', 'PATCH', 'PUT'].includes(req.method)) return next();

  const key = req.headers['idempotency-key'];
  if (!key) return next();

  const cacheKey = `${req.method}:${req.originalUrl}:${key}`;
  const previous = cache.get(cacheKey);
  if (previous) {
    res.setHeader('x-idempotent-replay', 'true');
    return res.status(previous.statusCode).json(previous.body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(cacheKey, { statusCode: res.statusCode, body });
    }
    return originalJson(body);
  };

  next();
}
