import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(24).default('local-development-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  JSONPLACEHOLDER_BASE_URL: z.string().url().default('https://jsonplaceholder.typicode.com'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_URL: z.string().optional(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  REDIS_URL: z.string().optional(),
  USE_IN_MEMORY: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  RELAY_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  OUTBOX_QUEUE_NAME: z.string().default('domain-events'),
  QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(5),
  API_BASE_URL: z.string().url().default('http://localhost:4000')
});

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  USE_IN_MEMORY:
    parsed.USE_IN_MEMORY === true ||
    parsed.USE_IN_MEMORY === 'true' ||
    parsed.NODE_ENV === 'test' ||
    !parsed.DATABASE_URL
};
