import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const orderOperationsTotal = new client.Counter({
  name: 'order_operations_total',
  help: 'Order lifecycle operations',
  labelNames: ['operation', 'status']
});

export const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Integration cache hits',
  labelNames: ['source']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(orderOperationsTotal);
register.registerMetric(cacheHitsTotal);

export { register };

export function metricsMiddleware() {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
      const labels = { method: req.method, route, status_code: String(res.statusCode) };
      httpRequestsTotal.inc(labels);
      const duration = Number(process.hrtime.bigint() - start) / 1e9;
      httpRequestDuration.observe(labels, duration);
    });
    next();
  };
}
